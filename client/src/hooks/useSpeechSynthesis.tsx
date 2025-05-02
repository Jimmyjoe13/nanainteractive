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

  // Update volume in real-time
  const updateVolume = useCallback(() => {
    if (!audioAnalysisData.analyser || !audioDataRef.current) return;
    
    audioAnalysisData.analyser.getByteFrequencyData(audioDataRef.current);
    
    // Calculate average volume
    let sum = 0;
    const data = audioDataRef.current;
    
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    
    const avgVolume = sum / data.length;
    // Normalize to 0-1 range (255 is max value from getByteFrequencyData)
    const normalizedVolume = avgVolume / 255;
    
    // Update volume in state
    setAudioAnalysisData(prev => ({
      ...prev,
      volume: normalizedVolume
    }));
    
    // Continue the loop
    if (isSpeaking) {
      rafIdRef.current = requestAnimationFrame(updateVolume);
    }
  }, [isSpeaking, audioAnalysisData.analyser]);

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

  // Set up synthetic speech audio analysis
  const setupSpeechAnalysis = useCallback(() => {
    const { audioContext, analyser } = audioAnalysisData;
    if (!audioContext || !analyser) {
      console.error('Audio analysis not available');
      return;
    }
    
    // In a real-world scenario, we would connect the speech synthesis to the audio analyzer
    // Since we can't directly access the audio stream from Speech Synthesis,
    // we'll simulate the audio analysis using oscillator or noise generator
    
    // Simulate speech audio with a combination of oscillators
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const noiseGenerator = audioContext.createGain();
    
    oscillator1.frequency.value = 220; // Base frequency
    oscillator2.frequency.value = 440; // Harmonics
    
    // Create a gain node to control volume
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5;
    
    // Connect everything
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Start oscillators
    oscillator1.start();
    oscillator2.start();
    
    // Simulate speech pattern by modulating the gain
    const modulateGain = () => {
      // Random modulation to simulate speech
      const targetGain = Math.random() * 0.5 + 0.1;
      gainNode.gain.linearRampToValueAtTime(
        targetGain, 
        audioContext.currentTime + 0.1
      );
      
      if (isSpeaking) {
        setTimeout(modulateGain, 100 + Math.random() * 200);
      }
    };
    
    modulateGain();
    
    // Start analyzing
    rafIdRef.current = requestAnimationFrame(updateVolume);
    
    // Return cleanup function
    return () => {
      oscillator1.stop();
      oscillator2.stop();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [audioAnalysisData, isSpeaking, updateVolume]);

  // Effect to handle audio analysis during speech
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (isSpeaking) {
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
