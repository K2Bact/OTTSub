/**
 * OTTSub - popup/modules/ui-sync.js
 * Subtitle sync display formatting, primary/secondary sync target switching, and offset adjustments.
 */

import { queuePopupStorageSave } from './storage.js';

let currentPrimaryOffsetMs = 0;
let currentSecondaryOffsetMs = 0;
let activeSyncTarget = 'primary'; // 'primary' | 'secondary'

export function getActiveSyncTarget() {
  return activeSyncTarget;
}

export function getCurrentPrimaryOffsetMs() {
  return currentPrimaryOffsetMs;
}

export function getCurrentSecondaryOffsetMs() {
  return currentSecondaryOffsetMs;
}

export function updateDisplay(offsetMs) {
  const syncValue = document.getElementById('sync-value');
  const syncSlider = document.getElementById('sync-slider');

  const raw = Number(offsetMs);
  const ms = Number.isFinite(raw) ? raw : 0;
  currentPrimaryOffsetMs = ms;
  const sec = (ms / 1000).toFixed(1);
  const sign = ms > 0 ? '+' : '';
  const formatted = `${sign}${sec}s`;
  if (syncValue) {
    syncValue.textContent = formatted;
    syncValue.classList.remove('positive', 'negative');
    if (ms > 0) syncValue.classList.add('positive');
    else if (ms < 0) syncValue.classList.add('negative');
  }

  if (activeSyncTarget === 'primary' && syncSlider) {
    syncSlider.value = ms;
    syncSlider.setAttribute('aria-valuetext', formatted);
  }
}

export function updateSecondaryDisplay(offsetMs) {
  const secondarySyncValue = document.getElementById('secondary-sync-value');
  const syncSlider = document.getElementById('sync-slider');

  const raw = Number(offsetMs);
  const ms = Number.isFinite(raw) ? raw : 0;
  currentSecondaryOffsetMs = ms;
  const sec = (ms / 1000).toFixed(1);
  const sign = ms > 0 ? '+' : '';
  const formatted = `${sign}${sec}s`;
  if (secondarySyncValue) {
    secondarySyncValue.textContent = formatted;
    secondarySyncValue.classList.remove('positive', 'negative');
    if (ms > 0) secondarySyncValue.classList.add('positive');
    else if (ms < 0) secondarySyncValue.classList.add('negative');
  }

  if (activeSyncTarget === 'secondary' && syncSlider) {
    syncSlider.value = ms;
    syncSlider.setAttribute('aria-valuetext', formatted);
  }
}

export function setSyncTarget(target) {
  activeSyncTarget = (target === 'secondary') ? 'secondary' : 'primary';
  const isPrimary = activeSyncTarget === 'primary';
  const syncCardPrimary = document.getElementById('sync-card-primary');
  const syncCardSecondary = document.getElementById('sync-card-secondary');
  const syncSlider = document.getElementById('sync-slider');

  if (syncCardPrimary) {
    syncCardPrimary.classList.toggle('active', isPrimary);
    syncCardPrimary.setAttribute('aria-selected', isPrimary ? 'true' : 'false');
    syncCardPrimary.setAttribute('tabindex', isPrimary ? '0' : '-1');
  }
  if (syncCardSecondary) {
    syncCardSecondary.classList.toggle('active', !isPrimary);
    syncCardSecondary.setAttribute('aria-selected', !isPrimary ? 'true' : 'false');
    syncCardSecondary.setAttribute('tabindex', !isPrimary ? '0' : '-1');
  }
  if (syncSlider) {
    const activeMs = isPrimary ? currentPrimaryOffsetMs : currentSecondaryOffsetMs;
    syncSlider.value = activeMs;
    const sec = (activeMs / 1000).toFixed(1);
    const sign = activeMs > 0 ? '+' : '';
    syncSlider.setAttribute('aria-valuetext', `${sign}${sec}s`);
  }
}

export function adjustActiveSync(deltaMs, sendCommandFn = null) {
  if (typeof sendCommandFn === 'function') {
    if (activeSyncTarget === 'secondary') {
      sendCommandFn('adjust_secondary_offset', { deltaMs });
    } else {
      sendCommandFn('adjust_offset', { deltaMs });
    }
  }
}

export function resetSync(target = activeSyncTarget, sendCommandFn = null) {
  if (target === 'secondary') {
    if (typeof sendCommandFn === 'function') sendCommandFn('reset_secondary_offset');
    updateSecondaryDisplay(0);
    queuePopupStorageSave('ottsub_secondary_offset', 0);
  } else {
    if (typeof sendCommandFn === 'function') sendCommandFn('reset_offset');
    updateDisplay(0);
    queuePopupStorageSave('ottsub_offset', 0);
  }
}

export function setupSyncControls(sendCommandFn = null) {
  const syncCardPrimary = document.getElementById('sync-card-primary');
  const syncCardSecondary = document.getElementById('sync-card-secondary');
  const syncSlider = document.getElementById('sync-slider');

  if (syncCardPrimary) {
    syncCardPrimary.addEventListener('click', () => {
      setSyncTarget('primary');
      queuePopupStorageSave('ottsub_active_sync_target', 'primary');
    });
    syncCardPrimary.addEventListener('dblclick', () => {
      resetSync('primary', sendCommandFn);
    });
    syncCardPrimary.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' && syncCardSecondary) {
        e.preventDefault();
        syncCardSecondary.focus();
        syncCardSecondary.click();
      }
    });
  }

  if (syncCardSecondary) {
    syncCardSecondary.addEventListener('click', () => {
      setSyncTarget('secondary');
      queuePopupStorageSave('ottsub_active_sync_target', 'secondary');
    });
    syncCardSecondary.addEventListener('dblclick', () => {
      resetSync('secondary', sendCommandFn);
    });
    syncCardSecondary.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && syncCardPrimary) {
        e.preventDefault();
        syncCardPrimary.focus();
        syncCardPrimary.click();
      }
    });
  }

  if (syncSlider) {
    syncSlider.addEventListener('input', () => {
      const raw = Number(syncSlider.value);
      const clamped = Math.max(-10000, Math.min(10000, raw));
      if (activeSyncTarget === 'secondary') {
        updateSecondaryDisplay(clamped);
        queuePopupStorageSave('ottsub_secondary_offset', clamped);
        if (typeof sendCommandFn === 'function') {
          sendCommandFn('set_secondary_offset', { offsetMs: clamped });
        }
      } else {
        updateDisplay(clamped);
        queuePopupStorageSave('ottsub_offset', clamped);
        if (typeof sendCommandFn === 'function') {
          sendCommandFn('set_offset', { offsetMs: clamped });
        }
      }
    });
    syncSlider.addEventListener('dblclick', () => {
      resetSync(activeSyncTarget, sendCommandFn);
    });
  }
}

