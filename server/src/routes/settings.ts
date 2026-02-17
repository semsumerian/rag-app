import { Router, Request, Response } from 'express';
import { getSettings, updateSettings } from '../services/settingsStore';
import { Settings } from '../types';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const settings = getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const settings: Settings = req.body;
    
    // Validate required fields
    if (!settings.llm || !settings.embedding) {
      res.status(400).json({ error: 'Missing LLM or embedding settings' });
      return;
    }
    
    if (!settings.llm.url || !settings.llm.modelName) {
      res.status(400).json({ error: 'Missing LLM URL or model name' });
      return;
    }
    
    if (!settings.embedding.url || !settings.embedding.modelName) {
      res.status(400).json({ error: 'Missing embedding URL or model name' });
      return;
    }
    
    updateSettings(settings);
    res.json({ success: true, settings: getSettings() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
