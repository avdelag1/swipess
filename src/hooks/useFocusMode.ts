import { useState, useEffect, useCallback } from 'react';

/**
 * 🧘 FOCUS MODE HOOK
 * This hook manages the 'visibility' state of the UI elements.
 * It detects user activity (touches, clicks, scrolls) and handles 
 * the automatic fading of headers and footers to create an 
 * 'invisible' immersive experience.
 */
export function useFocusMode(timeout: number = 3000) {
  const [isFocused, setIsFocused] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);

  const resetFocus = useCallback(() => {
    setIsFocused(false);
  }, []);

  useEffect(() => {
    let focusTimer: ReturnType<typeof setTimeout>;

    const handleInteraction = () => {
      setIsFocused(false);
      clearTimeout(focusTimer);
      focusTimer = setTimeout(() => {
        setIsFocused(true);
      }, timeout);
    };

    // Listen for any user input
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('mousedown', handleInteraction, { passive: true });
    window.addEventListener('scroll', handleInteraction, { passive: true });

    // Initial trigger
    handleInteraction();

    return () => {
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      clearTimeout(focusTimer);
    };
  }, [timeout]);

  return { 
    isFocused: isFocused && !isManualOverride, 
    setIsManualOverride 
  };
}
