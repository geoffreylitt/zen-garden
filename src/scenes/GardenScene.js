import Phaser from 'phaser';
import { DayNightCycle } from '../DayNightCycle.js';

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

const BIRD_SONGS = [
  { base: 2200, range: 800 },
  { base: 3000, range: 600 },
  { base: 2600, range: 1000 },
  { base: 1800, range: 400 },
];

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
    this.birdTimer = null;
    this.frogTimer = null;
    this.soundDialogEl = null;
    this.timeDialogEl = null;

    this.dayNight = new DayNightCycle();
    this.overlayGfx = null;
    this.shadowGfx = null;
    this.glowGfx = null;
    this.cloudShadowGfx = null;
    this.clouds = [];
    this._lastSoundUpdate = 0;
    this._timeDisplay = null;
    this._timeSlider = null;
    this._pinCheckbox = null;
    this._syncCheckbox = null;

    this.soundLayers = {
      wind:     { enabled: true, volume: 0.6, gain: null, maxGain: 0.06 },
      chimes:   { enabled: true, volume: 0.5, gain: null, maxGain: 0.12 },
      cicadas:  { enabled: true, volume: 0.4, gain: null, maxGain: 0.05 },
      birdsong: { enabled: true, volume: 0.5, gain: null, maxGain: 0.08 },
      crickets: { enabled: true, volume: 0.5, gain: null, maxGain: 0.04 },
      frogs:    { enabled: true, volume: 0.4, gain: null, maxGain: 0.06 },
    };
  }

  create() {
    this.buildGardenMask();
    this.createSandCanvas();
    this.drawBorder();

    this.shadowGfx = this.add.graphics();
    this.shadowGfx.setDepth(1);

    this.cloudShadowGfx = this.add.graphics();
    this.cloudShadowGfx.setDepth(4);

    this.overlayGfx = this.add.graphics();
    this.overlayGfx.setDepth(5);

    this.glowGfx = this.add.graphics();
    this.glowGfx.setDepth(6);
    this.glowGfx.setBlendMode(Phaser.BlendModes.ADD);

    this.initCloudShadows();
    this.createToolbar();
    this.setupInput();
  }

  // ── Garden Geometry ──

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
        this.gardenMask[y * W + x] = dx * dx + dy * dy <= 1.0 ? 1 : 0;
      }
    }
  }

  isInGarden(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= SAND_H) return false;
    return this.gardenMask[y * W + x] === 1;
  }

  // ── Sand Canvas ──

  createSandCanvas() {
    this.sandTexture = this.textures.createCanvas('sand', W, SAND_H);
    this.sandPixels = new Uint8ClampedArray(W * SAND_H * 4);
    this.fillSand();
    this.syncSandToCanvas();
    this.sandImage = this.add.image(W / 2, SAND_H / 2, 'sand');
    this.sandImage.setDepth(0);
  }

  fillSand() {
    for (let y = 0; y < SAND_H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (this.gardenMask[y * W + x]) {
          const noise = (Math.random() - 0.5) * 16;
          this.sandPixels[i]     = SAND_BASE[0] + noise;
          this.sandPixels[i + 1] = SAND_BASE[1] + noise;
          this.sandPixels[i + 2] = SAND_BASE[2] + noise;
          this.sandPixels[i + 3] = 255;
        } else {
          this.sandPixels[i]     = 0x3a;
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

  clearSand() {
    this.fillSand();
    this.syncSandToCanvas();
  }

  // ── Border ──

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

  // ── Toolbar ──

  createToolbar() {
    const y = SAND_H;
    const gfx = this.add.graphics();
    gfx.setDepth(10);
    gfx.fillStyle(0x4a3728, 1);
    gfx.fillRect(0, y, W, TOOLBAR_H);
    gfx.lineStyle(1, 0x3d2e1f, 0.3);
    for (let ly = y + 5; ly < y + TOOLBAR_H; ly += 6) {
      gfx.beginPath();
      gfx.moveTo(0, ly);
      gfx.lineTo(W, ly);
      gfx.strokePath();
    }

    const tools = [
      { name: 'RAKE',     label: 'RAKE' },
      { name: 'ROCK',     label: 'ROCK' },
      { name: 'SHRUB',    label: 'SHRUB' },
      { name: 'TEAHOUSE', label: 'HOUSE' },
      { name: 'TORO',     label: 'TORO' },
      { name: 'CLEAR',    label: 'CLEAR' },
      { name: 'TIME',     label: 'TIME' },
      { name: 'SOUND',    label: 'SOUND' },
    ];
    const btnW = 54;
    const gap = (W - tools.length * btnW) / (tools.length + 1);

    this.toolButtons = [];

    tools.forEach((tool, idx) => {
      const bx = gap + idx * (btnW + gap);
      const by = y + 4;
      const bh = TOOLBAR_H - 8;

      const bg = this.add.graphics();
      bg.setDepth(11);
      const isActive = tool.name === this.activeTool;
      this.drawButton(bg, bx, by, btnW, bh, isActive);

      const label = this.add.text(bx + btnW / 2, by + bh / 2, tool.label, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: isActive ? '#4a3728' : '#c8b898',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5, 0.5);
      label.setDepth(12);

      const hitZone = this.add.zone(bx + btnW / 2, by + bh / 2, btnW, bh)
        .setInteractive({ useHandCursor: true });
      hitZone.setDepth(13);

      hitZone.on('pointerdown', () => this.selectTool(tool.name));

      this.toolButtons.push({ name: tool.name, bg, label, bx, by, btnW, bh, hitZone });
    });

    this.updateSoundButtonVisual();
    this.updateTimeButtonVisual();
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
    if (name === 'TIME') {
      this.openTimeDialog();
      return;
    }
    this.activeTool = name;
    this.toolButtons.forEach((btn) => {
      if (btn.name === 'SOUND' || btn.name === 'TIME') return;
      const isActive = btn.name === this.activeTool;
      this.drawButton(btn.bg, btn.bx, btn.by, btn.btnW, btn.bh, isActive);
      btn.label.setColor(isActive ? '#4a3728' : '#c8b898');
    });
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

  updateTimeButtonVisual() {
    const btn = this.toolButtons.find(b => b.name === 'TIME');
    if (!btn) return;
    const colors = {
      dawn:  { bg: 0xC09030, text: '#3a2810' },
      day:   { bg: 0x809060, text: '#2a3020' },
      dusk:  { bg: 0xC06030, text: '#3a1810' },
      night: { bg: 0x304060, text: '#a0b0c0' },
    };
    const phase = this.dayNight.getPhase();
    const { bg, text } = colors[phase];
    btn.bg.clear();
    btn.bg.fillStyle(bg, 1);
    btn.bg.fillRoundedRect(btn.bx, btn.by, btn.btnW, btn.bh, 3);
    btn.label.setColor(text);
  }

  // ── Sound Dialog ──

  openSoundDialog() {
    this.ensureAudio();
    if (!this.soundDialogEl) this.createSoundDialog();
    this.soundDialogEl.style.display = 'flex';
  }

  closeSoundDialog() {
    if (this.soundDialogEl) this.soundDialogEl.style.display = 'none';
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
      { key: 'wind',    label: 'Wind' },
      { key: 'chimes',  label: 'Chimes' },
      { key: 'cicadas', label: 'Cicadas' },
    ];

    const dayNightLayers = [
      { key: 'birdsong', label: 'Birdsong' },
      { key: 'crickets', label: 'Crickets' },
      { key: 'frogs',    label: 'Frogs' },
    ];

    const buildRow = ({ key, label }) => {
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
    };

    layers.forEach(buildRow);

    const sep = document.createElement('div');
    sep.className = 'sound-separator';
    sep.textContent = 'Time-of-Day';
    dialog.appendChild(sep);

    dayNightLayers.forEach(buildRow);

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeSoundDialog();
    });

    document.body.appendChild(overlay);
    this.soundDialogEl = overlay;
  }

  updateLayerGain(key, rampTime) {
    const layer = this.soundLayers[key];
    if (!layer.gain) return;

    const rt = rampTime !== undefined ? rampTime : 0.1;
    const timeMult = layer._timeMultiplier !== undefined ? layer._timeMultiplier : 1;
    const target = layer.enabled ? layer.volume * layer.maxGain * timeMult : 0;
    const t = this.audioCtx.currentTime;

    layer.gain.gain.cancelScheduledValues(t);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, t);
    layer.gain.gain.linearRampToValueAtTime(target, t + rt);

    if (layer.lfoGain) {
      const lfoMult = key === 'cicadas' ? 0.5 : 0.8;
      layer.lfoGain.gain.cancelScheduledValues(t);
      layer.lfoGain.gain.setValueAtTime(layer.lfoGain.gain.value, t);
      layer.lfoGain.gain.linearRampToValueAtTime(target * lfoMult, t + rt);
    }
    if (layer.swellGain) {
      layer.swellGain.gain.cancelScheduledValues(t);
      layer.swellGain.gain.setValueAtTime(layer.swellGain.gain.value, t);
      layer.swellGain.gain.linearRampToValueAtTime(target * 0.3, t + rt);
    }
  }

  // ── Time Dialog ──

  openTimeDialog() {
    if (!this.timeDialogEl) this.createTimeDialog();
    this.timeDialogEl.style.display = 'flex';
    this.updateTimeDialogDisplay();
  }

  closeTimeDialog() {
    if (this.timeDialogEl) this.timeDialogEl.style.display = 'none';
  }

  createTimeDialog() {
    const overlay = document.createElement('div');
    overlay.id = 'time-settings-overlay';

    const dialog = document.createElement('div');
    dialog.id = 'time-settings-dialog';

    const titleBar = document.createElement('div');
    titleBar.className = 'sound-dialog-title';
    const title = document.createElement('span');
    title.textContent = 'Time Settings';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sound-dialog-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => this.closeTimeDialog());
    titleBar.appendChild(title);
    titleBar.appendChild(closeBtn);
    dialog.appendChild(titleBar);

    const display = document.createElement('div');
    display.className = 'time-display';
    display.textContent = this.dayNight.getPhaseLabel();
    dialog.appendChild(display);
    this._timeDisplay = display;

    // Preset buttons
    const presets = document.createElement('div');
    presets.className = 'time-presets';
    [
      { label: 'Dawn',  t: 0.25 },
      { label: 'Day',   t: 0.45 },
      { label: 'Dusk',  t: 0.73 },
      { label: 'Night', t: 0.95 },
    ].forEach(({ label, t: preset }) => {
      const btn = document.createElement('button');
      btn.className = 'time-preset-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        this.dayNight.setTime(preset);
        this.dayNight.pinned = true;
        this.dayNight.syncRealTime = false;
        this._pinCheckbox.checked = true;
        this._syncCheckbox.checked = false;
        this._timeSlider.value = Math.round(preset * 1000);
        this._timeSlider.disabled = false;
      });
      presets.appendChild(btn);
    });
    dialog.appendChild(presets);

    // Time slider
    const timeRow = document.createElement('div');
    timeRow.className = 'sound-layer-row';
    const timeLabel = document.createElement('label');
    timeLabel.textContent = 'Time';
    timeLabel.style.flex = '0 0 52px';
    const timeSlider = document.createElement('input');
    timeSlider.type = 'range';
    timeSlider.min = '0';
    timeSlider.max = '1000';
    timeSlider.value = String(Math.round(this.dayNight.time * 1000));
    timeSlider.className = 'sound-slider';
    timeSlider.addEventListener('input', () => {
      const v = parseInt(timeSlider.value, 10) / 1000;
      this.dayNight.setTime(v);
      this.dayNight.pinned = true;
      this.dayNight.syncRealTime = false;
      this._pinCheckbox.checked = true;
      this._syncCheckbox.checked = false;
    });
    timeRow.appendChild(timeLabel);
    timeRow.appendChild(timeSlider);
    dialog.appendChild(timeRow);
    this._timeSlider = timeSlider;

    // Speed slider
    const speedRow = document.createElement('div');
    speedRow.className = 'sound-layer-row';
    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'Speed';
    speedLabel.style.flex = '0 0 52px';
    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '1';
    speedSlider.max = '20';
    speedSlider.value = '5';
    speedSlider.className = 'sound-slider';
    speedSlider.addEventListener('input', () => {
      const spd = parseInt(speedSlider.value, 10);
      this.dayNight.cycleDuration = 600 / spd;
    });
    speedRow.appendChild(speedLabel);
    speedRow.appendChild(speedSlider);
    dialog.appendChild(speedRow);

    // Pin toggle
    const pinRow = document.createElement('div');
    pinRow.className = 'sound-layer-row';
    const pinCheck = document.createElement('input');
    pinCheck.type = 'checkbox';
    pinCheck.id = 'time-pin';
    pinCheck.checked = this.dayNight.pinned;
    pinCheck.addEventListener('change', () => {
      this.dayNight.pinned = pinCheck.checked;
      if (pinCheck.checked) {
        this.dayNight.syncRealTime = false;
        this._syncCheckbox.checked = false;
      }
    });
    const pinLabel = document.createElement('label');
    pinLabel.htmlFor = 'time-pin';
    pinLabel.textContent = 'Pin current time';
    pinLabel.style.flex = '1';
    pinRow.appendChild(pinCheck);
    pinRow.appendChild(pinLabel);
    dialog.appendChild(pinRow);
    this._pinCheckbox = pinCheck;

    // Sync to real time toggle
    const syncRow = document.createElement('div');
    syncRow.className = 'sound-layer-row';
    const syncCheck = document.createElement('input');
    syncCheck.type = 'checkbox';
    syncCheck.id = 'time-sync';
    syncCheck.checked = this.dayNight.syncRealTime;
    syncCheck.addEventListener('change', () => {
      this.dayNight.syncRealTime = syncCheck.checked;
      if (syncCheck.checked) {
        this.dayNight.pinned = false;
        this._pinCheckbox.checked = false;
      }
      this._timeSlider.disabled = syncCheck.checked;
    });
    const syncLabel = document.createElement('label');
    syncLabel.htmlFor = 'time-sync';
    syncLabel.textContent = 'Sync to real time';
    syncLabel.style.flex = '1';
    syncRow.appendChild(syncCheck);
    syncRow.appendChild(syncLabel);
    dialog.appendChild(syncRow);
    this._syncCheckbox = syncCheck;

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeTimeDialog();
    });

    document.body.appendChild(overlay);
    this.timeDialogEl = overlay;
  }

  updateTimeDialogDisplay() {
    if (!this._timeDisplay) return;
    if (!this.timeDialogEl || this.timeDialogEl.style.display === 'none') return;
    this._timeDisplay.textContent = this.dayNight.getPhaseLabel();
    if (!this.dayNight.pinned) {
      this._timeSlider.value = Math.round(this.dayNight.time * 1000);
    }
  }

  // ── Input ──

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
      } else if (['ROCK', 'SHRUB', 'TEAHOUSE', 'TORO'].includes(this.activeTool)) {
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

  // ── Raking ──

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
    this.sandPixels[i]     = color[0];
    this.sandPixels[i + 1] = color[1];
    this.sandPixels[i + 2] = color[2];
    this.sandPixels[i + 3] = 255;
  }

  // ── Items ──

  placeItem(type, x, y) {
    let key;
    if (type === 'ROCK') {
      key = this.createRockTexture();
    } else if (type === 'SHRUB') {
      key = this.createShrubTexture();
    } else if (type === 'TEAHOUSE') {
      key = this.createTeahouseTexture();
    } else if (type === 'TORO') {
      key = this.createToroTexture();
    }
    const sprite = this.add.image(x, y, key);
    sprite.setScale(2);
    sprite.setDepth(2);
    sprite.setInteractive({ draggable: true, useHandCursor: true });
    sprite.itemType = type;

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
          d[i]     = shade + warm;
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
          d[i]     = Math.floor(0x20 * dark);
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
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
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

  createToroTexture() {
    const id = 'toro_' + Date.now() + '_' + Math.random();
    const w = 10;
    const h = 16;
    const tex = this.textures.createCanvas(id, w, h);
    const ctx = tex.context;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    const stone      = [0x8a, 0x88, 0x80];
    const stoneDark  = [0x6a, 0x68, 0x60];
    const stoneLight = [0x9a, 0x98, 0x90];
    const lightColor = [0xe0, 0xb0, 0x40];

    const set = (px, py, c) => {
      if (px < 0 || px >= w || py < 0 || py >= h) return;
      const i = (py * w + px) * 4;
      const n = Math.floor((Math.random() - 0.5) * 12);
      d[i] = c[0] + n; d[i + 1] = c[1] + n; d[i + 2] = c[2] + n; d[i + 3] = 255;
    };

    // Finial
    for (let px = 4; px <= 5; px++) set(px, 0, stoneLight);
    for (let px = 3; px <= 6; px++) set(px, 1, stone);

    // Roof
    for (let px = 2; px <= 7; px++) set(px, 2, stoneLight);
    for (let px = 1; px <= 8; px++) set(px, 3, stone);
    for (let px = 0; px <= 9; px++) set(px, 4, stoneDark);

    // Chamber top
    for (let px = 3; px <= 6; px++) set(px, 5, stone);
    // Chamber sides and light openings
    for (let py = 6; py <= 8; py++) {
      set(3, py, stone);
      set(6, py, stone);
      set(4, py, lightColor);
      set(5, py, lightColor);
    }
    // Chamber bottom
    for (let px = 3; px <= 6; px++) set(px, 9, stone);

    // Pillar
    for (let py = 10; py <= 12; py++) {
      set(4, py, stone);
      set(5, py, stone);
    }

    // Base
    for (let px = 3; px <= 6; px++) set(px, 13, stone);
    for (let px = 2; px <= 7; px++) set(px, 14, stoneDark);
    for (let px = 2; px <= 7; px++) set(px, 15, stoneDark);

    ctx.putImageData(imgData, 0, 0);
    tex.refresh();
    return id;
  }

  // ── Audio ──

  ensureAudio() {
    if (this.audioStarted) return;
    this.audioStarted = true;

    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.setupWind();
      this.setupChimes();
      this.setupCicadas();
      this.setupBirdsong();
      this.setupCrickets();
      this.setupFrogs();
      this.setupRakeSound();

      // Set initial time multipliers
      const mult = this.dayNight.getSoundMultipliers();
      for (const key of Object.keys(this.soundLayers)) {
        this.soundLayers[key]._timeMultiplier = mult[key] !== undefined ? mult[key] : 1;
      }
      for (const key of Object.keys(this.soundLayers)) {
        this.updateLayerGain(key, 0.01);
      }
    } catch (_e) {
      // Web Audio not available
    }
  }

  setupWind() {
    const ctx = this.audioCtx;
    const layer = this.soundLayers.wind;

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250;

    layer.gain = ctx.createGain();
    layer.gain.gain.value = 0;

    source.connect(filter);
    filter.connect(layer.gain);
    layer.gain.connect(ctx.destination);
    source.start();
  }

  setupChimes() {
    const ctx = this.audioCtx;
    const layer = this.soundLayers.chimes;

    layer.gain = ctx.createGain();
    layer.gain.gain.value = 0;
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
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

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
    layer.gain.gain.value = 0;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 8;
    layer.lfoGain = ctx.createGain();
    layer.lfoGain.gain.value = 0;

    const swell = ctx.createOscillator();
    swell.frequency.value = 0.15;
    layer.swellGain = ctx.createGain();
    layer.swellGain.gain.value = 0;

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

  setupBirdsong() {
    const ctx = this.audioCtx;
    const layer = this.soundLayers.birdsong;

    layer.gain = ctx.createGain();
    layer.gain.gain.value = 0;
    layer.gain.connect(ctx.destination);

    this.scheduleBirdChirp();
  }

  scheduleBirdChirp() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') return;

    const ctx = this.audioCtx;
    const layer = this.soundLayers.birdsong;
    const timeMult = layer._timeMultiplier || 0;

    if (layer.enabled && timeMult > 0.05) {
      const bird = BIRD_SONGS[Math.floor(Math.random() * BIRD_SONGS.length)];
      const noteCount = 2 + Math.floor(Math.random() * 4);

      for (let i = 0; i < noteCount; i++) {
        const freq = bird.base + Math.random() * bird.range;
        const t = ctx.currentTime + i * (0.07 + Math.random() * 0.06);
        const dur = 0.04 + Math.random() * 0.08;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.linearRampToValueAtTime(
          freq * (0.8 + Math.random() * 0.4), t + dur
        );

        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.15, t + 0.003);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(g);
        g.connect(layer.gain);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      }
    }

    const nextDelay = 1500 + Math.random() * 5000;
    this.birdTimer = setTimeout(() => this.scheduleBirdChirp(), nextDelay);
  }

  setupCrickets() {
    const ctx = this.audioCtx;
    const layer = this.soundLayers.crickets;

    const bufSize = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 4500;
    bp.Q.value = 8;

    layer.gain = ctx.createGain();
    layer.gain.gain.value = 0;

    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 3.5;
    layer.lfoGain = ctx.createGain();
    layer.lfoGain.gain.value = 0;

    src.connect(bp);
    bp.connect(layer.gain);

    lfo.connect(layer.lfoGain);
    layer.lfoGain.connect(layer.gain.gain);

    layer.gain.connect(ctx.destination);
    src.start();
    lfo.start();
  }

  setupFrogs() {
    const ctx = this.audioCtx;
    const layer = this.soundLayers.frogs;

    layer.gain = ctx.createGain();
    layer.gain.gain.value = 0;
    layer.gain.connect(ctx.destination);

    this.scheduleFrogCroak();
  }

  scheduleFrogCroak() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') return;

    const ctx = this.audioCtx;
    const layer = this.soundLayers.frogs;
    const timeMult = layer._timeMultiplier || 0;

    if (layer.enabled && timeMult > 0.05) {
      const baseFreq = 180 + Math.random() * 120;
      const t = ctx.currentTime;
      const dur = 0.2 + Math.random() * 0.3;

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, t + dur);

      const vib = ctx.createOscillator();
      vib.frequency.value = 25;
      const vibGain = ctx.createGain();
      vibGain.gain.value = 30;
      vib.connect(vibGain);
      vibGain.connect(osc.frequency);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.3, t + 0.02);
      g.gain.setValueAtTime(0.25, t + dur * 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;

      osc.connect(lp);
      lp.connect(g);
      g.connect(layer.gain);

      osc.start(t);
      osc.stop(t + dur + 0.01);
      vib.start(t);
      vib.stop(t + dur + 0.01);

      if (Math.random() < 0.3) {
        const t2 = t + dur + 0.05;
        const dur2 = 0.15 + Math.random() * 0.15;

        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(baseFreq * 0.9, t2);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t2 + dur2);

        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0, t2);
        g2.gain.linearRampToValueAtTime(0.2, t2 + 0.02);
        g2.gain.exponentialRampToValueAtTime(0.001, t2 + dur2);

        const lp2 = ctx.createBiquadFilter();
        lp2.type = 'lowpass';
        lp2.frequency.value = 500;

        osc2.connect(lp2);
        lp2.connect(g2);
        g2.connect(layer.gain);

        osc2.start(t2);
        osc2.stop(t2 + dur2 + 0.01);
      }
    }

    const nextDelay = 1000 + Math.random() * 4000;
    this.frogTimer = setTimeout(() => this.scheduleFrogCroak(), nextDelay);
  }

  setupRakeSound() {
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

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

  updateSoundForTimeOfDay() {
    if (!this.audioCtx) return;
    const mult = this.dayNight.getSoundMultipliers();

    for (const key of Object.keys(this.soundLayers)) {
      const layer = this.soundLayers[key];
      const newMult = mult[key] !== undefined ? mult[key] : 1;
      const oldMult = layer._timeMultiplier !== undefined ? layer._timeMultiplier : 1;

      if (Math.abs(newMult - oldMult) < 0.003) continue;

      layer._timeMultiplier = newMult;
      if (!layer.gain) continue;

      const target = layer.enabled ? layer.volume * layer.maxGain * newMult : 0;
      const t = this.audioCtx.currentTime;

      layer.gain.gain.cancelScheduledValues(t);
      layer.gain.gain.setValueAtTime(layer.gain.gain.value, t);
      layer.gain.gain.linearRampToValueAtTime(target, t + 2.0);

      if (layer.lfoGain) {
        const lfoMult = key === 'cicadas' ? 0.5 : 0.8;
        layer.lfoGain.gain.cancelScheduledValues(t);
        layer.lfoGain.gain.setValueAtTime(layer.lfoGain.gain.value, t);
        layer.lfoGain.gain.linearRampToValueAtTime(target * lfoMult, t + 2.0);
      }
      if (layer.swellGain) {
        layer.swellGain.gain.cancelScheduledValues(t);
        layer.swellGain.gain.setValueAtTime(layer.swellGain.gain.value, t);
        layer.swellGain.gain.linearRampToValueAtTime(target * 0.3, t + 2.0);
      }
    }
  }

  // ── Day/Night Visuals ──

  initCloudShadows() {
    this.clouds = [];
    for (let i = 0; i < 3; i++) {
      this.clouds.push({
        x: Math.random() * W,
        y: SAND_H * 0.15 + Math.random() * SAND_H * 0.7,
        w: 50 + Math.random() * 70,
        h: 35 + Math.random() * 45,
        speed: 4 + Math.random() * 8,
      });
    }
  }

  updateOverlay(state) {
    this.overlayGfx.clear();
    const colorInt =
      (Math.round(state.overlayR) << 16) |
      (Math.round(state.overlayG) << 8) |
      Math.round(state.overlayB);
    this.overlayGfx.fillStyle(colorInt, state.overlayA);
    this.overlayGfx.fillRect(0, 0, W, SAND_H);
  }

  updateShadows(state) {
    this.shadowGfx.clear();
    if (this.placedItems.length === 0) return;

    const alpha = state.shadowAlpha;
    if (alpha < 0.01) return;

    for (const item of this.placedItems) {
      const sx = item.x + state.shadowX;
      const sy = item.y + state.shadowY;
      const sw = 12 + state.shadowLen * 0.5;
      const sh = 6 + state.shadowLen * 0.3;

      this.shadowGfx.fillStyle(0x000000, alpha);
      this.shadowGfx.fillEllipse(sx, sy, sw, sh);
    }
  }

  updateLanternGlow() {
    this.glowGfx.clear();
    const mult = this.dayNight.getSoundMultipliers().lanternGlow;
    if (mult < 0.01) return;

    for (const item of this.placedItems) {
      if (item.itemType !== 'TORO') continue;

      this.glowGfx.fillStyle(0xffdd66, mult * 0.06);
      this.glowGfx.fillCircle(item.x, item.y, 45);
      this.glowGfx.fillStyle(0xffcc44, mult * 0.10);
      this.glowGfx.fillCircle(item.x, item.y, 28);
      this.glowGfx.fillStyle(0xffaa22, mult * 0.14);
      this.glowGfx.fillCircle(item.x, item.y, 16);
    }
  }

  updateCloudShadows(delta) {
    this.cloudShadowGfx.clear();
    const phase = this.dayNight.getPhase();
    if (phase !== 'day') return;

    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * (delta / 1000);
      if (cloud.x - cloud.w > W) {
        cloud.x = -cloud.w;
        cloud.y = SAND_H * 0.15 + Math.random() * SAND_H * 0.7;
      }
      this.cloudShadowGfx.fillStyle(0x000000, 0.04);
      this.cloudShadowGfx.fillEllipse(cloud.x, cloud.y, cloud.w, cloud.h);
    }
  }

  // ── Update Loop ──

  update(time, delta) {
    this.dayNight.update(delta);

    const state = this.dayNight.getState();
    this.updateOverlay(state);
    this.updateShadows(state);
    this.updateLanternGlow();
    this.updateCloudShadows(delta);
    this.updateTimeButtonVisual();
    this.updateTimeDialogDisplay();

    if (!this._lastSoundUpdate || time - this._lastSoundUpdate > 200) {
      this._lastSoundUpdate = time;
      this.updateSoundForTimeOfDay();
    }

    if (this.sandDirty) {
      this.syncSandToCanvas();
    }
  }
}
