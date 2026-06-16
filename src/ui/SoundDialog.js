export class SoundDialog {
  constructor(audioManager, onUpdate) {
    this.audio = audioManager;
    this.onUpdate = onUpdate;
    this.el = null;
    this.trackRows = [];
  }

  open() {
    if (!this.el) this.create();
    this._refreshTrackSelection();
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

    // Title bar
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

    // Music section
    const musicLabel = document.createElement('div');
    musicLabel.className = 'sound-section-label';
    musicLabel.textContent = 'Music';
    dialog.appendChild(musicLabel);

    const soundtrack = this.audio.soundtrack;
    soundtrack.tracks.forEach(track => {
      const row = document.createElement('div');
      row.className = 'music-track-row';
      row.dataset.trackId = track.id;

      const dot = document.createElement('span');
      dot.className = 'music-track-dot';

      const info = document.createElement('span');
      info.className = 'music-track-info';

      const name = document.createElement('span');
      name.className = 'music-track-name';
      name.textContent = track.name;

      const vibe = document.createElement('span');
      vibe.className = 'music-track-vibe';
      vibe.textContent = track.vibe;

      info.appendChild(name);
      info.appendChild(vibe);
      row.appendChild(dot);
      row.appendChild(info);
      dialog.appendChild(row);

      row.addEventListener('click', () => {
        this.audio.ensureStarted();
        soundtrack.switchTo(track.id);
        this._refreshTrackSelection();
      });

      this.trackRows.push(row);
    });

    // Divider
    const divider = document.createElement('div');
    divider.className = 'sound-section-divider';
    dialog.appendChild(divider);

    // Ambient layers section
    const ambientLabel = document.createElement('div');
    ambientLabel.className = 'sound-section-label';
    ambientLabel.textContent = 'Ambient';
    dialog.appendChild(ambientLabel);

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

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    document.body.appendChild(overlay);
    this.el = overlay;
  }

  _refreshTrackSelection() {
    const currentId = this.audio.soundtrack.currentTrackId;
    this.trackRows.forEach(row => {
      const active = row.dataset.trackId === currentId;
      row.classList.toggle('active', active);
    });
  }
}
