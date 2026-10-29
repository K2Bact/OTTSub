/** Shared placement of both languages. Timing and DOM rendering stay with their owners. */
(() => {
  'use strict';
  class DualPlacement {
    constructor() { this.reset(); }
    reset() { this.lastTopTime = null; this.lastTime = null; this.offsetKey = null; }
    resolve(primary, secondary, { mediaTime, isDualMode, primaryOffset = 0, secondaryOffset = 0 }) {
      const empty = () => ({ top: [], bottom: [] });
      if (!Number.isFinite(mediaTime)) { this.reset(); return { primary: empty(), secondary: empty() }; }
      if (!isDualMode) {
        this.reset();
        return { primary: { top: [...primary.top], bottom: [...primary.bottom] }, secondary: empty() };
      }
      const offsetKey = `${primaryOffset}:${secondaryOffset}`;
      if (offsetKey !== this.offsetKey || (this.lastTime !== null && (mediaTime < this.lastTime || mediaTime - this.lastTime > 2))) {
        this.lastTopTime = null;
      }
      this.offsetKey = offsetKey;
      this.lastTime = mediaTime;
      if (primary.top.length || secondary.top.length) this.lastTopTime = mediaTime;
      const lift = this.lastTopTime !== null && mediaTime - this.lastTopTime <= 6;
      const place = cues => lift
        ? { top: [...cues.top, ...cues.bottom].sort((a, b) => a.begin - b.begin), bottom: [] }
        : { top: [...cues.top], bottom: [...cues.bottom] };
      return { primary: place(primary), secondary: place(secondary) };
    }
  }
  window.OTTSubDualPlacement = DualPlacement;
})();
