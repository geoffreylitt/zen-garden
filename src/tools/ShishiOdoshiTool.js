import { SAND_H } from '../constants.js';
import { createShishiOdoshiTexture } from '../graphics/sprites/ShishiOdoshiSprite.js';

export class ShishiOdoshiTool {
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

    const key = createShishiOdoshiTexture(this.scene);
    const base = this.scene.add.image(0, 0, key);
    base.setScale(2);

    const arm = this.scene.add.graphics();
    arm.fillStyle(0x8b7355);
    arm.fillRect(0, -1, 14, 3);
    arm.fillStyle(0x6b5335);
    arm.fillRect(12, -3, 3, 7);
    arm.setPosition(-4, -10);

    const container = this.scene.add.container(pointer.x, pointer.y, [base, arm]);
    container.setSize(base.width * 2, base.height * 2);
    container.setInteractive({ draggable: true, useHandCursor: true });
    this.scene.input.setDraggable(container);
    container.on('drag', (_p, dragX, dragY) => {
      if (dragY < SAND_H) {
        container.x = dragX;
        container.y = dragY;
      }
    });

    this.animateArm(arm);
    this.audio.playPlace();
  }

  animateArm(arm) {
    const cycle = () => {
      this.scene.tweens.add({
        targets: arm,
        angle: 25,
        duration: 3500,
        ease: 'Sine.In',
        onComplete: () => {
          this.scene.tweens.add({
            targets: arm,
            angle: -12,
            duration: 120,
            ease: 'Back.Out',
            onComplete: () => {
              this.scene.tweens.add({
                targets: arm,
                angle: 0,
                duration: 600,
                ease: 'Sine.Out',
                delay: 800,
                onComplete: cycle,
              });
            },
          });
        },
      });
    };
    cycle();
  }
}
