import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NanaFace from "@/components/nana/NanaFace";
import SpeechBubble from "@/components/nana/SpeechBubble";
import ControlPanel from "@/components/nana/ControlPanel";
import StatusIndicator from "@/components/nana/StatusIndicator";
import FeatureCard from "@/components/features/FeatureCard";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { sendMessageToNana } from "@/lib/nanaApi";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  
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
    
    // Hide speech bubble when starting to listen
    if (showSpeechBubble) {
      setShowSpeechBubble(false);
    }
    
    setIsListening(true);
    startListening();
  };
  
  // Process user input (either from voice or text)
  const processUserInput = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      // Stop listening and start processing
      setIsListening(false);
      stopListening();
      setIsProcessing(true);
      
      // Send to API
      const response = await sendMessageToNana(text);
      
      // Display and speak response
      setCurrentResponse(response);
      setShowSpeechBubble(true);
      
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
  
  // Handle sample question selection
  const handleSampleQuestion = (question: string) => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    }
    
    if (isSpeaking) {
      stopSpeaking();
    }
    
    processUserInput(question);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        {/* Introduction Section */}
        <section className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="font-quicksand font-bold text-3xl md:text-4xl text-secondary mb-4">
            Rencontrez NANA, votre assistante IA
          </h1>
          <p className="text-neutral-600 text-lg md:text-xl mb-6">
            Découvrez notre agent vocal intelligent qui simplifie l'usage de l'IA pour votre entreprise
          </p>
        </section>
        
        {/* Nana Character */}
        <section className="relative mb-12 w-full max-w-3xl flex flex-col items-center">
          <div id="nana-container" className="relative w-full flex flex-col items-center animate-float">
            {/* Face */}
            <NanaFace 
              isTalking={isTalking} 
              isListening={isListening} 
              isProcessing={isProcessing} 
            />
            
            {/* Speech Bubble */}
            <SpeechBubble 
              text={currentResponse} 
              isVisible={showSpeechBubble && !isProcessing && !isListening} 
            />
          </div>
          
          {/* Controls */}
          <ControlPanel 
            isListening={isListening}
            isProcessing={isProcessing}
            onToggleListen={handleToggleListen}
            onSampleQuestion={handleSampleQuestion}
          />
          
          {/* Status Indicator */}
          <StatusIndicator 
            isVisible={isListening || isProcessing}
            isListening={isListening}
            isProcessing={isProcessing}
          />
        </section>
        
        {/* Features Section */}
        <section className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            }
            title="Assistance IA"
            description="Des agents intelligents qui s'adaptent aux besoins spécifiques de votre entreprise"
            colorClass="bg-primary-light/30 text-primary"
          />
          
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            }
            title="Formation IA"
            description="Programmes de formation sur mesure pour intégrer l'IA à votre équipe"
            colorClass="bg-secondary-light/30 text-secondary"
          />
          
          <FeatureCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            }
            title="Innovation PME"
            description="Solutions IA accessibles pour booster la performance de votre entreprise"
            colorClass="bg-accent-light/30 text-accent-dark"
          />
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
