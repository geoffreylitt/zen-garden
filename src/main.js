import { ZenGarden3D } from './ZenGarden3D.js';

const container = document.getElementById('canvas-container');
const garden = new ZenGarden3D(container);

const modeButtons = document.querySelectorAll('.mode-btn');
const toolButtons = document.querySelectorAll('.tool-btn');
const presetButtons = document.querySelectorAll('.preset-btn');
const contemplationPanel = document.getElementById('contemplation-panel');
const photoPanel = document.getElementById('photo-panel');
const controlsHint = document.getElementById('controls-hint');
const captureBtn = document.getElementById('capture-btn');
const photoModal = document.getElementById('photo-modal');
const photoPreview = document.getElementById('photo-preview');
const savePhotoBtn = document.getElementById('save-photo-btn');
const sharePhotoBtn = document.getElementById('share-photo-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

let currentPhotoData = null;

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    
    modeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    garden.setCameraMode(mode);
    
    if (mode === 'contemplation') {
      contemplationPanel.classList.add('visible');
      photoPanel.classList.add('visible');
      controlsHint.classList.add('visible');
      presetButtons[0].classList.add('active');
    } else {
      contemplationPanel.classList.remove('visible');
      photoPanel.classList.remove('visible');
      controlsHint.classList.remove('visible');
      presetButtons.forEach(b => b.classList.remove('active'));
    }
  });
});

toolButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    const action = btn.dataset.action;
    
    if (tool) {
      toolButtons.forEach(b => {
        if (b.dataset.tool) b.classList.remove('active');
      });
      btn.classList.add('active');
      garden.activeTool = tool;
    }
    
    if (action === 'clear') {
      garden.clearSand();
    }
    
    if (action === 'sound') {
      const enabled = garden.toggleSound();
      btn.style.opacity = enabled ? '1' : '0.5';
      btn.textContent = enabled ? 'Sound' : 'Muted';
    }
  });
});

presetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const presetIndex = parseInt(btn.dataset.preset);
    
    presetButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    garden.setContemplationView(presetIndex);
    
    if (presetIndex === 5) {
      controlsHint.classList.add('visible');
    } else {
      controlsHint.classList.remove('visible');
    }
  });
});

captureBtn.addEventListener('click', () => {
  currentPhotoData = garden.capturePhoto();
  photoPreview.src = currentPhotoData;
  photoModal.classList.add('visible');
});

closeModalBtn.addEventListener('click', () => {
  photoModal.classList.remove('visible');
  currentPhotoData = null;
});

savePhotoBtn.addEventListener('click', () => {
  if (!currentPhotoData) return;
  
  const link = document.createElement('a');
  link.download = `zen-garden-${Date.now()}.png`;
  link.href = currentPhotoData;
  link.click();
});

sharePhotoBtn.addEventListener('click', async () => {
  if (!currentPhotoData) return;
  
  try {
    const response = await fetch(currentPhotoData);
    const blob = await response.blob();
    const file = new File([blob], 'zen-garden.png', { type: 'image/png' });
    
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'My Zen Garden',
        text: 'Check out my peaceful zen garden!',
        files: [file],
      });
    } else if (navigator.share) {
      await navigator.share({
        title: 'My Zen Garden',
        text: 'Check out my peaceful zen garden!',
      });
    } else {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('Photo copied to clipboard!');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      try {
        const response = await fetch(currentPhotoData);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        alert('Photo copied to clipboard!');
      } catch (clipErr) {
        console.error('Failed to share or copy:', clipErr);
        alert('Unable to share. Please save the photo and share manually.');
      }
    }
  }
});

photoModal.addEventListener('click', (e) => {
  if (e.target === photoModal) {
    photoModal.classList.remove('visible');
    currentPhotoData = null;
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (photoModal.classList.contains('visible')) {
      photoModal.classList.remove('visible');
      currentPhotoData = null;
    }
  }
  
  if (e.key === 'p' || e.key === 'P') {
    if (garden.cameraMode === 'contemplation') {
      captureBtn.click();
    }
  }
});
