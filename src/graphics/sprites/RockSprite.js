export function createRockTexture(scene) {
  const id = 'rock_' + Date.now() + '_' + Math.random();
  const w = 10 + Math.floor(Math.random() * 10);
  const h = 8 + Math.floor(Math.random() * 8);
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const tint = Math.floor(Math.random() * 4);
  const baseShade = 0x60 + Math.floor(Math.random() * 0x30);
  const bumpSeed = Math.random() * 100;

  const cx = w / 2;
  const cy = h / 2;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / (w / 2);
      const dy = (py - cy) / (h / 2);
      const bump = Math.sin(px * 1.5 + bumpSeed) * 0.12 + Math.cos(py * 2.1 + bumpSeed) * 0.08;
      const dist = dx * dx + dy * dy + bump;
      if (dist <= 1.0) {
        const i = (py * w + px) * 4;
        const shade = baseShade + Math.floor((1 - dist) * 0x40) +
          Math.floor((Math.random() - 0.5) * 20);
        const warm = Math.floor(Math.random() * 10);
        if (tint === 0) { d[i] = shade + warm; d[i+1] = shade; d[i+2] = shade - 5; }
        else if (tint === 1) { d[i] = shade + warm + 10; d[i+1] = shade - 5; d[i+2] = shade - 15; }
        else if (tint === 2) { d[i] = shade - 5; d[i+1] = shade + 5; d[i+2] = shade + warm; }
        else { d[i] = shade + warm; d[i+1] = shade + warm; d[i+2] = shade - 10; }
        d[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
