export function createLanternTexture(scene) {
  const id = 'lantern_' + Date.now() + '_' + Math.random();
  const w = 10;
  const h = 18;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const set = (px, py, r, g, b, a = 255) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
  };

  const stoneBase = [0x88, 0x88, 0x80];

  // Post (bottom)
  for (let py = 12; py < 18; py++) {
    for (let px = 4; px <= 5; px++) {
      const n = Math.floor((Math.random() - 0.5) * 12);
      set(px, py, stoneBase[0] + n, stoneBase[1] + n, stoneBase[2] + n);
    }
  }

  // Base platform
  for (let px = 2; px <= 7; px++) {
    const n = Math.floor((Math.random() - 0.5) * 10);
    set(px, 17, stoneBase[0] - 10 + n, stoneBase[1] - 10 + n, stoneBase[2] - 10 + n);
  }

  // Lantern body (fire box)
  for (let py = 7; py <= 11; py++) {
    for (let px = 2; px <= 7; px++) {
      if (py === 7 || py === 11 || px === 2 || px === 7) {
        const n = Math.floor((Math.random() - 0.5) * 10);
        set(px, py, stoneBase[0] + n, stoneBase[1] + n, stoneBase[2] + n);
      } else {
        set(px, py, 0x20, 0x18, 0x10, 180);
      }
    }
  }

  // Roof cap
  for (let py = 4; py <= 6; py++) {
    const spread = 6 - py;
    const left = 3 - spread;
    const right = 6 + spread;
    for (let px = Math.max(0, left); px <= Math.min(w - 1, right); px++) {
      const n = Math.floor((Math.random() - 0.5) * 10);
      set(px, py, stoneBase[0] - 5 + n, stoneBase[1] - 5 + n, stoneBase[2] + n);
    }
  }

  // Finial (top decoration)
  for (let py = 2; py <= 3; py++) {
    const n = Math.floor((Math.random() - 0.5) * 8);
    set(4, py, stoneBase[0] + n, stoneBase[1] + n, stoneBase[2] + n);
    set(5, py, stoneBase[0] + n, stoneBase[1] + n, stoneBase[2] + n);
  }
  set(4, 1, stoneBase[0], stoneBase[1], stoneBase[2]);
  set(5, 1, stoneBase[0], stoneBase[1], stoneBase[2]);

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}

export function createLanternGlowTexture(scene) {
  const id = 'lanternglow_' + Date.now() + '_' + Math.random();
  const w = 24;
  const h = 24;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const cx = w / 2;
  const cy = h / 2;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = px - cx;
      const dy = py - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / (w / 2);
      if (dist < 1.0) {
        const i = (py * w + px) * 4;
        const falloff = 1 - dist * dist;
        d[i] = 0xff;
        d[i + 1] = 0xcc;
        d[i + 2] = 0x55;
        d[i + 3] = Math.floor(falloff * 180);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
