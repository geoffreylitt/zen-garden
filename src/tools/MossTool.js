import { W, SAND_H } from '../constants.js';
import { createMossTexture } from '../graphics/sprites/MossSprite.js';

const MAX_GROWN_MOSS = 25;
const GROWTH_INTERVAL = 2500;
const GROWTH_CHANCE = 0.5;
const MAX_MOSS_PER_ROCK = 4;
const GROWTH_RADIUS = 45;
const GROWTH_SPAWN_MIN = 14;
const GROWTH_SPAWN_MAX = 28;

export class MossTool {
  constructor(scene, gardenMask, audioManager) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.audio = audioManager;
    this.mossSprites = [];
    this.grownCount = 0;
    this.growthTimer = 0;
  }

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    const gx = Math.floor(pointer.x);
    const gy = Math.floor(pointer.y);
    if (!this.gardenMask.isInGarden(gx, gy)) return;

    const key = createMossTexture(this.scene);
    const sprite = this._addMossSprite(pointer.x, pointer.y, key, 2);
    this.mossSprites.push(sprite);
    this.audio.playPlace();
  }

  _addMossSprite(x, y, key, scale) {
    const sprite = this.scene.add.image(x, y, key);
    sprite.setScale(scale);
    sprite.setInteractive({ draggable: true, useHandCursor: true });
    this.scene.input.setDraggable(sprite);
    sprite.on('drag', (_p, dragX, dragY) => {
      if (dragY < SAND_H) {
        sprite.x = dragX;
        sprite.y = dragY;
      }
    });
    return sprite;
  }

  update(_time, delta) {
    if (this.mossSprites.length === 0) return;
    if (this.grownCount >= MAX_GROWN_MOSS) return;

    this.growthTimer += delta;
    if (this.growthTimer < GROWTH_INTERVAL) return;
    this.growthTimer = 0;

    if (Math.random() > GROWTH_CHANCE) return;

    const rocks = [];
    this.scene.children.list.forEach(child => {
      if (child.texture && child.texture.key &&
          child.texture.key.startsWith('rock_')) {
        rocks.push(child);
      }
    });
    if (rocks.length === 0) return;

    const rock = rocks[Math.floor(Math.random() * rocks.length)];

    let nearbyCount = 0;
    for (const m of this.mossSprites) {
      const dx = m.x - rock.x;
      const dy = m.y - rock.y;
      if (dx * dx + dy * dy < GROWTH_RADIUS * GROWTH_RADIUS) {
        nearbyCount++;
      }
    }
    if (nearbyCount >= MAX_MOSS_PER_ROCK) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = GROWTH_SPAWN_MIN + Math.random() * (GROWTH_SPAWN_MAX - GROWTH_SPAWN_MIN);
    const mx = Math.round(rock.x + Math.cos(angle) * dist);
    const my = Math.round(rock.y + Math.sin(angle) * dist);

    if (mx < 0 || mx >= W || my < 0 || my >= SAND_H) return;
    if (!this.gardenMask.isInGarden(mx, my)) return;

    const key = createMossTexture(this.scene, undefined, 0.6 + Math.random() * 0.4);
    const sprite = this._addMossSprite(mx, my, key, 0.5);

    const targetScale = 1.5 + Math.random() * 0.5;
    this.scene.tweens.add({
      targets: sprite,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 4000 + Math.random() * 4000,
      ease: 'Sine.easeOut',
    });

    this.mossSprites.push(sprite);
    this.grownCount++;
  }
}
