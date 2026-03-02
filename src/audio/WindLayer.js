export class WindLayer {
  constructor() {
    this.enabled = true;
    this.volume = 0.6;
    this.maxGain = 0.06;
    this.gain = null;
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

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;

    this.gain = ctx.createGain();
    this.gain.gain.value = this.enabled ? this.volume * this.maxGain : 0;

    source.connect(filter);
    filter.connect(this.gain);
    this.gain.connect(ctx.destination);
    source.start();
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
