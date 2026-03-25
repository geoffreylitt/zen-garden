import { W, SAND_H } from '../constants.js';

const LEAF_COLORS = [
  [0xc8, 0x5a, 0x2a], // burnt orange
  [0xb8, 0x3b, 0x1e], // deep red
  [0xd4, 0x8b, 0x2c], // amber
  [0x8b, 0x6e, 0x2f], // brown
  [0xcc, 0x70, 0x30], // rust
  [0xa0, 0x82, 0x30], // olive gold
];

const MAX_LEAVES = 18;
const SPAWN_INTERVAL = 1800;

function createLeafTexture(scene, colorIdx) {
  const id = `leaf_${colorIdx}_${Date.now()}_${Math.random()}`;
  const w = 5;
  const h = 4;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const base = LEAF_COLORS[colorIdx % LEAF_COLORS.length];

  const shape = [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 0, 0],
  ];

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (shape[py][px]) {
        const i = (py * w + px) * 4;
        const vary = (Math.random() - 0.5) * 20;
        d[i] = Math.min(255, Math.max(0, base[0] + vary));
        d[i + 1] = Math.min(255, Math.max(0, base[1] + vary * 0.5));
        d[i + 2] = Math.min(255, Math.max(0, base[2] + vary * 0.3));
        d[i + 3] = 200 + Math.floor(Math.random() * 55);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}

export class FallingLeaves {
  constructor(scene) {
    this.scene = scene;
    this.leaves = [];
    this.timer = 0;
  }

  create() {
    for (let i = 0; i < 5; i++) {
      this._spawnLeaf(true);
    }
  }

  _spawnLeaf(randomY = false) {
    if (this.leaves.length >= MAX_LEAVES) return;

    const colorIdx = Math.floor(Math.random() * LEAF_COLORS.length);
    const texId = createLeafTexture(this.scene, colorIdx);
    const x = Math.random() * W;
    const y = randomY ? Math.random() * SAND_H * 0.6 : -6;

    const sprite = this.scene.add.image(x, y, texId);
    sprite.setDepth(100);
    sprite.setAlpha(0.7 + Math.random() * 0.3);

    this.leaves.push({
      sprite,
      vy: 0.15 + Math.random() * 0.25,
      vx: (Math.random() - 0.5) * 0.3,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.015,
      swayAmp: 0.3 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
    });
  }

  update(delta) {
    this.timer += delta;
    if (this.timer >= SPAWN_INTERVAL) {
      this.timer -= SPAWN_INTERVAL;
      this._spawnLeaf();
    }

    for (let i = this.leaves.length - 1; i >= 0; i--) {
      const leaf = this.leaves[i];
      leaf.sway += leaf.swaySpeed * delta;
      leaf.sprite.x += leaf.vx + Math.sin(leaf.sway) * leaf.swayAmp * 0.1;
      leaf.sprite.y += leaf.vy;
      leaf.rotation += leaf.rotSpeed;
      leaf.sprite.setRotation(leaf.rotation);

      if (leaf.sprite.y > SAND_H + 10 || leaf.sprite.x < -10 || leaf.sprite.x > W + 10) {
        leaf.sprite.destroy();
        this.leaves.splice(i, 1);
      }
    }
  }
}
