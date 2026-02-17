import fs from 'fs';
import path from 'path';
import { Settings, ModelSettings } from '../types';

const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json');

const defaultSettings: Settings = {
  llm: {
    url: process.env.LM_STUDIO_URL || 'http://localhost:1235/v1',
    modelName: process.env.LLM_MODEL || 'qwen/qwen3-vl-8b',
    apiKey: process.env.LLM_API_KEY || ''
  },
  embedding: {
    url: process.env.LM_STUDIO_URL || 'http://localhost:1235/v1',
    modelName: process.env.EMBEDDING_MODEL || 'text-embedding-qwen3-embedding-0.6b',
    apiKey: process.env.EMBEDDING_API_KEY || ''
  }
};

let currentSettings: Settings = { ...defaultSettings };

export function initSettingsStore(): void {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const loadedSettings = JSON.parse(data);
      currentSettings = {
        llm: { ...defaultSettings.llm, ...loadedSettings.llm },
        embedding: { ...defaultSettings.embedding, ...loadedSettings.embedding }
      };
      console.log('Settings loaded from file');
    } else {
      saveSettings(currentSettings);
      console.log('Default settings created');
    }
  } catch (error) {
    console.error('Failed to initialize settings store:', error);
    currentSettings = { ...defaultSettings };
  }
}

export function getSettings(): Settings {
  return { ...currentSettings };
}

export function updateSettings(settings: Settings): void {
  currentSettings = {
    llm: { ...settings.llm },
    embedding: { ...settings.embedding }
  };
  saveSettings(currentSettings);
}

function saveSettings(settings: Settings): void {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

export function getLLMConfig(): ModelSettings {
  return { ...currentSettings.llm };
}

export function getEmbeddingConfig(): ModelSettings {
  return { ...currentSettings.embedding };
}
