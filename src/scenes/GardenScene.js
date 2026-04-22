import Phaser from 'phaser';
import { SAND_H } from '../constants.js';
import { GardenMask } from '../graphics/GardenMask.js';
import { SandCanvas } from '../graphics/SandCanvas.js';
import { MossCanvas } from '../graphics/MossCanvas.js';
import { drawBorder } from '../graphics/BorderRenderer.js';
import { AudioManager } from '../audio/AudioManager.js';
import { RakeTool } from '../tools/RakeTool.js';
import { RockTool } from '../tools/RockTool.js';
import { ShrubTool } from '../tools/ShrubTool.js';
import { TeahouseTool } from '../tools/TeahouseTool.js';
import { MossTool } from '../tools/MossTool.js';
import { Toolbar } from '../ui/Toolbar.js';
import { SoundDialog } from '../ui/SoundDialog.js';

export class GardenScene extends Phaser.Scene {
  constructor() {
    super('GardenScene');
    this.activeTool = 'RAKE';
  }

  create() {
    // Graphics — layered: sand → moss → border → sprites
    this.gardenMask = new GardenMask();
    this.sandCanvas = new SandCanvas(this, this.gardenMask);
    this.sandCanvas.create();

    this.mossCanvas = new MossCanvas(this, this.gardenMask);
    this.mossCanvas.create();

    drawBorder(this);

    // Audio
    this.audio = new AudioManager();

    // Tools
    this.tools = {
      RAKE: new RakeTool(this.sandCanvas, this.gardenMask, this.audio),
      ROCK: new RockTool(this, this.gardenMask, this.audio),
      SHRUB: new ShrubTool(this, this.gardenMask, this.audio),
      TEAHOUSE: new TeahouseTool(this, this.gardenMask, this.audio),
      MOSS: new MossTool(this.mossCanvas, this.gardenMask),
    };

    // UI
    this.soundDialog = new SoundDialog(this.audio, () => {
      this.toolbar.updateSoundButton(this.audio.anyLayerEnabled);
    });

    this.toolbar = new Toolbar(this, (name) => this.handleToolSelect(name));
    this.toolbar.create();
    this.toolbar.updateSoundButton(this.audio.anyLayerEnabled);
    // Show the initial brush size label on the MOSS button
    this.toolbar.updateToolLabel('MOSS', this.tools.MOSS.label);

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
    // Clicking the MOSS button while already active cycles the brush size
    if (name === 'MOSS' && this.activeTool === 'MOSS') {
      this.tools.MOSS.cycleBrush();
    }
    this.activeTool = name;
    this.toolbar.setActiveTool(name);
    if (name === 'MOSS') {
      this.toolbar.updateToolLabel('MOSS', this.tools.MOSS.label);
    }
  }

  setupInput() {
    // Disable browser context menu so right-click can erase moss
    if (this.input.mouse) this.input.mouse.disableContextMenu();

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
    if (this.sandCanvas.dirty) this.sandCanvas.sync();
    if (this.mossCanvas.dirty) this.mossCanvas.sync();
  }
}
