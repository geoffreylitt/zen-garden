export function createBambooTexture(scene) {
  const id = 'bamboo_' + Date.now() + '_' + Math.random();
  const w = 6;
  const h = 22;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const setPixel = (px, py, r, g, b, a = 255) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
  };

  // Node positions (bamboo rings)
  const nodes = [4, 9, 14, 19];

  for (let py = 0; py < h; py++) {
    const isNode = nodes.includes(py);
    const isBuried = py >= h - 5; // bottom part appears buried

    for (let px = 1; px < w - 1; px++) {
      // Left highlight, center, right shadow
      let r, g, b;
      if (isNode) {
        // Darker ring / node band
        r = 0x4a; g = 0x6a; b = 0x18;
      } else if (isBuried) {
        // Buried section — muted, sandy-tinted
        r = 0x6a; g = 0x7a; b = 0x34;
      } else if (px === 1) {
        // Left highlight
        r = 0xaa; g = 0xcc; b = 0x44;
      } else if (px === w - 2) {
        // Right shadow
        r = 0x56; g = 0x80; b = 0x20;
      } else {
        // Main body
        r = 0x80; g = 0xa8; b = 0x30;
      }

      const noise = Math.floor((Math.random() - 0.5) * 12);
      setPixel(px, py, r + noise, g + noise, b + noise);
    }
  }

  // Tip — pointed top
  setPixel(2, 0, 0x70, 0x98, 0x28);
  setPixel(3, 0, 0x70, 0x98, 0x28);

  // Small dirt clump around base to show it's stuck in the ground
  const dirtY = h - 5;
  for (let px = 0; px < w; px++) {
    setPixel(px, dirtY, 0xa8, 0x96, 0x70, 180);
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
