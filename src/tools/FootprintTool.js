import { SAND_H, W, GROOVE_COLOR } from '../constants.js';

// Right foot pixel offsets in local space:
//   local y- = toes (forward / travel direction)
//   local y+ = heel (backward)
//   local x- = inner / big-toe side
//   local x+ = outer / pinky side
const RIGHT_FOOT = [
  // Big toe (inner, -x)
  [-3, -4], [-3, -3], [-2, -4],
  // 2nd toe
  [-1, -4], [-1, -3],
  // 3rd toe (longest)
  [0, -4], [0, -3],
  // 4th toe
  [1, -3], [1, -2],
  // Pinky (outer, +x)
  [2, -2], [2, -1],
  // Ball of foot
  [-2, -1], [-1, -1], [0, -1], [1, -1],
  [-2, 0], [-1, 0], [0, 0], [1, 0],
  [-2, 1], [-1, 1], [0, 1],
  // Arch (narrow, inner side)
  [-1, 2], [-1, 3], [0, 2],
  // Heel
  [-1, 4], [0, 4], [1, 4],
  [-1, 5], [0, 5], [1, 5],
  [0, 6],
];

// Left foot is the mirror of the right foot (negate x so big toe is at +x)
const LEFT_FOOT = RIGHT_FOOT.map(([dx, dy]) => [-dx, dy]);

const FOOTPRINT_SPACING = 22; // pixels between successive individual foot placements
const FOOT_SIDE_OFFSET = 7;   // pixels each foot is offset from the path centre

export class FootprintTool {
  constructor(sandCanvas, gardenMask) {
    this.sandCanvas = sandCanvas;
    this.gardenMask = gardenMask;
    this.dragging = false;
    this.lastPointer = null;
    this.accumulated = 0;
    this.stepCount = 0;
  }

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    this.dragging = true;
    this.lastPointer = { x: pointer.x, y: pointer.y };
    // Start nearly at threshold so the first short drag immediately stamps
    this.accumulated = FOOTPRINT_SPACING - 4;
    this.stepCount = 0;
  }

  onMove(pointer) {
    if (!this.dragging) return;
    if (pointer.y >= SAND_H) return;

    const dx = pointer.x - this.lastPointer.x;
    const dy = pointer.y - this.lastPointer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const nx = dx / dist;
    const ny = dy / dist;

    this.accumulated += dist;

    while (this.accumulated >= FOOTPRINT_SPACING) {
      this.accumulated -= FOOTPRINT_SPACING;
      this.stampStep(pointer.x, pointer.y, nx, ny);
    }

    this.lastPointer = { x: pointer.x, y: pointer.y };
  }

  onUp() {
    this.dragging = false;
    this.lastPointer = null;
  }

  stampStep(cx, cy, nx, ny) {
    // Body-left of travel direction (CW rotation): (+ny, -nx)
    // Body-right of travel direction (CCW rotation): (-ny, +nx)
    if (this.stepCount % 2 === 0) {
      // Left foot: offset to body-left = (ny, -nx)
      const lx = cx + ny * FOOT_SIDE_OFFSET;
      const ly = cy - nx * FOOT_SIDE_OFFSET;
      this.stampFoot(lx, ly, LEFT_FOOT, nx, ny);
    } else {
      // Right foot: offset to body-right = (-ny, nx)
      const rx = cx - ny * FOOT_SIDE_OFFSET;
      const ry = cy + nx * FOOT_SIDE_OFFSET;
      this.stampFoot(rx, ry, RIGHT_FOOT, nx, ny);
    }

    this.stepCount++;
    this.sandCanvas.dirty = true;
  }

  // Rotate local (dx, dy) into world coords and paint, where:
  //   local -y → travel direction (toes forward)
  //   local +x → body-right / CCW perpendicular
  // Verified rotation: world = [-ny*dx - nx*dy,  nx*dx - ny*dy]
  stampFoot(cx, cy, shape, nx, ny) {
    for (const [dx, dy] of shape) {
      const wx = Math.round(cx + (-ny * dx - nx * dy));
      const wy = Math.round(cy + (nx * dx - ny * dy));

      if (!this.gardenMask.isInGarden(wx, wy)) continue;
      this.sandCanvas.setPixel(wx, wy, GROOVE_COLOR);
    }
  }
}
