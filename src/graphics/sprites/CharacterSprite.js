import { W, SAND_H } from '../../constants.js';

const CHAR_W = 12;
const CHAR_H = 16;

const PALETTE = {
  skin:   '#e8c090',
  robe:   '#7a6850',
  robeLt: '#8a7860',
  hat:    '#5c4433',
  rake:   '#b09870',
  rakeH:  '#8a7050',
};

export class CharacterSprite {
  constructor(scene) {
    this.scene = scene;
    this.x = W / 2;
    this.y = SAND_H / 2;
    this.textureKey = 'character';
    this.createTexture();
    this.sprite = scene.add.image(this.x, this.y, this.textureKey);
    this.sprite.setDepth(10);
  }

  createTexture() {
    const canvas = this.scene.textures.createCanvas(this.textureKey, CHAR_W, CHAR_H);
    const ctx = canvas.context;
    ctx.imageSmoothingEnabled = false;

    const px = (x, y, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    };

    // Hat (wide straw hat)
    for (let x = 2; x < 10; x++) px(x, 0, PALETTE.hat);
    for (let x = 1; x < 11; x++) px(x, 1, PALETTE.hat);
    for (let x = 3; x < 9; x++) px(x, 2, PALETTE.hat);

    // Head
    for (let x = 4; x < 8; x++) {
      px(x, 3, PALETTE.skin);
      px(x, 4, PALETTE.skin);
    }

    // Robe body
    for (let y = 5; y < 12; y++) {
      const w = y < 8 ? 3 : 4;
      const sx = 6 - w;
      for (let x = sx; x < sx + w * 2; x++) {
        px(x, y, y % 2 === 0 ? PALETTE.robe : PALETTE.robeLt);
      }
    }

    // Arms
    px(2, 6, PALETTE.skin);
    px(9, 6, PALETTE.skin);
    px(2, 7, PALETTE.skin);
    px(9, 7, PALETTE.skin);

    // Rake in right hand
    px(10, 5, PALETTE.rakeH);
    px(10, 6, PALETTE.rakeH);
    px(10, 7, PALETTE.rakeH);
    px(10, 8, PALETTE.rake);
    px(10, 9, PALETTE.rake);
    px(10, 10, PALETTE.rake);
    px(9, 10, PALETTE.rake);
    px(11, 10, PALETTE.rake);

    // Legs / feet
    px(4, 12, PALETTE.robe);
    px(7, 12, PALETTE.robe);
    px(4, 13, PALETTE.robe);
    px(7, 13, PALETTE.robe);
    px(5, 12, PALETTE.robe);
    px(6, 12, PALETTE.robe);

    // Sandals
    px(4, 14, PALETTE.hat);
    px(5, 14, PALETTE.hat);
    px(6, 14, PALETTE.hat);
    px(7, 14, PALETTE.hat);

    canvas.refresh();
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.sprite.setPosition(x, y);
  }

  destroy() {
    this.sprite.destroy();
  }
}
