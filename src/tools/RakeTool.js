import { SAND_H, TINE_COUNT, TINE_SPACING, GROOVE_COLOR, RIDGE_COLOR } from '../constants.js';

export class RakeTool {
  constructor(sandCanvas, gardenMask, audioManager, history) {
    this.sandCanvas = sandCanvas;
    this.gardenMask = gardenMask;
    this.audio = audioManager;
    this.history = history;
    this.dragging = false;
    this.lastPointer = null;
    this._pendingSnapshot = null;
    this._stroked = false;
  }

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    this.dragging = true;
    this.lastPointer = { x: pointer.x, y: pointer.y };
    this._pendingSnapshot = this.sandCanvas.snapshot();
    this._stroked = false;
    this.audio.startRake();
  }

  onMove(pointer) {
    if (!this.dragging) return;
    if (pointer.y >= SAND_H) return;
    this.rakeStroke(this.lastPointer, { x: pointer.x, y: pointer.y });
    this.lastPointer = { x: pointer.x, y: pointer.y };
    this._stroked = true;
  }

  onUp() {
    if (this._stroked && this._pendingSnapshot) {
      this.history.pushSand(this._pendingSnapshot);
    }
    this._pendingSnapshot = null;
    this._stroked = false;
    this.dragging = false;
    this.lastPointer = null;
    this.audio.stopRake();
  }

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

        if (!this.gardenMask.isInGarden(tx, ty)) continue;

        this.sandCanvas.setPixel(tx, ty, GROOVE_COLOR);
        const rx1 = Math.floor(tx + px);
        const ry1 = Math.floor(ty + py);
        const rx2 = Math.floor(tx - px);
        const ry2 = Math.floor(ty - py);
        if (this.gardenMask.isInGarden(rx1, ry1)) this.sandCanvas.setPixel(rx1, ry1, RIDGE_COLOR);
        if (this.gardenMask.isInGarden(rx2, ry2)) this.sandCanvas.setPixel(rx2, ry2, RIDGE_COLOR);
      }
    }
    this.sandCanvas.dirty = true;
  }
}
