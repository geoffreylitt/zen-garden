import { W, DISCO_COLORS } from '../constants.js';

// Draws a disco ball hanging from the top of the scene
export class DiscoBall {
  constructor(scene) {
    this.scene = scene;
    this.gfx = null;
    this.x = W / 2;
    this.y = 24;
    this.radius = 18;
    this.rotation = 0;
  }

  create() {
    this.gfx = this.scene.add.graphics();
    this.gfx.setDepth(20);
    this._draw();
  }

  update(delta) {
    this.rotation += delta / 1000 * 1.2;
    this._draw();
  }

  _draw() {
    const g = this.gfx;
    g.clear();

    const { x, y, radius } = this;

    // String from top
    g.lineStyle(1, 0xaaaaaa, 0.6);
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, y - radius);
    g.strokePath();

    // Ball shadow
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(x + 2, y + 2, radius);

    // Ball base (dark sphere)
    g.fillStyle(0x111111, 1);
    g.fillCircle(x, y, radius);

    // Mirror tiles on the ball (rotating)
    const tileRows = 6;
    for (let row = 0; row < tileRows; row++) {
      const phi = ((row + 0.5) / tileRows) * Math.PI; // 0 to PI
      const ringRadius = Math.sin(phi) * radius;
      const ringY = y - Math.cos(phi) * radius;
      const tilesInRow = Math.max(1, Math.round(ringRadius * Math.PI / 4));

      for (let t = 0; t < tilesInRow; t++) {
        const theta = ((t / tilesInRow) * Math.PI * 2) + this.rotation;
        const tx = x + Math.cos(theta) * ringRadius * 0.85;
        // Only draw tiles on the front half of the ball
        const ty = ringY;
        const depth = Math.cos(theta); // -1 (back) to 1 (front)
        if (depth < -0.1) continue;

        const colorIdx = (row + t) % DISCO_COLORS.length;
        const color = DISCO_COLORS[colorIdx];
        const brightness = 0.4 + depth * 0.6;
        const tileSize = 3 + depth;

        g.fillStyle(color, brightness);
        g.fillRect(tx - tileSize / 2, ty - tileSize / 2, tileSize, tileSize);

        // Reflection glint
        if (depth > 0.6) {
          g.fillStyle(0xffffff, (depth - 0.6) * 0.8);
          g.fillRect(tx - 1, ty - 1, 2, 2);
        }
      }
    }

    // Specular highlight on ball
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(x - radius * 0.35, y - radius * 0.35, radius * 0.15);
  }
}
