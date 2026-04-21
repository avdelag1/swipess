import { useCallback, useRef, useState } from 'react';

/**
 * Universal voice-to-text hook.
 *
 * Records audio via MediaRecorder (works on iOS Safari, in-app browsers, Android,
 * desktop) and sends it to the `voice-transcribe` edge function for STT via the
 * Lovable AI gateway. Used as a fallback when the Web Speech API is unavailable
 * or denied — which is the case on most iOS Safari configurations that Apple
 * App Review will test against.
 */

const TRANSCRIBE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-transcribe`;

export interface UseVoiceTranscribeResult {
  isRecording: boolean;
  isTranscribing: boolean;
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

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>('');
  const cancelledRef = useRef(false);

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
      return false;
    }
    try {
      cancelledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

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
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('[useVoiceTranscribe] start failed', err);
      cleanupStream();
      setIsRecording(false);
      return false;
    }
  }, [cleanupStream]);

  const stop = useCallback(async (): Promise<string> => {
    const recorder = recorderRef.current;
    if (!recorder) {
      cleanupStream();
      setIsRecording(false);
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
    setIsRecording(false);

    if (cancelledRef.current) return '';
    if (!finalBlob || finalBlob.size < 800) {
      // Less than ~0.1s of audio — skip the round trip
      return '';
    }

    setIsTranscribing(true);
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
        console.error('[useVoiceTranscribe] gateway error', resp.status, errBody);
        return '';
      }
      const data = await resp.json();
      return typeof data?.text === 'string' ? data.text.trim() : '';
    } catch (err) {
      console.error('[useVoiceTranscribe] transcription failed', err);
      return '';
    } finally {
      setIsTranscribing(false);
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
    setIsRecording(false);
    setIsTranscribing(false);
  }, [cleanupStream]);

  return { isRecording, isTranscribing, start, stop, cancel };
}