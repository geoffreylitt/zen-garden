import { SAND_H } from '../constants.js';
import { StreamRenderer } from '../graphics/StreamRenderer.js';

export class StreamTool {
  constructor(scene, gardenMask, audioManager) {
    this.scene = scene;
    this.gardenMask = gardenMask;
    this.audio = audioManager;
    this.drawing = false;
    this.points = [];
    this.preview = null;
  }

  onDown(pointer) {
    if (pointer.y >= SAND_H) return;
    if (!this.gardenMask.isInGarden(Math.floor(pointer.x), Math.floor(pointer.y))) return;
    this.drawing = true;
    this.points = [{ x: pointer.x, y: pointer.y }];
    this.preview = this.scene.add.graphics();
  }

  onMove(pointer) {
    if (!this.drawing) return;
    if (pointer.y >= SAND_H) return;
    const last = this.points[this.points.length - 1];
    const dx = pointer.x - last.x;
    const dy = pointer.y - last.y;
    if (dx * dx + dy * dy < 9) return;
    this.points.push({ x: pointer.x, y: pointer.y });
    this.drawPreview();
  }

  onUp() {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.preview) {
      this.preview.destroy();
      this.preview = null;
    }
    if (this.points.length < 3) return;
    const smoothed = this.smooth(this.points);
    new StreamRenderer(this.scene, smoothed);
    this.audio.playPlace();
  }

  drawPreview() {
    if (!this.preview || this.points.length < 2) return;
    this.preview.clear();
    this.preview.lineStyle(3, 0x4488aa, 0.4);
    this.preview.beginPath();
    this.preview.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.preview.lineTo(this.points[i].x, this.points[i].y);
    }
    this.preview.strokePath();
  }

  smooth(pts) {
    let r = [...pts];
    for (let iter = 0; iter < 2; iter++) {
      const s = [r[0]];
      for (let i = 0; i < r.length - 1; i++) {
        s.push({ x: r[i].x * 0.75 + r[i + 1].x * 0.25, y: r[i].y * 0.75 + r[i + 1].y * 0.25 });
        s.push({ x: r[i].x * 0.25 + r[i + 1].x * 0.75, y: r[i].y * 0.25 + r[i + 1].y * 0.75 });
      }
      s.push(r[r.length - 1]);
      r = s;
    }
    return r;
  }
}
