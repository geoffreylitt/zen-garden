import { SAND_H } from '../constants.js';
import { createLanternTexture } from '../graphics/sprites/LanternSprite.js';

export class LanternTool {
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

    const key = createLanternTexture(this.scene);
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
