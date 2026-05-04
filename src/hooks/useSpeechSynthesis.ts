import { useCallback, useRef, useState } from 'react';

export type VoiceProfile = {
  lang?: string;
  gender?: 'male' | 'female';
  // Ordered list of preferred voice name fragments (case-insensitive)
  preferredNames?: string[];
  rate?: number;
  pitch?: number;
};

// Curated voice hints that work across most browsers / OSes.
// We try platform-specific premium voices first, then fall back gracefully.
export const PERSONA_VOICE_PROFILES: Record<string, VoiceProfile> = {
  // Neutral assistant
  default: {
    lang: 'en-US',
    gender: 'female',
    preferredNames: ['Samantha', 'Google US English', 'Microsoft Aria', 'Jenny'],
    rate: 1.0, pitch: 1.05,
  },
  // Kyle — Market Hustler (energetic American male, Boston vibe)
  kyle: {
    lang: 'en-US',
    gender: 'male',
    preferredNames: ['Aaron', 'Fred', 'Microsoft Guy', 'Microsoft Davis', 'Google US English Male', 'Daniel'],
    rate: 1.08, pitch: 0.95,
  },
  // Beau Gosse — Social Alpha (young friendly male)
  beaugosse: {
    lang: 'en-US',
    gender: 'male',
    preferredNames: ['Alex', 'Microsoft Andrew', 'Google UK English Male', 'Oliver'],
    rate: 1.05, pitch: 1.1,
  },
  // Don Aj K'iin — Mayan Wisdom (Mexican Spanish male)
  donajkiin: {
    lang: 'es-MX',
    gender: 'male',
    preferredNames: ['Jorge', 'Juan', 'Diego', 'Microsoft Jorge', 'Google español de Estados Unidos', 'Paulina'],
    rate: 0.92, pitch: 0.9,
  },
  // Bot Better — Luxury Analyst (refined female)
  botbetter: {
    lang: 'en-GB',
    gender: 'female',
    preferredNames: ['Serena', 'Kate', 'Microsoft Libby', 'Google UK English Female', 'Fiona'],
    rate: 0.98, pitch: 1.05,
  },
  // Luna Shanti — Boho Spirit (soft warm female)
  lunashanti: {
    lang: 'en-US',
    gender: 'female',
    preferredNames: ['Moira', 'Karen', 'Tessa', 'Microsoft Ava', 'Samantha'],
    rate: 0.95, pitch: 1.15,
  },
  // Ezriyah — Integration Coach (calm grounded male)
  ezriyah: {
    lang: 'en-US',
    gender: 'male',
    preferredNames: ['Daniel', 'Microsoft Brian', 'Google UK English Male', 'Rishi'],
    rate: 0.97, pitch: 0.92,
  },
};

const FEMALE_HINTS = ['female', 'samantha', 'victoria', 'karen', 'serena', 'moira', 'tessa', 'fiona', 'kate', 'ava', 'aria', 'jenny', 'libby', 'paulina', 'monica', 'allison', 'susan', 'zira'];
const MALE_HINTS = ['male', 'daniel', 'alex', 'fred', 'aaron', 'oliver', 'rishi', 'jorge', 'juan', 'diego', 'guy', 'davis', 'andrew', 'brian', 'tom', 'george'];

function pickVoice(voices: SpeechSynthesisVoice[], profile?: VoiceProfile) {
  if (!voices.length || !profile) return null;
  const lower = (s: string) => s.toLowerCase();

  // 1. preferred names exact-ish match
  if (profile.preferredNames) {
    for (const name of profile.preferredNames) {
      const n = lower(name);
      const v = voices.find(v => lower(v.name).includes(n));
      if (v) return v;
    }
  }
  // 2. lang + gender heuristic
  const langMatches = profile.lang
    ? voices.filter(v => v.lang.toLowerCase().startsWith(profile.lang!.toLowerCase().slice(0, 2)))
    : voices;
  if (profile.gender) {
    const hints = profile.gender === 'female' ? FEMALE_HINTS : MALE_HINTS;
    const v = langMatches.find(v => hints.some(h => lower(v.name).includes(h)));
    if (v) return v;
  }
  return langMatches[0] || voices[0];
}

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

  const speak = useCallback((text: string, profileOrName?: VoiceProfile | string) => {
    if (!synthRef.current) return;

    // Stop current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const voices = synthRef.current.getVoices();
    let profile: VoiceProfile | undefined;
    if (typeof profileOrName === 'string') {
      profile = { preferredNames: [profileOrName] };
    } else if (profileOrName) {
      profile = profileOrName;
    }

    const selected = pickVoice(voices, profile);
    if (selected) utterance.voice = selected;
    if (profile?.lang) utterance.lang = profile.lang;

    utterance.rate = profile?.rate ?? 1.0;
    utterance.pitch = profile?.pitch ?? 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, []);

  return { speak, stop, isSpeaking };
}
