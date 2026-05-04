/**
 * UISounds - Nexus Grade High-Fidelity Audio
 * Integrates premium external assets with synthetic fallback.
 * Tuned for a cinematic, tactile user experience.
 */

const NEXUS_SOUNDS = {
  WELCOME:      "/sounds/singing-bowl-gong-69238.mp3",
  LIKE:         "/sounds/duck-quack-like.mp3",
  DISLIKE:      "/sounds/deep-meditation-bell-hit-heart-dislike.mp3",
  NOTIFICATION: "/sounds/text-notification-96707.mp3",
  UPLOAD:       "/sounds/achievement-unlocked-463070.mp3",
};

const STAR_SOUNDS = [
  "/sounds/bells-1-72261.mp3",
  "/sounds/bells-2-31725.mp3",
  "/sounds/bell-a-99888.mp3",
  "/sounds/tuning-fork-440-hz-resonance-22406.mp3",
  "/sounds/singing-bowl-gong-69238.mp3",
  "/sounds/bell-meditation-75335.mp3",
  "/sounds/gong-bell-singing-bowl-modified-61150.mp3",
  "/sounds/deep-meditation-bell-hit-crown-chakra-7-186973.mp3",
  "/sounds/deep-meditation-bell-hit-heart-chakra-4-186970.mp3",
  "/sounds/deep-meditation-bell-hit-third-eye-chakra-6-186972.mp3",
  "/sounds/deep-meditation-bell-hit-throat-chakra-5-186971.mp3",
];

const BOWL_SOUNDS = [
  "/sounds/singing-bowl-gong-69238.mp3",
  "/sounds/gong-bell-singing-bowl-modified-61150.mp3",
  "/sounds/large-gong-2-232438.mp3",
  "/sounds/bell-meditation-75335.mp3",
  "/sounds/deep-meditation-bell-hit-root-chakra-1-174455.mp3",
];

interface ToneOptions {
  type?: OscillatorType;
  startFreq: number;
  endFreq?: number;
  gainAmount: number;
  duration: number;
  delay?: number;
  attack?: number;
  decay?: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private audioCache: Record<string, HTMLAudioElement> = {};

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private loadAndPlay(url: string, volume: number = 0.5) {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioCache[url]) {
        this.audioCache[url] = new Audio(url);
        this.audioCache[url].preload = 'auto';
      }
      const audio = this.audioCache[url];
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Silently handle autoplay blocks
      });
    } catch (e) {
      console.error("Audio error:", e);
    }
  }

  private tone(options: ToneOptions) {
    if (!this.ctx) return;
    const {
      type = 'sine',
      startFreq,
      endFreq,
      gainAmount,
      duration,
      delay = 0,
      attack = 0.005
    } = options;

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq && endFreq !== startFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainAmount, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // 🚀 NEXUS CORE SOUNDS
  public playWelcome() {
    this.loadAndPlay(NEXUS_SOUNDS.WELCOME, 0.6);
  }

  public playLike() {
    this.loadAndPlay(NEXUS_SOUNDS.LIKE, 0.7);
  }

  public playDislike() {
    this.loadAndPlay(NEXUS_SOUNDS.DISLIKE, 0.5);
  }

  public playNotification() {
    this.loadAndPlay(NEXUS_SOUNDS.NOTIFICATION, 0.4);
  }

  public playUploadComplete() {
    this.loadAndPlay(NEXUS_SOUNDS.UPLOAD, 0.5);
  }

  public playStarShoot() {
    const randomUrl = STAR_SOUNDS[Math.floor(Math.random() * STAR_SOUNDS.length)];
    this.loadAndPlay(randomUrl, 0.3);
  }

  // 🧪 TACTILE SYNTHETIC SOUNDS (Refined)
  public playWaterDrop() {
    try {
      this.init();
      if (!this.ctx) return;
      this.tone({ type: 'sine', startFreq: 1400, endFreq: 1800, gainAmount: 0.1, duration: 0.08, attack: 0.005 });
    } catch (_e) {}
  }

  public playZenBowl() {
    const url = BOWL_SOUNDS[Math.floor(Math.random() * BOWL_SOUNDS.length)];
    this.loadAndPlay(url, 0.45);
  }

  public playTap() {
    // 🪵 SUBTLE TACTILE POP
    try {
      this.init();
      if (!this.ctx) return;
      this.tone({ type: 'sine', startFreq: 300, endFreq: 150, gainAmount: 0.05, duration: 0.03 });
    } catch (_e) {}
  }

  public playPing() {
    this.playWaterDrop();
  }

  public playCategorySelect() {
    try {
      this.init();
      if (!this.ctx) return;
      this.tone({ type: 'sine', startFreq: 800, endFreq: 1200, gainAmount: 0.04, duration: 0.04, attack: 0.005 });
    } catch (_e) {}
  }

  public playCardSwipe(direction: 'left' | 'right' = 'right') {
    if (direction === 'right') {
      this.playLike();
    } else {
      this.playDislike();
    }
  }

  public playSwitch() {
    try {
      this.init();
      if (!this.ctx) return;
      this.tone({ type: 'sine', startFreq: 660, endFreq: 440, gainAmount: 0.012, duration: 0.06 });
    } catch (_e) {}
  }

  public playMicOn() {
    try {
      this.init();
      if (!this.ctx) return;
      this.tone({ type: 'sine', startFreq: 220, endFreq: 440, gainAmount: 0.02, duration: 0.1 });
    } catch (_e) {}
  }

  public playMicOff() {
    try {
      this.init();
      if (!this.ctx) return;
      this.tone({ type: 'sine', startFreq: 440, endFreq: 220, gainAmount: 0.018, duration: 0.08 });
    } catch (_e) {}
  }

  public playPop(_volume: number = 1) {
    try {
      this.init();
      if (!this.ctx) return;
      this.tone({ type: 'sine', startFreq: 600, endFreq: 200, gainAmount: 0.06, duration: 0.05 });
    } catch (_e) {}
  }

  public playMessageSent() {
    try {
      this.init();
      if (!this.ctx) return;
      this.tone({ type: 'sine', startFreq: 880, endFreq: 1320, gainAmount: 0.04, duration: 0.08 });
    } catch (_e) {}
  }
}

export const uiSounds = new SoundEngine();
