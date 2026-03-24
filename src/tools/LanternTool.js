import { SAND_H } from '../constants.js';
import { createLanternTexture, createLanternGlowTexture } from '../graphics/sprites/LanternSprite.js';

export class LanternTool {
  constructor(scene, gardenMask, audioManager, dayNight) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.audio = audioManager;
    this.dayNight = dayNight;
  }

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    const gx = Math.floor(pointer.x);
    const gy = Math.floor(pointer.y);
    if (!this.gardenMask.isInGarden(gx, gy)) return;

    const lanternKey = createLanternTexture(this.scene);
    const glowKey = createLanternGlowTexture(this.scene);

    const sprite = this.scene.add.image(pointer.x, pointer.y, lanternKey);
    sprite.setScale(2);

    const glow = this.scene.add.image(pointer.x, pointer.y - 4, glowKey);
    glow.setScale(3);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setAlpha(0);

    this.dayNight.registerLantern(sprite, glow);

    sprite.setInteractive({ draggable: true, useHandCursor: true });
    this.scene.input.setDraggable(sprite);
    sprite.on('drag', (_p, dragX, dragY) => {
      if (dragY < SAND_H) {
        sprite.x = dragX;
        sprite.y = dragY;
        glow.x = dragX;
        glow.y = dragY - 4;
      }
    });

    this.audio.playPlace();
  }
}
