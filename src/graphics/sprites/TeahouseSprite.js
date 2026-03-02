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
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = 255;
  };

  const roofBase = [0x45, 0x45, 0x50];
  const roofHighlight = [0x60, 0x60, 0x68];
  const wallBase = [0x8b, 0x6b, 0x4a];
  const wallDark = [0x6a, 0x52, 0x3a];
  const floorColor = [0x5a, 0x48, 0x38];
  const doorColor = [0x3a, 0x2a, 0x20];

  // Curved roof (Japanese style)
  for (let py = 0; py < 9; py++) {
    for (let px = 0; px < w; px++) {
      const roofWidth = w / 2 + (8 - py) * 0.8;
      const centerX = w / 2;
      const distFromCenter = Math.abs(px - centerX);

      if (distFromCenter <= roofWidth) {
        const normalizedX = distFromCenter / roofWidth;
        const curveHeight = py + normalizedX * normalizedX * 3;

        if (curveHeight >= py && curveHeight < py + 1.5) {
          const noise = Math.floor((Math.random() - 0.5) * 10);
          if (py < 3) {
            setPixel(px, py, roofHighlight[0] + noise, roofHighlight[1] + noise, roofHighlight[2] + noise);
          } else {
            setPixel(px, py, roofBase[0] + noise, roofBase[1] + noise, roofBase[2] + noise);
          }
        }
      }
    }
  }

  // Roof overhang edges
  for (let px = 2; px < w - 2; px++) {
    const noise = Math.floor((Math.random() - 0.5) * 8);
    setPixel(px, 8, roofBase[0] - 10 + noise, roofBase[1] - 10 + noise, roofBase[2] + noise);
  }

  // Walls
  for (let py = 9; py < 17; py++) {
    for (let px = 4; px < w - 4; px++) {
      const noise = Math.floor((Math.random() - 0.5) * 15);
      if (px < 6 || px >= w - 6) {
        setPixel(px, py, wallDark[0] + noise, wallDark[1] + noise, wallDark[2] + noise);
      } else {
        setPixel(px, py, wallBase[0] + noise, wallBase[1] + noise, wallBase[2] + noise);
      }
    }
  }

  // Door in center
  const doorLeft = Math.floor(w / 2) - 2;
  const doorRight = Math.floor(w / 2) + 2;
  for (let py = 11; py < 17; py++) {
    for (let px = doorLeft; px <= doorRight; px++) {
      const noise = Math.floor((Math.random() - 0.5) * 8);
      setPixel(px, py, doorColor[0] + noise, doorColor[1] + noise, doorColor[2] + noise);
    }
  }

  // Windows on each side
  const windowColor = [0x2a, 0x3a, 0x4a];
  for (let py = 11; py < 14; py++) {
    for (let px = 6; px < 9; px++) {
      setPixel(px, py, windowColor[0], windowColor[1], windowColor[2]);
    }
    for (let px = w - 9; px < w - 6; px++) {
      setPixel(px, py, windowColor[0], windowColor[1], windowColor[2]);
    }
  }

  // Floor/foundation
  for (let px = 3; px < w - 3; px++) {
    const noise = Math.floor((Math.random() - 0.5) * 10);
    setPixel(px, 17, floorColor[0] + noise, floorColor[1] + noise, floorColor[2] + noise);
    setPixel(px, 18, floorColor[0] - 10 + noise, floorColor[1] - 10 + noise, floorColor[2] - 10 + noise);
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
