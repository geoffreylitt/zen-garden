import { WindLayer } from './WindLayer.js';
import { ChimesLayer } from './ChimesLayer.js';
import { CicadasLayer } from './CicadasLayer.js';
import { StreamLayer } from './StreamLayer.js';
import { ShishiOdoshiLayer } from './ShishiOdoshiLayer.js';
import { TsukubaiLayer } from './TsukubaiLayer.js';
import { RakeSound } from './RakeSound.js';
import { PlaceSound } from './PlaceSound.js';

export class AudioManager {
  constructor() {
    this.started = false;
    this.ctx = null;
    this.layers = {
      wind: new WindLayer(),
      chimes: new ChimesLayer(),
      cicadas: new CicadasLayer(),
      stream: new StreamLayer(),
      shishiodoshi: new ShishiOdoshiLayer(),
      tsukubai: new TsukubaiLayer(),
    };
    this.rakeSound = new RakeSound();
    this.placeSound = new PlaceSound();
  }

  ensureStarted() {
    if (this.started) return;
    this.started = true;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      for (const layer of Object.values(this.layers)) {
        layer.setup(this.ctx);
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
