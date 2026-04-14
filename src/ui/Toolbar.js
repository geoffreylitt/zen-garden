import { W, SAND_H, TOOLBAR_H } from '../constants.js';
import { hslToRgb, rgbToHex } from '../rainbow.js';

const TOOL_NAMES = ['RAKE', 'ROCK', 'SHRUB', 'TEAHOUSE', 'CLEAR', 'SOUND'];

export class Toolbar {
  constructor(scene, onSelectTool) {
    this.scene = scene;
    this.onSelectTool = onSelectTool;
    this.activeTool = 'RAKE';
    this.buttons = [];
  }

  // Return a bright rainbow hex color for a button index
  _btnHue(idx) {
    return (idx / TOOL_NAMES.length) * 360;
  }

  create() {
    const y = SAND_H;
    const gfx = this.scene.add.graphics();

    // Rainbow gradient toolbar background — paint column by column
    for (let x = 0; x < W; x++) {
      const hue = (x / W) * 360;
      const [r, g, b] = hslToRgb(hue, 1.0, 0.18);
      gfx.fillStyle(rgbToHex(r, g, b), 1);
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

      const label = this.scene.add.text(bx + btnW / 2, by + bh / 2, name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: isActive ? '#000000' : '#ffffff',
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
    const hue = this._btnHue(idx);
    if (active) {
      // Bright saturated active color
      const [r, g, b] = hslToRgb(hue, 1.0, 0.60);
      gfx.fillStyle(rgbToHex(r, g, b), 1);
    } else {
      // Darker, still colorful
      const [r, g, b] = hslToRgb(hue, 0.85, 0.30);
      gfx.fillStyle(rgbToHex(r, g, b), 1);
    }
    gfx.fillRoundedRect(x, y, w, h, 3);
  }

  setActiveTool(name) {
    this.activeTool = name;
    this.buttons.forEach((btn) => {
      if (btn.name === 'SOUND') return;
      const isActive = btn.name === this.activeTool;
      this.drawButton(btn.bg, btn.bx, btn.by, btn.btnW, btn.bh, isActive, btn.idx);
      btn.label.setColor(isActive ? '#000000' : '#ffffff');
    });
  }

  updateSoundButton(anyEnabled) {
    const soundBtn = this.buttons.find(b => b.name === 'SOUND');
    if (!soundBtn) return;
    soundBtn.bg.clear();
    const hue = this._btnHue(soundBtn.idx);
    const [r, g, b] = hslToRgb(hue, 1.0, anyEnabled ? 0.60 : 0.30);
    soundBtn.bg.fillStyle(rgbToHex(r, g, b), 1);
    soundBtn.bg.fillRoundedRect(
      soundBtn.bx, soundBtn.by, soundBtn.btnW, soundBtn.bh, 3
    );
    soundBtn.label.setColor(anyEnabled ? '#000000' : '#ffffff');
  }
}
