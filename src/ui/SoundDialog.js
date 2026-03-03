export class SoundDialog {
  constructor(audioManager, onUpdate) {
    this.audio = audioManager;
    this.onUpdate = onUpdate;
    this.el = null;
  }

  open() {
    if (!this.el) this.create();
    this.el.style.display = 'flex';
  }

  close() {
    if (this.el) this.el.style.display = 'none';
  }

  create() {
    const overlay = document.createElement('div');
    overlay.id = 'sound-settings-overlay';

    const dialog = document.createElement('div');
    dialog.id = 'sound-settings-dialog';

    const titleBar = document.createElement('div');
    titleBar.className = 'sound-dialog-title';
    const title = document.createElement('span');
    title.textContent = 'Sound Settings';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sound-dialog-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => this.close());
    titleBar.appendChild(title);
    titleBar.appendChild(closeBtn);
    dialog.appendChild(titleBar);

    const layerDefs = [
      { key: 'wind', label: 'Wind' },
      { key: 'chimes', label: 'Chimes' },
      { key: 'cicadas', label: 'Cicadas' },
      { key: 'stream', label: 'Stream' },
      { key: 'shishiodoshi', label: 'Shishi-odoshi' },
      { key: 'tsukubai', label: 'Tsukubai' },
    ];

    layerDefs.forEach(({ key, label }) => {
      const layer = this.audio.layers[key];

      const row = document.createElement('div');
      row.className = 'sound-layer-row';

      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = layer.enabled;
      toggle.id = `sound-${key}`;
      toggle.addEventListener('change', () => {
        layer.enabled = toggle.checked;
        this.audio.updateLayerGain(key);
        this.onUpdate();
      });

      const labelEl = document.createElement('label');
      labelEl.htmlFor = `sound-${key}`;
      labelEl.textContent = label;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = String(Math.round(layer.volume * 100));
      slider.className = 'sound-slider';
      slider.addEventListener('input', () => {
        layer.volume = parseInt(slider.value, 10) / 100;
        this.audio.updateLayerGain(key);
      });

      row.appendChild(toggle);
      row.appendChild(labelEl);
      row.appendChild(slider);
      dialog.appendChild(row);
    });

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    document.body.appendChild(overlay);
    this.el = overlay;
  }
}
