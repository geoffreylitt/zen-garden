import { SAND_H } from '../constants.js';

const BRUSHES = [
  { label: 'MOSS-S', radius: 8 },
  { label: 'MOSS-M', radius: 16 },
  { label: 'MOSS-L', radius: 28 },
];

export class MossTool {
  constructor(mossCanvas, gardenMask) {
    this.mossCanvas = mossCanvas;
    this.gardenMask = gardenMask;
    this.brushIndex = 1; // default: Medium
    this.active = false;
    this.erasing = false;
  }

  get radius() { return BRUSHES[this.brushIndex].radius; }
  get label()  { return BRUSHES[this.brushIndex].label;  }

  // Called by GardenScene when the MOSS toolbar button is clicked while already active.
  cycleBrush() {
    this.brushIndex = (this.brushIndex + 1) % BRUSHES.length;
  }

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    this.active = true;
    this.erasing = pointer.rightButtonDown();
    this.apply(pointer.x, pointer.y);
  }

  onMove(pointer) {
    if (!this.active) return;
    if (pointer.y >= SAND_H) return;
    this.apply(pointer.x, pointer.y);
  }

  onUp() {
    this.active = false;
    this.erasing = false;
  }

  apply(x, y) {
    if (this.erasing) {
      this.mossCanvas.erase(x, y, this.radius);
    } else {
      this.mossCanvas.paint(x, y, this.radius);
    }
  }
}
