// Synthesized 4/4 disco beat: kick on 1&3, hi-hat on all 8ths, snare on 2&4
export class BeatLayer {
  constructor() {
    this.enabled = true;
    this.volume = 0.7;
    this.maxGain = 0.55;
    this.gain = null;
    this.bpm = 120;
    this._nextBeatTime = 0;
    this._beatCount = 0;
    this._schedulerTimer = null;
    this._ctx = null;
    // Expose beat phase for visual sync (0..1 within a beat)
    this.beatPhase = 0;
    this._lastBeatTime = 0;
    this._beatInterval = 0;
  }

  setup(ctx) {
    this._ctx = ctx;
    this.gain = ctx.createGain();
    this.gain.gain.value = this.enabled ? this.volume * this.maxGain : 0;
    this.gain.connect(ctx.destination);
    this._nextBeatTime = ctx.currentTime + 0.1;
    this._beatInterval = 60 / (this.bpm * 2); // 8th note interval
    this._schedule();
  }

  _schedule() {
    if (!this._ctx || this._ctx.state === 'closed') return;
    const ctx = this._ctx;
    const lookahead = 0.1; // seconds

    while (this._nextBeatTime < ctx.currentTime + lookahead) {
      if (this.enabled) {
        this._scheduleBeat(this._nextBeatTime, this._beatCount);
      }
      this._nextBeatTime += this._beatInterval;
      this._beatCount = (this._beatCount + 1) % 8; // 8 eighth-notes per bar
    }

    this._schedulerTimer = setTimeout(() => this._schedule(), 30);
  }

  _scheduleBeat(time, beat) {
    const ctx = this._ctx;
    const isKick = beat === 0 || beat === 4;
    const isSnare = beat === 2 || beat === 6;
    // hi-hat every 8th note

    if (isKick) {
      this._playKick(ctx, time);
    }
    if (isSnare) {
      this._playSnare(ctx, time);
    }
    this._playHihat(ctx, time, isKick || isSnare);
  }

  _playKick(ctx, time) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(1.0, time + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(g);
    g.connect(this.gain);
    osc.start(time);
    osc.stop(time + 0.28);
  }

  _playSnare(ctx, time) {
    // White noise burst for snare
    const bufSize = ctx.sampleRate * 0.15;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.8;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.6, time + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.gain);
    src.start(time);
    src.stop(time + 0.15);
  }

  _playHihat(ctx, time, isAccented) {
    const bufSize = ctx.sampleRate * 0.05;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const g = ctx.createGain();
    const vol = isAccented ? 0.22 : 0.12;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.gain);
    src.start(time);
    src.stop(time + 0.05);
  }

  updateGain(ctx) {
    if (!this.gain) return;
    const target = this.enabled ? this.volume * this.maxGain : 0;
    const t = ctx.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setValueAtTime(this.gain.gain.value, t);
    this.gain.gain.linearRampToValueAtTime(target, t + 0.05);
  }

  // Returns a 0..1 value representing position within current beat (for visual sync)
  getBeatPhase() {
    if (!this._ctx || !this.enabled) return 0;
    const elapsed = this._ctx.currentTime - (this._nextBeatTime - this._beatInterval);
    return Math.max(0, Math.min(1, elapsed / this._beatInterval));
  }

  stop() {
    if (this._schedulerTimer) {
      clearTimeout(this._schedulerTimer);
      this._schedulerTimer = null;
    }
  }
}
