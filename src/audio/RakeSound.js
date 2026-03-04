export class RakeSound {
  constructor() {
    this.gainNode = null;
    this.filter = null;
    this.highShelf = null;
    this.active = false;
  }

  setup(ctx) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'bandpass';
    this.filter.frequency.value = 2500;
    this.filter.Q.value = 1.5;

    this.highShelf = ctx.createBiquadFilter();
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.value = 3000;
    this.highShelf.gain.value = 0;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    source.connect(this.filter);
    this.filter.connect(this.highShelf);
    this.highShelf.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();
  }

  start(ctx) {
    if (!this.gainNode || !ctx) return;
    this.active = true;
    this.gainNode.gain.cancelScheduledValues(ctx.currentTime);
    this.gainNode.gain.setTargetAtTime(0.03, ctx.currentTime, 0.05);
  }

  stop(ctx) {
    if (!this.gainNode || !ctx) return;
    this.active = false;
    this.gainNode.gain.cancelScheduledValues(ctx.currentTime);
    this.gainNode.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  }

  update(ctx, speed, angle) {
    if (!this.active || !this.gainNode || !ctx) return;

    const clampedSpeed = Math.min(speed, 600);
    const t = clampedSpeed / 600;

    const gain = 0.015 + t * 0.07;
    this.gainNode.gain.cancelScheduledValues(ctx.currentTime);
    this.gainNode.gain.setTargetAtTime(gain, ctx.currentTime, 0.04);

    const baseFreq = 1800 + t * 2200;
    const angleAbs = Math.abs(angle);
    const verticalness = Math.abs(Math.sin(angleAbs));
    const freqShift = verticalness * 400 - 200;
    this.filter.frequency.cancelScheduledValues(ctx.currentTime);
    this.filter.frequency.setTargetAtTime(baseFreq + freqShift, ctx.currentTime, 0.04);

    const q = 1.0 + (1 - t) * 2.0;
    this.filter.Q.cancelScheduledValues(ctx.currentTime);
    this.filter.Q.setTargetAtTime(q, ctx.currentTime, 0.04);

    const shelfGain = verticalness * 4 - 2;
    this.highShelf.gain.cancelScheduledValues(ctx.currentTime);
    this.highShelf.gain.setTargetAtTime(shelfGain, ctx.currentTime, 0.06);
  }
}
