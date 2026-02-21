import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC_MIME = 'application/msword';

function getExtension(filePath: string): string {
  const parts = filePath.toLowerCase().split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

export async function parseDocument(filePath: string, mimeType: string, originalName?: string): Promise<string> {
  try {
    const extension = getExtension(originalName || filePath);

    if (mimeType === 'application/pdf') {
      return await parsePDF(filePath);
    } else if (mimeType === DOCX_MIME || extension === '.docx') {
      return await parseDOCX(filePath);
    } else if (mimeType === DOC_MIME || extension === '.doc') {
      return await parseDOC(filePath);
    } else if (mimeType === 'text/plain') {
      return await parseTXT(filePath);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    throw error;
  }
}

async function parsePDF(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDOCX(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function parseDOC(filePath: string): Promise<string> {
  const WordExtractor = require('word-extractor');
  const extractor = new WordExtractor();
  const extracted = await extractor.extract(filePath);
  return extracted.getBody();
}

async function parseTXT(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
}
