export const W = 480;
export const H = 360;
export const TOOLBAR_H = 30;
export const SAND_H = H - TOOLBAR_H;

// Sand colors
export const SAND_BASE = [0xd2, 0xc4, 0xa0];
export const GROOVE_COLOR = [0xb0, 0xa0, 0x78];
export const RIDGE_COLOR = [0xe8, 0xdc, 0xbc];
export const BG_COLOR = [0x3a, 0x3a, 0x36];

// Rake config
export const TINE_COUNT = 5;
export const TINE_SPACING = 3;

// Pentatonic chime frequencies (C5-D6 range)
export const CHIME_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.50, 1174.66];

// Day/night cycle
export const DAY_CYCLE_MS = 8 * 60 * 1000; // 8 minutes per full day
export const DAWN_START = 5;
export const DAWN_END = 7;
export const MIDDAY_START = 10;
export const MIDDAY_END = 16;
export const DUSK_START = 17;
export const DUSK_END = 19;

// Fog
export const FOG_WISP_COUNT = 45;
export const FOG_REDRAW_INTERVAL = 80; // ms between fog texture redraws
export const FOG_MUFFLE_MIN_FREQ = 800;
export const FOG_MUFFLE_MAX_FREQ = 20000;
export const FOG_POST_RAIN_BOOST = 0.4;
export const FOG_POST_RAIN_DECAY = 30000; // ms for post-rain fog to fade
