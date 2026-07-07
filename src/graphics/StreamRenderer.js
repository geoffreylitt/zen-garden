export class StreamRenderer {
  constructor(scene, points) {
    this.scene = scene;
    this.points = points;
    this.phase = 0;
    this.waterGfx = scene.add.graphics();
    this.stoneGfx = scene.add.graphics();
    this.drawStones();
    this.draw();

    this.timer = scene.time.addEvent({
      delay: 120,
      callback: () => {
        this.phase += 0.35;
        this.draw();
      },
      loop: true,
    });
  }

  drawStones() {
    const pts = this.points;
    for (let i = 0; i < pts.length; i += 6) {
      const p = pts[i];
      const next = pts[Math.min(i + 1, pts.length - 1)];
      const prev = pts[Math.max(i - 1, 0)];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const off = 3.5 + Math.random() * 1.5;
      const shade = 0x707068 + Math.floor(Math.random() * 0x18) * 0x010101;
      this.stoneGfx.fillStyle(shade, 1);
      this.stoneGfx.fillCircle(p.x + nx * off, p.y + ny * off, 1.2 + Math.random() * 0.8);
      const shade2 = 0x707068 + Math.floor(Math.random() * 0x18) * 0x010101;
      this.stoneGfx.fillStyle(shade2, 1);
      this.stoneGfx.fillCircle(p.x - nx * off, p.y - ny * off, 1.2 + Math.random() * 0.8);
    }
  }

  draw() {
    const g = this.waterGfx;
    g.clear();
    const pts = this.points;

    for (let i = 0; i < pts.length - 1; i++) {
      const wave = Math.sin(i * 0.25 + this.phase) * 0.18 + 0.82;
      const r = Math.floor(0x30 * wave);
      const gc = Math.floor(0x6e * wave);
      const b = Math.floor(0xa5 * wave);
      const color = (r << 16) | (gc << 8) | b;
      g.lineStyle(4, color, 0.75);
      g.beginPath();
      g.moveTo(pts[i].x, pts[i].y);
      g.lineTo(pts[i + 1].x, pts[i + 1].y);
      g.strokePath();
    }

    for (let i = 0; i < pts.length; i += 2) {
      const shimmer = Math.sin(i * 0.4 + this.phase * 1.8) * 0.5 + 0.5;
      if (shimmer > 0.6) {
        g.fillStyle(0x88ccdd, shimmer * 0.35);
        g.fillCircle(pts[i].x, pts[i].y, 0.8);
      }
    }
  }

  destroy() {
    if (this.timer) this.timer.remove();
    if (this.waterGfx) this.waterGfx.destroy();
    if (this.stoneGfx) this.stoneGfx.destroy();
  }
}
