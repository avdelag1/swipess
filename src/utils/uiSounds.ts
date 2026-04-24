/**
 * UISounds - iOS-Grade Synthetic Audio
 * Uses Web Audio API to create premium tactile sounds without asset files.
 * All sounds tuned for Apple-level subtlety and clarity.
 */

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

  private tone({
    type = 'sine',
    startFreq,
    endFreq,
    gainAmount,
    duration,
    delay = 0,
  }: {
    type?: OscillatorType;
    startFreq: number;
    endFreq?: number;
    gainAmount: number;
    duration: number;
    delay?: number;
  }) {
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq && endFreq !== startFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainAmount, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  public playPing(intensity: number = 1) {
    try {
      this.init();
      if (!this.ctx) return;

      // iOS-style crystalline ping — two-note shimmer
      this.tone({
        type: 'sine',
        startFreq: 1100 * intensity,
        endFreq: 880 * intensity,
        gainAmount: 0.03 * intensity,
        duration: 0.08,
      });
      this.tone({
        type: 'triangle',
        startFreq: 1650 * intensity,
        endFreq: 1320 * intensity,
        gainAmount: 0.015 * intensity,
        duration: 0.06,
        delay: 0.015,
      });
    } catch (_e) {}
  }

  public playPop() {
    try {
      this.init();
      if (!this.ctx) return;

      // Soft bubble pop — rounded low-to-high
      this.tone({
        type: 'sine',
        startFreq: 300,
        endFreq: 520,
        gainAmount: 0.045,
        duration: 0.04,
      });
      this.tone({
        type: 'triangle',
        startFreq: 600,
        endFreq: 440,
        gainAmount: 0.02,
        duration: 0.04,
        delay: 0.02,
      });
    } catch (_e) {}
  }

  public playSwoosh() {
    try {
      this.init();
      if (!this.ctx) return;

      const noise = this.ctx.createBufferSource();
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (_e) {}
  }

  public playSwitch() {
    try {
      this.init();
      if (!this.ctx) return;

      // iOS toggle switch — clean two-note click
      this.tone({
        type: 'sine',
        startFreq: 1046,
        endFreq: 784,
        gainAmount: 0.025,
        duration: 0.045,
      });
      this.tone({
        type: 'triangle',
        startFreq: 1568,
        endFreq: 1175,
        gainAmount: 0.012,
        duration: 0.035,
        delay: 0.02,
      });
    } catch (_e) {}
  }

  public playTap() {
    try {
      this.init();
      if (!this.ctx) return;

      // Minimal haptic tap — barely-there click
      this.tone({
        type: 'sine',
        startFreq: 1000,
        endFreq: 800,
        gainAmount: 0.25,
        duration: 0.025,
      });
    } catch (_e) {}
  }

  /** Card swipe whoosh — quick directional sweep */
  public playCardSwipe(direction: 'left' | 'right' = 'right') {
    try {
      this.init();
      if (!this.ctx) return;

      const ctx = this.ctx;
      const now = ctx.currentTime;

      // Filtered noise burst
      const noise = ctx.createBufferSource();
      const len = Math.round(ctx.sampleRate * 0.12);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 1.2;
      const freqStart = direction === 'right' ? 1400 : 2000;
      const freqEnd = direction === 'right' ? 2800 : 800;
      filter.frequency.setValueAtTime(freqStart, now);
      filter.frequency.exponentialRampToValueAtTime(freqEnd, now + 0.1);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.018, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.12);

      // Subtle tonal accent
      this.tone({
        type: 'sine',
        startFreq: direction === 'right' ? 660 : 880,
        endFreq: direction === 'right' ? 880 : 660,
        gainAmount: 0.012,
        duration: 0.07,
        delay: 0.01,
      });
    } catch (_e) {}
  }

  /** Category select — bright staccato confirmation */
  public playCategorySelect() {
    try {
      this.init();
      if (!this.ctx) return;

      // Three-note rising arpeggio (C6-E6-G6) — very fast, very quiet
      this.tone({ type: 'sine', startFreq: 1047, endFreq: 1047, gainAmount: 0.022, duration: 0.04 });
      this.tone({ type: 'sine', startFreq: 1319, endFreq: 1319, gainAmount: 0.02, duration: 0.035, delay: 0.03 });
      this.tone({ type: 'triangle', startFreq: 1568, endFreq: 1568, gainAmount: 0.016, duration: 0.05, delay: 0.055 });
    } catch (_e) {}
  }

  public playMicOn() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({ type: 'triangle', startFreq: 340, endFreq: 520, gainAmount: 0.028, duration: 0.09 });
      this.tone({ type: 'sine', startFreq: 660, endFreq: 920, gainAmount: 0.015, duration: 0.07, delay: 0.025 });
    } catch (_e) {}
  }

  public playMicOff() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({ type: 'triangle', startFreq: 680, endFreq: 360, gainAmount: 0.024, duration: 0.08 });
      this.tone({ type: 'sine', startFreq: 320, endFreq: 250, gainAmount: 0.012, duration: 0.06, delay: 0.02 });
    } catch (_e) {}
  }

  public playAutoSendOn() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({ type: 'sine', startFreq: 380, endFreq: 420, gainAmount: 0.018, duration: 0.05 });
      this.tone({ type: 'sine', startFreq: 520, endFreq: 580, gainAmount: 0.02, duration: 0.05, delay: 0.04 });
      this.tone({ type: 'triangle', startFreq: 700, endFreq: 820, gainAmount: 0.018, duration: 0.07, delay: 0.075 });
    } catch (_e) {}
  }

  public playAutoSendOff() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({ type: 'triangle', startFreq: 720, endFreq: 520, gainAmount: 0.02, duration: 0.06 });
      this.tone({ type: 'sine', startFreq: 460, endFreq: 300, gainAmount: 0.015, duration: 0.08, delay: 0.035 });
    } catch (_e) {}
  }
}

export const uiSounds = new SoundEngine();


