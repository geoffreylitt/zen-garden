export function createPebbleTexture(scene) {
  const id = 'pebble_' + Date.now() + '_' + Math.random();
  // Radius 2-3px → sprite 6-8px wide, slightly flattened
  const rx = 2 + Math.floor(Math.random() * 2);
  const ry = Math.max(1, Math.floor(rx * (0.6 + Math.random() * 0.4)));
  const w = rx * 2 + 2;
  const h = ry * 2 + 2;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const cx = w / 2;
  const cy = h / 2;
  // Warm gray, with slight color variation between pebbles
  const base = 0x80 + Math.floor(Math.random() * 0x30);
  const warm = Math.floor(Math.random() * 12);

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / rx;
      const dy = (py - cy) / ry;
      const dist = dx * dx + dy * dy;
      if (dist <= 1.0) {
        const i = (py * w + px) * 4;
        const highlight = Math.floor((1 - dist) * 22);
        const jitter = Math.floor((Math.random() - 0.5) * 12);
        const shade = Math.min(255, Math.max(0, base + highlight + jitter));
        d[i]     = shade + warm;
        d[i + 1] = shade;
        d[i + 2] = shade - 4;
        d[i + 3] = 210 + Math.floor(Math.random() * 30);
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}

export function createMossTexture(scene) {
  const id = 'moss_' + Date.now() + '_' + Math.random();
  const r = 2 + Math.floor(Math.random() * 3); // radius 2-4
  const w = r * 2 + 2;
  const h = r * 2 + 2;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const cx = w / 2;
  const cy = h / 2;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / r;
      const dy = (py - cy) / r;
      const dist = dx * dx + dy * dy;
      // Irregular edge via stochastic threshold — mimics organic moss clumps
      if (dist <= 1.0 && Math.random() > dist * 0.4) {
        const i = (py * w + px) * 4;
        const g = 0x38 + Math.floor(Math.random() * 0x28); // dark-to-medium green
        d[i]     = 0x18 + Math.floor(Math.random() * 0x10);
        d[i + 1] = g;
        d[i + 2] = 0x08 + Math.floor(Math.random() * 0x10);
        d[i + 3] = 170 + Math.floor(Math.random() * 60);
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}

export function createLeafTexture(scene) {
  const id = 'leaf_' + Date.now() + '_' + Math.random();
  // Elongated leaf shape — 5-8px long, 2-3px wide
  const halfLen = 2 + Math.floor(Math.random() * 2);
  const halfWid = 1 + Math.floor(Math.random() * 1);
  const w = halfLen * 2 + 2;
  const h = halfWid * 2 + 2;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const cx = w / 2;
  const cy = h / 2;
  // Autumn tones: amber, rust, ochre
  const palette = [
    [0x9a, 0x62, 0x18], // amber-brown
    [0xb8, 0x72, 0x20], // warm ochre
    [0x7a, 0x42, 0x10], // dark rust
    [0xa0, 0x78, 0x30], // yellow-brown
  ];
  const [br, bg, bb] = palette[Math.floor(Math.random() * palette.length)];

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / halfLen;
      const dy = (py - cy) / halfWid;
      // Leaf outline: ellipse, pinched slightly at tips
      const dist = dx * dx + dy * dy + Math.abs(dx) * 0.2;
      if (dist <= 1.0) {
        const i = (py * w + px) * 4;
        const jitter = Math.floor((Math.random() - 0.5) * 14);
        d[i]     = Math.min(255, Math.max(0, br + jitter));
        d[i + 1] = Math.min(255, Math.max(0, bg + jitter));
        d[i + 2] = Math.min(255, Math.max(0, bb + jitter));
        d[i + 3] = 185 + Math.floor(Math.random() * 50);
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
