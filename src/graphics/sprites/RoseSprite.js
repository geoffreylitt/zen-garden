export function createRoseTexture(scene) {
  const id = 'rose_' + Date.now() + '_' + Math.random();
  const w = 14;
  const h = 16;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  function setPixel(px, py, r, g, b, a = 255) {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
  }

  // Stem
  for (let sy = 9; sy < h; sy++) {
    setPixel(6, sy, 0x28, 0x72, 0x28);
    setPixel(7, sy, 0x30, 0x88, 0x30);
  }
  // Leaf
  setPixel(8, 11, 0x28, 0x80, 0x28);
  setPixel(9, 10, 0x28, 0x80, 0x28);
  setPixel(5, 12, 0x28, 0x80, 0x28);
  setPixel(4, 11, 0x28, 0x80, 0x28);

  // Petals — 5 petals arranged radially around center (7, 5)
  const cx = 7;
  const cy = 5;
  const petalAngles = [0, 72, 144, 216, 288];
  for (const deg of petalAngles) {
    const rad = (deg * Math.PI) / 180;
    const px0 = Math.round(cx + Math.cos(rad) * 3.2);
    const py0 = Math.round(cy + Math.sin(rad) * 3.2);
    const px1 = Math.round(cx + Math.cos(rad) * 2);
    const py1 = Math.round(cy + Math.sin(rad) * 2);
    // Outer petal cell
    const shade = 0xb0 + Math.floor(Math.random() * 0x30);
    setPixel(px0, py0, shade, 0x18, 0x18);
    setPixel(px1, py1, 0xd8, 0x30, 0x30);
  }

  // Inner ring
  for (let angle = 0; angle < 360; angle += 45) {
    const rad = (angle * Math.PI) / 180;
    const rx = Math.round(cx + Math.cos(rad) * 1.4);
    const ry = Math.round(cy + Math.sin(rad) * 1.4);
    setPixel(rx, ry, 0xe8, 0x38, 0x38);
  }

  // Center
  setPixel(cx, cy, 0xff, 0xd0, 0x40);
  setPixel(cx - 1, cy, 0xe8, 0xb8, 0x30);
  setPixel(cx + 1, cy, 0xe8, 0xb8, 0x30);
  setPixel(cx, cy - 1, 0xe8, 0xb8, 0x30);

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
