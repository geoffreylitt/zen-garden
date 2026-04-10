// Wild rainbow teahouse — every section a different vivid color
export function createTeahouseTexture(scene) {
  const id = 'teahouse_' + Date.now() + '_' + Math.random();
  const w = 24;
  const h = 20;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const setPixel = (px, py, r, g, b) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i]     = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = 255;
  };

  // Vivid roof: magenta-to-cyan gradient across the top
  const roofHue1 = 0.83; // magenta
  const roofHue2 = 0.5;  // cyan

  for (let py = 0; py < 9; py++) {
    for (let px = 0; px < w; px++) {
      const roofWidth = w / 2 + (8 - py) * 0.8;
      const centerX = w / 2;
      const distFromCenter = Math.abs(px - centerX);

      if (distFromCenter <= roofWidth) {
        const normalizedX = distFromCenter / roofWidth;
        const curveHeight = py + normalizedX * normalizedX * 3;

        if (curveHeight >= py && curveHeight < py + 1.5) {
          // Hue sweeps across roof left-to-right
          const t = px / w;
          const hue = roofHue1 + (roofHue2 - roofHue1) * t;
          const val = py < 3 ? 0.95 : 0.75;
          const noise = (Math.random() - 0.5) * 0.06;
          const [r, g, b] = hsvToRgb((hue + noise + 1) % 1, 0.9, val);
          setPixel(px, py, r, g, b);
        }
      }
    }
  }

  // Roof overhang edge — hot orange
  for (let px = 2; px < w - 2; px++) {
    const noise = (Math.random() - 0.5) * 0.05;
    const [r, g, b] = hsvToRgb(0.08 + noise, 0.9, 0.9);
    setPixel(px, 8, r, g, b);
  }

  // Walls — electric blue-to-green gradient
  for (let py = 9; py < 17; py++) {
    for (let px = 4; px < w - 4; px++) {
      const t = (py - 9) / 8;
      const hue = 0.6 - t * 0.15; // blue → teal
      const sat = px < 6 || px >= w - 6 ? 0.95 : 0.75;
      const val = px < 6 || px >= w - 6 ? 0.55 : 0.85;
      const noise = (Math.random() - 0.5) * 0.06;
      const [r, g, b] = hsvToRgb((hue + noise + 1) % 1, sat, val);
      setPixel(px, py, r, g, b);
    }
  }

  // Door — deep purple
  const doorLeft = Math.floor(w / 2) - 2;
  const doorRight = Math.floor(w / 2) + 2;
  for (let py = 11; py < 17; py++) {
    for (let px = doorLeft; px <= doorRight; px++) {
      const noise = (Math.random() - 0.5) * 0.06;
      const [r, g, b] = hsvToRgb(0.77 + noise, 0.95, 0.45);
      setPixel(px, py, r, g, b);
    }
  }

  // Windows — neon yellow
  for (let py = 11; py < 14; py++) {
    for (let px = 6; px < 9; px++) {
      const [r, g, b] = hsvToRgb(0.14, 0.9, 0.95);
      setPixel(px, py, r, g, b);
    }
    for (let px = w - 9; px < w - 6; px++) {
      const [r, g, b] = hsvToRgb(0.14, 0.9, 0.95);
      setPixel(px, py, r, g, b);
    }
  }

  // Floor/foundation — neon pink
  for (let px = 3; px < w - 3; px++) {
    const noise = (Math.random() - 0.5) * 0.05;
    const [r, g, b] = hsvToRgb(0.92 + noise, 0.85, 0.9);
    setPixel(px, 17, r, g, b);
    const [r2, g2, b2] = hsvToRgb(0.92 + noise, 0.85, 0.65);
    setPixel(px, 18, r2, g2, b2);
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}

function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
