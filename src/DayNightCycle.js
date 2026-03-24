const COLOR_KEYS = [
  { t: 0.00, r: 0x08, g: 0x12, b: 0x30, a: 0.42 },
  { t: 0.18, r: 0x0a, g: 0x18, b: 0x38, a: 0.38 },
  { t: 0.23, r: 0x30, g: 0x20, b: 0x40, a: 0.28 },
  { t: 0.27, r: 0xff, g: 0xb0, b: 0x40, a: 0.18 },
  { t: 0.32, r: 0xff, g: 0xe0, b: 0x80, a: 0.08 },
  { t: 0.40, r: 0xff, g: 0xf8, b: 0xe0, a: 0.03 },
  { t: 0.50, r: 0xff, g: 0xff, b: 0xff, a: 0.00 },
  { t: 0.60, r: 0xff, g: 0xf0, b: 0xd0, a: 0.03 },
  { t: 0.68, r: 0xff, g: 0xc0, b: 0x60, a: 0.12 },
  { t: 0.73, r: 0xff, g: 0x88, b: 0x66, a: 0.18 },
  { t: 0.77, r: 0xd0, g: 0x60, b: 0x80, a: 0.22 },
  { t: 0.82, r: 0x40, g: 0x28, b: 0x70, a: 0.32 },
  { t: 0.90, r: 0x10, g: 0x18, b: 0x38, a: 0.40 },
  { t: 1.00, r: 0x08, g: 0x12, b: 0x30, a: 0.42 },
];

const AUDIO_CURVES = {
  birdsong: [
    { t: 0.00, v: 0.0 }, { t: 0.22, v: 0.0 }, { t: 0.28, v: 0.4 },
    { t: 0.35, v: 0.9 }, { t: 0.50, v: 1.0 }, { t: 0.65, v: 0.7 },
    { t: 0.73, v: 0.3 }, { t: 0.80, v: 0.0 }, { t: 1.00, v: 0.0 },
  ],
  crickets: [
    { t: 0.00, v: 1.0 }, { t: 0.20, v: 0.8 }, { t: 0.28, v: 0.2 },
    { t: 0.35, v: 0.0 }, { t: 0.65, v: 0.0 }, { t: 0.73, v: 0.2 },
    { t: 0.80, v: 0.7 }, { t: 0.90, v: 1.0 }, { t: 1.00, v: 1.0 },
  ],
  cicadas: [
    { t: 0.00, v: 0.0 }, { t: 0.30, v: 0.0 }, { t: 0.40, v: 0.5 },
    { t: 0.50, v: 0.8 }, { t: 0.60, v: 1.0 }, { t: 0.70, v: 0.5 },
    { t: 0.78, v: 0.0 }, { t: 1.00, v: 0.0 },
  ],
  wind: [
    { t: 0.00, v: 0.8 }, { t: 0.25, v: 0.6 }, { t: 0.50, v: 0.5 },
    { t: 0.75, v: 0.7 }, { t: 1.00, v: 0.8 },
  ],
  chimes: [
    { t: 0.00, v: 0.6 }, { t: 0.50, v: 1.0 }, { t: 1.00, v: 0.6 },
  ],
};

function slerp(keyframes, t) {
  t = ((t % 1) + 1) % 1;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].t && t <= keyframes[i + 1].t) {
      const seg = (t - keyframes[i].t) / (keyframes[i + 1].t - keyframes[i].t);
      const s = seg * seg * (3 - 2 * seg);
      return { a: keyframes[i], b: keyframes[i + 1], s };
    }
  }
  return { a: keyframes[0], b: keyframes[0], s: 0 };
}

export class DayNightCycle {
  constructor() {
    this.time = 0.35;
    this.mode = 'auto';
    this.cycleDuration = 300;
    this.lanterns = [];
  }

  update(deltaSec) {
    if (this.mode === 'auto') {
      this.time = (this.time + deltaSec / this.cycleDuration) % 1;
    } else if (this.mode === 'realtime') {
      const now = new Date();
      this.time = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
    }
  }

  pin(t) {
    this.mode = 'pinned';
    this.time = ((t % 1) + 1) % 1;
  }

  setAuto() {
    this.mode = 'auto';
  }

  setRealtime() {
    this.mode = 'realtime';
  }

  getOverlay() {
    const { a, b, s } = slerp(COLOR_KEYS, this.time);
    return {
      r: Math.round(a.r + (b.r - a.r) * s),
      g: Math.round(a.g + (b.g - a.g) * s),
      b: Math.round(a.b + (b.b - a.b) * s),
      a: a.a + (b.a - a.a) * s,
    };
  }

  getAudioMultiplier(key) {
    const curve = AUDIO_CURVES[key];
    if (!curve) return 1;
    const { a, b, s } = slerp(curve, this.time);
    return a.v + (b.v - a.v) * s;
  }

  getLanternGlow() {
    const t = this.time;
    if (t >= 0.30 && t <= 0.70) return 0;
    if (t > 0.70 && t <= 0.82) return (t - 0.70) / 0.12;
    if (t > 0.82 || t <= 0.18) return 1;
    if (t > 0.18 && t < 0.30) return 1 - (t - 0.18) / 0.12;
    return 0;
  }

  getPhaseLabel() {
    const t = this.time;
    if (t < 0.22) return 'Night';
    if (t < 0.28) return 'Dawn';
    if (t < 0.35) return 'Morning';
    if (t < 0.65) return 'Day';
    if (t < 0.73) return 'Afternoon';
    if (t < 0.80) return 'Dusk';
    return 'Night';
  }

  getTimeString() {
    const hours = Math.floor(this.time * 24);
    const minutes = Math.floor((this.time * 24 - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  registerLantern(sprite, glow) {
    this.lanterns.push({ sprite, glow });
  }

  updateLanterns() {
    const a = this.getLanternGlow();
    for (const l of this.lanterns) {
      if (l.glow) l.glow.setAlpha(a * 0.7);
    }
  }
}
