import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface NanaFaceProps {
  isTalking: boolean;
  isListening: boolean;
  isProcessing: boolean;
}

export default function NanaFace({ isTalking, isListening, isProcessing }: NanaFaceProps) {
  const leftEyeRef = useRef<SVGGElement>(null);
  const rightEyeRef = useRef<SVGGElement>(null);
  const leftPupilRef = useRef<SVGCircleElement>(null);
  const rightPupilRef = useRef<SVGCircleElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Glow effect based on state
  const glowClass = isListening ? "intense-glow" : "glow-effect";

  // Setup eye tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !leftPupilRef.current || !rightPupilRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const faceCenterX = containerRect.left + containerRect.width / 2;
      const faceCenterY = containerRect.top + containerRect.height / 2;
      
      // Calculate angle and distance for pupil movement
      const angle = Math.atan2(e.clientY - faceCenterY, e.clientX - faceCenterX);
      const distance = Math.min(2.5, Math.sqrt(Math.pow(e.clientX - faceCenterX, 2) + Math.pow(e.clientY - faceCenterY, 2)) / 100);
      
      // Move pupils
      const pupilX = Math.cos(angle) * distance;
      const pupilY = Math.sin(angle) * distance;
      
      gsap.to(leftPupilRef.current, { 
        cx: pupilX, 
        cy: pupilY,
        duration: 0.3
      });
      
      gsap.to(rightPupilRef.current, { 
        cx: pupilX, 
        cy: pupilY,
        duration: 0.3
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Random blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (leftEyeRef.current && rightEyeRef.current) {
        // Blink animation
        gsap.to([leftEyeRef.current, rightEyeRef.current], {
          scaleY: 0.1,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut"
        });
      }
    }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds
    
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div ref={containerRef} className="face-container">
      <svg viewBox="0 0 200 130" className={`w-full h-full ${isTalking ? 'talking' : ''}`}>
        {/* Eyes */}
        <g id="eyes-container" className={glowClass}>
          {/* Left Eye */}
          <g ref={leftEyeRef} className="eye" id="left-eye" transform="translate(65, 50)">
            <circle cx="0" cy="0" r="15" fill="#000000" stroke="#00BFFF" strokeWidth="4" />
            <circle ref={leftPupilRef} className="pupil" cx="0" cy="0" r="6" fill="#000000" />
            <circle className="eye-highlight" cx="2" cy="-2" r="2" />
          </g>
          
          {/* Right Eye */}
          <g ref={rightEyeRef} className="eye" id="right-eye" transform="translate(135, 50)">
            <circle cx="0" cy="0" r="15" fill="#000000" stroke="#00BFFF" strokeWidth="4" />
            <circle ref={rightPupilRef} className="pupil" cx="0" cy="0" r="6" fill="#000000" />
            <circle className="eye-highlight" cx="2" cy="-2" r="2" />
          </g>
        </g>
        
        {/* Mouth */}
        <path 
          ref={mouthRef}
          className={`mouth ${glowClass}`} 
          d="M 75 90 Q 100 100, 125 90" 
          stroke="#00BFFF" 
          strokeWidth="4" 
          fill="none" 
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
