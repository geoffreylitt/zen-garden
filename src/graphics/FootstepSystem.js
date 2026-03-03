import { SAND_H, FOOTSTEP_COLOR, FOOTSTEP_STRIDE } from '../constants.js';

const FOOT_SHAPE = [
  [0, -2], [1, -2],
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [0, 0], [1, 0],
  [0, 1], [1, 1],
  [0, 2],
];

export class FootstepSystem {
  constructor(sandCanvas, gardenMask) {
    this.sandCanvas = sandCanvas;
    this.gardenMask = gardenMask;
    this.lastPos = null;
    this.distAccum = 0;
    this.leftFoot = true;
  }

  onPointerMove(pointer) {
    if (pointer.isDown) {
      this.lastPos = null;
      this.distAccum = 0;
      return;
    }

    if (pointer.y >= SAND_H) {
      this.lastPos = null;
      return;
    }

    const x = Math.floor(pointer.x);
    const y = Math.floor(pointer.y);

    if (!this.gardenMask.isInGarden(x, y)) {
      this.lastPos = null;
      return;
    }

    if (!this.lastPos) {
      this.lastPos = { x, y };
      return;
    }

    const dx = x - this.lastPos.x;
    const dy = y - this.lastPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    this.distAccum += dist;
    const dirX = dx / dist;
    const dirY = dy / dist;

    if (this.distAccum >= FOOTSTEP_STRIDE) {
      this.distAccum -= FOOTSTEP_STRIDE;
      this.stampFoot(x, y, dirX, dirY, this.leftFoot);
      this.leftFoot = !this.leftFoot;
    }

    this.lastPos = { x, y };
  }

  stampFoot(cx, cy, dirX, dirY, isLeft) {
    const perpX = -dirY;
    const perpY = dirX;
    const lateralOffset = isLeft ? -3 : 3;
    const ox = cx + Math.round(perpX * lateralOffset);
    const oy = cy + Math.round(perpY * lateralOffset);

    const angle = Math.atan2(dirY, dirX);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    for (const [lx, ly] of FOOT_SHAPE) {
      const rx = Math.round(ox + lx * cos - ly * sin);
      const ry = Math.round(oy + lx * sin + ly * cos);
      if (this.gardenMask.isInGarden(rx, ry)) {
        this.sandCanvas.setPixel(rx, ry, FOOTSTEP_COLOR);
      }
    }
    this.sandCanvas.dirty = true;
  }
}
