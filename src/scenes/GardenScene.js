import Phaser from 'phaser';
import { KoiPond } from '../objects/KoiPond.js';

const W = 480;
const H = 360;
const TOOLBAR_H = 30;
const SAND_H = H - TOOLBAR_H; // 330

// Colors
const SAND_BASE = [0xd2, 0xc4, 0xa0];
const GROOVE_COLOR = [0xb0, 0xa0, 0x78];
const RIDGE_COLOR = [0xe8, 0xdc, 0xbc];

// Rake config
const TINE_COUNT = 5;
const TINE_SPACING = 3;

// Pentatonic chime frequencies (C5-D6 range)
const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.50, 1174.66];

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
      water:   { enabled: false, volume: 0.5, gain: null, maxGain: 0.04 },
    };

    this.ponds = [];
    this.pondShapeIndex = 0;
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
    imageData.data.set(this.sandPixels);
    ctx.putImageData(imageData, 0, 0);
    this.sandTexture.refresh();
    this.sandDirty = false;
  }

  // --- Border ---
  drawBorder() {
    const gfx = this.add.graphics();

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
    gfx.fillStyle(0x4a3728, 1);
    gfx.fillRect(0, y, W, TOOLBAR_H);
    gfx.lineStyle(1, 0x3d2e1f, 0.3);
    for (let ly = y + 5; ly < y + TOOLBAR_H; ly += 6) {
      gfx.beginPath();
      gfx.moveTo(0, ly);
      gfx.lineTo(W, ly);
      gfx.strokePath();
    }

    const tools = ['RAKE', 'ROCK', 'SHRUB', 'POND', 'TEAHOUSE', 'CLEAR', 'SOUND'];
    const btnW = 62;
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

    this.updateSoundButtonVisual();
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
    this.activeTool = name;
    this.toolButtons.forEach((btn) => {
      if (btn.name === 'SOUND') return;
      const isActive = btn.name === this.activeTool;
      this.drawButton(btn.bg, btn.bx, btn.by, btn.btnW, btn.bh, isActive);
      btn.label.setColor(isActive ? '#4a3728' : '#c8b898');
    });
  }

  clearSand() {
    this.fillSand();
    this.syncSandToCanvas();
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
      { key: 'water', label: 'Water' },
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
      } else if (this.activeTool === 'POND') {
        const gx = Math.floor(pointer.x);
        const gy = Math.floor(pointer.y);
        if (this.isInGarden(gx, gy)) {
          this.placePond(pointer.x, pointer.y);
          this.playPlaceSound();
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

  // --- Items (Rocks & Shrubs) ---
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

  placePond(x, y) {
    const shapes = ['circular', 'oval', 'irregular'];
    const shape = shapes[this.pondShapeIndex % shapes.length];
    this.pondShapeIndex++;

    const pond = new KoiPond(this, x, y, shape);
    this.ponds.push(pond);
    this.placedItems.push(pond.container);

    if (this.ponds.length === 1 && this.audioCtx) {
      this.soundLayers.water.enabled = true;
      this.updateLayerGain('water');
      this.updateSoundButtonVisual();
    }
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

    // Roof colors (dark gray tiles)
    const roofBase = [0x45, 0x45, 0x50];
    const roofHighlight = [0x60, 0x60, 0x68];
    
    // Wall colors (warm wood)
    const wallBase = [0x8b, 0x6b, 0x4a];
    const wallDark = [0x6a, 0x52, 0x3a];
    
    // Floor/base color
    const floorColor = [0x5a, 0x48, 0x38];
    
    // Door color (darker)
    const doorColor = [0x3a, 0x2a, 0x20];

    // Draw curved roof (Japanese style)
    for (let py = 0; py < 9; py++) {
      for (let px = 0; px < w; px++) {
        // Calculate roof curve - wider at bottom, narrower at top
        const roofCenterY = 5;
        const roofWidth = w / 2 + (8 - py) * 0.8;
        const centerX = w / 2;
        const distFromCenter = Math.abs(px - centerX);
        
        if (distFromCenter <= roofWidth) {
          // Curved shape - parabolic
          const normalizedX = distFromCenter / roofWidth;
          const curveHeight = py + normalizedX * normalizedX * 3;
          
          if (curveHeight >= py && curveHeight < py + 1.5) {
            const noise = Math.floor((Math.random() - 0.5) * 10);
            // Add some highlight on top
            if (py < 3) {
              setPixel(px, py, roofHighlight[0] + noise, roofHighlight[1] + noise, roofHighlight[2] + noise);
            } else {
              setPixel(px, py, roofBase[0] + noise, roofBase[1] + noise, roofBase[2] + noise);
            }
          }
        }
      }
    }
    
    // Roof overhang edges
    for (let px = 2; px < w - 2; px++) {
      const noise = Math.floor((Math.random() - 0.5) * 8);
      setPixel(px, 8, roofBase[0] - 10 + noise, roofBase[1] - 10 + noise, roofBase[2] + noise);
    }

    // Draw walls
    for (let py = 9; py < 17; py++) {
      for (let px = 4; px < w - 4; px++) {
        const noise = Math.floor((Math.random() - 0.5) * 15);
        // Left and right edges are darker (depth)
        if (px < 6 || px >= w - 6) {
          setPixel(px, py, wallDark[0] + noise, wallDark[1] + noise, wallDark[2] + noise);
        } else {
          setPixel(px, py, wallBase[0] + noise, wallBase[1] + noise, wallBase[2] + noise);
        }
      }
    }
    
    // Draw door in center
    const doorLeft = Math.floor(w / 2) - 2;
    const doorRight = Math.floor(w / 2) + 2;
    for (let py = 11; py < 17; py++) {
      for (let px = doorLeft; px <= doorRight; px++) {
        const noise = Math.floor((Math.random() - 0.5) * 8);
        setPixel(px, py, doorColor[0] + noise, doorColor[1] + noise, doorColor[2] + noise);
      }
    }
    
    // Draw small window on each side
    const windowColor = [0x2a, 0x3a, 0x4a]; // Dark blue-ish
    for (let py = 11; py < 14; py++) {
      for (let px = 6; px < 9; px++) {
        setPixel(px, py, windowColor[0], windowColor[1], windowColor[2]);
      }
      for (let px = w - 9; px < w - 6; px++) {
        setPixel(px, py, windowColor[0], windowColor[1], windowColor[2]);
      }
    }

    // Draw floor/foundation
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
      this.setupWaterSound();
      this.setupRakeSound();
    } catch (e) {
      // Web Audio not available
    }
  }

  setupWind() {
    const ctx = this.audioCtx;
    const layer = this.soundLayers.wind;

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

  setupWaterSound() {
    const ctx = this.audioCtx;
    const layer = this.soundLayers.water;

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
    filter.frequency.value = 400;
    filter.Q.value = 0.8;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    layer.gain = ctx.createGain();
    layer.gain.gain.value = layer.enabled ? layer.volume * layer.maxGain : 0;

    source.connect(filter);
    filter.connect(layer.gain);
    layer.gain.connect(ctx.destination);
    source.start();
    lfo.start();
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

  // --- Update Loop ---
  update(_time, delta) {
    if (this.sandDirty) {
      this.syncSandToCanvas();
    }
    for (const pond of this.ponds) {
      pond.update(delta);
    }
  }
}
