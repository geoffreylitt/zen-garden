import { W, SAND_H } from '../constants.js';
import { hslToRgb, rainbowHue, rgbToHex } from '../rainbow.js';

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

  // Draw rainbow border segment-by-segment
  for (let i = 0; i < points.length; i++) {
    const hue = (i / points.length) * 360;
    const [r, g, b] = hslToRgb(hue, 1.0, 0.55);
    const segColor = rgbToHex(r, g, b);
    const next = (i + 1) % points.length;
    gfx.lineStyle(6, segColor, 1);
    gfx.beginPath();
    gfx.moveTo(points[i].x, points[i].y);
    gfx.lineTo(points[next].x, points[next].y);
    gfx.strokePath();
  }

  // Bright rainbow gem dots around the border
  for (let i = 0; i < points.length; i++) {
    if (Math.random() < 0.45) {
      const p = points[i];
      const ox = (Math.random() - 0.5) * 7;
      const oy = (Math.random() - 0.5) * 7;
      const hue = (i / points.length) * 360;
      const [r, g, b] = hslToRgb((hue + 60) % 360, 1.0, 0.65);
      gfx.fillStyle(rgbToHex(r, g, b), 0.9);
      gfx.fillCircle(p.x + ox, p.y + oy, 1.5 + Math.random() * 2);
    }
  }
}
