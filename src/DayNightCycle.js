const KEYFRAMES = [
  { t: 0.00, r:  15, g:  20, b:  65, a: 0.50, sx:  1, sy: 2, sa: 0.12, sl: 4  },
  { t: 0.18, r:  20, g:  22, b:  60, a: 0.42, sx:  4, sy: 2, sa: 0.10, sl: 6  },
  { t: 0.22, r:  80, g:  50, b:  45, a: 0.28, sx:  7, sy: 3, sa: 0.18, sl: 10 },
  { t: 0.27, r: 220, g: 150, b:  50, a: 0.18, sx:  9, sy: 3, sa: 0.25, sl: 14 },
  { t: 0.32, r: 255, g: 210, b: 120, a: 0.08, sx:  6, sy: 2, sa: 0.20, sl: 8  },
  { t: 0.42, r: 255, g: 250, b: 230, a: 0.03, sx:  3, sy: 2, sa: 0.16, sl: 4  },
  { t: 0.50, r: 255, g: 255, b: 250, a: 0.01, sx:  0, sy: 1, sa: 0.12, sl: 3  },
  { t: 0.58, r: 255, g: 250, b: 230, a: 0.03, sx: -3, sy: 2, sa: 0.16, sl: 4  },
  { t: 0.68, r: 255, g: 200, b: 100, a: 0.10, sx: -6, sy: 2, sa: 0.22, sl: 8  },
  { t: 0.73, r: 255, g: 130, b:  60, a: 0.20, sx: -9, sy: 3, sa: 0.28, sl: 14 },
  { t: 0.78, r: 180, g:  70, b:  80, a: 0.28, sx: -7, sy: 3, sa: 0.18, sl: 10 },
  { t: 0.83, r:  50, g:  30, b:  60, a: 0.38, sx: -4, sy: 2, sa: 0.12, sl: 5  },
  { t: 0.90, r:  20, g:  22, b:  62, a: 0.46, sx: -1, sy: 2, sa: 0.10, sl: 4  },
  { t: 1.00, r:  15, g:  20, b:  65, a: 0.50, sx:  1, sy: 2, sa: 0.12, sl: 4  },
];

export class DayNightCycle {
  constructor() {
    this.time = 0.35;
    this.pinned = false;
    this.syncRealTime = false;
    this.cycleDuration = 240;
  }

  update(deltaMs) {
    if (this.pinned) return;
    if (this.syncRealTime) {
      const now = new Date();
      this.time = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
      return;
    }
    this.time = (this.time + (deltaMs / 1000) / this.cycleDuration) % 1;
  }

  setTime(t) {
    this.time = ((t % 1) + 1) % 1;
  }

  getPhase() {
    const t = this.time;
    if (t < 0.22 || t >= 0.83) return 'night';
    if (t < 0.32) return 'dawn';
    if (t < 0.68) return 'day';
    return 'dusk';
  }

  getPhaseLabel() {
    const t = this.time;
    const hours = Math.floor(t * 24);
    const minutes = Math.floor((t * 24 - hours) * 60);
    const phase = this.getPhase();
    const phaseName = phase.charAt(0).toUpperCase() + phase.slice(1);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} \u2014 ${phaseName}`;
  }

  getState() {
    const t = this.time;
    let i0 = 0;
    for (let i = 0; i < KEYFRAMES.length - 1; i++) {
      if (t >= KEYFRAMES[i].t && t < KEYFRAMES[i + 1].t) {
        i0 = i;
        break;
      }
    }
    const kf0 = KEYFRAMES[i0];
    const kf1 = KEYFRAMES[i0 + 1];
    const range = kf1.t - kf0.t;
    const frac = range > 0 ? (t - kf0.t) / range : 0;
    const s = frac * frac * (3 - 2 * frac);
    const lerp = (a, b) => a + (b - a) * s;

    return {
      overlayR: lerp(kf0.r, kf1.r),
      overlayG: lerp(kf0.g, kf1.g),
      overlayB: lerp(kf0.b, kf1.b),
      overlayA: lerp(kf0.a, kf1.a),
      shadowX:  lerp(kf0.sx, kf1.sx),
      shadowY:  lerp(kf0.sy, kf1.sy),
      shadowAlpha: lerp(kf0.sa, kf1.sa),
      shadowLen:   lerp(kf0.sl, kf1.sl),
      phase: this.getPhase(),
    };
  }

  getSoundMultipliers() {
    const t = this.time;

    let birdsong = 0;
    if      (t >= 0.22 && t < 0.30) birdsong = (t - 0.22) / 0.08;
    else if (t >= 0.30 && t < 0.60) birdsong = 1;
    else if (t >= 0.60 && t < 0.72) birdsong = 1 - (t - 0.60) / 0.12;

    let crickets = 0;
    if      (t >= 0.72 && t < 0.82) crickets = (t - 0.72) / 0.10;
    else if (t >= 0.82 || t < 0.18) crickets = 1;
    else if (t >= 0.18 && t < 0.28) crickets = 1 - (t - 0.18) / 0.10;

    let frogs = 0;
    if      (t >= 0.75 && t < 0.84) frogs = (t - 0.75) / 0.09;
    else if (t >= 0.84 || t < 0.15) frogs = 1;
    else if (t >= 0.15 && t < 0.25) frogs = 1 - (t - 0.15) / 0.10;

    let cicadas = 0;
    if      (t >= 0.35 && t < 0.45) cicadas = (t - 0.35) / 0.10;
    else if (t >= 0.45 && t < 0.72) cicadas = 1;
    else if (t >= 0.72 && t < 0.80) cicadas = 1 - (t - 0.72) / 0.08;

    let lanternGlow = 0;
    if      (t >= 0.72 && t < 0.82) lanternGlow = (t - 0.72) / 0.10;
    else if (t >= 0.82 || t < 0.20) lanternGlow = 1;
    else if (t >= 0.20 && t < 0.28) lanternGlow = 1 - (t - 0.20) / 0.08;

    return { wind: 1, chimes: 1, birdsong, crickets, frogs, cicadas, lanternGlow };
  }
}
