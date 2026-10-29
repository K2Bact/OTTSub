/**
 * OTTSub - popup/modules/ui-style.js
 * Subtitle position locking, spacing, vertical offsets, scale ratios, color palettes, and background boxes.
 */

import { queuePopupStorageSave } from './storage.js';

let currentPrimarySpacing = 4;
let currentSecondarySpacing = 4;
let currentPrimaryPos = 0;
let currentSecondaryPos = 0;
let currentPrimaryScale = 1.00;
let currentSecondaryScale = 0.78;

export function updateLockPosUI(isLocked) {
  const lockPosToggle = document.getElementById('lock-pos-toggle');
  if (lockPosToggle) {
    const locked = !!isLocked;
    lockPosToggle.checked = locked;
    lockPosToggle.setAttribute('aria-checked', locked ? 'true' : 'false');
    if (locked) lockPosToggle.setAttribute('checked', '');
    else lockPosToggle.removeAttribute('checked');
  }
}

export function updatePrimarySpacingUI(step) {
  const lineSpacingVal = document.getElementById('line-spacing-val');
  const lineSpacingSlider = document.getElementById('line-spacing-slider');
  const num = Math.max(0, Math.min(6, parseInt(step, 10) || 0));
  currentPrimarySpacing = num;
  if (lineSpacingVal) lineSpacingVal.textContent = String(num);
  if (lineSpacingSlider) {
    lineSpacingSlider.value = String(num);
    lineSpacingSlider.setAttribute('aria-valuetext', `스텝 ${num}`);
  }
}

export function setPrimarySpacing(step, sendCommandFn = null) {
  const num = Math.max(0, Math.min(6, parseInt(step, 10) || 0));
  currentPrimarySpacing = num;
  updatePrimarySpacingUI(num);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_primary_line_spacing', num);
  queuePopupStorageSave('ottsub_primary_line_spacing', num);
  queuePopupStorageSave('ottsub_line_spacing', num);
}


export function updateSecondarySpacingUI(step) {
  const secondarySpacingVal = document.getElementById('secondary-spacing-val');
  const secondarySpacingSlider = document.getElementById('secondary-spacing-slider');
  const num = Math.max(0, Math.min(6, parseInt(step, 10) || 0));
  currentSecondarySpacing = num;
  if (secondarySpacingVal) secondarySpacingVal.textContent = String(num);
  if (secondarySpacingSlider) {
    secondarySpacingSlider.value = String(num);
    secondarySpacingSlider.setAttribute('aria-valuetext', `스텝 ${num}`);
  }
}

export function setSecondarySpacing(step, sendCommandFn = null) {
  const num = Math.max(0, Math.min(6, parseInt(step, 10) || 0));
  currentSecondarySpacing = num;
  updateSecondarySpacingUI(num);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_secondary_line_spacing', num);
  queuePopupStorageSave('ottsub_secondary_line_spacing', num);
}

export function updatePrimaryPosUI(offsetPx) {
  const primaryPosVal = document.getElementById('primary-pos-val');
  const primaryPosSlider = document.getElementById('primary-pos-slider');
  const num = Math.max(-50, Math.min(50, parseInt(offsetPx, 10) || 0));
  currentPrimaryPos = num;
  const sign = num > 0 ? '+' : '';
  if (primaryPosVal) primaryPosVal.textContent = `${sign}${num}px`;
  if (primaryPosSlider) {
    primaryPosSlider.value = String(num);
    primaryPosSlider.setAttribute('aria-valuetext', `${sign}${num}px`);
  }
}

export function setPrimaryPos(offsetPx, sendCommandFn = null) {
  const num = Math.max(-50, Math.min(50, parseInt(offsetPx, 10) || 0));
  currentPrimaryPos = num;
  updatePrimaryPosUI(num);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_primary_offset_y', num);
  queuePopupStorageSave('ottsub_primary_offset_y', num);
}

export function updateSecondaryPosUI(offsetPx) {
  const secondaryPosVal = document.getElementById('secondary-pos-val');
  const secondaryPosSlider = document.getElementById('secondary-pos-slider');
  const num = Math.max(-50, Math.min(50, parseInt(offsetPx, 10) || 0));
  currentSecondaryPos = num;
  const sign = num > 0 ? '+' : '';
  if (secondaryPosVal) secondaryPosVal.textContent = `${sign}${num}px`;
  if (secondaryPosSlider) {
    secondaryPosSlider.value = String(num);
    secondaryPosSlider.setAttribute('aria-valuetext', `${sign}${num}px`);
  }
}

export function setSecondaryPos(offsetPx, sendCommandFn = null) {
  const num = Math.max(-50, Math.min(50, parseInt(offsetPx, 10) || 0));
  currentSecondaryPos = num;
  updateSecondaryPosUI(num);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_secondary_offset_y', num);
  queuePopupStorageSave('ottsub_secondary_offset_y', num);
}

export function updatePrimaryScaleUI(scale, syncSlider = true) {
  const primaryScaleVal = document.getElementById('primary-scale-val');
  const primaryScaleSlider = document.getElementById('primary-scale-slider');
  const val = parseFloat(scale);
  if (!Number.isFinite(val)) return;
  const clamped = Math.max(0.60, Math.min(1.40, Math.round(val * 100) / 100));
  currentPrimaryScale = clamped;
  const formatted = `${Math.round(clamped * 100)}%`;
  if (primaryScaleVal) {
    primaryScaleVal.textContent = formatted;
  }
  if (primaryScaleSlider) {
    if (syncSlider) primaryScaleSlider.value = String(clamped);
    primaryScaleSlider.setAttribute('aria-valuetext', formatted);
  }
}

export function setPrimaryScale(scale, sendCommandFn = null) {
  const val = parseFloat(scale);
  if (!Number.isFinite(val)) return;
  const clamped = Math.max(0.60, Math.min(1.40, Math.round(val * 100) / 100));
  currentPrimaryScale = clamped;
  updatePrimaryScaleUI(clamped, false);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_primary_scale', clamped);
  queuePopupStorageSave('ottsub_primary_scale', clamped);
}

export function updatePrimaryColorUI(colorHex) {
  if (!colorHex || typeof colorHex !== 'string') return;
  const primaryColorChips = document.querySelectorAll('#primary-color-palette .color-chip');
  const lower = colorHex.toLowerCase();
  primaryColorChips.forEach(chip => {
    const chipColor = (chip.getAttribute('data-color') || '').toLowerCase();
    const isActive = chipColor === lower;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-checked', isActive ? 'true' : 'false');
    chip.setAttribute('tabindex', isActive ? '0' : '-1');
  });
}

export function setPrimaryColor(colorHex, sendCommandFn = null) {
  if (!colorHex || typeof colorHex !== 'string') return;
  updatePrimaryColorUI(colorHex);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_primary_color', colorHex);
  queuePopupStorageSave('ottsub_primary_color', colorHex);
}

export function updateSecondaryScaleUI(scale, syncSlider = true) {
  const secondaryScaleVal = document.getElementById('secondary-scale-val');
  const secondaryScaleSlider = document.getElementById('secondary-scale-slider');
  const val = parseFloat(scale);
  if (!Number.isFinite(val)) return;
  const clamped = Math.max(0.60, Math.min(1.20, Math.round(val * 100) / 100));
  currentSecondaryScale = clamped;
  const formatted = `${Math.round(clamped * 100)}%`;
  if (secondaryScaleVal) {
    secondaryScaleVal.textContent = formatted;
  }
  if (secondaryScaleSlider) {
    if (syncSlider) secondaryScaleSlider.value = String(clamped);
    secondaryScaleSlider.setAttribute('aria-valuetext', formatted);
  }
}

export function setSecondaryScale(scale, sendCommandFn = null) {
  const val = parseFloat(scale);
  if (!Number.isFinite(val)) return;
  const clamped = Math.max(0.60, Math.min(1.20, Math.round(val * 100) / 100));
  currentSecondaryScale = clamped;
  updateSecondaryScaleUI(clamped, false);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_secondary_scale', clamped);
  queuePopupStorageSave('ottsub_secondary_scale', clamped);
}

export function updateSecondaryColorUI(colorHex) {
  if (!colorHex || typeof colorHex !== 'string') return;
  const colorChips = document.querySelectorAll('#secondary-color-palette .color-chip');
  const lower = colorHex.toLowerCase();
  colorChips.forEach(chip => {
    const chipColor = (chip.getAttribute('data-color') || '').toLowerCase();
    const isActive = chipColor === lower;
    chip.classList.toggle('active', isActive);
    chip.setAttribute('aria-checked', isActive ? 'true' : 'false');
    chip.setAttribute('tabindex', isActive ? '0' : '-1');
  });
}

export function setSecondaryColor(colorHex, sendCommandFn = null) {
  if (!colorHex || typeof colorHex !== 'string') return;
  updateSecondaryColorUI(colorHex);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_secondary_color', colorHex);
  queuePopupStorageSave('ottsub_secondary_color', colorHex);
}

export function updatePrimaryBgBoxUI(enabled) {
  const primaryBgBoxToggle = document.getElementById('primary-bg-box-toggle');
  const bgBoxToggle = document.getElementById('bg-box-toggle');
  if (primaryBgBoxToggle) {
    primaryBgBoxToggle.checked = !!enabled;
  }
  if (bgBoxToggle) {
    bgBoxToggle.checked = !!enabled;
  }
}

export function setPrimaryBgBox(enabled, sendCommandFn = null) {
  const isChecked = !!enabled;
  updatePrimaryBgBoxUI(isChecked);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_primary_bg_box', isChecked);
  queuePopupStorageSave('ottsub_primary_bg_box', isChecked);
}

export function updateSecondaryBgBoxUI(enabled) {
  const secondaryBgBoxToggle = document.getElementById('secondary-bg-box-toggle');
  if (secondaryBgBoxToggle) {
    secondaryBgBoxToggle.checked = !!enabled;
  }
}

export function setSecondaryBgBox(enabled, sendCommandFn = null) {
  const isChecked = !!enabled;
  updateSecondaryBgBoxUI(isChecked);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_secondary_bg_box', isChecked);
  queuePopupStorageSave('ottsub_secondary_bg_box', isChecked);
}

export function updateBgBoxUI(enabled) {
  updatePrimaryBgBoxUI(enabled);
  updateSecondaryBgBoxUI(enabled);
}

export function setBgBox(enabled, sendCommandFn = null) {
  const isChecked = !!enabled;
  updateBgBoxUI(isChecked);
  if (typeof sendCommandFn === 'function') sendCommandFn('set_bg_box', isChecked);
  queuePopupStorageSave('ottsub_bg_box_enabled', isChecked);
  queuePopupStorageSave('ottsub_primary_bg_box', isChecked);
  queuePopupStorageSave('ottsub_secondary_bg_box', isChecked);
}

export function restoreStyleUI(data) {
  if (!data) return;
  const v = (k1, k2) => (data[k1] !== undefined ? data[k1] : data[k2]);
  const pSpacing = v('ottsub_primary_line_spacing', 'primaryLineSpacing');
  if (pSpacing !== undefined) updatePrimarySpacingUI(pSpacing);
  const sSpacing = v('ottsub_secondary_line_spacing', 'secondaryLineSpacing');
  if (sSpacing !== undefined) updateSecondarySpacingUI(sSpacing);
  const pPos = v('ottsub_primary_offset_y', 'primaryOffsetY');
  if (pPos !== undefined) updatePrimaryPosUI(pPos);
  const sPos = v('ottsub_secondary_offset_y', 'secondaryOffsetY');
  if (sPos !== undefined) updateSecondaryPosUI(sPos);
  const pScale = v('ottsub_primary_scale', 'primaryScale');
  if (pScale !== undefined) updatePrimaryScaleUI(pScale);
  const sScale = v('ottsub_secondary_scale', 'secondaryScale');
  if (sScale !== undefined) updateSecondaryScaleUI(sScale);
  const pColor = v('ottsub_primary_color', 'primaryColor');
  if (pColor) updatePrimaryColorUI(pColor);
  const sColor = v('ottsub_secondary_color', 'secondaryColor');
  if (sColor) updateSecondaryColorUI(sColor);
  const pBg = v('ottsub_primary_bg_box', 'primaryBgBox');
  if (pBg !== undefined) updatePrimaryBgBoxUI(pBg);
  const sBg = v('ottsub_secondary_bg_box', 'secondaryBgBox');
  if (sBg !== undefined) updateSecondaryBgBoxUI(sBg);
}

// WAI-ARIA Radio Group arrow key navigation for color palettes
export function setupColorPaletteKeyboardNav(container, chips, onSelectColor) {
  if (!container || !chips || chips.length === 0) return;
  const chipArr = Array.from(chips);
  container.addEventListener('keydown', e => {
    const activeIdx = chipArr.findIndex(c => c.getAttribute('aria-checked') === 'true' || c.classList.contains('active'));
    let nextIdx = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = activeIdx >= 0 ? (activeIdx + 1) % chipArr.length : 0;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = activeIdx >= 0 ? (activeIdx - 1 + chipArr.length) % chipArr.length : chipArr.length - 1;
    }
    if (nextIdx !== -1) {
      const targetChip = chipArr[nextIdx];
      const color = targetChip.getAttribute('data-color');
      if (color) {
        onSelectColor(color);
        targetChip.focus();
      }
    }
  });
}

export function setupStyleControls(sendCommandFn = null) {
  // Tabs: primary vs secondary
  const tabBtnPrimary = document.getElementById('tab-btn-primary');
  const tabBtnSecondary = document.getElementById('tab-btn-secondary');
  const panelPrimary = document.getElementById('panel-primary');
  const panelSecondary = document.getElementById('panel-secondary');

  if (tabBtnPrimary && tabBtnSecondary) {
    tabBtnPrimary.addEventListener('click', () => {
      tabBtnPrimary.classList.add('active');
      tabBtnSecondary.classList.remove('active');
      if (panelPrimary) { panelPrimary.style.display = 'flex'; panelPrimary.classList.add('active'); }
      if (panelSecondary) { panelSecondary.style.display = 'none'; panelSecondary.classList.remove('active'); }
    });
    tabBtnSecondary.addEventListener('click', () => {
      tabBtnSecondary.classList.add('active');
      tabBtnPrimary.classList.remove('active');
      if (panelPrimary) { panelPrimary.style.display = 'none'; panelPrimary.classList.remove('active'); }
      if (panelSecondary) { panelSecondary.style.display = 'flex'; panelSecondary.classList.add('active'); }
    });
  }

  // Spacing Steppers
  const btnSpacingDec = document.getElementById('btn-spacing-dec');
  const btnSpacingInc = document.getElementById('btn-spacing-inc');
  if (btnSpacingDec) btnSpacingDec.addEventListener('click', () => setPrimarySpacing(currentPrimarySpacing - 1, sendCommandFn));
  if (btnSpacingInc) btnSpacingInc.addEventListener('click', () => setPrimarySpacing(currentPrimarySpacing + 1, sendCommandFn));

  const btnSecSpacingDec = document.getElementById('btn-secondary-spacing-dec');
  const btnSecSpacingInc = document.getElementById('btn-secondary-spacing-inc');
  if (btnSecSpacingDec) btnSecSpacingDec.addEventListener('click', () => setSecondarySpacing(currentSecondarySpacing - 1, sendCommandFn));
  if (btnSecSpacingInc) btnSecSpacingInc.addEventListener('click', () => setSecondarySpacing(currentSecondarySpacing + 1, sendCommandFn));

  // Pos Steppers
  const btnPrimaryPosDec = document.getElementById('btn-primary-pos-dec');
  const btnPrimaryPosInc = document.getElementById('btn-primary-pos-inc');
  if (btnPrimaryPosDec) btnPrimaryPosDec.addEventListener('click', () => setPrimaryPos(currentPrimaryPos - 2, sendCommandFn));
  if (btnPrimaryPosInc) btnPrimaryPosInc.addEventListener('click', () => setPrimaryPos(currentPrimaryPos + 2, sendCommandFn));

  const btnSecPosDec = document.getElementById('btn-secondary-pos-dec');
  const btnSecPosInc = document.getElementById('btn-secondary-pos-inc');
  if (btnSecPosDec) btnSecPosDec.addEventListener('click', () => setSecondaryPos(currentSecondaryPos - 2, sendCommandFn));
  if (btnSecPosInc) btnSecPosInc.addEventListener('click', () => setSecondaryPos(currentSecondaryPos + 2, sendCommandFn));

  // Scale Steppers
  const btnPrimaryScaleDec = document.getElementById('btn-primary-scale-dec');
  const btnPrimaryScaleInc = document.getElementById('btn-primary-scale-inc');
  if (btnPrimaryScaleDec) btnPrimaryScaleDec.addEventListener('click', () => setPrimaryScale(currentPrimaryScale - 0.05, sendCommandFn));
  if (btnPrimaryScaleInc) btnPrimaryScaleInc.addEventListener('click', () => setPrimaryScale(currentPrimaryScale + 0.05, sendCommandFn));

  const btnSecScaleDec = document.getElementById('btn-secondary-scale-dec');
  const btnSecScaleInc = document.getElementById('btn-secondary-scale-inc');
  if (btnSecScaleDec) btnSecScaleDec.addEventListener('click', () => setSecondaryScale(currentSecondaryScale - 0.05, sendCommandFn));
  if (btnSecScaleInc) btnSecScaleInc.addEventListener('click', () => setSecondaryScale(currentSecondaryScale + 0.05, sendCommandFn));

  // Color Chips
  const primaryChips = document.querySelectorAll('#primary-color-palette .color-chip');
  primaryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const color = chip.getAttribute('data-color');
      if (color) setPrimaryColor(color, sendCommandFn);
    });
  });
  const primaryPalette = document.getElementById('primary-color-palette');
  if (primaryPalette) {
    setupColorPaletteKeyboardNav(primaryPalette, primaryChips, color => setPrimaryColor(color, sendCommandFn));
  }

  const secondaryChips = document.querySelectorAll('#secondary-color-palette .color-chip');
  secondaryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const color = chip.getAttribute('data-color');
      if (color) setSecondaryColor(color, sendCommandFn);
    });
  });
  const secondaryPalette = document.getElementById('secondary-color-palette');
  if (secondaryPalette) {
    setupColorPaletteKeyboardNav(secondaryPalette, secondaryChips, color => setSecondaryColor(color, sendCommandFn));
  }

  // Background Box Toggles
  const primaryBgBoxToggle = document.getElementById('primary-bg-box-toggle');
  if (primaryBgBoxToggle) {
    primaryBgBoxToggle.addEventListener('change', () => setPrimaryBgBox(primaryBgBoxToggle.checked, sendCommandFn));
  }
  const secondaryBgBoxToggle = document.getElementById('secondary-bg-box-toggle');
  if (secondaryBgBoxToggle) {
    secondaryBgBoxToggle.addEventListener('change', () => setSecondaryBgBox(secondaryBgBoxToggle.checked, sendCommandFn));
  }

  // Lock Position Toggle
  const lockPosToggle = document.getElementById('lock-pos-toggle');
  if (lockPosToggle) {
    lockPosToggle.addEventListener('change', () => {
      const isLocked = lockPosToggle.checked;
      updateLockPosUI(isLocked);
      queuePopupStorageSave('ottsub_lock_pos', isLocked);
      if (typeof sendCommandFn === 'function') sendCommandFn('set_lock_pos', isLocked);
    });
  }
}

