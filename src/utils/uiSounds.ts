/**
 * UISounds - Swipes Grade High-Fidelity Audio
 * Integrates premium external assets with synthetic fallback.
 * Tuned for a cinematic, tactile user experience.
 */

const SWIPES_SOUNDS = {
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
  /**
   * APP-WIDE SOUND POLICY:
   * The only surface allowed to play UI sounds is the public landing page
   * background (LandingBackgroundEffects.tsx) — meditation bowls and shooting
   * star chimes when tapping the cosmos. Every other call site is a no-op.
   *
   * Methods that the landing background uses (playStarShoot, playZenBowl) are
   * kept functional. All other public methods are stubs so existing call sites
   * compile without making noise.
   */
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

  // ── DISABLED IN-APP SOUNDS (no-ops) ─────────────────────────────────────
  public playWelcome() {}
  public playLike() {}
  public playDislike() {}
  public playNotification() {}
  public playUploadComplete() {}

  // ── LANDING-PAGE-ONLY SOUNDS ────────────────────────────────────────────
  public playStarShoot() {
    const randomUrl = STAR_SOUNDS[Math.floor(Math.random() * STAR_SOUNDS.length)];
    this.loadAndPlay(randomUrl, 0.3);
  }

  public playZenBowl() {
    const url = BOWL_SOUNDS[Math.floor(Math.random() * BOWL_SOUNDS.length)];
    this.loadAndPlay(url, 0.45);
  }

  // ── DISABLED TACTILE SOUNDS (no-ops) ────────────────────────────────────
  public playWaterDrop() {}
  public playTap() {}
  public playPing() {}
  public playCategorySelect() {}
  public playCardSwipe(_direction: 'left' | 'right' = 'right') {}
  public playSwitch() {}
  public playMicOn() {}
  public playMicOff() {}
  public playPop(_volume: number = 1) {}
  public playMessageSent() {}
}

export const uiSounds = new SoundEngine();
