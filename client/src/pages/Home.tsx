import { useState, useEffect, useRef } from "react";
import NanaFace from "@/components/nana/NanaFace";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useOpenAITTS } from "@/hooks/useOpenAITTS";
import { sendMessageToNana } from "@/lib/nanaApi";
import { useToast } from "@/hooks/use-toast";
import { Send, Square, Volume2, VolumeX } from "lucide-react";

export default function Home() {
  // State for UI
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Chat messages state
  const [messages, setMessages] = useState<{ text: string; isUser: boolean; timestamp: Date }[]>([
    { 
      text: "Bonjour ! Je suis NANA, l'assistant IA de Nana Intelligence. Comment puis-je vous aider aujourd'hui ?", 
      isUser: false, 
      timestamp: new Date() 
    }
  ]);
  
  // Text-to-speech avec OpenAI (voix Onyx)
  const { 
    speak: speakWithOpenAI, 
    stopPlayback: stopOpenAISpeech,
    isPlaying: isOpenAISpeaking,
    currentVolume: openAIVolume
  } = useOpenAITTS();
  
  // Synthèse vocale de secours (utilisation du navigateur si l'API OpenAI ne fonctionne pas)
  const { 
    speak: speakWithBrowser, 
    isSpeaking: isBrowserSpeaking, 
    stopSpeaking: stopBrowserSpeech, 
    isSpeechSupported
  } = useSpeechSynthesis();
  
  // Audio simulation for mouth animation
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationVolume, setSimulationVolume] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  // État combiné de la synthèse vocale (OpenAI ou navigateur)
  const isSpeaking = isOpenAISpeaking || isBrowserSpeaking;
  
  // Fonction pour arrêter toute synthèse vocale en cours
  const stopSpeaking = () => {
    stopOpenAISpeech();
    stopBrowserSpeech();
  };
  
  // Fonction pour parler avec la meilleure voix disponible (OpenAI en priorité)
  const speak = async (text: string) => {
    try {
      // On arrête d'abord toute synthèse vocale en cours
      stopSpeaking();
      
      // On essaie d'utiliser l'API OpenAI pour une voix de qualité supérieure
      await speakWithOpenAI(text, { voice: 'onyx', model: 'tts-1-hd' });
    } catch (error) {
      console.error('Erreur avec la synthèse OpenAI, utilisation du navigateur:', error);
      
      // En cas d'échec, on utilise la synthèse vocale du navigateur
      if (isSpeechSupported) {
        speakWithBrowser(text);
      }
    }
  };
  
  // Get the current volume for mouth animation
  const currentVolume = isSimulating 
    ? simulationVolume 
    : (isOpenAISpeaking ? openAIVolume : (isBrowserSpeaking ? 0.5 : 0));
  
  // Update isTalking when speaking status changes
  useEffect(() => {
    setIsTalking(isSpeaking || isSimulating);
  }, [isSpeaking, isSimulating]);
  
  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Clean up intervals and object URLs on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  // Set up audio element event listeners
  useEffect(() => {
    if (!audioRef.current) return;
    
    const handleAudioEnd = () => {
      console.log("Lecture audio terminée");
      setIsSimulating(false);
      setSimulationVolume(0);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    const handleAudioError = (e: Event) => {
      console.error("Erreur de lecture audio:", e);
      setIsSimulating(false);
      setSimulationVolume(0);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      toast({
        title: "Erreur de lecture audio",
        description: "Impossible de lire le fichier audio",
        variant: "destructive"
      });
    };
    
    audioRef.current.addEventListener('ended', handleAudioEnd);
    audioRef.current.addEventListener('error', handleAudioError);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnd);
        audioRef.current.removeEventListener('error', handleAudioError);
      }
    };
  }, [toast]);
  
  // Simulate audio for mouth animation
  const simulateAudio = (duration = 5000) => {
    // Clean up any existing simulation
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log("Démarrage de la simulation audio");
    
    // Add a small delay to simulate latency
    setTimeout(() => {
      setIsSimulating(true);
      
      // Generate random volume values to animate the mouth
      intervalRef.current = window.setInterval(() => {
        const minVolume = 0.2;
        const maxVolume = 0.8;
        const randomVolume = Math.random() * (maxVolume - minVolume) + minVolume;
        setSimulationVolume(randomVolume);
      }, 150);
      
      // Stop after specified duration
      setTimeout(() => {
        setIsSimulating(false);
        setSimulationVolume(0);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, duration);
    }, 300);
  };
  
  // Process user input and handle API response
  const processUserMessage = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      // Stop any ongoing speech or audio
      if (isSpeaking) {
        stopSpeaking();
      }
      
      if (isSimulating) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsSimulating(false);
        setSimulationVolume(0);
      }
      
      // Add user message to chat
      setMessages(prev => [...prev, { 
        text, 
        isUser: true, 
        timestamp: new Date() 
      }]);
      
      // Set processing state
      setIsProcessing(true);
      
      console.log("Envoi du message au webhook n8n:", text);
      
      // Send to API
      const response = await sendMessageToNana(text);
      
      console.log("Réponse reçue du webhook n8n:", response);
      
      // Extract response text
      let responseText = "";
      
      // Case 1: If response is a string
      if (typeof response === 'string') {
        responseText = response;
      }
      // Case 2: If response contains text
      else if (response?.text) {
        responseText = response.text;
      }
      // Case 3: If we have an audio file but no text
      else if (response?.mimeType && response.mimeType.includes('audio')) {
        responseText = "Je suis désolé, je ne peux pas accéder directement au fichier audio, mais je reste à votre écoute.";
        simulateAudio(5000);
      }
      // Case 4: No usable information
      else {
        responseText = "Je rencontre des difficultés techniques. Pourriez-vous reformuler votre question ?";
      }
      
      // Add AI response to chat
      setMessages(prev => [...prev, { 
        text: responseText, 
        isUser: false, 
        timestamp: new Date() 
      }]);
      
      // Utiliser la synthèse vocale pour lire la réponse
      if (isSpeechSupported && responseText) {
        speak(responseText);
      }
      
    } catch (error) {
      console.error('Error processing input:', error);
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        text: "Je rencontre des difficultés techniques. Merci de réessayer dans un instant.", 
        isUser: false, 
        timestamp: new Date() 
      }]);
      
      toast({
        title: "Erreur de communication",
        description: "Impossible de communiquer avec NANA pour le moment.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userMessage.trim() || isProcessing) return;
    
    processUserMessage(userMessage);
    setUserMessage("");
  };

  return (
    <div className="nana-container">
      {/* Left side - Nana face */}
      <div className="nana-face-container">
        <NanaFace 
          isTalking={isTalking} 
          isListening={false} 
          isProcessing={isProcessing}
          currentVolume={currentVolume}
        />
      </div>
      
      {/* Right side - Chat interface */}
      <div className="chat-container">
        {/* Bouton pour arrêter la synthèse vocale */}
        <button
          className={`stop-speaking-button ${isSpeaking ? 'visible' : ''}`}
          onClick={() => {
            if (isSpeaking) {
              stopSpeaking();
              toast({
                title: "Synthèse vocale arrêtée",
                description: "La lecture a été interrompue",
                variant: "default"
              });
            }
          }}
        >
          <VolumeX size={16} />
          Arrêter la voix
        </button>
        
        {/* Messages area */}
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.isUser ? 'user-message' : 'nana-message'}`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="input-container">
          <form onSubmit={handleSubmit} className="flex items-center w-full gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Écrivez un message..."
              className="message-input"
              value={userMessage}
              onChange={e => setUserMessage(e.target.value)}
              disabled={isProcessing}
            />
            
            <button
              type="submit"
              disabled={isProcessing || !userMessage.trim()}
              className="send-button control-button"
            >
              <Send size={18} />
            </button>
          </form>
          
          {/* Hidden audio element for playing MP3 files */}
          <audio ref={audioRef} style={{ display: 'none' }} controls />
        </div>
      </div>
    </div>
  );
}