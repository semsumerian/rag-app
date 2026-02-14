import { encodingForModel } from 'js-tiktoken';
import { config } from '../config';

const encoder = encodingForModel('gpt-4');

export function chunkText(text: string, documentId: string, filename: string): Array<{ content: string; metadata: { chunkIndex: number; totalChunks: number } }> {
  const tokens = encoder.encode(text);
  const chunks: Array<{ content: string; metadata: { chunkIndex: number; totalChunks: number } }> = [];
  
  const { chunkSize, overlap } = config.chunking;
  const step = chunkSize - overlap;
  
  let index = 0;
  let chunkIndex = 0;
  
  while (index < tokens.length) {
    const end = Math.min(index + chunkSize, tokens.length);
    const chunkTokens = tokens.slice(index, end);
    const chunkText = encoder.decode(chunkTokens);
    
    chunks.push({
      content: chunkText,
      metadata: {
        chunkIndex,
        totalChunks: 0 // Will be set later
      }
    });
    
    index += step;
    chunkIndex++;
  }
  
  // Update total chunks
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length;
  });
  
  return chunks;
}
