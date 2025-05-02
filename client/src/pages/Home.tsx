import { useState, useEffect, useRef } from "react";
import NanaFace from "@/components/nana/NanaFace";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
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
  
  // Custom hooks for speech
  const { 
    startListening, 
    stopListening, 
    transcript, 
    isListeningSupported 
  } = useSpeechRecognition('fr-FR');
  
  const { 
    speak, 
    isSpeaking, 
    stopSpeaking, 
    isSpeechSupported 
  } = useSpeechSynthesis();
  
  // Check for transcript changes
  useEffect(() => {
    if (transcript && isListening) {
      processUserInput(transcript);
    }
  }, [transcript]);
  
  // Update isTalking when speaking status changes
  useEffect(() => {
    setIsTalking(isSpeaking);
  }, [isSpeaking]);

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
      // Stop listening and start processing
      if (isListening) {
        setIsListening(false);
        stopListening();
      }
      
      setIsProcessing(true);
      
      // Clear input field if this came from the text input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      
      // Send to API
      const response = await sendMessageToNana(text);
      
      // Speak response
      if (isSpeechSupported) {
        speak(response);
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
    
    if (isSpeaking) {
      stopSpeaking();
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
          />
        </div>
        
        {/* Input Area */}
        <div className="input-container">
          <form onSubmit={handleSubmit} className="flex items-center w-full gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
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
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
