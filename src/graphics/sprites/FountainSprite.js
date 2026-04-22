export function createFountainTexture(scene) {
  const id = 'fountain_' + Date.now() + '_' + Math.random();
  const w = 22;
  const h = 18;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  // Water pool (lower ellipse)
  const poolCX = w / 2;
  const poolCY = h * 0.74;
  const poolRX = w * 0.44;
  const poolRY = h * 0.26;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - poolCX) / poolRX;
      const dy = (py - poolCY) / poolRY;
      const dist = dx * dx + dy * dy;
      if (dist <= 1.0) {
        const i = (py * w + px) * 4;
        const shimmer = Math.random() > 0.82 ? 35 : 0;
        d[i]     = 0x42 + shimmer;
        d[i + 1] = 0x78 + shimmer;
        d[i + 2] = 0xb2 + shimmer;
        d[i + 3] = 210;
      }
    }
  }

  // Rock (upper-center ellipse)
  const rockCX = w / 2;
  const rockCY = h * 0.40;
  const rockRX = w * 0.27;
  const rockRY = h * 0.33;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - rockCX) / rockRX;
      const dy = (py - rockCY) / rockRY;
      const dist = dx * dx + dy * dy;
      if (dist <= 1.0) {
        const i = (py * w + px) * 4;
        const shade = 0x68 + Math.floor((1 - dist) * 0x42) +
          Math.floor((Math.random() - 0.5) * 22);
        const warm = Math.floor(Math.random() * 10);
        d[i]     = shade + warm;
        d[i + 1] = shade;
        d[i + 2] = shade - 6;
        d[i + 3] = 255;
      }
    }
  }

  // Water trickle pixels connecting rock base to pool
  const trickleX = Math.round(w / 2);
  const trickleYStart = Math.round(h * 0.60);
  const trickleYEnd   = Math.round(h * 0.68);
  for (let ty = trickleYStart; ty <= trickleYEnd; ty++) {
    const offsets = ty % 2 === 0 ? [0] : [0, 1];
    offsets.forEach((dx) => {
      const tx = trickleX + dx;
      if (tx >= 0 && tx < w && ty >= 0 && ty < h) {
        const i = (ty * w + tx) * 4;
        d[i]     = 0x60;
        d[i + 1] = 0x9a;
        d[i + 2] = 0xd0;
        d[i + 3] = 200;
      }
    });
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
