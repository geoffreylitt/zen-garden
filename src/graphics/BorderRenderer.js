import { W, SAND_H } from '../constants.js';

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

  gfx.lineStyle(5, 0x888880, 1);
  gfx.beginPath();
  gfx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    gfx.lineTo(points[i].x, points[i].y);
  }
  gfx.closePath();
  gfx.strokePath();

  for (let i = 0; i < points.length; i++) {
    if (Math.random() < 0.4) {
      const p = points[i];
      const ox = (Math.random() - 0.5) * 6;
      const oy = (Math.random() - 0.5) * 6;
      const green = 0x40 + Math.floor(Math.random() * 0x30);
      const color = (0x20 << 16) | (green << 8) | 0x10;
      gfx.fillStyle(color, 0.8);
      gfx.fillCircle(p.x + ox, p.y + oy, 1 + Math.random() * 1.5);
    }
  }
}
