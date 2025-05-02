interface StatusIndicatorProps {
  isVisible: boolean;
  isListening: boolean;
  isProcessing: boolean;
}

export default function StatusIndicator({ isVisible, isListening, isProcessing }: StatusIndicatorProps) {
  if (!isVisible) return null;
  
  let statusText = '';
  let iconClass = '';
  
  if (isListening) {
    statusText = "J'écoute...";
    iconClass = "ri-mic-line";
  } else if (isProcessing) {
    statusText = "Nana réfléchit...";
    iconClass = "ri-loader-4-line animate-spin";
  }
  
  return (
    <div className="mt-6 text-center">
      <div className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-200 text-neutral-700">
        <span className={`mr-2 ${iconClass}`}>
          {isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          )}
        </span>
        <span>{statusText}</span>
      </div>
    </div>
  );
}
