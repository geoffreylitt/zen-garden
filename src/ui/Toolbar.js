import { W, SAND_H, TOOLBAR_H } from '../constants.js';

const TOOL_NAMES = ['RAKE', 'ROCK', 'SHRUB', 'TEAHOUSE', 'CLEAR', 'SOUND'];

// Vivid rainbow colors per button (hex numbers for Phaser, hex strings for CSS)
const BTN_COLORS = [
  { fill: 0xff2266, text: '#ffffff' }, // red-pink
  { fill: 0xff8800, text: '#ffffff' }, // orange
  { fill: 0xddee00, text: '#222200' }, // yellow
  { fill: 0x00cc44, text: '#ffffff' }, // green
  { fill: 0x0099ff, text: '#ffffff' }, // blue
  { fill: 0xcc44ff, text: '#ffffff' }, // purple
];

export class Toolbar {
  constructor(scene, onSelectTool) {
    this.scene = scene;
    this.onSelectTool = onSelectTool;
    this.activeTool = 'RAKE';
    this.buttons = [];
  }

  create() {
    const y = SAND_H;
    const gfx = this.scene.add.graphics();

    // Wild gradient-ish toolbar background — draw vertical stripes of rainbow
    for (let x = 0; x < W; x++) {
      const hue = (x / W) * 6;
      const sector = Math.floor(hue);
      const f = hue - sector;
      const t = Math.round(f * 200);
      const q = Math.round((1 - f) * 200);
      let r, g, b;
      switch (sector % 6) {
        case 0: r = 200; g = t;   b = 0;   break;
        case 1: r = q;   g = 200; b = 0;   break;
        case 2: r = 0;   g = 200; b = t;   break;
        case 3: r = 0;   g = q;   b = 200; break;
        case 4: r = t;   g = 0;   b = 200; break;
        case 5: r = 200; g = 0;   b = q;   break;
      }
      const color = (r << 16) | (g << 8) | b;
      gfx.fillStyle(color, 1);
      gfx.fillRect(x, y, 1, TOOLBAR_H);
    }

    const btnW = 70;
    const gap = (W - TOOL_NAMES.length * btnW) / (TOOL_NAMES.length + 1);

    TOOL_NAMES.forEach((name, idx) => {
      const bx = gap + idx * (btnW + gap);
      const by = y + 4;
      const bh = TOOLBAR_H - 8;

      const bg = this.scene.add.graphics();
      const isActive = name === this.activeTool;
      this.drawButton(bg, bx, by, btnW, bh, isActive, idx);

      const activeTextColor = BTN_COLORS[idx].text;
      const inactiveTextColor = '#ffffffaa';
      const label = this.scene.add.text(bx + btnW / 2, by + bh / 2, name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: isActive ? activeTextColor : inactiveTextColor,
        fontStyle: 'bold',
      });
      label.setOrigin(0.5, 0.5);

      const hitZone = this.scene.add.zone(bx + btnW / 2, by + bh / 2, btnW, bh)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => this.onSelectTool(name));

      this.buttons.push({ name, bg, label, bx, by, btnW, bh, hitZone, idx });
    });
  }

  drawButton(gfx, x, y, w, h, active, idx) {
    gfx.clear();
    const col = BTN_COLORS[idx] || BTN_COLORS[0];
    if (active) {
      gfx.fillStyle(col.fill, 1);
      gfx.fillRoundedRect(x, y, w, h, 3);
      // White glow outline
      gfx.lineStyle(2, 0xffffff, 0.9);
      gfx.strokeRoundedRect(x, y, w, h, 3);
    } else {
      gfx.fillStyle(col.fill, 0.35);
      gfx.fillRoundedRect(x, y, w, h, 3);
    }
  }

  setActiveTool(name) {
    this.activeTool = name;
    this.buttons.forEach((btn) => {
      if (btn.name === 'SOUND') return;
      const isActive = btn.name === this.activeTool;
      this.drawButton(btn.bg, btn.bx, btn.by, btn.btnW, btn.bh, isActive, btn.idx);
      const col = BTN_COLORS[btn.idx] || BTN_COLORS[0];
      btn.label.setColor(isActive ? col.text : '#ffffffaa');
    });
  }

  updateSoundButton(anyEnabled) {
    const soundBtn = this.buttons.find(b => b.name === 'SOUND');
    if (!soundBtn) return;
    const col = BTN_COLORS[soundBtn.idx] || BTN_COLORS[BTN_COLORS.length - 1];
    soundBtn.bg.clear();
    soundBtn.bg.fillStyle(col.fill, anyEnabled ? 1.0 : 0.35);
    soundBtn.bg.fillRoundedRect(soundBtn.bx, soundBtn.by, soundBtn.btnW, soundBtn.bh, 3);
    if (anyEnabled) {
      soundBtn.bg.lineStyle(2, 0xffffff, 0.9);
      soundBtn.bg.strokeRoundedRect(soundBtn.bx, soundBtn.by, soundBtn.btnW, soundBtn.bh, 3);
    }
    soundBtn.label.setColor(anyEnabled ? col.text : '#ffffffaa');
  }
}
