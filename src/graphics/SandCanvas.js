import { W, SAND_H, DAY_THEME } from '../constants.js';

// pixelStates values
const STATE_BG = 0;
const STATE_SAND = 1;
const STATE_GROOVE = 2;
const STATE_RIDGE = 3;

export class SandCanvas {
  constructor(scene, gardenMask) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.pixels = null;
    this.pixelStates = null;
    this.texture = null;
    this.dirty = false;
    this.theme = DAY_THEME;
  }

  create() {
    this.texture = this.scene.textures.createCanvas('sand', W, SAND_H);
    this.pixels = new Uint8ClampedArray(W * SAND_H * 4);
    this.pixelStates = new Uint8Array(W * SAND_H);
    this.fill();
    this.sync();
    this.scene.add.image(W / 2, SAND_H / 2, 'sand');
  }

  fill() {
    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        const i = idx * 4;
        if (this.gardenMask.data[idx]) {
          const noise = (Math.random() - 0.5) * 16;
          this.pixels[i] = Math.max(0, Math.min(255, this.theme.sandBase[0] + noise));
          this.pixels[i + 1] = Math.max(0, Math.min(255, this.theme.sandBase[1] + noise));
          this.pixels[i + 2] = Math.max(0, Math.min(255, this.theme.sandBase[2] + noise));
          this.pixels[i + 3] = 255;
          this.pixelStates[idx] = STATE_SAND;
        } else {
          this.pixels[i] = this.theme.bgColor[0];
          this.pixels[i + 1] = this.theme.bgColor[1];
          this.pixels[i + 2] = this.theme.bgColor[2];
          this.pixels[i + 3] = 255;
          this.pixelStates[idx] = STATE_BG;
        }
      }
    }
    this.dirty = true;
  }

  setPixel(x, y, color) {
    const i = (y * W + x) * 4;
    this.pixels[i] = color[0];
    this.pixels[i + 1] = color[1];
    this.pixels[i + 2] = color[2];
    this.pixels[i + 3] = 255;
  }

  setGroove(x, y) {
    const idx = y * W + x;
    this.pixelStates[idx] = STATE_GROOVE;
    this.setPixel(x, y, this.theme.grooveColor);
  }

  setRidge(x, y) {
    const idx = y * W + x;
    this.pixelStates[idx] = STATE_RIDGE;
    this.setPixel(x, y, this.theme.ridgeColor);
  }

  setTheme(theme) {
    this.theme = theme;
    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        const i = idx * 4;
        const state = this.pixelStates[idx];
        if (state === STATE_BG) {
          this.pixels[i] = theme.bgColor[0];
          this.pixels[i + 1] = theme.bgColor[1];
          this.pixels[i + 2] = theme.bgColor[2];
          this.pixels[i + 3] = 255;
        } else if (state === STATE_GROOVE) {
          this.pixels[i] = theme.grooveColor[0];
          this.pixels[i + 1] = theme.grooveColor[1];
          this.pixels[i + 2] = theme.grooveColor[2];
          this.pixels[i + 3] = 255;
        } else if (state === STATE_RIDGE) {
          this.pixels[i] = theme.ridgeColor[0];
          this.pixels[i + 1] = theme.ridgeColor[1];
          this.pixels[i + 2] = theme.ridgeColor[2];
          this.pixels[i + 3] = 255;
        } else {
          // base sand — apply new noise
          const noise = (Math.random() - 0.5) * 16;
          this.pixels[i] = Math.max(0, Math.min(255, theme.sandBase[0] + noise));
          this.pixels[i + 1] = Math.max(0, Math.min(255, theme.sandBase[1] + noise));
          this.pixels[i + 2] = Math.max(0, Math.min(255, theme.sandBase[2] + noise));
          this.pixels[i + 3] = 255;
        }
      }
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
