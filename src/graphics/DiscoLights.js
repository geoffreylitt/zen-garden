import { W, SAND_H, DISCO_COLORS } from '../constants.js';

// Animated disco spotlights and sparkles overlay
export class DiscoLights {
  constructor(scene) {
    this.scene = scene;
    this.gfx = null;
    this.sparkles = [];
    this.lights = this._initLights();
    this.time = 0;
  }

  _initLights() {
    // Each light: angle offset, rotation speed, color index, radius, origin
    return [
      { angle: 0,             speed: 0.6,  colorIdx: 0, radius: 0.35, ox: 0.3, oy: 0.2 },
      { angle: Math.PI,       speed: -0.5, colorIdx: 2, radius: 0.30, ox: 0.7, oy: 0.2 },
      { angle: Math.PI / 2,   speed: 0.8,  colorIdx: 4, radius: 0.28, ox: 0.5, oy: 0.15 },
      { angle: Math.PI * 1.5, speed: -0.7, colorIdx: 6, radius: 0.32, ox: 0.2, oy: 0.3 },
    ];
  }

  create() {
    this.gfx = this.scene.add.graphics();
    this.gfx.setDepth(10);
  }

  update(delta, beatPhase) {
    this.time += delta / 1000;
    this.gfx.clear();

    const cx = W / 2;
    const cy = SAND_H / 2;

    // Draw rotating spotlights
    for (const light of this.lights) {
      light.angle += light.speed * (delta / 1000);

      const originX = light.ox * W;
      const originY = light.oy * SAND_H;

      // The spotlight points from the edge top area into the floor
      const targetX = cx + Math.cos(light.angle) * W * light.radius;
      const targetY = cy + Math.sin(light.angle) * SAND_H * light.radius;

      const color = DISCO_COLORS[light.colorIdx];
      // Pulse alpha with beat
      const alpha = 0.06 + beatPhase * 0.10;

      // Draw cone: a triangle from origin to spread around target
      const dx = targetX - originX;
      const dy = targetY - originY;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len;
      const ny = dx / len;
      const spread = 22;

      this.gfx.fillStyle(color, alpha);
      this.gfx.beginPath();
      this.gfx.moveTo(originX, originY);
      this.gfx.lineTo(targetX + nx * spread, targetY + ny * spread);
      this.gfx.lineTo(targetX - nx * spread, targetY - ny * spread);
      this.gfx.closePath();
      this.gfx.fillPath();

      // Bright spot at light target
      this.gfx.fillStyle(color, 0.15 + beatPhase * 0.2);
      this.gfx.fillCircle(targetX, targetY, 10 + beatPhase * 8);
    }

    // Spawn sparkles on beat
    if (beatPhase > 0.7) {
      for (let i = 0; i < 3; i++) {
        this._spawnSparkle(cx, cy);
      }
    }

    // Update and draw sparkles
    this.sparkles = this.sparkles.filter(s => s.life > 0);
    for (const s of this.sparkles) {
      s.x += s.vx * delta / 1000;
      s.y += s.vy * delta / 1000;
      s.life -= delta / 1000;
      const a = Math.max(0, s.life / s.maxLife);
      this.gfx.fillStyle(s.color, a);
      const r = 1.5 + a * 2;
      this.gfx.fillRect(s.x - r / 2, s.y - r / 2, r, r);
    }
  }

  _spawnSparkle(cx, cy) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 60;
    const color = DISCO_COLORS[Math.floor(Math.random() * DISCO_COLORS.length)];
    // Disco ball sparkles radiate from near the center-top area
    const bx = cx + (Math.random() - 0.5) * 40;
    const by = cy * 0.3 + Math.random() * 20;
    this.sparkles.push({
      x: bx,
      y: by,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 0.6 + Math.random() * 0.8,
      maxLife: 0.6 + Math.random() * 0.8,
    });
  }
}
