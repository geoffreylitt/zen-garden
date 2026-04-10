// Vivid gem-colored rocks — each rock picks a random rainbow hue
export function createRockTexture(scene) {
  const id = 'rock_' + Date.now() + '_' + Math.random();
  const w = 14;
  const h = 11;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  // Pick a random vivid hue for this rock
  const baseHue = Math.random();
  const cx = w / 2;
  const cy = h / 2;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / (w / 2);
      const dy = (py - cy) / (h / 2);
      const dist = dx * dx + dy * dy;
      if (dist <= 1.0) {
        const i = (py * w + px) * 4;
        // Shift hue slightly across the rock for a gem facet look
        const hue = (baseHue + dx * 0.08 + dy * 0.06 + 1) % 1.0;
        const sat = 0.75 + (1 - dist) * 0.2;
        const val = 0.55 + (1 - dist) * 0.45 + (Math.random() - 0.5) * 0.08;

        const [r, g, b] = hsvToRgb(hue, sat, Math.min(val, 1));
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
