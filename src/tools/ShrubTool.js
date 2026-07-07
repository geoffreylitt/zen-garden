import { SAND_H } from '../constants.js';
import { createShrubTexture } from '../graphics/sprites/ShrubSprite.js';

export class ShrubTool {
  constructor(scene, gardenMask, audioManager) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.audio = audioManager;
    this.preview = null;
    this.previewKey = null;
  }

  activate() {
    if (!this.previewKey) {
      this.previewKey = createShrubTexture(this.scene);
    }
    this.preview = this.scene.add.image(-100, -100, this.previewKey);
    this.preview.setScale(2);
    this.preview.setAlpha(0.45);
    this.preview.setVisible(false);
  }

  deactivate() {
    if (this.preview) {
      this.preview.destroy();
      this.preview = null;
    }
  }

  onMove(pointer) {
    if (!this.preview) return;
    if (pointer.y >= SAND_H || !this.gardenMask.isInGarden(Math.floor(pointer.x), Math.floor(pointer.y))) {
      this.preview.setVisible(false);
      return;
    }
    this.preview.setPosition(pointer.x, pointer.y);
    this.preview.setVisible(true);
  }

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    const gx = Math.floor(pointer.x);
    const gy = Math.floor(pointer.y);
    if (!this.gardenMask.isInGarden(gx, gy)) return;

    const key = createShrubTexture(this.scene);
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

    if (this.preview) {
      this.scene.children.bringToTop(this.preview);
    }

    this.audio.playPlace();
  }
}
