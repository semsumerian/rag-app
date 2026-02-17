export interface Document {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Source {
  filename: string;
  content: string;
  relevance: number;
}

export interface UploadResponse {
  success: boolean;
  document: Document;
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
