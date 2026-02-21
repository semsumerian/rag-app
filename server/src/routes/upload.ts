import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { config } from '../config';
import { parseDocument } from '../services/documentProcessor';
import { chunkText } from '../services/chunking';
import { generateEmbeddingsBatch } from '../services/embedding';
import { addChunks, deleteDocumentChunks } from '../services/vectorStore';
import { addDocument } from '../services/documentStore';
import { Chunk, Document } from '../types';

const router = Router();

function normalizeOriginalName(originalName: string): string {
  if (/[А-Яа-яЁё]/.test(originalName)) {
    return originalName;
  }

  if (!/[ÐÑ]/.test(originalName)) {
    return originalName;
  }

  try {
    const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
    return decoded.includes('�') ? originalName : decoded;
  } catch {
    return originalName;
  }
}

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(config.server.uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}
ensureUploadDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.server.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isAllowedByMimeType = allowedMimeTypes.includes(file.mimetype);
    const isAllowedByExtension = allowedExtensions.includes(fileExtension);

    if (isAllowedByMimeType || (file.mimetype === 'application/octet-stream' && isAllowedByExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported. Only PDF, DOC, DOCX, and TXT files are allowed.`));
    }
  }
});

// Upload endpoint
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const documentId = uuidv4();
    const { filename, originalname, mimetype, size } = req.file;
    const originalName = normalizeOriginalName(originalname);
    const filePath = path.join(config.server.uploadDir, filename);

    console.log(`Processing file: ${originalName} (${mimetype})`);

    // Parse document
    const text = await parseDocument(filePath, mimetype, originalName);
    console.log(`Parsed ${text.length} characters`);

    // Chunk text
    const chunks = chunkText(text, documentId, originalName);
    console.log(`Created ${chunks.length} chunks`);

    // Generate embeddings
    const texts = chunks.map(c => c.content);
    const embeddings = await generateEmbeddingsBatch(texts);
    console.log(`Generated ${embeddings.length} embeddings`);

    // Prepare chunks with embeddings
    const chunksWithEmbeddings: Chunk[] = chunks.map((chunk, index) => ({
        id: uuidv4(),
        documentId,
        content: chunk.content,
        embedding: embeddings[index],
        metadata: {
          filename: originalName,
          chunkIndex: chunk.metadata.chunkIndex,
          totalChunks: chunk.metadata.totalChunks
        }
      }));

    // Add to vector store
    await addChunks(chunksWithEmbeddings);
    console.log('Added chunks to vector store');

    // Create document metadata
    const document: Document = {
      id: documentId,
      filename,
      originalName,
      mimeType: mimetype,
      size,
      uploadedAt: new Date(),
      chunks: chunks.length
    };

    // Save document metadata
    await addDocument({
      id: documentId,
      filename,
      originalName,
      mimeType: mimetype,
      size,
      uploadedAt: new Date().toISOString(),
      chunks: chunks.length
    });
    console.log('Document metadata saved');

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process file' 
    });
  }
});

export default router;
