export class CicadasLayer {
  constructor() {
    this.enabled = true;
    this.volume = 0.4;
    this.maxGain = 0.05;
    this.gain = null;
    this.lfoGain = null;
    this.swellGain = null;
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
    filter.frequency.value = 5500;
    filter.Q.value = 3;

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.value = 4200;
    filter2.Q.value = 4;

    this.gain = ctx.createGain();
    const baseGain = this.enabled ? this.volume * this.maxGain : 0;
    this.gain.gain.value = baseGain;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 8;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = baseGain * 0.5;

    const swell = ctx.createOscillator();
    swell.frequency.value = 0.15;
    this.swellGain = ctx.createGain();
    this.swellGain.gain.value = baseGain * 0.3;

    source.connect(filter);
    source.connect(filter2);
    filter.connect(this.gain);
    filter2.connect(this.gain);

    lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.gain.gain);

    swell.connect(this.swellGain);
    this.swellGain.connect(this.gain.gain);

    this.gain.connect(ctx.destination);

    source.start();
    lfo.start();
    swell.start();
  }

  updateGain(ctx) {
    if (!this.gain) return;
    const target = this.enabled ? this.volume * this.maxGain : 0;
    const t = ctx.currentTime;

    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setValueAtTime(this.gain.gain.value, t);
    this.gain.gain.linearRampToValueAtTime(target, t + 0.1);

    if (this.lfoGain) {
      this.lfoGain.gain.cancelScheduledValues(t);
      this.lfoGain.gain.setValueAtTime(this.lfoGain.gain.value, t);
      this.lfoGain.gain.linearRampToValueAtTime(target * 0.5, t + 0.1);
    }
    if (this.swellGain) {
      this.swellGain.gain.cancelScheduledValues(t);
      this.swellGain.gain.setValueAtTime(this.swellGain.gain.value, t);
      this.swellGain.gain.linearRampToValueAtTime(target * 0.3, t + 0.1);
    }
  }
}
