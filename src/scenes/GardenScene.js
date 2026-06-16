import Phaser from 'phaser';
import { SAND_H } from '../constants.js';
import { GardenMask } from '../graphics/GardenMask.js';
import { SandCanvas } from '../graphics/SandCanvas.js';
import { drawBorder } from '../graphics/BorderRenderer.js';
import { AudioManager } from '../audio/AudioManager.js';
import { RakeTool } from '../tools/RakeTool.js';
import { RockTool } from '../tools/RockTool.js';
import { ShrubTool } from '../tools/ShrubTool.js';
import { TeahouseTool } from '../tools/TeahouseTool.js';
import { Toolbar } from '../ui/Toolbar.js';
import { SoundDialog } from '../ui/SoundDialog.js';
import { ChallengeManager } from '../challenges/ChallengeManager.js';
import { ChallengePanel } from '../ui/ChallengePanel.js';

export class GardenScene extends Phaser.Scene {
  constructor() {
    super('GardenScene');
    this.activeTool = 'RAKE';
  }

  create() {
    // Graphics
    this.gardenMask = new GardenMask();
    this.sandCanvas = new SandCanvas(this, this.gardenMask);
    this.sandCanvas.create();
    drawBorder(this);

    // Audio
    this.audio = new AudioManager();

    // Tools
    this.tools = {
      RAKE: new RakeTool(this.sandCanvas, this.gardenMask, this.audio),
      ROCK: new RockTool(this, this.gardenMask, this.audio),
      SHRUB: new ShrubTool(this, this.gardenMask, this.audio),
      TEAHOUSE: new TeahouseTool(this, this.gardenMask, this.audio),
    };

    // Challenges
    this.challenges = new ChallengeManager();
    this.challengePanel = new ChallengePanel(this.challenges);
    this.tools.RAKE.onRake = (dist) => this.challenges.addRakeDistance(dist);

    // UI
    this.soundDialog = new SoundDialog(this.audio, () => {
      this.toolbar.updateSoundButton(this.audio.anyLayerEnabled);
    });

    this.toolbar = new Toolbar(this, (name) => this.handleToolSelect(name));
    this.toolbar.create();
    this.toolbar.updateSoundButton(this.audio.anyLayerEnabled);

    // Input
    this.setupInput();
  }

  handleToolSelect(name) {
    if (name === 'CLEAR') {
      this.sandCanvas.clear();
      return;
    }
    if (name === 'SOUND') {
      this.audio.ensureStarted();
      this.soundDialog.open();
      return;
    }
    this.activeTool = name;
    this.toolbar.setActiveTool(name);
  }

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      this.audio.ensureStarted();
      if (pointer.y >= SAND_H) return;
      const tool = this.tools[this.activeTool];
      if (tool && tool.onDown) {
        tool.onDown(pointer);
        // Track placement actions for daily challenge
        const gx = Math.floor(pointer.x);
        const gy = Math.floor(pointer.y);
        if (this.gardenMask.isInGarden(gx, gy)) {
          if (this.activeTool === 'ROCK') this.challenges.addRock();
          else if (this.activeTool === 'SHRUB') this.challenges.addShrub();
          else if (this.activeTool === 'TEAHOUSE') this.challenges.addTeahouse();
        }
      }
    });

    this.input.on('pointermove', (pointer) => {
      const tool = this.tools[this.activeTool];
      if (tool && tool.onMove) tool.onMove(pointer);
    });

    this.input.on('pointerup', () => {
      const tool = this.tools[this.activeTool];
      if (tool && tool.onUp) tool.onUp();
    });
  }

  update() {
    if (this.sandCanvas.dirty) {
      this.sandCanvas.sync();
    }
  }
}
