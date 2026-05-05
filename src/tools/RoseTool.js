import { SAND_H } from '../constants.js';
import { createRoseTexture } from '../graphics/sprites/RoseSprite.js';

export class RoseTool {
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

    const key = createRoseTexture(this.scene);
    const sprite = this.scene.add.image(pointer.x, pointer.y, key);
    sprite.setScale(2);
    sprite.setInteractive({ draggable: true, useHandCursor: true });
    this.scene.input.setDraggable(sprite);
    sprite.on('drag', (_p, dragX, dragY) => {
      if (dragY < SAND_H) {
        sprite.x = dragX;
        sprite.y = dragY;
      }
    });

    this.audio.playPlace();
  }
}
