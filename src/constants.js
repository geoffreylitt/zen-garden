export const W = 480;
export const H = 360;
export const TOOLBAR_H = 30;
export const SAND_H = H - TOOLBAR_H;

// Day palette
export const DAY_THEME = {
  sandBase: [0xd2, 0xc4, 0xa0],
  grooveColor: [0xb0, 0xa0, 0x78],
  ridgeColor: [0xe8, 0xdc, 0xbc],
  bgColor: [0x3a, 0x3a, 0x36],
  borderColor: 0x888880,
};

// Night palette
export const NIGHT_THEME = {
  sandBase: [0x3c, 0x44, 0x58],
  grooveColor: [0x28, 0x30, 0x44],
  ridgeColor: [0x58, 0x66, 0x80],
  bgColor: [0x0e, 0x10, 0x18],
  borderColor: 0x607080,
};

// Legacy exports (day values) kept for any direct imports
export const SAND_BASE = DAY_THEME.sandBase;
export const GROOVE_COLOR = DAY_THEME.grooveColor;
export const RIDGE_COLOR = DAY_THEME.ridgeColor;
export const BG_COLOR = DAY_THEME.bgColor;

// Rake config
export const TINE_COUNT = 5;
export const TINE_SPACING = 3;

// Pentatonic chime frequencies (C5-D6 range)
export const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.50, 1174.66];
