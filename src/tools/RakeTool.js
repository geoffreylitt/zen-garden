import {
  SAND_H, TINE_COUNT, TINE_SPACING, GROOVE_RADIUS,
  GROOVE_COLOR, GROOVE_DEEP, RIDGE_COLOR, RIDGE_BRIGHT,
} from '../constants.js';

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
    if (dist < 0.5) return;

    const steps = Math.ceil(dist * 2);
    const nx = dx / dist;
    const ny = dy / dist;
    const px = -ny;
    const py = nx;

    const halfWidth = ((TINE_COUNT - 1) * TINE_SPACING) / 2;
    const gr = GROOVE_RADIUS;
    const ridgeInner = gr + 0.5;
    const ridgeOuter = gr + 2.0;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = from.x + dx * t;
      const cy = from.y + dy * t;

      for (let tine = 0; tine < TINE_COUNT; tine++) {
        const offset = -halfWidth + tine * TINE_SPACING;
        const tcx = cx + px * offset;
        const tcy = cy + py * offset;

        const scanR = Math.ceil(ridgeOuter) + 1;

        for (let oy = -scanR; oy <= scanR; oy++) {
          for (let ox = -scanR; ox <= scanR; ox++) {
            const sx = Math.floor(tcx) + ox;
            const sy = Math.floor(tcy) + oy;
            if (!this.gardenMask.isInGarden(sx, sy)) continue;

            const ddx = sx - tcx;
            const ddy = sy - tcy;
            const d = Math.sqrt(ddx * ddx + ddy * ddy);

            if (d <= gr) {
              const depthFactor = 1 - d / (gr + 0.001);
              const alpha = Math.min(1, depthFactor * 1.2 + 0.3);
              const deep = depthFactor > 0.6 ? (depthFactor - 0.6) * 2.5 : 0;
              const gc = [
                GROOVE_COLOR[0] + (GROOVE_DEEP[0] - GROOVE_COLOR[0]) * deep,
                GROOVE_COLOR[1] + (GROOVE_DEEP[1] - GROOVE_COLOR[1]) * deep,
                GROOVE_COLOR[2] + (GROOVE_DEEP[2] - GROOVE_COLOR[2]) * deep,
              ];
              this.sandCanvas.blendPixel(sx, sy, gc, alpha);
            } else if (d <= ridgeOuter) {
              const ridgeT = (d - ridgeInner) / (ridgeOuter - ridgeInner);
              if (ridgeT < 0) {
                this.sandCanvas.blendPixel(sx, sy, RIDGE_BRIGHT, 0.7);
              } else {
                const alpha = (1 - ridgeT) * 0.5;
                if (alpha > 0.05) {
                  this.sandCanvas.blendPixel(sx, sy, RIDGE_COLOR, alpha);
                }
              }
            }
          }
        }
      }
    }
    this.sandCanvas.dirty = true;
  }
}
