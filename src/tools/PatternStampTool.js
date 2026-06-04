import { W, SAND_H, TINE_COUNT, TINE_SPACING, GROOVE_COLOR, RIDGE_COLOR } from '../constants.js';

const STRIDE = TINE_COUNT * TINE_SPACING; // pixels between rake passes

export class PatternStampTool {
  constructor(sandCanvas, gardenMask) {
    this.sandCanvas = sandCanvas;
    this.gardenMask = gardenMask;
  }

  applyPattern(name) {
    switch (name) {
      case 'LINES':   this._applyLines();   break;
      case 'CIRCLES': this._applyCircles(); break;
      case 'WAVES':   this._applyWaves();   break;
    }
    this.sandCanvas.dirty = true;
  }

  // ── internal: draw a single raked stroke (same logic as RakeTool, no audio) ──

  _rakeStroke(from, to) {
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
  }

  // ── Pattern: horizontal parallel lines ──────────────────────────────────────

  _applyLines() {
    for (let y = STRIDE / 2; y < SAND_H; y += STRIDE) {
      this._rakeStroke({ x: 0, y }, { x: W - 1, y });
    }
  }

  // ── Pattern: concentric circles ─────────────────────────────────────────────

  _applyCircles() {
    const cx = W / 2;
    const cy = SAND_H / 2;
    // Largest radius needed to reach the canvas corners
    const maxR = Math.sqrt(cx * cx + cy * cy);

    for (let r = STRIDE / 2; r <= maxR; r += STRIDE) {
      const circumference = 2 * Math.PI * r;
      // Choose step count so each arc segment ≈ 1 px long
      // Use floor so each arc segment is ≥ 1 px (ceil makes them all < 1, which
      // trips the early-exit guard inside _rakeStroke and draws nothing).
      const steps = Math.max(8, Math.floor(circumference));

      for (let i = 0; i < steps; i++) {
        const a1 = (i / steps) * Math.PI * 2;
        const a2 = ((i + 1) / steps) * Math.PI * 2;
        this._rakeStroke(
          { x: cx + Math.cos(a1) * r, y: cy + Math.sin(a1) * r },
          { x: cx + Math.cos(a2) * r, y: cy + Math.sin(a2) * r }
        );
      }
    }
  }

  // ── Pattern: sinusoidal waves ────────────────────────────────────────────────

  _applyWaves() {
    const amplitude = 14;            // peak-to-trough half-height
    const waveLen   = W / 3;         // three full waves across the canvas
    const segStep   = 2;             // x pixels per segment (smooth curve)

    for (let baseY = STRIDE / 2; baseY < SAND_H; baseY += STRIDE) {
      for (let x = 0; x < W - segStep; x += segStep) {
        const y1 = baseY + amplitude * Math.sin((2 * Math.PI / waveLen) * x);
        const y2 = baseY + amplitude * Math.sin((2 * Math.PI / waveLen) * (x + segStep));
        this._rakeStroke({ x, y: y1 }, { x: x + segStep, y: y2 });
      }
    }
  }
}
