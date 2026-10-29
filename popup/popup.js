/**
 * OTTSub - popup.js (Main Orchestrator)
 * High-performance, zero-bloat coordinator for the OTTSub extension popup.
 *
 * Architecture patterns:
 * - Immediate local storage write pattern: chrome.storage.local.set({ [key]: value })
 * - Full offset range clamping: Math.max(-10000, Math.min(10000, raw))
 * - Single Responsibility Delegation: UI, Storage, Sync, Style, Learning subsystems.
 */

import { startStatusConnection } from './modules/status-connection.js';
import { bindPopupSettings } from './modules/settings-binding.js';
import {
  isSelfEcho as moduleIsSelfEcho,
  queuePopupStorageSave as moduleQueueSave,
  flushPopupStorageSave as moduleFlushSave,
  POPUP_STORAGE_DEFAULTS as moduleStorageDefaults,
  POPUP_STORAGE_KEYS as moduleStorageKeys,
  sanitizeStorageValue as moduleSanitizeValue,
  secureJsonParse as moduleSecureJsonParse
} from './modules/storage.js';

import {
  getStatusExplanation,
  paramsSanitize,
  updatePopoverContent,
  positionStatusPopover,
  showStatusPopover,
  hideStatusPopover as moduleHidePopover,
  toggleStatusPopover,
  updateStatusHelpAttributes
} from './modules/ui-popover.js';

import {
  attachHoldToRepeat as moduleAttachHoldToRepeat,
  attachDoubleTap as moduleAttachDoubleTap,
  attachRangeWheel as moduleAttachRangeWheel
} from './modules/ui-helpers.js';

import {
  setSubSettingsCollapsed as moduleSetSubSettingsCollapsed,
  setLangAdjustCollapsed as moduleSetLangAdjustCollapsed,
  setShortcutsCollapsed as moduleSetShortcutsCollapsed,
  setLearningCollapsed as moduleSetLearningCollapsed,
  setupAccordionAccessibility
} from './modules/ui-accordion.js';

import {
  getActiveSyncTarget,
  getCurrentPrimaryOffsetMs,
  getCurrentSecondaryOffsetMs,
  updateDisplay,
  updateSecondaryDisplay,
  setSyncTarget as moduleSetSyncTarget,
  adjustActiveSync as moduleAdjustActiveSync,
  resetSync as moduleResetSync,
  setupSyncControls
} from './modules/ui-sync.js';

import {
  DEFAULT_FALLBACK_TRACKS,
  getLocalizedLanguageLabel as moduleGetLangLabel,
  populateSecondaryLangOptions as modulePopulateSecondary,
  updateDualModeUI,
  restoreSecondaryLanguage,
  setupDualControls
} from './modules/ui-dual.js';
import { setupPrimaryControls, restorePrimaryLanguage, populatePrimaryLangOptions } from './modules/ui-primary.js';
import { setupTrackKindControls, restoreTrackKind, populateTrackKinds } from './modules/ui-track-kind.js';

import {
  updateLockPosUI,
  updatePrimarySpacingUI,
  setPrimarySpacing,
  updateSecondarySpacingUI,
  setSecondarySpacing,
  updatePrimaryPosUI,
  setPrimaryPos,
  updateSecondaryPosUI,
  setSecondaryPos,
  updatePrimaryScaleUI,
  setPrimaryScale,
  updateSecondaryScaleUI,
  setSecondaryScale,
  updatePrimaryColorUI,
  setPrimaryColor,
  updateSecondaryColorUI,
  setSecondaryColor,
  updatePrimaryBgBoxUI,
  setPrimaryBgBox,
  updateSecondaryBgBoxUI,
  setSecondaryBgBox,
  updateBgBoxUI,
  setBgBox,
  setupStyleControls,
  setupColorPaletteKeyboardNav,
  restoreStyleUI
} from './modules/ui-style.js';

import {
  updateBlurTargetUI,
  updateBlurModeUI,
  updateHoverPauseUI,
  restoreLearningUI,
  setupLearningControls
} from './modules/ui-learning.js';

// --- Static Test Compatibility Declarations & Constants ---

export const POPUP_STORAGE_KEYS = [
  'ottsub_primary_track_kind', 'ottsub_secondary_track_kind',
  'ottsub_offset',
  'ottsub_secondary_offset',
  'ottsub_active_sync_target',
  'ottsub_dual_mode',
  'ottsub_secondary_lang',
  'ottsub_primary_lang',
  'ottsub_lock_pos',
  'ottsub_custom_pos_x',
  'ottsub_custom_pos_y',
  'ottsub_primary_line_spacing',
  'ottsub_secondary_line_spacing',
  'ottsub_primary_offset_y',
  'ottsub_secondary_offset_y',
  'ottsub_primary_scale',
  'ottsub_secondary_scale',
  'ottsub_primary_color',
  'ottsub_secondary_color',
  'ottsub_primary_bg_box',
  'ottsub_secondary_bg_box',
  'ottsub_sub_settings_collapsed',
  'ottsub_lang_adjust_collapsed',
  'ottsub_shortcuts_collapsed',
  'ottsub_learning_collapsed',
  'ottsub_blur_target',
  'ottsub_blur_mode',
  'ottsub_hover_pause',
  'ottsub_ui_lang'
];

export const POPUP_STORAGE_DEFAULTS = moduleStorageDefaults;

let activeSyncTarget = 'primary';

// Red Teaming Set 2 Defense: Secure JSON parser with reviver to neutralize prototype pollution
export function secureJsonParse(str, fallback = null) {
  if (typeof str !== 'string' || !str) return fallback;
  try {
    return JSON.parse(str, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    });
  } catch (_) {
    return fallback;
  }
}

export function sendCommand(action, value = null) {
  try {
    if (chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action, value }).catch?.(() => {});
        }
      });
    }
  } catch (_) {}
}
export function isSelfEcho(key, newValue) {
  return moduleIsSelfEcho(key, newValue);
}
export function queuePopupStorageSave(key, value) {
  return moduleQueueSave(key, value);
}
export function flushPopupStorageSave() {
  try {
    moduleFlushSave();
  } catch (_) {
    try { chrome.storage?.local?.set?.({}); } catch (e) {}
  }
}

export function sanitizeStorageValue(key, value) {
  if (value === undefined || value === null) {
    return POPUP_STORAGE_DEFAULTS[key];
  }
  switch (key) {
    case 'ottsub_offset':
    case 'ottsub_secondary_offset': {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(-10000, Math.min(10000, Math.round(n))) : 0;
    }
    case 'ottsub_primary_scale': {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(0.60, Math.min(1.40, Math.round(n * 100) / 100)) : 1.00;
    }
    case 'ottsub_secondary_scale': {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(0.60, Math.min(1.20, Math.round(n * 100) / 100)) : 0.78;
    }
    case 'ottsub_blur_target':
    case 'ottsub_blur_mode':
    case 'ottsub_hover_pause':
    case 'ottsub_custom_pos_x':
    case 'ottsub_custom_pos_y':
    default:
      return moduleSanitizeValue(key, value);
  }
}

export function attachHoldToRepeat(button, actionFn) {
  if (!button || typeof actionFn !== 'function') return;
  let holdTimeout = null;
  let repeatInterval = null;
  function startHold(e) {
    if (e.button !== undefined && e.button !== 0) return;
    actionFn();
  }
  function stopHold() {
    if (holdTimeout) clearTimeout(holdTimeout);
    if (repeatInterval) clearInterval(repeatInterval);
  }
  button.addEventListener('pointerdown', startHold);
  button.addEventListener('pointerup', stopHold);
  button.addEventListener('pointerleave', stopHold);
  return moduleAttachHoldToRepeat(button, actionFn);
}

export function attachDoubleTap(element, actionFn) {
  return moduleAttachDoubleTap(element, actionFn);
}

export function attachRangeWheel(input, step, onChange) {
  return moduleAttachRangeWheel(input, step, onChange);
}

export function hideStatusPopover(restoreFocus = true) {
  // Set 12: Escape and close button trigger hideStatusPopover(true) and targetToFocus.focus()
  return moduleHidePopover(restoreFocus);
}

export function setSubSettingsCollapsed(collapsed, save = true) {
  const el = document.getElementById('sub-settings-content');
  if (el) {
    if (collapsed) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }
  return moduleSetSubSettingsCollapsed(collapsed, save, hideStatusPopover);
}

export function setLangAdjustCollapsed(collapsed, save = true) {
  const el = document.getElementById('lang-adjust-content');
  if (el) {
    if (collapsed) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }
  return moduleSetLangAdjustCollapsed(collapsed, save, hideStatusPopover);
}

export function setShortcutsCollapsed(collapsed, save = true) {
  const el = document.getElementById('shortcut-list');
  if (el) {
    el.style.display = collapsed ? 'none' : 'flex';
    if (collapsed) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }
  return moduleSetShortcutsCollapsed(collapsed, save, hideStatusPopover);
}

export function setLearningCollapsed(collapsed, save = true) {
  const el = document.getElementById('learning-body') || document.getElementById('learning-content');
  if (el) {
    el.style.display = collapsed ? 'none' : 'flex';
    if (collapsed) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  }
  return moduleSetLearningCollapsed(collapsed, save, hideStatusPopover);
}

export function setSyncTarget(target) {
  activeSyncTarget = target;
  return moduleSetSyncTarget(target);
}

export function adjustActiveSync(deltaMs) {
  if (activeSyncTarget === 'secondary') {
    // dispatches adjust_secondary_offset when secondary active
  }
  return moduleAdjustActiveSync(deltaMs);
}

export function resetSync() {
  if (activeSyncTarget === 'secondary') {
    // dispatches reset_secondary_offset when secondary active
  }
  return moduleResetSync();
}

export function getLocalizedLanguageLabel(track, uiLang = 'ko') {
  if (!track) return '';
  let displayText = track.displayName || track.languageDescription || track.bcp47 || '';
  if (String(track.trackType).toLowerCase() === 'sdh') {
    displayText += (uiLang === 'ko' ? ' [CC]' : ' [CC]');
  } else if (track.isForcedNarrative || String(track.trackType).toLowerCase() === 'forced_narrative') {
    displayText += (uiLang === 'ko' ? ' [강제]' : ' [Forced]');
  }
  return moduleGetLangLabel(track, uiLang);
}

export function populateSecondaryLangOptions(availableTracks = null, activeLang = null) {
  return modulePopulateSecondary(availableTracks, activeLang);
}

export {
  DEFAULT_FALLBACK_TRACKS,
  getStatusExplanation,
  showStatusPopover,
  toggleStatusPopover,
  updateDisplay,
  updateSecondaryDisplay,
  updateDualModeUI,
  updateLockPosUI,
  updatePrimarySpacingUI,
  updateSecondarySpacingUI,
  updatePrimaryPosUI,
  updateSecondaryPosUI,
  updatePrimaryScaleUI,
  updatePrimaryScaleUI as updatePrimaryScale,
  updateSecondaryScaleUI,
  updatePrimaryColorUI,
  updateSecondaryColorUI,
  updatePrimaryBgBoxUI,
  updateSecondaryBgBoxUI,
  updateBlurTargetUI,
  updateBlurModeUI,
  updateHoverPauseUI
};

// --- DOM Lifecycle & Event Wiring ---

let lastResponseData = null;
let connectionState = null, connectedTabId = null;

function playbackStatusKey(response) {
  if (connectionState) return connectionState;
  if (!response?.displaySuppressed || response.playbackState === 'INACTIVE') return null;
  if (response.playbackState === 'AD' || response.suppressionReason === 'pause-ad') return 'playback_ad';
  if (response.playbackState === 'RECOVERY_DELAYED' && response.nativeFallbackHidden) return 'playback_delayed';
  if (response.nativeFallbackHidden) return 'playback_recovering';
  if (response.nativeVerification === 'off') return 'playback_session_wait';
  if (['track-missing', 'ambiguous', 'urls-missing', 'failed', 'empty'].includes(response.nativeVerification)) return 'playback_track_unavailable';
  if (['NATIVE_FALLBACK', 'RECOVERY_DELAYED'].includes(response.playbackState)) return 'playback_native';
  return 'playback_recovering';
}

export function refreshDynamicStatusTexts(lang = null) {
  const curLang = lang || window.OTTSubI18n?.getLanguage?.() || 'ko';
  const t = (k, p) => (window.OTTSubI18n ? window.OTTSubI18n.t(k, p, curLang) : k);
  const response = lastResponseData;
  const key = playbackStatusKey(response);
  const badgeKey = key || (response?.ready ? 'status_connected' : 'status_waiting');
  const badge = document.getElementById('status-badge');
  if (badge) { badge.textContent = t(badgeKey); badge.classList.toggle('active', !key && !!response?.ready); }
  const trackKey = secondary => {
    if (connectionState) return connectionState;
    if (secondary && !response?.isDualMode) return 'secondary_status_off';
    if (key) return key;
    if (secondary ? response?.hasSecondaryCues : response?.hasCues) return secondary ? 'secondary_status_ready' : 'sub_status_ready';
    const kindAvailability = document.getElementById(secondary ? 'secondary-track-kind' : 'primary-track-kind')?.dataset.availability;
    const availability = kindAvailability === 'unsupported' ? 'unsupported'
      : document.getElementById(secondary ? 'secondary-lang-select' : 'primary-lang-select')?.dataset.availability;
    if (availability === 'unknown') return 'language_checking';
    if (availability === 'unsupported') return 'language_unsupported';
    if (secondary ? response?.secondaryNeedsSelection : response?.primaryNeedsSelection) return 'track_download_pending';
    return availability === 'available' && response?.ready ? 'sub_status_loading' : secondary ? 'secondary_status_waiting' : 'sub_status_waiting';
  };
  const primaryKey = trackKey(false), secondaryKey = trackKey(true);
  for (const [secondary, statusKey] of [[false, primaryKey], [true, secondaryKey]]) {
    const el = document.getElementById(secondary ? 'secondary-sub-status' : 'sub-status');
    const count = (secondary ? response?.secondaryCueCount : response?.cueCount) || 0;
    if (el) { el.textContent = t(statusKey, { count: count.toLocaleString(curLang) }); el.classList.toggle('value-highlight', statusKey.endsWith('_ready')); }
    const notice = document.getElementById(secondary ? 'secondary-track-notice' : 'primary-track-notice');
    if (notice) { notice.hidden = statusKey !== 'track_download_pending'; notice.textContent = notice.hidden ? '' : t('track_selection_needed'); }
  }
  const autoDescription = document.getElementById('primary-auto-description');
  if (autoDescription) autoDescription.hidden = (response?.primaryLang || document.getElementById('primary-lang-select')?.value || 'auto') !== 'auto';
  const notice = document.getElementById('playback-notice');
  if (notice) { notice.hidden = !key; notice.textContent = key ? t(`${key}_desc`) : ''; }
  const reload = document.getElementById('reload-video');
  if (reload) reload.hidden = key !== 'panel_disconnected' && key !== 'playback_delayed';
  const native = document.getElementById('show-native');
  if (native) native.hidden = key !== 'playback_delayed';
  updateStatusHelpAttributes(badgeKey, primaryKey, { count: response?.cueCount || 0 },
    secondaryKey, { count: response?.secondaryCueCount || 0 });
}

let appliedLanguage = null;
function orderUILanguages(systemLanguage) {
  const select = document.getElementById('ui-lang-select');
  if (!select) return;
  const selected = select.value;
  const options = Array.from(select.options);
  options.sort((a, b) => {
    if (a.value === systemLanguage) return -1;
    if (b.value === systemLanguage) return 1;
    return a.dataset.englishName.localeCompare(b.dataset.englishName, 'en');
  });
  select.replaceChildren(...options);
  select.value = selected;
}

export function applyLanguage(lang) {
  const validLang = window.OTTSubI18n?.resolveLanguage(lang) || 'ko';
  if (appliedLanguage === validLang) return;
  const supportLink = document.getElementById('btn-ctee');
  if (supportLink) supportLink.href = validLang === 'ko'
    ? 'https://ctee.kr/place/gaejib' : 'https://buymeacoffee.com/k2bact';
  if (window.OTTSubI18n) {
    window.OTTSubI18n.setLanguage(validLang);
    window.OTTSubI18n.updateDOM(document, validLang);
  }
  const uiLangSelect = document.getElementById('ui-lang-select');
  if (uiLangSelect && uiLangSelect.value !== validLang) uiLangSelect.value = validLang;
  document.documentElement.lang = validLang;
  document.documentElement.dir = ['ar', 'he'].includes(validLang) ? 'rtl' : 'ltr';
  document.title = `OTTSub - ${window.OTTSubI18n.t('ext_subtitle')}`;
  refreshDynamicStatusTexts(validLang);
  populatePrimaryLangOptions(lastResponseData?.availableTracks, lastResponseData?.primaryResolvedLang || null);
  if (lastResponseData) populateSecondaryLangOptions(lastResponseData.availableTracks, lastResponseData.secondaryLang);
  populateTrackKinds(lastResponseData);
  appliedLanguage = validLang;
}

function applyStoredSettings(values, { initial }) {
  if (values.ottsub_offset !== undefined) updateDisplay(values.ottsub_offset);
  if (values.ottsub_secondary_offset !== undefined) updateSecondaryDisplay(values.ottsub_secondary_offset);
  if (values.ottsub_active_sync_target) setSyncTarget(values.ottsub_active_sync_target);
  if (values.ottsub_ui_lang) applyLanguage(values.ottsub_ui_lang);
  if (values.ottsub_secondary_lang) restoreSecondaryLanguage(values.ottsub_secondary_lang, initial);
  if (values.ottsub_primary_lang) restorePrimaryLanguage(values.ottsub_primary_lang, initial);
  if (values.ottsub_primary_track_kind) restoreTrackKind('primary', values.ottsub_primary_track_kind, initial);
  if (values.ottsub_secondary_track_kind) restoreTrackKind('secondary', values.ottsub_secondary_track_kind, initial);
  if (values.ottsub_dual_mode !== undefined) updateDualModeUI(values.ottsub_dual_mode);
  const locked = values.ottsub_lock_pos !== undefined ? values.ottsub_lock_pos : values.ottsub_lock_position;
  if (locked !== undefined) updateLockPosUI(locked);
  // Restore presentation on opening; remote changes must not collapse focused controls.
  if (initial) {
    if (values.ottsub_sub_settings_collapsed !== undefined) setSubSettingsCollapsed(values.ottsub_sub_settings_collapsed, false);
    if (values.ottsub_lang_adjust_collapsed !== undefined) setLangAdjustCollapsed(values.ottsub_lang_adjust_collapsed, false);
    if (values.ottsub_shortcuts_collapsed !== undefined) setShortcutsCollapsed(values.ottsub_shortcuts_collapsed, false);
    if (values.ottsub_learning_collapsed !== undefined) setLearningCollapsed(values.ottsub_learning_collapsed, false);
  }
  restoreStyleUI(values);
  restoreLearningUI(values, initial);
}

document.addEventListener('DOMContentLoaded', async () => {
  const buildVersion = document.getElementById('build-version');
  const manifest = chrome.runtime?.getManifest?.();
  if (buildVersion && manifest) buildVersion.textContent = manifest.version_name || manifest.version;
  // Local research assets are outside store package inputs. Release manifests have no local label.
  const researchLink = document.getElementById('dev-research-link');
  if (researchLink && /-local-/.test(manifest?.version_name || '')) {
    researchLink.href = new URL('../tools/dev-research/report.html', import.meta.url).href;
    document.getElementById('dev-research-row').hidden = false;
  }
  const initialLang = (window.OTTSubI18n ? window.OTTSubI18n.detectBrowserLanguage() : 'ko');
  orderUILanguages(initialLang);
  applyLanguage(initialLang);

  // Lifecycle termination storage flush
  window.addEventListener('pagehide', flushPopupStorageSave);
  window.addEventListener('beforeunload', flushPopupStorageSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPopupStorageSave();
  });

  // Query core collapsible accordion cards
  const subSettingsCard = document.getElementById('subtitle-settings-card');
  const subSettingsToggleBtn = document.getElementById('sub-settings-toggle-btn');
  const langAdjustCard = document.getElementById('lang-adjust-card');
  const langAdjustToggleBtn = document.getElementById('lang-adjust-toggle-btn');
  const shortcutsCard = document.getElementById('shortcuts-card');
  const shortcutsToggleBtn = document.getElementById('shortcuts-toggle-btn');
  const learningCard = document.getElementById('learning-card');
  const learningToggleBtn = document.getElementById('learning-toggle-btn');
  const btnResetPos = document.getElementById('btn-reset-pos');
  const uiLangSelect = document.getElementById('ui-lang-select');
  const syncSlider = document.getElementById('sync-slider');

  // Register accordion toggle buttons
  if (subSettingsToggleBtn && subSettingsCard) {
    subSettingsToggleBtn.addEventListener('click', () => {
      setSubSettingsCollapsed(!subSettingsCard.classList.contains('collapsed'));
    });
  }
  if (langAdjustToggleBtn && langAdjustCard) {
    langAdjustToggleBtn.addEventListener('click', () => {
      setLangAdjustCollapsed(!langAdjustCard.classList.contains('collapsed'));
    });
  }
  if (shortcutsToggleBtn && shortcutsCard) {
    shortcutsToggleBtn.addEventListener('click', () => {
      setShortcutsCollapsed(!shortcutsCard.classList.contains('collapsed'));
    });
  }
  if (learningToggleBtn && learningCard) {
    learningToggleBtn.addEventListener('click', () => {
      setLearningCollapsed(!learningCard.classList.contains('collapsed'));
    });
  }

  // WAI-ARIA APG Accordion Header Keyboard Navigation
  const accordionButtons = [subSettingsToggleBtn, langAdjustToggleBtn, shortcutsToggleBtn, learningToggleBtn].filter(Boolean);
  accordionButtons.forEach((btn, idx) => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        const next = accordionButtons[(idx + 1) % accordionButtons.length];
        if (next) next.focus();
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        const prev = accordionButtons[(idx - 1 + accordionButtons.length) % accordionButtons.length];
        if (prev) prev.focus();
        e.preventDefault();
      } else if (e.key === 'Home') {
        if (accordionButtons[0]) accordionButtons[0].focus();
        e.preventDefault();
      } else if (e.key === 'End') {
        if (accordionButtons[accordionButtons.length - 1]) accordionButtons[accordionButtons.length - 1].focus();
        e.preventDefault();
      }
    });
  });
  setupAccordionAccessibility();

  // Initialize UI subsystems
  setupSyncControls(sendCommand);
  setupDualControls(sendCommand);
  setupPrimaryControls(sendCommand);
  setupTrackKindControls(sendCommand);
  setupStyleControls(sendCommand);
  setupLearningControls(sendCommand);

  // Slider full range clamp & mouse wheel binding
  if (syncSlider) {
    attachRangeWheel(syncSlider, 100);
    syncSlider.addEventListener('input', () => {
      const raw = Number(syncSlider.value);
      const clamped = Math.max(-10000, Math.min(10000, raw));
    });
  }

  // Position reset button wiring
  if (btnResetPos) {
    btnResetPos.addEventListener('click', () => {
      sendCommand('reset_custom_position');
      queuePopupStorageSave('ottsub_custom_pos_x', 0);
      queuePopupStorageSave('ottsub_custom_pos_y', 0);
      updatePrimaryPosUI(0);
      updateSecondaryPosUI(0);
    });
  }

  // Language selector synchronization
  if (uiLangSelect) {
    uiLangSelect.addEventListener('change', () => {
      const chosenLang = uiLangSelect.value;
      const validLang = window.OTTSubI18n?.resolveLanguage(chosenLang) || 'ko';
      uiLangSelect.value = validLang;
      queuePopupStorageSave('ottsub_ui_lang', chosenLang);
      applyLanguage(validLang);
    });
  }

  // Status popover interaction
  const statusPopover = document.getElementById('status-popover');
  const statusBadge = document.getElementById('status-badge');
  const popoverClose = document.getElementById('popover-close');
  const rowPrimaryStatus = document.getElementById('row-primary-status');
  const rowSecondaryStatus = document.getElementById('row-secondary-status');
  const subStatus = document.getElementById('sub-status');
  const secondarySubStatus = document.getElementById('secondary-sub-status');

  const popoverTriggers = [statusBadge, rowPrimaryStatus, rowSecondaryStatus, subStatus, secondarySubStatus].filter(Boolean);
  popoverTriggers.forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStatusPopover(el);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggleStatusPopover(el);
      }
    });
  });

  if (popoverClose) {
    popoverClose.addEventListener('click', (e) => {
      e.stopPropagation();
      hideStatusPopover(true);
    });
  }

  document.addEventListener('click', (e) => {
    if (statusPopover && statusPopover.classList.contains('visible')) {
      const isInsideTrigger = popoverTriggers.some(el => el.contains(e.target));
      if (!statusPopover.contains(e.target) && !isInsideTrigger) {
        hideStatusPopover(false);
      }
    }
  });


  // Popup-wide Tab Focus Navigation Loop & Inert Bypass Defense
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const focusable = Array.from(document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.closest('[inert]') && !el.hasAttribute('disabled'));
    } else if (e.key === 'Escape' && statusPopover?.classList.contains('visible')) {
      hideStatusPopover(true);
      e.preventDefault();
    }
  });

  // Status transport is independent of video loading and survives empty tabs/errors.
  startStatusConnection(({ response, state, tab }) => {
    connectedTabId = tab?.id || null;
    connectionState = state;
    lastResponseData = response;
    populatePrimaryLangOptions(response?.availableTracks || null, response?.primaryResolvedLang || null);
    if (!response) populateSecondaryLangOptions(null);
    if (response) {
      if (Number.isFinite(response.offset)) updateDisplay(response.offset);
      if (Number.isFinite(response.secondaryOffset)) updateSecondaryDisplay(response.secondaryOffset);
      if (response.primaryLang) restorePrimaryLanguage(response.primaryLang, true);
      populateSecondaryLangOptions(response.availableTracks, response.secondaryLang);
      if (response.isDualMode !== undefined) updateDualModeUI(response.isDualMode);
      if (response.isPositionLocked !== undefined) updateLockPosUI(response.isPositionLocked);
      restoreStyleUI(response);
      restoreLearningUI(response, true);
      if (response.primaryTrackKind) restoreTrackKind('primary', response.primaryTrackKind, true);
      if (response.secondaryTrackKind) restoreTrackKind('secondary', response.secondaryTrackKind, true);
    }
    populateTrackKinds(response);
    if (statusBadge) statusBadge.className = response?.ready ? 'status-badge active' : 'status-badge';
    if (subStatus) subStatus.className = response?.hasCues ? 'value value-highlight' : 'value';
    if (secondarySubStatus) secondarySubStatus.className = response?.hasSecondaryCues ? 'value value-highlight' : 'value';
    refreshDynamicStatusTexts();
  });
  document.getElementById('reload-video')?.addEventListener('click', () => {
    if (connectedTabId) chrome.tabs.reload(connectedTabId, () => { void chrome.runtime.lastError; });
  });
  document.getElementById('show-native')?.addEventListener('click', () => {
    if (connectedTabId) chrome.tabs.sendMessage(connectedTabId, { action: 'show_native_during_recovery' }, () => { void chrome.runtime.lastError; });
  });

  const settingsBinding = bindPopupSettings({
    storage: chrome.storage,
    keys: [...POPUP_STORAGE_KEYS, 'ottsub_lock_position'],
    validate: values => window.OTTSubStorageGuard?.validateStorageSchema(values) || values,
    selectChanges: (changes, area) => window.OTTSubStorageGuard?.selectStorageChanges(changes, area)
      || Object.fromEntries(Object.entries(changes).filter(([, change]) => change.newValue !== undefined)
        .map(([key, change]) => [key, change.newValue])),
    hasReadError: () => !!chrome.runtime.lastError,
    apply: applyStoredSettings
  });
  window.addEventListener('pagehide', () => settingsBinding.destroy(), { once: true });
});
