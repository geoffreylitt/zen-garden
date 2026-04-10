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

  // Draw rainbow border: cycle hue along the perimeter
  for (let i = 0; i < points.length; i++) {
    const hue = i / points.length;
    const next = (i + 1) % points.length;
    // Convert hue to hex color
    const h = hue * 6;
    const sector = Math.floor(h);
    const f = h - sector;
    const q = Math.round((1 - f) * 255);
    const t = Math.round(f * 255);
    let r, g, b;
    switch (sector % 6) {
      case 0: r = 255; g = t;   b = 0;   break;
      case 1: r = q;   g = 255; b = 0;   break;
      case 2: r = 0;   g = 255; b = t;   break;
      case 3: r = 0;   g = q;   b = 255; break;
      case 4: r = t;   g = 0;   b = 255; break;
      case 5: r = 255; g = 0;   b = q;   break;
    }
    const color = (r << 16) | (g << 8) | b;
    gfx.lineStyle(5, color, 1);
    gfx.beginPath();
    gfx.moveTo(points[i].x, points[i].y);
    gfx.lineTo(points[next].x, points[next].y);
    gfx.strokePath();
  }

  // Rainbow sparkle dots around the border
  for (let i = 0; i < points.length; i++) {
    if (Math.random() < 0.4) {
      const p = points[i];
      const ox = (Math.random() - 0.5) * 6;
      const oy = (Math.random() - 0.5) * 6;
      // Random vivid hue
      const hue = Math.random() * 6;
      const sector = Math.floor(hue);
      const f = hue - sector;
      const t = Math.round(f * 255);
      const q = Math.round((1 - f) * 255);
      let r, g, b;
      switch (sector % 6) {
        case 0: r = 255; g = t;   b = 0;   break;
        case 1: r = q;   g = 255; b = 0;   break;
        case 2: r = 0;   g = 255; b = t;   break;
        case 3: r = 0;   g = q;   b = 255; break;
        case 4: r = t;   g = 0;   b = 255; break;
        case 5: r = 255; g = 0;   b = q;   break;
      }
      const color = (r << 16) | (g << 8) | b;
      gfx.fillStyle(color, 0.9);
      gfx.fillCircle(p.x + ox, p.y + oy, 1 + Math.random() * 2);
    }
  }
}
