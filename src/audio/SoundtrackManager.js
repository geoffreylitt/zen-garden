const FADE_TIME = 0.75;
const CHIME_FREQS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.50];
const KOTO_NOTES = [293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
const STORAGE_KEY = 'zen-soundtrack';

export class SoundtrackManager {
  constructor() {
    this.tracks = [
      { id: 'quiet-morning', name: 'Quiet Morning', vibe: 'wind chimes · soft pads' },
      { id: 'rainy-day', name: 'Rainy Day', vibe: 'gentle rain · distant thunder' },
      { id: 'evening-lanterns', name: 'Evening Lanterns', vibe: 'warm lo-fi · koto loops' },
      { id: 'none', name: 'No Music', vibe: 'ambience only' },
    ];
    this.currentTrackId = localStorage.getItem(STORAGE_KEY) || 'quiet-morning';
    this.ctx = null;
    this.currentGain = null;
    this.stopCurrent = null;
  }

  setup(ctx) {
    this.ctx = ctx;
    this._play(this.currentTrackId);
  }

  switchTo(trackId) {
    if (trackId === this.currentTrackId) return;

    const oldGain = this.currentGain;
    const oldStop = this.stopCurrent;
    this.currentGain = null;
    this.stopCurrent = null;

    if (oldGain && this.ctx) {
      const t = this.ctx.currentTime;
      oldGain.gain.cancelScheduledValues(t);
      oldGain.gain.setValueAtTime(oldGain.gain.value, t);
      oldGain.gain.linearRampToValueAtTime(0, t + FADE_TIME);
      if (oldStop) setTimeout(oldStop, (FADE_TIME + 0.15) * 1000);
    } else if (oldStop) {
      oldStop();
    }

    this.currentTrackId = trackId;
    localStorage.setItem(STORAGE_KEY, trackId);
    if (this.ctx) this._play(trackId);
  }

  _play(trackId) {
    if (trackId === 'none') return;

    const master = this.ctx.createGain();
    master.gain.setValueAtTime(0, this.ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, this.ctx.currentTime + FADE_TIME);
    master.connect(this.ctx.destination);
    this.currentGain = master;

    let stopFn;
    if (trackId === 'quiet-morning') stopFn = this._quietMorning(master);
    else if (trackId === 'rainy-day') stopFn = this._rainyDay(master);
    else if (trackId === 'evening-lanterns') stopFn = this._eveningLanterns(master);
    this.stopCurrent = stopFn || (() => {});
  }

  // Quiet Morning: detuned sine pad + sporadic wind chimes
  _quietMorning(dest) {
    const ctx = this.ctx;
    const stopped = { v: false };
    const oscNodes = [];

    [[220, 0.4], [330, 0.28], [440, 0.22], [554.37, 0.14]].forEach(([freq, vol], i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.07 + i * 0.025;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.003;
      lfo.connect(lfoGain);

      const g = ctx.createGain();
      g.gain.value = vol * 0.038;
      lfoGain.connect(g.gain);

      osc.connect(g);
      g.connect(dest);
      osc.start();
      lfo.start();
      oscNodes.push(osc, lfo);
    });

    const scheduleChime = () => {
      if (stopped.v) return;
      const t = ctx.currentTime;
      const freq = CHIME_FREQS[Math.floor(Math.random() * CHIME_FREQS.length)];

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2.01;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.17, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.4);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0, t);
      g2.gain.linearRampToValueAtTime(0.05, t + 0.008);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

      osc.connect(g); g.connect(dest);
      osc2.connect(g2); g2.connect(dest);
      osc.start(t); osc.stop(t + 2.5);
      osc2.start(t); osc2.stop(t + 1.4);

      setTimeout(scheduleChime, 3500 + Math.random() * 5500);
    };
    setTimeout(scheduleChime, 1000 + Math.random() * 2000);

    return () => {
      stopped.v = true;
      oscNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    };
  }

  // Rainy Day: bandpass-filtered noise rain + occasional low-frequency thunder
  _rainyDay(dest) {
    const ctx = this.ctx;
    const stopped = { v: false };

    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = buffer;
    rainSrc.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 0.4;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 1.7;

    rainSrc.connect(bp);
    bp.connect(rainGain);
    rainGain.connect(dest);
    rainSrc.start();

    const scheduleThunder = () => {
      if (stopped.v) return;
      const t = ctx.currentTime;

      const tSrc = ctx.createBufferSource();
      tSrc.buffer = buffer;
      tSrc.loop = true;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 85;

      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0, t);
      tg.gain.linearRampToValueAtTime(1.3, t + 2.0);
      tg.gain.linearRampToValueAtTime(0, t + 6.0);

      tSrc.connect(lp);
      lp.connect(tg);
      tg.connect(dest);
      tSrc.start(t);
      tSrc.stop(t + 6.5);

      setTimeout(scheduleThunder, 18000 + Math.random() * 22000);
    };
    setTimeout(scheduleThunder, 12000 + Math.random() * 15000);

    return () => {
      stopped.v = true;
      try { rainSrc.stop(); } catch (e) {}
    };
  }

  // Evening Lanterns: warm detuned sawtooth pad + koto-style pentatonic plucks
  _eveningLanterns(dest) {
    const ctx = this.ctx;
    const stopped = { v: false };
    const oscNodes = [];

    [[110, 0], [165, 25], [220, -20]].forEach(([freq, detuneCents]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detuneCents;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 650;
      lp.Q.value = 1.5;

      const g = ctx.createGain();
      g.gain.value = 0.021;

      osc.connect(lp);
      lp.connect(g);
      g.connect(dest);
      osc.start();
      oscNodes.push(osc);
    });

    const playKotoNote = (freq, startTime, vol = 0.09) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(vol, startTime + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + 2.1);
      osc.connect(g);
      g.connect(dest);
      osc.start(startTime);
      osc.stop(startTime + 2.2);
    };

    const scheduleKoto = () => {
      if (stopped.v) return;
      const t = ctx.currentTime;
      playKotoNote(KOTO_NOTES[Math.floor(Math.random() * KOTO_NOTES.length)], t);
      if (Math.random() < 0.45) {
        playKotoNote(
          KOTO_NOTES[Math.floor(Math.random() * KOTO_NOTES.length)],
          t + 0.2 + Math.random() * 0.3,
          0.07
        );
      }
      setTimeout(scheduleKoto, 2800 + Math.random() * 4500);
    };
    setTimeout(scheduleKoto, 1000 + Math.random() * 2000);

    return () => {
      stopped.v = true;
      oscNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    };
  }
}
