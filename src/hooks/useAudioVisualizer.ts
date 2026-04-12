import { useState, useEffect, useRef } from 'react';

/**
 * useAudioVisualizer - High-performance Web Audio API hook
 * Provides real-time frequency data for "Liquid" UI ripples.
 * Hardware-Aware: Automatically cleans up and handles permissions.
 */
export function useAudioVisualizer(isActive: boolean) {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      cleanup();
      return;
    }

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyzer = ctx.createAnalyser();
        analyzer.fftSize = 64; // Low FFT for high-performance ripples
        source.connect(analyzer);
        analyzerRef.current = analyzer;

        const dataArray = new Uint8Array(analyzer.frequencyBinCount);

        const update = () => {
          if (!analyzerRef.current) return;
          analyzerRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average "energy" for the pulse
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVolume(avg / 255); // Normalize to 0-1
          
          animationRef.current = requestAnimationFrame(update);
        };

        update();
      } catch (err) {
        console.warn('[AudioVisualizer] Access denied or not supported', err);
      }
    }

    initAudio();

    return cleanup;
  }, [isActive]);

  const cleanup = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    setVolume(0);
  };

  return volume;
}
