import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface NanaFaceProps {
  isTalking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  currentVolume?: number;
}

export default function NanaFace({ 
  isTalking, 
  isListening, 
  isProcessing,
  currentVolume = 0
}: NanaFaceProps) {
  const leftEyeRef = useRef<SVGGElement>(null);
  const rightEyeRef = useRef<SVGGElement>(null);
  const leftPupilRef = useRef<SVGCircleElement>(null);
  const rightPupilRef = useRef<SVGCircleElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const mouthControlPointRef = useRef<{ x: number, y: number }>({ x: 100, y: 100 });
  const containerRef = useRef<HTMLDivElement>(null);
  const mouthTweenRef = useRef<gsap.core.Tween | null>(null);
  const [glowIntensity, setGlowIntensity] = useState(2); // Control glow intensity with state

  // Glow effect based on state
  const glowClass = isListening ? "intense-glow" : "glow-effect";

  // Handle mouth animation based on volume
  useEffect(() => {
    if (!mouthRef.current) return;
    
    if (isTalking) {
      // Cancel any existing tween
      if (mouthTweenRef.current) {
        mouthTweenRef.current.kill();
      }
      
      // Map the volume value (0-1) to a mouth shape
      // The higher the volume, the more open the mouth
      const baseY = 90;      // Base position when mouth is "closed"
      const maxOpenY = 110;  // Maximum openness based on volume
      
      // Calculate new control point Y based on volume
      const newY = baseY + (maxOpenY - baseY) * Math.min(currentVolume * 2, 1);
      
      // Animate to the new mouth shape with easing
      mouthTweenRef.current = gsap.to(mouthControlPointRef.current, {
        y: newY,
        duration: 0.1, // Fast reaction to volume changes
        ease: "power2.out",
        onUpdate: () => {
          // Update the path
          const { x, y } = mouthControlPointRef.current;
          mouthRef.current?.setAttribute(
            'd', 
            `M 75 90 Q ${x} ${y}, 125 90`
          );
        }
      });
      
      // Update the glow intensity based on volume
      const newGlowIntensity = 2 + currentVolume * 5;
      setGlowIntensity(newGlowIntensity);
    } else {
      // When not talking, animate back to default smile
      if (mouthTweenRef.current) {
        mouthTweenRef.current.kill();
      }
      
      // Return to neutral smile with a nicer bounce
      mouthTweenRef.current = gsap.to(mouthControlPointRef.current, {
        y: 100,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)",
        onUpdate: () => {
          const { x, y } = mouthControlPointRef.current;
          mouthRef.current?.setAttribute(
            'd', 
            `M 75 90 Q ${x} ${y}, 125 90`
          );
        }
      });
      
      // Reset glow to default with animation
      gsap.to({}, {
        duration: 0.4,
        onUpdate: () => {
          setGlowIntensity(prev => Math.max(2, prev * 0.95));
        }
      });
    }
  }, [isTalking, currentVolume]);

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

  // Random blinking with GSAP - corrected to return eyes fully open after blink
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const blink = () => {
      if (leftEyeRef.current && rightEyeRef.current) {
        gsap.timeline({
          onComplete: () => {
            timeoutId = setTimeout(blink, Math.random() * 4000 + 3000);
          }
        })
        .to([leftEyeRef.current, rightEyeRef.current], {
          scaleY: 0.1,
          duration: 0.12,
          ease: "power1.inOut"
        })
        .to([leftEyeRef.current, rightEyeRef.current], {
          scaleY: 1,
          duration: 0.3,
          ease: "power1.inOut"
        });
      } else {
        timeoutId = setTimeout(blink, 3000);
      }
    };

    blink();

    return () => clearTimeout(timeoutId);
  }, []);

  /*
  // Alternative: Pure CSS blinking animation
  // Add this CSS to your styles (e.g. in client/src/index.css or styled-components)
  //
  // @keyframes blink {
  //   0%, 20%, 40%, 60%, 80%, 100% { transform: scaleY(1); }
  //   10%, 30%, 50%, 70%, 90% { transform: scaleY(0.1); }
  // }
  //
  // .eye {
  //   animation: blink 6s infinite;
  //   animation-timing-function: ease-in-out;
  //   animation-delay: calc(var(--blink-delay, 0s));
  // }
  //
  // To randomize delay per eye, you can set inline style or CSS variable:
  // style={{ '--blink-delay': '2s' }} as React.CSSProperties
  //
  // Then remove the GSAP blinking useEffect above.
  */

  // Generate dynamic filter for mouth glow
  const mouthGlowFilter = `drop-shadow(0 0 ${glowIntensity}px rgba(0, 191, 255, 0.8))`;

  return (
    <div ref={containerRef} className="face-container">
      <svg viewBox="0 0 200 130" className="w-full h-full">
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
          d="M 75 90 Q 100 100, 125 90" 
          stroke="#00BFFF" 
          strokeWidth="4" 
          fill="none" 
          strokeLinecap="round"
          style={{ filter: mouthGlowFilter }}
        />
      </svg>
    </div>
  );
}
