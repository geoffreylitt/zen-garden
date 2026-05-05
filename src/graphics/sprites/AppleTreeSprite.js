export function createAppleTreeTexture(scene) {
  const id = 'appletree_' + Date.now() + '_' + Math.random();
  const w = 20;
  const h = 26;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const setPixel = (px, py, r, g, b, a = 255) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = a;
  };

  // Trunk: centered, rows 16–25
  const trunkLeft = Math.floor(w / 2) - 2;
  const trunkRight = Math.floor(w / 2) + 1;
  for (let py = 16; py < h; py++) {
    for (let px = trunkLeft; px <= trunkRight; px++) {
      const noise = Math.floor((Math.random() - 0.5) * 18);
      const dark = py > 21 ? 0.82 : 1.0;
      setPixel(px, py,
        Math.max(0, Math.min(255, Math.floor((0x5a + noise) * dark))),
        Math.max(0, Math.min(255, Math.floor((0x38 + noise) * dark))),
        Math.max(0, Math.min(255, Math.floor((0x18 + noise) * dark)))
      );
    }
  }

  // Canopy: circular blob, centered at (w/2, 10), radius ~9
  const cx = w / 2;
  const cy = 9;
  const rx = 8.5;
  const ry = 8;
  for (let py = 0; py < 18; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / rx;
      const dy = (py - cy) / ry;
      const dist = dx * dx + dy * dy;
      const noise = Math.sin(px * 2.7) * 0.12 + Math.cos(py * 3.1) * 0.09;
      if (dist + noise <= 1.0) {
        const shadeFactor = py > cy ? 0.75 : 1.0;
        const green = 0x52 + Math.floor(Math.random() * 0x38);
        setPixel(px, py,
          Math.floor(0x22 * shadeFactor),
          Math.floor(green * shadeFactor),
          Math.floor(0x18 * shadeFactor)
        );
      }
    }
  }

  // Apples: scatter ~6 red dots within the canopy
  const applePositions = [
    [cx - 3, cy - 2], [cx + 2, cy - 1], [cx - 1, cy + 2],
    [cx + 3, cy + 3], [cx - 4, cy + 1], [cx + 1, cy - 3],
  ];
  for (const [ax, ay] of applePositions) {
    const apx = Math.round(ax);
    const apy = Math.round(ay);
    // Only draw apple if it's inside the canopy
    const dx = (apx - cx) / rx;
    const dy = (apy - cy) / ry;
    if (dx * dx + dy * dy <= 0.85) {
      const r = 0xcc + Math.floor(Math.random() * 0x22);
      const g = 0x20 + Math.floor(Math.random() * 0x18);
      setPixel(apx, apy, r, g, 0x10);
      // Tiny highlight
      setPixel(apx - 1, apy, Math.min(255, r + 20), Math.min(255, g + 10), 0x10);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
