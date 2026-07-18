export function createBambooTexture(scene) {
  const id = 'bamboo_' + Date.now() + '_' + Math.random();
  const w = 13;
  const h = 30;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  function setPixel(px, py, r, g, b, a = 255) {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const idx = (py * w + px) * 4;
    d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = a;
  }

  // Stalk center columns
  const sx = 5; // stalk left column (2px wide: sx and sx+1)

  // Node positions (1px tall each, slightly wider)
  const nodes = [8, 15, 22];

  // Draw stalk segments and nodes
  for (let py = 3; py < h; py++) {
    const isNode = nodes.includes(py);
    if (isNode) {
      // Node: 4px wide, brighter/yellowish highlight
      for (let dx = -1; dx <= 2; dx++) {
        const jitter = Math.floor(Math.random() * 8) - 4;
        setPixel(sx + dx, py, 0x8a + jitter, 0x9a + jitter, 0x1a + jitter);
      }
    } else {
      // Stalk: 2px wide, left lighter, right darker (cylinder shading)
      const jitter = Math.floor(Math.random() * 6) - 3;
      setPixel(sx,     py, 0x80 + jitter, 0xa8 + jitter, 0x28 + jitter);
      setPixel(sx + 1, py, 0x5a + jitter, 0x84 + jitter, 0x18 + jitter);
    }
  }

  // Left leaf cluster — branches upper-left from stalk around y=4
  // Leaf 1: diagonal going up-left
  const leaf1 = [
    [sx - 1, 4], [sx - 2, 4], [sx - 3, 3], [sx - 4, 3],
    [sx - 5, 2], [sx - 5, 3], [sx - 4, 4],
  ];
  for (const [lx, ly] of leaf1) {
    const tip = lx < sx - 3;
    setPixel(lx, ly,
      tip ? 0x6a : 0x58,
      tip ? 0xc0 : 0xb0,
      tip ? 0x30 : 0x20);
  }

  // Right leaf cluster — branches upper-right from stalk around y=11
  const leaf2 = [
    [sx + 2, 11], [sx + 3, 11], [sx + 4, 10], [sx + 5, 10],
    [sx + 6,  9], [sx + 6, 10], [sx + 5, 11],
  ];
  for (const [lx, ly] of leaf2) {
    const tip = lx > sx + 4;
    setPixel(lx, ly,
      tip ? 0x70 : 0x5a,
      tip ? 0xc4 : 0xb2,
      tip ? 0x28 : 0x1c);
  }

  // Small secondary leaf, left side lower
  const leaf3 = [
    [sx - 1, 17], [sx - 2, 16], [sx - 3, 16], [sx - 4, 15],
  ];
  for (const [lx, ly] of leaf3) {
    setPixel(lx, ly, 0x60, 0xa8, 0x1a);
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
