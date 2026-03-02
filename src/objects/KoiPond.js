import Phaser from 'phaser';

const SAND_H = 330;

const POND_SHAPES = {
  circular:  { w: 50, h: 50, rx: 23, ry: 23 },
  oval:      { w: 68, h: 46, rx: 32, ry: 21 },
  irregular: { w: 58, h: 50, rx: 27, ry: 23 },
};

const KOI_VARIANTS = [
  { name: 'classic',  body: [0xE8, 0x6A, 0x17], patch: [0xFF, 0xFF, 0xF0], seed: 0 },
  { name: 'showa',    body: [0xCC, 0x22, 0x22], patch: [0x1A, 0x1A, 0x1A], seed: 1.5 },
  { name: 'gold',     body: [0xDA, 0xA5, 0x20], patch: [0xF5, 0xD5, 0x60], seed: 3.0 },
  { name: 'platinum', body: [0xC8, 0xC8, 0xD0], patch: [0xF0, 0xF0, 0xF8], seed: 4.5 },
];

export class KoiPond {
  constructor(scene, x, y, shape) {
    this.scene = scene;
    this.shape = shape;
    this.elapsed = 0;

    const dims = POND_SHAPES[shape];
    this.w = dims.w;
    this.h = dims.h;
    this.rx = dims.rx;
    this.ry = dims.ry;

    this.id = 'pond_' + Date.now() + '_' + (Math.random() * 1000 | 0);

    this.waterMask = this._buildMask();

    this.container = scene.add.container(x, y);

    this._createWater();
    this._createShimmer();
    this.koi = this._createKoi();

    this.rippleGfx = scene.add.graphics();
    this.container.add(this.rippleGfx);
    this.ripples = [];
    this.nextRippleTime = 1000 + Math.random() * 2000;

    this.lilyPads = this._createLilyPads();
    this._createBorder();

    this.container.setSize(this.w + 4, this.h + 4);
    this.container.setInteractive({ draggable: true, useHandCursor: true });
    scene.input.setDraggable(this.container);
    this.container.on('drag', (_ptr, dragX, dragY) => {
      if (dragY < SAND_H) {
        this.container.x = dragX;
        this.container.y = dragY;
      }
    });
  }

  _buildMask() {
    const mask = new Uint8Array(this.w * this.h);
    const cx = this.w / 2;
    const cy = this.h / 2;

    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const dx = (x - cx) / this.rx;
        const dy = (y - cy) / this.ry;
        let dist = dx * dx + dy * dy;

        if (this.shape === 'irregular') {
          const angle = Math.atan2(y - cy, x - cx);
          const noise =
            Math.sin(angle * 2 + 1) * 0.08 +
            Math.sin(angle * 3 + 2) * 0.06 +
            Math.sin(angle * 5 + 0.5) * 0.04;
          dist /= (1 + noise) * (1 + noise);
        }

        mask[y * this.w + x] = dist <= 1.0 ? 1 : 0;
      }
    }
    return mask;
  }

  _isInPond(lx, ly) {
    const px = Math.floor(lx + this.w / 2);
    const py = Math.floor(ly + this.h / 2);
    if (px < 0 || px >= this.w || py < 0 || py >= this.h) return false;
    return this.waterMask[py * this.w + px] === 1;
  }

  _createWater() {
    const texId = this.id + '_w';
    this.waterTex = this.scene.textures.createCanvas(texId, this.w, this.h);
    const ctx = this.waterTex.context;
    const imgData = ctx.createImageData(this.w, this.h);
    const d = imgData.data;
    const cx = this.w / 2;
    const cy = this.h / 2;

    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = (y * this.w + x) * 4;
        if (this.waterMask[y * this.w + x]) {
          const dx = (x - cx) / this.rx;
          const dy = (y - cy) / this.ry;
          const distSq = dx * dx + dy * dy;

          const edgeDarken = 1 - distSq * 0.25;
          const texNoise = Math.sin(x * 7.3 + y * 11.7) * 3;

          d[i]     = Math.max(0, Math.min(255, Math.floor((0x2A + texNoise) * edgeDarken)));
          d[i + 1] = Math.max(0, Math.min(255, Math.floor((0x5E + texNoise) * edgeDarken)));
          d[i + 2] = Math.max(0, Math.min(255, Math.floor((0x72 + texNoise * 1.3) * edgeDarken)));
          d[i + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    this.waterTex.refresh();

    this.waterImg = this.scene.add.image(0, 0, texId);
    this.container.add(this.waterImg);
  }

  _createShimmer() {
    this.shimmerGfx = this.scene.add.graphics();
    this.container.add(this.shimmerGfx);
  }

  _createKoi() {
    const count = 3 + Math.floor(Math.random() * 2);
    const koi = [];

    for (let i = 0; i < count; i++) {
      const variant = KOI_VARIANTS[i % KOI_VARIANTS.length];
      const texId = this.id + '_k' + i;
      this._createKoiTexture(texId, variant);

      const sprite = this.scene.add.image(0, 0, texId);
      this.container.add(sprite);

      const pathRx = (this.rx - 6) * (0.3 + Math.random() * 0.5);
      const pathRy = (this.ry - 6) * (0.3 + Math.random() * 0.5);
      const freqOptions = [1, 2, 3];
      const freqX = freqOptions[Math.floor(Math.random() * freqOptions.length)];
      let freqY;
      do {
        freqY = freqOptions[Math.floor(Math.random() * freqOptions.length)];
      } while (freqY === freqX);

      koi.push({
        sprite,
        pathRx, pathRy,
        freqX, freqY,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speed: 0.0004 + Math.random() * 0.0003,
        prevX: 0, prevY: 0,
        wigglePhase: Math.random() * Math.PI * 2,
      });
    }
    return koi;
  }

  _createKoiTexture(texId, variant) {
    const w = 10, h = 5;
    const tex = this.scene.textures.createCanvas(texId, w, h);
    const ctx = tex.context;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    const cx = 4.5, cy = 2;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const headBias = px >= cx ? 0.85 : 1.15;
        const dx = (px - cx) / (4.2 * headBias);
        const dy = (py - cy) / 2;
        const dist = dx * dx + dy * dy;

        if (dist < 1.0) {
          const i = (py * w + px) * 4;
          const usePatch = Math.sin(px * 1.8 + py * 0.7 + variant.seed) > 0.2;
          const color = usePatch ? variant.patch : variant.body;
          const shade = 1.0 - (py - cy) * 0.06;
          d[i]     = Math.min(255, Math.floor(color[0] * shade));
          d[i + 1] = Math.min(255, Math.floor(color[1] * shade));
          d[i + 2] = Math.min(255, Math.floor(color[2] * shade));
          d[i + 3] = 255;
        }
      }
    }

    for (const [tx, ty] of [[0, 1], [0, 3]]) {
      const i = (ty * w + tx) * 4;
      d[i]     = Math.floor(variant.body[0] * 0.7);
      d[i + 1] = Math.floor(variant.body[1] * 0.7);
      d[i + 2] = Math.floor(variant.body[2] * 0.7);
      d[i + 3] = 200;
    }

    ctx.putImageData(imgData, 0, 0);
    tex.refresh();
  }

  _createLilyPads() {
    const count = 2 + Math.floor(Math.random() * 3);
    const pads = [];

    const padTexId = this.id + '_lp';
    this._createLilyPadTexture(padTexId);

    const flowerTexId = this.id + '_fl';
    this._createFlowerTexture(flowerTexId);

    for (let i = 0; i < count; i++) {
      let lx, ly, attempts = 0;
      do {
        lx = (Math.random() - 0.5) * this.rx * 1.4;
        ly = (Math.random() - 0.5) * this.ry * 1.4;
        attempts++;
      } while (!this._isInPond(lx, ly) && attempts < 50);

      if (attempts >= 50) continue;

      const padSprite = this.scene.add.image(lx, ly, padTexId);
      padSprite.rotation = Math.random() * Math.PI * 2;
      this.container.add(padSprite);

      const flowerSprite = this.scene.add.image(lx, ly, flowerTexId);
      flowerSprite.alpha = 0;
      this.container.add(flowerSprite);

      pads.push({
        sprite: padSprite,
        flower: flowerSprite,
        baseX: lx,
        baseY: ly,
        bobPhase: Math.random() * Math.PI * 2,
        bloomPhase: Math.random() * Math.PI * 2,
      });
    }
    return pads;
  }

  _createLilyPadTexture(texId) {
    const s = 7;
    const tex = this.scene.textures.createCanvas(texId, s, s);
    const ctx = tex.context;
    const imgData = ctx.createImageData(s, s);
    const d = imgData.data;

    const c = s / 2;
    const r = s / 2 - 0.5;

    for (let py = 0; py < s; py++) {
      for (let px = 0; px < s; px++) {
        const dx = px - c;
        const dy = py - c;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > r) continue;

        const angle = Math.atan2(dy, dx);
        if (angle > -0.3 && angle < 0.3 && dist > r * 0.3) continue;

        const i = (py * s + px) * 4;
        const green = 0x45 + Math.floor(Math.random() * 0x25);
        const dark = dist > r * 0.7 ? 0.8 : 1.0;
        d[i]     = Math.floor(0x1E * dark);
        d[i + 1] = Math.floor(green * dark);
        d[i + 2] = Math.floor(0x15 * dark);
        d[i + 3] = 220;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    tex.refresh();
  }

  _createFlowerTexture(texId) {
    const s = 5;
    const tex = this.scene.textures.createCanvas(texId, s, s);
    const ctx = tex.context;
    const imgData = ctx.createImageData(s, s);
    const d = imgData.data;

    const c = 2;
    const petals = [[c, 0], [0, c], [c, s - 1], [s - 1, c], [1, 1], [3, 1], [1, 3], [3, 3]];
    petals.forEach(([px, py]) => {
      const i = (py * s + px) * 4;
      d[i]     = 0xF0;
      d[i + 1] = 0xA8 + Math.floor(Math.random() * 0x20);
      d[i + 2] = 0xB8;
      d[i + 3] = 255;
    });

    const ci = (c * s + c) * 4;
    d[ci]     = 0xF5;
    d[ci + 1] = 0xE0;
    d[ci + 2] = 0x40;
    d[ci + 3] = 255;

    ctx.putImageData(imgData, 0, 0);
    tex.refresh();
  }

  _createBorder() {
    const gfx = this.scene.add.graphics();
    const steps = 80;
    const points = [];

    for (let s = 0; s < steps; s++) {
      const angle = (s / steps) * Math.PI * 2;
      let r = 1;
      if (this.shape === 'irregular') {
        r += Math.sin(angle * 2 + 1) * 0.08 +
             Math.sin(angle * 3 + 2) * 0.06 +
             Math.sin(angle * 5 + 0.5) * 0.04;
      }
      points.push({
        x: this.rx * r * Math.cos(angle),
        y: this.ry * r * Math.sin(angle),
      });
    }

    gfx.lineStyle(2, 0x787870, 0.9);
    gfx.beginPath();
    gfx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      gfx.lineTo(points[i].x, points[i].y);
    }
    gfx.closePath();
    gfx.strokePath();

    for (let i = 0; i < points.length; i++) {
      if (Math.random() < 0.5) {
        const p = points[i];
        const ox = (Math.random() - 0.5) * 3;
        const oy = (Math.random() - 0.5) * 3;
        const shade = 0x60 + Math.floor(Math.random() * 0x30);
        gfx.fillStyle((shade << 16) | (shade << 8) | Math.max(0, shade - 5), 0.7);
        gfx.fillCircle(p.x + ox, p.y + oy, 1 + Math.random());
      }
    }

    this.container.add(gfx);
  }

  _spawnRipple(rx, ry) {
    this.ripples.push({
      x: rx, y: ry,
      age: 0,
      lifetime: 1500 + Math.random() * 1000,
      maxRadius: 4 + Math.random() * 6,
    });
  }

  update(delta) {
    this.elapsed += delta;
    const t = this.elapsed * 0.001;

    this.shimmerGfx.clear();
    for (let i = 0; i < 4; i++) {
      const sx = Math.sin(t * 0.5 + i * 1.5) * this.rx * 0.6;
      const sy = Math.cos(t * 0.3 + i * 2.1) * this.ry * 0.5;
      if (this._isInPond(sx, sy)) {
        const a = 0.07 + Math.sin(t * 0.8 + i) * 0.03;
        this.shimmerGfx.fillStyle(0xFFFFFF, Math.max(0.01, a));
        this.shimmerGfx.fillEllipse(sx, sy, 8 + Math.sin(t + i) * 2, 4 + Math.cos(t + i * 0.7) * 1.5);
      }
    }

    this.koi.forEach((k) => {
      const kt = this.elapsed * k.speed;
      const nx = Math.sin(k.freqX * kt + k.phaseX) * k.pathRx;
      const ny = Math.sin(k.freqY * kt + k.phaseY) * k.pathRy;

      const ddx = nx - k.prevX;
      const ddy = ny - k.prevY;
      if (Math.abs(ddx) > 0.01 || Math.abs(ddy) > 0.01) {
        const baseAngle = Math.atan2(ddy, ddx);
        const wiggle = Math.sin(this.elapsed * k.speed * 25 + k.wigglePhase) * 0.12;
        k.sprite.rotation = baseAngle + wiggle;
      }

      k.sprite.x = nx;
      k.sprite.y = ny;
      k.prevX = nx;
      k.prevY = ny;

      if (Math.random() < 0.002) {
        this._spawnRipple(nx, ny);
      }
    });

    this.lilyPads.forEach(pad => {
      const bob = Math.sin(t * 0.5 + pad.bobPhase);
      pad.sprite.x = pad.baseX + bob * 0.5;
      pad.sprite.y = pad.baseY + Math.cos(t * 0.35 + pad.bobPhase) * 0.3;
      pad.flower.x = pad.sprite.x;
      pad.flower.y = pad.sprite.y;

      const bloom = Math.sin(t * 0.15 + pad.bloomPhase);
      pad.flower.alpha = Math.max(0, bloom);
    });

    this.nextRippleTime -= delta;
    if (this.nextRippleTime <= 0) {
      let rx, ry, attempts = 0;
      do {
        rx = (Math.random() - 0.5) * this.rx * 1.4;
        ry = (Math.random() - 0.5) * this.ry * 1.4;
        attempts++;
      } while (!this._isInPond(rx, ry) && attempts < 20);
      if (attempts < 20) this._spawnRipple(rx, ry);
      this.nextRippleTime = 2000 + Math.random() * 4000;
    }

    this.rippleGfx.clear();
    this.ripples = this.ripples.filter(r => {
      r.age += delta;
      const p = r.age / r.lifetime;
      if (p >= 1) return false;

      const alpha = (1 - p) * 0.4;
      const radius = r.maxRadius * p;
      this.rippleGfx.lineStyle(1, 0x8EB8C4, alpha);
      this.rippleGfx.strokeCircle(r.x, r.y, radius);
      if (radius > 2) {
        this.rippleGfx.lineStyle(1, 0x8EB8C4, alpha * 0.5);
        this.rippleGfx.strokeCircle(r.x, r.y, radius * 0.55);
      }
      return true;
    });
  }
}
