import { SAND_H, TINE_COUNT, TINE_SPACING, GROOVE_COLOR, RIDGE_COLOR } from '../constants.js';

export class RakeTool {
  constructor(sandCanvas, gardenMask, audioManager) {
    this.sandCanvas = sandCanvas;
    this.gardenMask = gardenMask;
    this.audio = audioManager;
    this.dragging = false;
    this.lastPointer = null;
    this.lastTime = 0;
  }

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    this.dragging = true;
    this.lastPointer = { x: pointer.x, y: pointer.y };
    this.lastTime = performance.now();
    this.audio.startRake();
  }

  onMove(pointer) {
    if (!this.dragging) return;
    if (pointer.y >= SAND_H) return;

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    const dx = pointer.x - this.lastPointer.x;
    const dy = pointer.y - this.lastPointer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= 1) {
      const speed = dt > 0 ? dist / dt : 0;
      const angle = Math.atan2(dy, dx);
      this.audio.updateRake(speed, angle);
    }

    this.rakeStroke(this.lastPointer, { x: pointer.x, y: pointer.y });
    this.lastPointer = { x: pointer.x, y: pointer.y };
    this.lastTime = now;
  }

  onUp() {
    this.dragging = false;
    this.lastPointer = null;
    this.lastTime = 0;
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
