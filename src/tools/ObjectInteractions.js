const HOLD_THRESHOLD = 250;
const GROW_SPEED = 0.04;
const MAX_SCALE = 6;

export function setupObjectInteractions(scene, sprite, createTextureFn) {
  sprite.setAngle(Math.random() * 30 - 15);

  const baseScale = 1.5 + Math.random() * 1.2;
  sprite.setScale(baseScale);

  let holdStart = 0;
  let isHolding = false;
  let isDragging = false;

  sprite.on('pointerdown', () => {
    holdStart = scene.time.now;
    isHolding = true;
    isDragging = false;
  });

  sprite.on('drag', () => {
    isDragging = true;
    isHolding = false;
  });

  sprite.on('pointerup', () => {
    const duration = scene.time.now - holdStart;

    if (!isDragging && duration < HOLD_THRESHOLD) {
      const oldKey = sprite.texture.key;
      const newKey = createTextureFn(scene);
      sprite.setTexture(newKey);
      if (scene.textures.exists(oldKey)) {
        scene.textures.remove(oldKey);
      }
    }

    isHolding = false;
    isDragging = false;
  });

  const updateFn = () => {
    if (isHolding && !isDragging) {
      const elapsed = scene.time.now - holdStart;
      if (elapsed > HOLD_THRESHOLD && sprite.scaleX < MAX_SCALE) {
        sprite.setScale(Math.min(sprite.scaleX + GROW_SPEED, MAX_SCALE));
      }
    }
  };

  scene.events.on('update', updateFn);
  sprite.on('destroy', () => scene.events.off('update', updateFn));
}
