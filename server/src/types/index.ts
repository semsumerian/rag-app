export interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  chunks: number;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  metadata: {
    filename: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export interface ChatResponse {
  response: string;
  sources: {
    filename: string;
    content: string;
    relevance: number;
  }[];
}

export interface ModelSettings {
  url: string;
  modelName: string;
  apiKey: string;
}

export interface Settings {
  llm: ModelSettings;
  embedding: ModelSettings;
}
