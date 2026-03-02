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
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / (w / 2);
      const dy = (py - cy) / (h / 2);
      const dist = dx * dx + dy * dy;
      const noise = Math.sin(px * 3) * 0.15 + Math.cos(py * 4) * 0.1;
      if (dist + noise <= 0.9) {
        const i = (py * w + px) * 4;
        const green = 0x50 + Math.floor(Math.random() * 0x40);
        const dark = py > cy ? 0.7 : 1.0;
        d[i] = Math.floor(0x20 * dark);
        d[i + 1] = Math.floor(green * dark);
        d[i + 2] = Math.floor(0x15 * dark);
        d[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
