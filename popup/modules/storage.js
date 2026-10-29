/**
 * OTTSub - popup/modules/storage.js
 * Storage synchronization, debounce queues, quota defense, and defensive schema validation.
 */

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

// Unified debounced storage persistence to prevent MAX_WRITE_OPERATIONS_PER_MINUTE quota errors
let popupStorageTimer = null;
const pendingPopupStorage = {};
const recentLocalWrites = new Map();

export function isSelfEcho(key, newValue) {
  const record = recentLocalWrites.get(key);
  if (record && record.value === newValue && (Date.now() - record.timestamp < 1500)) {
    return true;
  }
  return false;
}

export function queuePopupStorageSave(key, value) {
  if (window.OTTSubStorageGuard) {
    recentLocalWrites.set(key, { value, timestamp: Date.now() });
    window.OTTSubStorageGuard.queueStorageSave(key, value);
    return;
  }
  pendingPopupStorage[key] = value;
  recentLocalWrites.set(key, { value, timestamp: Date.now() });

  // 1. Immediate write to chrome.storage.local (1차 보관소, 쿼터 제한 없음)
  try {
    if (chrome.runtime?.id && chrome.storage?.local) {
      const p = chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime?.lastError) {}
      });
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    }
  } catch (_) {}

  // 2. Debounced write to chrome.storage.sync (분당 120회 제한 준수)
  if (popupStorageTimer) clearTimeout(popupStorageTimer);
  popupStorageTimer = setTimeout(() => {
    flushPopupStorageSave();
  }, 350);
}

export function flushPopupStorageSave() {
  if (window.OTTSubStorageGuard) { window.OTTSubStorageGuard.flushStorageSave(); return; }
  if (popupStorageTimer) {
    clearTimeout(popupStorageTimer);
    popupStorageTimer = null;
  }
  const pendingKeys = Object.keys(pendingPopupStorage);
  if (pendingKeys.length === 0) return;

  const payload = { ...pendingPopupStorage };
  for (const k of pendingKeys) {
    delete pendingPopupStorage[k];
  }

  // Red Teaming Set 10 Defense: Storage Sync Quota Exhaustion & Token Bucket Fallback
  try {
    if (chrome.runtime?.id && chrome.storage?.sync) {
      const p = chrome.storage.sync.set(payload, () => {
        const err = chrome.runtime?.lastError;
        if (err) {
          try {
            if (chrome.runtime?.id && chrome.storage?.local) {
              chrome.storage.local.set(payload, () => {
                if (chrome.runtime?.lastError) {}
              });
            }
          } catch (_) {}
        }
      });
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          try {
            if (chrome.runtime?.id && chrome.storage?.local) {
              chrome.storage.local.set(payload);
            }
          } catch (_) {}
        });
      }
    } else if (chrome.runtime?.id && chrome.storage?.local) {
      chrome.storage.local.set(payload);
    }
  } catch (_) {
    try {
      if (chrome.runtime?.id && chrome.storage?.local) {
        chrome.storage.local.set(payload);
      }
    } catch (_) {}
  }
}

// Lifecycle listeners to flush pending debounced settings upon popup closure
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPopupStorageSave);
  window.addEventListener('beforeunload', flushPopupStorageSave);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushPopupStorageSave();
      }
    });
  }
}

export const POPUP_STORAGE_DEFAULTS = {
  ottsub_offset: 0,
  ottsub_secondary_offset: 0,
  ottsub_dual_mode: true,
  ottsub_secondary_lang: 'ko',
  ottsub_primary_lang: 'auto',
  ottsub_primary_track_kind: 'auto',
  ottsub_secondary_track_kind: 'auto',
  ottsub_ui_lang: 'en',
  ottsub_lock_pos: false,
  ottsub_lock_position: false,
  ottsub_line_spacing: 4,
  ottsub_line_height: 1.20,
  ottsub_primary_line_spacing: 4,
  ottsub_secondary_line_spacing: 4,
  ottsub_primary_offset_y: 0,
  ottsub_secondary_offset_y: 0,
  ottsub_primary_scale: 1.00,
  ottsub_primary_color: '#ffffff',
  ottsub_secondary_scale: 0.78,
  ottsub_secondary_color: '#ffe082',
  ottsub_primary_bg_box: false,
  ottsub_secondary_bg_box: false,
  ottsub_bg_box_enabled: false,
  ottsub_custom_pos_x: 0,
  ottsub_custom_pos_y: 0,
  ottsub_sub_settings_collapsed: false,
  ottsub_lang_adjust_collapsed: true,
  ottsub_shortcuts_collapsed: true,
  ottsub_blur_target: 'none',
  ottsub_blur_mode: 'blur_8',
  ottsub_hover_pause: true,
  ottsub_learning_collapsed: true
};

export const POPUP_STORAGE_KEYS = [
  'ottsub_primary_track_kind', 'ottsub_secondary_track_kind',
  'ottsub_primary_lang',
  'ottsub_offset', 'ottsub_secondary_offset', 'ottsub_dual_mode', 'ottsub_secondary_lang', 'ottsub_ui_lang',
  'ottsub_sub_settings_collapsed', 'ottsub_lang_adjust_collapsed', 'ottsub_shortcuts_collapsed',
  'ottsub_learning_collapsed', 'ottsub_blur_target', 'ottsub_blur_mode', 'ottsub_hover_pause',
  'ottsub_lock_pos', 'ottsub_lock_position', 'ottsub_line_spacing',
  'ottsub_line_height', 'ottsub_primary_line_spacing', 'ottsub_secondary_line_spacing',
  'ottsub_primary_offset_y', 'ottsub_secondary_offset_y', 'ottsub_primary_scale',
  'ottsub_primary_color', 'ottsub_secondary_scale', 'ottsub_secondary_color',
  'ottsub_primary_bg_box', 'ottsub_secondary_bg_box', 'ottsub_bg_box_enabled',
  'ottsub_custom_pos_x', 'ottsub_custom_pos_y'
];

export function sanitizeStorageValue(key, value) {
  if (value === undefined || value === null) {
    return POPUP_STORAGE_DEFAULTS[key];
  }
  switch (key) {
    case 'ottsub_primary_track_kind':
    case 'ottsub_secondary_track_kind':
      return ['auto', 'normal', 'cc'].includes(value) ? value : 'auto';
    case 'ottsub_offset':
    case 'ottsub_secondary_offset': {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(-10000, Math.min(10000, Math.round(n))) : 0;
    }
    case 'ottsub_custom_pos_x':
    case 'ottsub_custom_pos_y': {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(-45, Math.min(45, Math.round(n * 10) / 10)) : 0;
    }
    case 'ottsub_primary_line_spacing':
    case 'ottsub_secondary_line_spacing':
    case 'ottsub_line_spacing': {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(0, Math.min(6, Math.round(n))) : 4;
    }
    case 'ottsub_primary_offset_y':
    case 'ottsub_secondary_offset_y': {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(-50, Math.min(50, Math.round(n))) : 0;
    }
    case 'ottsub_primary_scale': {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(0.60, Math.min(1.40, Math.round(n * 100) / 100)) : 1.00;
    }
    case 'ottsub_secondary_scale': {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(0.60, Math.min(1.20, Math.round(n * 100) / 100)) : 0.78;
    }
    case 'ottsub_primary_color': {
      const validColors = ['#ffffff', '#ffe082', '#93c5fd', '#bbf7d0', '#fbcfe8', '#fed7aa'];
      const s = String(value).toLowerCase();
      return validColors.includes(s) ? s : '#ffffff';
    }
    case 'ottsub_secondary_color': {
      const validColors = ['#ffffff', '#ffe082', '#93c5fd', '#bbf7d0', '#fbcfe8', '#fed7aa'];
      const s = String(value).toLowerCase();
      return validColors.includes(s) ? s : '#ffe082';
    }
    case 'ottsub_blur_target': {
      const valid = ['none', 'secondary', 'primary', 'both'];
      return valid.includes(value) ? value : 'none';
    }
    case 'ottsub_blur_mode': {
      const valid = ['blur_4', 'blur_8', 'blur_14'];
      return valid.includes(value) ? value : 'blur_8';
    }
    case 'ottsub_hover_pause':
    case 'ottsub_learning_collapsed':
    case 'ottsub_dual_mode':
    case 'ottsub_lock_pos':
    case 'ottsub_lock_position':
    case 'ottsub_primary_bg_box':
    case 'ottsub_secondary_bg_box':
    case 'ottsub_sub_settings_collapsed':
    case 'ottsub_lang_adjust_collapsed':
    case 'ottsub_shortcuts_collapsed':
      return typeof value === 'boolean' ? value : Boolean(POPUP_STORAGE_DEFAULTS[key]);
    default:
      return value;
  }
}
