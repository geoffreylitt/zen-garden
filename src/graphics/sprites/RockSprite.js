export function createRockTexture(scene) {
  const id = 'rock_' + Date.now() + '_' + Math.random();
  const w = 14;
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
      if (dist <= 1.0) {
        const i = (py * w + px) * 4;
        const shade = 0x70 + Math.floor((1 - dist) * 0x40) +
          Math.floor((Math.random() - 0.5) * 20);
        const warm = Math.floor(Math.random() * 10);
        d[i] = shade + warm;
        d[i + 1] = shade;
        d[i + 2] = shade - 5;
        d[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
