import Phaser from 'phaser';
import { W, SAND_H } from '../constants.js';
import { GardenMask } from '../graphics/GardenMask.js';
import { SandCanvas } from '../graphics/SandCanvas.js';
import { drawBorder } from '../graphics/BorderRenderer.js';
import { AudioManager } from '../audio/AudioManager.js';
import { RakeTool } from '../tools/RakeTool.js';
import { RockTool } from '../tools/RockTool.js';
import { ShrubTool } from '../tools/ShrubTool.js';
import { TeahouseTool } from '../tools/TeahouseTool.js';
import { LanternTool } from '../tools/LanternTool.js';
import { Toolbar } from '../ui/Toolbar.js';
import { SoundDialog } from '../ui/SoundDialog.js';
import { TimeDialog } from '../ui/TimeDialog.js';
import { DayNightCycle } from '../DayNightCycle.js';

export class GardenScene extends Phaser.Scene {
  constructor() {
    super('GardenScene');
    this.activeTool = 'RAKE';
  }

  create() {
    this.gardenMask = new GardenMask();
    this.sandCanvas = new SandCanvas(this, this.gardenMask);
    this.sandCanvas.create();
    drawBorder(this);

    this.dayNight = new DayNightCycle();

    this.audio = new AudioManager();

    this.tools = {
      RAKE: new RakeTool(this.sandCanvas, this.gardenMask, this.audio),
      ROCK: new RockTool(this, this.gardenMask, this.audio),
      SHRUB: new ShrubTool(this, this.gardenMask, this.audio),
      TEAHOUSE: new TeahouseTool(this, this.gardenMask, this.audio),
      LANTERN: new LanternTool(this, this.gardenMask, this.audio, this.dayNight),
    };

    this.soundDialog = new SoundDialog(this.audio, () => {
      this.toolbar.updateSoundButton(this.audio.anyLayerEnabled);
    });

    this.timeDialog = new TimeDialog(this.dayNight);

    this.toolbar = new Toolbar(this, (name) => this.handleToolSelect(name));
    this.toolbar.create();
    this.toolbar.updateSoundButton(this.audio.anyLayerEnabled);

    this.overlay = this.add.graphics();
    this.overlay.setDepth(900);

    this.setupInput();

    this.lastTime = this.time.now;
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
    if (name === 'TIME') {
      this.timeDialog.open();
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
      if (tool && tool.onDown) tool.onDown(pointer);
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

  update(time) {
    const deltaSec = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.dayNight.update(deltaSec);

    if (this.sandCanvas.dirty) {
      this.sandCanvas.sync();
    }

    const ov = this.dayNight.getOverlay();
    this.overlay.clear();
    if (ov.a > 0.005) {
      const color = (ov.r << 16) | (ov.g << 8) | ov.b;
      this.overlay.fillStyle(color, ov.a);
      this.overlay.fillRect(0, 0, W, SAND_H);
    }

    this.dayNight.updateLanterns();
    this.audio.updateTimeMultipliers(this.dayNight);
  }
}
