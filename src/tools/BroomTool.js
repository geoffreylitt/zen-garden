import { W, SAND_H, SAND_BASE, BROOM_RADIUS, BROOM_BLEND } from '../constants.js';

export class BroomTool {
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
    this.audio.startBroom();
  }

  onMove(pointer) {
    if (!this.dragging) return;
    if (pointer.y >= SAND_H) return;
    this.brushStroke(this.lastPointer, { x: pointer.x, y: pointer.y });
    this.lastPointer = { x: pointer.x, y: pointer.y };
  }

  onUp() {
    this.dragging = false;
    this.lastPointer = null;
    this.audio.stopBroom();
  }

  brushStroke(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const steps = Math.ceil(dist);
    const nx = dx / dist;
    const ny = dy / dist;
    const r = BROOM_RADIUS;
    const rSq = r * r;

    for (let s = 0; s <= steps; s++) {
      const cx = Math.floor(from.x + nx * s);
      const cy = Math.floor(from.y + ny * s);

      for (let oy = -r; oy <= r; oy++) {
        for (let ox = -r; ox <= r; ox++) {
          if (ox * ox + oy * oy > rSq) continue;
          const px = cx + ox;
          const py = cy + oy;
          if (px < 0 || px >= W || py < 0 || py >= SAND_H) continue;
          if (!this.gardenMask.isInGarden(px, py)) continue;

          const distFromCenter = Math.sqrt(ox * ox + oy * oy);
          const falloff = 1 - distFromCenter / r;
          const blend = BROOM_BLEND * falloff;

          const i = (py * W + px) * 4;
          const noise = (Math.random() - 0.5) * 6;
          this.sandCanvas.pixels[i] += (SAND_BASE[0] + noise - this.sandCanvas.pixels[i]) * blend;
          this.sandCanvas.pixels[i + 1] += (SAND_BASE[1] + noise - this.sandCanvas.pixels[i + 1]) * blend;
          this.sandCanvas.pixels[i + 2] += (SAND_BASE[2] + noise - this.sandCanvas.pixels[i + 2]) * blend;
        }
      }
    }
    this.sandCanvas.dirty = true;
  }
}
