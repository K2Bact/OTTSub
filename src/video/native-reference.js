// Verification-only subtitle track. Never changes Netflix's selection or renderer cues.
(() => {
  'use strict';
  class NativeReference {
    constructor(fetchTrack, plainText) { this.fetchTrack = fetchTrack; this.plainText = plainText; this.reset(); }
    reset() {
      this.request?.controller.abort(); this.request = null; this.payload = null;
      this.status = 'unavailable'; this.key = null; this.cues = [];
    }
    update(track, payload, movieId, generation) {
      // Legacy manifests lack exact identities; retain their existing verification.
      if (payload?.nativeIdentityVersion !== 1) { this.reset(); return null; }
      if (!track || track.status === 'off') {
        this.reset(); this.status = track?.status === 'off' ? 'off' : 'unavailable'; return [];
      }
      const matches = String(payload.movieId) === String(movieId) && /^t\d+$/.test(track.id || '')
        && Array.isArray(payload.availableTracks) ? payload.availableTracks.slice(0, 100).filter(t =>
          Array.isArray(t.identityTokens) && t.identityTokens.includes(track.id)) : [];
      if (matches.length !== 1) { this.reset(); this.status = matches.length ? 'ambiguous' : 'track-missing'; return []; }
      const urls = Array.isArray(matches[0].urls) ? matches[0].urls.filter(u => typeof u === 'string').slice(0, 3) : [];
      const key = JSON.stringify([movieId, generation, track.id, urls]);
      if (key !== this.key) {
        this.reset(); this.key = key; this.payload = payload;
        this.status = urls.length ? 'loading' : 'urls-missing';
        if (urls.length) {
          const request = this.request = { controller: new AbortController(), key };
          Promise.resolve().then(() => this.fetchTrack(urls, request.controller.signal)).then(cues => {
            if (this.request !== request || request.controller.signal.aborted) return;
            this.cues = cues.slice(0, 10000).map(c => ({ ...c, plainText: this.plainText(c.text) }));
            this.status = this.cues.length ? 'ready' : 'empty';
          }).catch(() => { if (this.request === request) this.status = 'failed'; });
        }
      }
      this.payload = payload;
      return this.status === 'ready' ? [{ key: `native:${track.id}`, cues: this.cues }] : [];
    }
  }
  window.OTTSubNativeReference = NativeReference;
})();
