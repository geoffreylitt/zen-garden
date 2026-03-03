import { W, SAND_H } from '../constants.js';
import { createWandererTexture } from '../graphics/sprites/WandererSprite.js';

const NUM_WANDERERS = 4;
const SPEED = 8;           // pixels per second
const TARGET_RADIUS = 6;   // how close before picking new target
const OBSTACLE_RADIUS = 20; // avoidance detection range
const STEER_STRENGTH = 40;  // avoidance force strength
const MARGIN = 30;          // inset from garden edge for target picking

export class Wanderers {
  constructor(scene, gardenMask) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.wanderers = [];
    this.spawn();
  }

  spawn() {
    for (let i = 0; i < NUM_WANDERERS; i++) {
      const pos = this.randomGardenPoint();
      if (!pos) continue;
      const key = createWandererTexture(this.scene);
      const sprite = this.scene.add.image(pos.x, pos.y, key);
      sprite.setScale(2);
      sprite.setDepth(5);

      const target = this.randomGardenPoint() || pos;
      this.wanderers.push({
        sprite,
        tx: target.x,
        ty: target.y,
        paused: false,
        pauseTimer: 0,
      });
    }
  }

  randomGardenPoint() {
    const cx = W / 2;
    const cy = SAND_H / 2;
    for (let attempts = 0; attempts < 200; attempts++) {
      const x = MARGIN + Math.random() * (W - MARGIN * 2);
      const y = MARGIN + Math.random() * (SAND_H - MARGIN * 2);
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      if (this.gardenMask.isInGarden(ix, iy)) {
        const dx = (x - cx) / (W * 0.42);
        const dy = (y - cy) / (SAND_H * 0.42);
        if (dx * dx + dy * dy < 0.75) {
          return { x, y };
        }
      }
    }
    return null;
  }

  getObstacles() {
    const obstacles = [];
    this.scene.children.list.forEach((child) => {
      if (child.type === 'Image' && child.texture && child.texture.key) {
        const key = child.texture.key;
        if (key.startsWith('rock_') || key.startsWith('shrub_') || key.startsWith('teahouse_')) {
          const hw = (child.width * child.scaleX) / 2;
          const hh = (child.height * child.scaleY) / 2;
          obstacles.push({ x: child.x, y: child.y, r: Math.max(hw, hh) + 4 });
        }
      }
    });
    return obstacles;
  }

  update(time, delta) {
    const dt = delta / 1000;
    const obstacles = this.getObstacles();

    for (const w of this.wanderers) {
      if (w.paused) {
        w.pauseTimer -= dt;
        if (w.pauseTimer <= 0) {
          w.paused = false;
          const t = this.randomGardenPoint();
          if (t) { w.tx = t.x; w.ty = t.y; }
        }
        continue;
      }

      let dx = w.tx - w.sprite.x;
      let dy = w.ty - w.sprite.y;
      const distToTarget = Math.sqrt(dx * dx + dy * dy);

      if (distToTarget < TARGET_RADIUS) {
        // Occasionally pause to contemplate
        if (Math.random() < 0.4) {
          w.paused = true;
          w.pauseTimer = 2 + Math.random() * 5;
        } else {
          const t = this.randomGardenPoint();
          if (t) { w.tx = t.x; w.ty = t.y; }
        }
        continue;
      }

      // Normalize desired direction
      let vx = dx / distToTarget;
      let vy = dy / distToTarget;

      // Obstacle avoidance steering
      for (const obs of obstacles) {
        const ox = w.sprite.x - obs.x;
        const oy = w.sprite.y - obs.y;
        const oDist = Math.sqrt(ox * ox + oy * oy);
        const avoidDist = obs.r + OBSTACLE_RADIUS;
        if (oDist < avoidDist && oDist > 0.1) {
          const force = (avoidDist - oDist) / avoidDist;
          vx += (ox / oDist) * force * STEER_STRENGTH * dt;
          vy += (oy / oDist) * force * STEER_STRENGTH * dt;
        }
      }

      // Avoid other wanderers
      for (const other of this.wanderers) {
        if (other === w) continue;
        const ox = w.sprite.x - other.sprite.x;
        const oy = w.sprite.y - other.sprite.y;
        const oDist = Math.sqrt(ox * ox + oy * oy);
        if (oDist < 12 && oDist > 0.1) {
          const force = (12 - oDist) / 12;
          vx += (ox / oDist) * force * 2;
          vy += (oy / oDist) * force * 2;
        }
      }

      // Normalize and apply speed
      const mag = Math.sqrt(vx * vx + vy * vy);
      if (mag > 0.01) {
        vx = (vx / mag) * SPEED;
        vy = (vy / mag) * SPEED;
      }

      let nx = w.sprite.x + vx * dt;
      let ny = w.sprite.y + vy * dt;

      // Stay in garden
      const ix = Math.floor(nx);
      const iy = Math.floor(ny);
      if (this.gardenMask.isInGarden(ix, iy)) {
        w.sprite.x = nx;
        w.sprite.y = ny;
      } else {
        const t = this.randomGardenPoint();
        if (t) { w.tx = t.x; w.ty = t.y; }
      }
    }
  }
}
