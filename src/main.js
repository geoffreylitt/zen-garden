import Phaser from 'phaser';
import { GardenScene } from './scenes/GardenScene.js';

const config = {
  type: Phaser.CANVAS,
  width: 480,
  height: 360,
  pixelArt: true,
  backgroundColor: '#2d2d2d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [GardenScene],
};

new Phaser.Game(config);
