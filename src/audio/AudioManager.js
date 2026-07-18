import { WindLayer } from './WindLayer.js';
import { ChimesLayer } from './ChimesLayer.js';
import { CicadasLayer } from './CicadasLayer.js';
import { BirdsongLayer } from './BirdsongLayer.js';
import { RakeSound } from './RakeSound.js';
import { PlaceSound } from './PlaceSound.js';

export class AudioManager {
  constructor() {
    this.started = false;
    this.ctx = null;
    this.ambientMuted = false;
    this._masterAmbientGain = null;
    this.layers = {
      wind: new WindLayer(),
      chimes: new ChimesLayer(),
      cicadas: new CicadasLayer(),
      birds: new BirdsongLayer(),
    };
    this.rakeSound = new RakeSound();
    this.placeSound = new PlaceSound();
  }

  ensureStarted() {
    if (this.started) return;
    this.started = true;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      // All ambient layers route through a shared master gain so the mute
      // toggle can fade them all at once without touching interaction SFX.
      this._masterAmbientGain = this.ctx.createGain();
      this._masterAmbientGain.gain.value = 1;
      this._masterAmbientGain.connect(this.ctx.destination);

      for (const layer of Object.values(this.layers)) {
        layer.setup(this.ctx, this._masterAmbientGain);
      }
      this.rakeSound.setup(this.ctx);
    } catch (e) {
      // Web Audio not available
    }
  }

  updateLayerGain(key) {
    const layer = this.layers[key];
    if (layer && this.ctx) layer.updateGain(this.ctx);
  }

  get anyLayerEnabled() {
    return Object.values(this.layers).some(l => l.enabled);
  }

  // Fade all ambient layers in or out without affecting interaction SFX.
  setAmbientMuted(muted) {
    this.ambientMuted = muted;
    if (!this._masterAmbientGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const target = muted ? 0 : 1;
    this._masterAmbientGain.gain.cancelScheduledValues(t);
    this._masterAmbientGain.gain.setValueAtTime(this._masterAmbientGain.gain.value, t);
    this._masterAmbientGain.gain.linearRampToValueAtTime(target, t + 0.4);
  }

  startRake() {
    if (this.rakeSound && this.ctx) this.rakeSound.start(this.ctx);
  }

  stopRake() {
    if (this.rakeSound && this.ctx) this.rakeSound.stop(this.ctx);
  }

  playPlace() {
    if (this.placeSound && this.ctx) this.placeSound.play(this.ctx);
  }
}
