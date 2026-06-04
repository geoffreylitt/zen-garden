const MAX_HISTORY = 50;

export class HistoryManager {
  constructor() {
    this.stack = [];
  }

  pushSand(pixelSnapshot) {
    this.stack.push({ type: 'sand', pixels: pixelSnapshot });
    if (this.stack.length > MAX_HISTORY) this.stack.shift();
  }

  pushSprite(sprite) {
    this.stack.push({ type: 'sprite', sprite });
    if (this.stack.length > MAX_HISTORY) this.stack.shift();
  }

  undo(sandCanvas) {
    if (this.stack.length === 0) return;
    const entry = this.stack.pop();
    if (entry.type === 'sand') {
      sandCanvas.restore(entry.pixels);
    } else if (entry.type === 'sprite') {
      entry.sprite.destroy();
    }
  }

  get canUndo() {
    return this.stack.length > 0;
  }
}
