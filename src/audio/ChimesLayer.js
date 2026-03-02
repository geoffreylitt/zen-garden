import { CHIME_NOTES } from '../constants.js';

export class ChimesLayer {
  constructor() {
    this.enabled = true;
    this.volume = 0.5;
    this.maxGain = 0.12;
    this.gain = null;
    this.timer = null;
  }

  setup(ctx) {
    this.gain = ctx.createGain();
    this.gain.gain.value = this.enabled ? this.volume * this.maxGain : 0;
    this.gain.connect(ctx.destination);
    this.scheduleChime(ctx);
  }

  scheduleChime(ctx) {
    if (!ctx || ctx.state === 'closed') return;

    if (this.enabled) {
      const count = Math.random() < 0.3 ? 2 : 1;
      for (let c = 0; c < count; c++) {
        const freq = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)];
        const delay = c * (0.1 + Math.random() * 0.15);
        const duration = 1.5 + Math.random() * 1.5;
        const t = ctx.currentTime + delay;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2.01;

        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0, t);
        g1.gain.linearRampToValueAtTime(0.25, t + 0.005);
        g1.gain.exponentialRampToValueAtTime(0.001, t + duration);

        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.06, t + 0.005);
        g2.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.6);

        osc.connect(g1);
        osc2.connect(g2);
        g1.connect(this.gain);
        g2.connect(this.gain);

        osc.start(t);
        osc.stop(t + duration);
        osc2.start(t);
        osc2.stop(t + duration * 0.6);
      }
    }

    const nextDelay = 3000 + Math.random() * 6000;
    this.timer = setTimeout(() => this.scheduleChime(ctx), nextDelay);
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
