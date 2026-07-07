const THOUGHTS = ['~', '○', '☆', '♪', '∞', '·'];

export function createThoughtBubbleTexture(scene) {
  const id = 'thought_' + Date.now() + '_' + Math.random();
  const w = 12;
  const h = 10;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const white = [0xf0, 0xec, 0xe4];
  const outline = [0xb8, 0xb0, 0xa0];

  const setPixel = (px, py, r, g, b, a = 255) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = a;
  };

  // Main bubble (rounded rectangle, rows 0-5)
  //   row 0:   cols 3-8
  //   row 1-4: cols 2-9
  //   row 5:   cols 3-8
  for (let px = 3; px <= 8; px++) {
    setPixel(px, 0, outline[0], outline[1], outline[2]);
    setPixel(px, 5, outline[0], outline[1], outline[2]);
  }
  for (let py = 1; py <= 4; py++) {
    setPixel(2, py, outline[0], outline[1], outline[2]);
    setPixel(9, py, outline[0], outline[1], outline[2]);
    for (let px = 3; px <= 8; px++) {
      setPixel(px, py, white[0], white[1], white[2]);
    }
  }
  // Corners filled white
  setPixel(2, 0, 0, 0, 0, 0);
  setPixel(9, 0, 0, 0, 0, 0);
  setPixel(2, 5, 0, 0, 0, 0);
  setPixel(9, 5, 0, 0, 0, 0);

  // Symbol inside bubble (single dark pixel pattern)
  const sym = Math.floor(Math.random() * 4);
  const symColor = [0x80, 0x78, 0x70];
  if (sym === 0) {
    // Dot cluster (contemplation)
    setPixel(4, 2, symColor[0], symColor[1], symColor[2]);
    setPixel(6, 3, symColor[0], symColor[1], symColor[2]);
    setPixel(8, 2, symColor[0], symColor[1], symColor[2]);
  } else if (sym === 1) {
    // Wavy line (flowing thought)
    setPixel(4, 2, symColor[0], symColor[1], symColor[2]);
    setPixel(5, 3, symColor[0], symColor[1], symColor[2]);
    setPixel(6, 2, symColor[0], symColor[1], symColor[2]);
    setPixel(7, 3, symColor[0], symColor[1], symColor[2]);
  } else if (sym === 2) {
    // Small circle (zen circle / enso)
    setPixel(5, 2, symColor[0], symColor[1], symColor[2]);
    setPixel(7, 2, symColor[0], symColor[1], symColor[2]);
    setPixel(5, 4, symColor[0], symColor[1], symColor[2]);
    setPixel(7, 4, symColor[0], symColor[1], symColor[2]);
    setPixel(4, 3, symColor[0], symColor[1], symColor[2]);
    setPixel(8, 3, symColor[0], symColor[1], symColor[2]);
  } else {
    // Leaf shape
    setPixel(5, 2, symColor[0], symColor[1], symColor[2]);
    setPixel(6, 2, symColor[0], symColor[1], symColor[2]);
    setPixel(6, 3, symColor[0], symColor[1], symColor[2]);
    setPixel(7, 3, symColor[0], symColor[1], symColor[2]);
    setPixel(7, 4, symColor[0], symColor[1], symColor[2]);
  }

  // Trailing bubbles (below main bubble, leading to head)
  setPixel(4, 7, outline[0], outline[1], outline[2]);
  setPixel(5, 7, outline[0], outline[1], outline[2]);
  setPixel(4, 8, outline[0], outline[1], outline[2]);
  setPixel(5, 8, outline[0], outline[1], outline[2]);

  setPixel(3, 9, outline[0], outline[1], outline[2]);

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
