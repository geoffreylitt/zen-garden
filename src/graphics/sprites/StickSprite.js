export function createStickTexture(scene) {
  const id = 'stick_' + Date.now() + '_' + Math.random();
  const w = 4;
  const h = 28;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const i = (py * w + px) * 4;

      // Taper the stick slightly toward the tip (bottom)
      const taperedW = px === 0 || px === w - 1 ? (py < h * 0.15 ? 1 : 2) : 2;
      const inStick = px >= (w / 2 - taperedW / 2) && px < (w / 2 + taperedW / 2);
      if (!inStick) continue;

      // Wood grain: base brown with subtle variation along grain
      const grain = Math.sin(py * 1.8 + px * 0.7) * 12 + Math.sin(py * 5.1) * 4;
      const r = Math.min(255, 0x8b + Math.floor(grain) + Math.floor((Math.random() - 0.5) * 6));
      const g = Math.min(255, 0x5c + Math.floor(grain * 0.6) + Math.floor((Math.random() - 0.5) * 4));
      const b = Math.min(255, 0x2a + Math.floor(grain * 0.3));

      // Darker toward the pointed tip
      const tipDark = py > h * 0.8 ? 0.75 + 0.25 * (1 - (py - h * 0.8) / (h * 0.2)) : 1.0;

      d[i] = Math.floor(r * tipDark);
      d[i + 1] = Math.floor(g * tipDark);
      d[i + 2] = Math.floor(b * tipDark);
      d[i + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
