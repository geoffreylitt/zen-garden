import { W, SAND_H, BG_COLOR, SAND_PALETTES, PALETTE_ORDER } from '../constants.js';

// pixelState values
const STATE_BG     = 0;
const STATE_BASE   = 1;
const STATE_GROOVE = 2;
const STATE_RIDGE  = 3;

export class SandCanvas {
  constructor(scene, gardenMask) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.pixels = null;
    this.texture = null;
    this.dirty = false;
    this.pixelState = null; // Uint8Array tracking per-pixel type
    this._paletteKey = 'TAN';
  }

  get palette() {
    return SAND_PALETTES[this._paletteKey];
  }

  get grooveColor() {
    return this.palette.groove;
  }

  get ridgeColor() {
    return this.palette.ridge;
  }

  create() {
    this.texture = this.scene.textures.createCanvas('sand', W, SAND_H);
    this.pixels = new Uint8ClampedArray(W * SAND_H * 4);
    this.pixelState = new Uint8Array(W * SAND_H);
    this.fill();
    this.sync();
    this.scene.add.image(W / 2, SAND_H / 2, 'sand');
  }

  fill() {
    const { base } = this.palette;
    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        const i = idx * 4;
        if (this.gardenMask.data[idx]) {
          const noise = (Math.random() - 0.5) * 16;
          this.pixels[i]     = base[0] + noise;
          this.pixels[i + 1] = base[1] + noise;
          this.pixels[i + 2] = base[2] + noise;
          this.pixels[i + 3] = 255;
          this.pixelState[idx] = STATE_BASE;
        } else {
          this.pixels[i]     = BG_COLOR[0];
          this.pixels[i + 1] = BG_COLOR[1];
          this.pixels[i + 2] = BG_COLOR[2];
          this.pixels[i + 3] = 255;
          this.pixelState[idx] = STATE_BG;
        }
      }
    }
    this.dirty = true;
  }

  // Set a pixel to groove or ridge color and record its state.
  setGroove(x, y) {
    this._setState(x, y, STATE_GROOVE, this.grooveColor);
  }

  setRidge(x, y) {
    this._setState(x, y, STATE_RIDGE, this.ridgeColor);
  }

  // Legacy setPixel kept for any external callers; infers state from color identity.
  setPixel(x, y, color) {
    const i = (y * W + x) * 4;
    this.pixels[i]     = color[0];
    this.pixels[i + 1] = color[1];
    this.pixels[i + 2] = color[2];
    this.pixels[i + 3] = 255;
  }

  _setState(x, y, state, color) {
    const idx = y * W + x;
    const i = idx * 4;
    this.pixels[i]     = color[0];
    this.pixels[i + 1] = color[1];
    this.pixels[i + 2] = color[2];
    this.pixels[i + 3] = 255;
    this.pixelState[idx] = state;
  }

  /**
   * Switch to a different sand palette, recoloring all pixels while
   * preserving the raked groove/ridge pattern.
   */
  setPalette(paletteKey) {
    this._paletteKey = paletteKey;
    const { base, groove, ridge } = this.palette;
    for (let idx = 0; idx < this.pixelState.length; idx++) {
      const i = idx * 4;
      const state = this.pixelState[idx];
      if (state === STATE_BASE) {
        const noise = (Math.random() - 0.5) * 16;
        this.pixels[i]     = base[0] + noise;
        this.pixels[i + 1] = base[1] + noise;
        this.pixels[i + 2] = base[2] + noise;
      } else if (state === STATE_GROOVE) {
        this.pixels[i]     = groove[0];
        this.pixels[i + 1] = groove[1];
        this.pixels[i + 2] = groove[2];
      } else if (state === STATE_RIDGE) {
        this.pixels[i]     = ridge[0];
        this.pixels[i + 1] = ridge[1];
        this.pixels[i + 2] = ridge[2];
      }
      // STATE_BG stays as BG_COLOR — unchanged
    }
    this.dirty = true;
  }

  sync() {
    const ctx = this.texture.context;
    const imageData = ctx.createImageData(W, SAND_H);
    imageData.data.set(this.pixels);
    ctx.putImageData(imageData, 0, 0);
    this.texture.refresh();
    this.dirty = false;
  }

  clear() {
    this.fill();
    this.sync();
  }
}
