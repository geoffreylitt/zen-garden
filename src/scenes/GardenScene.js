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
import { CharacterSprite } from '../graphics/sprites/CharacterSprite.js';

const CHAR_SPEED = 1.5;

export class GardenScene extends Phaser.Scene {
  constructor() {
    super('GardenScene');
    this.activeTool = 'WALK';
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
    this.rakeTool = new RakeTool(this.sandCanvas, this.gardenMask, this.audio);
    this.tools = {
      RAKE: this.rakeTool,
      ROCK: new RockTool(this, this.gardenMask, this.audio),
      SHRUB: new ShrubTool(this, this.gardenMask, this.audio),
      TEAHOUSE: new TeahouseTool(this, this.gardenMask, this.audio),
    };

    // Character
    this.character = new CharacterSprite(this);
    this.charRaking = false;
    this.charLastPos = { x: this.character.x, y: this.character.y };

    // Keyboard
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

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

    if (name === 'WALK') {
      this.character.sprite.setVisible(true);
    } else {
      this.character.sprite.setVisible(false);
    }
  }

  setupInput() {
    this.input.on('pointerdown', (pointer) => {
      this.audio.ensureStarted();
      if (pointer.y >= SAND_H) return;
      if (this.activeTool === 'WALK') return;
      const tool = this.tools[this.activeTool];
      if (tool && tool.onDown) tool.onDown(pointer);
    });

    this.input.on('pointermove', (pointer) => {
      if (this.activeTool === 'WALK') return;
      const tool = this.tools[this.activeTool];
      if (tool && tool.onMove) tool.onMove(pointer);
    });

    this.input.on('pointerup', () => {
      if (this.activeTool === 'WALK') return;
      const tool = this.tools[this.activeTool];
      if (tool && tool.onUp) tool.onUp();
    });
  }

  update() {
    if (this.activeTool === 'WALK') {
      this.updateCharacter();
    }

    if (this.sandCanvas.dirty) {
      this.sandCanvas.sync();
    }
  }

  updateCharacter() {
    let dx = 0;
    let dy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;

    if (dx === 0 && dy === 0) {
      if (this.charRaking) {
        this.charRaking = false;
        this.audio.stopRake();
      }
      return;
    }

    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.SQRT2;
      dx *= inv;
      dy *= inv;
    }

    const nx = this.character.x + dx * CHAR_SPEED;
    const ny = this.character.y + dy * CHAR_SPEED;

    if (!this.gardenMask.isInGarden(Math.floor(nx), Math.floor(ny))) {
      if (this.charRaking) {
        this.charRaking = false;
        this.audio.stopRake();
      }
      return;
    }

    if (ny >= SAND_H - 2) return;

    const from = { x: this.character.x, y: this.character.y };
    this.character.setPosition(nx, ny);
    const to = { x: nx, y: ny };

    this.rakeTool.rakeStroke(from, to);

    if (!this.charRaking) {
      this.charRaking = true;
      this.audio.ensureStarted();
      this.audio.startRake();
    }

    this.charLastPos = { x: nx, y: ny };
  }
}
