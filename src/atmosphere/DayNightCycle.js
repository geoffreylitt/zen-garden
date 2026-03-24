import {
  DAY_CYCLE_MS,
  DAWN_START,
  DAWN_END,
  MIDDAY_START,
  DUSK_START,
  DUSK_END,
} from '../constants.js';

/**
 * Simulates a 24-hour day compressed into DAY_CYCLE_MS.
 * Exposes fractional hour (0-24) and convenience helpers for
 * dawn/midday/dusk that other systems can query each frame.
 */
export class DayNightCycle {
  constructor() {
    this.startTime = Date.now();
    this.hour = DAWN_START;
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    this.hour = (elapsed / DAY_CYCLE_MS) * 24 % 24;
  }

  /** 0-1 fog strength from time-of-day alone (thickest at dawn, gone by midday) */
  get fogTimeFactor() {
    const h = this.hour;
    if (h >= DAWN_START && h < DAWN_END) return 1.0;
    if (h >= DAWN_END && h < MIDDAY_START) {
      return 1.0 - (h - DAWN_END) / (MIDDAY_START - DAWN_END);
    }
    if (h >= MIDDAY_START && h < DUSK_START) return 0.0;
    if (h >= DUSK_START && h < DUSK_END) {
      return (h - DUSK_START) / (DUSK_END - DUSK_START) * 0.6;
    }
    if (h >= DUSK_END || h < DAWN_START) return 0.5;
    return 0.0;
  }

  /** 0-1 overall ambient darkness: 0 = full daylight */
  get darkness() {
    const h = this.hour;
    if (h >= DAWN_START && h < DAWN_END) {
      return 1.0 - (h - DAWN_START) / (DAWN_END - DAWN_START);
    }
    if (h >= DAWN_END && h < DUSK_START) return 0.0;
    if (h >= DUSK_START && h < DUSK_END) {
      return (h - DUSK_START) / (DUSK_END - DUSK_START);
    }
    return 1.0;
  }
}
