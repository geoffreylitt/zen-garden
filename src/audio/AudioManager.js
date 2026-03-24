import { WindLayer } from './WindLayer.js';
import { ChimesLayer } from './ChimesLayer.js';
import { CicadasLayer } from './CicadasLayer.js';
import { RakeSound } from './RakeSound.js';
import { PlaceSound } from './PlaceSound.js';
import { FOG_MUFFLE_MIN_FREQ, FOG_MUFFLE_MAX_FREQ } from '../constants.js';

export class AudioManager {
  constructor() {
    this.started = false;
    this.ctx = null;
    this.masterGain = null;
    this.muffleFilter = null;
    this.layers = {
      wind: new WindLayer(),
      chimes: new ChimesLayer(),
      cicadas: new CicadasLayer(),
    };
    this.rakeSound = new RakeSound();
    this.placeSound = new PlaceSound();
  }

  get masterOutput() {
    return this.masterGain || (this.ctx && this.ctx.destination) || null;
  }

  ensureStarted() {
    if (this.started) return;
    this.started = true;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      this.muffleFilter = this.ctx.createBiquadFilter();
      this.muffleFilter.type = 'lowpass';
      this.muffleFilter.frequency.value = FOG_MUFFLE_MAX_FREQ;
      this.muffleFilter.Q.value = 0.7;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.muffleFilter);
      this.muffleFilter.connect(this.ctx.destination);

      for (const layer of Object.values(this.layers)) {
        layer.setup(this.ctx, this.masterGain);
      }
      this.rakeSound.setup(this.ctx, this.masterGain);
    } catch (e) {
      // Web Audio not available
    }
  }

  /**
   * Update the muffle filter cutoff based on current fog density (0-1).
   * At density 0 the cutoff sits at max (wide open). At density 1 it
   * drops to FOG_MUFFLE_MIN_FREQ for a heavy muffled effect.
   */
  updateFogMuffle(density) {
    if (!this.muffleFilter || !this.ctx) return;
    const freq =
      FOG_MUFFLE_MAX_FREQ -
      (FOG_MUFFLE_MAX_FREQ - FOG_MUFFLE_MIN_FREQ) * density;
    const t = this.ctx.currentTime;
    this.muffleFilter.frequency.cancelScheduledValues(t);
    this.muffleFilter.frequency.setValueAtTime(
      this.muffleFilter.frequency.value,
      t,
    );
    this.muffleFilter.frequency.linearRampToValueAtTime(freq, t + 0.3);
  }

  updateLayerGain(key) {
    const layer = this.layers[key];
    if (layer && this.ctx) layer.updateGain(this.ctx);
  }

  get anyLayerEnabled() {
    return Object.values(this.layers).some(l => l.enabled);
  }

  startRake() {
    if (this.rakeSound && this.ctx) this.rakeSound.start(this.ctx);
  }

  stopRake() {
    if (this.rakeSound && this.ctx) this.rakeSound.stop(this.ctx);
  }

  playPlace() {
    if (this.placeSound && this.ctx) this.placeSound.play(this.ctx, this.masterGain);
  }
}
