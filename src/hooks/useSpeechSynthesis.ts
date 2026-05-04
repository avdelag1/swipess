import { useCallback, useRef, useState } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string, voiceName?: string) => {
    if (!synthRef.current) return;

    // Stop current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Try to find a good voice
    const voices = synthRef.current.getVoices();
    if (voiceName) {
      const selectedVoice = voices.find(v => v.name.includes(voiceName));
      if (selectedVoice) utterance.voice = selectedVoice;
    } else {
      // Default to a premium-sounding voice if available
      const preferred = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Daniel') || 
        v.name.includes('Google US English')
      );
      if (preferred) utterance.voice = preferred;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, []);

  return { speak, stop, isSpeaking };
}
