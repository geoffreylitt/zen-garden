export function createHouseTexture(scene) {
  const id = 'house_' + Date.now() + '_' + Math.random();
  const w = 40;
  const h = 36;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const setPixel = (px, py, r, g, b, a = 255) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = a;
  };

  const noise = () => Math.floor((Math.random() - 0.5) * 14);

  // --- Colours ---
  const roofDark     = [0x38, 0x38, 0x42];
  const roofMid      = [0x52, 0x52, 0x60];
  const roofLight    = [0x6a, 0x6a, 0x7a];
  const ridgeTile    = [0x28, 0x28, 0x32];
  const wallLight    = [0xc8, 0xa8, 0x78];
  const wallMid      = [0xa8, 0x88, 0x60];
  const wallDark     = [0x88, 0x68, 0x48];
  const beam         = [0x5a, 0x3e, 0x28];
  const doorFill     = [0x30, 0x22, 0x16];
  const shoji        = [0xe8, 0xe0, 0xcc]; // paper screen windows
  const shojiFrame   = [0x6a, 0x50, 0x34];
  const foundation   = [0x70, 0x68, 0x58];
  const foundDark    = [0x52, 0x4c, 0x40];
  const chimney      = [0x60, 0x58, 0x50];

  // ── Upper roof (rows 0-10) ─────────────────────────────────────────────
  // Wide curved eaves, slightly overhanging
  for (let py = 0; py <= 10; py++) {
    // Half-width of roof at this row: wide at eave (py=10), narrow at ridge (py=0)
    const halfW = 2 + (10 - py) * 1.9;
    const cx = w / 2;
    for (let px = 0; px < w; px++) {
      const dist = Math.abs(px - cx);
      if (dist > halfW) continue;

      // Curved upturn at eave edges
      const norm = dist / halfW;
      const upturn = norm * norm * 2.5;
      const effectiveRow = py + upturn;
      if (effectiveRow > 10.5) continue;

      const n = noise();
      if (py <= 1) {
        setPixel(px, py, ridgeTile[0] + n, ridgeTile[1] + n, ridgeTile[2] + n);
      } else if (py <= 4) {
        setPixel(px, py, roofDark[0] + n, roofDark[1] + n, roofDark[2] + n);
      } else if (py <= 7) {
        setPixel(px, py, roofMid[0] + n, roofMid[1] + n, roofMid[2] + n);
      } else {
        setPixel(px, py, roofLight[0] + n, roofLight[1] + n, roofLight[2] + n);
      }
    }
  }

  // Eave shadow line
  for (let px = 2; px < w - 2; px++) {
    setPixel(px, 10, roofDark[0] - 8, roofDark[1] - 8, roofDark[2] - 8);
  }

  // ── Lower roof / overhang band (rows 11-14) ───────────────────────────
  for (let py = 11; py <= 14; py++) {
    for (let px = 1; px < w - 1; px++) {
      const n = noise();
      setPixel(px, py, roofMid[0] + n, roofMid[1] + n, roofMid[2] + n);
    }
  }
  // Shadow under lower eave
  for (let px = 2; px < w - 2; px++) {
    setPixel(px, 14, roofDark[0] - 5, roofDark[1] - 5, roofDark[2] - 5);
  }

  // ── Main walls (rows 15-29) ───────────────────────────────────────────
  for (let py = 15; py <= 29; py++) {
    for (let px = 3; px < w - 3; px++) {
      const n = noise();
      // Corner posts (darker beams)
      if (px <= 5 || px >= w - 6) {
        setPixel(px, py, beam[0] + n, beam[1] + n, beam[2] + n);
      } else if (px === 6 || px === w - 7) {
        setPixel(px, py, wallDark[0] + n, wallDark[1] + n, wallDark[2] + n);
      } else {
        setPixel(px, py, wallLight[0] + n, wallLight[1] + n, wallLight[2] + n);
      }
    }
  }

  // Horizontal beam rail at mid-wall
  for (let px = 3; px < w - 3; px++) {
    const n = noise();
    setPixel(px, 22, beam[0] + n, beam[1] + n, beam[2] + n);
  }

  // ── Shoji screens (paper windows) ────────────────────────────────────
  // Left shoji panel: cols 7-13, rows 16-21
  for (let py = 16; py <= 21; py++) {
    for (let px = 7; px <= 13; px++) {
      const n = noise();
      if (px === 7 || px === 13 || py === 16 || py === 21) {
        setPixel(px, py, shojiFrame[0] + n, shojiFrame[1] + n, shojiFrame[2] + n);
      } else {
        setPixel(px, py, shoji[0] + n, shoji[1] + n, shoji[2] + n);
      }
    }
  }
  // Right shoji panel: cols w-14 to w-8, rows 16-21
  for (let py = 16; py <= 21; py++) {
    for (let px = w - 14; px <= w - 8; px++) {
      const n = noise();
      if (px === w - 14 || px === w - 8 || py === 16 || py === 21) {
        setPixel(px, py, shojiFrame[0] + n, shojiFrame[1] + n, shojiFrame[2] + n);
      } else {
        setPixel(px, py, shoji[0] + n, shoji[1] + n, shoji[2] + n);
      }
    }
  }

  // ── Central entrance door (rows 23-29) ───────────────────────────────
  const doorL = Math.floor(w / 2) - 4;
  const doorR = Math.floor(w / 2) + 4;
  for (let py = 23; py <= 29; py++) {
    for (let px = doorL; px <= doorR; px++) {
      const n = noise();
      if (px === doorL || px === doorR || py === 23) {
        setPixel(px, py, shojiFrame[0] + n, shojiFrame[1] + n, shojiFrame[2] + n);
      } else {
        setPixel(px, py, doorFill[0] + n, doorFill[1] + n, doorFill[2] + n);
      }
    }
  }
  // Door centre divider
  for (let py = 23; py <= 29; py++) {
    const n = noise();
    setPixel(Math.floor(w / 2), py, shojiFrame[0] + n, shojiFrame[1] + n, shojiFrame[2] + n);
  }

  // Lower shoji panels beside door (rows 23-29)
  for (let py = 23; py <= 28; py++) {
    for (let px = 7; px <= 13; px++) {
      const n = noise();
      if (px === 7 || px === 13 || py === 23 || py === 28) {
        setPixel(px, py, shojiFrame[0] + n, shojiFrame[1] + n, shojiFrame[2] + n);
      } else {
        setPixel(px, py, shoji[0] + n, shoji[1] + n, shoji[2] + n);
      }
    }
    for (let px = w - 14; px <= w - 8; px++) {
      const n = noise();
      if (px === w - 14 || px === w - 8 || py === 23 || py === 28) {
        setPixel(px, py, shojiFrame[0] + n, shojiFrame[1] + n, shojiFrame[2] + n);
      } else {
        setPixel(px, py, shoji[0] + n, shoji[1] + n, shoji[2] + n);
      }
    }
  }

  // ── Foundation / platform (rows 30-33) ───────────────────────────────
  for (let py = 30; py <= 33; py++) {
    for (let px = 2; px < w - 2; px++) {
      const n = noise();
      if (py >= 32) {
        setPixel(px, py, foundDark[0] + n, foundDark[1] + n, foundDark[2] + n);
      } else {
        setPixel(px, py, foundation[0] + n, foundation[1] + n, foundation[2] + n);
      }
    }
  }

  // ── Chimney (rows 2-14, right of centre) ─────────────────────────────
  const chx = Math.floor(w * 0.65);
  for (let py = 2; py <= 14; py++) {
    for (let px = chx; px <= chx + 2; px++) {
      const n = noise();
      setPixel(px, py, chimney[0] + n, chimney[1] + n, chimney[2] + n);
    }
  }

  // ── Stepping stones at base (row 34-35) ──────────────────────────────
  const stoneColor = [0x88, 0x80, 0x72];
  const stoneDark  = [0x68, 0x62, 0x58];
  for (let px = 10; px <= 14; px++) {
    setPixel(px, 34, stoneColor[0], stoneColor[1], stoneColor[2]);
    setPixel(px, 35, stoneDark[0], stoneDark[1], stoneDark[2]);
  }
  for (let px = w - 15; px <= w - 11; px++) {
    setPixel(px, 34, stoneColor[0], stoneColor[1], stoneColor[2]);
    setPixel(px, 35, stoneDark[0], stoneDark[1], stoneDark[2]);
  }
  for (let px = Math.floor(w / 2) - 2; px <= Math.floor(w / 2) + 2; px++) {
    setPixel(px, 34, stoneColor[0], stoneColor[1], stoneColor[2]);
    setPixel(px, 35, stoneDark[0], stoneDark[1], stoneDark[2]);
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
