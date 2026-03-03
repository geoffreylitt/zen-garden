export function createWandererTexture(scene) {
  const id = 'wanderer_' + Date.now() + '_' + Math.random();
  const w = 7;
  const h = 7;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const robeHues = [
    [0x6b, 0x4e, 0x3a],
    [0x4a, 0x4a, 0x6e],
    [0x5a, 0x3a, 0x3a],
    [0x3a, 0x55, 0x3a],
    [0x55, 0x44, 0x55],
  ];
  const robe = robeHues[Math.floor(Math.random() * robeHues.length)];
  const hair = [0x22, 0x1a, 0x14];

  const setPixel = (px, py, r, g, b) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
  };

  const cx = 3, cy = 3;

  // Body/robe circle
  for (let py = 1; py < 6; py++) {
    for (let px = 1; px < 6; px++) {
      const dx = (px - cx) / 2.5;
      const dy = (py - cy) / 2.5;
      if (dx * dx + dy * dy <= 1.0) {
        const n = Math.floor((Math.random() - 0.5) * 12);
        setPixel(px, py, robe[0] + n, robe[1] + n, robe[2] + n);
      }
    }
  }

  // Head (darker circle on top)
  for (let py = 1; py < 4; py++) {
    for (let px = 2; px < 5; px++) {
      const dx = (px - cx) / 1.5;
      const dy = (py - 2) / 1.2;
      if (dx * dx + dy * dy <= 1.0) {
        const n = Math.floor((Math.random() - 0.5) * 8);
        setPixel(px, py, hair[0] + n, hair[1] + n, hair[2] + n);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
