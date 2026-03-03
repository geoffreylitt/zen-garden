const ROBE_PALETTES = [
  { robe: [0x6b, 0x4e, 0x3a], trim: [0x8a, 0x6d, 0x55] },
  { robe: [0x3a, 0x4e, 0x5e], trim: [0x55, 0x6d, 0x7a] },
  { robe: [0x5a, 0x3a, 0x4e], trim: [0x7a, 0x55, 0x6d] },
  { robe: [0x4a, 0x5a, 0x3e], trim: [0x6a, 0x7a, 0x58] },
  { robe: [0x5c, 0x44, 0x44], trim: [0x7c, 0x60, 0x60] },
];

export function createWandererTexture(scene) {
  const id = 'wanderer_' + Date.now() + '_' + Math.random();
  const w = 5;
  const h = 5;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const palette = ROBE_PALETTES[Math.floor(Math.random() * ROBE_PALETTES.length)];
  const headColor = [0xd4, 0xb8, 0x96];

  const setPixel = (px, py, r, g, b) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    const n = Math.floor((Math.random() - 0.5) * 12);
    d[i] = Math.max(0, Math.min(255, r + n));
    d[i + 1] = Math.max(0, Math.min(255, g + n));
    d[i + 2] = Math.max(0, Math.min(255, b + n));
    d[i + 3] = 255;
  };

  // Head (top center) - small circle
  setPixel(2, 0, headColor[0], headColor[1], headColor[2]);
  setPixel(1, 0, headColor[0] - 15, headColor[1] - 15, headColor[2] - 15);
  setPixel(3, 0, headColor[0] - 15, headColor[1] - 15, headColor[2] - 15);

  // Shoulders / upper robe
  setPixel(1, 1, palette.trim[0], palette.trim[1], palette.trim[2]);
  setPixel(2, 1, palette.robe[0], palette.robe[1], palette.robe[2]);
  setPixel(3, 1, palette.trim[0], palette.trim[1], palette.trim[2]);

  // Body
  setPixel(1, 2, palette.robe[0], palette.robe[1], palette.robe[2]);
  setPixel(2, 2, palette.robe[0] + 10, palette.robe[1] + 10, palette.robe[2] + 10);
  setPixel(3, 2, palette.robe[0], palette.robe[1], palette.robe[2]);

  // Lower body
  setPixel(1, 3, palette.robe[0] - 10, palette.robe[1] - 10, palette.robe[2] - 10);
  setPixel(2, 3, palette.robe[0], palette.robe[1], palette.robe[2]);
  setPixel(3, 3, palette.robe[0] - 10, palette.robe[1] - 10, palette.robe[2] - 10);

  // Feet
  setPixel(1, 4, 0x3a, 0x2e, 0x22);
  setPixel(3, 4, 0x3a, 0x2e, 0x22);

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
