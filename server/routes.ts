import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { Readable } from "stream";

export async function registerRoutes(app: Express): Promise<Server> {
  // Route de santé pour les healthchecks de Railway
  app.get('/api/health', (_req: Request, res: Response) => {
    console.log('Healthcheck accessed');
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Initialisation de l'API OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Cache pour les réponses audio (pour éviter de regénérer les mêmes audio)
  const audioCache = new Map<string, Buffer>();
  
  // Fonctions utilitaires pour le cache
  const cacheUtils = {
    // Récupération d'un élément du cache
    get: (key: string): Buffer | undefined => {
      return audioCache.get(key);
    },
    
    // Ajout d'un élément dans le cache
    set: (key: string, value: Buffer): void => {
      audioCache.set(key, value);
      
      // Nettoyer le cache s'il devient trop volumineux (garder les 30 dernières entrées)
      if (audioCache.size > 30) {
        const oldestKey = Array.from(audioCache.keys())[0];
        if (oldestKey) {
          audioCache.delete(oldestKey);
        }
      }
    },
    
    // Vérifier si une clé est dans le cache
    has: (key: string): boolean => {
      return audioCache.has(key);
    },
    
    // Génération d'une clé de cache unique
    generateKey: (text: string, voice: string, model: string, speed: number): string => {
      return `${text.substring(0, 100)}_${voice}_${model}_${speed}`;
    }
  };

  // Route pour la synthèse vocale OpenAI TTS avec cache
  app.post('/api/tts', async (req: Request, res: Response) => {
    try {
      const { text, voice = 'shimmer', model = 'tts-1', speed = 1.0 } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Le texte est requis' });
      }
      
      // Optimisation - tronquer le texte pour les très longues requêtes pour la clé de cache
      const cacheKey = cacheUtils.generateKey(text, voice, model, speed);
      
      // Vérifier si on a déjà généré cet audio
      if (cacheUtils.has(cacheKey)) {
        console.log(`Utilisation de l'audio en cache pour "${text.substring(0, 30)}..."`);
        const cachedBuffer = cacheUtils.get(cacheKey)!;
        
        // Configuration des en-têtes de réponse
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', cachedBuffer.length);
        res.setHeader('X-Cache', 'HIT');
        
        // Envoyer l'audio en cache (réponse immédiate)
        return res.end(cachedBuffer);
      }
      
      console.log(`Génération de la synthèse vocale avec ${model} (voix: ${voice})`);
      
      // Optimiser la génération pour les textes courts
      const optimizedModel = text.length < 100 ? 'tts-1' : model;
      
      // Appel à l'API OpenAI pour la synthèse vocale
      const mp3Response = await openai.audio.speech.create({
        model: optimizedModel,
        voice: voice,
        input: text,
        speed: speed
      });
      
      // Convertir la réponse en buffer
      const buffer = Buffer.from(await mp3Response.arrayBuffer());
      
      // Stocker dans le cache (seulement si le texte n'est pas trop long)
      if (text.length < 2000) {  // Éviter de stocker des réponses trop longues
        cacheUtils.set(cacheKey, buffer);
      }
      
      // Configuration des en-têtes de réponse
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('X-Cache', 'MISS');
      
      // Envoyer l'audio en réponse
      res.end(buffer);

      // Envoyer une requête au webhook après avoir envoyé la réponse audio
      try {
        const webhookUrl = 'https://primary-production-689f.up.railway.app/webhook/96837ad7-6e79-494f-a917-7e445b7b8b0f';
        console.log(`Envoi de la requête au webhook: ${webhookUrl}`);
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'tts_generated',
            message: text,
            voice: voice,
            model: model,
            speed: speed,
            timestamp: new Date().toISOString(),
          }),
        });
        console.log('Requête au webhook envoyée avec succès.');
      } catch (webhookError) {
        console.error('Erreur lors de l\'envoi de la requête au webhook:', webhookError);
        // Ne pas bloquer la réponse principale si le webhook échoue
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la synthèse vocale:', error);
      res.status(500).json({ 
        error: 'Erreur lors de la génération de la synthèse vocale',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  });

  // Route pour le chat, agissant comme un proxy vers le webhook n8n
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message } = req.body;
    const webhookUrl = 'https://n8n-production-c3cb.up.railway.app/webhook/96837ad7-6e79-494f-a917-7e445b7b8b0f';

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    try {
      console.log(`Forwarding message to n8n webhook: ${message}`);
      
      const n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!n8nResponse.ok) {
        throw new Error(`n8n webhook responded with status: ${n8nResponse.status}`);
      }

      const n8nData = await n8nResponse.json();
      console.log('Received response from n8n:', n8nData);

      // Renvoyer la réponse de n8n au client
      res.json(n8nData);

    } catch (error) {
      console.error('Error forwarding message to n8n:', error);
      res.status(502).json({ 
        error: 'Failed to communicate with the AI agent.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
