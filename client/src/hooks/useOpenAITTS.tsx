import { useState, useCallback, useRef, useEffect } from 'react';

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

// Hook pour la synthèse vocale via notre endpoint qui utilise l'API OpenAI
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

  // Fonction utilitaire pour trouver un point logique où couper le texte
  const findSentenceBreak = useCallback((text: string, minLength: number): number => {
    // Chercher la fin de phrase la plus proche après minLength
    const punctuation = ['.', '!', '?', ';', ':'];
    let bestBreak = -1;
    
    // Rechercher après la longueur minimale
    for (let i = minLength; i < Math.min(text.length, minLength + 100); i++) {
      if (punctuation.includes(text[i])) {
        bestBreak = i;
        break;
      }
    }
    
    // Si on ne trouve pas de ponctuation, chercher un espace après minLength
    if (bestBreak === -1) {
      for (let i = minLength; i < Math.min(text.length, minLength + 50); i++) {
        if (text[i] === ' ') {
          bestBreak = i;
          break;
        }
      }
    }
    
    // Si on ne trouve toujours rien, couper au milieu
    if (bestBreak === -1 && text.length > minLength * 2) {
      bestBreak = Math.floor(text.length / 2);
    }
    
    return bestBreak;
  }, []);

  // Fonction pour générer et jouer l'audio via notre endpoint API qui utilise OpenAI TTS
  const speak = useCallback(async (text: string, options: Partial<TTSOptions> = {}) => {
    if (!text.trim()) return;
    
    try {
      // Arrêter tout audio en cours
      stopPlayback();
      
      // Définir les options par défaut
      const defaultOptions: TTSOptions = {
        model: 'tts-1',
        voice: 'shimmer',
        speed: 1.0
      };
      
      // Fusionner options par défaut et options fournies
      const finalOptions = { ...defaultOptions, ...options };
      
      setIsLoading(true);
      setError(null);
      
      // Démarrer la simulation pour l'animation de la bouche pendant le chargement
      startVolumeSimulation();
      
      // Stratégie d'optimisation pour les textes longs (>300 caractères)
      // Pour les longs textes, on divise en deux parties et on génère la seconde
      // pendant qu'on joue la première
      if (text.length > 300) {
        console.log("Texte long détecté, utilisation de la génération parallèle...");
        
        // Trouver un point logique où couper le texte (fin de phrase)
        const breakIndex = findSentenceBreak(text, 100);
        
        if (breakIndex > 0) {
          // Diviser le texte en deux parties
          const firstPart = text.substring(0, breakIndex + 1);
          const remainingPart = text.substring(breakIndex + 1);
          
          console.log(`Texte divisé en deux parties: ${firstPart.length} et ${remainingPart.length} caractères`);
          
          // Générer la première partie
          const firstPartResponse = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: firstPart,
              voice: finalOptions.voice,
              model: finalOptions.model,
              speed: finalOptions.speed
            })
          });
          
          if (!firstPartResponse.ok) {
            const errorData = await firstPartResponse.json();
            throw new Error(errorData.error || 'Erreur lors de la génération audio');
          }
          
          // Préparer la génération de la seconde partie en parallèle
          const secondPartPromise = fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: remainingPart,
              voice: finalOptions.voice,
              model: finalOptions.model,
              speed: finalOptions.speed
            })
          });
          
          // Récupérer le blob audio de la première partie
          const firstPartBlob = await firstPartResponse.blob();
          const firstPartUrl = URL.createObjectURL(firstPartBlob);
          
          // Nettoyer l'ancienne URL si nécessaire
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
          }
          setAudioUrl(firstPartUrl);
          
          // Configurer et jouer le premier segment
          if (!audioRef.current) {
            audioRef.current = new Audio();
            
            // Gestionnaires d'événements
            audioRef.current.addEventListener('play', () => {
              setIsPlaying(true);
              startVolumeSimulation();
            });
            
            audioRef.current.addEventListener('pause', () => {
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
          
          // Gérer la fin de la première partie
          audioRef.current.onended = async () => {
            console.log("Première partie terminée, lecture de la suite...");
            try {
              // Récupérer la seconde partie (générée en parallèle)
              const secondPartResponse = await secondPartPromise;
              
              if (!secondPartResponse.ok) {
                const errorData = await secondPartResponse.json();
                throw new Error(errorData.error || 'Erreur lors de la génération de la suite');
              }
              
              const secondPartBlob = await secondPartResponse.blob();
              const secondPartUrl = URL.createObjectURL(secondPartBlob);
              
              // Libérer la première URL
              URL.revokeObjectURL(firstPartUrl);
              setAudioUrl(secondPartUrl);
              
              // Jouer la seconde partie
              audioRef.current.src = secondPartUrl;
              await audioRef.current.play();
              
              // Réinitialiser l'événement onended
              audioRef.current.onended = () => {
                setIsPlaying(false);
                stopVolumeSimulation();
              };
              
            } catch (error) {
              console.error("Erreur lors de la lecture de la seconde partie:", error);
              setIsPlaying(false);
              stopVolumeSimulation();
              setError('Erreur lors de la lecture de la suite audio.');
            }
          };
          
          // Lancer la lecture de la première partie
          audioRef.current.src = firstPartUrl;
          await audioRef.current.play();
          
          setIsLoading(false);
          return;
        }
      }
      
      // Si le texte est court ou si la division a échoué, utiliser l'approche standard
      console.log(`Génération standard de l'audio avec OpenAI TTS (voix: ${finalOptions.voice})...`);
      
      // Appel à notre API backend
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: finalOptions.voice,
          model: finalOptions.model,
          speed: finalOptions.speed
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération audio');
      }
      
      // Récupérer le blob audio depuis la réponse
      const mp3Blob = await response.blob();
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
        
        audioRef.current.addEventListener('error', (e) => {
          console.error('Erreur de lecture audio:', e);
          setIsPlaying(false);
          stopVolumeSimulation();
          setError('Erreur lors de la lecture audio.');
        });
      }
      
      // Réinitialiser l'événement onended pour cette lecture standard
      audioRef.current.onended = () => {
        setIsPlaying(false);
        stopVolumeSimulation();
      };
      
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
  }, [audioUrl, startVolumeSimulation, stopVolumeSimulation, findSentenceBreak]);

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