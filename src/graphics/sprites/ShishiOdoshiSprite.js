export function createShishiOdoshiTexture(scene) {
  const id = 'shishiodoshi_' + Date.now() + '_' + Math.random();
  const w = 20;
  const h = 24;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const set = (px, py, r, g, b) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
  };

  const bamboo = [0x8b, 0x73, 0x55];
  const bambooDk = [0x6b, 0x53, 0x35];
  const stone = [0x70, 0x70, 0x68];
  const water = [0x40, 0x78, 0xa0];

  for (let y = 3; y < 19; y++) {
    const n = Math.floor(Math.random() * 10);
    set(5, y, bamboo[0] + n, bamboo[1] + n, bamboo[2] + n);
    set(6, y, bambooDk[0] + n, bambooDk[1] + n, bambooDk[2] + n);
    set(14, y, bamboo[0] + n, bamboo[1] + n, bamboo[2] + n);
    set(15, y, bambooDk[0] + n, bambooDk[1] + n, bambooDk[2] + n);
  }

  for (let x = 5; x <= 15; x++) {
    const n = Math.floor(Math.random() * 8);
    set(x, 7, bamboo[0] + n, bamboo[1] + n, bamboo[2] + n);
    set(x, 8, bambooDk[0] + n, bambooDk[1] + n, bambooDk[2] + n);
  }

  for (let y = 19; y < 24; y++) {
    for (let x = 6; x < 15; x++) {
      const dx = (x - 10) / 4.5;
      const dy = (y - 21.5) / 2.5;
      if (dx * dx + dy * dy <= 1) {
        const n = Math.floor((Math.random() - 0.5) * 20);
        set(x, y, stone[0] + n, stone[1] + n, stone[2] + n);
      }
    }
  }

  for (let x = 1; x < 6; x++) {
    const n = Math.floor(Math.random() * 8);
    set(x, 10, bamboo[0] + n, bamboo[1] + n, bamboo[2] + n);
    set(x, 11, bambooDk[0] + n, bambooDk[1] + n, bambooDk[2] + n);
  }

  set(2, 12, water[0], water[1], water[2]);
  set(2, 13, water[0], water[1], water[2]);
  set(3, 14, water[0] - 10, water[1] - 10, water[2] - 10);

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
