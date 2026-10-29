/**
 * OTTSub - popup/modules/ui-learning.js
 * Language learning subtitle obscuration (Hide / Blur) segmented controls and smart hover-to-pause.
 */

import { queuePopupStorageSave } from './storage.js';

const edited = new Set();
export function restoreLearningUI(data, initial = false) {
  if (!data) return;
  for (const [key, statusKey, update] of [
    ['ottsub_blur_target', 'blurTarget', updateBlurTargetUI],
    ['ottsub_blur_mode', 'blurMode', updateBlurModeUI],
    ['ottsub_hover_pause', 'hoverPause', updateHoverPauseUI]
  ]) {
    if (initial && edited.has(key)) continue;
    const value = data[key] !== undefined ? data[key] : data[statusKey];
    if (value !== undefined) update(value);
  }
}

export function updateBlurTargetUI(target) {
  const blurTargetButtons = document.querySelectorAll('#blur-target-control .segment-btn');
  const blurModeRow = document.getElementById('blur-mode-row');
  const hoverPauseRow = document.getElementById('hover-pause-row');
  const valid = ['none', 'secondary', 'primary', 'both'];
  const activeTarget = valid.includes(target) ? target : 'none';

  blurTargetButtons.forEach(btn => {
    const isMatch = btn.getAttribute('data-target') === activeTarget;
    btn.classList.toggle('active', isMatch);
    btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
  });

  const isNone = (activeTarget === 'none');
  const blurModeButtons = document.querySelectorAll('#blur-mode-control .segment-btn');
  const hoverPauseToggle = document.getElementById('hover-pause-toggle');

  blurModeButtons.forEach(btn => {
    btn.disabled = isNone;
    btn.tabIndex = isNone ? -1 : 0;
  });
  if (hoverPauseToggle) {
    hoverPauseToggle.disabled = false;
  }

  if (blurModeRow) {
    blurModeRow.style.opacity = isNone ? '0.4' : '1';
    blurModeRow.style.pointerEvents = isNone ? 'none' : 'auto';
    blurModeRow.setAttribute('aria-disabled', isNone ? 'true' : 'false');
  }
  if (hoverPauseRow) {
    hoverPauseRow.style.opacity = '1';
    hoverPauseRow.style.pointerEvents = 'auto';
    hoverPauseRow.setAttribute('aria-disabled', 'false');
  }
}

export function updateBlurModeUI(mode) {
  const blurModeButtons = document.querySelectorAll('#blur-mode-control .segment-btn');
  const valid = ['blur_4', 'blur_8', 'blur_14'];
  const activeMode = valid.includes(mode) ? mode : 'blur_8';

  blurModeButtons.forEach(btn => {
    const isMatch = btn.getAttribute('data-mode') === activeMode;
    btn.classList.toggle('active', isMatch);
    btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
  });
}

export function updateHoverPauseUI(enabled) {
  const hoverPauseToggle = document.getElementById('hover-pause-toggle');
  if (hoverPauseToggle) {
    hoverPauseToggle.checked = !!enabled;
  }
}

export function setupLearningControls(sendCommandFn) {
  const blurTargetButtons = document.querySelectorAll('#blur-target-control .segment-btn');
  const blurModeButtons = document.querySelectorAll('#blur-mode-control .segment-btn');
  const hoverPauseToggle = document.getElementById('hover-pause-toggle');

  blurTargetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target') || 'none';
      edited.add('ottsub_blur_target');
      updateBlurTargetUI(target);
      queuePopupStorageSave('ottsub_blur_target', target);
      if (typeof sendCommandFn === 'function') sendCommandFn('set_blur_target', { target });
    });
  });

  blurModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode') || 'blur_8';
      edited.add('ottsub_blur_mode');
      updateBlurModeUI(mode);
      queuePopupStorageSave('ottsub_blur_mode', mode);
      if (typeof sendCommandFn === 'function') sendCommandFn('set_blur_mode', { mode });
    });
  });

  if (hoverPauseToggle) {
    hoverPauseToggle.addEventListener('change', () => {
      const enabled = hoverPauseToggle.checked;
      edited.add('ottsub_hover_pause');
      queuePopupStorageSave('ottsub_hover_pause', enabled);
      if (typeof sendCommandFn === 'function') sendCommandFn('set_hover_pause', { enabled });
    });
  }
}
