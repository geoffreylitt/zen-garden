import { hslToRgb } from '../../rainbow.js';

export function createShrubTexture(scene) {
  const id = 'shrub_' + Date.now() + '_' + Math.random();
  const w = 12;
  const h = 11;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  // Each shrub gets a random vibrant non-green hue for maximum garishness
  const baseHue = Math.random() * 360;

  const cx = w / 2;
  const cy = h / 2;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / (w / 2);
      const dy = (py - cy) / (h / 2);
      const dist = dx * dx + dy * dy;
      const noise = Math.sin(px * 3) * 0.15 + Math.cos(py * 4) * 0.1;
      if (dist + noise <= 0.9) {
        const i = (py * w + px) * 4;
        const lightness = (py > cy ? 0.35 : 0.55) + (Math.random() - 0.5) * 0.1;
        const hue = (baseHue + (Math.random() - 0.5) * 40 + 360) % 360;
        const [r, g, b] = hslToRgb(hue, 1.0, lightness);
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
