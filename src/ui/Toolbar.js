import { W, SAND_H, TOOLBAR_H } from '../constants.js';

const TOOL_NAMES = ['RAKE', 'ROCK', 'SHRUB', 'TEAHOUSE', 'CLEAR', 'SOUND'];

// One vivid rainbow hue per button
const BTN_COLORS        = [0xff2244, 0xff8800, 0xdddd00, 0x00cc44, 0x0099ff, 0xcc00ff];
const BTN_ACTIVE_COLORS = [0xff9999, 0xffcc77, 0xffff88, 0x88ffaa, 0x88ddff, 0xee88ff];

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

    // Rainbow striped toolbar background
    const segW = W / TOOL_NAMES.length;
    BTN_COLORS.forEach((c, ci) => {
      gfx.fillStyle(c, 0.55);
      gfx.fillRect(ci * segW, y, segW, TOOLBAR_H);
    });

    // Thin bright top edge
    gfx.lineStyle(2, 0xffffff, 0.7);
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

      const label = this.scene.add.text(bx + btnW / 2, by + bh / 2, name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: isActive ? '#1a0040' : '#ffffff',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5, 0.5);

      const hitZone = this.scene.add.zone(bx + btnW / 2, by + bh / 2, btnW, bh)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => this.onSelectTool(name));

      this.buttons.push({ name, bg, label, bx, by, btnW, bh, hitZone, idx });
    });
  }

  drawButton(gfx, x, y, w, h, active, idx = 0) {
    gfx.clear();
    gfx.fillStyle(active ? BTN_ACTIVE_COLORS[idx % BTN_ACTIVE_COLORS.length]
                         : BTN_COLORS[idx % BTN_COLORS.length], 1);
    gfx.fillRoundedRect(x, y, w, h, 3);
  }

  setActiveTool(name) {
    this.activeTool = name;
    this.buttons.forEach((btn) => {
      if (btn.name === 'SOUND') return;
      const isActive = btn.name === this.activeTool;
      this.drawButton(btn.bg, btn.bx, btn.by, btn.btnW, btn.bh, isActive, btn.idx);
      btn.label.setColor(isActive ? '#1a0040' : '#ffffff');
    });
  }

  updateSoundButton(anyEnabled) {
    const soundBtn = this.buttons.find(b => b.name === 'SOUND');
    if (!soundBtn) return;
    soundBtn.bg.clear();
    const color = anyEnabled ? 0xee88ff : BTN_COLORS[5];
    soundBtn.bg.fillStyle(color, 1);
    soundBtn.bg.fillRoundedRect(
      soundBtn.bx, soundBtn.by, soundBtn.btnW, soundBtn.bh, 3
    );
    soundBtn.label.setColor(anyEnabled ? '#1a0040' : '#ffffff');
  }
}
