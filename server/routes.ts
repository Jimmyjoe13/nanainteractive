import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { Readable } from "stream";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialisation de l'API OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Route pour la synthèse vocale OpenAI TTS
  app.post('/api/tts', async (req: Request, res: Response) => {
    try {
      const { text, voice = 'onyx', model = 'tts-1-hd', speed = 1.0 } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Le texte est requis' });
      }
      
      console.log(`Génération de la synthèse vocale avec ${model} (voix: ${voice})`);
      
      // Appel à l'API OpenAI pour la synthèse vocale
      const mp3Response = await openai.audio.speech.create({
        model: model,
        voice: voice,
        input: text,
        speed: speed
      });
      
      // Convertir la réponse en buffer
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      
      // Configuration des en-têtes de réponse
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      
      // Envoyer l'audio en réponse
      res.end(buffer);
    } catch (error) {
      console.error('Erreur lors de la génération de la synthèse vocale:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la génération de la synthèse vocale',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
