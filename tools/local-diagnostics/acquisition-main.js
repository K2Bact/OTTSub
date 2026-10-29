// OTTSUB_LOCAL_DIAGNOSTICS — local MAIN-world observations, excluded from store packages.
(() => {
  'use strict';
  if (window.__ottsubAcquisitionProbe) return;
  window.__ottsubAcquisitionProbe = true;
  const stringify = JSON.stringify, parse = JSON.parse;
  const requests = [], manifests = new Map();
  const movie = v => /^\d{1,20}$/.test(String(v ?? '')) ? String(v) : null;
  const language = v => typeof v === 'string' && /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(v) ? v.toLowerCase() : null;
  const flag = v => typeof v === 'boolean' ? v : null;
  const currentMovie = () => movie(window.location.pathname.match(/^\/watch\/(\d+)/)?.[1]);
  function track(t) {
    const downloadables = t?.ttDownloadables || t?.downloadables || {};
    const formats = Object.keys(downloadables).filter(k => /^[a-z0-9.:-]{1,80}$/i.test(k)).slice(0, 20);
    let urls = 0;
    for (const f of formats) {
      const d = downloadables[f];
      urls += d?.downloadUrls && typeof d.downloadUrls === 'object' ? Object.keys(d.downloadUrls).length
        : Array.isArray(d?.urls) ? d.urls.length : 0;
    }
    return { language: language(t?.bcp47 || t?.language), hydrated: flag(t?.hydrated),
      rank: Number.isFinite(t?.rank) ? t.rank : null, formats, urls: Math.min(urls, 100),
      cc: t?.isCC === true || t?.rawTrackType === 'closedcaptions' };
  }
  function requestInfo(data) {
    if (!data || typeof data !== 'object') return null;
    const known = typeof data.url === 'string' && /manifest|licensedManifest/.test(data.url);
    const profiles = data.params?.profiles || data.profiles;
    const subtitleProfiles = Array.isArray(profiles) && profiles.every(p => typeof p === 'string')
      && profiles.some(p => /dfxp|webvtt|simplesdh|imsc|heaac|ddplus/.test(p));
    if (!known && !subtitleProfiles) return null;
    const settings = [], seen = new WeakSet(); let mid = null, visited = 0;
    function walk(obj, depth) {
      if (!obj || typeof obj !== 'object' || depth > 8 || seen.has(obj) || ++visited > 250) return;
      seen.add(obj);
      mid ||= movie(obj.viewableId || obj.movieId);
      if (Object.prototype.hasOwnProperty.call(obj, 'supportsPartialHydration')
        || Object.prototype.hasOwnProperty.call(obj, 'showAllSubDubTracks')) {
        settings.push({ partial: flag(obj.supportsPartialHydration), allTracks: flag(obj.showAllSubDubTracks),
          languageLimit: Number.isFinite(obj.maxSupportedLanguages) ? obj.maxSupportedLanguages : null });
      }
      for (const v of Object.values(obj)) if (v && typeof v === 'object') walk(v, depth + 1);
    }
    walk(data, 0);
    return { movieId: mid, settings: settings.slice(0, 12) };
  }
  JSON.stringify = function(...args) {
    let before;
    try { before = requestInfo(args[0]); } catch (_) {}
    const result = stringify.apply(this, args);
    try {
      if (before) {
        requests.push({ before, after: requestInfo(args[0]) });
        if (requests.length > 30) requests.shift();
      }
    } catch (_) {}
    return result;
  };
  function observe(data, depth = 0) {
    if (!data || typeof data !== 'object' || depth > 4) return;
    const mid = movie(data.movieId), tracks = data.timedtexttracks || data.textTracks;
    if (mid && Array.isArray(tracks)) {
      const value = { movieId: mid, partial: flag(data.partiallyHydrated),
        tracks: tracks.slice(0, 100).filter(t => t && !t.isNoneTrack && !t.isForcedNarrative).map(track) };
      manifests.delete(mid); manifests.set(mid, value);
      while (manifests.size > 5) manifests.delete(manifests.keys().next().value);
      return;
    }
    if (Array.isArray(data)) { for (const item of data.slice(0, 100)) observe(item, depth + 1); }
    else for (const key of ['result', 'data', 'params']) observe(data[key], depth + 1);
  }
  JSON.parse = function(...args) {
    const result = parse.apply(this, args);
    try { observe(result); } catch (_) {}
    return result;
  };
  if (typeof Response !== 'undefined' && typeof Response.prototype.json === 'function') {
    const original = Response.prototype.json;
    Response.prototype.json = async function(...args) {
      const result = await original.apply(this, args);
      try { if (/manifest|licensedManifest/.test(this.url || '')) observe(result); } catch (_) {}
      return result;
    };
  }
  function playerSnapshot(mid) {
    try {
      let api = null;
      try { api = window.netflix?.appContext?.state?.playerApp?.getAPI()?.videoPlayer; } catch (_) {}
      if (!api) {
        try { api = window.netflix?.appContext?.getPlayerApp?.()?.getAPI()?.videoPlayer; } catch (_) {}
      }
      const ids = api?.getAllPlayerSessionIds?.();
      if (!Array.isArray(ids) || ids.length > 8) return { matchingPlayers: null, tracks: [] };
      const players = ids.map(id => api.getVideoPlayerBySessionId(id)).filter(p => String(p?.getMovieId?.()) === mid);
      if (players.length !== 1) return { matchingPlayers: players.length, tracks: [] };
      const readList = name => {
        try {
          if (typeof players[0][name] !== 'function') return {status:'unavailable',tracks:[]};
          const list = players[0][name]();
          if (Array.isArray(list)) return {status:'array',tracks:list.slice(0,100).filter(t => t && !t.isNoneTrack && !t.isForcedNarrative).map(track)};
          if (list && typeof list.then === 'function') {
            Promise.resolve(list).catch(() => {});
            return {status:'async',tracks:[]};
          }
          return {status:'other',tracks:[]};
        } catch (_) { return {status:'failed',tracks:[]}; }
      };
      const legacy = readList('getTimedTextTrackList'), modern = readList('getTextTrackList');
      const descriptors = Object.getOwnPropertyDescriptors(players[0]);
      return { matchingPlayers: 1,
        methods: Object.entries(descriptors).filter(([key, d]) => typeof d.value === 'function' && /^[a-z0-9_]{1,80}$/i.test(key)).map(([key]) => key).slice(0, 80),
        legacyStatus: legacy.status, tracks: legacy.tracks, modern };
    } catch (_) { return { matchingPlayers: null, tracks: [] }; }
  }
  let lastInspection = -Infinity;
  window.addEventListener('ottsub_local_acquisition_request', () => {
    if (Date.now() - lastInspection < 200) return;
    lastInspection = Date.now();
    const mid = currentMovie();
    if (!mid) return;
    try {
      const cached = window.__OTT_SUB_MANIFEST_STORE__?.[mid];
      const detail = { source: 'ottsub_local_acquisition', movieId: mid,
        requests: requests.filter(r => !r.after?.movieId || r.after.movieId === mid).slice(-8),
        raw: manifests.get(mid) || null, player: playerSnapshot(mid),
        merged: Array.isArray(cached?.availableTracks) ? cached.availableTracks.slice(0, 100).map(t => ({
          language: language(t.bcp47 || t.language), urls: Array.isArray(t.urls) ? Math.min(t.urls.length, 100) : 0,
          tokens: Array.isArray(t.identityTokens) ? t.identityTokens.filter(t => /^t\d+$/.test(t)).slice(0, 3) : [] })) : [] };
      window.dispatchEvent(new CustomEvent('ottsub_local_acquisition_data', {detail: stringify(detail)}));
    } catch (_) {}
  });
})();
