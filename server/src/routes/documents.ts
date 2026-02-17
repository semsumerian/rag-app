import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { deleteDocumentChunks } from '../services/vectorStore';
import { getAllDocuments, getDocument, deleteDocument as deleteDocumentMeta } from '../services/documentStore';

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
    const document = await getDocument(id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Delete from vector store
    await deleteDocumentChunks(id);
    
    // Delete document metadata
    await deleteDocumentMeta(id);
    
    // Delete uploaded file by exact filename from metadata
    try {
      await fs.unlink(path.join(config.server.uploadDir, document.filename));
    } catch (fileError) {
      const error = fileError as NodeJS.ErrnoException;
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
