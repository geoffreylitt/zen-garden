export class FountainLayer {
  constructor() {
    this.enabled = true;
    this.volume = 0.55;
    this.maxGain = 0.07;
    this.gain = null;
    this.lfoGain = null;
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

    // Highpass to remove low rumble, leaving the "splash" range
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 500;

    // Bandpass centered on the bright, airy water-trickle range
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1800;
    bandpass.Q.value = 0.6;

    // Slow LFO (~0.4 Hz) gently undulates the bandpass centre for a
    // babbling-brook effect
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.4;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 400; // ±400 Hz sweep around 1800 Hz

    lfo.connect(this.lfoGain);
    this.lfoGain.connect(bandpass.frequency);

    this.gain = ctx.createGain();
    this.gain.gain.value = this.enabled ? this.volume * this.maxGain : 0;

    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(this.gain);
    this.gain.connect(ctx.destination);

    source.start();
    lfo.start();
  }

  updateGain(ctx) {
    if (!this.gain) return;
    const target = this.enabled ? this.volume * this.maxGain : 0;
    const t = ctx.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setValueAtTime(this.gain.gain.value, t);
    this.gain.gain.linearRampToValueAtTime(target, t + 0.3);
  }
}
