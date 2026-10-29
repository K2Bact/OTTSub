/**
 * OTTSub - src/core/storage-guard.js
 * Storage synchronization guard, debounce queues, quota defense, and defensive schema parsing.
 */
(() => {
  'use strict';

  // Red Teaming Set 2 Defense: Secure JSON parser with reviver to strip __proto__, constructor, and prototype
  function secureJsonParse(str, fallback = null) {
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

  /**
   * Lightweight Bounded LRU (Least Recently Used) Cache for SPA episode manifests.
   * Prevents long-running Netflix binge-watching sessions from accumulating unbounded heap objects.
   */
  class LRUCache {
    constructor(capacity = 5) {
      this.capacity = Math.max(1, capacity);
      this.cache = new Map();
    }

    get(key) {
      if (!this.cache.has(key)) return undefined;
      const val = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, val);
      return val;
    }

    set(key, value) {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      } else if (this.cache.size >= this.capacity) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
      this.cache.set(key, value);
      return this;
    }

    has(key) {
      return this.cache.has(key);
    }

    delete(key) {
      return this.cache.delete(key);
    }

    clear() {
      this.cache.clear();
    }

    get size() {
      return this.cache.size;
    }
  }

  // Validate partial settings without filling defaults over a newer value.
  function validateStorageSchema(data) {
    const clean = {};
    if (!data || typeof data !== 'object' || Array.isArray(data)) return clean;
    const ranges = {
      ottsub_offset: [-60000, 60000], ottsub_secondary_offset: [-60000, 60000],
      ottsub_primary_line_spacing: [0, 6], ottsub_secondary_line_spacing: [0, 6],
      ottsub_primary_offset_y: [-100, 100], ottsub_secondary_offset_y: [-100, 100],
      ottsub_primary_scale: [0.5, 1.5], ottsub_secondary_scale: [0.5, 1.5],
      ottsub_custom_pos_x: [-45, 45], ottsub_custom_pos_y: [-45, 45]
    };
    const booleans = new Set(['ottsub_sub_settings_collapsed', 'ottsub_lang_adjust_collapsed',
      'ottsub_shortcuts_collapsed', 'ottsub_learning_collapsed', 'ottsub_dual_mode', 'ottsub_hover_pause', 'ottsub_lock_pos',
      'ottsub_lock_position', 'ottsub_primary_bg_box', 'ottsub_secondary_bg_box', 'ottsub_bg_box_enabled']);
    for (const [key, value] of Object.entries(data)) {
      if (Object.hasOwn(ranges, key)) {
        if ((typeof value !== 'number' && typeof value !== 'string') || value === '') continue;
        const n = Number(value);
        if (Number.isFinite(n)) clean[key] = Math.max(ranges[key][0], Math.min(ranges[key][1], n));
      } else if (booleans.has(key)) {
        if (typeof value === 'boolean') clean[key] = value;
      } else if (key === 'ottsub_primary_color' || key === 'ottsub_secondary_color') {
        if (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) clean[key] = value.toLowerCase();
      } else if (key === 'ottsub_primary_track_kind' || key === 'ottsub_secondary_track_kind') {
        if (['auto', 'normal', 'cc'].includes(value)) clean[key] = value;
      } else if (key === 'ottsub_active_sync_target') {
        if (['primary', 'secondary'].includes(value)) clean[key] = value;
      } else if (key === 'ottsub_primary_lang' && value === 'auto') {
        clean[key] = value;
      } else if (key === 'ottsub_primary_lang' || key === 'ottsub_secondary_lang' || key === 'ottsub_ui_lang') {
        if (typeof value === 'string' && /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(value)) clean[key] = value.toLowerCase();
      } else if (key === 'ottsub_blur_target' && ['none', 'primary', 'secondary', 'both'].includes(value)) {
        clean[key] = value;
      } else if (key === 'ottsub_blur_mode' && ['blur_4', 'blur_8', 'blur_14'].includes(value)) {
        clean[key] = value;
      }
    }
    return clean;
  }

  const localSettingKeys = new Set();
  const revisions = window.OTTSubSettingsRevisions?.(validateStorageSchema);

  function selectStorageChanges(changes, area) {
    const clean = validateStorageSchema(Object.fromEntries(Object.entries(changes).map(([key, change]) => [key, change.newValue])));
    if (area === 'local') {
      // Another context can deliver an older local write after reconciliation.
      for (const key of Object.keys(clean)) {
        const record = revisions?.current(key);
        if (record && record.value !== clean[key]) delete clean[key];
      }
      for (const [key, change] of Object.entries(changes)) {
        if (change.newValue === undefined) localSettingKeys.delete(key);
        else if (Object.hasOwn(clean, key)) localSettingKeys.add(key);
      }
    } else if (area === 'sync') {
      // A delayed sync echo must never roll back a newer local setting.
      for (const key of localSettingKeys) delete clean[key];
    }
    return clean;
  }

  // Store builds used sync; local settings now take precedence. Changes that
  // arrive during the asynchronous reads must win over the initial snapshots.
  function readSettings(keys, callback) {
    const changesDuringRead = { local: {}, sync: {} };
    const listener = (changes, area) => {
      if (!changesDuringRead[area]) return;
      for (const [key, change] of Object.entries(changes)) {
        if (keys.includes(key)) changesDuringRead[area][key] = change.newValue;
      }
    };
    chrome.storage.onChanged.addListener(listener);
    const read = area => new Promise(resolve => {
      try {
        if (!chrome.storage[area]) return resolve({});
        chrome.storage[area].get(keys, data => resolve(chrome.runtime.lastError ? {} : (data || {})));
      } catch (_) { resolve({}); }
    });
    Promise.all([read('sync'), read('local')]).then(([sync, local]) => {
      chrome.storage.onChanged.removeListener(listener);
      const localValues = validateStorageSchema({ ...local, ...changesDuringRead.local });
      for (const key of Object.keys(localValues)) localSettingKeys.add(key);
      const saved = {
        ...validateStorageSchema({ ...sync, ...changesDuringRead.sync }),
        ...localValues
      };
      // A removed key must not be resurrected from an older snapshot.
      for (const [key, value] of Object.entries(changesDuringRead.local)) {
        if (value === undefined) delete saved[key];
      }
      callback(saved);
    });
  }

  // Unified debounced storage persistence to prevent exceeding quota and race conditions
  let saveStorageTimer = null;
  const pendingStorageChanges = {};

  function queueStorageSave(key, value) {
    if (revisions) { revisions.save(key, value); return; }
    localSettingKeys.add(key);
    pendingStorageChanges[key] = value;

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
    if (saveStorageTimer) clearTimeout(saveStorageTimer);
    saveStorageTimer = setTimeout(() => {
      flushStorageSave();
    }, 300);
  }

  /**
   * Submit pending sync writes before tab unload/hidden. Storage remains asynchronous.
   */
  function flushStorageSave() {
    if (revisions) { revisions.flush(); return; }
    if (saveStorageTimer) {
      clearTimeout(saveStorageTimer);
      saveStorageTimer = null;
    }
    const pendingKeys = Object.keys(pendingStorageChanges);
    if (pendingKeys.length === 0) return;

    const payload = { ...pendingStorageChanges };
    for (const k of pendingKeys) {
      delete pendingStorageChanges[k];
    }

    // local was already written by queueStorageSave. Never replay an old payload
    // into local after a delayed sync failure: a newer edit may already be there.
    try {
      if (chrome.runtime?.id && chrome.storage?.sync) {
        const p = chrome.storage.sync.set(payload, () => {
          if (chrome.runtime?.lastError) {}
        });
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    } catch (_) {}
  }

  // Lifecycle listeners for clean termination
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flushStorageSave);
    window.addEventListener('beforeunload', flushStorageSave);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushStorageSave();
      }
    });
  }

  window.OTTSubStorageGuard = {
    secureJsonParse,
    LRUCache,
    validateStorageSchema,
    selectStorageChanges,
    readSettings,
    queueStorageSave,
    flushStorageSave
  };
})();
