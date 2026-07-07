import { W, SAND_H, TOOLBAR_H } from '../constants.js';

const TOOL_NAMES = ['RAKE', 'ROCK', 'SHRUB', 'TEAHOUSE', 'STREAM', 'SHISHI', 'BASIN', 'CLEAR', 'SOUND'];

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
    gfx.fillStyle(0x4a3728, 1);
    gfx.fillRect(0, y, W, TOOLBAR_H);
    gfx.lineStyle(1, 0x3d2e1f, 0.3);
    for (let ly = y + 5; ly < y + TOOLBAR_H; ly += 6) {
      gfx.beginPath();
      gfx.moveTo(0, ly);
      gfx.lineTo(W, ly);
      gfx.strokePath();
    }

    const btnW = Math.min(70, Math.floor((W - (TOOL_NAMES.length + 1) * 3) / TOOL_NAMES.length));
    const gap = (W - TOOL_NAMES.length * btnW) / (TOOL_NAMES.length + 1);

    TOOL_NAMES.forEach((name, idx) => {
      const bx = gap + idx * (btnW + gap);
      const by = y + 4;
      const bh = TOOLBAR_H - 8;

      const bg = this.scene.add.graphics();
      const isActive = name === this.activeTool;
      this.drawButton(bg, bx, by, btnW, bh, isActive);

      const label = this.scene.add.text(bx + btnW / 2, by + bh / 2, name, {
        fontFamily: 'monospace',
        fontSize: TOOL_NAMES.length > 6 ? '7px' : '10px',
        color: isActive ? '#4a3728' : '#c8b898',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5, 0.5);

      const hitZone = this.scene.add.zone(bx + btnW / 2, by + bh / 2, btnW, bh)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => this.onSelectTool(name));

      this.buttons.push({ name, bg, label, bx, by, btnW, bh, hitZone });
    });
  }

  drawButton(gfx, x, y, w, h, active) {
    gfx.clear();
    gfx.fillStyle(active ? 0xe8dcbc : 0x5c4433, 1);
    gfx.fillRoundedRect(x, y, w, h, 3);
  }

  setActiveTool(name) {
    this.activeTool = name;
    this.buttons.forEach((btn) => {
      if (btn.name === 'SOUND') return;
      const isActive = btn.name === this.activeTool;
      this.drawButton(btn.bg, btn.bx, btn.by, btn.btnW, btn.bh, isActive);
      btn.label.setColor(isActive ? '#4a3728' : '#c8b898');
    });
  }

  updateSoundButton(anyEnabled) {
    const soundBtn = this.buttons.find(b => b.name === 'SOUND');
    if (!soundBtn) return;
    soundBtn.bg.clear();
    soundBtn.bg.fillStyle(anyEnabled ? 0x607860 : 0x5c4433, 1);
    soundBtn.bg.fillRoundedRect(
      soundBtn.bx, soundBtn.by, soundBtn.btnW, soundBtn.bh, 3
    );
    soundBtn.label.setColor(anyEnabled ? '#e8dcbc' : '#886655');
  }
}
