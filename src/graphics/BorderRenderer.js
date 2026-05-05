import { W, SAND_H, DISCO_COLORS } from '../constants.js';

export function drawBorder(scene) {
  const gfx = scene.add.graphics();

  const cx = W / 2;
  const cy = SAND_H / 2;
  const rx = W * 0.42;
  const ry = SAND_H * 0.42;
  const points = [];
  const steps = 200;

  for (let s = 0; s < steps; s++) {
    const angle = (s / steps) * Math.PI * 2;
    const noise =
      Math.sin(angle * 3) * 0.06 +
      Math.sin(angle * 5 + 1) * 0.04 +
      Math.sin(angle * 7 + 2) * 0.03 +
      Math.sin(angle * 11 + 3) * 0.02;
    const r = 1 + noise;
    points.push({
      x: cx + rx * r * Math.cos(angle),
      y: cy + ry * r * Math.sin(angle),
    });
  }

  // Draw neon border segments cycling through disco colors
  const segLen = Math.floor(steps / DISCO_COLORS.length);
  for (let c = 0; c < DISCO_COLORS.length; c++) {
    const start = c * segLen;
    const end = (c === DISCO_COLORS.length - 1) ? steps : (c + 1) * segLen;
    gfx.lineStyle(4, DISCO_COLORS[c], 0.9);
    gfx.beginPath();
    gfx.moveTo(points[start].x, points[start].y);
    for (let i = start + 1; i < end; i++) {
      gfx.lineTo(points[i].x, points[i].y);
    }
    gfx.strokePath();
  }

  // Outer glow ring
  gfx.lineStyle(2, 0xffffff, 0.2);
  gfx.beginPath();
  gfx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    gfx.lineTo(points[i].x, points[i].y);
  }
  gfx.closePath();
  gfx.strokePath();

  // Neon studs along border
  for (let i = 0; i < points.length; i += 5) {
    if (Math.random() < 0.6) {
      const p = points[i];
      const color = DISCO_COLORS[Math.floor(Math.random() * DISCO_COLORS.length)];
      gfx.fillStyle(color, 0.9);
      gfx.fillCircle(p.x, p.y, 1.5 + Math.random() * 1.5);
    }
  }

  return gfx;
}
