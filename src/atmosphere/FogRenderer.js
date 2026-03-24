import {
  W,
  SAND_H,
  FOG_WISP_COUNT,
  FOG_REDRAW_INTERVAL,
  FOG_POST_RAIN_BOOST,
  FOG_POST_RAIN_DECAY,
} from '../constants.js';

/**
 * Renders soft, drifting fog wisps over the garden using a Phaser canvas
 * texture that is redrawn periodically. Each wisp is an elliptical
 * gradient that drifts horizontally and has slight vertical oscillation.
 *
 * Density is driven by:
 *   baseDensity (user slider: 0-1)
 *   × dayNight.fogTimeFactor (time-of-day)
 *   + post-rain lingering boost
 */
export class FogRenderer {
  constructor(scene) {
    this.scene = scene;
    this.baseDensity = 0.6;
    this.effectiveDensity = 0;
    this.wisps = [];
    this.texture = null;
    this.image = null;
    this.lastRedraw = 0;
    this.rainStopTime = 0;
    this.isRaining = false;
  }

  create() {
    this.texture = this.scene.textures.createCanvas('fog', W, SAND_H);
    this.image = this.scene.add.image(W / 2, SAND_H / 2, 'fog');
    this.image.setDepth(100);
    this.image.setAlpha(1);

    this._initWisps();
  }

  _initWisps() {
    this.wisps = [];
    for (let i = 0; i < FOG_WISP_COUNT; i++) {
      this.wisps.push(this._makeWisp());
    }
  }

  _makeWisp(offscreen) {
    const w = 60 + Math.random() * 160;
    const h = 20 + Math.random() * 40;
    return {
      x: offscreen ? W + w * 0.5 + Math.random() * W * 0.3 : Math.random() * W,
      y: Math.random() * SAND_H,
      w,
      h,
      speed: 2 + Math.random() * 5,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.06 + Math.random() * 0.12,
      yAmp: 4 + Math.random() * 12,
      yFreq: 0.3 + Math.random() * 0.4,
    };
  }

  notifyRainStart() {
    this.isRaining = true;
  }

  notifyRainStop() {
    this.isRaining = false;
    this.rainStopTime = Date.now();
  }

  update(time, delta, dayNight) {
    const dt = delta / 1000;

    let timeFactor = dayNight ? dayNight.fogTimeFactor : 0.5;
    let rainBoost = 0;
    if (this.isRaining) {
      rainBoost = FOG_POST_RAIN_BOOST;
    } else if (this.rainStopTime > 0) {
      const since = Date.now() - this.rainStopTime;
      if (since < FOG_POST_RAIN_DECAY) {
        rainBoost = FOG_POST_RAIN_BOOST * (1 - since / FOG_POST_RAIN_DECAY);
      }
    }

    this.effectiveDensity = Math.min(1, this.baseDensity * timeFactor + rainBoost);

    for (const wisp of this.wisps) {
      wisp.x -= wisp.speed * dt;
      wisp.phase += wisp.yFreq * dt;

      if (wisp.x + wisp.w * 0.5 < 0) {
        Object.assign(wisp, this._makeWisp(true));
      }
    }

    if (time - this.lastRedraw > FOG_REDRAW_INTERVAL) {
      this.lastRedraw = time;
      this._redraw();
    }
  }

  _redraw() {
    const ctx = this.texture.context;
    ctx.clearRect(0, 0, W, SAND_H);

    if (this.effectiveDensity <= 0.001) {
      this.texture.refresh();
      return;
    }

    const d = this.effectiveDensity;

    for (const wisp of this.wisps) {
      const cx = wisp.x;
      const cy = wisp.y + Math.sin(wisp.phase) * wisp.yAmp;
      const rw = wisp.w * 0.5;
      const rh = wisp.h * 0.5;
      const alpha = wisp.opacity * d;

      if (alpha < 0.003) continue;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, rh / rw);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rw);
      grad.addColorStop(0, `rgba(200, 210, 220, ${alpha})`);
      grad.addColorStop(0.5, `rgba(190, 200, 210, ${alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(190, 200, 210, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rw, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    this._drawDepthGradient(ctx, d);
    this.texture.refresh();
  }

  /** Subtle gradient at the top to create depth/distance obscuring */
  _drawDepthGradient(ctx, density) {
    const gradH = SAND_H * 0.45;
    const grad = ctx.createLinearGradient(0, 0, 0, gradH);
    const topAlpha = density * 0.25;
    grad.addColorStop(0, `rgba(200, 210, 220, ${topAlpha})`);
    grad.addColorStop(0.6, `rgba(200, 210, 220, ${topAlpha * 0.3})`);
    grad.addColorStop(1, 'rgba(200, 210, 220, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, gradH);
  }
}
