import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { Readable } from "stream";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialisation de l'API OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Cache pour les réponses audio (pour éviter de regénérer les mêmes audio)
  const audioCache = new Map<string, Buffer>();

  // Route pour la synthèse vocale OpenAI TTS avec cache
  app.post('/api/tts', async (req: Request, res: Response) => {
    try {
      const { text, voice = 'onyx', model = 'tts-1', speed = 1.35 } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Le texte est requis' });
      }
      
      // Créer une clé unique pour le cache basée sur tous les paramètres
      const cacheKey = `${text}_${voice}_${model}_${speed}`;
      
      // Vérifier si on a déjà généré cet audio
      if (audioCache.has(cacheKey)) {
        console.log(`Utilisation de l'audio en cache pour "${text.substring(0, 30)}..."`);
        const cachedBuffer = audioCache.get(cacheKey)!;
        
        // Configuration des en-têtes de réponse
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', cachedBuffer.length);
        res.setHeader('X-Cache', 'HIT');
        
        // Envoyer l'audio en cache
        return res.end(cachedBuffer);
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
      
      // Stocker dans le cache (seulement si le texte n'est pas trop long)
      if (text.length < 2000) {  // Éviter de stocker des réponses trop longues
        audioCache.set(cacheKey, buffer);
        
        // Limiter la taille du cache (garder les 50 entrées les plus récentes)
        if (audioCache.size > 50) {
          // Prendre la première clé et la supprimer
          for (const key of audioCache.keys()) {
            audioCache.delete(key);
            break; // Supprimer seulement la première entrée
          }
        }
      }
      
      // Configuration des en-têtes de réponse
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('X-Cache', 'MISS');
      
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
