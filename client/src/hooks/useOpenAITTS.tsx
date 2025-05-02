import { useState, useCallback, useRef, useEffect } from 'react';
import OpenAI from 'openai';

interface AudioAnalysisData {
  volume: number;
  isPlaying: boolean;
}

// Options pour la synthèse vocale
interface TTSOptions {
  model: 'tts-1' | 'tts-1-hd';
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed: number;
}

// Hook pour la synthèse vocale via l'API OpenAI
export function useOpenAITTS() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioAnalysisData, setAudioAnalysisData] = useState<AudioAnalysisData>({
    volume: 0,
    isPlaying: false
  });

  // Références pour les éléments audio et les intervalles
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  // Créer une instance d'OpenAI avec l'API key
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    dangerouslyAllowBrowser: true // Uniquement pour les tests, à éviter en production
  });

  // Nettoyer les ressources quand le composant est démonté
  useEffect(() => {
    return () => {
      // Libérer l'URL du blob audio
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Nettoyer l'intervalle
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [audioUrl]);

  // Fonction pour simuler l'analyse audio (pour l'animation de la bouche)
  const startVolumeSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setAudioAnalysisData(prev => ({ ...prev, isPlaying: true }));
    
    // Générer des valeurs de volume aléatoires pour l'animation
    intervalRef.current = window.setInterval(() => {
      const minVolume = 0.2;
      const maxVolume = 0.8;
      const randomVolume = Math.random() * (maxVolume - minVolume) + minVolume;
      
      setAudioAnalysisData(prev => ({
        ...prev,
        volume: randomVolume
      }));
    }, 150);
  }, []);

  // Fonction pour arrêter la simulation de volume
  const stopVolumeSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setAudioAnalysisData({
      volume: 0,
      isPlaying: false
    });
  }, []);

  // Fonction pour générer et jouer l'audio via l'API OpenAI
  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    if (!text.trim()) return;
    
    try {
      // Arrêter tout audio en cours
      stopPlayback();
      
      // Définir les options par défaut
      const defaultOptions: TTSOptions = {
        model: 'tts-1-hd',
        voice: 'onyx',
        speed: 1.0
      };
      
      // Fusionner options par défaut et options fournies
      const finalOptions = { ...defaultOptions, ...options };
      
      setIsLoading(true);
      setError(null);
      
      // Démarrer la simulation pour l'animation de la bouche pendant le chargement
      startVolumeSimulation();
      
      // Appeler l'API OpenAI pour la synthèse vocale
      console.log(`Génération de l'audio avec OpenAI TTS (voix: ${finalOptions.voice})...`);
      
      const mp3Response = await openai.audio.speech.create({
        model: finalOptions.model,
        voice: finalOptions.voice,
        input: text,
        speed: finalOptions.speed
      });
      
      // Convertir la réponse en blob audio
      const mp3Blob = await mp3Response.blob();
      const audioObjectUrl = URL.createObjectURL(mp3Blob);
      
      // Enregistrer l'URL pour le nettoyage ultérieur
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(audioObjectUrl);
      
      // Créer et configurer l'élément audio
      if (!audioRef.current) {
        audioRef.current = new Audio();
        
        // Ajouter des gestionnaires d'événements
        audioRef.current.addEventListener('play', () => {
          setIsPlaying(true);
          startVolumeSimulation();
        });
        
        audioRef.current.addEventListener('pause', () => {
          setIsPlaying(false);
          stopVolumeSimulation();
        });
        
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          stopVolumeSimulation();
        });
        
        audioRef.current.addEventListener('error', (e) => {
          console.error('Erreur de lecture audio:', e);
          setIsPlaying(false);
          stopVolumeSimulation();
          setError('Erreur lors de la lecture audio.');
        });
      }
      
      // Définir la source et lancer la lecture
      audioRef.current.src = audioObjectUrl;
      await audioRef.current.play();
      
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors de la génération de la synthèse vocale:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la génération audio.');
      stopVolumeSimulation();
      setIsLoading(false);
    }
  }, [audioUrl, startVolumeSimulation, stopVolumeSimulation]);

  // Fonction pour arrêter la lecture
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    stopVolumeSimulation();
    setIsPlaying(false);
  }, [stopVolumeSimulation]);

  return {
    speak,
    stopPlayback,
    isLoading,
    isPlaying,
    error,
    currentVolume: audioAnalysisData.volume
  };
}