export class TsukubaiLayer {
  constructor() {
    this.enabled = false;
    this.volume = 0.5;
    this.maxGain = 0.1;
    this.gain = null;
    this.timer = null;
  }

  setup(ctx) {
    this.gain = ctx.createGain();
    this.gain.gain.value = this.enabled ? this.volume * this.maxGain : 0;
    this.gain.connect(ctx.destination);
    this.schedule(ctx);
  }

  schedule(ctx) {
    if (!ctx || ctx.state === 'closed') return;

    if (this.enabled) {
      const t = ctx.currentTime;
      const freq = 1200 + Math.random() * 600;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.06);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(g);
      g.connect(this.gain);
      osc.start(t);
      osc.stop(t + 0.12);

      if (Math.random() < 0.4) {
        const t2 = t + 0.15 + Math.random() * 0.1;
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 0.8, t2);
        osc2.frequency.exponentialRampToValueAtTime(freq * 0.3, t2 + 0.05);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0, t2);
        g2.gain.linearRampToValueAtTime(0.04, t2 + 0.003);
        g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.1);
        osc2.connect(g2);
        g2.connect(this.gain);
        osc2.start(t2);
        osc2.stop(t2 + 0.1);
      }
    }

    const next = 2000 + Math.random() * 4000;
    this.timer = setTimeout(() => this.schedule(ctx), next);
  }

  updateGain(ctx) {
    if (!this.gain) return;
    const target = this.enabled ? this.volume * this.maxGain : 0;
    const t = ctx.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setValueAtTime(this.gain.gain.value, t);
    this.gain.gain.linearRampToValueAtTime(target, t + 0.1);
  }
}
