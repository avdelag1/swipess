/**
 * AUDIO SOUND EFFECT SYNTHESIZER
 * 
 * Generates beautiful, lightweight UI sound effects using the Web Audio API.
 * No external .mp3 files needed. This ensures instant playback without network delay.
 */

// We keep a single AudioContext to comply with browser autoplay policies.
let audioCtx: AudioContext | null = null;
let _soundsEnabled = true;

export const initAudio = () => {
  if (typeof window === "undefined") return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const setSoundsEnabled = (enabled: boolean) => {
  _soundsEnabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem('swipess_sounds_enabled', JSON.stringify(enabled));
  }
};

export const isSoundsEnabled = () => {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem('swipess_sounds_enabled');
  if (stored !== null) {
    _soundsEnabled = JSON.parse(stored);
  }
  return _soundsEnabled;
};

// Internal function to create a quick oscillator
const createOscillator = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
  if (!_soundsEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  // Envelope
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
};

// ── CUSTOM SOUNDSCAPES ──────────────────────────────────────────────────────

export const playPopSound = () => {
  if (!_soundsEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
};

export const playSuccessSound = () => {
  if (!_soundsEnabled) return;
  setTimeout(() => createOscillator(523.25, 'sine', 0.2, 0.15), 0); // C5
  setTimeout(() => createOscillator(659.25, 'sine', 0.2, 0.15), 100); // E5
  setTimeout(() => createOscillator(783.99, 'sine', 0.4, 0.15), 200); // G5
};

export const playNotificationSound = () => {
  if (!_soundsEnabled) return;
  setTimeout(() => createOscillator(880, 'sine', 0.4, 0.2), 0); // A5
  setTimeout(() => createOscillator(1108.73, 'sine', 0.6, 0.2), 150); // C#6
};

// Ethereal / AI Welcome sound
export const playAiWelcomeSound = () => {
  if (!_soundsEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc1.type = 'sine';
  osc2.type = 'triangle';
  
  osc1.frequency.setValueAtTime(329.63, audioCtx.currentTime); // E4
  osc2.frequency.setValueAtTime(415.30, audioCtx.currentTime); // G#4

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.2); // Fade in
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5); // Long fade out

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc1.start();
  osc2.start();
  osc1.stop(audioCtx.currentTime + 1.5);
  osc2.stop(audioCtx.currentTime + 1.5);
};

export const playAiMessageSound = () => {
  if (!_soundsEnabled) return;
  createOscillator(900, 'sine', 0.1, 0.05);
};

export const playAiCharacterChange = () => {
  if (!_soundsEnabled) return;
  // Brighter, more vibrant glissando for Mexican-inspired character swaps
  setTimeout(() => createOscillator(523.25, 'triangle', 0.08, 0.1), 0);
  setTimeout(() => createOscillator(659.25, 'triangle', 0.08, 0.1), 60);
  setTimeout(() => createOscillator(783.99, 'triangle', 0.15, 0.1), 120);
};

// Auto-initialize memory state
isSoundsEnabled();
