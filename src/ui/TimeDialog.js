export class TimeDialog {
  constructor(dayNight, onUpdate) {
    this.dayNight = dayNight;
    this.onUpdate = onUpdate;
    this.el = null;
    this.timeLabel = null;
    this.phaseLabel = null;
    this.slider = null;
    this.modeRadios = {};
    this.animFrame = null;
  }

  open() {
    if (!this.el) this.create();
    this.el.style.display = 'flex';
    this.startUpdate();
  }

  close() {
    if (this.el) this.el.style.display = 'none';
    this.stopUpdate();
  }

  startUpdate() {
    const tick = () => {
      if (this.el && this.el.style.display !== 'none') {
        this.refreshDisplay();
        this.animFrame = requestAnimationFrame(tick);
      }
    };
    tick();
  }

  stopUpdate() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  refreshDisplay() {
    if (this.timeLabel) this.timeLabel.textContent = this.dayNight.getTimeString();
    if (this.phaseLabel) this.phaseLabel.textContent = this.dayNight.getPhaseLabel();
    if (this.slider && this.dayNight.mode !== 'pinned') {
      this.slider.value = String(Math.round(this.dayNight.time * 1000));
    }
  }

  create() {
    const overlay = document.createElement('div');
    overlay.id = 'time-settings-overlay';

    const dialog = document.createElement('div');
    dialog.id = 'time-settings-dialog';

    const titleBar = document.createElement('div');
    titleBar.className = 'sound-dialog-title';
    const title = document.createElement('span');
    title.textContent = 'Day / Night';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sound-dialog-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => this.close());
    titleBar.appendChild(title);
    titleBar.appendChild(closeBtn);
    dialog.appendChild(titleBar);

    const infoRow = document.createElement('div');
    infoRow.className = 'time-info-row';
    this.timeLabel = document.createElement('span');
    this.timeLabel.className = 'time-clock';
    this.phaseLabel = document.createElement('span');
    this.phaseLabel.className = 'time-phase';
    infoRow.appendChild(this.timeLabel);
    infoRow.appendChild(this.phaseLabel);
    dialog.appendChild(infoRow);

    const sliderRow = document.createElement('div');
    sliderRow.className = 'time-slider-row';
    const sliderLabel = document.createElement('span');
    sliderLabel.textContent = 'Time';
    sliderLabel.className = 'time-slider-label';
    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = '0';
    this.slider.max = '1000';
    this.slider.value = String(Math.round(this.dayNight.time * 1000));
    this.slider.className = 'sound-slider time-scrub';
    this.slider.addEventListener('input', () => {
      this.dayNight.pin(parseInt(this.slider.value, 10) / 1000);
      this.setRadio('pinned');
      if (this.onUpdate) this.onUpdate();
    });
    sliderRow.appendChild(sliderLabel);
    sliderRow.appendChild(this.slider);
    dialog.appendChild(sliderRow);

    const modeRow = document.createElement('div');
    modeRow.className = 'time-mode-row';

    const modes = [
      { key: 'auto', label: 'Auto Cycle' },
      { key: 'pinned', label: 'Pinned' },
      { key: 'realtime', label: 'Real Clock' },
    ];

    modes.forEach(({ key, label }) => {
      const lbl = document.createElement('label');
      lbl.className = 'time-mode-label';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'time-mode';
      radio.value = key;
      radio.checked = this.dayNight.mode === key;
      radio.addEventListener('change', () => {
        if (key === 'auto') this.dayNight.setAuto();
        else if (key === 'realtime') this.dayNight.setRealtime();
        else this.dayNight.pin(this.dayNight.time);
        if (this.onUpdate) this.onUpdate();
      });
      lbl.appendChild(radio);
      lbl.appendChild(document.createTextNode(' ' + label));
      modeRow.appendChild(lbl);
      this.modeRadios[key] = radio;
    });

    dialog.appendChild(modeRow);

    const speedRow = document.createElement('div');
    speedRow.className = 'time-slider-row';
    const speedLabel = document.createElement('span');
    speedLabel.textContent = 'Speed';
    speedLabel.className = 'time-slider-label';
    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '60';
    speedSlider.max = '900';
    speedSlider.value = String(this.dayNight.cycleDuration);
    speedSlider.className = 'sound-slider';
    speedSlider.addEventListener('input', () => {
      this.dayNight.cycleDuration = parseInt(speedSlider.value, 10);
    });
    speedRow.appendChild(speedLabel);
    speedRow.appendChild(speedSlider);
    dialog.appendChild(speedRow);

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    document.body.appendChild(overlay);
    this.el = overlay;
    this.refreshDisplay();
  }

  setRadio(key) {
    for (const [k, radio] of Object.entries(this.modeRadios)) {
      radio.checked = k === key;
    }
  }
}
