import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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
    } else {
      setIsSpeechSupported(false);
    }
    
    // Cleanup
    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

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
    isSpeechSupported
  };
}
