import Phaser from 'phaser';
import { SAND_H, PALETTE_ORDER } from '../constants.js';
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

export class GardenScene extends Phaser.Scene {
  constructor() {
    super('GardenScene');
    this.activeTool = 'RAKE';
    this._paletteIndex = 0; // index into PALETTE_ORDER
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

    // UI
    this.soundDialog = new SoundDialog(this.audio, () => {
      this.toolbar.updateSoundButton(this.audio.anyLayerEnabled);
    });

    this.toolbar = new Toolbar(this, (name) => this.handleToolSelect(name));
    this.toolbar.create();
    this.toolbar.updateSoundButton(this.audio.anyLayerEnabled);
    this.toolbar.updateSandButton(PALETTE_ORDER[this._paletteIndex]);

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
    if (name === 'SAND') {
      this._paletteIndex = (this._paletteIndex + 1) % PALETTE_ORDER.length;
      const paletteKey = PALETTE_ORDER[this._paletteIndex];
      this.sandCanvas.setPalette(paletteKey);
      this.toolbar.updateSandButton(paletteKey);
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

  update() {
    if (this.sandCanvas.dirty) {
      this.sandCanvas.sync();
    }
  }
}
