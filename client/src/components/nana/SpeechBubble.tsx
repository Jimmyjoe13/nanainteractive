import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface SpeechBubbleProps {
  text: string;
  isVisible: boolean;
}

export default function SpeechBubble({ text, isVisible }: SpeechBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!bubbleRef.current) return;
    
    if (isVisible && text) {
      gsap.fromTo(
        bubbleRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    } else {
      gsap.to(bubbleRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
    }
  }, [isVisible, text]);

  if (!text) return null;

  return (
    <div 
      ref={bubbleRef}
      className={`relative mt-6 bg-white p-4 rounded-lg shadow-md border border-neutral-200 w-full md:w-3/4 min-h-[80px] ${!isVisible && 'hidden'}`}
    >
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-neutral-200 rotate-45"></div>
      <p className="text-center text-neutral-700">{text}</p>
    </div>
  );
}
