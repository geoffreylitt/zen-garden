import { W, SAND_H, SAND_BASE, GROOVE_COLOR, RIDGE_COLOR,
  RAIN_MAX_PARTICLES, RAIN_STREAK_LENGTH, RAIN_FALL_SPEED,
  RAIN_WIND_DRIFT, RAIN_RIPPLE_MAX, RAIN_PUDDLE_RATE,
  RAIN_SOFTEN_RATE, RAIN_WET_DARKEN } from '../constants.js';

export class RainRenderer {
  constructor(scene, gardenMask, sandCanvas) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.sandCanvas = sandCanvas;
    this.enabled = false;
    this.intensity = 0.5;
    this.particles = [];
    this.ripples = [];
    this.puddles = [];
    this.wetOverlay = null;
    this.rainGfx = null;
    this.softenTimer = 0;
    this.puddleTimer = 0;
    this.wetAmount = 0;
  }

  create() {
    this.rainGfx = this.scene.add.graphics();
    this.rainGfx.setDepth(100);

    this.wetOverlay = this.scene.add.graphics();
    this.wetOverlay.setDepth(50);
    this.wetOverlay.setAlpha(0);
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) {
      this.particles = [];
      this.ripples = [];
      this.wetAmount = 0;
      if (this.rainGfx) this.rainGfx.clear();
      if (this.wetOverlay) {
        this.wetOverlay.clear();
        this.wetOverlay.setAlpha(0);
      }
    }
  }

  setIntensity(value) {
    this.intensity = Math.max(0.1, Math.min(1.0, value));
  }

  update(delta) {
    if (!this.enabled) return;
    const dt = delta / 1000;

    this._spawnParticles();
    this._updateParticles();
    this._updateRipples(dt);
    this._updateWetness(dt);
    this._updateSoften(dt);
    this._updatePuddles(dt);
    this._draw();
  }

  _spawnParticles() {
    const targetCount = Math.floor(RAIN_MAX_PARTICLES * this.intensity);
    const toSpawn = Math.max(0, targetCount - this.particles.length);
    for (let i = 0; i < toSpawn; i++) {
      this.particles.push({
        x: Math.random() * W,
        y: -Math.random() * SAND_H * 0.5,
        speed: RAIN_FALL_SPEED * (0.8 + Math.random() * 0.4) * (0.6 + this.intensity * 0.4),
        drift: RAIN_WIND_DRIFT * (0.5 + Math.random() * 0.5),
        length: RAIN_STREAK_LENGTH * (0.6 + this.intensity * 0.4),
        alpha: 0.15 + Math.random() * 0.25,
      });
    }
  }

  _updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.y += p.speed;
      p.x += p.drift;

      if (p.y >= SAND_H || p.x < 0 || p.x >= W) {
        const gx = Math.floor(p.x);
        const gy = Math.floor(Math.min(p.y, SAND_H - 1));
        if (gx >= 0 && gx < W && gy >= 0 && gy < SAND_H &&
            this.gardenMask.isInGarden(gx, gy) && this.ripples.length < RAIN_RIPPLE_MAX) {
          this.ripples.push({ x: gx, y: gy, radius: 0, maxRadius: 2 + Math.random() * 3, alpha: 0.5, life: 0 });
        }
        this.particles.splice(i, 1);
      }
    }
  }

  _updateRipples(dt) {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.life += dt;
      const duration = 0.6;
      const t = r.life / duration;
      r.radius = r.maxRadius * t;
      r.alpha = 0.5 * (1 - t);
      if (t >= 1) {
        this.ripples.splice(i, 1);
      }
    }
  }

  _updateWetness(dt) {
    const target = this.intensity * RAIN_WET_DARKEN;
    const speed = 0.3 * dt;
    if (this.wetAmount < target) {
      this.wetAmount = Math.min(target, this.wetAmount + speed);
    } else {
      this.wetAmount = Math.max(0, this.wetAmount - speed * 0.3);
    }
  }

  _updateSoften(dt) {
    this.softenTimer += dt;
    const interval = RAIN_SOFTEN_RATE / this.intensity;
    if (this.softenTimer < interval) return;
    this.softenTimer = 0;

    const pixels = this.sandCanvas.pixels;
    const count = Math.floor(30 * this.intensity);

    for (let n = 0; n < count; n++) {
      const x = Math.floor(Math.random() * W);
      const y = Math.floor(Math.random() * SAND_H);
      if (!this.gardenMask.isInGarden(x, y)) continue;

      const i = (y * W + x) * 4;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];

      const isGroove = Math.abs(r - GROOVE_COLOR[0]) < 15 &&
                       Math.abs(g - GROOVE_COLOR[1]) < 15 &&
                       Math.abs(b - GROOVE_COLOR[2]) < 15;
      const isRidge = Math.abs(r - RIDGE_COLOR[0]) < 15 &&
                      Math.abs(g - RIDGE_COLOR[1]) < 15 &&
                      Math.abs(b - RIDGE_COLOR[2]) < 15;

      if (isGroove || isRidge) {
        const blend = 0.08;
        pixels[i]     = Math.round(r + (SAND_BASE[0] - r) * blend);
        pixels[i + 1] = Math.round(g + (SAND_BASE[1] - g) * blend);
        pixels[i + 2] = Math.round(b + (SAND_BASE[2] - b) * blend);
        this.sandCanvas.dirty = true;
      }
    }
  }

  _updatePuddles(dt) {
    this.puddleTimer += dt;
    const interval = RAIN_PUDDLE_RATE / this.intensity;
    if (this.puddleTimer < interval) return;
    this.puddleTimer = 0;

    if (this.puddles.length > 15) return;

    const cx = Math.floor(Math.random() * W);
    const cy = Math.floor(SAND_H * 0.4 + Math.random() * SAND_H * 0.4);
    if (!this.gardenMask.isInGarden(cx, cy)) return;

    const existing = this.puddles.find(p =>
      Math.abs(p.x - cx) < 20 && Math.abs(p.y - cy) < 20);
    if (existing) {
      existing.radius = Math.min(existing.radius + 0.5, 12);
      existing.alpha = Math.min(existing.alpha + 0.02, 0.35);
    } else {
      this.puddles.push({ x: cx, y: cy, radius: 2 + Math.random() * 3, alpha: 0.1 });
    }
  }

  _draw() {
    if (!this.rainGfx) return;
    this.rainGfx.clear();

    for (const p of this.particles) {
      this.rainGfx.lineStyle(1, 0xb0c0d0, p.alpha);
      this.rainGfx.beginPath();
      this.rainGfx.moveTo(p.x, p.y);
      this.rainGfx.lineTo(p.x - p.drift * 0.5, p.y - p.length);
      this.rainGfx.strokePath();
    }

    for (const r of this.ripples) {
      if (r.radius < 0.5) continue;
      this.rainGfx.lineStyle(1, 0x9ab0c8, r.alpha);
      this.rainGfx.strokeCircle(r.x, r.y, r.radius);
    }

    for (const p of this.puddles) {
      this.rainGfx.fillStyle(0x5a7088, p.alpha);
      this.rainGfx.fillEllipse(p.x, p.y, p.radius * 2.5, p.radius * 1.2);
      this.rainGfx.lineStyle(1, 0x8aa8c0, p.alpha * 0.5);
      this.rainGfx.strokeEllipse(p.x, p.y, p.radius * 2.5, p.radius * 1.2);
    }

    if (this.wetOverlay) {
      this.wetOverlay.clear();
      if (this.wetAmount > 0.01) {
        this.wetOverlay.fillStyle(0x2a3a4a, 1);
        this.wetOverlay.fillRect(0, 0, W, SAND_H);
        this.wetOverlay.setAlpha(this.wetAmount);
      } else {
        this.wetOverlay.setAlpha(0);
      }
    }
  }

  destroy() {
    if (this.rainGfx) this.rainGfx.destroy();
    if (this.wetOverlay) this.wetOverlay.destroy();
    this.particles = [];
    this.ripples = [];
    this.puddles = [];
  }
}
