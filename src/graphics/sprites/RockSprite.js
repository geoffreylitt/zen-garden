import { hslToRgb } from '../../rainbow.js';

export function createRockTexture(scene) {
  const id = 'rock_' + Date.now() + '_' + Math.random();
  const w = 14;
  const h = 11;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  // Each rock gets a random vibrant hue
  const baseHue = Math.random() * 360;

  const cx = w / 2;
  const cy = h / 2;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / (w / 2);
      const dy = (py - cy) / (h / 2);
      const dist = dx * dx + dy * dy;
      if (dist <= 1.0) {
        const i = (py * w + px) * 4;
        const lightness = 0.40 + (1 - dist) * 0.30 + (Math.random() - 0.5) * 0.08;
        const hue = (baseHue + (Math.random() - 0.5) * 30 + 360) % 360;
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
