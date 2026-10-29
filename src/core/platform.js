/** Local OS identification and keyboard labels; no storage or network access. */
(() => {
  'use strict';
  function normalizeOS(value) {
    const name = String(value || '').toLowerCase();
    if (/^(mac|macos|macintel|macppc|mac68k)$/.test(name)) return 'mac';
    if (/^(win|windows|win32|win64)$/.test(name)) return 'win';
    if (/^(linux.*|cros|chrome os|chromium os|openbsd|fuchsia)$/.test(name)) return 'other';
    return 'unknown';
  }
  const nav = globalThis.navigator || {};
  let os = normalizeOS(nav.userAgentData?.platform);
  if (os === 'unknown') os = normalizeOS(nav.platform);
  function updateLabels() {
    if (!globalThis.document) return;
    document.querySelectorAll('[data-shortcut-modifier]').forEach(element => {
      element.textContent = os === 'mac' ? 'Option' : 'Alt';
    });
    document.querySelectorAll('.shortcut-desc[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key && window.OTTSubI18n) element.textContent = window.OTTSubI18n.t(key);
    });
  }
  window.OTTSubPlatform = {
    getOS: () => os,
    modifierLabel: () => os === 'mac' ? 'Option' : 'Alt',
    updateLabels
  };
  updateLabels();
  if (globalThis.document?.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateLabels, { once: true });
  }
  // Available in the extension panel; content scripts use the navigator fallback.
  const runtime = globalThis.chrome?.runtime;
  if (typeof runtime?.getPlatformInfo === 'function') {
    try {
      runtime.getPlatformInfo(info => {
        if (runtime.lastError) return;
        const detected = normalizeOS(info?.os);
        if (detected !== 'unknown') os = detected;
        updateLabels();
      });
    } catch { /* Keep the fallback if the extension context was invalidated. */ }
  }
})();
