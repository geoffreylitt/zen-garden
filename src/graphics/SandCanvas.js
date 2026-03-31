import { W, SAND_H, SAND_BASE, SAND_WARM, SAND_COOL, BG_COLOR } from '../constants.js';

// Simple hash-based pseudo-random for deterministic noise
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263 + 1013904223) | 0;
  h = ((h >> 13) ^ h) | 0;
  h = (h * (h * h * 15731 + 789221) + 1376312589) | 0;
  return ((h >> 16) & 0x7fff) / 0x7fff;
}

function smoothNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);

  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);

  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbmNoise(x, y) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    val += smoothNoise(x * freq, y * freq) * amp;
    amp *= 0.5;
    freq *= 2.0;
  }
  return val;
}

function lerpColor(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
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
          const largeFbm = fbmNoise(x * 0.015, y * 0.015);
          const medFbm = fbmNoise(x * 0.06 + 100, y * 0.06 + 100);
          const fineFbm = fbmNoise(x * 0.2 + 200, y * 0.2 + 200);

          const warmCool = largeFbm;
          const base = lerpColor(SAND_COOL, SAND_WARM, warmCool);

          const medShift = (medFbm - 0.5) * 14;
          const fineShift = (fineFbm - 0.5) * 8;

          const grain = (hash(x, y) - 0.5) * 10;

          this.pixels[i]     = base[0] + medShift + fineShift + grain;
          this.pixels[i + 1] = base[1] + medShift + fineShift + grain;
          this.pixels[i + 2] = base[2] + medShift * 0.8 + fineShift * 0.8 + grain;
          this.pixels[i + 3] = 255;
        } else {
          this.pixels[i] = BG_COLOR[0];
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
    this.pixels[i] = color[0];
    this.pixels[i + 1] = color[1];
    this.pixels[i + 2] = color[2];
    this.pixels[i + 3] = 255;
  }

  blendPixel(x, y, color, alpha) {
    const i = (y * W + x) * 4;
    const inv = 1 - alpha;
    this.pixels[i]     = this.pixels[i]     * inv + color[0] * alpha;
    this.pixels[i + 1] = this.pixels[i + 1] * inv + color[1] * alpha;
    this.pixels[i + 2] = this.pixels[i + 2] * inv + color[2] * alpha;
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
