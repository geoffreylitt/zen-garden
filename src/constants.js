export const W = 480;
export const H = 360;
export const TOOLBAR_H = 30;
export const SAND_H = H - TOOLBAR_H;

// Sand colors — vibrant rainbow mode 🌈
export const SAND_BASE = [0xff, 0xee, 0x55]; // kept for fallback; fill uses rainbow
export const GROOVE_COLOR = [0xff, 0x00, 0xcc]; // kept for fallback; rake uses rainbow
export const RIDGE_COLOR = [0x00, 0xff, 0xff];  // kept for fallback; rake uses rainbow
export const BG_COLOR = [0x0d, 0x00, 0x2a];     // deep indigo background

// Rake config
export const TINE_COUNT = 5;
export const TINE_SPACING = 3;

// Pentatonic chime frequencies (C5-D6 range)
export const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.50, 1174.66];
