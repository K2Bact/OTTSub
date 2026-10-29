// Bounded metadata refreshes for different rejected URL sets in one track scope.
// A cached manifest is not a new token; rejected addresses must never be retried.
(() => {
  'use strict';
  class TrackRecovery {
    constructor(limit = 32, now = () => globalThis.performance?.now?.() ?? Date.now()) {
      this.limit = limit; this.now = now; this.entries = new Map();
      this.cooldownMs = 10000; this.maxAttempts = 3;
    }
    key(generation, role, language, kind) { return JSON.stringify([generation, role, language, kind]); }
    clear() { this.entries.clear(); }
    freshUrls(key, urls) {
      const rejected = this.entries.get(key)?.rejected;
      return rejected ? urls.filter(url => !rejected.has(url)) : urls;
    }
    refresh(key, rejectedUrls, readMetadata) {
      if (!rejectedUrls.length) return false;
      const signature = JSON.stringify([...new Set(rejectedUrls.slice(0, 3))].sort());
      let entry = this.entries.get(key);
      const now = this.now();
      if (entry && (entry.attempts >= this.maxAttempts || entry.signatures.has(signature)
        || now - entry.lastAt < this.cooldownMs)) return false;
      if (!entry) {
        if (this.entries.size >= this.limit) return false;
        entry = { rejected: new Set(), signatures: new Set(), attempts: 0, lastAt: 0 };
        this.entries.set(key, entry);
      }
      entry.signatures.add(signature); entry.attempts++; entry.lastAt = now;
      this.reject(key, rejectedUrls);
      readMetadata();
      return true;
    }
    pending(key, urls) {
      const entry = this.entries.get(key);
      const signature = JSON.stringify([...new Set(urls.slice(0, 3))].sort());
      return !!entry && entry.attempts < this.maxAttempts && !entry.signatures.has(signature);
    }
    reject(key, urls) {
      const rejected = this.entries.get(key)?.rejected;
      if (rejected) for (const url of urls.slice(0, 3)) if (rejected.size < 12) rejected.add(url);
    }
  }
  window.OTTSubTrackRecovery = TrackRecovery;
})();
