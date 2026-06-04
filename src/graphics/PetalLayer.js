import { W, SAND_H } from '../constants.js';

const PETAL_COUNT = 8;
const PETAL_TINTS = [0xffb7c5, 0xffc0cb, 0xffadc5, 0xffd1dc, 0xff9eb5];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

export class PetalLayer {
  constructor(scene) {
    this.scene = scene;
    this.petals = [];
  }

  create() {
    this._makeTexture();
    for (let i = 0; i < PETAL_COUNT; i++) {
      this._addPetal(/* initial= */ true);
    }
  }

  _makeTexture() {
    // Draw a small elongated ellipse as the petal shape.
    // Using fillEllipse centred in a 6×10 canvas.
    const g = this.scene.add.graphics();
    g.fillStyle(0xffb7c5, 1);
    g.fillEllipse(3, 5, 5, 9);
    g.generateTexture('petal', 6, 10);
    g.destroy();
  }

  _addPetal(initial = false) {
    const baseX = rand(10, W - 10);
    const startY = initial ? rand(-10, SAND_H) : rand(-15, -4);

    const img = this.scene.add.image(baseX, startY, 'petal');
    img.setDepth(50);
    img.setAlpha(rand(0.6, 0.85));
    img.setTint(PETAL_TINTS[Math.floor(Math.random() * PETAL_TINTS.length)]);
    img.setAngle(rand(0, 360));

    // Per-petal physics parameters
    img._baseX    = baseX;
    img._vy       = rand(0.018, 0.032);    // px per ms — slow fall
    img._swayAmp  = rand(6, 14);           // px of left-right swing
    img._swayFreq = rand(0.0007, 0.0014);  // rad per ms — lazy sway
    img._swayPhase = rand(0, Math.PI * 2);
    img._rotSpeed = rand(-0.012, 0.012);   // deg per ms — gentle tumble

    this.petals.push(img);
  }

  update(time, delta) {
    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];
      p.y += p._vy * delta;
      p.angle += p._rotSpeed * delta;
      p.x = p._baseX + p._swayAmp * Math.sin(p._swayFreq * time + p._swayPhase);

      // Once a petal drifts past the sand area, recycle it from the top
      if (p.y > SAND_H + 15) {
        p.destroy();
        this.petals.splice(i, 1);
        this._addPetal(false);
      }
    }
  }
}
