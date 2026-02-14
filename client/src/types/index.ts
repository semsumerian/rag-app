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
