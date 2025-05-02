import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

interface ControlPanelProps {
  isListening: boolean;
  isProcessing: boolean;
  onToggleListen: () => void;
  onSampleQuestion: (question: string) => void;
}

export default function ControlPanel({ 
  isListening, 
  isProcessing, 
  onToggleListen, 
  onSampleQuestion 
}: ControlPanelProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const sampleQuestions = [
    "Que peut faire Nana-Intelligence?",
    "Comment l'IA peut aider ma PME?",
    "Quels sont vos services?"
  ];

  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setDropdownOpen(false);
    }
  };

  // Add click outside listener
  useState(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const handleSampleQuestion = (question: string) => {
    setDropdownOpen(false);
    onSampleQuestion(question);
  };
  
  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-xl">
      {/* Listening Button */}
      <button 
        onClick={onToggleListen}
        disabled={isProcessing}
        className={`py-3 px-6 rounded-full font-medium flex items-center justify-center gap-2 
          transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50 shadow-md 
          hover:shadow-lg w-full md:w-auto text-white
          ${isListening 
            ? 'bg-error hover:bg-error/90 focus:ring-error' 
            : 'bg-primary hover:bg-primary-dark focus:ring-primary'
          }
          ${isListening ? 'listening-indicator' : ''}
        `}
      >
        <span className={isListening ? "ri-stop-circle-line text-xl" : "ri-mic-line text-xl"}>
          {isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <rect x="9" y="9" width="6" height="6"></rect>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          )}
        </span>
        <span>{isListening ? 'Arrêter' : 'Parler à NANA'}</span>
      </button>
      
      {/* Sample Questions */}
      <div className="dropdown relative w-full md:w-auto" ref={dropdownRef}>
        <button 
          onClick={toggleDropdown}
          className="bg-secondary text-white py-3 px-6 rounded-full font-medium 
            flex items-center justify-center gap-2 transition-all hover:bg-secondary-dark 
            focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50 
            shadow-md hover:shadow-lg w-full"
        >
          <span className="text-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </span>
          <span>Questions suggérées</span>
        </button>
        
        <div className={`dropdown-content absolute z-10 mt-2 bg-white rounded-md shadow-lg p-2 w-full border border-neutral-200 ${!dropdownOpen && 'hidden'}`}>
          {sampleQuestions.map((question, index) => (
            <button 
              key={index}
              onClick={() => handleSampleQuestion(question)}
              className="block w-full text-left p-2 rounded hover:bg-neutral-100 text-neutral-700"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
