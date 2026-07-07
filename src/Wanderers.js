import { W, SAND_H } from './constants.js';
import { createWandererTexture } from './graphics/sprites/WandererSprite.js';

const WANDERER_COUNT = 4;
const SPEED = 0.15;
const OBSTACLE_RADIUS = 28;
const REPULSION_STRENGTH = 1.2;
const BOUNDARY_MARGIN = 12;
const PAUSE_MIN = 2000;
const PAUSE_MAX = 6000;
const WAYPOINT_REACHED = 5;

export class Wanderers {
  constructor(scene, gardenMask) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.wanderers = [];
    this.spawn();
  }

  spawn() {
    const cx = W / 2;
    const cy = SAND_H / 2;

    for (let i = 0; i < WANDERER_COUNT; i++) {
      let x, y;
      for (let tries = 0; tries < 200; tries++) {
        x = 40 + Math.random() * (W - 80);
        y = 40 + Math.random() * (SAND_H - 80);
        if (this.gardenMask.isInGarden(Math.floor(x), Math.floor(y))) break;
      }

      const key = createWandererTexture(this.scene);
      const sprite = this.scene.add.image(x, y, key);
      sprite.setScale(2);
      sprite.setDepth(10);

      this.wanderers.push({
        sprite,
        x, y,
        targetX: x, targetY: y,
        angle: Math.random() * Math.PI * 2,
        paused: true,
        pauseUntil: this.scene.time.now + Math.random() * 3000,
      });
    }
  }

  getObstacles() {
    const obstacles = [];
    this.scene.children.list.forEach(child => {
      if (child.texture && child.texture.key) {
        const k = child.texture.key;
        if (k.startsWith('rock_') || k.startsWith('shrub_') || k.startsWith('teahouse_')) {
          obstacles.push({ x: child.x, y: child.y, r: OBSTACLE_RADIUS });
        }
      }
    });
    return obstacles;
  }

  pickWaypoint(w) {
    for (let tries = 0; tries < 100; tries++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 120;
      const tx = w.x + Math.cos(angle) * dist;
      const ty = w.y + Math.sin(angle) * dist;
      const ix = Math.floor(tx);
      const iy = Math.floor(ty);
      if (ix < BOUNDARY_MARGIN || ix >= W - BOUNDARY_MARGIN) continue;
      if (iy < BOUNDARY_MARGIN || iy >= SAND_H - BOUNDARY_MARGIN) continue;
      if (!this.gardenMask.isInGarden(ix, iy)) continue;

      let blocked = false;
      const obstacles = this.getObstacles();
      for (const ob of obstacles) {
        const dx = tx - ob.x;
        const dy = ty - ob.y;
        if (dx * dx + dy * dy < ob.r * ob.r) { blocked = true; break; }
      }
      if (blocked) continue;

      w.targetX = tx;
      w.targetY = ty;
      return;
    }
    w.targetX = W / 2;
    w.targetY = SAND_H / 2;
  }

  update(time) {
    const obstacles = this.getObstacles();

    for (const w of this.wanderers) {
      if (w.paused) {
        if (time < w.pauseUntil) continue;
        w.paused = false;
        this.pickWaypoint(w);
      }

      let dx = w.targetX - w.x;
      let dy = w.targetY - w.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < WAYPOINT_REACHED) {
        w.paused = true;
        w.pauseUntil = time + PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
        continue;
      }

      let moveX = (dx / dist) * SPEED;
      let moveY = (dy / dist) * SPEED;

      for (const ob of obstacles) {
        const odx = w.x - ob.x;
        const ody = w.y - ob.y;
        const odist = Math.sqrt(odx * odx + ody * ody);
        if (odist < ob.r && odist > 0.1) {
          const force = REPULSION_STRENGTH * (1 - odist / ob.r);
          moveX += (odx / odist) * force;
          moveY += (ody / odist) * force;
        }
      }

      for (const other of this.wanderers) {
        if (other === w) continue;
        const odx = w.x - other.x;
        const ody = w.y - other.y;
        const odist = Math.sqrt(odx * odx + ody * ody);
        if (odist < 16 && odist > 0.1) {
          const force = 0.3 * (1 - odist / 16);
          moveX += (odx / odist) * force;
          moveY += (ody / odist) * force;
        }
      }

      const nx = w.x + moveX;
      const ny = w.y + moveY;

      const ix = Math.floor(nx);
      const iy = Math.floor(ny);
      if (this.gardenMask.isInGarden(ix, iy) &&
          ix > BOUNDARY_MARGIN && ix < W - BOUNDARY_MARGIN &&
          iy > BOUNDARY_MARGIN && iy < SAND_H - BOUNDARY_MARGIN) {
        w.x = nx;
        w.y = ny;
      } else {
        w.paused = true;
        w.pauseUntil = time + 500;
        this.pickWaypoint(w);
      }

      w.sprite.x = Math.round(w.x);
      w.sprite.y = Math.round(w.y);
    }
  }
}
