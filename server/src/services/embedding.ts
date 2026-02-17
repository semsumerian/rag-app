import OpenAI from 'openai';
import { getEmbeddingConfig } from './settingsStore';

function createOpenAIClient() {
  const embeddingConfig = getEmbeddingConfig();
  return new OpenAI({
    baseURL: embeddingConfig.url,
    apiKey: embeddingConfig.apiKey || 'not-needed'
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = createOpenAIClient();
    const embeddingConfig = getEmbeddingConfig();
    const response = await openai.embeddings.create({
      model: embeddingConfig.modelName,
      input: text
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Process in batches to avoid overwhelming the server
  const batchSize = 8;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchPromises = batch.map(text => generateEmbedding(text));
    const batchEmbeddings = await Promise.all(batchPromises);
    embeddings.push(...batchEmbeddings);
    
    // Small delay between batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return embeddings;
}
