const MOSS_PALETTE = [
  { r: 0x2a, g: 0x5c, b: 0x18 },
  { r: 0x38, g: 0x6c, b: 0x20 },
  { r: 0x48, g: 0x78, b: 0x28 },
  { r: 0x30, g: 0x64, b: 0x24 },
  { r: 0x40, g: 0x70, b: 0x1c },
];

function pickGreen() {
  return MOSS_PALETTE[Math.floor(Math.random() * MOSS_PALETTE.length)];
}

function setPixelAlpha(d, w, px, py, r, g, b, a) {
  if (a <= 0) return;
  const i = (py * w + px) * 4;
  const existing = d[i + 3];
  if (existing > a) return;
  d[i] = r;
  d[i + 1] = g;
  d[i + 2] = b;
  d[i + 3] = Math.min(255, a);
}

function scatterEdgePixels(d, w, h, cx, cy, rx, ry, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.8 + Math.random() * 0.5;
    const px = Math.round(cx + Math.cos(angle) * rx * r);
    const py = Math.round(cy + Math.sin(angle) * ry * r);
    if (px < 0 || px >= w || py < 0 || py >= h) continue;
    const c = pickGreen();
    const alpha = Math.floor(40 + Math.random() * 60);
    setPixelAlpha(d, w, px, py, c.r, c.g, c.b, alpha);
  }
}

export function createFlatMossTexture(scene, sizeScale) {
  sizeScale = sizeScale || 1;
  const id = 'moss_flat_' + Date.now() + '_' + Math.random();
  const w = Math.max(4, Math.round(16 * sizeScale));
  const h = Math.max(3, Math.round(7 * sizeScale));
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const cx = w / 2;
  const cy = h / 2;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / (w / 2);
      const dy = (py - cy) / (h / 2);
      const dist = dx * dx + dy * dy;

      const noise = Math.sin(px * 2.7 + py * 1.3) * 0.15 +
                    Math.cos(px * 1.8 - py * 3.1) * 0.1 +
                    Math.sin((px + py) * 4.2) * 0.08;
      const threshold = 0.8 + noise;

      if (dist < threshold) {
        const edgeFactor = 1 - dist / threshold;
        const alpha = Math.min(255, Math.floor(Math.pow(edgeFactor, 0.5) * 255));

        const c = pickGreen();
        const brightness = 0.85 + edgeFactor * 0.15 + (Math.random() - 0.5) * 0.15;
        setPixelAlpha(d, w, px, py,
          Math.min(255, Math.floor(c.r * brightness)),
          Math.min(255, Math.floor(c.g * brightness)),
          Math.min(255, Math.floor(c.b * brightness)),
          alpha);
      }
    }
  }

  scatterEdgePixels(d, w, h, cx, cy, w / 2, h / 2, Math.round(8 * sizeScale));

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}

export function createCushionMossTexture(scene, sizeScale) {
  sizeScale = sizeScale || 1;
  const id = 'moss_cushion_' + Date.now() + '_' + Math.random();
  const s = Math.max(4, Math.round(9 * sizeScale));
  const w = s;
  const h = s;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const cx = w / 2;
  const cy = h / 2;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / (w / 2);
      const dy = (py - cy) / (h / 2);
      const dist = dx * dx + dy * dy;

      const noise = Math.sin(px * 3.5) * 0.1 + Math.cos(py * 2.8) * 0.08;
      const threshold = 0.85 + noise;

      if (dist < threshold) {
        const edgeFactor = 1 - dist / threshold;
        const alpha = Math.min(255, Math.floor(Math.pow(edgeFactor, 0.4) * 255));

        const c = pickGreen();
        const domeLight = (1 - dy * 0.3) * (1 - dist * 0.4);
        const brightness = 0.7 + domeLight * 0.5 + (Math.random() - 0.5) * 0.12;
        setPixelAlpha(d, w, px, py,
          Math.min(255, Math.floor(c.r * brightness)),
          Math.min(255, Math.floor(c.g * brightness)),
          Math.min(255, Math.floor(c.b * brightness)),
          alpha);
      }
    }
  }

  scatterEdgePixels(d, w, h, cx, cy, w / 2, h / 2, Math.round(6 * sizeScale));

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}

export function createWispyMossTexture(scene, sizeScale) {
  sizeScale = sizeScale || 1;
  const id = 'moss_wispy_' + Date.now() + '_' + Math.random();
  const w = Math.max(5, Math.round(12 * sizeScale));
  const h = Math.max(4, Math.round(9 * sizeScale));
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const cx = w / 2;
  const cy = h / 2;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / (w / 3.5);
      const dy = (py - cy) / (h / 3.5);
      const dist = dx * dx + dy * dy;

      if (dist < 1.0) {
        const edgeFactor = 1 - dist;
        const alpha = Math.min(255, Math.floor(Math.pow(edgeFactor, 0.6) * 255));
        const c = pickGreen();
        const brightness = 0.9 + (Math.random() - 0.5) * 0.15;
        setPixelAlpha(d, w, px, py,
          Math.min(255, Math.floor(c.r * brightness)),
          Math.min(255, Math.floor(c.g * brightness)),
          Math.min(255, Math.floor(c.b * brightness)),
          alpha);
      }
    }
  }

  const numTendrils = 4 + Math.floor(Math.random() * 4);
  for (let t = 0; t < numTendrils; t++) {
    const angle = Math.random() * Math.PI * 2;
    const length = 3 + Math.random() * (Math.min(w, h) / 2 - 1);
    const curve = (Math.random() - 0.5) * 0.8;
    const c = pickGreen();

    for (let step = 0; step < length; step++) {
      const progress = step / length;
      const curAngle = angle + curve * progress;
      const px = Math.round(cx + Math.cos(curAngle) * step);
      const py = Math.round(cy + Math.sin(curAngle) * step);

      if (px < 0 || px >= w || py < 0 || py >= h) continue;

      const alpha = Math.min(255, Math.floor((1 - progress * 0.8) * 200));
      const brightness = 0.85 + (Math.random() - 0.5) * 0.12;
      setPixelAlpha(d, w, px, py,
        Math.min(255, Math.floor(c.r * brightness)),
        Math.min(255, Math.floor(c.g * brightness)),
        Math.min(255, Math.floor(c.b * brightness)),
        alpha);

      if (Math.random() < 0.5 && progress < 0.7) {
        const nx = px + (Math.random() < 0.5 ? 1 : -1);
        const ny = py + (Math.random() < 0.5 ? 1 : -1);
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          setPixelAlpha(d, w, nx, ny,
            Math.min(255, Math.floor(c.r * brightness * 0.9)),
            Math.min(255, Math.floor(c.g * brightness * 0.9)),
            Math.min(255, Math.floor(c.b * brightness * 0.9)),
            Math.floor(alpha * 0.5));
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}

const VARIANTS = [createFlatMossTexture, createCushionMossTexture, createWispyMossTexture];

export function createMossTexture(scene, variant, sizeScale) {
  if (variant === undefined) {
    variant = Math.floor(Math.random() * VARIANTS.length);
  }
  if (sizeScale === undefined) {
    sizeScale = 0.7 + Math.random() * 0.6;
  }
  return VARIANTS[variant](scene, sizeScale);
}
