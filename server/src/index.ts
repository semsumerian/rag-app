import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initVectorStore } from './services/vectorStore';
import { initDocumentStore } from './services/documentStore';
import uploadRoutes from './routes/upload';
import documentRoutes from './routes/documents';
import chatRoutes from './routes/chat';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    // Initialize stores
    await initVectorStore();
    console.log('Vector store initialized');
    
    await initDocumentStore();
    console.log('Document store initialized');
    
    app.listen(config.server.port, () => {
      console.log(`Server running on http://localhost:${config.server.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
