import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/utils/prodLogger';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';

/**
 * Universal voice-to-text hook.
 *
 * Records audio via MediaRecorder (works on iOS Safari, in-app browsers, Android,
 * desktop) and sends it to the `voice-transcribe` edge function for STT via the
 * Production AI gateway. Used as a fallback when the Web Speech API is unavailable
 * or denied — which is the case on most iOS Safari configurations that Apple
 * App Review will test against.
 */

export interface UseVoiceTranscribeResult {
  isRecording: boolean;
  isTranscribing: boolean;
  interimTranscript: string;
  /** Why the last start() call failed, if it did. Null on success. */
  lastError: string | null;
  start: () => Promise<boolean>;
  stop: () => Promise<string>;
  cancel: () => void;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
  ];
  for (const t of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      // ignore
    }
  }
  return '';
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface UseVoiceTranscribeOptions {
  onStop?: (text: string) => void;
  onVolumeChange?: (volume: number) => void;
  /** Fires on every live Web Speech update with the full running transcript so
   *  callers can show words as they're spoken (no-op where Web Speech is
   *  unavailable, e.g. most iOS Safari — those still get the final via onStop). */
  onInterim?: (text: string) => void;
}

export function useVoiceTranscribe(options?: UseVoiceTranscribeOptions): UseVoiceTranscribeResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; }, [options]);

  const stopFunctionRef = useRef<(() => Promise<string>) | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>('');
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);
  // Latest live Web Speech transcript, used as a fallback if the Whisper backend
  // fails so we never throw away words the user already saw on screen.
  const interimRef = useRef('');

  // Cleanup on unmount: stop recorder + release media stream
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch { /* already stopped */ }
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      recorderRef.current = null;
      recognitionRef.current = null;
      chunksRef.current = [];
      setIsRecording(false);
      setIsTranscribing(false);
      setInterimTranscript('');
    };
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    recorderRef.current = null;
    recognitionRef.current = null;
    chunksRef.current = [];
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setLastError('Microphone not supported in this browser');
      return false;
    }
    try {
      cancelledRef.current = false;
      setLastError(null);
      // Pre-check permission state when supported (Chromium/Safari 16+)
      try {
        // @ts-expect-error - permissions API typing varies
        const status = await navigator.permissions?.query?.({ name: 'microphone' as PermissionName });
        if (status?.state === 'denied') {
          setLastError('Microphone permission denied — enable in browser settings');
          return false;
        }
      } catch {
        // permissions API not available — fall through to getUserMedia
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      setLastError(null);



      const mimeType = pickMimeType();
      mimeRef.current = mimeType;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      setInterimTranscript('');
      interimRef.current = '';
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';
        recognition.onresult = (e: any) => {
          // Accumulate the whole transcript (finalized + in-progress) from index
          // 0 so already-spoken words stay on screen instead of disappearing as
          // each phrase finalizes.
          let full = '';
          for (let i = 0; i < e.results.length; ++i) {
            full += e.results[i][0]?.transcript ?? '';
          }
          const live = full.trim();
          interimRef.current = live;
          setInterimTranscript(live);
          if (optionsRef.current?.onInterim) optionsRef.current.onInterim(live);
        };
        recognitionRef.current = recognition;
        try { recognition.start(); } catch (e) { logger.error('SpeechRec start failed', e); }
      }
      
      recorder.start(250);
      recorderRef.current = recorder;

      // Silence auto-stop lives in the isRecording effect below — it closes its
      // AudioContext on cleanup (iOS Safari caps live contexts, so leaking one
      // per recording breaks the mic after a few uses).

      if (mountedRef.current) setIsRecording(true);
      return true;
    } catch (err) {
      const msg = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Microphone permission denied — enable in browser settings'
        : err instanceof DOMException && err.name === 'NotFoundError'
          ? 'No microphone device found'
          : 'Microphone access failed — check device permissions';
      setLastError(msg);
      logger.error('[useVoiceTranscribe] start failed', err);
      cleanupStream();
      if (mountedRef.current) setIsRecording(false);
      return false;
    }
  }, [cleanupStream]);

  const stop = useCallback(async (): Promise<string> => {
    const recorder = recorderRef.current;
    if (!recorder) {
      cleanupStream();
      if (mountedRef.current) setIsRecording(false);
      if (optionsRef.current?.onStop) optionsRef.current.onStop('');
      return '';
    }

    const finalBlob: Blob = await new Promise((resolve) => {
      recorder.onstop = () => {
        const type = mimeRef.current || recorder.mimeType || 'audio/webm';
        resolve(new Blob(chunksRef.current, { type }));
      };
      try {
        recorder.stop();
      } catch {
        resolve(new Blob(chunksRef.current, { type: mimeRef.current || 'audio/webm' }));
      }
    });

    cleanupStream();
    if (mountedRef.current) setIsRecording(false);

    if (cancelledRef.current) return '';
    if (!finalBlob || finalBlob.size < 800) {
      const msg = 'Recording too short — please speak longer';
      setLastError(msg);
      appToast.error(msg);
      if (optionsRef.current?.onStop) optionsRef.current.onStop('');
      return '';
    }

    if (mountedRef.current) setIsTranscribing(true);
    setLastError(null);
    // Captured before the async call so a backend failure can still surface the
    // words the user watched appear live.
    const liveFallback = interimRef.current.trim();
    try {
      const base64 = await blobToBase64(finalBlob);
      const mimeType = finalBlob.type || mimeRef.current || 'audio/webm';
      const language =
        typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

      const { data: respData, error: invokeError } = await supabase.functions.invoke('voice-transcribe', {
        body: { audio: base64, mimeType, language },
      });

      if (invokeError) {
        if (liveFallback) {
          if (optionsRef.current?.onStop) optionsRef.current.onStop(liveFallback);
          return liveFallback;
        }
        const msg = 'Voice transcription failed — please try again';
        setLastError(msg);
        appToast.error(msg);
        logger.error('[useVoiceTranscribe] invoke error', invokeError);
        if (optionsRef.current?.onStop) optionsRef.current.onStop('');
        return '';
      }
      const finalTxt = (typeof respData?.text === 'string' ? respData.text.trim() : '') || liveFallback;
      if (optionsRef.current?.onStop) optionsRef.current.onStop(finalTxt);
      return finalTxt;
    } catch (err) {
      if (liveFallback) {
        if (optionsRef.current?.onStop) optionsRef.current.onStop(liveFallback);
        return liveFallback;
      }
      const msg = 'Network error — check your connection';
      setLastError(msg);
      appToast.error(msg);
      logger.error('[useVoiceTranscribe] transcription failed', err);
      if (optionsRef.current?.onStop) optionsRef.current.onStop('');
      return '';
    } finally {
      if (mountedRef.current) setIsTranscribing(false);
    }
  }, [cleanupStream]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    cleanupStream();
    if (mountedRef.current) {
      setIsRecording(false);
      setIsTranscribing(false);
    }
    setInterimTranscript('');
    setLastError(null);
  }, [cleanupStream]);

  stopFunctionRef.current = stop;

  // Auto-stop on 5 seconds of silence
  useEffect(() => {
    if (!isRecording || !streamRef.current) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    let audioCtx: AudioContext;
    try { audioCtx = new AudioContextClass(); } catch { return; }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    let source: MediaStreamAudioSourceNode;
    try {
      source = audioCtx.createMediaStreamSource(streamRef.current);
      source.connect(analyser);
    } catch {
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let lastVoiceTime = Date.now();
    let animationFrameId: number;

    const checkSilence = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;

      if (optionsRef.current?.onVolumeChange) {
        optionsRef.current.onVolumeChange(avg);
      }

      if (avg > 5) { // Threshold for speaking
        lastVoiceTime = Date.now();
      } else if (Date.now() - lastVoiceTime > 5000) {
        if (stopFunctionRef.current) {
          appToast.info('Voice detected silence — auto-stopped');
          stopFunctionRef.current();
        }
        return;
      }
      animationFrameId = requestAnimationFrame(checkSilence);
    };
    checkSilence();

    return () => {
      cancelAnimationFrame(animationFrameId);
      try { source.disconnect(); } catch { /* ignore */ }
      try { audioCtx.close(); } catch { /* ignore */ }
    };
  }, [isRecording]);

  return { isRecording, isTranscribing, interimTranscript, lastError, start, stop, cancel };
}
