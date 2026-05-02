/**
 * UISounds - iOS-Grade Synthetic Audio
 * Uses Web Audio API to create premium tactile sounds without asset files.
 * All sounds tuned for Apple-level subtlety and clarity.
 */

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

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
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
      attack = 0.005,
      decay = duration - 0.005
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

  public playWaterDrop() {
    try {
      this.init();
      if (!this.ctx) return;
      // 💧 ORGANIC WATER DROP
      this.tone({ type: 'sine', startFreq: 1400, endFreq: 1800, gainAmount: 0.1, duration: 0.08, attack: 0.005 });
      this.tone({ type: 'sine', startFreq: 2400, endFreq: 2200, gainAmount: 0.04, duration: 0.04, attack: 0.01, delay: 0.01 });
    } catch (_e) {}
  }

  public playZenBowl() {
    try {
      this.init();
      if (!this.ctx) return;
      // 🧘 PREMIUM TIBETAN BOWL
      const fundamental = 174.61; // F3
      this.tone({ type: 'sine', startFreq: fundamental, gainAmount: 0.12, duration: 3.0, attack: 0.08 });
      this.tone({ type: 'sine', startFreq: fundamental * 1.5, gainAmount: 0.06, duration: 2.5, attack: 0.12, delay: 0.05 });
      this.tone({ type: 'sine', startFreq: fundamental * 2.1, gainAmount: 0.03, duration: 2.0, attack: 0.2, delay: 0.1 });
    } catch (_e) {}
  }

  public playTap() {
    try {
      this.init();
      if (!this.ctx) return;
      // 🪵 SOFT TACTILE TAP
      this.tone({ type: 'sine', startFreq: 300, endFreq: 150, gainAmount: 0.08, duration: 0.04 });
    } catch (_e) {}
  }

  public playPing(intensity: number = 1) {
    this.playWaterDrop();
  }

  public playPop() {
    try {
      this.init();
      if (!this.ctx) return;
      this.tone({ type: 'sine', startFreq: 220, endFreq: 330, gainAmount: 0.03, duration: 0.06 });
    } catch (_e) {}
  }

  public playCategorySelect() {
    try {
      this.init();
      if (!this.ctx) return;
      // 💧 ORGANIC WATER BUBBLE (Apple-like organic tick)
      this.tone({ type: 'sine', startFreq: 800, endFreq: 1200, gainAmount: 0.05, duration: 0.05, attack: 0.005 });
      this.tone({ type: 'sine', startFreq: 1200, endFreq: 1400, gainAmount: 0.02, duration: 0.03, attack: 0.01, delay: 0.02 });
    } catch (_e) {}
  }

  public playCardSwipe(direction: 'left' | 'right' = 'right') {
    try {
      this.init();
      if (!this.ctx) return;
      
      // 🧘 GENTLE ZEN BOWL SWIPE (instead of digital noise)
      // Right (Like) gets a slightly higher, ascending pitch. Left (Pass) gets a lower, descending pitch.
      const baseFreq = direction === 'right' ? 220.00 : 174.61;
      const endFreq = direction === 'right' ? 246.94 : 146.83;
      
      this.tone({ type: 'sine', startFreq: baseFreq, endFreq: endFreq, gainAmount: 0.08, duration: 0.4, attack: 0.05 });
      this.tone({ type: 'sine', startFreq: baseFreq * 1.5, endFreq: endFreq * 1.5, gainAmount: 0.03, duration: 0.3, attack: 0.08, delay: 0.02 });
      this.tone({ type: 'sine', startFreq: baseFreq * 2.1, gainAmount: 0.01, duration: 0.2, attack: 0.1, delay: 0.05 });
    } catch (_e) {}
  }

  public playSwitch() {
    try {
      this.init();
      if (!this.ctx) return;
      this.tone({ type: 'sine', startFreq: 660, endFreq: 440, gainAmount: 0.015, duration: 0.08 });
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
