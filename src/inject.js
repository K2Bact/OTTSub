/**
 * OTTSub - inject.js
 * Runs in the MAIN world at document_start.
 * Observes received subtitle manifests without rewriting Netflix requests.
 * Stores manifests by movieId and filters out mismatched episodes.
 */
(() => {
  'use strict';

  if (window.__OTT_SUB_INJECTED__) return;
  window.__OTT_SUB_INJECTED__ = true;

  // Shared only in MAIN: join manifest aliases to the selected player track
  // without exporting raw track identifiers in clock observations.
  const trackTokens = new Map(); let trackSerial = 0;
  window.OTTSubTrackToken = id => {
    if (!['string', 'number'].includes(typeof id) || !String(id).length || String(id).length > 512) return null;
    const key = String(id);
    if (trackTokens.size >= 512 && !trackTokens.has(key)) trackTokens.clear();
    if (!trackTokens.has(key)) trackTokens.set(key, `t${++trackSerial}`);
    return trackTokens.get(key);
  };

  // Manifest store by movieId: { [movieId: string]: manifestPayload }
  window.__OTT_SUB_MANIFEST_STORE__ = window.__OTT_SUB_MANIFEST_STORE__ || Object.create(null);

  const MANIFEST_URL_PATTERN = /manifest|licensedManifest/;
  const REQUIRED_PROFILES = [
    'dfxp-ls-sdh',
    'simplesdh',
    'imsc1.1',
    'webvtt-lssdh-ios8'
  ];

  // Match the clock bridge's two app access paths; never invoke track setters.
  function getVideoPlayerAPI() {
    try {
      const api = window.netflix?.appContext?.state?.playerApp?.getAPI()?.videoPlayer;
      if (api) return api;
    } catch (_) {}
    try { return window.netflix?.appContext?.getPlayerApp?.()?.getAPI()?.videoPlayer; }
    catch (_) { return null; }
  }
  function providerLabelLocale() {
    const locale = document.documentElement?.getAttribute?.('lang') || document.documentElement?.lang || '';
    return window.OTTSubTrackLanguages.code(String(locale)) || undefined;
  }

  /**
   * Helper to extract current active movieId from window.location.pathname or player API
   */
  function getCurrentMovieId() {
    const match = window.location.pathname.match(/\/watch\/(\d+)/);
    if (match) return match[1];

    try {
      const videoPlayer = getVideoPlayerAPI();
      if (videoPlayer) {
        const sessionIds = videoPlayer.getAllPlayerSessionIds();
        if (sessionIds && sessionIds.length > 0) {
          const player = videoPlayer.getVideoPlayerBySessionId(sessionIds[0]);
          if (player && typeof player.getMovieId === 'function') {
            const mid = player.getMovieId();
            if (mid) return String(mid);
          }
        }
      }
    } catch (_) {}

    return null;
  }

  // Keep native serialization: outgoing flags, profiles and objects belong to Netflix.
  const originalStringify = JSON.stringify;

  /**
   * Helper to extract candidate URLs from a track object
   */
  function extractCandidateUrlsFromTrack(track) {
    const urls = [], downloadables = track?.ttDownloadables || track?.downloadables;
    if (!downloadables || typeof downloadables !== 'object') return urls;
    const addUrls = (obj) => {
      if (!obj) return;
      if (obj.downloadUrls && typeof obj.downloadUrls === 'object') urls.push(...Object.values(obj.downloadUrls));
      else if (Array.isArray(obj.urls)) urls.push(...obj.urls.map(u => (typeof u === 'string' ? u : u?.url)).filter(Boolean));
    };
    for (const format of REQUIRED_PROFILES) addUrls(downloadables[format]);
    if (urls.length === 0) {
      for (const [key, formatObj] of Object.entries(downloadables)) {
        if (!REQUIRED_PROFILES.includes(key)) addUrls(formatObj);
      }
    }
    return urls;
  }

  /**
   * Recursively search object tree for manifest payload containing movieId & timedtexttracks
   */
  function findManifestResult(data, depth = 0) {
    if (!data || typeof data !== 'object' || depth > 4) return null;
    if (data.movieId && (data.timedtexttracks || data.textTracks)) return data;
    if (data.result && typeof data.result === 'object') {
      const res = findManifestResult(data.result, depth + 1);
      if (res) return res;
    }
    if (Array.isArray(data)) {
      for (const item of data) {
        const res = findManifestResult(item, depth + 1);
        if (res) return res;
      }
    }
    for (const key of Object.keys(data)) {
      if (key === 'result' || key === 'data' || key === 'params') {
        const res = findManifestResult(data[key], depth + 1);
        if (res) return res;
      }
    }
    return null;
  }

  /**
   * Secondary Provider: Sync tracks directly from Netflix Player API if available
   */
  function syncPlayerTracks(availableTracks, movieId, tracksByLang) {
    try {
      const videoPlayer = getVideoPlayerAPI();
      if (!videoPlayer) return;
      const sessionIds = videoPlayer.getAllPlayerSessionIds();
      if (!Array.isArray(sessionIds) || sessionIds.length > 8) return;
      const players = sessionIds.map(id => videoPlayer.getVideoPlayerBySessionId(id))
        .filter(p => String(p?.getMovieId?.()) === movieId);
      if (players.length !== 1) return;
      const player = players[0];
      if (!player || typeof player.getTimedTextTrackList !== 'function') return;

      const playerTracks = player.getTimedTextTrackList();
      if (!Array.isArray(playerTracks)) return;

      for (const pt of playerTracks.slice(0, 100)) {
        if (!pt || pt.isNoneTrack || pt.isForcedNarrative || pt.rank < 0) continue;
        const bcp = String(pt.bcp47 || pt.language || '').trim();
        const base = bcp.toLowerCase().split('-')[0];
        const isCC = window.OTTSubTrackLanguages.trackKind(pt) === 'cc';
        const label = pt.displayName || pt.languageDescription || bcp;

        if (!window.OTTSubTrackLanguages.code(bcp)) continue;
        let urls = extractCandidateUrlsFromTrack(pt);
        const identityTokens = [...new Set([pt.trackId, pt.new_track_id, pt.id].map(window.OTTSubTrackToken).filter(Boolean))];
        const identityMatches = identityTokens.length ? availableTracks.filter(at =>
          at.identityTokens?.some(token => identityTokens.includes(token))) : [];
        const exists = identityMatches.length === 1 ? identityMatches[0] : !identityTokens.length
          ? availableTracks.find(at => at.bcp47.toLowerCase() === bcp.toLowerCase() && at.isCC === isCC) : null;
        // The player may describe the same manifest track with a regional code.
        // Join by exact identity, never guess that generic es means Spain.
        if (exists && identityMatches.length === 1) {
          if (!urls.length) urls = Array.isArray(exists.urls) ? exists.urls : [];
          exists.bcp47 = bcp; exists.language = base; exists.label = label; exists.labelLocale = providerLabelLocale();
          exists.identityTokens = [...new Set([...exists.identityTokens, ...identityTokens])];
        }
        if (urls.length && !tracksByLang[bcp.toLowerCase()]?.length) tracksByLang[bcp.toLowerCase()] = urls;
        if (exists && !exists.hasUrls && urls.length) {
          exists.urls = urls.slice(0, 3); exists.hasUrls = true;
        }

        if (!exists && (bcp || label)) {
          availableTracks.push({
            id: String(pt.id || pt.trackId || bcp),
            language: base || bcp,
            bcp47: bcp,
            label: label,
            labelLocale: providerLabelLocale(),
            trackType: isCC ? 'closedcaptions' : 'subtitles',
            isCC: isCC,
            identityTokens,
            urls: urls.slice(0, 3),
            hasUrls: urls.length > 0
          });
        }
      }
    } catch (_) {}
  }

  /**
   * Universal manifest interceptor and parser: captures timedtexttracks and manages bounded LRU cache
   */
  function processManifestData(data) {
    if (!data || typeof data !== 'object') return;
    const result = findManifestResult(data);
    if (!result || typeof result !== 'object') return;

    const tracks = result.timedtexttracks || result.textTracks;
    const rawMovieId = result.movieId;

    if (!Array.isArray(tracks) || !rawMovieId) return;

    const movieIdStr = String(rawMovieId);
    if (!/^\d+$/.test(movieIdStr)) return;

    // Cap tracks to at most 100 to prevent DoS/GC pressure on anomalous manifests
    const safeTracks = tracks.slice(0, 100);

    // Filter out none tracks and forced narratives
    const validTracks = safeTracks.filter(t => {
      if (!t || typeof t !== 'object') return false;
      if (t.isNoneTrack) return false;
      if (t.isForcedNarrative) return false;
      if (typeof t.rank === 'number' && t.rank < 0) return false;
      return true;
    });

    // Group downloadable URLs by language code (null prototype avoids prototype pollution)
    const tracksByLang = Object.create(null);
    const availableTracks = [];

    for (const track of validTracks) {
      const rawLang = String(track.bcp47 || track.language || '').trim();
      const rawLangLower = rawLang.toLowerCase();
      const langCode = rawLangLower.split('-')[0] || rawLangLower;
      if (!window.OTTSubTrackLanguages.code(rawLangLower)) continue;
      const trackId = String(track.id || track.new_track_id || track.trackId || rawLang);
      const isCC = window.OTTSubTrackLanguages.trackKind(track) === 'cc';

      const urls = extractCandidateUrlsFromTrack(track);

      if (urls.length > 0) {
        // Keep only exact language keys. Base aliases mixed Hans/Hant and
        // regional subtitles, allowing the wrong variant to win a download.
        if (!tracksByLang[rawLangLower]) tracksByLang[rawLangLower] = [];
        for (const u of urls) if (!tracksByLang[rawLangLower].includes(u)) tracksByLang[rawLangLower].push(u);

        if (rawLang !== rawLangLower) {
          if (!tracksByLang[rawLang]) tracksByLang[rawLang] = [];
          for (const u of urls) {
            if (!tracksByLang[rawLang].includes(u)) tracksByLang[rawLang].push(u);
          }
        }
        if (track.id || track.new_track_id || track.trackId) {
          if (!tracksByLang[trackId]) tracksByLang[trackId] = [];
          for (const u of urls) {
            if (!tracksByLang[trackId].includes(u)) tracksByLang[trackId].push(u);
          }
        }
      }

      // Preserve Netflix's EXACT official label (e.g. '영어(미국)(CC)', '한국어', '스페인어(라틴 아메리카)', '일본어', '중국어(간체)', '그리스어', '네덜란드어', '노르웨이어', '덴마크어')
      const officialLabel = track.languageDescription || track.displayName || track.label || track.description || rawLang;

      // Add ALL valid tracks into availableTracks in Netflix's EXACT manifest array order!
      availableTracks.push({
        id: trackId,
        identityTokens: [...new Set([track.trackId, track.new_track_id, track.id].map(window.OTTSubTrackToken).filter(Boolean))],
        urls: urls.slice(0, 3),
        language: langCode,
        bcp47: rawLang || langCode,
        label: officialLabel,
        labelLocale: providerLabelLocale(),
        trackType: isCC ? 'closedcaptions' : (track.trackType || 'subtitles'),
        isCC: isCC,
        hasUrls: urls.length > 0
      });
    }

    // Secondary provider: Sync any additional tracks from Netflix player API if available
    syncPlayerTracks(availableTracks, movieIdStr, tracksByLang);

    // Candidate URLs for Primary Track (prefer English if available, or first available subtitle track)
    const languagePolicy = window.OTTSubTrackLanguages;
    const candidates = { tracksByLang, availableTracks };
    let candidateUrls = languagePolicy.urls(candidates, 'en');
    if (candidateUrls.length === 0) {
      const first = availableTracks.find(track => languagePolicy.urls(candidates, track.bcp47).length);
      candidateUrls = first ? languagePolicy.urls(candidates, first.bcp47) : [];
    }

    if (candidateUrls.length > 0 || availableTracks.length > 0) {
      const manifestPayload = {
        source: 'ottsub_injected',
        nativeIdentityVersion: 1,
        movieId: movieIdStr,
        urls: candidateUrls,
        tracksByLang: tracksByLang,
        availableTracks: availableTracks
      };

      publishManifestPayload(manifestPayload);
      return true;
    }
  }

  function publishManifestPayload(manifestPayload) {
    const movieIdStr = String(manifestPayload.movieId);
    // Store in global memory map by movieId with bounded LRU eviction (max 5)
    const MAX_CACHED_MANIFESTS = 5;
    window.__OTT_SUB_MANIFEST_ORDER__ = window.__OTT_SUB_MANIFEST_ORDER__ || [];
    const order = window.__OTT_SUB_MANIFEST_ORDER__;
    window.__OTT_SUB_MANIFEST_STORE__[movieIdStr] = manifestPayload;
    const existingIdx = order.indexOf(movieIdStr);
    if (existingIdx !== -1) order.splice(existingIdx, 1);
    order.push(movieIdStr);

    while (order.length > MAX_CACHED_MANIFESTS) {
      const evicted = order.shift();
      if (evicted && evicted !== movieIdStr) {
        delete window.__OTT_SUB_MANIFEST_STORE__[evicted];
        try {
          delete document.documentElement?.dataset?.['ottsubManifest_' + evicted];
          document.documentElement?.removeAttribute?.('data-ottsub-manifest_' + evicted);
        } catch (_) {}
      }
    }

    // Backup onto documentElement dataset keyed by movieId (clean up stale keys to prevent DOM string bloat)
    try {
      if (document.documentElement && document.documentElement.dataset) {
        for (const k of Object.keys(document.documentElement.dataset)) {
          if (k.startsWith('ottsubManifest_') && k !== ('ottsubManifest_' + movieIdStr)) {
            delete document.documentElement.dataset[k];
          }
        }
        document.documentElement.dataset['ottsubManifest_' + movieIdStr] = JSON.stringify(manifestPayload);
        // Also update generic key for convenience
        document.documentElement.dataset.ottsubManifest = JSON.stringify(manifestPayload);
      }
    } catch (_) {}

    // Dispatch DOM CustomEvent
    window.dispatchEvent(new CustomEvent('ottsub_manifest_data', {
      detail: manifestPayload
    }));
  }

  // 2. JSON.parse Hook: Capture timedtexttracks from manifest response
  const originalParse = JSON.parse;
  JSON.parse = function (text) {
    const data = originalParse.apply(this, arguments);
    try {
      processManifestData(data);
    } catch (_) {
      // Fail silently to never interfere with Netflix's core playback
    }
    return data;
  };

  // Each fetch response and its observation clone share one capture. A failed
  // clone must still allow the original consumer's JSON hook to capture later.
  const responseCaptures = new WeakMap();
  const originalResponseJson = typeof Response !== 'undefined' ? Response.prototype?.json : null;
  function captureResponse(response, data) {
    const state = responseCaptures.get(response);
    if (state?.captured) return;
    if (processManifestData(data) && state) state.captured = true;
  }

  // 3. Observe a clone without changing the request or consuming its body.
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      // Forward the original input/init without consuming or rebuilding requests.
      // Guarantee window binding to prevent 'TypeError: Illegal invocation' on native fetch
      const response = await originalFetch.apply(window, args);
      try {
        const url = (args[0] && typeof args[0] === 'string')
          ? args[0]
          : (args[0] && args[0].url) ? args[0].url
            : (args[0] instanceof URL) ? args[0].href : '';
        if (MANIFEST_URL_PATTERN.test(url) && typeof response.clone === 'function' && !response.bodyUsed) {
          const clone = response.clone();
          const state = { captured: false };
          responseCaptures.set(response, state);
          responseCaptures.set(clone, state);
          const read = originalResponseJson && clone instanceof Response ? originalResponseJson : clone.json;
          read.call(clone).then(data => { captureResponse(clone, data); }).catch(() => {});
        }
      } catch (_) {}
      return response;
    };
  }

  // 4. Response.prototype.json Hook: Modern Fetch API Manifest Interception Fallback (Manifest URLs only)
  if (typeof Response !== 'undefined' && Response.prototype && typeof Response.prototype.json === 'function') {
    Response.prototype.json = async function () {
      const data = await originalResponseJson.apply(this, arguments);
      try {
        if (this.url && MANIFEST_URL_PATTERN.test(this.url)) {
          captureResponse(this, data);
        }
      } catch (_) {}
      return data;
    };
  }

  // 5. XMLHttpRequest Hook: Manifest interception fallback for XHR-based players
  if (typeof XMLHttpRequest !== 'undefined' && XMLHttpRequest.prototype) {
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      const result = originalXhrOpen.apply(this, arguments);
      try {
        this._ottsub_url = typeof url === 'string' ? url : (url instanceof URL ? url.href : '');
      } catch (_) { this._ottsub_url = ''; }
      return result;
    };

    XMLHttpRequest.prototype.send = function () {
      try {
        if (this._ottsub_url && MANIFEST_URL_PATTERN.test(this._ottsub_url)) {
          this.addEventListener('load', function () {
            try {
              let payload = null;
              if (this.responseType === 'json' && this.response) {
                payload = this.response;
              } else if (!this.responseType || this.responseType === 'text') {
                if (typeof this.responseText === 'string' && this.responseText.trim().startsWith('{')) {
                  payload = JSON.parse(this.responseText);
                }
              }
              if (payload) {
                processManifestData(payload);
              }
            } catch (_) {}
          });
        }
      } catch (_) {}
      return originalXhrSend.apply(this, arguments);
    };
  }

  // 6. Request listener from content script: Content script asks for a specific movieId manifest
  window.addEventListener('ottsub_request_manifest', event => {
    try {
      const rawReq = event.detail && event.detail.movieId ? String(event.detail.movieId) : getCurrentMovieId();
      if (!rawReq || !/^\d+$/.test(rawReq)) return;
      const reqMovieId = rawReq;
      if (window.__OTT_SUB_MANIFEST_STORE__[reqMovieId]) {
        // Touch in LRU order
        const order = window.__OTT_SUB_MANIFEST_ORDER__;
        if (Array.isArray(order)) {
          const idx = order.indexOf(reqMovieId);
          if (idx !== -1) {
            order.splice(idx, 1);
            order.push(reqMovieId);
          }
        }
        window.dispatchEvent(new CustomEvent('ottsub_manifest_data', {
          detail: window.__OTT_SUB_MANIFEST_STORE__[reqMovieId]
        }));
      }
    } catch (_) {}
  });

  // Netflix's native preparation path merges metadata without selecting tracks.
  // Never use hydratePendingTracks/setTextTrack, which also switch selection.
  const hydrationAttempts = new WeakMap(), hydrationBusy = new WeakSet();
  async function prepareMissingTrack(player, matched, movieId, language, kind = 'auto') {
    let playback, segment;
    const announce = status => {
      try { window.dispatchEvent(new CustomEvent('ottsub_track_acquisition', {detail:{movieId,language,status}})); } catch (_) {}
    };
    try {
      if (!matched || typeof player.getInternalPlayer !== 'function') return;
      const internal = player.getInternalPlayer(); playback = internal?.playback; segment = playback?.currentSegment;
      const current = () => window.location.pathname.match(/^\/watch\/(\d+)/)?.[1] === movieId
        && String(player.getMovieId?.()) === movieId && playback.currentSegment === segment;
      if (!segment || String(segment.movieId) !== movieId || !current()
        || internal.pendingTrackHydration || segment.playbackParams?.isBranching || segment.livePlaybackManager?.isLive
        || segment.manifest?.manifestResult?.isAd === true
        || segment.mainViewableId && String(segment.mainViewableId) !== movieId) return;
      // Existing internal metadata may already contain URLs omitted by the public API.
      const known = segment.manifest?.manifestResult;
      if (known && String(known.movieId) === movieId) processManifestData(known);
      if (window.OTTSubTrackLanguages.urls(window.__OTT_SUB_MANIFEST_STORE__[movieId],language,kind).length) {
        announce('metadata-ready'); return;
      }
      if (typeof internal.findPlayerTextTrack !== 'function' || typeof playback.hydrateRequiredTracks !== 'function'
        || typeof segment.tracks?.getCompatibleTrackSet !== 'function') return;
      const target = internal.findPlayerTextTrack(matched), audio = segment.tracks.audioTrack, video = segment.tracks.videoTrack;
      if (!target || target.hydrated !== false || !audio || !video || audio.hydrated !== true || video.hydrated !== true
        || String(target.trackId) !== String(matched.trackId)
        || !window.OTTSubTrackLanguages.compatible(language,target.bcp47)
        || kind !== 'auto' && window.OTTSubTrackLanguages.trackKind(target) !== kind) return;
      const idValid = id => typeof id === 'string' && id.length > 0 && id.length <= 512
        || typeof id === 'number' && Number.isSafeInteger(id);
      if (![audio.trackId,target.trackId,video.trackId].every(idValid)) return;
      const compatible = segment.tracks.getCompatibleTrackSet(target,[video,audio]);
      if (compatible?.audioTrack !== audio || compatible?.videoTrack !== video || compatible?.timedTextTrack !== target) return;
      if (hydrationBusy.has(playback)) return;
      let attempts = hydrationAttempts.get(segment);
      if (!attempts) { attempts = new Set(); hydrationAttempts.set(segment,attempts); }
      if (attempts.has(target.trackId) || attempts.size >= 8) return;
      attempts.add(target.trackId); hydrationBusy.add(playback); announce('preparing');
      try {
        // Verified native method takes current audio/video plus the requested text ID.
        // It calls processNewManifest(..., true); setters are a separate caller step.
        await playback.hydrateRequiredTracks(audio.trackId,target.trackId,video.trackId);
        if (!current()) return;
        const hydrated = segment.manifest?.manifestResult;
        if (hydrated && String(hydrated.movieId) === movieId) processManifestData(hydrated);
        announce(window.OTTSubTrackLanguages.urls(window.__OTT_SUB_MANIFEST_STORE__[movieId],language,kind).length ? 'ready' : 'no-urls');
      } catch (_) { if (current()) announce('failed'); }
      finally { hydrationBusy.delete(playback); }
    } catch (_) { /* An unavailable internal shape leaves native playback untouched. */ }
  }

  // 7. Missing addresses: read metadata first, then bounded native preparation.
  window.addEventListener('ottsub_request_load_track', event => {
    try {
      const targetLang = event.detail?.lang;
      const kind = event.detail?.kind ?? 'auto';
      if (!window.OTTSubTrackLanguages.validKind(kind)) return;
      const requestedMovieId = String(event.detail?.movieId || '');
      const watchMovieId = window.location.pathname.match(/\/watch\/(\d+)/)?.[1];
      if (typeof targetLang !== 'string' || !targetLang || requestedMovieId !== watchMovieId) return;
      if (!window.OTTSubTrackLanguages.code(targetLang)) return;

      const videoPlayer = getVideoPlayerAPI();
      if (!videoPlayer) return;
      const sessionIds = videoPlayer.getAllPlayerSessionIds();
      if (!Array.isArray(sessionIds) || sessionIds.length > 8) return;
      const players = sessionIds.map(id => videoPlayer.getVideoPlayerBySessionId(id))
        .filter(player => String(player?.getMovieId?.()) === requestedMovieId);
      if (players.length !== 1) return;
      const tracks = players[0].getTimedTextTrackList?.();
      if (!Array.isArray(tracks)) return;
      const usable = tracks.slice(0, 100).filter(t => t && !t.isNoneTrack && !t.isForcedNarrative && !(t.rank < 0));
      const matched = window.OTTSubTrackLanguages.pick(usable, targetLang, undefined, kind);
      // Discovery never switches the user's Netflix subtitle track.
      const cached = window.__OTT_SUB_MANIFEST_STORE__[requestedMovieId];
      if (!cached) {
        // A URL-less menu is not a replacement for a downloaded manifest.
        if (extractCandidateUrlsFromTrack(matched).length) processManifestData({ movieId: requestedMovieId, timedtexttracks: usable });
        if (!extractCandidateUrlsFromTrack(matched).length) void prepareMissingTrack(players[0],matched,requestedMovieId,targetLang,kind);
        return;
      }
      const tracksByLang = { ...cached.tracksByLang };
      const urls = extractCandidateUrlsFromTrack(matched);
      if (urls.length) tracksByLang[String(matched.bcp47 || matched.language).toLowerCase()] = urls;
      // Per-track URLs belong to that exact identity, not every CC/non-CC track
      // in the same language. syncPlayerTracks performs that identity join.
      const availableTracks = cached.availableTracks.map(t => ({ ...t }));
      syncPlayerTracks(availableTracks, requestedMovieId, tracksByLang);
      if (originalStringify([tracksByLang, availableTracks]) !== originalStringify([cached.tracksByLang, cached.availableTracks])) {
        publishManifestPayload({ ...cached, tracksByLang, availableTracks });
      }
      if (!window.OTTSubTrackLanguages.urls(window.__OTT_SUB_MANIFEST_STORE__[requestedMovieId],targetLang,kind).length) {
        void prepareMissingTrack(players[0],matched,requestedMovieId,targetLang,kind);
      }

    } catch (_) {}
  });

  // 8. Navigation Hook: Notify content script on SPA route changes (popstate, pushState, replaceState)
  function notifyNavChange() {
    const curMovieId = getCurrentMovieId();
    window.dispatchEvent(new CustomEvent('ottsub_nav_change', {
      detail: {
        source: 'ottsub_injected',
        path: window.location.pathname,
        movieId: curMovieId
      }
    }));

    // If manifest for the newly navigated movie is already cached, dispatch immediately
    if (curMovieId && window.__OTT_SUB_MANIFEST_STORE__[curMovieId]) {
      window.dispatchEvent(new CustomEvent('ottsub_manifest_data', {
        detail: window.__OTT_SUB_MANIFEST_STORE__[curMovieId]
      }));
    }
  }

  window.addEventListener('popstate', notifyNavChange);

  const originalPushState = history.pushState;
  history.pushState = function () { const r = originalPushState.apply(this, arguments); notifyNavChange(); return r; };
  const originalReplaceState = history.replaceState;
  history.replaceState = function () { const r = originalReplaceState.apply(this, arguments); notifyNavChange(); return r; };
})();
