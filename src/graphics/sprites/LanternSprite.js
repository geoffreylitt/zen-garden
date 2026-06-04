export function createLanternTexture(scene) {
  const id = 'lantern_' + Date.now() + '_' + Math.random();
  // Extra canvas room so the glow halo can bleed outside the stone structure
  const w = 20;
  const h = 22;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const setPixel = (px, py, r, g, b, a = 255) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
  };

  const n = () => Math.floor((Math.random() - 0.5) * 14);

  // Stone palette (warm grey tones)
  const sL = [0xb8, 0xaa, 0x8e]; // light face
  const sM = [0x96, 0x8a, 0x72]; // mid tone
  const sD = [0x6e, 0x64, 0x52]; // shadow

  // --- PASS 1: Soft warm glow halo centered on the fire chamber ---
  // Fire chamber occupies roughly x=6-13, y=8-13 in this canvas.
  const gcx = 9.5;
  const gcy = 10.5;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = px - gcx;
      const dy = (py - gcy) * 1.2; // slightly taller spread vertically
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 7.5) {
        const t = 1 - dist / 7.5;
        const alpha = Math.floor(t * t * 85);
        if (alpha > 3) {
          setPixel(px, py, 0xff, 0xcc, 0x55, alpha);
        }
      }
    }
  }

  // --- PASS 2: Stone structure (opaque pixels overwrite glow) ---

  // Hoju (round finial) — y=1, x=9-10
  setPixel(9,  1, sL[0] + n(), sL[1] + n(), sL[2] + n());
  setPixel(10, 1, sM[0] + n(), sM[1] + n(), sM[2] + n());

  // Kasa (roof cap) — trapezoidal, y=2-5
  // y=2: 4 px wide
  for (let px = 8; px <= 11; px++) {
    setPixel(px, 2, sL[0] + n(), sL[1] + n(), sL[2] + n());
  }
  // y=3: 8 px wide
  for (let px = 6; px <= 13; px++) {
    const c = (px === 6 || px === 13) ? sD : sL;
    setPixel(px, 3, c[0] + n(), c[1] + n(), c[2] + n());
  }
  // y=4: 10 px wide
  for (let px = 5; px <= 14; px++) {
    const c = (px === 5 || px === 14) ? sD : sM;
    setPixel(px, 4, c[0] + n(), c[1] + n(), c[2] + n());
  }
  // y=5: eave (dark underside, 12 px)
  for (let px = 4; px <= 15; px++) {
    setPixel(px, 5, sD[0] + n(), sD[1] + n(), sD[2] + n());
  }

  // Hibukuro (fire chamber) — y=6-13, x=6-13
  // Top cap row
  for (let px = 6; px <= 13; px++) {
    setPixel(px, 6, sM[0] + n(), sM[1] + n(), sM[2] + n());
  }
  // Left wall (shadow side)
  for (let py = 7; py <= 12; py++) {
    setPixel(6, py, sD[0] + n(), sD[1] + n(), sD[2] + n());
  }
  // Right wall (lit side)
  for (let py = 7; py <= 12; py++) {
    setPixel(13, py, sL[0] + n(), sL[1] + n(), sL[2] + n());
  }
  // Inner left wall (warm stone, slightly lit by glow)
  for (let py = 7; py <= 12; py++) {
    setPixel(7, py, 0x8a + n(), 0x7e + n(), 0x62 + n());
  }
  // Inner right wall
  for (let py = 7; py <= 12; py++) {
    setPixel(12, py, 0x8a + n(), 0x7e + n(), 0x62 + n());
  }
  // Amber interior — the glowing flame inside
  for (let py = 7; py <= 12; py++) {
    for (let px = 8; px <= 11; px++) {
      const dx = Math.abs(px - 9.5);
      const dy = Math.abs(py - 9.5);
      const edgeDist = Math.max(dx, dy);
      if (edgeDist < 0.8) {
        setPixel(px, py, 0xff, 0xf0, 0xaa); // bright warm center
      } else if (edgeDist < 1.5) {
        setPixel(px, py, 0xff, 0xd0, 0x66); // amber
      } else {
        setPixel(px, py, 0xff, 0xaa, 0x44); // orange edge
      }
    }
  }
  // Small window openings in the left and right walls (middle rows)
  // — glow visible through the openings
  setPixel(6,  9, 0xff, 0xbb, 0x44); // left window bright
  setPixel(6, 10, 0xff, 0xbb, 0x44);
  setPixel(13, 9, 0xdd, 0x99, 0x33); // right window (facing away, dimmer)
  setPixel(13, 10, 0xdd, 0x99, 0x33);
  // Bottom of fire chamber
  for (let px = 6; px <= 13; px++) {
    setPixel(px, 13, sD[0] + n(), sD[1] + n(), sD[2] + n());
  }

  // Nakadai (intermediate cap/platform) — y=14, x=5-14
  for (let px = 5; px <= 14; px++) {
    const c = (px === 5 || px === 14) ? sD : sL;
    setPixel(px, 14, c[0] + n(), c[1] + n(), c[2] + n());
  }

  // Sao (post/column) — y=15-16, x=8-11
  for (let py = 15; py <= 16; py++) {
    for (let px = 8; px <= 11; px++) {
      const c = px === 8 ? sD : (px === 11 ? sL : sM);
      setPixel(px, py, c[0] + n(), c[1] + n(), c[2] + n());
    }
  }

  // Kidan (base slab) — y=17-19, x=4-15
  for (let py = 17; py <= 19; py++) {
    for (let px = 4; px <= 15; px++) {
      const c = py === 17 ? sL : (py === 18 ? sM : sD);
      setPixel(px, py, c[0] + n(), c[1] + n(), c[2] + n());
    }
  }

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
