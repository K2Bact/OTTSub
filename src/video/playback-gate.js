// Pure display gate. Recovery requires a separately verified, owner-bound clock.
(() => {
  'use strict';
  class PlaybackGate {
    constructor() { this.reset(null); }
    reset(movieId) {
      this.movieId = movieId;
      this.state = movieId ? 'NATIVE_FALLBACK' : 'INACTIVE';
      this.adHistory = false;
      this.requiresClock = false;
      this.mediaTime = null;
      this.pauseAd = false;
      this.hidden = false;
      this.observed = false;
      this.video = null;
      this.lastAt = null;
      this.absentSince = null;
      this.absentCount = 0;
      this.recoveryMs = 0;
      this.clockVerified = false;
      this.clockSource = 'video';
      this.adSignal = 'unknown';
    }
    invalidateClock() {
      if (this.adHistory || this.clockVerified || this.requiresClock) {
        this.requiresClock = true;
        this.clockVerified = false;
        if (this.state !== 'AD') this.state = 'RECOVERING';
      }
      this.absentSince = null; this.absentCount = 0;
    }
    stableAbsence(now, verification = null) {
      const seek = verification === 'seek-session-confirmed';
      return this.adSignal === 'absent' && !this.hidden && !this.pauseAd && this.video
        && this.absentSince !== null && now - this.absentSince >= (seek ? 400 : 1000) && this.absentCount >= (seek ? 3 : 5)
        && now >= this.lastAt && now - this.lastAt < 500;
    }
    confirmClock(source, now, verification = null) {
      if (!['video', 'player', 'session'].includes(source) || !this.stableAbsence(now, verification)) return false;
      this.clockSource = source; this.clockVerified = true; this.requiresClock = false;
      this.state = 'CONTENT'; this.recoveryMs = 0;
      return true;
    }
    observe({ adSignal = 'unknown', pauseAd = false, video = null, mediaTime = null, hidden = false }, now) {
      if (!this.movieId || !Number.isFinite(now)) return this.status(now);
      const gap = this.lastAt === null ? Infinity : now - this.lastAt;
      const continuous = gap >= 0 && gap <= 500 && !this.hidden && !hidden && video === this.video;
      const first = !this.observed;
      if (this.pauseAd && (video !== this.video || !Number.isFinite(mediaTime) || !Number.isFinite(this.mediaTime)
        || Math.abs(mediaTime - this.mediaTime) > 0.25)) this.requiresClock = true;
      if (this.state === 'RECOVERING' && continuous) this.recoveryMs += gap;
      if (!continuous || adSignal !== 'absent' || hidden) {
        this.absentSince = null;
        this.absentCount = 0;
      }
      this.video = video;
      this.mediaTime = mediaTime;
      this.hidden = hidden;
      this.pauseAd = pauseAd === true;
      this.lastAt = now;
      this.observed = true;
      this.adSignal = adSignal;
      if (hidden) {
        // Observation stops in the background. Even a title with no known ad
        // can play an entire break while hidden, so elapsed time is not proof.
        this.requiresClock = true;
        this.clockVerified = false;
        if (this.state !== 'AD') this.state = 'RECOVERING';
        return this.status(now);
      }
      if (adSignal === 'present') {
        this.adHistory = true;
        this.requiresClock = true;
        this.clockVerified = false;
        this.state = 'AD';
        this.recoveryMs = 0;
      } else if (this.state === 'AD' && adSignal !== 'absent') {
        // A missing/invalid observation cannot end a known ad.
      } else if (adSignal === 'uncertain' || adSignal === 'unknown' || !video) {
        if (adSignal === 'uncertain') { this.adHistory = true; this.requiresClock = true; }
        if (this.adHistory || this.clockVerified) { this.requiresClock = true; this.clockVerified = false; }
        if (this.state === 'CONTENT' || this.adHistory) this.state = 'RECOVERING';
      } else if (adSignal === 'absent') {
        if (this.absentSince === null) this.absentSince = now;
        this.absentCount++;
        if (this.state === 'AD') { this.state = 'RECOVERING'; this.recoveryMs = 0; }
        const stable = now - this.absentSince >= 1000 && this.absentCount >= 5;
        if (!this.requiresClock && (first || (this.state === 'CONTENT' && continuous) || stable)) {
          this.state = 'CONTENT';
          this.recoveryMs = 0;
        } else if (this.state === 'CONTENT') this.state = 'RECOVERING';
        // No elapsed-time shortcut after an ad; confirmClock requires caller evidence.
      }
      if (this.state === 'RECOVERING' && this.recoveryMs >= 10000) this.state = 'RECOVERY_DELAYED';
      return this.status(now);
    }
    status(now) {
      const stale = this.lastAt === null || !Number.isFinite(now) || now - this.lastAt >= 1000 || now < this.lastAt;
      const reason = !this.movieId ? 'inactive' : this.hidden ? 'hidden' : this.state === 'AD' ? 'ad'
        : this.pauseAd ? 'pause-ad' : stale ? 'observation-stale'
        : this.requiresClock ? 'clock-unverified' : this.state !== 'CONTENT' ? 'observation-unavailable' : null;
      return { playbackState: this.state, displaySuppressed: reason !== null, suppressionReason: reason,
        clockSource: reason === null ? this.clockSource : null, clockVerified: this.clockVerified && reason === null };
    }
  }
  window.OTTSubPlaybackGate = PlaybackGate;
})();
