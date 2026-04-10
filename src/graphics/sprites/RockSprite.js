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

export function createRockTexture(scene) {
  const id = 'rock_' + Date.now() + '_' + Math.random();
  const w = 14;
  const h = 11;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  // Each rock picks a random vivid hue
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
        const lightness = 0.45 + (1 - dist) * 0.3 + (Math.random() - 0.5) * 0.08;
        const hueJitter = (Math.random() - 0.5) * 25;
        const [r, g, b] = hslToRgb((baseHue + hueJitter + 360) % 360, 0.9, lightness);
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
