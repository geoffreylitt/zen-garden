import { SAND_H } from '../constants.js';
import { createShrubTexture } from '../graphics/sprites/ShrubSprite.js';
import { setupObjectInteractions } from './ObjectInteractions.js';

export class ShrubTool {
  constructor(scene, gardenMask, audioManager) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.audio = audioManager;
  }

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    const gx = Math.floor(pointer.x);
    const gy = Math.floor(pointer.y);
    if (!this.gardenMask.isInGarden(gx, gy)) return;

    const key = createShrubTexture(this.scene);
    const sprite = this.scene.add.image(pointer.x, pointer.y, key);
    sprite.setInteractive({ draggable: true, useHandCursor: true });
    this.scene.input.setDraggable(sprite);
    sprite.on('drag', (_p, dragX, dragY) => {
      if (dragY < SAND_H) {
        sprite.x = dragX;
        sprite.y = dragY;
      }
    });
    setupObjectInteractions(this.scene, sprite, createShrubTexture);

    this.audio.playPlace();
  }
}
