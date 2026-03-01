import Phaser from 'phaser';

const W = 480;
const H = 360;
const TOOLBAR_H = 30;
const SAND_H = H - TOOLBAR_H; // 330

// Sand resolution scale for smoother curves (internal buffer is larger than display)
const SAND_SCALE = 2;
const SAND_W_INTERNAL = W * SAND_SCALE;
const SAND_H_INTERNAL = SAND_H * SAND_SCALE;

// Colors
const SAND_BASE = [0xd2, 0xc4, 0xa0];
const GROOVE_COLOR = [0xb0, 0xa0, 0x78];
const RIDGE_COLOR = [0xe8, 0xdc, 0xbc];

// Rake config
const TINE_COUNT = 5;
const TINE_SPACING = 3;

export class GardenScene extends Phaser.Scene {
  constructor() {
    super('GardenScene');
    this.activeTool = 'RAKE';
    this.dragging = false;
    this.lastPointer = null;
    this.lastRakeDir = null;
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

  // --- Garden Boundary ---
  buildGardenMask() {
    this.gardenMask = new Uint8Array(SAND_W_INTERNAL * SAND_H_INTERNAL);
    const cx = SAND_W_INTERNAL / 2;
    const cy = SAND_H_INTERNAL / 2;
    const rx = SAND_W_INTERNAL * 0.42;
    const ry = SAND_H_INTERNAL * 0.42;

    for (let y = 0; y < SAND_H_INTERNAL; y++) {
      for (let x = 0; x < SAND_W_INTERNAL; x++) {
        const angle = Math.atan2(y - cy, x - cx);
        const noise =
          Math.sin(angle * 3) * 0.06 +
          Math.sin(angle * 5 + 1) * 0.04 +
          Math.sin(angle * 7 + 2) * 0.03 +
          Math.sin(angle * 11 + 3) * 0.02;
        const dx = (x - cx) / (rx * (1 + noise));
        const dy = (y - cy) / (ry * (1 + noise));
        const dist = dx * dx + dy * dy;
        this.gardenMask[y * SAND_W_INTERNAL + x] = dist <= 1.0 ? 1 : 0;
      }
    }
  }

  isInGarden(x, y) {
    if (x < 0 || x >= SAND_W_INTERNAL || y < 0 || y >= SAND_H_INTERNAL) return false;
    return this.gardenMask[y * SAND_W_INTERNAL + x] === 1;
  }

  // --- Sand Canvas ---
  createSandCanvas() {
    this.sandTexture = this.textures.createCanvas('sand', SAND_W_INTERNAL, SAND_H_INTERNAL);
    this.sandPixels = new Uint8ClampedArray(SAND_W_INTERNAL * SAND_H_INTERNAL * 4);
    this.fillSand();
    this.syncSandToCanvas();
    const sandImage = this.add.image(W / 2, SAND_H / 2, 'sand');
    sandImage.setDisplaySize(W, SAND_H);
  }

  fillSand() {
    for (let y = 0; y < SAND_H_INTERNAL; y++) {
      for (let x = 0; x < SAND_W_INTERNAL; x++) {
        const i = (y * SAND_W_INTERNAL + x) * 4;
        if (this.gardenMask[y * SAND_W_INTERNAL + x]) {
          const noise = (Math.random() - 0.5) * 16;
          this.sandPixels[i] = SAND_BASE[0] + noise;
          this.sandPixels[i + 1] = SAND_BASE[1] + noise;
          this.sandPixels[i + 2] = SAND_BASE[2] + noise;
          this.sandPixels[i + 3] = 255;
        } else {
          // outside garden — dark ground
          this.sandPixels[i] = 0x3a;
          this.sandPixels[i + 1] = 0x3a;
          this.sandPixels[i + 2] = 0x36;
          this.sandPixels[i + 3] = 255;
        }
      }
    }
    this.sandDirty = true;
  }

  syncSandToCanvas() {
    const ctx = this.sandTexture.context;
    const imageData = ctx.createImageData(SAND_W_INTERNAL, SAND_H_INTERNAL);
    imageData.data.set(this.sandPixels);
    ctx.putImageData(imageData, 0, 0);
    this.sandTexture.refresh();
    this.sandDirty = false;
  }

  // --- Border ---
  drawBorder() {
    const gfx = this.add.graphics();

    // Build border path from mask edge
    const cx = W / 2;
    const cy = SAND_H / 2;
    const rx = W * 0.42;
    const ry = SAND_H * 0.42;
    const points = [];
    const steps = 200;

    for (let s = 0; s < steps; s++) {
      const angle = (s / steps) * Math.PI * 2;
      const noise =
        Math.sin(angle * 3) * 0.06 +
        Math.sin(angle * 5 + 1) * 0.04 +
        Math.sin(angle * 7 + 2) * 0.03 +
        Math.sin(angle * 11 + 3) * 0.02;
      const r = 1 + noise;
      points.push({
        x: cx + rx * r * Math.cos(angle),
        y: cy + ry * r * Math.sin(angle),
      });
    }

    // Stone border
    gfx.lineStyle(5, 0x888880, 1);
    gfx.beginPath();
    gfx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      gfx.lineTo(points[i].x, points[i].y);
    }
    gfx.closePath();
    gfx.strokePath();

    // Moss dots along border
    for (let i = 0; i < points.length; i++) {
      if (Math.random() < 0.4) {
        const p = points[i];
        const ox = (Math.random() - 0.5) * 6;
        const oy = (Math.random() - 0.5) * 6;
        const green = 0x40 + Math.floor(Math.random() * 0x30);
        const color = (0x20 << 16) | (green << 8) | 0x10;
        gfx.fillStyle(color, 0.8);
        gfx.fillCircle(p.x + ox, p.y + oy, 1 + Math.random() * 1.5);
      }
    }
  }

  // --- Toolbar ---
  createToolbar() {
    const y = SAND_H;
    const gfx = this.add.graphics();
    gfx.fillStyle(0x4a3728, 1);
    gfx.fillRect(0, y, W, TOOLBAR_H);
    // Wood grain lines
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
      const isActive = name === this.activeTool;
      this.drawButton(bg, bx, by, btnW, bh, isActive);

      const label = this.add.text(bx + btnW / 2, by + bh / 2, name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: isActive ? '#4a3728' : '#c8b898',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5, 0.5);

      const hitZone = this.add.zone(bx + btnW / 2, by + bh / 2, btnW, bh)
        .setInteractive({ useHandCursor: true });

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
    // Update SOUND button visual
    const soundBtn = this.toolButtons.find(b => b.name === 'SOUND');
    if (soundBtn) {
      const on = this.soundEnabled;
      soundBtn.bg.clear();
      soundBtn.bg.fillStyle(on ? 0x607860 : 0x5c4433, 1);
      soundBtn.bg.fillRoundedRect(soundBtn.bx, soundBtn.by, soundBtn.btnW, soundBtn.bh, 3);
      soundBtn.label.setColor(on ? '#e8dcbc' : '#886655');
    }
  }

  // --- Input ---
  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      this.ensureAudio();

      if (pointer.y >= SAND_H) return; // toolbar area handled by buttons

      if (this.activeTool === 'RAKE') {
        this.dragging = true;
        this.lastPointer = { x: pointer.x, y: pointer.y };
        if (this.rakeGain) {
          this.rakeGain.gain.linearRampToValueAtTime(0.06, this.audioCtx.currentTime + 0.1);
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
        this.rakeGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.2);
      }
    });
  }

  // --- Raking ---
  rakeStroke(from, to) {
    // Scale to internal resolution
    const fromX = from.x * SAND_SCALE;
    const fromY = from.y * SAND_SCALE;
    const toX = to.x * SAND_SCALE;
    const toY = to.y * SAND_SCALE;
    
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Always draw at least one point, even for very small movements
    // This fixes the bug where slow mouse movements don't draw lines
    const steps = Math.max(1, Math.ceil(dist));
    
    // For very small movements, use a default direction or the last known direction
    let nx, ny;
    if (dist > 0.001) {
      nx = dx / dist;
      ny = dy / dist;
    } else {
      // Use last direction if available, otherwise default to horizontal
      nx = this.lastRakeDir ? this.lastRakeDir.x : 1;
      ny = this.lastRakeDir ? this.lastRakeDir.y : 0;
    }
    
    // Save direction for future use
    if (dist > 0.001) {
      this.lastRakeDir = { x: nx, y: ny };
    }
    
    // Perpendicular
    const px = -ny;
    const py = nx;

    // Scale tine spacing for internal resolution
    const scaledTineSpacing = TINE_SPACING * SAND_SCALE;
    const halfWidth = ((TINE_COUNT - 1) * scaledTineSpacing) / 2;

    for (let s = 0; s <= steps; s++) {
      const t_param = dist > 0.001 ? s / steps : 0;
      const cx = fromX + (toX - fromX) * t_param;
      const cy = fromY + (toY - fromY) * t_param;

      for (let t = 0; t < TINE_COUNT; t++) {
        const offset = -halfWidth + t * scaledTineSpacing;
        const tx = Math.floor(cx + px * offset);
        const ty = Math.floor(cy + py * offset);

        if (!this.isInGarden(tx, ty)) continue;

        // Groove (dark center)
        this.setSandPixel(tx, ty, GROOVE_COLOR);
        // Ridge (light sides)
        const rx1 = Math.floor(tx + px);
        const ry1 = Math.floor(ty + py);
        const rx2 = Math.floor(tx - px);
        const ry2 = Math.floor(ty - py);
        if (this.isInGarden(rx1, ry1)) this.setSandPixel(rx1, ry1, RIDGE_COLOR);
        if (this.isInGarden(rx2, ry2)) this.setSandPixel(rx2, ry2, RIDGE_COLOR);
      }
    }
    this.sandDirty = true;
  }

  setSandPixel(x, y, color) {
    const i = (y * SAND_W_INTERNAL + x) * 4;
    this.sandPixels[i] = color[0];
    this.sandPixels[i + 1] = color[1];
    this.sandPixels[i + 2] = color[2];
    this.sandPixels[i + 3] = 255;
  }

  // --- Items (Rocks & Shrubs) ---
  placeItem(type, x, y) {
    const key = type === 'ROCK' ? this.createRockTexture() : this.createShrubTexture();
    const sprite = this.add.image(x, y, key);
    sprite.setScale(2);
    sprite.setInteractive({ draggable: true, useHandCursor: true });

    this.input.setDraggable(sprite);
    sprite.on('drag', (_pointer, dragX, dragY) => {
      if (dragY < SAND_H) {
        sprite.x = dragX;
        sprite.y = dragY;
      }
    });

    this.placedItems.push(sprite);
  }

  createRockTexture() {
    const id = 'rock_' + Date.now() + '_' + Math.random();
    const w = 14;
    const h = 11;
    const tex = this.textures.createCanvas(id, w, h);
    const ctx = tex.context;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    // Simple rock shape: elliptical with shading
    const cx = w / 2;
    const cy = h / 2;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const dx = (px - cx) / (w / 2);
        const dy = (py - cy) / (h / 2);
        const dist = dx * dx + dy * dy;
        if (dist <= 1.0) {
          const i = (py * w + px) * 4;
          const shade = 0x70 + Math.floor((1 - dist) * 0x40) + Math.floor((Math.random() - 0.5) * 20);
          const warm = Math.floor(Math.random() * 10);
          d[i] = shade + warm;
          d[i + 1] = shade;
          d[i + 2] = shade - 5;
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
    const h = 11;
    const tex = this.textures.createCanvas(id, w, h);
    const ctx = tex.context;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    const cx = w / 2;
    const cy = h / 2;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const dx = (px - cx) / (w / 2);
        const dy = (py - cy) / (h / 2);
        const dist = dx * dx + dy * dy;
        // Irregular shrub shape
        const noise = Math.sin(px * 3) * 0.15 + Math.cos(py * 4) * 0.1;
        if (dist + noise <= 0.9) {
          const i = (py * w + px) * 4;
          const green = 0x50 + Math.floor(Math.random() * 0x40);
          const dark = py > cy ? 0.7 : 1.0; // bottom is darker
          d[i] = Math.floor(0x20 * dark);
          d[i + 1] = Math.floor(green * dark);
          d[i + 2] = Math.floor(0x15 * dark);
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
