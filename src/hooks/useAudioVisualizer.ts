import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useAudioVisualizer - Simulated voice energy for UI ripple effects.
 * 
 * IMPORTANT: We do NOT open a second getUserMedia stream here.
 * On Android, opening two mic streams (one for SpeechRecognition + one here)
 * causes the browser to kill the SpeechRecognition session silently.
 * 
 * Instead, we expose a `pulse()` method that the speech recognition 
 * `onresult` handler calls to simulate voice energy for visual feedback.
 */
export function useAudioVisualizer(isActive: boolean) {
  const [volume, setVolume] = useState(0);
  const decayRef = useRef<number | null>(null);
  const lastPulseRef = useRef(0);

  // Decay the volume smoothly when no pulses arrive
  useEffect(() => {
    if (!isActive) {
      setVolume(0);
      if (decayRef.current) cancelAnimationFrame(decayRef.current);
      return;
    }

    const decay = () => {
      setVolume(prev => {
        const elapsed = Date.now() - lastPulseRef.current;
        // Decay after 150ms of no pulses
        if (elapsed > 150) {
          return prev * 0.88; // Smooth exponential decay
        }
        return prev;
      });
      decayRef.current = requestAnimationFrame(decay);
    };

    decayRef.current = requestAnimationFrame(decay);

    return () => {
      if (decayRef.current) cancelAnimationFrame(decayRef.current);
      setVolume(0);
    };
  }, [isActive]);

  // Call this from onresult to simulate voice energy
  const pulse = useCallback((intensity: number = 0.7) => {
    lastPulseRef.current = Date.now();
    // Add some randomness for organic feel
    const jitter = 0.8 + Math.random() * 0.4; // 0.8-1.2
    setVolume(Math.min(1, intensity * jitter));
  }, []);

  return { volume, pulse };
}
