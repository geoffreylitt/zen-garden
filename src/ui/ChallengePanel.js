export class ChallengePanel {
  constructor(challengeManager) {
    this.cm = challengeManager;
    this.minimized = false;
    this.el = null;
    this.bodyEl = null;
    this.progressBarEl = null;
    this.progressTextEl = null;
    this.headerIconEl = null;
    this.create();
  }

  create() {
    const panel = document.createElement('div');
    panel.id = 'challenge-panel';

    // Header row
    const header = document.createElement('div');
    header.id = 'challenge-header';
    header.addEventListener('click', () => this.toggle());

    const icon = document.createElement('span');
    icon.id = 'challenge-icon';
    icon.textContent = '🌸';
    this.headerIconEl = icon;

    const titleEl = document.createElement('span');
    titleEl.id = 'challenge-title';
    titleEl.textContent = 'Daily Challenge';

    const toggleBtn = document.createElement('span');
    toggleBtn.id = 'challenge-toggle-btn';
    toggleBtn.textContent = '−';
    this.toggleBtn = toggleBtn;

    header.appendChild(icon);
    header.appendChild(titleEl);
    header.appendChild(toggleBtn);
    panel.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.id = 'challenge-body';

    const nameEl = document.createElement('div');
    nameEl.id = 'challenge-name';
    nameEl.textContent = this.cm.challenge.name;

    const descEl = document.createElement('div');
    descEl.id = 'challenge-desc';
    descEl.textContent = this.cm.challenge.description;

    const barWrap = document.createElement('div');
    barWrap.id = 'challenge-bar-wrap';

    const bar = document.createElement('div');
    bar.id = 'challenge-bar';
    this.progressBarEl = bar;
    barWrap.appendChild(bar);

    const progressText = document.createElement('div');
    progressText.id = 'challenge-progress-text';
    this.progressTextEl = progressText;

    body.appendChild(nameEl);
    body.appendChild(descEl);
    body.appendChild(barWrap);
    body.appendChild(progressText);
    panel.appendChild(body);
    this.bodyEl = body;

    document.body.appendChild(panel);
    this.el = panel;

    // Wire callbacks
    this.cm.onProgress = (prog) => this.updateProgress(prog);
    this.cm.onComplete = () => this.showComplete();

    // Render initial state
    if (this.cm.completed) {
      this.showComplete();
    } else {
      this.updateProgress(this.cm.getProgress());
    }
  }

  updateProgress(prog) {
    if (!this.progressBarEl) return;
    const pct = prog.total > 0 ? Math.min((prog.current / prog.total) * 100, 100) : 0;
    this.progressBarEl.style.width = `${pct}%`;
    this.progressTextEl.textContent = `${prog.current} / ${prog.total} ${prog.unit}`;
    this.progressTextEl.classList.remove('challenge-complete-text');
    this.progressBarEl.classList.remove('challenge-bar-complete');
    this.headerIconEl.textContent = '🌸';
  }

  showComplete() {
    if (!this.progressBarEl) return;
    this.progressBarEl.style.width = '100%';
    this.progressBarEl.classList.add('challenge-bar-complete');
    this.progressTextEl.textContent = '✓ Challenge complete!';
    this.progressTextEl.classList.add('challenge-complete-text');
    this.headerIconEl.textContent = '✨';
    this.el.classList.add('challenge-completed');
  }

  toggle() {
    this.minimized = !this.minimized;
    this.bodyEl.style.display = this.minimized ? 'none' : 'block';
    this.toggleBtn.textContent = this.minimized ? '+' : '−';
  }
}
