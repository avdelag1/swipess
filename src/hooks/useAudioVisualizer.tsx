import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 🛰️ Swipess Audio Visualizer Hook v1.0
 * Provides real-time frequency data for immersive UI animations.
 * Integrates with MediaStream from useVoiceTranscribe or any audio source.
 */

export function useAudioVisualizer(stream: MediaStream | null) {
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(0));
  const [isReady, setIsReady] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    setIsReady(false);
  }, []);

  useEffect(() => {
    if (!stream) {
      cleanup();
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setIsReady(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        // Only trigger state update if there's actual activity to save CPU
        const hasActivity = dataArray.some(v => v > 0);
        if (hasActivity) {
          setFrequencyData(new Uint8Array(dataArray));
        }
        rafIdRef.current = requestAnimationFrame(update);
      };

      rafIdRef.current = requestAnimationFrame(update);
    } catch (err) {
      console.error('[AudioVisualizer] Failed to initialize:', err);
    }

    return cleanup;
  }, [stream, cleanup]);

  return {
    frequencyData,
    isReady,
    analyser: analyserRef.current
  };
}
