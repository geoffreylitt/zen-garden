import { W, SAND_H, TOOLBAR_H, DISCO_COLORS } from '../constants.js';

const TOOL_NAMES = ['RAKE', 'ROCK', 'SHRUB', 'TEAHOUSE', 'CLEAR', 'SOUND'];
const TOOL_LABELS = {
  RAKE:     '🎵 RAKE',
  ROCK:     '💎 ROCK',
  SHRUB:    '🌟 SHRUB',
  TEAHOUSE: '🏮 HOUSE',
  CLEAR:    '🔄 CLEAR',
  SOUND:    '🔊 SOUND',
};

export class Toolbar {
  constructor(scene, onSelectTool) {
    this.scene = scene;
    this.onSelectTool = onSelectTool;
    this.activeTool = 'RAKE';
    this.buttons = [];
    this._colorOffset = 0;
  }

  create() {
    const y = SAND_H;
    const gfx = this.scene.add.graphics();
    // Dark background with subtle gradient-like stripes
    gfx.fillStyle(0x0a0a1a, 1);
    gfx.fillRect(0, y, W, TOOLBAR_H);
    // Neon top edge
    gfx.lineStyle(2, 0xff00ff, 0.8);
    gfx.beginPath();
    gfx.moveTo(0, y);
    gfx.lineTo(W, y);
    gfx.strokePath();

    const btnW = 70;
    const gap = (W - TOOL_NAMES.length * btnW) / (TOOL_NAMES.length + 1);

    TOOL_NAMES.forEach((name, idx) => {
      const bx = gap + idx * (btnW + gap);
      const by = y + 4;
      const bh = TOOLBAR_H - 8;

      const bg = this.scene.add.graphics();
      const isActive = name === this.activeTool;
      this.drawButton(bg, bx, by, btnW, bh, isActive, idx);

      const label = this.scene.add.text(bx + btnW / 2, by + bh / 2, TOOL_LABELS[name] || name, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: isActive ? '#000000' : '#cc88ff',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5, 0.5);

      const hitZone = this.scene.add.zone(bx + btnW / 2, by + bh / 2, btnW, bh)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => this.onSelectTool(name));

      this.buttons.push({ name, bg, label, bx, by, btnW, bh, hitZone, colorIdx: idx });
    });
  }

  drawButton(gfx, x, y, w, h, active, colorIdx) {
    gfx.clear();
    const color = DISCO_COLORS[colorIdx % DISCO_COLORS.length];
    if (active) {
      gfx.fillStyle(color, 1);
      gfx.fillRoundedRect(x, y, w, h, 3);
    } else {
      // Dark with neon border
      gfx.fillStyle(0x0d0d1f, 1);
      gfx.fillRoundedRect(x, y, w, h, 3);
      gfx.lineStyle(1, color, 0.6);
      gfx.strokeRoundedRect(x, y, w, h, 3);
    }
  }

  setActiveTool(name) {
    this.activeTool = name;
    this.buttons.forEach((btn) => {
      if (btn.name === 'SOUND') return;
      const isActive = btn.name === this.activeTool;
      this.drawButton(btn.bg, btn.bx, btn.by, btn.btnW, btn.bh, isActive, btn.colorIdx);
      btn.label.setColor(isActive ? '#000000' : '#cc88ff');
    });
  }

  updateSoundButton(anyEnabled) {
    const soundBtn = this.buttons.find(b => b.name === 'SOUND');
    if (!soundBtn) return;
    soundBtn.bg.clear();
    const color = anyEnabled ? 0x00ffff : 0x333355;
    soundBtn.bg.fillStyle(anyEnabled ? 0x003333 : 0x0d0d1f, 1);
    soundBtn.bg.fillRoundedRect(soundBtn.bx, soundBtn.by, soundBtn.btnW, soundBtn.bh, 3);
    soundBtn.bg.lineStyle(1, color, 0.8);
    soundBtn.bg.strokeRoundedRect(soundBtn.bx, soundBtn.by, soundBtn.btnW, soundBtn.bh, 3);
    soundBtn.label.setColor(anyEnabled ? '#00ffff' : '#667788');
  }
}
