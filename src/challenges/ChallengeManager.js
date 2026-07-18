const CHALLENGES = [
  {
    id: 'place-5-rocks',
    name: 'Rock Garden',
    description: 'Place 5 rocks in the garden.',
    check: (m) => m.rocksPlaced >= 5,
    progress: (m) => ({ current: Math.min(m.rocksPlaced, 5), total: 5, unit: 'rocks' }),
  },
  {
    id: 'plant-3-shrubs',
    name: 'Shrub Garden',
    description: 'Plant 3 shrubs in the garden.',
    check: (m) => m.shrubsPlaced >= 3,
    progress: (m) => ({ current: Math.min(m.shrubsPlaced, 3), total: 3, unit: 'shrubs' }),
  },
  {
    id: 'zen-path',
    name: 'Zen Path',
    description: 'Rake a long path through the sand.',
    check: (m) => m.rakeDistance >= 800,
    progress: (m) => ({ current: Math.min(Math.round(m.rakeDistance), 800), total: 800, unit: 'px' }),
  },
  {
    id: 'build-teahouse',
    name: 'Build a Teahouse',
    description: 'Place a teahouse in your garden.',
    check: (m) => m.teahousePlaced >= 1,
    progress: (m) => ({ current: Math.min(m.teahousePlaced, 1), total: 1, unit: 'placed' }),
  },
  {
    id: 'rock-collection',
    name: 'Rock Collection',
    description: 'Place 10 rocks in the garden.',
    check: (m) => m.rocksPlaced >= 10,
    progress: (m) => ({ current: Math.min(m.rocksPlaced, 10), total: 10, unit: 'rocks' }),
  },
  {
    id: 'grand-raking',
    name: 'Grand Raking',
    description: 'Rake 2000 pixels of sand patterns.',
    check: (m) => m.rakeDistance >= 2000,
    progress: (m) => ({ current: Math.min(Math.round(m.rakeDistance), 2000), total: 2000, unit: 'px' }),
  },
  {
    id: 'full-garden',
    name: 'Full Garden',
    description: 'Place 2 rocks, 2 shrubs, and a teahouse.',
    check: (m) => m.rocksPlaced >= 2 && m.shrubsPlaced >= 2 && m.teahousePlaced >= 1,
    progress: (m) => ({
      current: Math.min(m.rocksPlaced, 2) + Math.min(m.shrubsPlaced, 2) + Math.min(m.teahousePlaced, 1),
      total: 5,
      unit: 'items',
    }),
  },
];

const STORAGE_KEY = 'zen-garden-daily-challenge';

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function daysSinceEpoch() {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24));
}

export class ChallengeManager {
  constructor() {
    const dayIndex = daysSinceEpoch();
    this.challenge = CHALLENGES[dayIndex % CHALLENGES.length];

    const stored = this._load();
    if (stored && stored.date === todayString()) {
      this.metrics = stored.metrics;
      this.completed = stored.completed;
    } else {
      this.metrics = { rocksPlaced: 0, shrubsPlaced: 0, teahousePlaced: 0, rakeDistance: 0 };
      this.completed = false;
      this._save();
    }

    this.onComplete = null;
    this.onProgress = null;
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: todayString(),
        metrics: this.metrics,
        completed: this.completed,
      }));
    } catch {
      // storage unavailable — continue without persistence
    }
  }

  addRock() { this.metrics.rocksPlaced++; this._update(); }
  addShrub() { this.metrics.shrubsPlaced++; this._update(); }
  addTeahouse() { this.metrics.teahousePlaced++; this._update(); }

  addRakeDistance(dist) {
    this.metrics.rakeDistance += dist;
    this._update();
  }

  getProgress() {
    return this.challenge.progress(this.metrics);
  }

  _update() {
    this._save();
    const wasCompleted = this.completed;
    if (this.challenge.check(this.metrics)) {
      this.completed = true;
      this._save();
      if (!wasCompleted && this.onComplete) this.onComplete();
    }
    if (this.onProgress) this.onProgress(this.getProgress());
  }
}
