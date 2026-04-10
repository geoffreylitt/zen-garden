import { W, SAND_H, BG_COLOR } from '../constants.js';

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
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
          // Diagonal rainbow: hue sweeps left-to-right, y adds a wavy offset
          const hue = (x / W * 360 + y * 0.7 + Math.sin(y * 0.05) * 30) % 360;
          const noise = (Math.random() - 0.5) * 22;
          const [r, g, b] = hslToRgb((hue + noise + 360) % 360, 0.78, 0.70);
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
