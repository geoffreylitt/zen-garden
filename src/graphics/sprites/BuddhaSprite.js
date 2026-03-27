export function createBuddhaTexture(scene) {
  const id = 'buddha_' + Date.now() + '_' + Math.random();
  const w = 16;
  const h = 20;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const setPixel = (px, py, r, g, b) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = 255;
  };

  const stone = [0x8a, 0x87, 0x80];
  const highlight = [0xa0, 0x9c, 0x94];
  const shadow = [0x6a, 0x67, 0x62];

  const n = () => Math.floor((Math.random() - 0.5) * 12);

  // Head (rounded) rows 0-4
  for (let py = 0; py < 5; py++) {
    const halfW = py < 1 ? 2 : py < 4 ? 3 : 2;
    for (let dx = -halfW; dx <= halfW; dx++) {
      const px = 8 + dx;
      const c = dx < 0 ? highlight : stone;
      const nv = n();
      setPixel(px, py, c[0] + nv, c[1] + nv, c[2] + nv);
    }
  }

  // Ushnisha (top knot) at row 0
  for (let dx = -1; dx <= 1; dx++) {
    const nv = n();
    setPixel(8 + dx, 0, shadow[0] + nv, shadow[1] + nv, shadow[2] + nv);
  }

  // Neck row 5
  for (let dx = -1; dx <= 1; dx++) {
    const nv = n();
    setPixel(8 + dx, 5, stone[0] + nv, stone[1] + nv, stone[2] + nv);
  }

  // Shoulders and body rows 6-13
  for (let py = 6; py < 14; py++) {
    const bodyHalf = py < 8 ? 4 : py < 11 ? 5 : 4;
    for (let dx = -bodyHalf; dx <= bodyHalf; dx++) {
      const px = 8 + dx;
      const edgeDist = bodyHalf - Math.abs(dx);
      const c = dx < -1 ? highlight : edgeDist < 1 ? shadow : stone;
      const nv = n();
      setPixel(px, py, c[0] + nv, c[1] + nv, c[2] + nv);
    }
  }

  // Hands (lap, meditating pose) rows 10-12
  for (let py = 10; py < 13; py++) {
    for (let dx = -3; dx <= 3; dx++) {
      const px = 8 + dx;
      const nv = n();
      setPixel(px, py, highlight[0] + nv, highlight[1] + nv, highlight[2] + nv);
    }
  }

  // Crossed legs rows 14-17
  for (let py = 14; py < 18; py++) {
    const legHalf = py < 16 ? 5 : 6;
    for (let dx = -legHalf; dx <= legHalf; dx++) {
      const px = 8 + dx;
      const c = Math.abs(dx) > legHalf - 1 ? shadow : stone;
      const nv = n();
      setPixel(px, py, c[0] + nv, c[1] + nv, c[2] + nv);
    }
  }

  // Base/pedestal rows 18-19
  for (let py = 18; py < 20; py++) {
    for (let dx = -7; dx <= 7; dx++) {
      const px = 8 + dx;
      const c = py === 18 ? stone : shadow;
      const nv = n();
      setPixel(px, py, c[0] + nv, c[1] + nv, c[2] + nv);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
