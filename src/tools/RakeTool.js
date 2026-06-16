import { SAND_H, TINE_COUNT, TINE_SPACING } from '../constants.js';

export class RakeTool {
  constructor(sandCanvas, gardenMask, audioManager) {
    this.sandCanvas = sandCanvas;
    this.gardenMask = gardenMask;
    this.audio = audioManager;
    this.dragging = false;
    this.lastPointer = null;
  }

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    this.dragging = true;
    this.lastPointer = { x: pointer.x, y: pointer.y };
    this.audio.startRake();
  }

  onMove(pointer) {
    if (!this.dragging) return;
    if (pointer.y >= SAND_H) return;
    this.rakeStroke(this.lastPointer, { x: pointer.x, y: pointer.y });
    this.lastPointer = { x: pointer.x, y: pointer.y };
  }

  onUp() {
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

        this.sandCanvas.setGroove(tx, ty);
        const rx1 = Math.floor(tx + px);
        const ry1 = Math.floor(ty + py);
        const rx2 = Math.floor(tx - px);
        const ry2 = Math.floor(ty - py);
        if (this.gardenMask.isInGarden(rx1, ry1)) this.sandCanvas.setRidge(rx1, ry1);
        if (this.gardenMask.isInGarden(rx2, ry2)) this.sandCanvas.setRidge(rx2, ry2);
      }
    }
    this.sandCanvas.dirty = true;
  }
}
