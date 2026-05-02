import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 🧘 FOCUS MODE HOOK
 * Shows the nav bars on load, hides them after `timeout` ms of inactivity.
 * Any touch, click, or scroll instantly restores them.
 *
 * Uses capture-phase listeners so swipe-card stopPropagation() calls
 * cannot block the wake-up signal.
 * 
 * UPGRADES:
 * - Window-level listeners for cross-browser stability
 * - custom 'swipess-ui-recovery' event for manual triggers
 * - Interaction throttling to prevent focus while active
 */
export function useFocusMode(timeout: number = 6000) {
  const [isFocused, setIsFocused] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());

  const handleInteraction = useCallback((_e?: Event) => {
    const now = Date.now();
    // ⚡ SPEED OF LIGHT: Throttle high-frequency updates to 100ms
    // to prevent CPU thrashing during smooth scrolls or fast pointer moves.
    if (now - lastInteractionRef.current < 100 && !isFocused) {
      return;
    }
    
    lastInteractionRef.current = now;
    
    // Bailout if already in the desired state (Visible)
    setIsFocused(prev => {
      if (!prev) return false;
      return false;
    });
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Start the countdown to 'Invisibility' (Focus Mode)
    timerRef.current = setTimeout(() => {
      setIsFocused(true);
    }, timeout);
  }, [timeout, isFocused]);

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
      'pointerdown',
      'pointermove', // More robust than mousemove for touch/pen
      'deviceorientation',
      'devicemotion'
    ];

    // 🛡️ CAPTURE PHASE: We listen at the document level in the capture phase.
    const captureOptions = { capture: true, passive: true };
    
    // 🌍 BROADCAST RECOVERY: Listen for a custom event that any component can fire 
    // to bring the UI back (e.g. after a swipe or a card dismiss)
    const handleBroadcast = () => handleInteraction();
    window.addEventListener('swipess-ui-recovery', handleBroadcast);
    
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, captureOptions);
      // Also listen on window for some events that might not bubble to document correctly on all browsers
      window.addEventListener(event, handleInteraction, captureOptions);
    });

    // Initial trigger to start the first timer
    handleInteraction();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.removeEventListener('swipess-ui-recovery', handleBroadcast);
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction, { capture: true });
        window.removeEventListener(event, handleInteraction, { capture: true });
      });
    };
  }, [handleInteraction]);

  return { 
    isFocused: isFocused && !isManualOverride, 
    setIsManualOverride,
    resetFocus: handleInteraction
  };
}


