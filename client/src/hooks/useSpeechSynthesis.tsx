import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechAudioAnalysisData {
  volume: number;
  analyser: AnalyserNode | null;
  audioContext: AudioContext | null;
}

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [audioAnalysisData, setAudioAnalysisData] = useState<SpeechAudioAnalysisData>({
    volume: 0,
    analyser: null,
    audioContext: null
  });
  
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioDataRef = useRef<Uint8Array | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
      setIsSpeechSupported(true);
      
      // Get available voices
      const loadVoices = () => {
        const availableVoices = synthesisRef.current?.getVoices() || [];
        setVoices(availableVoices);
      };
      
      loadVoices();
      
      // Chrome loads voices asynchronously
      if (synthesisRef.current.onvoiceschanged !== undefined) {
        synthesisRef.current.onvoiceschanged = loadVoices;
      }
      
      // Set up audio context for analysis
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8; // Make transitions smoother
        
        setAudioAnalysisData(prev => ({
          ...prev,
          audioContext,
          analyser
        }));
        
        audioDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      } catch (error) {
        console.error('Web Audio API not supported:', error);
      }
    } else {
      setIsSpeechSupported(false);
    }
    
    // Cleanup
    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      
      if (audioAnalysisData.audioContext) {
        audioAnalysisData.audioContext.close();
      }
      
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Update volume in real-time - simplified version that doesn't require AudioContext
  const updateVolume = useCallback(() => {
    // This is now just a placeholder since we're using the simulated approach instead
    // and the actual data will be updated directly in the setupSpeechAnalysis function
    
    // Continue the loop if speaking
    if (isSpeaking && rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(updateVolume);
    }
  }, [isSpeaking]);

  // Find the best French female voice
  const getBestVoice = useCallback((text: string) => {
    // First try to find a French female voice
    let voice = voices.find(v => 
      v.lang.includes('fr') && 
      v.name.toLowerCase().includes('female'));
    
    // If no French female voice, try any French voice
    if (!voice) {
      voice = voices.find(v => v.lang.includes('fr'));
    }
    
    // If no French voice at all, use default
    if (!voice && voices.length > 0) {
      voice = voices[0];
    }
    
    return voice;
  }, [voices]);

  // Set up synthetic speech audio analysis - simplified version
  const setupSpeechAnalysis = useCallback(() => {
    // Create a random pattern generator for the mouth animation
    const generateRandomVolumePattern = () => {
      // Target volumes for simulation (min, max)
      const minVolume = 0.2;
      const maxVolume = 0.8;
      
      // Generate a sequence of random volume changes
      const patternLength = 30; // number of steps to generate
      const pattern: number[] = [];
      
      // Start with mid volume
      let currentVolume = (minVolume + maxVolume) / 2;
      
      // Generate a pattern of volumes
      for (let i = 0; i < patternLength; i++) {
        // Add some randomness to the volume
        const randomChange = (Math.random() * 0.4) - 0.2; // Random value between -0.2 and 0.2
        currentVolume += randomChange;
        
        // Keep volume within bounds
        currentVolume = Math.max(minVolume, Math.min(maxVolume, currentVolume));
        
        pattern.push(currentVolume);
      }
      
      return pattern;
    };
    
    // Generate a random pattern
    const volumePattern = generateRandomVolumePattern();
    let patternIndex = 0;
    
    // Simulate playing audio with the pattern
    const interval = setInterval(() => {
      if (!isSpeaking) {
        clearInterval(interval);
        return;
      }
      
      // Get next volume from pattern and loop
      const nextVolume = volumePattern[patternIndex % volumePattern.length];
      patternIndex++;
      
      // Update the audio analysis state
      setAudioAnalysisData(prev => ({
        ...prev,
        volume: nextVolume
      }));
    }, 150); // Update every 150ms for a natural speech rhythm
    
    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [isSpeaking]);

  // Effect to handle audio analysis during speech
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (isSpeaking) {
      // Only set up analysis when speaking
      cleanup = setupSpeechAnalysis();
    } else {
      // Reset volume when not speaking
      setAudioAnalysisData(prev => ({
        ...prev,
        volume: 0
      }));
      
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [isSpeaking, setupSpeechAnalysis]);

  // Speak function
  const speak = useCallback((text: string, rate = 1.0, pitch = 1.1) => {
    if (!synthesisRef.current || !isSpeechSupported) return;
    
    // Stop any current speech
    stopSpeaking();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getBestVoice(text);
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.lang = 'fr-FR';
    utterance.rate = rate;
    utterance.pitch = pitch;
    
    // Event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };
    
    // Store the current utterance for potential cancellation
    currentUtteranceRef.current = utterance;
    
    // Speak
    synthesisRef.current.speak(utterance);
  }, [isSpeechSupported, getBestVoice]);

  // Stop speaking function
  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    voices,
    isSpeechSupported,
    currentVolume: audioAnalysisData.volume
  };
}
