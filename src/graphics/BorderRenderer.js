import { W, SAND_H } from '../constants.js';

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

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

  // Draw border as a thick rainbow ring — one short segment per step
  for (let i = 0; i < points.length; i++) {
    const hue = (i / points.length) * 360;
    const [r, g, b] = hslToRgb(hue, 1.0, 0.62);
    const color = (r << 16) | (g << 8) | b;
    gfx.lineStyle(6, color, 1);
    const next = points[(i + 1) % points.length];
    gfx.beginPath();
    gfx.moveTo(points[i].x, points[i].y);
    gfx.lineTo(next.x, next.y);
    gfx.strokePath();
  }

  // Rainbow sparkle dots scattered around the border
  for (let i = 0; i < points.length; i++) {
    if (Math.random() < 0.4) {
      const p = points[i];
      const ox = (Math.random() - 0.5) * 8;
      const oy = (Math.random() - 0.5) * 8;
      const hue = (Math.random() * 360);
      const [r, g, b] = hslToRgb(hue, 1.0, 0.7);
      const color = (r << 16) | (g << 8) | b;
      gfx.fillStyle(color, 0.9);
      gfx.fillCircle(p.x + ox, p.y + oy, 1 + Math.random() * 1.5);
    }
  }
}
