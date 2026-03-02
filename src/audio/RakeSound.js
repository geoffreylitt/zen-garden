export class RakeSound {
  constructor() {
    this.gainNode = null;
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
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 1.5;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;

    source.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    source.start();
  }

  start(ctx) {
    if (!this.gainNode || !ctx) return;
    this.gainNode.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.1);
  }

  stop(ctx) {
    if (!this.gainNode || !ctx) return;
    this.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
  }
}
