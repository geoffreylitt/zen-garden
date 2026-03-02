import Phaser from 'phaser';

const W = 480;
const H = 360;
const TOOLBAR_H = 30;
const SAND_H = H - TOOLBAR_H;

// Isometric garden shape — wide, short ellipse (viewed from ~30° above)
const GARDEN_CX = W / 2;
const GARDEN_CY = SAND_H * 0.44;
const GARDEN_RX = W * 0.44;
const GARDEN_RY = SAND_H * 0.27;
const BORDER_RIM_H = 8;

const SAND_BASE = [0xd2, 0xc4, 0xa0];
const GROOVE_COLOR = [0xb0, 0xa0, 0x78];
const RIDGE_COLOR = [0xe8, 0xdc, 0xbc];

const TINE_COUNT = 5;
const TINE_SPACING = 3;

export class GardenScene extends Phaser.Scene {
  constructor() {
    super('GardenScene');
    this.activeTool = 'RAKE';
    this.dragging = false;
    this.lastPointer = null;
    this.gardenMask = null;
    this.sandPixels = null;
    this.sandDirty = false;
    this.placedItems = [];
    this.audioStarted = false;
    this.soundEnabled = true;
    this.audioCtx = null;
    this.windGain = null;
    this.rakeGain = null;
  }

  create() {
    this.buildGardenMask();
    this.createSandCanvas();
    this.drawBorder();
    this.createToolbar();
    this.setupInput();
  }

  // --- Garden Boundary (isometric ellipse) ---
  buildGardenMask() {
    this.gardenMask = new Uint8Array(W * SAND_H);

    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const angle = Math.atan2(y - GARDEN_CY, x - GARDEN_CX);
        const noise =
          Math.sin(angle * 3) * 0.06 +
          Math.sin(angle * 5 + 1) * 0.04 +
          Math.sin(angle * 7 + 2) * 0.03 +
          Math.sin(angle * 11 + 3) * 0.02;
        const dx = (x - GARDEN_CX) / (GARDEN_RX * (1 + noise));
        const dy = (y - GARDEN_CY) / (GARDEN_RY * (1 + noise));
        this.gardenMask[y * W + x] = (dx * dx + dy * dy) <= 1.0 ? 1 : 0;
      }
    }
  }

  isInGarden(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= SAND_H) return false;
    return this.gardenMask[y * W + x] === 1;
  }

  // --- Sand Canvas ---
  createSandCanvas() {
    this.sandTexture = this.textures.createCanvas('sand', W, SAND_H);
    this.sandPixels = new Uint8ClampedArray(W * SAND_H * 4);
    this.fillSand();
    this.syncSandToCanvas();
    const sandImg = this.add.image(W / 2, SAND_H / 2, 'sand');
    sandImg.setDepth(-10);
  }

  fillSand() {
    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (this.gardenMask[y * W + x]) {
          const noise = (Math.random() - 0.5) * 16;
          const perspShift = ((y - GARDEN_CY) / GARDEN_RY) * 4;
          this.sandPixels[i]     = Math.min(255, Math.max(0, SAND_BASE[0] + noise + perspShift));
          this.sandPixels[i + 1] = Math.min(255, Math.max(0, SAND_BASE[1] + noise + perspShift));
          this.sandPixels[i + 2] = Math.min(255, Math.max(0, SAND_BASE[2] + noise + perspShift * 0.5));
          this.sandPixels[i + 3] = 255;
        } else {
          const yFade = y / SAND_H;
          const base = 0x36 + Math.floor(yFade * 6);
          this.sandPixels[i]     = base + 2;
          this.sandPixels[i + 1] = base + 3;
          this.sandPixels[i + 2] = base;
          this.sandPixels[i + 3] = 255;
        }
      }
    }
    this.sandDirty = true;
  }

  syncSandToCanvas() {
    const ctx = this.sandTexture.context;
    const imageData = ctx.createImageData(W, SAND_H);
    imageData.data.set(this.sandPixels);
    ctx.putImageData(imageData, 0, 0);
    this.sandTexture.refresh();
    this.sandDirty = false;
  }

  // --- Border (3D raised rim for isometric depth) ---
  borderNoise(angle) {
    return (
      Math.sin(angle * 3) * 0.06 +
      Math.sin(angle * 5 + 1) * 0.04 +
      Math.sin(angle * 7 + 2) * 0.03 +
      Math.sin(angle * 11 + 3) * 0.02
    );
  }

  drawBorder() {
    const steps = 200;
    const points = [];
    for (let s = 0; s < steps; s++) {
      const angle = (s / steps) * Math.PI * 2;
      const r = 1 + this.borderNoise(angle);
      points.push({
        x: GARDEN_CX + GARDEN_RX * r * Math.cos(angle),
        y: GARDEN_CY + GARDEN_RY * r * Math.sin(angle),
        angle,
      });
    }

    // Front rim face (visible on near/bottom side of border)
    const rimGfx = this.add.graphics();
    rimGfx.setDepth(1);

    const frontPoints = points.filter(p => Math.sin(p.angle) > 0.05);

    if (frontPoints.length > 1) {
      rimGfx.fillStyle(0x686058, 1);
      rimGfx.beginPath();
      rimGfx.moveTo(frontPoints[0].x, frontPoints[0].y);
      for (const p of frontPoints) {
        rimGfx.lineTo(p.x, p.y);
      }
      for (let i = frontPoints.length - 1; i >= 0; i--) {
        const p = frontPoints[i];
        const rimH = BORDER_RIM_H * Math.sin(p.angle);
        rimGfx.lineTo(p.x, p.y + rimH);
      }
      rimGfx.closePath();
      rimGfx.fillPath();

      // Lighter strip at top of the rim face
      rimGfx.fillStyle(0x787068, 0.5);
      rimGfx.beginPath();
      rimGfx.moveTo(frontPoints[0].x, frontPoints[0].y);
      for (const p of frontPoints) {
        rimGfx.lineTo(p.x, p.y);
      }
      for (let i = frontPoints.length - 1; i >= 0; i--) {
        const p = frontPoints[i];
        const rimH = BORDER_RIM_H * Math.sin(p.angle) * 0.3;
        rimGfx.lineTo(p.x, p.y + rimH);
      }
      rimGfx.closePath();
      rimGfx.fillPath();

      // Bottom edge line of the rim
      rimGfx.lineStyle(1, 0x504840, 0.7);
      rimGfx.beginPath();
      rimGfx.moveTo(
        frontPoints[0].x,
        frontPoints[0].y + BORDER_RIM_H * Math.sin(frontPoints[0].angle),
      );
      for (const p of frontPoints) {
        rimGfx.lineTo(p.x, p.y + BORDER_RIM_H * Math.sin(p.angle));
      }
      rimGfx.strokePath();
    }

    // Top edge of border (stone outline)
    const edgeGfx = this.add.graphics();
    edgeGfx.setDepth(2);

    edgeGfx.lineStyle(4, 0x908880, 1);
    edgeGfx.beginPath();
    edgeGfx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      edgeGfx.lineTo(points[i].x, points[i].y);
    }
    edgeGfx.closePath();
    edgeGfx.strokePath();

    // Highlight on far/top edge
    edgeGfx.lineStyle(1, 0xb0a898, 0.4);
    edgeGfx.beginPath();
    const halfIdx = Math.floor(steps / 2);
    edgeGfx.moveTo(points[halfIdx].x, points[halfIdx].y);
    for (let i = halfIdx + 1; i < steps; i++) {
      edgeGfx.lineTo(points[i].x, points[i].y);
    }
    edgeGfx.strokePath();

    // Moss dots
    for (let i = 0; i < points.length; i++) {
      if (Math.random() < 0.35) {
        const p = points[i];
        const ox = (Math.random() - 0.5) * 5;
        const oy = (Math.random() - 0.5) * 3;
        const green = 0x40 + Math.floor(Math.random() * 0x30);
        const color = (0x20 << 16) | (green << 8) | 0x10;
        edgeGfx.fillStyle(color, 0.8);
        edgeGfx.fillCircle(p.x + ox, p.y + oy, 1 + Math.random() * 1.5);
      }
    }
  }

  // --- Toolbar ---
  createToolbar() {
    const y = SAND_H;
    const gfx = this.add.graphics();
    gfx.setDepth(1000);
    gfx.fillStyle(0x4a3728, 1);
    gfx.fillRect(0, y, W, TOOLBAR_H);
    gfx.lineStyle(1, 0x3d2e1f, 0.3);
    for (let ly = y + 5; ly < y + TOOLBAR_H; ly += 6) {
      gfx.beginPath();
      gfx.moveTo(0, ly);
      gfx.lineTo(W, ly);
      gfx.strokePath();
    }

    const tools = ['RAKE', 'ROCK', 'SHRUB', 'CLEAR', 'SOUND'];
    const btnW = 70;
    const gap = (W - tools.length * btnW) / (tools.length + 1);

    this.toolButtons = [];

    tools.forEach((name, idx) => {
      const bx = gap + idx * (btnW + gap);
      const by = y + 4;
      const bh = TOOLBAR_H - 8;

      const bg = this.add.graphics();
      bg.setDepth(1001);
      const isActive = name === this.activeTool;
      this.drawButton(bg, bx, by, btnW, bh, isActive);

      const label = this.add.text(bx + btnW / 2, by + bh / 2, name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: isActive ? '#4a3728' : '#c8b898',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5, 0.5);
      label.setDepth(1002);

      const hitZone = this.add
        .zone(bx + btnW / 2, by + bh / 2, btnW, bh)
        .setInteractive({ useHandCursor: true });
      hitZone.setDepth(1003);

      hitZone.on('pointerdown', () => this.selectTool(name));

      this.toolButtons.push({ name, bg, label, bx, by, btnW, bh, hitZone });
    });
  }

  drawButton(gfx, x, y, w, h, active) {
    gfx.clear();
    gfx.fillStyle(active ? 0xe8dcbc : 0x5c4433, 1);
    gfx.fillRoundedRect(x, y, w, h, 3);
  }

  selectTool(name) {
    if (name === 'CLEAR') {
      this.clearSand();
      return;
    }
    if (name === 'SOUND') {
      this.toggleSound();
      return;
    }
    this.activeTool = name;
    this.toolButtons.forEach((btn) => {
      const isActive = btn.name === this.activeTool;
      this.drawButton(btn.bg, btn.bx, btn.by, btn.btnW, btn.bh, isActive);
      btn.label.setColor(isActive ? '#4a3728' : '#c8b898');
    });
  }

  clearSand() {
    this.fillSand();
    this.syncSandToCanvas();
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    if (this.windGain) {
      this.windGain.gain.value = this.soundEnabled ? 0.03 : 0;
    }
    const soundBtn = this.toolButtons.find((b) => b.name === 'SOUND');
    if (soundBtn) {
      const on = this.soundEnabled;
      soundBtn.bg.clear();
      soundBtn.bg.fillStyle(on ? 0x607860 : 0x5c4433, 1);
      soundBtn.bg.fillRoundedRect(
        soundBtn.bx,
        soundBtn.by,
        soundBtn.btnW,
        soundBtn.bh,
        3,
      );
      soundBtn.label.setColor(on ? '#e8dcbc' : '#886655');
    }
  }

  // --- Input ---
  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      this.ensureAudio();

      if (pointer.y >= SAND_H) return;

      if (this.activeTool === 'RAKE') {
        this.dragging = true;
        this.lastPointer = { x: pointer.x, y: pointer.y };
        if (this.rakeGain) {
          this.rakeGain.gain.linearRampToValueAtTime(
            0.06,
            this.audioCtx.currentTime + 0.1,
          );
        }
      } else if (this.activeTool === 'ROCK' || this.activeTool === 'SHRUB') {
        const gx = Math.floor(pointer.x);
        const gy = Math.floor(pointer.y);
        if (this.isInGarden(gx, gy)) {
          this.placeItem(this.activeTool, pointer.x, pointer.y);
          this.playPlaceSound();
        }
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.dragging || this.activeTool !== 'RAKE') return;
      if (pointer.y >= SAND_H) return;
      this.rakeStroke(this.lastPointer, { x: pointer.x, y: pointer.y });
      this.lastPointer = { x: pointer.x, y: pointer.y };
    });

    this.input.on('pointerup', () => {
      this.dragging = false;
      this.lastPointer = null;
      if (this.rakeGain) {
        this.rakeGain.gain.linearRampToValueAtTime(
          0,
          this.audioCtx.currentTime + 0.2,
        );
      }
    });
  }

  // --- Raking ---
  rakeStroke(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const steps = Math.ceil(dist);
    const nx = dx / dist;
    const ny = dy / dist;
    const px = -ny;
    const py = nx;

    const halfWidth = ((TINE_COUNT - 1) * TINE_SPACING) / 2;

    for (let s = 0; s <= steps; s++) {
      const cx = from.x + nx * s;
      const cy = from.y + ny * s;

      for (let t = 0; t < TINE_COUNT; t++) {
        const offset = -halfWidth + t * TINE_SPACING;
        const tx = Math.floor(cx + px * offset);
        const ty = Math.floor(cy + py * offset);

        if (!this.isInGarden(tx, ty)) continue;

        this.setSandPixel(tx, ty, GROOVE_COLOR);
        const rx1 = Math.floor(tx + px);
        const ry1 = Math.floor(ty + py);
        const rx2 = Math.floor(tx - px);
        const ry2 = Math.floor(ty - py);
        if (this.isInGarden(rx1, ry1))
          this.setSandPixel(rx1, ry1, RIDGE_COLOR);
        if (this.isInGarden(rx2, ry2))
          this.setSandPixel(rx2, ry2, RIDGE_COLOR);
      }
    }
    this.sandDirty = true;
  }

  setSandPixel(x, y, color) {
    const i = (y * W + x) * 4;
    this.sandPixels[i] = color[0];
    this.sandPixels[i + 1] = color[1];
    this.sandPixels[i + 2] = color[2];
    this.sandPixels[i + 3] = 255;
  }

  // --- Items (Rocks & Shrubs) with isometric depth ---
  placeItem(type, x, y) {
    const key =
      type === 'ROCK' ? this.createRockTexture() : this.createShrubTexture();

    const shadowW = type === 'ROCK' ? 30 : 26;
    const shadowH = type === 'ROCK' ? 12 : 10;
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.15);
    shadow.fillEllipse(2, 3, shadowW, shadowH);
    shadow.x = x;
    shadow.y = y;
    shadow.setDepth(y - 0.5);

    const sprite = this.add.image(x, y, key);
    sprite.setScale(2);
    sprite.setOrigin(0.5, 0.85);
    sprite.setDepth(y);
    sprite.setInteractive({ draggable: true, useHandCursor: true });

    this.input.setDraggable(sprite);
    sprite.on('drag', (_pointer, dragX, dragY) => {
      if (dragY < SAND_H) {
        sprite.x = dragX;
        sprite.y = dragY;
        shadow.x = dragX;
        shadow.y = dragY;
        sprite.setDepth(dragY);
        shadow.setDepth(dragY - 0.5);
      }
    });

    this.placedItems.push({ sprite, shadow });
  }

  createRockTexture() {
    const id = 'rock_' + Date.now() + '_' + Math.random();
    const w = 14;
    const h = 12;
    const tex = this.textures.createCanvas(id, w, h);
    const ctx = tex.context;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    const cx = w / 2;
    const topCy = h * 0.38;
    const baseR = 0x78 + Math.floor(Math.random() * 0x10);
    const baseG = 0x74 + Math.floor(Math.random() * 0x10);
    const baseB = 0x6c + Math.floor(Math.random() * 0x10);

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const yNorm = py / h;
        const widthAtY =
          yNorm < 0.45
            ? 0.48 - yNorm * 0.08
            : 0.48 - (yNorm - 0.45) * 0.5;

        const dx = (px - cx) / (w * Math.max(widthAtY, 0.05));
        const dy = (py - topCy) / (h * 0.46);
        const dist = dx * dx + dy * dy;

        if (dist <= 1.0) {
          const i = (py * w + px) * 4;
          const noise = (Math.random() - 0.5) * 10;

          let shade;
          if (yNorm < 0.45) {
            shade = 1.0 + (0.45 - yNorm) * 0.5;
          } else {
            shade = 1.0 - (yNorm - 0.45) * 0.7;
          }
          shade *= 1.0 + ((cx - px) / w) * 0.2;

          d[i] = Math.min(255, Math.max(0, Math.floor(baseR * shade + noise)));
          d[i + 1] = Math.min(
            255,
            Math.max(0, Math.floor(baseG * shade + noise)),
          );
          d[i + 2] = Math.min(
            255,
            Math.max(0, Math.floor(baseB * shade + noise)),
          );
          d[i + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    tex.refresh();
    return id;
  }

  createShrubTexture() {
    const id = 'shrub_' + Date.now() + '_' + Math.random();
    const w = 12;
    const h = 14;
    const tex = this.textures.createCanvas(id, w, h);
    const ctx = tex.context;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    const cx = w / 2;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const yNorm = py / h;
        const widthAtY =
          yNorm < 0.4
            ? 0.35 + yNorm * 0.3
            : 0.47 - (yNorm - 0.4) * 0.55;

        const dx = (px - cx) / (w * Math.max(widthAtY, 0.05));
        const dy = (py - h * 0.38) / (h * 0.45);
        const dist = dx * dx + dy * dy;

        const noise =
          Math.sin(px * 3.7 + py * 0.5) * 0.1 +
          Math.cos(py * 4.3 + px * 0.7) * 0.08;

        if (dist + noise <= 0.95 && widthAtY > 0.05) {
          const i = (py * w + px) * 4;
          const green = 0x48 + Math.floor(Math.random() * 0x40);

          let shade;
          if (yNorm < 0.35) {
            shade = 1.2 - yNorm * 0.3;
          } else {
            shade = 1.1 - yNorm * 0.7;
          }

          d[i] = Math.min(255, Math.max(0, Math.floor(0x20 * shade)));
          d[i + 1] = Math.min(255, Math.max(0, Math.floor(green * shade)));
          d[i + 2] = Math.min(255, Math.max(0, Math.floor(0x14 * shade)));
          d[i + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    tex.refresh();
    return id;
  }

  // --- Audio ---
  ensureAudio() {
    if (this.audioStarted) return;
    this.audioStarted = true;

    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.setupWind();
      this.setupRakeSound();
    } catch (e) {
      // Web Audio not available
    }
  }

  setupWind() {
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;

    this.windGain = ctx.createGain();
    this.windGain.gain.value = this.soundEnabled ? 0.03 : 0;

    source.connect(filter);
    filter.connect(this.windGain);
    this.windGain.connect(ctx.destination);
    source.start();
  }

  setupRakeSound() {
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 1.5;

    this.rakeGain = ctx.createGain();
    this.rakeGain.gain.value = 0;

    source.connect(filter);
    filter.connect(this.rakeGain);
    this.rakeGain.connect(ctx.destination);
    source.start();
  }

  playPlaceSound() {
    if (!this.audioCtx || !this.soundEnabled) return;
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    osc.frequency.value = 90;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  // --- Update Loop ---
  update() {
    if (this.sandDirty) {
      this.syncSandToCanvas();
    }
  }
}
