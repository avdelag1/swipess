import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Universal voice-to-text hook.
 *
 * Records audio via MediaRecorder (works on iOS Safari, in-app browsers, Android,
 * desktop) and sends it to the `voice-transcribe` edge function for STT via the
 * Production AI gateway. Used as a fallback when the Web Speech API is unavailable
 * or denied — which is the case on most iOS Safari configurations that Apple
 * App Review will test against.
 */

const TRANSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`;

export interface UseVoiceTranscribeResult {
  isRecording: boolean;
  isTranscribing: boolean;
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
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize)) as unknown as number[],
    );
  }
  return btoa(binary);
}

export function useVoiceTranscribe(): UseVoiceTranscribeResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>('');
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount: stop recorder + release media stream
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch { /* already stopped */ }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      recorderRef.current = null;
      chunksRef.current = [];
      setIsRecording(false);
      setIsTranscribing(false);
    };
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
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
      recorder.start(250);
      recorderRef.current = recorder;
      if (mountedRef.current) setIsRecording(true);
      return true;
    } catch (err) {
      const msg = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Microphone permission denied — enable in browser settings'
        : err instanceof DOMException && err.name === 'NotFoundError'
          ? 'No microphone device found'
          : 'Microphone access failed — check device permissions';
      setLastError(msg);
      console.error('[useVoiceTranscribe] start failed', err);
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
      setLastError('Recording too short — hold the mic button while speaking');
      return '';
    }

    if (mountedRef.current) setIsTranscribing(true);
    setLastError(null);
    try {
      const base64 = await blobToBase64(finalBlob);
      const mimeType = finalBlob.type || mimeRef.current || 'audio/webm';
      const language =
        typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

      const resp = await fetch(TRANSCRIBE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ audio: base64, mimeType, language }),
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        setLastError('Voice transcription service unavailable — try again');
        console.error('[useVoiceTranscribe] gateway error', resp.status, errBody);
        return '';
      }
      const data = await resp.json();
      return typeof data?.text === 'string' ? data.text.trim() : '';
    } catch (err) {
      setLastError('Network error — check your connection');
      console.error('[useVoiceTranscribe] transcription failed', err);
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
    setLastError(null);
  }, [cleanupStream]);

  return { isRecording, isTranscribing, lastError, start, stop, cancel };
}
