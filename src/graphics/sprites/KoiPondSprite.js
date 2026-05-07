export function createKoiPondTexture(scene) {
  const id = 'koipond_' + Date.now() + '_' + Math.random();
  const w = 22;
  const h = 18;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const cx = w / 2;
  const cy = h / 2;
  const rx = w / 2 - 1;
  const ry = h / 2 - 1;

  const setPixel = (px, py, r, g, b, a = 255) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = a;
  };

  const waterDeep = [0x28, 0x50, 0x6a];
  const waterMid = [0x35, 0x65, 0x80];
  const waterLight = [0x48, 0x78, 0x95];
  const stoneBase = [0x70, 0x68, 0x58];

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / rx;
      const dy = (py - cy) / ry;
      const dist = dx * dx + dy * dy;

      if (dist > 1.0) continue;

      const noise = Math.floor((Math.random() - 0.5) * 12);

      if (dist > 0.75) {
        const sn = Math.floor((Math.random() - 0.5) * 18);
        setPixel(px, py, stoneBase[0] + sn, stoneBase[1] + sn, stoneBase[2] + sn);
      } else if (dist > 0.55) {
        setPixel(px, py, waterMid[0] + noise, waterMid[1] + noise, waterMid[2] + noise);
      } else {
        const shimmer = Math.random() < 0.08 ? 20 : 0;
        setPixel(px, py,
          waterDeep[0] + noise + shimmer,
          waterDeep[1] + noise + shimmer,
          waterDeep[2] + noise + shimmer);
      }
    }
  }

  const koiColors = [
    { body: [0xe0, 0x60, 0x20], spot: [0xff, 0xff, 0xf0] },
    { body: [0xff, 0xc0, 0x30], spot: [0xff, 0x70, 0x20] },
  ];

  const fish1 = { x: cx - 3, y: cy - 1, dir: 1, color: koiColors[0] };
  const fish2 = { x: cx + 2, y: cy + 2, dir: -1, color: koiColors[1] };

  [fish1, fish2].forEach((f) => {
    const n = Math.floor((Math.random() - 0.5) * 10);
    setPixel(f.x, f.y, f.color.body[0] + n, f.color.body[1] + n, f.color.body[2] + n);
    setPixel(f.x + f.dir, f.y, f.color.body[0] + n, f.color.body[1] + n, f.color.body[2] + n);
    setPixel(f.x + f.dir * 2, f.y, f.color.spot[0], f.color.spot[1], f.color.spot[2]);
    setPixel(f.x - f.dir, f.y, f.color.body[0] - 20, f.color.body[1] - 10, f.color.body[2]);
    setPixel(f.x - f.dir, f.y - 1, f.color.body[0] - 30, f.color.body[1] - 20, f.color.body[2]);
    setPixel(f.x - f.dir, f.y + 1, f.color.body[0] - 30, f.color.body[1] - 20, f.color.body[2]);
  });

  const highlightY = cy - Math.floor(ry * 0.4);
  for (let i = 0; i < 3; i++) {
    const hx = cx - 1 + i;
    if (Math.random() < 0.6) {
      setPixel(hx, highlightY, waterLight[0] + 30, waterLight[1] + 30, waterLight[2] + 30);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
