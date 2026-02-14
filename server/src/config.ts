export const config = {
  lmStudio: {
    // Change this to your LM Studio server IP and port
    baseURL: process.env.LM_STUDIO_URL || 'http://localhost:1235/v1',
    llmModel: process.env.LLM_MODEL || 'qwen/qwen3-vl-8b',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-qwen3-embedding-0.6b'
  },
  server: {
    port: 3000,
    uploadDir: './data/uploads'
  },
  vectorDB: {
    path: './data/chromadb',
    tableName: 'documents'
  },
  chunking: {
    chunkSize: 1024,
    overlap: 100
  }
};
