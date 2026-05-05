import { W, SAND_H, BG_COLOR, TILE_SIZE, DISCO_COLORS } from '../constants.js';

// Convert a hex color int to [r, g, b]
function hexToRgb(hex) {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

export class SandCanvas {
  constructor(scene, gardenMask) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.pixels = null;
    this.texture = null;
    this.dirty = false;
    // tile color indices for flashing
    this._tileColors = null;
    this._flashTimer = 0;
  }

  create() {
    this.texture = this.scene.textures.createCanvas('sand', W, SAND_H);
    this.pixels = new Uint8ClampedArray(W * SAND_H * 4);
    this._initTileColors();
    this.fill();
    this.sync();
    this.scene.add.image(W / 2, SAND_H / 2, 'sand');
  }

  _initTileColors() {
    const cols = Math.ceil(W / TILE_SIZE);
    const rows = Math.ceil(SAND_H / TILE_SIZE);
    this._tileColors = new Array(rows * cols);
    for (let i = 0; i < this._tileColors.length; i++) {
      this._tileColors[i] = Math.floor(Math.random() * DISCO_COLORS.length);
    }
  }

  fill() {
    const cols = Math.ceil(W / TILE_SIZE);

    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (this.gardenMask.data[y * W + x]) {
          const tileCol = Math.floor(x / TILE_SIZE);
          const tileRow = Math.floor(y / TILE_SIZE);
          const tileIdx = tileRow * cols + tileCol;
          const colorIdx = this._tileColors[tileIdx];
          const base = hexToRgb(DISCO_COLORS[colorIdx]);
          // Dark tile: use a dim version of the neon color
          const dimFactor = 0.12 + Math.random() * 0.04;
          // Add a bright center highlight to each tile
          const tx = x % TILE_SIZE;
          const ty = y % TILE_SIZE;
          const isEdge = tx === 0 || ty === 0;
          const isBright =
            (tx >= 4 && tx <= 7 && ty >= 4 && ty <= 7);
          if (isEdge) {
            this.pixels[i] = 0x05;
            this.pixels[i + 1] = 0x05;
            this.pixels[i + 2] = 0x10;
          } else if (isBright) {
            // Bright center square of each tile
            this.pixels[i] = Math.min(255, base[0] * 0.6 + 20);
            this.pixels[i + 1] = Math.min(255, base[1] * 0.6 + 20);
            this.pixels[i + 2] = Math.min(255, base[2] * 0.6 + 20);
          } else {
            this.pixels[i] = base[0] * dimFactor;
            this.pixels[i + 1] = base[1] * dimFactor;
            this.pixels[i + 2] = base[2] * dimFactor;
          }
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

  // Flash a subset of tiles to random new colors (called from scene update)
  flashTiles(beatPhase) {
    const cols = Math.ceil(W / TILE_SIZE);
    const rows = Math.ceil(SAND_H / TILE_SIZE);

    // On beat, flash a random set of tiles
    const flashCount = Math.floor(cols * rows * 0.08);
    for (let n = 0; n < flashCount; n++) {
      const tileIdx = Math.floor(Math.random() * this._tileColors.length);
      this._tileColors[tileIdx] = Math.floor(Math.random() * DISCO_COLORS.length);
    }

    // On strong beat, flash the entire floor briefly
    if (beatPhase < 0.1) {
      for (let i = 0; i < this._tileColors.length; i++) {
        if (Math.random() < 0.3) {
          this._tileColors[i] = Math.floor(Math.random() * DISCO_COLORS.length);
        }
      }
    }

    this.fill();
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
    this._initTileColors();
    this.fill();
    this.sync();
  }
}
