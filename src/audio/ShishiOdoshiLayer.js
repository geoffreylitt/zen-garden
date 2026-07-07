export class ShishiOdoshiLayer {
  constructor() {
    this.enabled = false;
    this.volume = 0.5;
    this.maxGain = 0.18;
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

      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.35, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      const noise = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const nd = buf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      noise.buffer = buf;
      const nf = ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.value = 2500;
      nf.Q.value = 2;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0, t);
      ng.gain.linearRampToValueAtTime(0.12, t + 0.002);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(g);
      g.connect(this.gain);
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(this.gain);

      osc.start(t);
      osc.stop(t + 0.15);
      noise.start(t);
      noise.stop(t + 0.1);

      const dripT = t + 1.5 + Math.random() * 1.5;
      const dOsc = ctx.createOscillator();
      dOsc.type = 'sine';
      dOsc.frequency.setValueAtTime(1800, dripT);
      dOsc.frequency.exponentialRampToValueAtTime(400, dripT + 0.06);
      const dg = ctx.createGain();
      dg.gain.setValueAtTime(0, dripT);
      dg.gain.linearRampToValueAtTime(0.06, dripT + 0.005);
      dg.gain.exponentialRampToValueAtTime(0.001, dripT + 0.08);
      dOsc.connect(dg);
      dg.connect(this.gain);
      dOsc.start(dripT);
      dOsc.stop(dripT + 0.08);
    }

    const next = 4000 + Math.random() * 5000;
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
