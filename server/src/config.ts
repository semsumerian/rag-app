export const config = {
  lmStudio: {
    baseURL: 'http://192.168.0.11:1235/v1',
    llmModel: 'qwen/qwen3-vl-8b',
    embeddingModel: 'text-embedding-qwen3-embedding-0.6b'
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
