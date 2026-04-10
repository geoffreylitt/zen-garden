import { W, SAND_H, BG_COLOR } from '../constants.js';

function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export class SandCanvas {
  constructor(scene, gardenMask) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.pixels = null;
    this.texture = null;
    this.dirty = false;
  }

  create() {
    this.texture = this.scene.textures.createCanvas('sand', W, SAND_H);
    this.pixels = new Uint8ClampedArray(W * SAND_H * 4);
    this.fill();
    this.sync();
    this.scene.add.image(W / 2, SAND_H / 2, 'sand');
  }

  fill() {
    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (this.gardenMask.data[y * W + x]) {
          // Rainbow gradient: hue cycles across x, shifts with y
          const hue = ((x / W) + (y / SAND_H) * 0.5) % 1.0;
          const noise = (Math.random() - 0.5) * 0.04;
          const [r, g, b] = hsvToRgb((hue + noise + 1) % 1.0, 0.55, 0.98);
          this.pixels[i]     = r;
          this.pixels[i + 1] = g;
          this.pixels[i + 2] = b;
          this.pixels[i + 3] = 255;
        } else {
          this.pixels[i]     = BG_COLOR[0];
          this.pixels[i + 1] = BG_COLOR[1];
          this.pixels[i + 2] = BG_COLOR[2];
          this.pixels[i + 3] = 255;
        }
      }
    }
    this.dirty = true;
  }

  setPixel(x, y, color) {
    const i = (y * W + x) * 4;
    this.pixels[i]     = color[0];
    this.pixels[i + 1] = color[1];
    this.pixels[i + 2] = color[2];
    this.pixels[i + 3] = 255;
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
