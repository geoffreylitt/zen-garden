export function createTsukubaiTexture(scene) {
  const id = 'tsukubai_' + Date.now() + '_' + Math.random();
  const w = 16;
  const h = 14;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const set = (px, py, r, g, b) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
  };

  const stoneOuter = [0x78, 0x78, 0x6e];
  const stoneInner = [0x60, 0x60, 0x58];
  const water = [0x38, 0x6a, 0x90];
  const waterHi = [0x55, 0x90, 0xb0];
  const moss = [0x45, 0x62, 0x3a];

  const cx = w / 2;
  const cy = h / 2 + 1;
  const rx = 6.5;
  const ry = 5;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / rx;
      const dy = (py - cy) / ry;
      const dist = dx * dx + dy * dy;

      if (dist <= 1.0) {
        const n = Math.floor((Math.random() - 0.5) * 18);
        if (dist > 0.6) {
          if (Math.random() < 0.15 && py < cy) {
            set(px, py, moss[0] + n, moss[1] + n, moss[2] + n);
          } else {
            set(px, py, stoneOuter[0] + n, stoneOuter[1] + n, stoneOuter[2] + n);
          }
        } else if (dist > 0.35) {
          set(px, py, stoneInner[0] + n, stoneInner[1] + n, stoneInner[2] + n);
        } else {
          const shimmer = Math.sin(px * 1.5 + py * 0.8) * 8;
          if (dist < 0.12) {
            set(px, py, waterHi[0] + shimmer, waterHi[1] + shimmer, waterHi[2] + shimmer);
          } else {
            set(px, py, water[0] + n + shimmer, water[1] + n + shimmer, water[2] + n + shimmer);
          }
        }
      }
    }
  }

  const ladleColor = [0x8b, 0x73, 0x55];
  for (let x = cx + 2; x < w - 1; x++) {
    const n = Math.floor(Math.random() * 8);
    set(x, 3, ladleColor[0] + n, ladleColor[1] + n, ladleColor[2] + n);
  }
  set(Math.floor(cx) + 2, 2, ladleColor[0] - 10, ladleColor[1] - 10, ladleColor[2] - 10);
  set(Math.floor(cx) + 2, 4, ladleColor[0] - 10, ladleColor[1] - 10, ladleColor[2] - 10);

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
