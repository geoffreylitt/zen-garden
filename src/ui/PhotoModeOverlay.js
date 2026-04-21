import { W, SAND_H, TOOLBAR_H } from '../constants.js';

const GUIDE_MODES = ['THIRDS', 'DIAGONAL', 'NONE'];

export class PhotoModeOverlay {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.guideIndex = 0;
    this.onClose = null;

    this.guideGraphics = null;
    this.barGraphics = null;
    this.buttons = [];
  }

  create() {
    this.guideGraphics = this.scene.add.graphics().setDepth(50).setVisible(false);
    this._buildBar();
    this._setBarVisible(false);
  }

  _buildBar() {
    const y = SAND_H;

    this.barGraphics = this.scene.add.graphics().setDepth(60);
    this.barGraphics.fillStyle(0x1e140f, 1);
    this.barGraphics.fillRect(0, y, W, TOOLBAR_H);
    this.barGraphics.lineStyle(1, 0x3d2e1f, 0.3);
    for (let ly = y + 5; ly < y + TOOLBAR_H; ly += 6) {
      this.barGraphics.beginPath();
      this.barGraphics.moveTo(0, ly);
      this.barGraphics.lineTo(W, ly);
      this.barGraphics.strokePath();
    }

    const btnDefs = [
      { label: 'THIRDS', id: 'guides' },
      { label: 'EXPORT', id: 'export' },
      { label: 'EXIT PHOTO', id: 'exit' },
    ];

    const btnW = 80;
    const gap = (W - btnDefs.length * btnW) / (btnDefs.length + 1);

    btnDefs.forEach((def, idx) => {
      const bx = gap + idx * (btnW + gap);
      const by = y + 4;
      const bh = TOOLBAR_H - 8;

      const bg = this.scene.add.graphics().setDepth(61);
      const color = def.id === 'export' ? 0x4a6040 : 0x3d2e1f;
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(bx, by, btnW, bh, 3);

      const text = this.scene.add
        .text(bx + btnW / 2, by + bh / 2, def.label, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: def.id === 'export' ? '#c8e8a8' : '#c8b898',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0.5)
        .setDepth(62);

      const zone = this.scene.add
        .zone(bx + btnW / 2, by + bh / 2, btnW, bh)
        .setInteractive({ useHandCursor: true })
        .setDepth(63);

      zone.on('pointerdown', () => this._handleButton(def.id));

      this.buttons.push({ bg, text, zone, id: def.id, bx, by, btnW, bh, color });
    });
  }

  _handleButton(id) {
    if (id === 'guides') this._cycleGuides();
    else if (id === 'export') this._exportPostcard();
    else if (id === 'exit') this.close();
  }

  _setBarVisible(visible) {
    this.barGraphics.setVisible(visible);
    this.buttons.forEach((btn) => {
      btn.bg.setVisible(visible);
      btn.text.setVisible(visible);
      btn.zone.setActive(visible).setVisible(visible);
    });
  }

  open(onClose) {
    this.isOpen = true;
    this.onClose = onClose;
    this.guideIndex = 0;
    const guidesBtn = this.buttons.find((b) => b.id === 'guides');
    if (guidesBtn) guidesBtn.text.setText(GUIDE_MODES[0]);
    this._setBarVisible(true);
    this.guideGraphics.setVisible(true);
    this._drawGuides();
  }

  close() {
    this.isOpen = false;
    this._setBarVisible(false);
    this.guideGraphics.setVisible(false);
    this.guideGraphics.clear();
    if (this.onClose) this.onClose();
  }

  _cycleGuides() {
    this.guideIndex = (this.guideIndex + 1) % GUIDE_MODES.length;
    const guidesBtn = this.buttons.find((b) => b.id === 'guides');
    if (guidesBtn) guidesBtn.text.setText(GUIDE_MODES[this.guideIndex]);
    this._drawGuides();
  }

  _drawGuides() {
    this.guideGraphics.clear();
    const mode = GUIDE_MODES[this.guideIndex];
    if (mode === 'NONE') return;
    if (mode === 'THIRDS') this._drawThirds();
    else if (mode === 'DIAGONAL') this._drawDiagonals();
  }

  _drawThirds() {
    const g = this.guideGraphics;
    const x1 = Math.round(W / 3);
    const x2 = Math.round((W * 2) / 3);
    const y1 = Math.round(SAND_H / 3);
    const y2 = Math.round((SAND_H * 2) / 3);

    g.lineStyle(1, 0xffffff, 0.28);
    g.beginPath(); g.moveTo(x1, 0); g.lineTo(x1, SAND_H); g.strokePath();
    g.beginPath(); g.moveTo(x2, 0); g.lineTo(x2, SAND_H); g.strokePath();
    g.beginPath(); g.moveTo(0, y1); g.lineTo(W, y1); g.strokePath();
    g.beginPath(); g.moveTo(0, y2); g.lineTo(W, y2); g.strokePath();

    // Crosshair ticks at power points
    g.lineStyle(1, 0xffffff, 0.65);
    [[x1, y1], [x2, y1], [x1, y2], [x2, y2]].forEach(([x, y]) => {
      g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.strokePath();
      g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x, y + 5); g.strokePath();
    });
  }

  _drawDiagonals() {
    const g = this.guideGraphics;
    g.lineStyle(1, 0xffffff, 0.28);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W, SAND_H); g.strokePath();
    g.beginPath(); g.moveTo(W, 0); g.lineTo(0, SAND_H); g.strokePath();
    g.lineStyle(1, 0xffffff, 0.18);
    g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, SAND_H); g.strokePath();
    g.beginPath(); g.moveTo(0, SAND_H / 2); g.lineTo(W, SAND_H / 2); g.strokePath();
  }

  _exportPostcard() {
    // Hide guides so they don't appear in the export
    this.guideGraphics.setVisible(false);

    // Wait one frame for Phaser to render without guide lines
    this.scene.time.delayedCall(60, () => {
      const phaserCanvas = this.scene.sys.game.canvas;
      const BORDER = 20;
      const LABEL_H = 38;

      const pc = document.createElement('canvas');
      pc.width = W + BORDER * 2;
      pc.height = SAND_H + BORDER * 2 + LABEL_H;
      const ctx = pc.getContext('2d');

      // Postcard background
      ctx.fillStyle = '#f5edd8';
      ctx.fillRect(0, 0, pc.width, pc.height);

      // Outer decorative border lines
      ctx.strokeStyle = '#8b6a4a';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, pc.width - 8, pc.height - 8);
      ctx.strokeStyle = '#c8a870';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, pc.width - 16, pc.height - 16);

      // Garden image — crop to garden area only (exclude toolbar)
      ctx.drawImage(phaserCanvas, 0, 0, W, SAND_H, BORDER, BORDER, W, SAND_H);

      // Thin inset frame around garden
      ctx.strokeStyle = '#8b6a4a';
      ctx.lineWidth = 1;
      ctx.strokeRect(BORDER, BORDER, W, SAND_H);

      // Label strip
      const labelY = BORDER + SAND_H + 6;
      ctx.fillStyle = '#5c3d1e';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('\u2736 ZEN GARDEN \u2736', pc.width / 2, labelY + 14);
      ctx.font = '9px monospace';
      ctx.fillStyle = '#8b6a4a';
      const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      ctx.fillText(date, pc.width / 2, labelY + 28);

      // Trigger download
      const link = document.createElement('a');
      link.download = `zen-garden-${Date.now()}.png`;
      link.href = pc.toDataURL('image/png');
      link.click();

      // Restore guide lines
      if (this.isOpen) this.guideGraphics.setVisible(true);
    });
  }
}
