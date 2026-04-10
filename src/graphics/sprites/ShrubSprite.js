// Neon rainbow shrubs — each shrub picks a wild random hue
export function createShrubTexture(scene) {
  const id = 'shrub_' + Date.now() + '_' + Math.random();
  const w = 12;
  const h = 11;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const cx = w / 2;
  const cy = h / 2;
  // Pick a random vivid base hue (avoid greens — those are boring now!)
  const baseHue = Math.random();

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / (w / 2);
      const dy = (py - cy) / (h / 2);
      const dist = dx * dx + dy * dy;
      const noise = Math.sin(px * 3) * 0.15 + Math.cos(py * 4) * 0.1;
      if (dist + noise <= 0.9) {
        const i = (py * w + px) * 4;
        // Hue shifts slightly by pixel for a multi-color leafy look
        const hue = (baseHue + px * 0.05 + py * 0.03) % 1.0;
        const sat = 0.85 + Math.random() * 0.15;
        const valShade = py > cy ? 0.6 : 0.95;
        const val = valShade + (Math.random() - 0.5) * 0.1;

        const [r, g, b] = hsvToRgb(hue, sat, Math.max(0, Math.min(val, 1)));
        d[i]     = r;
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

function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
