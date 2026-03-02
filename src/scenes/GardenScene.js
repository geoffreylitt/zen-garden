import Phaser from 'phaser';

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
    this.mossItems = [];
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

    const tools = ['RAKE', 'ROCK', 'SHRUB', 'MOSS', 'TEAHOUSE', 'CLEAR', 'SOUND'];
    const btnW = 58;
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
        fontSize: '9px',
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
      } else if (this.activeTool === 'ROCK' || this.activeTool === 'SHRUB' || this.activeTool === 'TEAHOUSE' || this.activeTool === 'MOSS') {
        const gx = Math.floor(pointer.x);
        const gy = Math.floor(pointer.y);
        if (this.isInGarden(gx, gy)) {
          this.placeItem(this.activeTool, pointer.x, pointer.y);
          if (this.activeTool === 'MOSS') {
            this.playMossPlaceSound();
          } else {
            this.playPlaceSound();
          }
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

  // --- Items (Rocks, Shrubs, Moss) ---
  placeItem(type, x, y) {
    let key;
    if (type === 'ROCK') {
      key = this.createRockTexture();
    } else if (type === 'SHRUB') {
      key = this.createShrubTexture();
    } else if (type === 'TEAHOUSE') {
      key = this.createTeahouseTexture();
    } else if (type === 'MOSS') {
      key = this.createMossTexture();
    }
    const sprite = this.add.image(x, y, key);
    sprite.itemType = type;

    if (type === 'MOSS') {
      sprite.setScale(0.4);
      sprite.setDepth(5);
      const growthData = {
        sprite,
        startTime: this.time.now,
        growthDuration: 8000 + Math.random() * 7000,
        baseScale: 0.4,
        targetScale: 2.0,
        growthProgress: 0,
        stoneChecked: false,
        accentsSpawned: false,
      };
      this.mossItems.push(growthData);
    } else {
      sprite.setScale(2);
      sprite.setDepth(10);
    }

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

  // --- Moss Textures ---
  createMossTexture() {
    const variant = Math.floor(Math.random() * 3);
    if (variant === 0) return this.createFlatMossTexture();
    if (variant === 1) return this.createCushionMossTexture();
    return this.createWispyMossTexture();
  }

  createFlatMossTexture() {
    const id = 'moss_flat_' + Date.now() + '_' + Math.random();
    const w = 14 + Math.floor(Math.random() * 8);
    const h = 10 + Math.floor(Math.random() * 6);
    const tex = this.textures.createCanvas(id, w, h);
    const ctx = tex.context;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    const cx = w / 2;
    const cy = h / 2;
    const baseR = 0x38 + Math.floor(Math.random() * 0x15);
    const baseG = 0x6a + Math.floor(Math.random() * 0x20);
    const baseB = 0x22 + Math.floor(Math.random() * 0x10);
    const seed1 = Math.random() * 100;
    const seed2 = Math.random() * 100;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const dx = (px - cx) / (w / 2);
        const dy = (py - cy) / (h / 2);
        const baseDist = dx * dx + dy * dy;
        const angle = Math.atan2(dy, dx);
        const noise = Math.sin(angle * 3 + seed1) * 0.15 +
                       Math.sin(angle * 5 + seed2) * 0.1 +
                       Math.sin(angle * 7 + seed1 * 2) * 0.08;
        const dist = baseDist * (1 - noise);

        if (dist <= 1.0) {
          const i = (py * w + px) * 4;
          const colorNoise = (Math.sin(px * 2.5 + seed1) * Math.cos(py * 3.1 + seed2)) * 15;
          const patchVar = Math.random() * 12 - 6;
          d[i] = Math.max(0, Math.min(255, baseR + colorNoise + patchVar));
          d[i + 1] = Math.max(0, Math.min(255, baseG + colorNoise + patchVar));
          d[i + 2] = Math.max(0, Math.min(255, baseB + colorNoise * 0.5 + patchVar));
          if (dist > 0.6) {
            const edgeFade = 1 - (dist - 0.6) / 0.4;
            d[i + 3] = Math.floor(255 * edgeFade * edgeFade);
          } else {
            d[i + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    tex.refresh();
    return id;
  }

  createCushionMossTexture() {
    const id = 'moss_cushion_' + Date.now() + '_' + Math.random();
    const size = 8 + Math.floor(Math.random() * 7);
    const w = size;
    const h = size;
    const tex = this.textures.createCanvas(id, w, h);
    const ctx = tex.context;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    const cx = w / 2;
    const cy = h / 2;
    const baseR = 0x1e + Math.floor(Math.random() * 0x12);
    const baseG = 0x52 + Math.floor(Math.random() * 0x20);
    const baseB = 0x15 + Math.floor(Math.random() * 0x10);
    const seed = Math.random() * 100;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const dx = (px - cx) / (w / 2);
        const dy = (py - cy) / (h / 2);
        const dist = dx * dx + dy * dy;
        const bumpNoise = Math.sin(px * 4 + seed) * Math.cos(py * 5 + seed) * 0.1;

        if (dist + bumpNoise <= 1.0) {
          const i = (py * w + px) * 4;
          const heightFactor = 1 - dist;
          const topLight = py < cy ? 0.15 : -0.1;
          const brightness = heightFactor * 0.4 + topLight;
          const bump = Math.sin(px * 6 + seed) * Math.cos(py * 7 + seed * 1.3) * 10;
          const patchVar = Math.random() * 8 - 4;

          d[i] = Math.max(0, Math.min(255, baseR + brightness * 30 + bump + patchVar));
          d[i + 1] = Math.max(0, Math.min(255, baseG + brightness * 50 + bump + patchVar));
          d[i + 2] = Math.max(0, Math.min(255, baseB + brightness * 20 + bump * 0.5 + patchVar));
          if (dist > 0.5) {
            const edgeFade = 1 - (dist - 0.5) / 0.5;
            d[i + 3] = Math.floor(255 * Math.pow(edgeFade, 1.5));
          } else {
            d[i + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    tex.refresh();
    return id;
  }

  createWispyMossTexture() {
    const id = 'moss_wispy_' + Date.now() + '_' + Math.random();
    const w = 16 + Math.floor(Math.random() * 10);
    const h = 6 + Math.floor(Math.random() * 5);
    const tex = this.textures.createCanvas(id, w, h);
    const ctx = tex.context;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    const cx = w / 2;
    const cy = h / 2;
    const baseR = 0x45 + Math.floor(Math.random() * 0x18);
    const baseG = 0x70 + Math.floor(Math.random() * 0x25);
    const baseB = 0x28 + Math.floor(Math.random() * 0x12);
    const seed1 = Math.random() * 100;
    const seed2 = Math.random() * 100;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const dx = (px - cx) / (w / 2);
        const dy = (py - cy) / (h / 2);
        const dist = dx * dx + dy * dy;
        const fillNoise = Math.sin(px * 3.2 + seed1) * Math.cos(py * 4.7 + seed2) +
                           Math.sin(px * 1.7 + seed2) * 0.5;
        const threshold = dist * 1.2 + fillNoise * 0.3;

        if (dist <= 1.0 && threshold < 0.8) {
          const i = (py * w + px) * 4;
          const brownMix = Math.sin(px * 2 + seed1) > 0.5 ? 0.3 : 0;
          const colorNoise = Math.random() * 15 - 7;
          d[i] = Math.max(0, Math.min(255, baseR + brownMix * 20 + colorNoise));
          d[i + 1] = Math.max(0, Math.min(255, baseG - brownMix * 15 + colorNoise));
          d[i + 2] = Math.max(0, Math.min(255, baseB + brownMix * 5 + colorNoise));
          const edgeStart = 0.3;
          if (dist > edgeStart) {
            const edgeFade = 1 - (dist - edgeStart) / (1.0 - edgeStart);
            d[i + 3] = Math.floor(200 * edgeFade * edgeFade);
          } else {
            d[i + 3] = 200 + Math.floor(Math.random() * 55);
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    tex.refresh();
    return id;
  }

  // --- Moss Growth ---
  updateMossGrowth() {
    const now = this.time.now;
    for (const moss of this.mossItems) {
      if (moss.growthProgress < 1) {
        const elapsed = now - moss.startTime;
        moss.growthProgress = Math.min(1, elapsed / moss.growthDuration);
        const t = 1 - Math.pow(1 - moss.growthProgress, 3);
        const scale = moss.baseScale + (moss.targetScale - moss.baseScale) * t;
        moss.sprite.setScale(scale);
      }

      if (!moss.stoneChecked && moss.growthProgress > 0.3) {
        moss.stoneChecked = true;
        let nearStones = 0;
        for (const item of this.placedItems) {
          if (item.itemType === 'ROCK') {
            const dx = item.x - moss.sprite.x;
            const dy = item.y - moss.sprite.y;
            if (Math.sqrt(dx * dx + dy * dy) < 70) nearStones++;
          }
        }
        if (nearStones >= 2) {
          moss.targetScale = 2.8;
        } else if (nearStones >= 1) {
          moss.targetScale = 2.4;
        }
      }

      if (!moss.accentsSpawned && moss.growthProgress >= 0.8) {
        moss.accentsSpawned = true;
        this.spawnMossAccents(moss);
      }
    }
  }

  spawnMossAccents(parentMoss) {
    const nearStones = [];
    for (const item of this.placedItems) {
      if (item.itemType === 'ROCK') {
        const dx = item.x - parentMoss.sprite.x;
        const dy = item.y - parentMoss.sprite.y;
        if (Math.sqrt(dx * dx + dy * dy) < 80) nearStones.push(item);
      }
    }
    if (nearStones.length === 0) return;

    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const stone = nearStones[Math.floor(Math.random() * nearStones.length)];
      const dx = stone.x - parentMoss.sprite.x;
      const dy = stone.y - parentMoss.sprite.y;
      const t = 0.3 + Math.random() * 0.4;
      const x = parentMoss.sprite.x + dx * t + (Math.random() - 0.5) * 15;
      const y = parentMoss.sprite.y + dy * t + (Math.random() - 0.5) * 15;

      if (!this.isInGarden(Math.floor(x), Math.floor(y))) continue;

      const key = this.createMossTexture();
      const sprite = this.add.image(x, y, key);
      sprite.itemType = 'MOSS';
      sprite.setScale(0.1);
      sprite.setDepth(5);
      sprite.setInteractive({ draggable: true, useHandCursor: true });
      this.input.setDraggable(sprite);
      sprite.on('drag', (_pointer, dragX, dragY) => {
        if (dragY < SAND_H) {
          sprite.x = dragX;
          sprite.y = dragY;
        }
      });
      this.placedItems.push(sprite);

      this.mossItems.push({
        sprite,
        startTime: this.time.now + 2000 + i * 3000,
        growthDuration: 8000 + Math.random() * 8000,
        baseScale: 0.1,
        targetScale: 0.6 + Math.random() * 0.4,
        growthProgress: 0,
        stoneChecked: true,
        accentsSpawned: true,
      });
    }
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

  playMossPlaceSound() {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 220;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  // --- Update Loop ---
  update() {
    if (this.sandDirty) {
      this.syncSandToCanvas();
    }
    if (this.mossItems.length > 0) {
      this.updateMossGrowth();
    }
  }
}
