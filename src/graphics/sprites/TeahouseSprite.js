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

  // Wild neon palette
  const roofBase      = [0x22, 0x00, 0xcc]; // deep electric blue
  const roofHighlight = [0x88, 0x00, 0xff]; // vivid purple
  const wallBase      = [0xff, 0x00, 0x99]; // hot magenta
  const wallDark      = [0xcc, 0x00, 0x66]; // deep pink
  const floorColor    = [0xff, 0x88, 0x00]; // neon orange
  const doorColor     = [0x00, 0xff, 0xcc]; // electric teal
  const windowColor   = [0xff, 0xff, 0x00]; // neon yellow

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
          const noise = Math.floor((Math.random() - 0.5) * 14);
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
    const noise = Math.floor((Math.random() - 0.5) * 10);
    setPixel(px, 8, roofBase[0] - 15 + noise, roofBase[1] + noise, roofBase[2] + noise);
  }

  // Walls
  for (let py = 9; py < 17; py++) {
    for (let px = 4; px < w - 4; px++) {
      const noise = Math.floor((Math.random() - 0.5) * 18);
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
      const noise = Math.floor((Math.random() - 0.5) * 10);
      setPixel(px, py, doorColor[0] + noise, doorColor[1] + noise, doorColor[2] + noise);
    }
  }

  // Windows on each side
  for (let py = 11; py < 14; py++) {
    for (let px = 6; px < 9; px++) {
      setPixel(px, py, windowColor[0], windowColor[1], windowColor[2]);
    }
    for (let px = w - 9; px < w - 6; px++) {
      setPixel(px, py, windowColor[0], windowColor[1], windowColor[2]);
    }
  }

  // Floor/foundation — neon orange
  for (let px = 3; px < w - 3; px++) {
    const noise = Math.floor((Math.random() - 0.5) * 12);
    setPixel(px, 17, floorColor[0] + noise, floorColor[1] + noise, floorColor[2] + noise);
    setPixel(px, 18, floorColor[0] - 10 + noise, floorColor[1] - 15 + noise, floorColor[2] + noise);
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
