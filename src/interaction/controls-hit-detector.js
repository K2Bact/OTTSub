// Real pointer routing only; never synthesize/replay Netflix clicks.
(() => {
  'use strict';
  const selector = '[data-uia="timeline"], [data-uia="timeline-bar"], .watch-video--bottom-controls-container, .watch-video--top-controls-container';
  class ControlsHitDetector {
    constructor(renderer) {
      this.renderer = renderer; this.point = null; this.frame = null;
      this.onMove = e => {
        this.point = { x: e.clientX, y: e.clientY };
        if (this.frame !== null) return;
        // First event stays synchronous so the next real click can pass through.
        // Further events coalesce until the trailing frame sees revealed controls.
        this.refresh();
        this.frame = requestAnimationFrame(() => { this.frame = null; this.refresh(); });
      };
      document.addEventListener('pointermove', this.onMove, true);
    }
    visible(control) {
      try {
        if (typeof control.checkVisibility === 'function') return control.checkVisibility({ opacityProperty: true, visibilityProperty: true });
      } catch (_) { /* Use computed ancestor visibility when the API fails. */ }
      for (let node = control; node?.nodeType === 1; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
      }
      return true;
    }
    refresh() {
      const r = this.renderer, point = this.point;
      if (!r?.container || r.isDragging || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
      let hit = false;
      try {
        hit = (document.elementsFromPoint?.(point.x, point.y) || []).some(el => {
          const control = el.closest?.(selector);
          return control && r.container.parentElement?.contains(control) && this.visible(control);
        });
      } catch (_) { return; }
      if (hit === r.container.classList.contains('native-controls-hit')) return;
      r.container.classList.toggle('native-controls-hit', hit);
      if (hit) r.onSubtitleHoverChange?.(false, 'native_controls');
    }
    destroy() {
      document.removeEventListener('pointermove', this.onMove, true);
      if (this.frame !== null) cancelAnimationFrame(this.frame);
      this.renderer?.container?.classList.remove('native-controls-hit');
      this.renderer = this.point = null; this.frame = null;
    }
  }
  window.OTTSubControlsHitDetector = ControlsHitDetector;
})();
