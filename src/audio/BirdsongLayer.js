export class BirdsongLayer {
  constructor() {
    this.enabled = true;
    this.volume = 0.55;
    this.maxGain = 0.18;
    this.gain = null;
    this._ctx = null;
    this._timer = null;
  }

  setup(ctx, destination = ctx.destination) {
    this._ctx = ctx;
    this.gain = ctx.createGain();
    this.gain.gain.value = this.enabled ? this.volume * this.maxGain : 0;
    this.gain.connect(destination);
    this._schedule();
  }

  // Produce a single chirp note: frequency glides from freqStart → freqEnd over `duration` seconds,
  // starting `offset` seconds from now.
  _chirp(freqStart, freqEnd, duration, offset) {
    const ctx = this._ctx;
    if (!ctx || ctx.state === 'closed') return;
    const t = ctx.currentTime + offset;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration * 0.65);
    osc.frequency.exponentialRampToValueAtTime(freqStart * 0.88, t + duration);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.8, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(env);
    env.connect(this.gain);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  _schedule() {
    const ctx = this._ctx;
    if (!ctx || ctx.state === 'closed') return;

    if (this.enabled) {
      const species = Math.floor(Math.random() * 4);
      if (species === 0) {
        // Sparrow-like: quick 3-note trill
        const base = 2600 + Math.random() * 800;
        this._chirp(base, base * 1.15, 0.08, 0.10);
        this._chirp(base * 1.10, base * 0.95, 0.07, 0.22);
        this._chirp(base * 1.05, base * 1.20, 0.09, 0.34);
      } else if (species === 1) {
        // Warbler: gentle two-note call
        const base = 1700 + Math.random() * 500;
        this._chirp(base, base * 1.28, 0.15, 0.10);
        this._chirp(base * 1.20, base * 0.88, 0.20, 0.34);
      } else if (species === 2) {
        // Robin-like: single clear descending whistle
        const base = 2100 + Math.random() * 600;
        this._chirp(base * 1.12, base * 0.72, 0.26, 0.10);
      } else {
        // Distant small bird: faint single tweet
        const base = 3000 + Math.random() * 1000;
        this._chirp(base, base * 1.08, 0.06, 0.10 + Math.random() * 0.3);
      }
    }

    this._timer = setTimeout(() => this._schedule(), 5000 + Math.random() * 9000);
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
