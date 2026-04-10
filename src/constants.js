export const W = 480;
export const H = 360;
export const TOOLBAR_H = 30;
export const SAND_H = H - TOOLBAR_H;

// Sand colors — vivid rainbow fill is driven per-pixel in SandCanvas.fill();
// these are kept as vivid fallbacks/overrides for rake grooves and ridges.
export const SAND_BASE = [0xff, 0x80, 0xc0]; // hot pink fallback
export const GROOVE_COLOR = [0x00, 0xff, 0xff]; // electric cyan groove
export const RIDGE_COLOR = [0xff, 0xff, 0x00]; // neon yellow ridge
export const BG_COLOR = [0x18, 0x00, 0x40]; // deep purple surround

// Rake config
export const TINE_COUNT = 5;
export const TINE_SPACING = 3;

// Pentatonic chime frequencies (C5-D6 range)
export const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.50, 1174.66];
