export class RainLayer {
  constructor() {
    this.enabled = false;
    this.volume = 0.5;
    this.maxGain = 0.08;
    this.intensity = 0.5;
    this.gain = null;
    this.sandPatter = null;
    this.stoneDrops = null;
    this.waterSplash = null;
  }

  setup(ctx) {
    this.gain = ctx.createGain();
    this.gain.gain.value = this.enabled ? this._targetGain() : 0;
    this.gain.connect(ctx.destination);

    this._setupSandPatter(ctx);
    this._setupStoneDrops(ctx);
    this._setupWaterSplash(ctx);
  }

  _targetGain() {
    return this.volume * this.maxGain * this.intensity;
  }

  _setupSandPatter(ctx) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 600;

    this.sandPatter = ctx.createGain();
    this.sandPatter.gain.value = 0.6;

    source.connect(lp);
    lp.connect(hp);
    hp.connect(this.sandPatter);
    this.sandPatter.connect(this.gain);
    source.start();
  }

  _setupStoneDrops(ctx) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 4500;
    bp.Q.value = 1.2;

    this.stoneDrops = ctx.createGain();
    this.stoneDrops.gain.value = 0.25;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 2.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;

    source.connect(bp);
    bp.connect(this.stoneDrops);
    lfo.connect(lfoGain);
    lfoGain.connect(this.stoneDrops.gain);
    this.stoneDrops.connect(this.gain);
    source.start();
    lfo.start();
  }

  _setupWaterSplash(ctx) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1200;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 100;

    this.waterSplash = ctx.createGain();
    this.waterSplash.gain.value = 0.35;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;

    source.connect(lp);
    lp.connect(hp);
    hp.connect(this.waterSplash);
    lfo.connect(lfoGain);
    lfoGain.connect(this.waterSplash.gain);
    this.waterSplash.connect(this.gain);
    source.start();
    lfo.start();
  }

  setIntensity(value) {
    this.intensity = Math.max(0.1, Math.min(1.0, value));
  }

  updateGain(ctx) {
    if (!this.gain) return;
    const target = this.enabled ? this._targetGain() : 0;
    const t = ctx.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setValueAtTime(this.gain.gain.value, t);
    this.gain.gain.linearRampToValueAtTime(target, t + 0.3);
  }
}
