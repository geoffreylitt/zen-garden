import { W, SAND_H } from '../constants.js';

// 5 moss colour variants (rgb) — forest to olive greens
const VARIANTS = [
  [0x4a, 0x6e, 0x2c],
  [0x58, 0x7a, 0x30],
  [0x3a, 0x58, 0x1e],
  [0x60, 0x78, 0x2e],
  [0x40, 0x68, 0x38],
];

export class MossCanvas {
  constructor(scene, gardenMask) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    // 0 = no moss, 1-5 = variant index+1
    // Easily serialisable for save/load.
    this.mossData = new Uint8Array(W * SAND_H);
    this.texture = null;
    this.image = null;
    this.dirty = false;
  }

  create() {
    this.texture = this.scene.textures.createCanvas('moss', W, SAND_H);
    this.image = this.scene.add.image(W / 2, SAND_H / 2, 'moss');
    this.sync();
  }

  // Paint moss in a circle centred on (cx,cy) with soft noise-jittered edges.
  paint(cx, cy, radius) {
    const innerR = radius * 0.65;
    const x0 = Math.max(0, Math.floor(cx - radius - 2));
    const x1 = Math.min(W - 1, Math.ceil(cx + radius + 2));
    const y0 = Math.max(0, Math.floor(cy - radius - 2));
    const y1 = Math.min(SAND_H - 1, Math.ceil(cy + radius + 2));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!this.gardenMask.isInGarden(x, y)) continue;
        const dx = x - cx;
        const dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > radius) continue;

        if (d > innerR) {
          // Feathered edge: mix of deterministic noise + light randomness
          const t = (d - innerR) / (radius - innerR); // 0→1 inner→outer
          const noise =
            Math.sin(x * 0.41 + y * 0.37) * 0.5 +
            Math.sin(x * 0.73 - y * 0.59) * 0.3 +
            Math.random() * 0.4;
          if (noise < t) continue;
        }

        if (this.mossData[y * W + x] === 0) {
          this.mossData[y * W + x] = this.pickVariant(x, y);
          this.dirty = true;
        }
      }
    }
  }

  // Erase moss in a hard-edged circle.
  erase(cx, cy, radius) {
    const r2 = radius * radius;
    const x0 = Math.max(0, Math.floor(cx - radius));
    const x1 = Math.min(W - 1, Math.ceil(cx + radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const y1 = Math.min(SAND_H - 1, Math.ceil(cy + radius));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2 && this.mossData[y * W + x] !== 0) {
          this.mossData[y * W + x] = 0;
          this.dirty = true;
        }
      }
    }
  }

  // Spatially coherent variant assignment — nearby pixels share the same variant.
  pickVariant(x, y) {
    const n =
      (Math.sin(x * 0.09 + y * 0.07) +
       Math.sin(x * 0.14 - y * 0.11) +
       Math.sin(x * 0.06 + y * 0.17)) / 3; // -1..1
    return Math.min(5, Math.max(1, Math.ceil(((n + 1) / 2) * 5)));
  }

  sync() {
    const ctx = this.texture.context;
    const imgData = ctx.createImageData(W, SAND_H);
    const d = imgData.data;

    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const v = this.mossData[y * W + x];
        if (v === 0) {
          d[i + 3] = 0; // fully transparent — shows sand beneath
          continue;
        }

        const base = VARIANTS[v - 1];
        // Sub-pixel colour variation using deterministic trig noise
        const jitter = Math.round(
          Math.sin(x * 7 + y * 13) * 8 + Math.cos(x * 5 - y * 11) * 6
        );
        d[i]     = Math.max(0, Math.min(255, base[0] + jitter));
        d[i + 1] = Math.max(0, Math.min(255, base[1] + jitter));
        d[i + 2] = Math.max(0, Math.min(255, base[2] + Math.round(jitter * 0.4)));
        d[i + 3] = 220; // slight transparency keeps sand texture subtly visible

        // Rare tiny details (~0.5 % coverage): dark leaf flecks and pale pebbles
        const hash = (x * 6271 + y * 3571) & 0xfff;
        if (hash < 20) {
          d[i]     = Math.max(0, d[i]     - 30);
          d[i + 1] = Math.max(0, d[i + 1] - 25);
          d[i + 2] = Math.max(0, d[i + 2] +  5);
        } else if (hash > 0xff0) {
          d[i]     = Math.min(255, d[i]     + 40);
          d[i + 1] = Math.min(255, d[i + 1] + 35);
          d[i + 2] = Math.min(255, d[i + 2] + 20);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this.texture.refresh();
    this.dirty = false;
  }

  clear() {
    this.mossData.fill(0);
    this.dirty = false;
    this.sync();
  }
}
