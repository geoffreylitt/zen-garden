export const W = 480;
export const H = 360;
export const TOOLBAR_H = 30;
export const SAND_H = H - TOOLBAR_H;

// Sand color palettes
export const SAND_PALETTES = {
  TAN: {
    label: 'TAN',
    base:   [0xd2, 0xc4, 0xa0],
    groove: [0xb0, 0xa0, 0x78],
    ridge:  [0xe8, 0xdc, 0xbc],
  },
  WHITE: {
    label: 'WHITE',
    base:   [0xee, 0xea, 0xe0],
    groove: [0xcc, 0xc4, 0xb4],
    ridge:  [0xfa, 0xf8, 0xf2],
  },
  CHARCOAL: {
    label: 'DARK',
    base:   [0x52, 0x4e, 0x48],
    groove: [0x36, 0x32, 0x2c],
    ridge:  [0x6a, 0x66, 0x60],
  },
};

export const PALETTE_ORDER = ['TAN', 'WHITE', 'CHARCOAL'];

// Legacy color exports (used by BorderRenderer and BG)
export const SAND_BASE   = SAND_PALETTES.TAN.base;
export const GROOVE_COLOR = SAND_PALETTES.TAN.groove;
export const RIDGE_COLOR  = SAND_PALETTES.TAN.ridge;
export const BG_COLOR = [0x3a, 0x3a, 0x36];

// Rake config
export const TINE_COUNT = 5;
export const TINE_SPACING = 3;

// Pentatonic chime frequencies (C5-D6 range)
export const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.50, 1174.66];
