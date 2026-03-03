import { SAND_H } from '../constants.js';
import { createTsukubaiTexture } from '../graphics/sprites/TsukubaiSprite.js';

export class TsukubaiTool {
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

    const key = createTsukubaiTexture(this.scene);
    const base = this.scene.add.image(0, 0, key);
    base.setScale(2);

    const drip = this.scene.add.graphics();
    const container = this.scene.add.container(pointer.x, pointer.y, [base, drip]);
    container.setSize(base.width * 2, base.height * 2);
    container.setInteractive({ draggable: true, useHandCursor: true });
    this.scene.input.setDraggable(container);
    container.on('drag', (_p, dragX, dragY) => {
      if (dragY < SAND_H) {
        container.x = dragX;
        container.y = dragY;
      }
    });

    this.animateDrip(drip);
    this.audio.playPlace();
  }

  animateDrip(drip) {
    const dripCycle = () => {
      drip.clear();
      const dropY = { value: -16 };
      const tween = this.scene.tweens.add({
        targets: dropY,
        value: -4,
        duration: 1200,
        ease: 'Quad.In',
        onUpdate: () => {
          drip.clear();
          drip.fillStyle(0x5590b0, 0.9);
          drip.fillCircle(6, dropY.value, 1);
        },
        onComplete: () => {
          drip.clear();
          drip.fillStyle(0x88ccdd, 0.5);
          drip.fillCircle(6, -4, 2.5);
          this.scene.time.delayedCall(300, () => {
            drip.clear();
            this.scene.time.delayedCall(2000 + Math.random() * 3000, dripCycle);
          });
        },
      });
    };
    this.scene.time.delayedCall(500, dripCycle);
  }
}
