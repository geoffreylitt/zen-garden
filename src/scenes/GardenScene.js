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
import { HistoryManager } from '../history/HistoryManager.js';

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

    // History
    this.history = new HistoryManager();

    // Tools
    this.tools = {
      RAKE: new RakeTool(this.sandCanvas, this.gardenMask, this.audio, this.history),
      ROCK: new RockTool(this, this.gardenMask, this.audio, this.history),
      SHRUB: new ShrubTool(this, this.gardenMask, this.audio, this.history),
      TEAHOUSE: new TeahouseTool(this, this.gardenMask, this.audio, this.history),
    };

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
    if (name === 'UNDO') {
      this.history.undo(this.sandCanvas);
      return;
    }
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

    // Ctrl+Z / Cmd+Z keyboard shortcut for undo
    this.input.keyboard.on('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        this.history.undo(this.sandCanvas);
      }
    });
  }

  update() {
    if (this.sandCanvas.dirty) {
      this.sandCanvas.sync();
    }
  }
}
