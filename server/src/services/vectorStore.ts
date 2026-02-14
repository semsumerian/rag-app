import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { Chunk } from '../types';

interface StoredChunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  filename: string;
  chunkIndex: number;
  totalChunks: number;
}

const DB_FILE = path.join(config.vectorDB.path, 'vectors.json');
let chunks: StoredChunk[] = [];
let initialized = false;

// Simple cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function loadFromDisk(): Promise<void> {
  try {
    await fs.mkdir(config.vectorDB.path, { recursive: true });
    const data = await fs.readFile(DB_FILE, 'utf-8');
    chunks = JSON.parse(data);
    console.log(`Loaded ${chunks.length} chunks from disk`);
  } catch (error) {
    // File doesn't exist yet, start with empty array
    chunks = [];
  }
}

async function saveToDisk(): Promise<void> {
  try {
    await fs.mkdir(config.vectorDB.path, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(chunks, null, 2));
  } catch (error) {
    console.error('Error saving to disk:', error);
  }
}

export async function initVectorStore(): Promise<void> {
  if (initialized) return;
  
  await loadFromDisk();
  initialized = true;
  console.log('Vector store initialized (in-memory with persistence)');
}

export async function addChunks(newChunks: Chunk[]): Promise<void> {
  if (!initialized) {
    await initVectorStore();
  }
  
  if (newChunks.length === 0) return;
  
  console.log(`Adding ${newChunks.length} chunks`);
  
  const storedChunks: StoredChunk[] = newChunks.map(chunk => ({
    id: chunk.id,
    documentId: chunk.documentId,
    content: chunk.content,
    embedding: chunk.embedding,
    filename: chunk.metadata.filename,
    chunkIndex: chunk.metadata.chunkIndex,
    totalChunks: chunk.metadata.totalChunks
  }));
  
  chunks.push(...storedChunks);
  await saveToDisk();
  
  console.log('Chunks added successfully');
}

export async function searchSimilar(
  queryEmbedding: number[],
  limit: number = 5
): Promise<Array<{ id: string; documentId: string; content: string; filename: string; distance: number }>> {
  if (!initialized) {
    await initVectorStore();
  }
  
  if (chunks.length === 0) {
    return [];
  }
  
  // Calculate similarity for all chunks
  const similarities = chunks.map(chunk => ({
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));
  
  // Sort by similarity (highest first)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // Return top results
  return similarities.slice(0, limit).map(({ chunk, similarity }) => ({
    id: chunk.id,
    documentId: chunk.documentId,
    content: chunk.content,
    filename: chunk.filename,
    distance: 1 - similarity // Convert similarity to distance
  }));
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
  if (!initialized) {
    await initVectorStore();
  }
  
  chunks = chunks.filter(c => c.documentId !== documentId);
  await saveToDisk();
}

export async function getAllFilenames(): Promise<Set<string>> {
  if (!initialized) {
    await initVectorStore();
  }
  
  const filenames = new Set<string>();
  chunks.forEach(c => filenames.add(c.filename));
  return filenames;
}
