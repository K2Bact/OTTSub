/**
 * OTTSub - src/input/keyboard-router.js
 * Hardware keyboard shortcut router with active input detection,
 * Netflix diagnostic shortcut preservation, and OS auto-repeat storm defense.
 */
(() => {
  'use strict';

  let actionHandler = null;
  const resetCodes = new Set(['Backslash', 'IntlYen', 'IntlRo']);

  /**
   * Determine if target element is an active text input or editable node
   */
  function isInputNode(element) {
    if (!element) return false;
    const tagName = element.tagName ? element.tagName.toUpperCase() : '';
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
      return true;
    }
    if (element.isContentEditable) {
      return true;
    }
    return false;
  }

  /**
   * Traverse shadow roots to locate deep activeElement
   */
  function getDeepActiveElement() {
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) {
      active = active.shadowRoot.activeElement;
    }
    return active;
  }

  /**
   * Check if shortcut combination is reserved for Netflix diagnostic menu
   * Netflix diagnostics: Ctrl+Alt+Shift+D/S/P/Q/L
   */
  function isNetflixDiagnosticShortcut(event) {
    if (event.ctrlKey && event.altKey && event.shiftKey) {
      const code = event.code;
      if (code === 'KeyD' || code === 'KeyS' || code === 'KeyP' || code === 'KeyQ' || code === 'KeyL') {
        return true;
      }
    }
    return false;
  }

  /**
   * Determine if shortcut should be blocked due to OS key auto-repeat storms
   */
  function isGuardedAgainstRepeat(event) {
    if (!event.repeat) return false;
    const code = event.code;
    // Toggle shortcuts: Alt+D, Alt+L, Alt+R, Backslash, Alt+B
    if (code === 'KeyD' || code === 'KeyL' || code === 'KeyR' || resetCodes.has(code) || code === 'KeyB') {
      return true;
    }
    return false;
  }

  /**
   * Register action handler callback from orchestrator
   */
  function registerActionHandler(handler) {
    actionHandler = handler;
  }

  /**
   * Parse keyboard event and route to action handler
   */
  function handleKeyDown(event) {
    // Preserve browser/OS shortcuts, AltGr text entry and IME composition.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.isComposing
      || event.keyCode === 229 || event.getModifierState?.('AltGraph')) return;
    if (isNetflixDiagnosticShortcut(event)) return;
    if (isInputNode(getDeepActiveElement())) return;
    if (isGuardedAgainstRepeat(event)) return;

    const code = event.code;
    const isAlt = event.altKey;

    let action = null;
    let delta = 0;

    if (code === 'BracketLeft') {
      action = isAlt ? 'adjust_secondary_sync' : 'adjust_primary_sync';
      delta = -100;
    } else if (code === 'BracketRight') {
      action = isAlt ? 'adjust_secondary_sync' : 'adjust_primary_sync';
      delta = 100;
    } else if (resetCodes.has(code)) {
      action = isAlt ? 'reset_secondary_sync' : 'reset_primary_sync';
    } else if (isAlt && code === 'KeyD') {
      action = 'toggle_dual';
    } else if (isAlt && code === 'KeyB') {
      action = 'toggle_blur';
    } else if (isAlt && code === 'KeyL') {
      action = 'toggle_lock_pos';
    } else if (isAlt && code === 'KeyR') {
      action = 'reset_pos';
    }

    if (action && typeof actionHandler === 'function') {
      event.preventDefault();
      event.stopImmediatePropagation();
      actionHandler(action, delta, event);
    }
  }

  window.OTTSubKeyboardRouter = {
    isInputNode,
    getDeepActiveElement,
    isNetflixDiagnosticShortcut,
    isGuardedAgainstRepeat,
    registerActionHandler,
    handleKeyDown
  };
})();
