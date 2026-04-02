import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 🧘 FOCUS MODE HOOK (SENTIENT EDITION)
 * This hook manages the 'visibility' state of the UI elements.
 * It detects user activity (touches, clicks, scrolls, moves) and handles 
 * the automatic fading of headers and footers to create an 
 * 'invisible' immersive experience.
 * 
 * UPGRADE: Now uses CAPTURE phase listeners to ensure it detects
 * interactions even if child components call stopPropagation().
 */
export function useFocusMode(timeout: number = 6000) {
  const [isFocused, setIsFocused] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInteraction = useCallback(() => {
    // ⚡ INSTANT RECOVERY: Clear focus state on first hint of movement
    setIsFocused(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Start the countdown to 'Invisibility'
    timerRef.current = setTimeout(() => {
      setIsFocused(true);
    }, timeout);
  }, [timeout]);

  useEffect(() => {
    // List of events that prove the user is active
    const events = [
      'touchstart', 
      'mousedown', 
      'mousemove', 
      'keydown', 
      'scroll', 
      'wheel', 
      'click',
      'pointerdown'
    ];

    // 🛡️ CAPTURE PHASE: We listen at the document level in the capture phase.
    // This allows us to see events before they reach components that might 
    // block them (like swipe containers or complex button logic).
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { 
        capture: true, 
        passive: true 
      });
    });

    // Initial trigger to start the first timer
    handleInteraction();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction, { capture: true });
      });
    };
  }, [handleInteraction]);

  return { 
    isFocused: isFocused && !isManualOverride, 
    setIsManualOverride 
  };
}
