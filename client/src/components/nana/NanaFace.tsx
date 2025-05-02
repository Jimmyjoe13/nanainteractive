import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface NanaFaceProps {
  isTalking: boolean;
  isListening: boolean;
  isProcessing: boolean;
}

export default function NanaFace({ isTalking, isListening, isProcessing }: NanaFaceProps) {
  const faceRef = useRef<SVGCircleElement>(null);
  const leftEyeRef = useRef<SVGGElement>(null);
  const rightEyeRef = useRef<SVGGElement>(null);
  const leftEyebrowRef = useRef<SVGPathElement>(null);
  const rightEyebrowRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set face color based on state
  useEffect(() => {
    if (!faceRef.current) return;
    
    if (isListening) {
      faceRef.current.setAttribute("stroke", "#FF6B6B"); // Error color
    } else if (isProcessing) {
      faceRef.current.setAttribute("stroke", "#FFD166"); // Accent color
    } else {
      faceRef.current.setAttribute("stroke", "#FF6B9D"); // Primary color
    }
  }, [isListening, isProcessing]);

  // Setup eye tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isTalking || !containerRef.current || !leftEyeRef.current || !rightEyeRef.current || !leftEyebrowRef.current || !rightEyebrowRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const faceCenterX = containerRect.left + containerRect.width / 2;
      const faceCenterY = containerRect.top + containerRect.height / 2;
      
      // Calculate angle and distance for eye movement
      const angle = Math.atan2(e.clientY - faceCenterY, e.clientX - faceCenterX);
      const distance = Math.min(3, Math.sqrt(Math.pow(e.clientX - faceCenterX, 2) + Math.pow(e.clientY - faceCenterY, 2)) / 100);
      
      // Move eyes
      const eyeX = Math.cos(angle) * distance;
      const eyeY = Math.sin(angle) * distance;
      
      gsap.to(leftEyeRef.current, { 
        attr: { transform: `translate(${40 + eyeX}, ${50 + eyeY})` },
        duration: 0.2
      });
      
      gsap.to(rightEyeRef.current, { 
        attr: { transform: `translate(${90 + eyeX}, ${50 + eyeY})` },
        duration: 0.2
      });
      
      // Move eyebrows slightly based on Y position
      const eyebrowYOffset = e.clientY < faceCenterY ? -1 : 0;
      
      leftEyebrowRef.current.setAttribute('d', `M 35 ${40 + eyebrowYOffset} Q 40 ${37 + eyebrowYOffset}, 45 ${40 + eyebrowYOffset}`);
      rightEyebrowRef.current.setAttribute('d', `M 85 ${40 + eyebrowYOffset} Q 90 ${37 + eyebrowYOffset}, 95 ${40 + eyebrowYOffset}`);
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isTalking]);

  return (
    <div ref={containerRef} className="face-container">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-light/30 to-secondary-light/30 rounded-full blur-xl transform scale-90 opacity-80 glow-effect"></div>
      
      <svg viewBox="0 0 130 130" className={`w-full h-full ${isTalking ? 'talking' : ''}`}>
        {/* Face Shape */}
        <circle 
          ref={faceRef}
          id="face" 
          cx="65" 
          cy="65" 
          r="60" 
          fill="#FFF7FB" 
          stroke="#FF6B9D" 
          strokeWidth="1.5" 
        />
        
        {/* Eyes Container */}
        <g id="eyes-container">
          {/* Left Eye */}
          <g ref={leftEyeRef} className="eye" id="left-eye" transform="translate(40, 50)">
            <circle cx="0" cy="0" r="8" fill="white" stroke="#8A4FFF" strokeWidth="1" />
            <circle className="eye-lid" cx="0" cy="0" r="3" fill="#212529" />
          </g>
          
          {/* Right Eye */}
          <g ref={rightEyeRef} className="eye" id="right-eye" transform="translate(90, 50)">
            <circle cx="0" cy="0" r="8" fill="white" stroke="#8A4FFF" strokeWidth="1" />
            <circle className="eye-lid" cx="0" cy="0" r="3" fill="#212529" />
          </g>
          
          {/* Eyebrows */}
          <path 
            ref={leftEyebrowRef}
            id="left-eyebrow" 
            d="M 35 40 Q 40 37, 45 40" 
            stroke="#FF6B9D" 
            strokeWidth="2" 
            fill="none" 
          />
          <path 
            ref={rightEyebrowRef}
            id="right-eyebrow" 
            d="M 85 40 Q 90 37, 95 40" 
            stroke="#FF6B9D" 
            strokeWidth="2" 
            fill="none" 
          />
        </g>
        
        {/* Mouth */}
        <path className="mouth" d="M 50 70 Q 65 75, 80 70" stroke="#FF6B9D" strokeWidth="2" fill="none" />
        
        {/* Blush */}
        <circle cx="38" cy="65" r="5" fill="#FFADC9" opacity="0.5" />
        <circle cx="92" cy="65" r="5" fill="#FFADC9" opacity="0.5" />
      </svg>
    </div>
  );
}
