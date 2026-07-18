import { SAND_H, W } from '../constants.js';
import {
  createPebbleTexture,
  createMossTexture,
  createLeafTexture,
} from '../graphics/sprites/ScatterSprite.js';

const MOTIFS = ['PEBBLES', 'MOSS', 'LEAVES'];
// Minimum squared distance between scatter events while dragging
const MIN_DIST_SQ = 14 * 14;
// How many motif items to sprinkle per scatter event
const COUNT_MIN = 2;
const COUNT_MAX = 4;
// Spray radius around the pointer
const SPRAY_R = 10;

// Depths — submenu sits above scatter sprites which sit above the sand
const DEPTH_SPRITE  = 2;
const DEPTH_SUBMENU = 8;

export class ScatterTool {
  constructor(scene, gardenMask, audio) {
    this.scene      = scene;
    this.gardenMask = gardenMask;
    this.audio      = audio;
    this.motif      = 'PEBBLES';
    this.isDown     = false;
    this.lastX      = null;
    this.lastY      = null;

    this._buildSubMenu();
  }

  // ── Sub-menu ────────────────────────────────────────────────────────────────

  _buildSubMenu() {
    const MOTIF_BTN_W = 62;
    const PANEL_H     = 20;
    const PANEL_W     = MOTIFS.length * MOTIF_BTN_W + 4;
    const PANEL_X     = Math.round((W - PANEL_W) / 2);
    const PANEL_Y     = SAND_H - PANEL_H - 2;

    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x2a1e14, 0.88);
    bg.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 3);
    bg.setDepth(DEPTH_SUBMENU);
    bg.setVisible(false);

    const buttons = MOTIFS.map((name, i) => {
      const bx = PANEL_X + 2 + i * MOTIF_BTN_W;
      const bw = MOTIF_BTN_W - 2;
      const bh = PANEL_H - 4;
      const by = PANEL_Y + 2;

      const gfx = this.scene.add.graphics();
      gfx.setDepth(DEPTH_SUBMENU);
      gfx.setVisible(false);

      const label = this.scene.add.text(bx + bw / 2, by + bh / 2, name, {
        fontFamily: 'monospace',
        fontSize:   '8px',
        fontStyle:  'bold',
        color:      '#c8b898',
      }).setOrigin(0.5, 0.5).setDepth(DEPTH_SUBMENU).setVisible(false);

      const hitZone = this.scene.add
        .zone(bx + bw / 2, by + bh / 2, bw, bh)
        .setInteractive({ useHandCursor: true })
        .setDepth(DEPTH_SUBMENU)
        .setVisible(false);

      hitZone.on('pointerdown', () => {
        this.motif = name;
        this._refreshButtons();
      });

      return { name, gfx, label, hitZone, bx, by, bw, bh };
    });

    this.subMenu = { bg, buttons, panelX: PANEL_X, panelY: PANEL_Y, panelW: PANEL_W, panelH: PANEL_H };
    this._refreshButtons();
  }

  _refreshButtons() {
    for (const btn of this.subMenu.buttons) {
      const active = btn.name === this.motif;
      btn.gfx.clear();
      btn.gfx.fillStyle(active ? 0xe8dcbc : 0x3d2d1e, 1);
      btn.gfx.fillRoundedRect(btn.bx, btn.by, btn.bw, btn.bh, 2);
      btn.label.setColor(active ? '#4a3728' : '#c8b898');
    }
  }

  showSubMenu() {
    this.subMenu.bg.setVisible(true);
    for (const btn of this.subMenu.buttons) {
      btn.gfx.setVisible(true);
      btn.label.setVisible(true);
      btn.hitZone.setVisible(true);
    }
  }

  hideSubMenu() {
    this.subMenu.bg.setVisible(false);
    for (const btn of this.subMenu.buttons) {
      btn.gfx.setVisible(false);
      btn.label.setVisible(false);
      btn.hitZone.setVisible(false);
    }
  }

  // ── Pointer events ───────────────────────────────────────────────────────────

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    if (this._isOverSubMenu(pointer.x, pointer.y)) return;
    this.isDown = true;
    this.lastX = pointer.x;
    this.lastY = pointer.y;
    this._scatter(pointer.x, pointer.y);
    this.audio.playPlace();
  }

  onMove(pointer) {
    if (!this.isDown || pointer.y >= SAND_H) return;
    if (this._isOverSubMenu(pointer.x, pointer.y)) return;
    const dx = pointer.x - this.lastX;
    const dy = pointer.y - this.lastY;
    if (dx * dx + dy * dy >= MIN_DIST_SQ) {
      this._scatter(pointer.x, pointer.y);
      this.lastX = pointer.x;
      this.lastY = pointer.y;
    }
  }

  onUp() {
    this.isDown = false;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  _isOverSubMenu(x, y) {
    const { panelX, panelY, panelW, panelH } = this.subMenu;
    return x >= panelX && x <= panelX + panelW && y >= panelY && y <= panelY + panelH;
  }

  _scatter(cx, cy) {
    const count = COUNT_MIN + Math.floor(Math.random() * (COUNT_MAX - COUNT_MIN + 1));
    for (let i = 0; i < count; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * SPRAY_R;
      const x = Math.round(cx + Math.cos(angle) * radius);
      const y = Math.round(cy + Math.sin(angle) * radius);

      if (y >= SAND_H || !this.gardenMask.isInGarden(x, y)) continue;

      let key;
      if (this.motif === 'PEBBLES')     key = createPebbleTexture(this.scene);
      else if (this.motif === 'MOSS')   key = createMossTexture(this.scene);
      else                               key = createLeafTexture(this.scene);

      const sprite = this.scene.add.image(x, y, key);
      sprite.setScale(0.9 + Math.random() * 0.7);   // natural size variation
      sprite.setAngle(Math.random() * 360);           // random rotation
      sprite.setAlpha(0.65 + Math.random() * 0.35);  // subtle depth variation
      sprite.setDepth(DEPTH_SPRITE);
    }
  }
}
