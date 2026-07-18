/**
 * Procedural pixel-art koi fish texture generator.
 * Fish face RIGHT in texture space (head at right end, forked tail at left end).
 * Phaser's sprite.rotation then points the fish in its direction of travel.
 */

const VARIANTS = [
  { body: [0xe0, 0x62, 0x18], patch: [0xff, 0xff, 0xff], fin: [0xff, 0x90, 0x30] }, // orange kohaku
  { body: [0xb8, 0x18, 0x18], patch: [0xff, 0xff, 0xff], fin: [0xff, 0x78, 0x78] }, // red kohaku
  { body: [0xe0, 0xa0, 0x10], patch: [0xff, 0xf0, 0xd0], fin: [0xff, 0xd0, 0x50] }, // golden yamabuki
];

export function createKoiTexture(scene, variant = 0) {
  const id = 'koi_' + variant;
  if (scene.textures.exists(id)) return id;

  const w = 22;
  const h = 10;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const v = VARIANTS[variant % VARIANTS.length];

  const setPixel = (px, py, r, g, b, a = 255) => {
    if (px < 0 || px >= w || py < 0 || py >= h) return;
    const i = (py * w + px) * 4;
    d[i] = Math.min(255, Math.max(0, r));
    d[i + 1] = Math.min(255, Math.max(0, g));
    d[i + 2] = Math.min(255, Math.max(0, b));
    d[i + 3] = a;
  };

  // Body: oval center at (13, 5), radii rx=6.5, ry=3.5
  // This gives body coverage:
  //   y=2,8 → x=10..16   y=3,7 → x=8..18   y=4,5,6 → x=7..19
  const bx = 13, by = 5, brx = 6.5, bry = 3.5;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - bx) / brx;
      const dy = (py - by) / bry;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= 1.0) {
        const brightness = Math.floor((1.0 - dist2) * 55);
        setPixel(px, py,
          v.body[0] + brightness,
          v.body[1] + brightness,
          v.body[2] + brightness,
        );
      }
    }
  }

  // White/color patches — give the fish its distinctive markings
  setPixel(11, 4, v.patch[0], v.patch[1], v.patch[2]);
  setPixel(12, 4, v.patch[0], v.patch[1], v.patch[2]);
  setPixel(12, 5, v.patch[0], v.patch[1], v.patch[2]);
  setPixel(11, 5, v.patch[0], v.patch[1], v.patch[2], 180);

  // Eye near right (head) end of body
  setPixel(17, 4, 0x08, 0x08, 0x08);

  // Dorsal fin ridge (top center of body)
  setPixel(13, 1, v.fin[0], v.fin[1], v.fin[2], 210);
  setPixel(14, 1, v.fin[0], v.fin[1], v.fin[2], 190);
  setPixel(15, 1, v.fin[0], v.fin[1], v.fin[2], 160);

  // Pectoral fin (belly side)
  setPixel(13, 8, v.fin[0], v.fin[1], v.fin[2], 210);
  setPixel(14, 8, v.fin[0], v.fin[1], v.fin[2], 180);

  // Tail: forked, fanning from the left (tail) end of the body
  const tc = [v.body[0] - 20, v.body[1] - 10, v.body[2] - 5];

  // Tail connector (narrow body segment transitioning to fork)
  setPixel(7, 4, tc[0], tc[1], tc[2]);
  setPixel(7, 5, tc[0], tc[1], tc[2]);
  setPixel(6, 4, tc[0], tc[1], tc[2], 200);
  setPixel(6, 5, tc[0], tc[1], tc[2], 200);

  // Upper tail prong — arcs up-left from y=3 edge of body
  setPixel(7, 3, tc[0], tc[1], tc[2]);
  setPixel(6, 3, tc[0], tc[1], tc[2]);
  setPixel(5, 2, tc[0], tc[1], tc[2]);
  setPixel(4, 1, tc[0], tc[1], tc[2]);
  setPixel(3, 1, tc[0], tc[1], tc[2], 220);
  setPixel(2, 0, tc[0], tc[1], tc[2], 180);

  // Lower tail prong — arcs down-left from y=7 edge of body
  setPixel(7, 6, tc[0], tc[1], tc[2]);
  setPixel(6, 6, tc[0], tc[1], tc[2]);
  setPixel(5, 7, tc[0], tc[1], tc[2]);
  setPixel(4, 8, tc[0], tc[1], tc[2]);
  setPixel(3, 8, tc[0], tc[1], tc[2], 220);
  setPixel(2, 9, tc[0], tc[1], tc[2], 180);

  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}

/**
 * Semi-transparent oval shadow — suggests the fish is "under" the sand surface.
 */
export function createKoiShadowTexture(scene) {
  const id = 'koi_shadow';
  if (scene.textures.exists(id)) return id;

  const w = 24;
  const h = 10;
  const tex = scene.textures.createCanvas(id, w, h);
  const ctx = tex.context;
  const imgData = ctx.createImageData(w, h);
  const d = imgData.data;

  const cx = w / 2, cy = h / 2;
  const rx = w / 2 - 1, ry = h / 2 - 1;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const dx = (px - cx) / rx;
      const dy = (py - cy) / ry;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= 1.0) {
        const a = Math.floor((1 - dist2) * 50);
        const i = (py * w + px) * 4;
        d[i] = 0x28; d[i + 1] = 0x1e; d[i + 2] = 0x10; d[i + 3] = a;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  tex.refresh();
  return id;
}
