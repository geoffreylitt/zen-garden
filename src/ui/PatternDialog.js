const PATTERNS = [
  {
    key: 'CIRCLES',
    label: '◎ Ripples',
    desc: 'Concentric circles radiating from the centre',
  },
  {
    key: 'LINES',
    label: '≡ Lines',
    desc: 'Classic parallel rows across the garden',
  },
  {
    key: 'WAVES',
    label: '〜 Waves',
    desc: 'Flowing sine-wave furrows',
  },
];

export class PatternDialog {
  constructor(patternStampTool) {
    this.tool = patternStampTool;
    this.el = null;
  }

  open() {
    if (!this.el) this._create();
    this.el.style.display = 'flex';
  }

  close() {
    if (this.el) this.el.style.display = 'none';
  }

  _create() {
    const overlay = document.createElement('div');
    overlay.id = 'pattern-overlay';

    const dialog = document.createElement('div');
    dialog.id = 'pattern-dialog';

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'pattern-dialog-title';
    const title = document.createElement('span');
    title.textContent = 'Rake Patterns';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sound-dialog-close'; // reuse existing close-button style
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', () => this.close());
    titleBar.appendChild(title);
    titleBar.appendChild(closeBtn);
    dialog.appendChild(titleBar);

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.className = 'pattern-subtitle';
    subtitle.textContent = 'Apply a preset pattern to the whole garden';
    dialog.appendChild(subtitle);

    // Pattern buttons
    PATTERNS.forEach(({ key, label, desc }) => {
      const btn = document.createElement('button');
      btn.className = 'pattern-btn';

      const nameEl = document.createElement('span');
      nameEl.className = 'pattern-btn-name';
      nameEl.textContent = label;

      const descEl = document.createElement('span');
      descEl.className = 'pattern-btn-desc';
      descEl.textContent = desc;

      btn.appendChild(nameEl);
      btn.appendChild(descEl);

      btn.addEventListener('click', () => {
        this.tool.applyPattern(key);
        this.close();
      });

      dialog.appendChild(btn);
    });

    overlay.appendChild(dialog);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    document.body.appendChild(overlay);
    this.el = overlay;
  }
}
