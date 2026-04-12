export const sonicBranding = {
  active: true,
  audioCtx: null as AudioContext | null,

  init() {
    if (typeof window !== 'undefined' && !this.audioCtx) {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextCtor) {
        this.audioCtx = new AudioContextCtor();
      }
    }
  },

  playGlassTink() {
    if (!this.active || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(3000, this.audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  },

  playDeepHum() {
    if (!this.active || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(60, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.audioCtx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.0);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 1.0);
  },

  playSuccessChime() {
    if (!this.active || !this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    
    // Play a lovely major third chord spread out
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, this.audioCtx!.currentTime + (i * 0.05));
      gain.gain.linearRampToValueAtTime(0.1, this.audioCtx!.currentTime + (i * 0.05) + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx!.currentTime + (i * 0.05) + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);
      
      osc.start(this.audioCtx!.currentTime + (i * 0.05));
      osc.stop(this.audioCtx!.currentTime + (i * 0.05) + 0.5);
    });
  }
};
