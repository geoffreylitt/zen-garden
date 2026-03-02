import Phaser from 'phaser';

const W = 480;
const H = 360;
const TOOLBAR_H = 30;
const SAND_H = H - TOOLBAR_H;

const SAND_BASE = [0xd2, 0xc4, 0xa0];
const GROOVE_COLOR = [0xb0, 0xa0, 0x78];
const RIDGE_COLOR = [0xe8, 0xdc, 0xbc];

const TINE_COUNT = 5;
const TINE_SPACING = 3;

const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.50, 1174.66];

const RAIN_MIN_DROPS = 30;
const RAIN_MAX_DROPS = 250;
const RAIN_DROP_MIN_SPEED = 0.15;
const RAIN_DROP_MAX_SPEED = 0.38;
const RAIN_DROP_MIN_LEN = 2;
const RAIN_DROP_MAX_LEN = 6;
const RAIN_WIND_DRIFT = 0.08;
const PUDDLE_COLOR = [0x45, 0x52, 0x72];
const RIPPLE_MAX_RADIUS = 5;
const RIPPLE_LIFETIME = 400;

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
    this.audioCtx = null;
    this.rakeGain = null;
    this.chimeTimer = null;
    this.soundDialogEl = null;

    this.soundLayers = {
      wind:    { enabled: true, volume: 0.6, gain: null, maxGain: 0.06 },
      chimes:  { enabled: true, volume: 0.5, gain: null, maxGain: 0.12 },
      cicadas: { enabled: true, volume: 0.4, gain: null, maxGain: 0.05 },
    };

    this.rainEnabled = false;
    this.rainIntensity = 0.5;
    this.rainDrops = [];
    this.ripples = [];
    this.rainGfx = null;
    this.rippleGfx = null;
    this.rainOverlay = null;
    this.puddleDepth = null;
    this.anyPuddles = false;
    this.wetness = 0;
    this.rainMasterGain = null;
    this.rainSplashTimer = null;
    this.softenTimer = 0;
    this.puddleTimer = 0;
  }

  create() {
    this.buildGardenMask();
    this.createSandCanvas();
    this.initRainLayers();
    this.drawBorder();
    this.createToolbar();
    this.setupInput();
  }

  // --- Garden Boundary ---
  buildGardenMask() {
    this.gardenMask = new Uint8Array(W * SAND_H);
    const cx = W / 2;
    const cy = SAND_H / 2;
    const rx = W * 0.42;
    const ry = SAND_H * 0.42;

    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const angle = Math.atan2(y - cy, x - cx);
        const noise =
          Math.sin(angle * 3) * 0.06 +
          Math.sin(angle * 5 + 1) * 0.04 +
          Math.sin(angle * 7 + 2) * 0.03 +
          Math.sin(angle * 11 + 3) * 0.02;
        const dx = (x - cx) / (rx * (1 + noise));
        const dy = (y - cy) / (ry * (1 + noise));
        const dist = dx * dx + dy * dy;
        this.gardenMask[y * W + x] = dist <= 1.0 ? 1 : 0;
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
    this.add.image(W / 2, SAND_H / 2, 'sand');
  }

  fillSand() {
    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (this.gardenMask[y * W + x]) {
          const noise = (Math.random() - 0.5) * 16;
          this.sandPixels[i] = SAND_BASE[0] + noise;
          this.sandPixels[i + 1] = SAND_BASE[1] + noise;
          this.sandPixels[i + 2] = SAND_BASE[2] + noise;
          this.sandPixels[i + 3] = 255;
        } else {
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
    const imageData = ctx.createImageData(W, SAND_H);

    if (this.anyPuddles && this.puddleDepth) {
      const d = imageData.data;
      for (let i = 0; i < W * SAND_H; i++) {
        const si = i * 4;
        const depth = this.puddleDepth[i];
        if (depth > 0.01) {
          const t = Math.sqrt(Math.min(depth, 1));
          d[si]     = Math.floor(this.sandPixels[si]     + (PUDDLE_COLOR[0] - this.sandPixels[si]) * t);
          d[si + 1] = Math.floor(this.sandPixels[si + 1] + (PUDDLE_COLOR[1] - this.sandPixels[si + 1]) * t);
          d[si + 2] = Math.floor(this.sandPixels[si + 2] + (PUDDLE_COLOR[2] - this.sandPixels[si + 2]) * t);
          d[si + 3] = 255;
        } else {
          d[si]     = this.sandPixels[si];
          d[si + 1] = this.sandPixels[si + 1];
          d[si + 2] = this.sandPixels[si + 2];
          d[si + 3] = this.sandPixels[si + 3];
        }
      }
    } else {
      imageData.data.set(this.sandPixels);
    }

    ctx.putImageData(imageData, 0, 0);
    this.sandTexture.refresh();
    this.sandDirty = false;
  }

  // --- Rain Layers ---
  initRainLayers() {
    this.rippleGfx = this.add.graphics();
    this.rippleGfx.setDepth(5);

    this.rainOverlay = this.add.graphics();
    this.rainOverlay.setDepth(8);

    this.rainGfx = this.add.graphics();
    this.rainGfx.setDepth(100);

    this.puddleDepth = new Float32Array(W * SAND_H);
  }

  // --- Border ---
  drawBorder() {
    const gfx = this.add.graphics();
    gfx.setDepth(3);

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

    gfx.lineStyle(5, 0x888880, 1);
    gfx.beginPath();
    gfx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      gfx.lineTo(points[i].x, points[i].y);
    }
    gfx.closePath();
    gfx.strokePath();

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
    gfx.setDepth(200);
    gfx.fillStyle(0x4a3728, 1);
    gfx.fillRect(0, y, W, TOOLBAR_H);
    gfx.lineStyle(1, 0x3d2e1f, 0.3);
    for (let ly = y + 5; ly < y + TOOLBAR_H; ly += 6) {
      gfx.beginPath();
      gfx.moveTo(0, ly);
      gfx.lineTo(W, ly);
      gfx.strokePath();
    }

    const tools = ['RAKE', 'ROCK', 'SHRUB', 'TEAHOUSE', 'CLEAR', 'RAIN', 'SOUND'];
    const btnW = Math.floor((W - (tools.length + 1) * 5) / tools.length);
    const gap = (W - tools.length * btnW) / (tools.length + 1);

    this.toolButtons = [];

    tools.forEach((name, idx) => {
      const bx = gap + idx * (btnW + gap);
      const by = y + 4;
      const bh = TOOLBAR_H - 8;

      const bg = this.add.graphics();
      bg.setDepth(201);
      const isActive = name === this.activeTool;
      this.drawButton(bg, bx, by, btnW, bh, isActive);

      const label = this.add.text(bx + btnW / 2, by + bh / 2, name, {
        fontFamily: 'monospace',
        fontSize: name === 'TEAHOUSE' ? '8px' : '10px',
        color: isActive ? '#4a3728' : '#c8b898',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5, 0.5);
      label.setDepth(202);

      const hitZone = this.add.zone(bx + btnW / 2, by + bh / 2, btnW, bh)
        .setInteractive({ useHandCursor: true });
      hitZone.setDepth(203);

      hitZone.on('pointerdown', () => this.selectTool(name));

      this.toolButtons.push({ name, bg, label, bx, by, btnW, bh, hitZone });
    });

    this.updateSoundButtonVisual();
    this.updateRainButtonVisual();
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
      this.openSoundDialog();
      return;
    }
    if (name === 'RAIN') {
      this.toggleRain();
      return;
    }
    this.activeTool = name;
    this.toolButtons.forEach((btn) => {
      if (btn.name === 'SOUND' || btn.name === 'RAIN') return;
      const isActive = btn.name === this.activeTool;
      this.drawButton(btn.bg, btn.bx, btn.by, btn.btnW, btn.bh, isActive);
      btn.label.setColor(isActive ? '#4a3728' : '#c8b898');
    });
  }

  clearSand() {
    this.fillSand();
    if (this.puddleDepth) {
      this.puddleDepth.fill(0);
      this.anyPuddles = false;
    }
    this.syncSandToCanvas();
  }

  // --- Rain Toggle ---
  toggleRain() {
    this.rainEnabled = !this.rainEnabled;
    this.updateRainButtonVisual();
    this.ensureAudio();

    if (this.rainEnabled) {
      this.spawnRainDrops();
      if (this.rainMasterGain) {
        const t = this.audioCtx.currentTime;
        this.rainMasterGain.gain.cancelScheduledValues(t);
        this.rainMasterGain.gain.setValueAtTime(this.rainMasterGain.gain.value, t);
        this.rainMasterGain.gain.linearRampToValueAtTime(
          this.rainIntensity * 0.12, t + 2.0
        );
      }
      this.updateRainFiltersByIntensity();
      this.scheduleRainSplash();
    } else {
      if (this.rainMasterGain) {
        const t = this.audioCtx.currentTime;
        this.rainMasterGain.gain.cancelScheduledValues(t);
        this.rainMasterGain.gain.setValueAtTime(this.rainMasterGain.gain.value, t);
        this.rainMasterGain.gain.linearRampToValueAtTime(0, t + 2.5);
      }
      if (this.rainSplashTimer) {
        clearTimeout(this.rainSplashTimer);
        this.rainSplashTimer = null;
      }
    }
  }

  updateRainButtonVisual() {
    const rainBtn = this.toolButtons && this.toolButtons.find(b => b.name === 'RAIN');
    if (!rainBtn) return;
    rainBtn.bg.clear();
    rainBtn.bg.fillStyle(this.rainEnabled ? 0x506888 : 0x5c4433, 1);
    rainBtn.bg.fillRoundedRect(
      rainBtn.bx, rainBtn.by, rainBtn.btnW, rainBtn.bh, 3
    );
    rainBtn.label.setColor(this.rainEnabled ? '#e8dcbc' : '#c8b898');
  }

  onRainIntensityChanged() {
    if (!this.rainEnabled) return;
    this.adjustRainDropCount();
    if (this.rainMasterGain && this.audioCtx) {
      const t = this.audioCtx.currentTime;
      this.rainMasterGain.gain.cancelScheduledValues(t);
      this.rainMasterGain.gain.setValueAtTime(this.rainMasterGain.gain.value, t);
      this.rainMasterGain.gain.linearRampToValueAtTime(
        this.rainIntensity * 0.12, t + 0.5
      );
    }
    this.updateRainFiltersByIntensity();
  }

  // --- Sound Settings Dialog ---
  openSoundDialog() {
    this.ensureAudio();
    if (!this.soundDialogEl) {
      this.createSoundDialog();
    }
    this.soundDialogEl.style.display = 'flex';
  }

  closeSoundDialog() {
    if (this.soundDialogEl) {
      this.soundDialogEl.style.display = 'none';
    }
  }

  createSoundDialog() {
    const overlay = document.createElement('div');
    overlay.id = 'sound-settings-overlay';

    const dialog = document.createElement('div');
    dialog.id = 'sound-settings-dialog';

    const titleBar = document.createElement('div');
    titleBar.className = 'sound-dialog-title';
    const title = document.createElement('span');
    title.textContent = 'Sound Settings';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sound-dialog-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => this.closeSoundDialog());
    titleBar.appendChild(title);
    titleBar.appendChild(closeBtn);
    dialog.appendChild(titleBar);

    const layers = [
      { key: 'wind', label: 'Wind' },
      { key: 'chimes', label: 'Chimes' },
      { key: 'cicadas', label: 'Cicadas' },
    ];

    layers.forEach(({ key, label }) => {
      const layer = this.soundLayers[key];

      const row = document.createElement('div');
      row.className = 'sound-layer-row';

      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = layer.enabled;
      toggle.id = `sound-${key}`;
      toggle.addEventListener('change', () => {
        layer.enabled = toggle.checked;
        this.updateLayerGain(key);
        this.updateSoundButtonVisual();
      });

      const labelEl = document.createElement('label');
      labelEl.htmlFor = `sound-${key}`;
      labelEl.textContent = label;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = String(Math.round(layer.volume * 100));
      slider.className = 'sound-slider';
      slider.addEventListener('input', () => {
        layer.volume = parseInt(slider.value, 10) / 100;
        this.updateLayerGain(key);
      });

      row.appendChild(toggle);
      row.appendChild(labelEl);
      row.appendChild(slider);
      dialog.appendChild(row);
    });

    const rainSection = document.createElement('div');
    rainSection.style.cssText =
      'border-top: 1px solid #6b5340; margin-top: 12px; padding-top: 12px;';

    const rainHeader = document.createElement('div');
    rainHeader.style.cssText =
      'font-size: 12px; margin-bottom: 10px; opacity: 0.85; letter-spacing: 0.3px;';
    rainHeader.textContent = 'Rain Intensity';
    rainSection.appendChild(rainHeader);

    const rainRow = document.createElement('div');
    rainRow.className = 'sound-layer-row';

    const drizzleLabel = document.createElement('span');
    drizzleLabel.style.cssText = 'font-size: 10px; opacity: 0.55; flex-shrink: 0;';
    drizzleLabel.textContent = 'Drizzle';

    const rainSlider = document.createElement('input');
    rainSlider.type = 'range';
    rainSlider.min = '5';
    rainSlider.max = '100';
    rainSlider.value = String(Math.round(this.rainIntensity * 100));
    rainSlider.className = 'sound-slider';
    rainSlider.addEventListener('input', () => {
      this.rainIntensity = parseInt(rainSlider.value, 10) / 100;
      this.onRainIntensityChanged();
    });

    const steadyLabel = document.createElement('span');
    steadyLabel.style.cssText = 'font-size: 10px; opacity: 0.55; flex-shrink: 0;';
    steadyLabel.textContent = 'Steady';

    rainRow.appendChild(drizzleLabel);
    rainRow.appendChild(rainSlider);
    rainRow.appendChild(steadyLabel);
    rainSection.appendChild(rainRow);
    dialog.appendChild(rainSection);

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeSoundDialog();
    });

    document.body.appendChild(overlay);
    this.soundDialogEl = overlay;
  }

  updateLayerGain(key) {
    const layer = this.soundLayers[key];
    if (!layer.gain) return;

    const target = layer.enabled ? layer.volume * layer.maxGain : 0;
    const t = this.audioCtx.currentTime;

    layer.gain.gain.cancelScheduledValues(t);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, t);
    layer.gain.gain.linearRampToValueAtTime(target, t + 0.1);

    if (key === 'cicadas') {
      if (layer.lfoGain) {
        layer.lfoGain.gain.cancelScheduledValues(t);
        layer.lfoGain.gain.setValueAtTime(layer.lfoGain.gain.value, t);
        layer.lfoGain.gain.linearRampToValueAtTime(target * 0.5, t + 0.1);
      }
      if (layer.swellGain) {
        layer.swellGain.gain.cancelScheduledValues(t);
        layer.swellGain.gain.setValueAtTime(layer.swellGain.gain.value, t);
        layer.swellGain.gain.linearRampToValueAtTime(target * 0.3, t + 0.1);
      }
    }
  }

  updateSoundButtonVisual() {
    const soundBtn = this.toolButtons.find(b => b.name === 'SOUND');
    if (!soundBtn) return;
    const anyEnabled = Object.values(this.soundLayers).some(l => l.enabled);
    soundBtn.bg.clear();
    soundBtn.bg.fillStyle(anyEnabled ? 0x607860 : 0x5c4433, 1);
    soundBtn.bg.fillRoundedRect(
      soundBtn.bx, soundBtn.by, soundBtn.btnW, soundBtn.bh, 3
    );
    soundBtn.label.setColor(anyEnabled ? '#e8dcbc' : '#886655');
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
            0.06, this.audioCtx.currentTime + 0.1
          );
        }
      } else if (this.activeTool === 'ROCK' || this.activeTool === 'SHRUB' || this.activeTool === 'TEAHOUSE') {
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
          0, this.audioCtx.currentTime + 0.2
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
        if (this.isInGarden(rx1, ry1)) this.setSandPixel(rx1, ry1, RIDGE_COLOR);
        if (this.isInGarden(rx2, ry2)) this.setSandPixel(rx2, ry2, RIDGE_COLOR);
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

  // --- Items ---
  placeItem(type, x, y) {
    let key;
    if (type === 'ROCK') {
      key = this.createRockTexture();
    } else if (type === 'SHRUB') {
      key = this.createShrubTexture();
    } else if (type === 'TEAHOUSE') {
      key = this.createTeahouseTexture();
    }
    const sprite = this.add.image(x, y, key);
    sprite.setScale(2);
    sprite.setDepth(10);
    sprite.setInteractive({ draggable: true, useHandCursor: true });

    sprite._canvasTex = this.textures.get(key);

    if (this.wetness > 0.05 && sprite._canvasTex && sprite._canvasTex.context) {
      const tex = sprite._canvasTex;
      const imgData = tex.context.getImageData(0, 0, tex.canvas.width, tex.canvas.height);
      sprite._dryPixels = new Uint8ClampedArray(imgData.data);
      sprite._texW = tex.canvas.width;
      sprite._texH = tex.canvas.height;

      const d = imgData.data;
      const w = this.wetness;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        d[i]     = Math.floor(d[i] * (1 - w * 0.30));
        d[i + 1] = Math.floor(d[i + 1] * (1 - w * 0.30));
        d[i + 2] = Math.min(255, Math.floor(d[i + 2] * (1 - w * 0.20) + w * 8));
      }
      tex.context.putImageData(imgData, 0, 0);
      tex.refresh();
    }

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

    const cx = w / 2;
    const cy = h / 2;
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const dx = (px - cx) / (w / 2);
        const dy = (py - cy) / (h / 2);
        const dist = dx * dx + dy * dy;
        if (dist <= 1.0) {
          const i = (py * w + px) * 4;
          const shade = 0x70 + Math.floor((1 - dist) * 0x40) +
            Math.floor((Math.random() - 0.5) * 20);
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
        const noise = Math.sin(px * 3) * 0.15 + Math.cos(py * 4) * 0.1;
        if (dist + noise <= 0.9) {
          const i = (py * w + px) * 4;
          const green = 0x50 + Math.floor(Math.random() * 0x40);
          const dark = py > cy ? 0.7 : 1.0;
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

  createTeahouseTexture() {
    const id = 'teahouse_' + Date.now() + '_' + Math.random();
    const w = 24;
    const h = 20;
    const tex = this.textures.createCanvas(id, w, h);
    const ctx = tex.context;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    const setPixel = (px, py, r, g, b) => {
      if (px < 0 || px >= w || py < 0 || py >= h) return;
      const i = (py * w + px) * 4;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    };

    const roofBase = [0x45, 0x45, 0x50];
    const roofHighlight = [0x60, 0x60, 0x68];
    const wallBase = [0x8b, 0x6b, 0x4a];
    const wallDark = [0x6a, 0x52, 0x3a];
    const floorColor = [0x5a, 0x48, 0x38];
    const doorColor = [0x3a, 0x2a, 0x20];

    for (let py = 0; py < 9; py++) {
      for (let px = 0; px < w; px++) {
        const roofWidth = w / 2 + (8 - py) * 0.8;
        const centerX = w / 2;
        const distFromCenter = Math.abs(px - centerX);

        if (distFromCenter <= roofWidth) {
          const normalizedX = distFromCenter / roofWidth;
          const curveHeight = py + normalizedX * normalizedX * 3;

          if (curveHeight >= py && curveHeight < py + 1.5) {
            const noise = Math.floor((Math.random() - 0.5) * 10);
            if (py < 3) {
              setPixel(px, py, roofHighlight[0] + noise, roofHighlight[1] + noise, roofHighlight[2] + noise);
            } else {
              setPixel(px, py, roofBase[0] + noise, roofBase[1] + noise, roofBase[2] + noise);
            }
          }
        }
      }
    }

    for (let px = 2; px < w - 2; px++) {
      const noise = Math.floor((Math.random() - 0.5) * 8);
      setPixel(px, 8, roofBase[0] - 10 + noise, roofBase[1] - 10 + noise, roofBase[2] + noise);
    }

    for (let py = 9; py < 17; py++) {
      for (let px = 4; px < w - 4; px++) {
        const noise = Math.floor((Math.random() - 0.5) * 15);
        if (px < 6 || px >= w - 6) {
          setPixel(px, py, wallDark[0] + noise, wallDark[1] + noise, wallDark[2] + noise);
        } else {
          setPixel(px, py, wallBase[0] + noise, wallBase[1] + noise, wallBase[2] + noise);
        }
      }
    }

    const doorLeft = Math.floor(w / 2) - 2;
    const doorRight = Math.floor(w / 2) + 2;
    for (let py = 11; py < 17; py++) {
      for (let px = doorLeft; px <= doorRight; px++) {
        const noise = Math.floor((Math.random() - 0.5) * 8);
        setPixel(px, py, doorColor[0] + noise, doorColor[1] + noise, doorColor[2] + noise);
      }
    }

    const windowColor = [0x2a, 0x3a, 0x4a];
    for (let py = 11; py < 14; py++) {
      for (let px = 6; px < 9; px++) {
        setPixel(px, py, windowColor[0], windowColor[1], windowColor[2]);
      }
      for (let px = w - 9; px < w - 6; px++) {
        setPixel(px, py, windowColor[0], windowColor[1], windowColor[2]);
      }
    }

    for (let px = 3; px < w - 3; px++) {
      const noise = Math.floor((Math.random() - 0.5) * 10);
      setPixel(px, 17, floorColor[0] + noise, floorColor[1] + noise, floorColor[2] + noise);
      setPixel(px, 18, floorColor[0] - 10 + noise, floorColor[1] - 10 + noise, floorColor[2] - 10 + noise);
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
      this.setupChimes();
      this.setupCicadas();
      this.setupRakeSound();
      this.setupRainAudio();
    } catch (e) {
      // Web Audio not available
    }
  }

  createNoiseBuffer() {
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  setupWind() {
    const ctx = this.audioCtx;
    const layer = this.soundLayers.wind;

    const buffer = this.createNoiseBuffer();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;

    layer.gain = ctx.createGain();
    layer.gain.gain.value = layer.enabled ? layer.volume * layer.maxGain : 0;

    source.connect(filter);
    filter.connect(layer.gain);
    layer.gain.connect(ctx.destination);
    source.start();
  }

  setupChimes() {
    const ctx = this.audioCtx;
    const layer = this.soundLayers.chimes;

    layer.gain = ctx.createGain();
    layer.gain.gain.value = layer.enabled ? layer.volume * layer.maxGain : 0;
    layer.gain.connect(ctx.destination);

    this.scheduleChime();
  }

  scheduleChime() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') return;

    const ctx = this.audioCtx;
    const layer = this.soundLayers.chimes;

    if (layer.enabled) {
      const count = Math.random() < 0.3 ? 2 : 1;
      for (let c = 0; c < count; c++) {
        const freq = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)];
        const delay = c * (0.1 + Math.random() * 0.15);
        const duration = 1.5 + Math.random() * 1.5;
        const t = ctx.currentTime + delay;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2.01;

        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0, t);
        g1.gain.linearRampToValueAtTime(0.25, t + 0.005);
        g1.gain.exponentialRampToValueAtTime(0.001, t + duration);

        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0, t);
        g2.gain.linearRampToValueAtTime(0.06, t + 0.005);
        g2.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.6);

        osc.connect(g1);
        osc2.connect(g2);
        g1.connect(layer.gain);
        g2.connect(layer.gain);

        osc.start(t);
        osc.stop(t + duration);
        osc2.start(t);
        osc2.stop(t + duration * 0.6);
      }
    }

    const nextDelay = 3000 + Math.random() * 6000;
    this.chimeTimer = setTimeout(() => this.scheduleChime(), nextDelay);
  }

  setupCicadas() {
    const ctx = this.audioCtx;
    const layer = this.soundLayers.cicadas;

    const buffer = this.createNoiseBuffer();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 5500;
    filter.Q.value = 3;

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'bandpass';
    filter2.frequency.value = 4200;
    filter2.Q.value = 4;

    layer.gain = ctx.createGain();
    const baseGain = layer.enabled ? layer.volume * layer.maxGain : 0;
    layer.gain.gain.value = baseGain;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 8;
    layer.lfoGain = ctx.createGain();
    layer.lfoGain.gain.value = baseGain * 0.5;

    const swell = ctx.createOscillator();
    swell.frequency.value = 0.15;
    layer.swellGain = ctx.createGain();
    layer.swellGain.gain.value = baseGain * 0.3;

    source.connect(filter);
    source.connect(filter2);
    filter.connect(layer.gain);
    filter2.connect(layer.gain);

    lfo.connect(layer.lfoGain);
    layer.lfoGain.connect(layer.gain.gain);

    swell.connect(layer.swellGain);
    layer.swellGain.connect(layer.gain.gain);

    layer.gain.connect(ctx.destination);

    source.start();
    lfo.start();
    swell.start();
  }

  setupRakeSound() {
    const ctx = this.audioCtx;
    const buffer = this.createNoiseBuffer();
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
    if (!this.audioCtx) return;
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

  // --- Rain Audio ---
  setupRainAudio() {
    const ctx = this.audioCtx;

    this.rainMasterGain = ctx.createGain();
    this.rainMasterGain.gain.value = 0;
    this.rainMasterGain.connect(ctx.destination);

    const noiseBuffer = this.createNoiseBuffer();

    const sandSource = ctx.createBufferSource();
    sandSource.buffer = noiseBuffer;
    sandSource.loop = true;
    const sandFilter = ctx.createBiquadFilter();
    sandFilter.type = 'bandpass';
    sandFilter.frequency.value = 1000;
    sandFilter.Q.value = 0.7;
    this.rainSandGain = ctx.createGain();
    this.rainSandGain.gain.value = 0.5;
    sandSource.connect(sandFilter);
    sandFilter.connect(this.rainSandGain);
    this.rainSandGain.connect(this.rainMasterGain);
    sandSource.start();
    this.rainSandFilter = sandFilter;

    const stoneSource = ctx.createBufferSource();
    stoneSource.buffer = noiseBuffer;
    stoneSource.loop = true;
    const stoneFilter = ctx.createBiquadFilter();
    stoneFilter.type = 'bandpass';
    stoneFilter.frequency.value = 3200;
    stoneFilter.Q.value = 2.0;
    this.rainStoneGain = ctx.createGain();
    this.rainStoneGain.gain.value = 0.25;
    stoneSource.connect(stoneFilter);
    stoneFilter.connect(this.rainStoneGain);
    this.rainStoneGain.connect(this.rainMasterGain);
    stoneSource.start();
    this.rainStoneFilter = stoneFilter;

    const waterSource = ctx.createBufferSource();
    waterSource.buffer = noiseBuffer;
    waterSource.loop = true;
    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = 'lowpass';
    waterFilter.frequency.value = 300;
    this.rainWaterGain = ctx.createGain();
    this.rainWaterGain.gain.value = 0.15;
    waterSource.connect(waterFilter);
    waterFilter.connect(this.rainWaterGain);
    this.rainWaterGain.connect(this.rainMasterGain);
    waterSource.start();
  }

  updateRainFiltersByIntensity() {
    if (!this.rainSandFilter || !this.audioCtx) return;
    const t = this.audioCtx.currentTime;

    this.rainSandFilter.frequency.setValueAtTime(800 + this.rainIntensity * 400, t);
    this.rainStoneFilter.frequency.setValueAtTime(2500 + this.rainIntensity * 1500, t);

    this.rainSandGain.gain.setValueAtTime(0.3 + this.rainIntensity * 0.4, t);
    this.rainStoneGain.gain.setValueAtTime(0.15 + this.rainIntensity * 0.25, t);
    this.rainWaterGain.gain.setValueAtTime(0.1 + this.rainIntensity * 0.2, t);
  }

  scheduleRainSplash() {
    if (!this.audioCtx || !this.rainEnabled) return;

    const ctx = this.audioCtx;
    const t = ctx.currentTime;

    const freq = 600 + Math.random() * 800;
    const duration = 0.08 + Math.random() * 0.12;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + duration);

    const splashGain = ctx.createGain();
    splashGain.gain.setValueAtTime(0, t);
    splashGain.gain.linearRampToValueAtTime(0.06 * this.rainIntensity, t + 0.003);
    splashGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(splashGain);
    splashGain.connect(this.rainMasterGain);
    osc.start(t);
    osc.stop(t + duration + 0.01);

    const maxInterval = 2000;
    const minInterval = 100;
    const interval = maxInterval - (maxInterval - minInterval) * this.rainIntensity;
    const nextDelay = interval * (0.5 + Math.random());

    this.rainSplashTimer = setTimeout(() => this.scheduleRainSplash(), nextDelay);
  }

  // --- Rain Particle System ---
  getRainDropCount() {
    return Math.floor(
      RAIN_MIN_DROPS + this.rainIntensity * (RAIN_MAX_DROPS - RAIN_MIN_DROPS)
    );
  }

  spawnRainDrops() {
    const count = this.getRainDropCount();
    this.rainDrops = [];
    for (let i = 0; i < count; i++) {
      this.rainDrops.push(this.createRainDrop(true));
    }
  }

  adjustRainDropCount() {
    const target = this.getRainDropCount();
    while (this.rainDrops.length < target) {
      this.rainDrops.push(this.createRainDrop(true));
    }
    while (this.rainDrops.length > target) {
      this.rainDrops.pop();
    }
  }

  createRainDrop(randomY) {
    const speedFactor = 0.5 + this.rainIntensity * 0.5;
    const speed =
      (RAIN_DROP_MIN_SPEED +
        Math.random() * (RAIN_DROP_MAX_SPEED - RAIN_DROP_MIN_SPEED)) *
      speedFactor;
    const len =
      RAIN_DROP_MIN_LEN +
      Math.random() *
        (RAIN_DROP_MAX_LEN - RAIN_DROP_MIN_LEN) *
        (0.5 + this.rainIntensity * 0.5);
    return {
      x: Math.random() * (W + 40) - 20,
      y: randomY ? Math.random() * SAND_H : -len - Math.random() * 30,
      speed,
      length: len,
      opacity: 0.15 + Math.random() * 0.3,
    };
  }

  updateRainDrops(delta) {
    for (let i = 0; i < this.rainDrops.length; i++) {
      const drop = this.rainDrops[i];
      const dy = drop.speed * delta;
      const dx = dy * RAIN_WIND_DRIFT;
      drop.x += dx;
      drop.y += dy;

      if (drop.y > SAND_H) {
        const gx = Math.floor(drop.x);
        const impactY = Math.floor(drop.y - dy);
        const ry = Math.max(0, Math.min(impactY, SAND_H - 1));

        if (
          Math.random() < 0.03 + this.rainIntensity * 0.05 &&
          gx >= 0 &&
          gx < W
        ) {
          this.ripples.push({
            x: gx,
            y: ry,
            radius: 0,
            age: 0,
            maxAge: RIPPLE_LIFETIME,
            inGarden: this.isInGarden(gx, ry),
          });
        }

        if (this.rainEnabled) {
          const nd = this.createRainDrop(false);
          drop.x = nd.x;
          drop.y = nd.y;
          drop.speed = nd.speed;
          drop.length = nd.length;
          drop.opacity = nd.opacity;
        } else {
          this.rainDrops.splice(i, 1);
          i--;
        }
      }
    }
  }

  updateRipples(delta) {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.age += delta;
      r.radius = (r.age / r.maxAge) * RIPPLE_MAX_RADIUS;
      if (r.age >= r.maxAge) {
        this.ripples.splice(i, 1);
      }
    }
  }

  updateSandSoftening(delta) {
    this.softenTimer += delta;
    if (this.softenTimer < 100) return;
    this.softenTimer = 0;

    const pixelsPerBatch = Math.floor(80 + this.rainIntensity * 300);
    const blendRate = 0.012 + this.rainIntensity * 0.028;

    let changed = false;
    for (let n = 0; n < pixelsPerBatch; n++) {
      const x = Math.floor(Math.random() * W);
      const y = Math.floor(Math.random() * SAND_H);
      const idx = y * W + x;
      if (!this.gardenMask[idx]) continue;
      if (this.puddleDepth && this.puddleDepth[idx] > 0.1) continue;

      const i = idx * 4;
      const r = this.sandPixels[i];
      const g = this.sandPixels[i + 1];
      const b = this.sandPixels[i + 2];

      const dr = Math.abs(r - SAND_BASE[0]);
      const dg = Math.abs(g - SAND_BASE[1]);
      const db = Math.abs(b - SAND_BASE[2]);

      if (dr > 20 || dg > 20 || db > 20) {
        const noise = (Math.random() - 0.5) * 3;
        this.sandPixels[i] = Math.round(
          r + (SAND_BASE[0] + noise - r) * blendRate
        );
        this.sandPixels[i + 1] = Math.round(
          g + (SAND_BASE[1] + noise - g) * blendRate
        );
        this.sandPixels[i + 2] = Math.round(
          b + (SAND_BASE[2] + noise - b) * blendRate
        );
        changed = true;
      }
    }
    if (changed) this.sandDirty = true;
  }

  updatePuddles(delta) {
    if (!this.puddleDepth) return;

    this.puddleTimer += delta;
    if (this.puddleTimer < 250) return;
    this.puddleTimer = 0;

    if (this.rainEnabled) {
      const fillRate = 0.018 * (0.3 + this.rainIntensity * 0.7);
      const baseBrightness = SAND_BASE[0] + SAND_BASE[1] + SAND_BASE[2];
      const baseWetRate = fillRate * 0.08;
      let any = false;

      for (let i = 0; i < W * SAND_H; i++) {
        if (!this.gardenMask[i]) continue;
        const pi = i * 4;
        const brightness =
          this.sandPixels[pi] +
          this.sandPixels[pi + 1] +
          this.sandPixels[pi + 2];

        if (brightness < baseBrightness - 35) {
          this.puddleDepth[i] = Math.min(
            0.85,
            this.puddleDepth[i] + fillRate * 2
          );
          any = true;
        } else if (brightness < baseBrightness - 12) {
          this.puddleDepth[i] = Math.min(
            0.5,
            this.puddleDepth[i] + fillRate * 0.5
          );
          any = true;
        } else if (this.puddleDepth[i] < 0.10) {
          this.puddleDepth[i] = Math.min(
            0.10,
            this.puddleDepth[i] + baseWetRate
          );
          any = true;
        }
      }

      if (any) {
        this.anyPuddles = true;
        this.sandDirty = true;
      }
    } else {
      let any = false;
      const dryRate = 0.005;
      for (let i = 0; i < W * SAND_H; i++) {
        if (this.puddleDepth[i] > 0) {
          this.puddleDepth[i] = Math.max(0, this.puddleDepth[i] - dryRate);
          if (this.puddleDepth[i] > 0) any = true;
        }
      }
      this.anyPuddles = any;
      if (any) this.sandDirty = true;
    }
  }

  updateWetSheen(delta) {
    const targetWetness = this.rainEnabled ? 1 : 0;
    const rate = this.rainEnabled ? 0.002 : 0.0008;
    const prevWetness = this.wetness;
    this.wetness += (targetWetness - this.wetness) * rate * delta;
    this.wetness = Math.max(0, Math.min(1, this.wetness));

    if (this.placedItems.length === 0) return;

    const step = Math.round(this.wetness * 20);
    const prevStep = Math.round(prevWetness * 20);
    if (step === prevStep) return;

    const w = this.wetness;

    for (const sprite of this.placedItems) {
      const tex = sprite._canvasTex;
      if (!tex || !tex.context) continue;

      if (!sprite._dryPixels) {
        const imgData = tex.context.getImageData(
          0, 0, tex.canvas.width, tex.canvas.height
        );
        sprite._dryPixels = new Uint8ClampedArray(imgData.data);
        sprite._texW = tex.canvas.width;
        sprite._texH = tex.canvas.height;
      }

      const ctx = tex.context;
      const imgData = ctx.createImageData(sprite._texW, sprite._texH);
      const d = imgData.data;
      const dry = sprite._dryPixels;

      for (let i = 0; i < d.length; i += 4) {
        if (dry[i + 3] === 0) continue;
        d[i]     = Math.floor(dry[i] * (1 - w * 0.30));
        d[i + 1] = Math.floor(dry[i + 1] * (1 - w * 0.30));
        d[i + 2] = Math.min(255, Math.floor(dry[i + 2] * (1 - w * 0.20) + w * 8));
        d[i + 3] = dry[i + 3];
      }

      ctx.putImageData(imgData, 0, 0);
      tex.refresh();
    }
  }

  renderRainEffects() {
    this.rainGfx.clear();
    for (const drop of this.rainDrops) {
      const endX = drop.x + drop.length * RAIN_WIND_DRIFT;
      const endY = drop.y + drop.length;
      if (endY < 0 || drop.y > SAND_H) continue;

      this.rainGfx.lineStyle(1, 0xb0c4de, drop.opacity);
      this.rainGfx.beginPath();
      this.rainGfx.moveTo(drop.x, Math.max(0, drop.y));
      this.rainGfx.lineTo(endX, Math.min(SAND_H, endY));
      this.rainGfx.strokePath();
    }

    this.rippleGfx.clear();
    for (const r of this.ripples) {
      const progress = r.age / r.maxAge;
      const alpha = (1 - progress) * 0.4;
      if (alpha < 0.02) continue;

      const color = r.inGarden ? 0x8899aa : 0x667788;
      this.rippleGfx.lineStyle(1, color, alpha);
      this.rippleGfx.strokeCircle(r.x, r.y, r.radius);
    }

    this.rainOverlay.clear();
    const overlayAlpha = this.wetness * 0.18 * (0.5 + this.rainIntensity * 0.5);
    if (overlayAlpha > 0.005) {
      this.rainOverlay.fillStyle(0x334455, overlayAlpha);
      this.rainOverlay.fillRect(0, 0, W, SAND_H);
    }
  }

  // --- Update Loop ---
  update(time, delta) {
    const hasRainActivity =
      this.rainEnabled ||
      this.rainDrops.length > 0 ||
      this.wetness > 0.01 ||
      this.anyPuddles ||
      this.ripples.length > 0;

    if (hasRainActivity) {
      if (this.rainEnabled || this.rainDrops.length > 0) {
        this.updateRainDrops(delta);
      }
      if (this.rainEnabled) {
        this.updateSandSoftening(delta);
      }
      this.updatePuddles(delta);
      this.updateRipples(delta);
      this.updateWetSheen(delta);
      this.renderRainEffects();
    }

    if (this.sandDirty) {
      this.syncSandToCanvas();
    }
  }
}
