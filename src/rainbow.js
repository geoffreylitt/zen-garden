/**
 * Rainbow color utilities — because zen can be VIBRANT
 */

// Convert HSL to RGB array [r, g, b] (0-255)
export function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// Get rainbow hue (0-360) for a given x coordinate across a given width
export function rainbowHue(x, width, offset = 0) {
  return ((x / width) * 360 + offset) % 360;
}

// RGB array -> Phaser hex color number
export function rgbToHex(r, g, b) {
  return (r << 16) | (g << 8) | b;
}
