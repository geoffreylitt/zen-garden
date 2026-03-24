export class SoundDialog {
  constructor(audioManager, fogRenderer, onUpdate) {
    this.audio = audioManager;
    this.fog = fogRenderer;
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
    title.textContent = 'Sound & Atmosphere';
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

    // Fog density section
    const fogSection = document.createElement('div');
    fogSection.className = 'sound-dialog-title';
    fogSection.style.marginTop = '8px';
    fogSection.style.marginBottom = '12px';
    fogSection.style.fontSize = '12px';
    const fogTitle = document.createElement('span');
    fogTitle.textContent = 'Fog Density';
    fogSection.appendChild(fogTitle);
    dialog.appendChild(fogSection);

    const fogRow = document.createElement('div');
    fogRow.className = 'sound-layer-row';

    const fogLabel = document.createElement('label');
    fogLabel.style.flex = '0 0 70px';
    fogLabel.style.fontSize = '11px';
    fogLabel.style.color = '#a0a8b0';
    fogLabel.textContent = this._fogLevelLabel(this.fog.baseDensity);

    const fogSlider = document.createElement('input');
    fogSlider.type = 'range';
    fogSlider.min = '0';
    fogSlider.max = '100';
    fogSlider.value = String(Math.round(this.fog.baseDensity * 100));
    fogSlider.className = 'sound-slider';
    fogSlider.addEventListener('input', () => {
      this.fog.baseDensity = parseInt(fogSlider.value, 10) / 100;
      fogLabel.textContent = this._fogLevelLabel(this.fog.baseDensity);
    });

    fogRow.appendChild(fogLabel);
    fogRow.appendChild(fogSlider);
    dialog.appendChild(fogRow);

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    document.body.appendChild(overlay);
    this.el = overlay;
  }

  _fogLevelLabel(density) {
    if (density < 0.15) return 'Clear';
    if (density < 0.35) return 'Light haze';
    if (density < 0.6) return 'Misty';
    if (density < 0.85) return 'Dense fog';
    return 'Thick mist';
  }
}
