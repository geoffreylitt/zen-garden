export function createShrubTexture(scene) {
  const id = 'shrub_' + Date.now() + '_' + Math.random();
  const w = 9 + Math.floor(Math.random() * 8);
  const h = 8 + Math.floor(Math.random() * 7);
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const leafFreqX = 2 + Math.random() * 4;
  const leafFreqY = 2 + Math.random() * 4;
  const hueShift = Math.floor(Math.random() * 3);
  const greenBase = 0x40 + Math.floor(Math.random() * 0x30);

  const cx = w / 2;
  const cy = h / 2;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / (w / 2);
      const dy = (py - cy) / (h / 2);
      const dist = dx * dx + dy * dy;
      const noise = Math.sin(px * leafFreqX) * 0.15 + Math.cos(py * leafFreqY) * 0.1;
      if (dist + noise <= 0.9) {
        const i = (py * w + px) * 4;
        const green = greenBase + Math.floor(Math.random() * 0x40);
        const dark = py > cy ? 0.7 : 1.0;
        if (hueShift === 0) { d[i] = Math.floor(0x20*dark); d[i+1] = Math.floor(green*dark); d[i+2] = Math.floor(0x15*dark); }
        else if (hueShift === 1) { d[i] = Math.floor(0x30*dark); d[i+1] = Math.floor((green-0x10)*dark); d[i+2] = Math.floor(0x10*dark); }
        else { d[i] = Math.floor(0x15*dark); d[i+1] = Math.floor((green+0x10)*dark); d[i+2] = Math.floor(0x25*dark); }
        d[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
