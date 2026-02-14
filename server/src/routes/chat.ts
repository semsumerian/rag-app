import { Router } from 'express';
import { generateEmbedding } from '../services/embedding';
import { searchSimilar } from '../services/vectorStore';
import { generateChatResponse } from '../services/llm';
import { ChatRequest } from '../types';

const router = Router();

// Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { message, history = [] }: ChatRequest = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log(`Chat request: ${message}`);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(message);
    
    // Search for similar chunks
    const similarChunks = await searchSimilar(queryEmbedding, 5);
    console.log(`Found ${similarChunks.length} similar chunks`);
    
    // Prepare sources
    const sources = similarChunks.map(chunk => ({
      filename: chunk.filename,
      content: chunk.content,
      relevance: 1 - (chunk.distance || 0)
    }));
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send sources first
    res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);
    
    // Stream the response
    const stream = generateChatResponse(message, sources, history);
    
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
    }
    
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('Chat error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate response' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`);
      res.end();
    }
  }
});

export default router;
