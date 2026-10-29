/**
 * OTTSub - src/network/track-fetcher.js
 * Subtitle track fetcher with candidate/final URL validation and bounded retries.
 */
(() => {
  'use strict';

  /**
   * Validate a candidate or final subtitle URL against trusted Netflix CDN domains.
   */
  function isSafeNetflixSubtitleUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    try {
      const parsed = new URL(urlStr);
      // Red Teaming Set 3: Strictly enforce HTTPS protocol
      if (parsed.protocol !== 'https:') return false;
      // Red Teaming Set 3: Reject userinfo and non-standard ports to prevent credential spoofing and port scanning
      if (parsed.username !== '' || parsed.password !== '') return false;
      if (parsed.port !== '' && parsed.port !== '443') return false;

      const hostname = parsed.hostname.toLowerCase();
      return (
        hostname === 'nflxvideo.net' || hostname.endsWith('.nflxvideo.net') ||
        hostname === 'nflxso.net' || hostname.endsWith('.nflxso.net') ||
        hostname === 'nflximg.net' || hostname.endsWith('.nflximg.net') ||
        hostname === 'nflxext.com' || hostname.endsWith('.nflxext.com') ||
        hostname === 'netflix.com' || hostname.endsWith('.netflix.com')
      );
    } catch (_) {
      return false;
    }
  }

  /**
   * Helper to fetch and parse a subtitle track from candidate URLs
   */
  function waitForRetry(delayMs, signal) {
    return new Promise(resolve => {
      if (signal?.aborted) return resolve();
      const finish = () => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', finish);
        resolve();
      };
      const timer = setTimeout(finish, delayMs);
      signal?.addEventListener('abort', finish, { once: true });
    });
  }

  async function fetchTrackResult(candidateUrls, externalSignal = null) {
    const rejectedUrls = [];
    const empty = status => ({ cues: [], status, rejectedUrls });
    if (!Array.isArray(candidateUrls) || candidateUrls.length === 0) return empty('empty');
    const candidates = candidateUrls.slice(0, 3);
    for (const subUrl of candidates) {
      if (!isSafeNetflixSubtitleUrl(subUrl)) continue;

      // Stability Set 16 Defense: Exponential backoff with jitter & circuit breaker (max 2 retries per candidate)
      let attempt = 0;
      const MAX_ATTEMPTS = 2;
      while (attempt < MAX_ATTEMPTS) {
        attempt++;
        if (externalSignal?.aborted) return empty('cancelled');
        const controller = new AbortController();
        const cancel = () => controller.abort();
        externalSignal?.addEventListener('abort', cancel, { once: true });
        // Keep the deadline even when the caller supplies a cancellation signal.
        const timeout = setTimeout(cancel, 6000);
        try {
          const signal = controller.signal;
          // Native CORS follows redirects for existing cross-CDN delivery. The
          // final URL check rejects subtitle data, not intermediate network requests.
          const response = await fetch(subUrl, { mode: 'cors', signal, redirect: 'follow' });
          
          // Circuit breaker: Fail-fast immediately on 403 Forbidden or 404 Not Found (no useless retries)
          if (response.status === 403 || response.status === 404) {
            rejectedUrls.push(subUrl);
            break; // Move to next candidate CDN URL immediately
          }

          if (!isSafeNetflixSubtitleUrl(response.url)) break;
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const text = await response.text();
          if (signal.aborted) {
            if (externalSignal?.aborted) return empty('cancelled');
            throw new Error('Subtitle request timed out');
          }
          const parsedCues = window.OTTSubParser ? window.OTTSubParser.parse(text) : [];
          if (parsedCues.length > 0) {
            return { cues: parsedCues, status: 'ready', rejectedUrls };
          }
          break; // If parsed successfully or empty, don't retry same URL
        } catch (err) {
          if (externalSignal?.aborted) return empty('cancelled');
        } finally {
          clearTimeout(timeout);
          externalSignal?.removeEventListener('abort', cancel);
        }
        if (attempt < MAX_ATTEMPTS) {
          await waitForRetry(attempt * 150 + Math.round(Math.random() * 80), externalSignal);
        }
      }
    }
    return empty(externalSignal?.aborted ? 'cancelled' : rejectedUrls.length ? 'addresses-rejected' : 'failed');
  }

  // Existing verification/recovery callers keep the cue-array interface.
  async function fetchAndParseTrack(candidateUrls, externalSignal = null) {
    return (await fetchTrackResult(candidateUrls, externalSignal)).cues;
  }

  window.OTTSubTrackFetcher = {
    isSafeNetflixSubtitleUrl,
    fetchTrackResult,
    fetchAndParseTrack
  };
})();
