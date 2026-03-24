export class CricketsLayer {
  constructor() {
    this.enabled = true;
    this.volume = 0.5;
    this.maxGain = 0.06;
    this.gain = null;
    this.timeMultiplier = 1;
    this.timer = null;
  }

  setup(ctx) {
    this.gain = ctx.createGain();
    this.gain.gain.value = this.enabled ? this.volume * this.maxGain * this.timeMultiplier : 0;
    this.gain.connect(ctx.destination);
    this.scheduleChirp(ctx);
  }

  scheduleChirp(ctx) {
    if (!ctx || ctx.state === 'closed') return;

    if (this.enabled && this.timeMultiplier > 0.05) {
      const now = ctx.currentTime;
      const isFrog = Math.random() < 0.2;

      if (isFrog) {
        const freq = 180 + Math.random() * 120;
        const dur = 0.15 + Math.random() * 0.1;
        const t = now;

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + dur);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.3, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(g);
        g.connect(this.gain);
        osc.start(t);
        osc.stop(t + dur);
      } else {
        const chirps = 2 + Math.floor(Math.random() * 3);
        const freq = 4000 + Math.random() * 1500;

        for (let c = 0; c < chirps; c++) {
          const t = now + c * 0.08;
          const dur = 0.035 + Math.random() * 0.02;

          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;

          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.15, t + 0.005);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);

          osc.connect(g);
          g.connect(this.gain);
          osc.start(t);
          osc.stop(t + dur);
        }
      }
    }

    const nextDelay = 800 + Math.random() * 3000;
    this.timer = setTimeout(() => this.scheduleChirp(ctx), nextDelay);
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
