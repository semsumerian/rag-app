import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

interface DocumentMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  chunks: number;
}

const META_FILE = path.join(config.vectorDB.path, 'documents.json');
let documents: Map<string, DocumentMetadata> = new Map();
let initialized = false;

async function loadFromDisk(): Promise<void> {
  try {
    await fs.mkdir(config.vectorDB.path, { recursive: true });
    const data = await fs.readFile(META_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    documents = new Map(Object.entries(parsed));
    console.log(`Loaded ${documents.size} documents from disk`);
  } catch (error) {
    documents = new Map();
  }
}

async function saveToDisk(): Promise<void> {
  try {
    await fs.mkdir(config.vectorDB.path, { recursive: true });
    const obj = Object.fromEntries(documents);
    await fs.writeFile(META_FILE, JSON.stringify(obj, null, 2));
  } catch (error) {
    console.error('Error saving documents:', error);
  }
}

export async function initDocumentStore(): Promise<void> {
  if (initialized) return;
  await loadFromDisk();
  initialized = true;
}

export async function addDocument(doc: DocumentMetadata): Promise<void> {
  if (!initialized) await initDocumentStore();
  documents.set(doc.id, doc);
  await saveToDisk();
}

export async function getAllDocuments(): Promise<DocumentMetadata[]> {
  if (!initialized) await initDocumentStore();
  return Array.from(documents.values());
}

export async function getDocument(id: string): Promise<DocumentMetadata | undefined> {
  if (!initialized) await initDocumentStore();
  return documents.get(id);
}

export async function deleteDocument(id: string): Promise<void> {
  if (!initialized) await initDocumentStore();
  documents.delete(id);
  await saveToDisk();
}
