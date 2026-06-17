import { W, SAND_H } from '../constants.js';
import { createKoiTexture, createKoiShadowTexture } from '../graphics/sprites/KoiSprite.js';

const MAX_KOI = 3;
const KOI_SPEED = 38;        // pixels per second — slow, graceful drift
const LOOK_AHEAD = 32;       // pixels to probe ahead for boundary/obstacle
const MAX_TURN_RATE = 1.2;   // maximum radians per second of turning
const WANDER_CHANGE = 1.6;   // how quickly the wander impulse evolves (rad/s²)
const BOUNDARY_STEER = 4.0;  // boundary avoidance steering gain
const OBSTACLE_STEER = 6.0;  // obstacle avoidance steering gain
const OBSTACLE_RADIUS = 30;  // avoidance distance around obstacles (pixels)

// Depth layers
const DEPTH_SHADOW = 1;
const DEPTH_KOI = 2;

export class KoiManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {GardenMask} gardenMask
   * @param {Array<{sprite: Phaser.GameObjects.Image, radius: number}>} obstacleSprites
   *   Live array shared with GardenScene — updated whenever objects are placed/moved.
   */
  constructor(scene, gardenMask, obstacleSprites) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.obstacleSprites = obstacleSprites;
    this.fish = [];
    this._koiCount = 0; // cumulative, used for variant cycling

    // Pre-warm textures
    createKoiShadowTexture(scene);
    for (let i = 0; i < MAX_KOI; i++) createKoiTexture(scene, i);
  }

  get count() { return this.fish.length; }
  get isFull() { return this.fish.length >= MAX_KOI; }

  /**
   * Release a new koi into the garden.
   * @returns {boolean} true if a fish was successfully added
   */
  addKoi() {
    if (this.isFull) return false;

    const variant = this._koiCount % MAX_KOI;
    this._koiCount++;

    // Spawn at a random interior position, away from the centre crowd
    const pos = this._findSpawnPosition();

    const shadowKey = createKoiShadowTexture(this.scene);
    const shadow = this.scene.add.image(pos.x, pos.y, shadowKey);
    shadow.setScale(2.2);
    shadow.setDepth(DEPTH_SHADOW);

    const bodyKey = createKoiTexture(this.scene, variant);
    const body = this.scene.add.image(pos.x, pos.y, bodyKey);
    body.setScale(2);
    body.setDepth(DEPTH_KOI);

    const startAngle = Math.random() * Math.PI * 2;
    body.rotation = startAngle;
    shadow.rotation = startAngle;

    this.fish.push({
      x: pos.x,
      y: pos.y,
      angle: startAngle,
      turnRate: 0,          // current turning speed (rad/s)
      wanderImpulse: 0,     // slowly drifting random turn target
      phaseOffset: Math.random() * Math.PI * 2, // for unique wiggle timing
      body,
      shadow,
    });

    return true;
  }

  /**
   * Called each frame from GardenScene.update().
   * @param {number} time  - Phaser time (ms)
   * @param {number} delta - Frame delta (ms)
   */
  update(time, delta) {
    const dt = delta / 1000;
    for (const fish of this.fish) {
      this._stepFish(fish, time, dt);
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  _findSpawnPosition() {
    const cx = W / 2;
    const cy = SAND_H / 2;
    for (let attempt = 0; attempt < 200; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * 90;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (this.gardenMask.isInGarden(Math.floor(x), Math.floor(y))) {
        return { x, y };
      }
    }
    return { x: cx, y: cy };
  }

  _stepFish(fish, time, dt) {
    // 1. Evolve wander impulse — slow random-walk of desired turn rate
    fish.wanderImpulse += (Math.random() - 0.5) * WANDER_CHANGE * dt;
    fish.wanderImpulse = Math.max(-MAX_TURN_RATE, Math.min(MAX_TURN_RATE, fish.wanderImpulse));

    let desiredTurnRate = fish.wanderImpulse;

    // 2. Boundary avoidance — probe ahead in heading direction
    const boundarySteer = this._boundaryAvoidance(fish);
    desiredTurnRate += boundarySteer * BOUNDARY_STEER;

    // 3. Obstacle avoidance
    const obstacleSteer = this._obstacleAvoidance(fish);
    desiredTurnRate += obstacleSteer * OBSTACLE_STEER;

    // 4. Smooth turn-rate toward desired
    fish.turnRate += (desiredTurnRate - fish.turnRate) * Math.min(1, 4 * dt);
    fish.turnRate = Math.max(-MAX_TURN_RATE, Math.min(MAX_TURN_RATE, fish.turnRate));

    // 5. Advance heading
    fish.angle += fish.turnRate * dt;

    // 6. Move forward
    const nx = fish.x + Math.cos(fish.angle) * KOI_SPEED * dt;
    const ny = fish.y + Math.sin(fish.angle) * KOI_SPEED * dt;

    // Stay inside garden — if the new position is outside, reverse turn & hold
    if (this.gardenMask.isInGarden(Math.floor(nx), Math.floor(ny))) {
      fish.x = nx;
      fish.y = ny;
    } else {
      // Steer hard toward centre as emergency fallback
      const cx = W / 2, cy = SAND_H / 2;
      fish.angle = Math.atan2(cy - fish.y, cx - fish.x) + (Math.random() - 0.5) * 0.5;
      fish.turnRate = 0;
      fish.wanderImpulse = 0;
    }

    // 7. Subtle sinusoidal body-wiggle (tail-wag illusion)
    const wiggle = Math.sin(time * 0.0055 + fish.phaseOffset) * 0.09;

    // 8. Update sprites
    fish.body.x = fish.x;
    fish.body.y = fish.y;
    fish.body.rotation = fish.angle + wiggle;

    fish.shadow.x = fish.x + 2;  // slight offset for depth feel
    fish.shadow.y = fish.y + 2;
    fish.shadow.rotation = fish.angle;
  }

  /** Returns a signed steering impulse in [-1, 1] pushing away from boundary. */
  _boundaryAvoidance(fish) {
    // Probe ahead in steps; find first step that leaves the garden
    let nearestHit = LOOK_AHEAD;
    for (let d = 4; d <= LOOK_AHEAD; d += 4) {
      const lx = fish.x + Math.cos(fish.angle) * d;
      const ly = fish.y + Math.sin(fish.angle) * d;
      if (!this.gardenMask.isInGarden(Math.floor(lx), Math.floor(ly))) {
        nearestHit = d;
        break;
      }
    }

    if (nearestHit >= LOOK_AHEAD) return 0; // clear ahead

    // Compute angle toward garden centre and the diff from current heading
    const cx = W / 2, cy = SAND_H / 2;
    const toCenter = Math.atan2(cy - fish.y, cx - fish.x);
    const diff = this._wrapAngle(toCenter - fish.angle);
    const urgency = 1 - nearestHit / LOOK_AHEAD;
    return diff * urgency;
  }

  /** Returns signed steering impulse away from nearby obstacles. */
  _obstacleAvoidance(fish) {
    let steer = 0;
    for (const { sprite, radius } of this.obstacleSprites) {
      const dx = sprite.x - fish.x;
      const dy = sprite.y - fish.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const avoidDist = (radius || OBSTACLE_RADIUS) + LOOK_AHEAD;
      if (dist < avoidDist && dist > 0) {
        const awayAngle = Math.atan2(-dy, -dx);
        const diff = this._wrapAngle(awayAngle - fish.angle);
        const urgency = 1 - dist / avoidDist;
        steer += diff * urgency;
      }
    }
    return steer;
  }

  _wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }
}
