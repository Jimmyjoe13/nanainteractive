import { useState, useEffect, useRef } from "react";
import NanaFace from "@/components/nana/NanaFace";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { sendMessageToNana } from "@/lib/nanaApi";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  
  // Custom hooks for speech recognition
  const { 
    startListening, 
    stopListening, 
    transcript, 
    isListeningSupported 
  } = useSpeechRecognition('fr-FR');
  
  // Text-to-speech synthesis (fallback)
  const { 
    speak, 
    isSpeaking, 
    stopSpeaking, 
    isSpeechSupported
  } = useSpeechSynthesis();
  
  // Audio player for MP3 files from webhook
  const {
    playAudio,
    stopAudio,
    isPlaying: isPlayingAudio,
    volume: audioVolume
  } = useAudioPlayer({
    onPlayStart: () => {
      console.log("Lecture du fichier audio démarrée");
      setIsTalking(true);
    },
    onPlayEnd: () => {
      console.log("Lecture du fichier audio terminée");
      setIsTalking(false);
    },
    onError: (error: string) => {
      console.error("Erreur de lecture audio:", error);
      toast({
        title: "Erreur de lecture audio",
        description: error,
        variant: "destructive"
      });
      setIsTalking(false);
    }
  });
  
  // Get the current volume for mouth animation (from audio player or speech synthesis)
  const currentVolume = isPlayingAudio ? audioVolume : (isSpeaking ? 0.5 : 0);
  
  // Check for transcript changes
  useEffect(() => {
    if (transcript && isListening) {
      processUserInput(transcript);
    }
  }, [transcript]);
  
  // Update isTalking when speaking status changes from TTS
  useEffect(() => {
    if (!isPlayingAudio) { // Only update if we're not already playing an audio file
      setIsTalking(isSpeaking);
    }
  }, [isSpeaking, isPlayingAudio]);

  // Handle toggle listening
  const handleToggleListen = () => {
    if (isProcessing) return;
    
    if (isListening) {
      setIsListening(false);
      stopListening();
      return;
    }
    
    // Check for browser support
    if (!isListeningSupported) {
      toast({
        title: "Microphone non supporté",
        description: "Votre navigateur ne supporte pas la reconnaissance vocale.",
        variant: "destructive"
      });
      return;
    }
    
    setIsListening(true);
    startListening();
  };
  
  // Process user input (either from voice or text)
  const processUserInput = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      // Stop any ongoing interactions
      if (isListening) {
        setIsListening(false);
        stopListening();
      }
      
      if (isSpeaking) {
        stopSpeaking();
      }
      
      if (isPlayingAudio) {
        stopAudio();
      }
      
      setIsProcessing(true);
      
      // Clear input field if this came from the text input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      
      // Log the user's message
      console.log("Envoi du message au webhook n8n:", text);
      
      // Send to API
      const response = await sendMessageToNana(text);
      
      // Log the response we get from the webhook
      console.log("Réponse reçue du webhook n8n:", response);
      
      console.log("Réponse complète reçue:", response);
      
      // Cas 1: Si la réponse est un string (ancienne implémentation)
      if (typeof response === 'string') {
        console.log("Réponse est un string, utilisation de la synthèse vocale:", response);
        if (isSpeechSupported) {
          speak(response);
        } else {
          console.warn("Synthèse vocale non supportée par ce navigateur");
          toast({
            title: "Message reçu",
            description: response,
            variant: "default"
          });
        }
        return;
      }
      
      // À partir d'ici on traite les objets de réponse
      
      // Cas 2: Si on a une URL audio (actuellement désactivé dans l'API)
      if (response?.audioUrl) {
        console.log("Lecture du fichier audio:", response.audioUrl);
        playAudio(response.audioUrl);
      }
      // Cas 3: Si on a du texte
      else if (response?.text) {
        console.log("Utilisation de la synthèse vocale:", response.text);
        if (isSpeechSupported) {
          speak(response.text);
        } else {
          console.warn("Synthèse vocale non supportée par ce navigateur");
          toast({
            title: "Message reçu",
            description: response.text,
            variant: "default"
          });
        }
      }
      // Cas 4: Si on a un fichier audio mais pas d'URL, on simule la parole
      else if (response?.mimeType && response.mimeType.includes('audio')) {
        console.log("Simulation de parole pour un fichier audio non accessible");
        // Utilisez le playAudio sans URL pour simuler la parole
        playAudio();
        
        toast({
          title: "Information",
          description: "Un fichier audio a été généré mais n'est pas accessible directement.",
          variant: "default"
        });
      }
      // Cas 5: Aucune information exploitable
      else {
        console.error("Aucune réponse valide reçue:", response);
        toast({
          title: "Erreur de format",
          description: "La réponse du serveur n'est pas dans un format utilisable.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing input:', error);
      toast({
        title: "Erreur de communication",
        description: "Impossible de communiquer avec NANA pour le moment.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle form submission for text input
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userMessage.trim()) return;
    
    // Stop any ongoing audio or speech
    if (isSpeaking) {
      stopSpeaking();
    }
    
    if (isPlayingAudio) {
      stopAudio();
    }
    
    processUserInput(userMessage);
    setUserMessage("");
  };

  return (
    <div className="min-h-screen nana-container">
      <main className="h-full flex flex-col items-center justify-center py-8">
        {/* Nana Face */}
        <div className="flex-grow flex items-center justify-center w-full">
          <NanaFace 
            isTalking={isTalking} 
            isListening={isListening} 
            isProcessing={isProcessing}
            currentVolume={currentVolume}
          />
        </div>
        
        {/* Input Area */}
        <div className="input-container">
          <form onSubmit={handleSubmit} className="flex items-center w-full gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Écrivez un message..."
              className="message-input"
              value={userMessage}
              onChange={e => setUserMessage(e.target.value)}
              disabled={isProcessing || isListening}
            />
            
            <button
              type="button"
              onClick={handleToggleListen}
              disabled={isProcessing}
              className={`control-button p-3 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="6" width="12" height="12"></rect>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" x2="12" y1="19" y2="22"></line>
                </svg>
              )}
            </button>
            
            <button
              type="submit"
              disabled={isProcessing || isListening || !userMessage.trim()}
              className="control-button px-4 py-2"
            >
              Envoyer
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
