export class BirdsongLayer {
  constructor() {
    this.enabled = true;
    this.volume = 0.5;
    this.maxGain = 0.08;
    this.gain = null;
    this.timeMultiplier = 1;
    this.timer = null;
  }

  setup(ctx) {
    this.gain = ctx.createGain();
    this.gain.gain.value = this.enabled ? this.volume * this.maxGain * this.timeMultiplier : 0;
    this.gain.connect(ctx.destination);
    this.scheduleSong(ctx);
  }

  scheduleSong(ctx) {
    if (!ctx || ctx.state === 'closed') return;

    if (this.enabled && this.timeMultiplier > 0.05) {
      const now = ctx.currentTime;
      const songLen = 0.4 + Math.random() * 0.4;
      const noteCount = 2 + Math.floor(Math.random() * 4);
      const baseFreq = 1800 + Math.random() * 1400;

      for (let n = 0; n < noteCount; n++) {
        const t = now + n * (songLen / noteCount);
        const freq = baseFreq * (0.8 + Math.random() * 0.5);
        const dur = 0.06 + Math.random() * 0.12;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.linearRampToValueAtTime(freq * (0.85 + Math.random() * 0.3), t + dur);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.2, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(g);
        g.connect(this.gain);
        osc.start(t);
        osc.stop(t + dur);
      }
    }

    const nextDelay = 2000 + Math.random() * 5000;
    this.timer = setTimeout(() => this.scheduleSong(ctx), nextDelay);
  }

  updateGain(ctx) {
    if (!this.gain) return;
    const target = this.enabled ? this.volume * this.maxGain * this.timeMultiplier : 0;
    const t = ctx.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setValueAtTime(this.gain.gain.value, t);
    this.gain.gain.linearRampToValueAtTime(target, t + 0.3);
  }
}
