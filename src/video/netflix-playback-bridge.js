// MAIN world, read-only allowlist. Shared DOM events are not an authenticated channel.
(() => {
  'use strict';
  if (window.__OTT_SUB_CLOCK_BRIDGE__) return;
  window.__OTT_SUB_CLOCK_BRIDGE__ = true;
  let lastRequest = -Infinity, serial = 0;
  const sessions = new Map(), tracks = new Map(), videos = new WeakMap();
  const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e12;
  function getAppAPI() {
    try {
      const api = window.netflix?.appContext?.state?.playerApp?.getAPI();
      if (api) return api;
    } catch (_) {}
    try { return window.netflix?.appContext?.getPlayerApp?.()?.getAPI(); } catch (_) { return null; }
  }
  // Observations only: field presence is not proof that an ad has ended.
  function observeSession(app, player, id, session, movieId) {
    const observation = { status: 'ok', session, playback: null,
      open: { status: 'unavailable', raw: null, adState: 'unavailable' }, track: null };
    try {
      const state = app.getPlaybackStateBySessionId(id);
      if (state && typeof state === 'object') {
        const ad = state.currentAdBreak, raw = state.currentTime;
        observation.playback = { raw: finite(raw) ? raw : null,
          adValue: ad === undefined ? 'undefined' : ad === null ? 'null' : ad === true ? 'true'
            : ad === false ? 'false' : typeof ad === 'object' ? 'object' : 'other' };
      }
    } catch (_) {}
    try {
      const list = app.getOpenPlaybackSessions();
      if (Array.isArray(list)) {
        if (list.length > 8) observation.open.status = 'ambiguous';
        else {
          const matches = list.filter(s => s && ['string', 'number'].includes(typeof s.videoId) && String(s.videoId) === movieId);
          observation.open.status = matches.length > 1 ? 'ambiguous' : matches.length ? 'ok' : 'missing';
          if (matches.length === 1) {
            const raw = matches[0].currentTime, ad = matches[0].currentAdBreakState;
            observation.open.raw = finite(raw) ? raw : null;
            observation.open.adState = ad === 'start' || ad === 'end' ? ad
              : ad === undefined ? 'undefined' : ad === null ? 'null' : 'other';
          }
        }
      }
    } catch (_) { observation.open = { status: 'unavailable', raw: null, adState: 'unavailable' }; }
    try {
      const track = player.getTextTrack();
      if (track && typeof track === 'object') {
        const rawId = track.trackId, lang = track.bcp47 || track.language;
        const validId = typeof rawId === 'string' && rawId.length > 0 && rawId.length <= 512
          || typeof rawId === 'number' && Number.isSafeInteger(rawId);
        const off = track.isNoneTrack === true || typeof rawId === 'string' && /(?:^|[-_:])NONE(?:$|[-_:])/i.test(rawId);
        if (tracks.size >= 128) tracks.clear();
        if (validId && !tracks.has(rawId)) tracks.set(rawId, `t${++serial}`);
        const type = track.rawTrackType || track.trackType;
        observation.track = { status: off ? 'off' : 'selected', id: validId ? (window.OTTSubTrackToken?.(rawId) || tracks.get(rawId)) : null,
          language: typeof lang === 'string' && lang.length <= 64 && /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(lang) ? lang.toLowerCase() : null,
          kind: track.isForcedNarrative === true ? 'forced_narrative' : track.isCC === true ? 'closedcaptions'
            : ['subtitles', 'closedcaptions', 'assistive', 'sdh', 'forced_narrative'].includes(type) ? type : 'unknown' };
      }
    } catch (_) {}
    return observation;
  }
  window.addEventListener('ottsub_clock_request', event => {
    if (typeof event.detail !== 'string' || event.detail.length > 512) return;
    let request;
    try { request = JSON.parse(event.detail); } catch (_) { return; }
    const movieId = location.pathname.match(/^\/watch\/(\d+)/)?.[1];
    if (request?.version !== 1 || request.movieId !== movieId || !/^\d{1,20}$/.test(movieId || '')
      || !Number.isSafeInteger(request.requestId) || request.requestId < 1
      || !Number.isSafeInteger(request.episodeGeneration) || request.episodeGeneration < 0) return;
    const now = performance.now();
    if (now - lastRequest < 50) return;
    lastRequest = now;
    const response = { version: 1, requestId: request.requestId, movieId, episodeGeneration: request.episodeGeneration,
      status: 'unavailable', ownerState: 'unknown', sessions: [], videos: [], observation: { status: 'unavailable', session: null, playback: null, open: null, track: null } };
    try {
      const nodes = document.querySelectorAll('video');
      if (nodes.length > 8) throw new Error('ambiguous');
      for (const video of nodes) {
        if (!videos.has(video)) videos.set(video, `v${++serial}`);
        const id = videos.get(video);
        if (video.getAttribute('data-ottsub-clock-video') !== id) video.setAttribute('data-ottsub-clock-video', id);
        if (finite(video.currentTime)) response.videos.push({ id, time: video.currentTime });
      }
      const app = getAppAPI(), api = app?.videoPlayer;
      const ids = api?.getAllPlayerSessionIds();
      if (!Array.isArray(ids) || ids.length > 8) throw new Error('ambiguous');
      if (sessions.size > 64) sessions.clear();
      let matching = 0, knownOwners = 0;
      for (const id of ids) {
        try {
          const player = api.getVideoPlayerBySessionId(id);
          const actualMovieId = String(player?.getMovieId());
          if (!/^\d{1,20}$/.test(actualMovieId)) continue;
          knownOwners++;
          if (actualMovieId !== movieId) continue;
          matching++;
          if (!sessions.has(id)) sessions.set(id, `s${++serial}`);
          response.observation = observeSession(app, player, id, sessions.get(id), movieId);
          const raw = player.getCurrentTime();
          if (!finite(raw)) continue;
          response.sessions.push({ id: sessions.get(id), raw });
        } catch (_) { /* This session supplies no usable candidate. */ }
      }
      if (matching > 1) {
        response.ownerState = 'ambiguous';
        response.observation = { status: 'ambiguous', session: null, playback: null, open: null, track: null };
        throw new Error('ambiguous');
      }
      response.ownerState = matching === 1 ? 'matched' : knownOwners ? 'mismatch' : 'unknown';
      response.status = 'ok';
    } catch (_) { response.sessions = []; }
    window.dispatchEvent(new CustomEvent('ottsub_clock_response', { detail: JSON.stringify(response) }));
  });
})();
