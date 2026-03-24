export class SoundDialog {
  constructor(audioManager, rainRenderer, onUpdate) {
    this.audio = audioManager;
    this.rainRenderer = rainRenderer;
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

    this._createWeatherSection(dialog);

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    document.body.appendChild(overlay);
    this.el = overlay;
  }

  _createWeatherSection(dialog) {
    const divider = document.createElement('div');
    divider.className = 'sound-dialog-section-divider';
    dialog.appendChild(divider);

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'sound-dialog-section-title';
    sectionTitle.textContent = 'Weather';
    dialog.appendChild(sectionTitle);

    const rainLayer = this.audio.layers.rain;

    const toggleRow = document.createElement('div');
    toggleRow.className = 'sound-layer-row';

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = rainLayer.enabled;
    toggle.id = 'weather-rain';
    toggle.addEventListener('change', () => {
      rainLayer.enabled = toggle.checked;
      this.rainRenderer.setEnabled(toggle.checked);
      this.audio.updateLayerGain('rain');
      this.onUpdate();
    });

    const labelEl = document.createElement('label');
    labelEl.htmlFor = 'weather-rain';
    labelEl.textContent = 'Rain';

    const volSlider = document.createElement('input');
    volSlider.type = 'range';
    volSlider.min = '0';
    volSlider.max = '100';
    volSlider.value = String(Math.round(rainLayer.volume * 100));
    volSlider.className = 'sound-slider';
    volSlider.addEventListener('input', () => {
      rainLayer.volume = parseInt(volSlider.value, 10) / 100;
      this.audio.updateLayerGain('rain');
    });

    toggleRow.appendChild(toggle);
    toggleRow.appendChild(labelEl);
    toggleRow.appendChild(volSlider);
    dialog.appendChild(toggleRow);

    const intensityRow = document.createElement('div');
    intensityRow.className = 'sound-layer-row';

    const spacer = document.createElement('div');
    spacer.style.width = '16px';
    spacer.style.flexShrink = '0';

    const intLabel = document.createElement('label');
    intLabel.textContent = 'Intensity';
    intLabel.style.flex = '0 0 70px';
    intLabel.style.fontSize = '12px';
    intLabel.style.color = '#a89878';

    const intSlider = document.createElement('input');
    intSlider.type = 'range';
    intSlider.min = '10';
    intSlider.max = '100';
    intSlider.value = String(Math.round(rainLayer.intensity * 100));
    intSlider.className = 'sound-slider';
    intSlider.addEventListener('input', () => {
      const val = parseInt(intSlider.value, 10) / 100;
      rainLayer.setIntensity(val);
      this.rainRenderer.setIntensity(val);
      this.audio.updateLayerGain('rain');
    });

    intensityRow.appendChild(spacer);
    intensityRow.appendChild(intLabel);
    intensityRow.appendChild(intSlider);
    dialog.appendChild(intensityRow);
  }
}
