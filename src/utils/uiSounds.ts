/**
 * UISounds - Synthetic High-Fidelity UI Audio
 * Uses Web Audio API to create premium tactile sounds without asset files.
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
    gain.gain.exponentialRampToValueAtTime(gainAmount, now + 0.01);
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

      this.tone({
        type: 'sine',
        startFreq: 1200 * intensity,
        endFreq: 400,
        gainAmount: 0.05 * intensity,
        duration: 0.1,
      });
    } catch (e) {}
  }

  public playPop() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({
        type: 'sine',
        startFreq: 200,
        endFreq: 400,
        gainAmount: 0.1,
        duration: 0.05,
      });
    } catch (e) {}
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
    } catch (e) {}
  }

  public playSwitch() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({
        type: 'sine',
        startFreq: 520,
        endFreq: 380,
        gainAmount: 0.035,
        duration: 0.06,
      });
    } catch (e) {}
  }

  public playTap() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({
        type: 'sine',
        startFreq: 900,
        endFreq: 600,
        gainAmount: 0.04,
        duration: 0.03,
      });
    } catch (e) {}
  }

  public playMicOn() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({ type: 'triangle', startFreq: 340, endFreq: 520, gainAmount: 0.028, duration: 0.09 });
      this.tone({ type: 'sine', startFreq: 660, endFreq: 920, gainAmount: 0.015, duration: 0.07, delay: 0.025 });
    } catch (e) {}
  }

  public playMicOff() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({ type: 'triangle', startFreq: 680, endFreq: 360, gainAmount: 0.024, duration: 0.08 });
      this.tone({ type: 'sine', startFreq: 320, endFreq: 250, gainAmount: 0.012, duration: 0.06, delay: 0.02 });
    } catch (e) {}
  }

  public playAutoSendOn() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({ type: 'sine', startFreq: 380, endFreq: 420, gainAmount: 0.018, duration: 0.05 });
      this.tone({ type: 'sine', startFreq: 520, endFreq: 580, gainAmount: 0.02, duration: 0.05, delay: 0.04 });
      this.tone({ type: 'triangle', startFreq: 700, endFreq: 820, gainAmount: 0.018, duration: 0.07, delay: 0.075 });
    } catch (e) {}
  }

  public playAutoSendOff() {
    try {
      this.init();
      if (!this.ctx) return;

      this.tone({ type: 'triangle', startFreq: 720, endFreq: 520, gainAmount: 0.02, duration: 0.06 });
      this.tone({ type: 'sine', startFreq: 460, endFreq: 300, gainAmount: 0.015, duration: 0.08, delay: 0.035 });
    } catch (e) {}
  }
}

export const uiSounds = new SoundEngine();
