import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { deleteDocumentChunks } from '../services/vectorStore';
import { getAllDocuments, deleteDocument as deleteDocumentMeta } from '../services/documentStore';

const router = Router();

// Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await getAllDocuments();
    
    res.json(documents.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      originalName: doc.originalName,
      size: doc.size,
      uploadedAt: doc.uploadedAt
    })));
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete from vector store
    await deleteDocumentChunks(id);
    
    // Delete document metadata
    await deleteDocumentMeta(id);
    
    // Find and delete file
    const files = await fs.readdir(config.server.uploadDir);
    const matchingFile = files.find(f => f.startsWith(id));
    
    if (matchingFile) {
      await fs.unlink(path.join(config.server.uploadDir, matchingFile));
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
