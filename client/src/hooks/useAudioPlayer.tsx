import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAudioPlayerProps {
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook for playing audio files with callbacks for play state
 */
export function useAudioPlayer({ 
  onPlayStart, 
  onPlayEnd, 
  onError 
}: UseAudioPlayerProps = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  // Cleanup function for all resources
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsPlaying(false);
    setVolume(0);
  }, []);
  
  // Generate simulated volume data while audio is playing
  const simulateVolumeData = useCallback(() => {
    if (!isPlaying) return;
    
    // Generate random volume between 0.2 and 0.8
    const minVolume = 0.2;
    const maxVolume = 0.8;
    const randomVolume = Math.random() * (maxVolume - minVolume) + minVolume;
    
    setVolume(randomVolume);
  }, [isPlaying]);
  
  // Start volume simulation
  useEffect(() => {
    if (isPlaying) {
      // Start interval for volume simulation
      intervalRef.current = window.setInterval(simulateVolumeData, 150);
    } else {
      // Stop and reset simulation
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setVolume(0);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, simulateVolumeData]);
  
  // Set up audio element
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Set up event listeners
      audioRef.current.addEventListener('play', () => {
        setIsPlaying(true);
        if (onPlayStart) onPlayStart();
      });
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setVolume(0);
        if (onPlayEnd) onPlayEnd();
      });
      
      audioRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
        setVolume(0);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setVolume(0);
        if (onError) onError('Erreur de lecture audio');
      });
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });
      
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });
    }
    
    return () => cleanup();
  }, [cleanup, onPlayStart, onPlayEnd, onError]);
  
  // Play audio from URL
  const playAudio = useCallback((url?: string) => {
    // First clean up any existing audio
    cleanup();
    
    // Si pas d'URL ou URL vide, on simule juste la bouche qui parle
    if (!url || !audioRef.current) {
      console.log('No valid URL provided, simulating speech pattern only');
      
      // Simuler un délai de chargement pour plus de naturel (300ms)
      setTimeout(() => {
        // Démarrer la simulation
        setIsPlaying(true);
        
        // Informer le callback que la lecture a commencé
        if (onPlayStart) onPlayStart();
        
        // Démarrer l'intervalle de volume pour la simulation
        // (on le fait explicitement ici, même si useEffect le fait aussi)
        intervalRef.current = window.setInterval(simulateVolumeData, 150);
        
        // Simuler pendant 5 secondes puis arrêter
        setTimeout(() => {
          setIsPlaying(false);
          setVolume(0);
          
          // Nettoyer l'intervalle
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Informer le callback que la lecture est terminée
          if (onPlayEnd) onPlayEnd();
        }, 5000);
      }, 300);
      
      return;
    }
    
    try {
      console.log('Playing audio from URL:', url);
      
      // Set audio source
      audioRef.current.src = url;
      audioRef.current.load();
      
      // Play audio
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playback started successfully');
          })
          .catch(error => {
            console.error('Audio playback failed:', error);
            
            // Simuler la parole en cas d'échec (pour que la bouche bouge quand même)
            setIsPlaying(true);
            
            // Informer le callback que la lecture a commencé (même si c'est simulé)
            if (onPlayStart) onPlayStart();
            
            // Démarrer l'intervalle de volume pour la simulation
            intervalRef.current = window.setInterval(simulateVolumeData, 150);
            
            // Simuler pendant 4 secondes puis arrêter
            setTimeout(() => {
              setIsPlaying(false);
              setVolume(0);
              
              // Nettoyer l'intervalle
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              
              // Informer le callback que la lecture est terminée
              if (onPlayEnd) onPlayEnd();
            }, 4000);
            
            // Notifier de l'erreur, mais sans interrompre la simulation
            if (onError) onError('Impossible de démarrer la lecture audio');
          });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      
      // Simuler la parole en cas d'erreur (pour que la bouche bouge quand même)
      setIsPlaying(true);
      
      // Informer le callback que la lecture a commencé (même si c'est simulé)
      if (onPlayStart) onPlayStart();
      
      // Démarrer l'intervalle de volume pour la simulation
      intervalRef.current = window.setInterval(simulateVolumeData, 150);
      
      // Simuler pendant 4 secondes puis arrêter
      setTimeout(() => {
        setIsPlaying(false);
        setVolume(0);
        
        // Nettoyer l'intervalle
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Informer le callback que la lecture est terminée
        if (onPlayEnd) onPlayEnd();
      }, 4000);
      
      // Notifier de l'erreur, mais sans interrompre la simulation
      if (onError) onError('Erreur lors de la lecture audio');
    }
  }, [cleanup, onError, onPlayStart, onPlayEnd, simulateVolumeData]);
  
  // Stop audio playback
  const stopAudio = useCallback(() => {
    cleanup();
  }, [cleanup]);
  
  return {
    playAudio,
    stopAudio,
    isPlaying,
    volume,
    duration,
    currentTime
  };
}