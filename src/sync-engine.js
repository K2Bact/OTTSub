/**
 * OTTSub - sync-engine.js
 * High-performance sliding pointer synchronization engine with binary search fallback.
 * Uses integer milliseconds for precision math and handles overlapping cues.
 */
(() => {
  'use strict';

  const MAX_OFFSET_MS = 60000;  // Clamped between -60.0s and +60.0s
  const JUMP_THRESHOLD_SEC = 2.0; // Seek jump threshold for binary search fallback
  const MAX_CUES_CAP = 10000;     // Red Teaming Set 4: Hard limit to prevent memory exhaustion DoS
  const MAX_TEXT_LEN = 1000;      // Red Teaming Set 4: Hard limit to prevent DOM layout freeze

  class SyncEngine {
    constructor() {
      this.movieId = null;
      this.cues = [];
      this.pointer = 0;
      this.lastTime = 0;
      this.offsetMs = 0;
      this.lastOffsetMs = 0;
      this.maxCueDuration = 10.0;
    }

    /**
     * Load new subtitle cues for a movie/episode
     */
    setCues(movieId, cues) {
      this.movieId = movieId;
      let rawList = Array.isArray(cues) ? cues : [];
      if (rawList.length > MAX_CUES_CAP) {
        rawList = rawList.slice(0, MAX_CUES_CAP);
      }
      const validCues = rawList
        .filter(c => c && Number.isFinite(c.begin) && Number.isFinite(c.end) && (c.end > c.begin) && (c.end - c.begin <= 3600) && (typeof c.text === 'string' && c.text.trim().length > 0))
        .map(c => ({
          ...c,
          begin: Math.max(0, c.begin),
          // A length cap must not leave the first half of an astral character.
          text: c.text.length > MAX_TEXT_LEN ? c.text.slice(0, MAX_TEXT_LEN).replace(/[\uD800-\uDBFF]$/, '') : c.text
        }))
        .filter(c => c.end > c.begin)
        .sort((a, b) => a.begin - b.begin || a.end - b.end);
      this.cues = validCues;
      this.pointer = 0;
      this.lastTime = 0;
      this.lastOffsetMs = this.offsetMs;
      let maxDur = 10.0;
      for (let i = 0; i < this.cues.length; i++) {
        const dur = (this.cues[i].end || 0) - (this.cues[i].begin || 0);
        if (dur > maxDur) {
          maxDur = dur;
        }
      }
      this.maxCueDuration = maxDur;
    }

    /**
     * Clear loaded subtitle state
     */
    clear() {
      this.movieId = null;
      if (Array.isArray(this.cues)) {
        this.cues.length = 0;
      }
      this.cues = [];
      this.pointer = 0;
      this.lastTime = 0;
      this.lastOffsetMs = 0;
      this.maxCueDuration = 10.0;
    }

    resetCursor() {
      this.pointer = 0;
      this.lastTime = -Infinity; // Next finite lookup takes the binary-search path.
      this.lastOffsetMs = this.offsetMs;
    }

    /**
     * Adjust sync offset by delta in integer milliseconds
     */
    adjustOffset(deltaMs) {
      let delta = 0;
      try { const n = Number(deltaMs); if (Number.isFinite(n)) delta = Math.round(n); }
      catch (_) { /* Invalid serialized values leave the existing adjustment unchanged. */ }
      const current = Number.isFinite(this.offsetMs) ? this.offsetMs : 0;
      this.offsetMs = Math.max(-MAX_OFFSET_MS, Math.min(MAX_OFFSET_MS, current + delta));
      return this.offsetMs;
    }

    /**
     * Reset offset back to 0.0s (restore Netflix native subtitles)
     */
    resetOffset() {
      this.offsetMs = 0;
      return this.offsetMs;
    }

    /**
     * Set explicit offset in milliseconds (from storage or UI)
     */
    setOffset(offsetMs) {
      let val = 0;
      try { const n = Number(offsetMs); if (Number.isFinite(n)) val = Math.round(n); }
      catch (_) { /* Use the same zero fallback as other invalid numeric input. */ }
      this.offsetMs = Math.max(-MAX_OFFSET_MS, Math.min(MAX_OFFSET_MS, val));
      return this.offsetMs;
    }

    getOffsetMs() {
      return this.offsetMs;
    }

    getOffsetSeconds() {
      return (this.offsetMs / 1000).toFixed(1);
    }

    getMovieId() {
      return this.movieId;
    }

    hasCues() {
      return this.cues.length > 0;
    }

    getCueCount() {
      return this.cues.length;
    }

    /**
     * Binary search to find the closest cue starting at or near target time
     */
    _binarySearch(targetTime) {
      let low = 0;
      let high = this.cues.length - 1;

      while (low <= high) {
        const mid = (low + high) >> 1;
        if (this.cues[mid].begin <= targetTime) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      // Step back generously using maxCueDuration to guarantee long cues (e.g. 30s-60s)
      // are never missed upon seek, rewind, or jump
      const minPossibleBegin = targetTime - (this.maxCueDuration || 10.0);
      let ptr = Math.max(0, high);
      while (ptr > 0 && this.cues[ptr].begin > minPossibleBegin) {
        ptr--;
      }
      return ptr;
    }

    /**
     * Retrieve all active cues for the current video playback time
     * Returns: { top: [], bottom: [], totalActive: number }
     */
    getActiveCues(currentTime) {
      if (this.cues.length === 0) {
        return { top: [], bottom: [], totalActive: 0 };
      }
      if (typeof currentTime !== 'number' || isNaN(currentTime) || !isFinite(currentTime)) {
        return { top: [], bottom: [], totalActive: 0 };
      }

      const safeCurrentTime = Math.max(0, currentTime);
      const effectiveTime = safeCurrentTime + (this.offsetMs / 1000);

      // Boundary Protection: If shifted timeline falls before video start (< 0s), no cues can be active
      if (effectiveTime < 0) {
        this.pointer = 0;
        this.lastTime = safeCurrentTime;
        this.lastOffsetMs = this.offsetMs;
        return { top: [], bottom: [], totalActive: 0 };
      }

      const prevEffectiveTime = this.lastTime + (this.lastOffsetMs / 1000);

      // Red Team Fix: Detect ANY reverse playback (micro-rewind < 2s), forward seek jump, or offset change
      const isRewind = effectiveTime < prevEffectiveTime;
      const isForwardJump = (effectiveTime - prevEffectiveTime) > JUMP_THRESHOLD_SEC;
      const offsetJump = this.offsetMs !== this.lastOffsetMs;

      if (isRewind || isForwardJump || offsetJump) {
        this.pointer = this._binarySearch(effectiveTime);
      }
      this.lastTime = safeCurrentTime;
      this.lastOffsetMs = this.offsetMs;

      // Adjust sliding pointer forward if current cue has already ended
      while (
        this.pointer < this.cues.length &&
        this.cues[this.pointer].end <= effectiveTime
      ) {
        this.pointer++;
      }

      // Collect all cues active at this exact moment
      let topCues = [];
      let bottomCues = [];

      for (let i = this.pointer; i < this.cues.length; i++) {
        const cue = this.cues[i];
        if (cue.begin > effectiveTime) {
          break; // Since cues are sorted by begin time, subsequent cues haven't started yet
        }

        // Half-open intervals: never show tomorrow's cue early or extend an expired cue.
        if (effectiveTime >= cue.begin && effectiveTime < cue.end && cue.text && cue.text.trim().length > 0) {
          if (cue.isTop) {
            topCues.push(cue);
          } else {
            bottomCues.push(cue);
          }
        }
      }

      // Preserve the existing <=200ms hand-off policy, but replace every old row
      // in a group. Co-starting cues are simultaneous, not replacements.
      // This is a product heuristic, not a subtitle-format rule about overlap.
      const resolveMicroOverlap = (cueList) => {
        if (cueList.length <= 1) return cueList;
        const texts = new Set();
        return cueList.filter(prev => {
          let low = 0, high = cueList.length;
          while (low < high) {
            const mid = (low + high) >> 1;
            if (cueList[mid].begin <= prev.begin || cueList[mid].begin < prev.end - 0.200000001) low = mid + 1;
            else high = mid;
          }
          const replaced = low < cueList.length && cueList[low].begin < prev.end;
          if (replaced || texts.has(prev.text.trim())) return false;
          texts.add(prev.text.trim());
          return true;
        });
      };

      topCues = resolveMicroOverlap(topCues);
      bottomCues = resolveMicroOverlap(bottomCues);

      return {
        top: topCues,
        bottom: bottomCues,
        totalActive: topCues.length + bottomCues.length
      };
    }

    /**
     * Stability Set 20: Explicit binary search teleport lookup for skip-intro or random seeks (O(log n))
     */
    findCuesAtTime(targetTime) {
      if (this.cues.length === 0 || !Number.isFinite(targetTime)) return [];
      const ptr = this._binarySearch(targetTime);
      const results = [];
      for (let i = ptr; i < this.cues.length; i++) {
        const c = this.cues[i];
        if (c.begin > targetTime) break;
        if (targetTime >= c.begin && targetTime < c.end && c.text) {
          results.push(c);
        }
      }
      return results;
    }

    /**
     * Stability Set 21: Zero-Allocation fast path reusing internal result buffer to reduce V8 GC thrashing
     */
    getActiveCuesFast(currentTime) {
      if (!this._fastBuffer) {
        this._fastBuffer = { top: [], bottom: [], totalActive: 0 };
      }
      const res = this.getActiveCues(currentTime);
      this._fastBuffer.top = res.top;
      this._fastBuffer.bottom = res.bottom;
      this._fastBuffer.totalActive = res.totalActive;
      return this._fastBuffer;
    }
  }

  window.OTTSubSyncEngineClass = SyncEngine;
  window.OTTSubSyncEngine = new SyncEngine();
})();
