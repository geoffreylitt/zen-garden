import { SAND_H, WATER_DEEP, WATER_SHALLOW, WATER_HIGHLIGHT } from '../constants.js';

const STREAM_HALF = 2; // half-width in pixels → 5px total stream

export class WaterTool {
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
  }

  onMove(pointer) {
    if (!this.dragging) return;
    if (pointer.y >= SAND_H) return;
    this._paintSegment(this.lastPointer, { x: pointer.x, y: pointer.y });
    this.lastPointer = { x: pointer.x, y: pointer.y };
  }

  onUp() {
    this.dragging = false;
    this.lastPointer = null;
  }

  _paintSegment(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const nx = dx / dist; // direction along stroke
    const ny = dy / dist;
    const px = -ny;       // perpendicular (across stream width)
    const py = nx;

    const steps = Math.ceil(dist);

    for (let s = 0; s <= steps; s++) {
      const cx = from.x + nx * s;
      const cy = from.y + ny * s;

      for (let t = -STREAM_HALF; t <= STREAM_HALF; t++) {
        const wx = Math.floor(cx + px * t);
        const wy = Math.floor(cy + py * t);

        if (!this.gardenMask.isInGarden(wx, wy)) continue;

        const abs = Math.abs(t);
        let color;
        if (abs === 0) {
          // Centre channel — deep water with slight shimmer
          const shimmer = Math.floor((Math.random() - 0.5) * 18);
          color = [
            WATER_DEEP[0] + shimmer,
            WATER_DEEP[1] + shimmer,
            WATER_DEEP[2] + shimmer,
          ];
        } else if (abs === 1) {
          // Mid band — medium blue
          const shimmer = Math.floor((Math.random() - 0.5) * 14);
          color = [
            WATER_SHALLOW[0] + shimmer,
            WATER_SHALLOW[1] + shimmer,
            WATER_SHALLOW[2] + shimmer,
          ];
        } else {
          // Edge — pale highlight (shallow ripple)
          const shimmer = Math.floor((Math.random() - 0.5) * 10);
          color = [
            WATER_HIGHLIGHT[0] + shimmer,
            WATER_HIGHLIGHT[1] + shimmer,
            WATER_HIGHLIGHT[2] + shimmer,
          ];
        }

        this.sandCanvas.setPixel(wx, wy, color);
      }
    }
    this.sandCanvas.dirty = true;
  }
}
