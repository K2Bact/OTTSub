/**
 * OTTSub - popup/modules/ui-helpers.js
 * Pointer-event hold-to-repeat, touch double-tap, and range wheel helpers.
 */

// Pointer-event-driven Hold-to-Repeat helper for stepper increment/decrement buttons
export function attachHoldToRepeat(button, actionFn) {
  if (!button || typeof actionFn !== 'function') return;
  let holdTimeout = null;
  let repeatInterval = null;
  let hasRepeated = false;

  function startHold(e) {
    if (e.button !== undefined && e.button !== 0) return;
    stopHold();
    try {
      if (button.setPointerCapture && e.pointerId) {
        button.setPointerCapture(e.pointerId);
      }
    } catch (_) {}

    actionFn();
    hasRepeated = false;

    holdTimeout = setTimeout(() => {
      hasRepeated = true;
      repeatInterval = setInterval(() => {
        actionFn();
      }, 110);
    }, 380);
  }

  function stopHold(e) {
    if (holdTimeout) {
      clearTimeout(holdTimeout);
      holdTimeout = null;
    }
    if (repeatInterval) {
      clearInterval(repeatInterval);
      repeatInterval = null;
    }
    if (e && e.pointerId && button.releasePointerCapture) {
      try {
        button.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  }

  button.addEventListener('pointerdown', startHold);
  button.addEventListener('pointerup', stopHold);
  button.addEventListener('pointercancel', stopHold);
  button.addEventListener('pointerleave', stopHold);
  button.addEventListener('blur', stopHold);

  button.addEventListener('click', e => {
    if (hasRepeated) {
      e.preventDefault();
      e.stopPropagation();
      hasRepeated = false;
    }
  });
}

// Touchscreen double-tap helper for Windows 2-in-1 / touchscreen devices
export function attachDoubleTap(element, callback) {
  if (!element) return;
  let lastTap = 0;
  element.addEventListener('touchend', e => {
    const currentTime = Date.now();
    const tapLength = currentTime - lastTap;
    if (tapLength > 0 && tapLength < 350) {
      e.preventDefault();
      callback(e);
      lastTap = 0;
    } else {
      lastTap = currentTime;
    }
  }, { passive: false });
}

// Range slider wheel adjustment helper with synchronous live aria-valuetext announcement
export function attachRangeWheel(slider, step = 1) {
  if (!slider) return;
  slider.addEventListener('wheel', e => {
    e.preventDefault();
    const current = parseFloat(slider.value) || 0;
    const delta = e.deltaY < 0 ? step : -step;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const next = Math.max(min, Math.min(max, Math.round((current + delta) * 100) / 100));
    slider.value = String(next);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }, { passive: false });
}
