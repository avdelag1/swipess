/**
 * UISounds - Nexus Grade High-Fidelity Audio
 * Integrates premium external assets with synthetic fallback.
 * Tuned for a cinematic, tactile user experience.
 */

const NEXUS_SOUNDS = {
  WELCOME: "https://pastewaves.com/api/audio/33d22bda-0431-4e50-b93a-ed7003f55e55/download",
  LIKE: "https://pastewaves.com/api/audio/cb3373a6-ed8d-4f14-8527-443c5aece1dd/download",
  DISLIKE: "https://pastewaves.com/api/audio/439dda73-a0b5-478c-a9af-aba9dd75e411/download",
  NOTIFICATION: "https://pastewaves.com/api/audio/33d22bda-0431-4e50-b93a-ed7003f55e55/download",
  UPLOAD: "https://pastewaves.com/api/audio/cb3373a6-ed8d-4f14-8527-443c5aece1dd/download",
};

const STAR_SOUNDS = [
  "https://pastewaves.com/api/audio/e57f365a-5a0f-498a-ab33-ccf503077ebf/download",
  "https://pastewaves.com/api/audio/48e1614f-4e5d-4800-b5a9-b0b38814bead/download",
  "https://pastewaves.com/api/audio/4e03067c-86a0-4607-b8c8-7c1b8d36573c/download",
  "https://pastewaves.com/api/audio/cfed8bfe-e71d-483c-ad86-96c9328a9d65/download",
  "https://pastewaves.com/api/audio/a6f6d509-ecb8-4709-974a-91248003b056/download",
  "https://pastewaves.com/api/audio/4ccdaaf6-9b06-4de2-86ec-5f888687d779/download",
  "https://pastewaves.com/api/audio/f6dfc34d-7cce-4f5f-9ad4-3fea3f867723/download",
  "https://pastewaves.com/api/audio/d1fb7ed9-11d0-447a-a179-9635d22bcab1/download",
  "https://pastewaves.com/api/audio/8191c8e6-222e-469f-a232-b9e81bb4b6f5/download",
  // Legacy Zen mix for depth
  "/sounds/bells-2-31725.mp3",
  "/sounds/bell-a-99888.mp3",
  "/sounds/tuning-fork-440-hz-resonance-22406.mp3",
  "/sounds/singing-bowl-gong-69238.mp3",
  "/sounds/bell-meditation-75335.mp3"
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
    try {
      this.init();
      if (!this.ctx) return;
      const fundamental = 174.61;
      this.tone({ type: 'sine', startFreq: fundamental, gainAmount: 0.12, duration: 3.0, attack: 0.08 });
    } catch (_e) {}
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
}

export const uiSounds = new SoundEngine();
