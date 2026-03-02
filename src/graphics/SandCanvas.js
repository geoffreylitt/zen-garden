import { W, SAND_H, SAND_BASE, BG_COLOR } from '../constants.js';

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
          const noise = (Math.random() - 0.5) * 16;
          this.pixels[i] = SAND_BASE[0] + noise;
          this.pixels[i + 1] = SAND_BASE[1] + noise;
          this.pixels[i + 2] = SAND_BASE[2] + noise;
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
