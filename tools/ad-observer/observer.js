// Temporary diagnostic extension; deliberately separate from the OTTSub product.
(() => {
  'use strict';
  if (document.getElementById('ottsub-ad-observer')) return;
  const VERSION = '0.1.0', INTERVAL = 500, MAX_MS = 15 * 60 * 1000, MAX_ROWS = 12000;
  const events = ['play', 'pause', 'seeking', 'seeked', 'loadedmetadata', 'emptied', 'ended', 'waiting', 'playing', 'ratechange'];
  const reads = ['getMovieId', 'getCurrentTime', 'getDuration', 'isPaused'];
  const now = () => performance.now();
  const finite = n => typeof n === 'number' && Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null;
  const movie = value => /^\d{1,20}$/.test(String(value)) ? String(value) : null;
  const watchId = () => movie(location.pathname.match(/^\/watch\/(\d+)/)?.[1]);
  let running = false, timer = null, began = 0, startedAt = null, endedReason = null, stoppedAtMs = null;
  let rows = [], bindings = new Map(), videoIds = new WeakMap(), sessionIds = new Map(), sourceIds = new Map();
  let nextVideo = 0, lastDom = '', lastPlayerShape = '', overflow = false;
  const alias = (map, key, prefix) => {
    if (key == null || key === '') return null;
    if (!map.has(key)) {
      if (map.size >= 256) return prefix + '-limit';
      map.set(key, prefix + (map.size + 1));
    }
    return map.get(key);
  };
  const safeToken = value => typeof value === 'string' && /^[a-zA-Z][\w -]{0,95}$/.test(value) ? value : null;
  const adToken = /(?:^|[-_\s])(?:ad|ads|advert|advertisement|adbreak)(?:$|[-_\s])|^ad[A-Z]/;
  const host = document.createElement('div'); host.id = 'ottsub-ad-observer';
  host.style.cssText = 'position:fixed;right:12px;top:12px;z-index:2147483647;';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = ':host{font:13px/1.5 system-ui;color:#fff}section{width:285px;background:#18212f;border:1px solid #8a9ab0;border-radius:8px;padding:10px}button{font:inherit;margin:3px;padding:5px 8px;border:1px solid #8090a0;border-radius:4px;background:#fff;color:#111;cursor:pointer}button:disabled{opacity:.4;cursor:default}p{margin:4px 0}small{color:#c5d0df}';
  shadow.append(style);
  const panel = document.createElement('section'); panel.setAttribute('aria-label', 'OTTSub 광고 관찰'); shadow.append(panel);
  const title = document.createElement('strong'); title.textContent = 'OTTSub 광고 관찰 · 로컬 기록'; panel.append(title);
  const status = document.createElement('p'); status.setAttribute('role', 'status'); panel.append(status);
  const buttons = {};
  function button(key, label, fn) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
    b.addEventListener('click', fn); buttons[key] = b; panel.append(b);
  }
  // Keep clicks/keys on the panel from reaching player controls, without cancelling button defaults.
  for (const event of ['click', 'dblclick', 'pointerdown', 'pointerup', 'keydown', 'keyup']) host.addEventListener(event, e => e.stopPropagation());
  const hint = document.createElement('p'); const small = document.createElement('small');
  small.textContent = '광고가 보이면 표시 버튼을 눌러줘. 최대 15분. 새로고침 전에 저장.'; hint.append(small);
  function update() {
    const reason = { user: '직접 정지', save: '저장', 'row-limit': '기록 용량 도달', '15-minute-limit': '15분 경과', 'left-watch-page': '재생 화면 이탈', pagehide: '페이지 종료' }[endedReason] || '';
    status.textContent = running ? `기록 중 ${Math.floor((now() - began) / 1000)}초 · ${rows.length}건` : rows.length ? `기록 정지 · ${rows.length}건 · 저장 가능 (${reason})` : '대기 · 기록 시작을 눌러줘';
    buttons.start.disabled = running || rows.length > 0;
    buttons.stop.disabled = !running;
    for (const key of ['content', 'ad', 'next', 'return']) buttons[key].disabled = !running;
    buttons.save.disabled = rows.length === 0;
    buttons.reset.disabled = running || rows.length === 0;
  }
  function record(type, data = {}) {
    if (!running) return;
    if (rows.length >= MAX_ROWS) { overflow = true; stop('row-limit'); return; }
    rows.push({ t: finite(now() - began), type, ...data });
  }
  function visible(el) {
    if (!el.isConnected || !el.getClientRects().length) return false;
    const css = getComputedStyle(el), rect = el.getBoundingClientRect();
    return css.display !== 'none' && css.visibility !== 'hidden' && css.opacity !== '0' && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
  }
  function domCandidates() {
    // Discovery hints only, never an ad detector. No body text, titles or subtitle text collected.
    const found = [], nodes = document.querySelectorAll('[data-uia], [class*="ad-"], [class*="ads-"], [class*="advert"], [class*="adBreak"]');
    for (const el of Array.from(nodes).slice(0, 1500)) {
      const uia = safeToken(el.getAttribute('data-uia'));
      const classes = Array.from(el.classList).filter(c => safeToken(c) && adToken.test(c)).slice(0, 6);
      if (!(uia && adToken.test(uia)) && !classes.length) continue;
      found.push({ tag: el.tagName.toLowerCase(), uia, classes, visible: visible(el) });
      if (found.length >= 40) break;
    }
    return { candidates: found, scanned: Math.min(nodes.length, 1500), truncated: nodes.length > 1500 || found.length >= 40 };
  }
  function methodNames(player) {
    const names = new Set();
    for (let p = player, depth = 0; p && depth < 3; p = Object.getPrototypeOf(p), depth++) {
      for (const key of Object.getOwnPropertyNames(p).slice(0, 300)) {
        const d = Object.getOwnPropertyDescriptor(p, key);
        if (typeof d?.value === 'function' && /ad|time|duration|pause|movie|state/i.test(key) && safeToken(key)) names.add(key);
      }
    }
    return [...names].sort().slice(0, 80); // Do not call unknown methods/getters.
  }
  function players() {
    try {
      const api = window.netflix?.appContext?.state?.playerApp?.getAPI()?.videoPlayer;
      if (!api || typeof api.getAllPlayerSessionIds !== 'function' || typeof api.getVideoPlayerBySessionId !== 'function') return { status: 'unavailable', sessions: [] };
      const ids = api.getAllPlayerSessionIds();
      if (!Array.isArray(ids)) return { status: 'unsupported-session-list', sessions: [] };
      const sessions = ids.slice(0, 8).map(id => {
        const row = { id: alias(sessionIds, id, 's'), values: {}, methods: [] };
        try {
          const player = api.getVideoPlayerBySessionId(id); row.methods = methodNames(player);
          for (const key of reads) {
            // Only known read candidates. Raw clock units remain explicitly unknown.
            if (typeof player?.[key] !== 'function') { row.values[key] = { status: 'missing' }; continue; }
            try {
              const value = player[key]();
              row.values[key] = { status: 'ok', value: key === 'getMovieId' ? movie(value) : typeof value === 'boolean' ? value : finite(value) };
            } catch { row.values[key] = { status: 'error' }; }
          }
        } catch { row.error = 'player-read-failed'; }
        return row;
      });
      return { status: 'ok', truncated: ids.length > 8, sessions };
    } catch { return { status: 'error', sessions: [] }; }
  }
  function unbind(v, b) {
    for (const [name, fn] of b.listeners) v.removeEventListener(name, fn);
    if (b.frame != null && typeof v.cancelVideoFrameCallback === 'function') v.cancelVideoFrameCallback(b.frame);
    bindings.delete(v);
  }
  function videos() {
    const list = Array.from(document.querySelectorAll('video')).slice(0, 8);
    for (const [v, b] of bindings) if (!list.includes(v)) { record('video-detached', { id: b.id }); unbind(v, b); }
    return list.flatMap(v => {
      if (!running) return [];
      let b = bindings.get(v);
      if (!b) {
        if (!videoIds.has(v)) videoIds.set(v, 'v' + (++nextVideo));
        b = { id: videoIds.get(v), frame: null, latestFrame: null, listeners: [] }; bindings.set(v, b);
        for (const name of events) {
          const fn = () => record('video-event', { id: b.id, event: name, currentTime: finite(v.currentTime) });
          v.addEventListener(name, fn); b.listeners.push([name, fn]);
        }
        record('video-attached', { id: b.id });
      }
      if (!running) return [];
      if (b.frame == null && typeof v.requestVideoFrameCallback === 'function') {
        b.frame = v.requestVideoFrameCallback((_, meta) => {
          b.frame = null;
          if (running && bindings.get(v) === b) b.latestFrame = { at: finite(now() - began), mediaTime: finite(meta.mediaTime), presentedFrames: finite(meta.presentedFrames) };
        });
      }
      return { id: b.id, source: alias(sourceIds, v.currentSrc, 'src'), currentTime: finite(v.currentTime), duration: finite(v.duration), paused: v.paused, ended: v.ended, seeking: v.seeking, readyState: v.readyState, playbackRate: finite(v.playbackRate), visible: visible(v), frame: b.latestFrame };
    });
  }
  function sample() {
    if (!running) return;
    if (now() - began >= MAX_MS) { stop('15-minute-limit'); return; }
    if (!watchId()) { stop('left-watch-page'); return; }
    try {
      const playerData = players();
      const shape = playerData.sessions.map(s => ({ id: s.id, methods: s.methods }));
      const shapeKey = JSON.stringify(shape);
      if (shapeKey !== lastPlayerShape) { record('player-methods', { sessions: shape }); lastPlayerShape = shapeKey; }
      for (const s of playerData.sessions) delete s.methods;
      const dom = domCandidates(), domKey = JSON.stringify(dom);
      if (domKey !== lastDom) { record('dom-candidates', dom); lastDom = domKey; }
      record('sample', { movieId: watchId(), hidden: document.hidden, players: playerData, videos: videos(), ottsubPresent: !!document.getElementById('ottsub-container') });
    } catch { record('sample-error', { error: 'observation-failed' }); }
    update();
  }
  function stop(reason = 'user') {
    if (!running) return;
    running = false; endedReason = reason; stoppedAtMs = finite(now() - began); clearInterval(timer); timer = null;
    for (const [v, b] of bindings) unbind(v, b);
    window.removeEventListener('ottsub_manifest_data', manifestEvent);
    document.removeEventListener('visibilitychange', visibilityEvent);
    update();
  }
  function manifestEvent(e) {
    const d = e.detail;
    if (d?.source === 'ottsub_injected') record('manifest-observed', { movieId: movie(d.movieId) });
  }
  function visibilityEvent() { record('visibility', { hidden: document.hidden }); }
  function mark(label) { record('mark', { label }); sample(); }
  function start() {
    if (running || rows.length) return;
    if (!watchId()) { status.textContent = 'Netflix 작품 재생 화면에서 시작해줘.'; return; }
    began = now(); startedAt = new Date().toISOString(); running = true; endedReason = null; stoppedAtMs = null;
    record('start'); window.addEventListener('ottsub_manifest_data', manifestEvent);
    document.addEventListener('visibilitychange', visibilityEvent);
    timer = setInterval(sample, INTERVAL); sample();
  }
  function save() {
    stop('save');
    const data = { schema: 'ottsub-ad-observation-v1', observerVersion: VERSION, startedAt, endedReason, stoppedAtMs, overflow,
      intervalMs: INTERVAL, clockUnits: { t: 'milliseconds since start', video: 'seconds', player: 'unknown; verify from deltas' },
      limitations: ['User marks are delayed observations, not exact boundaries.', 'DOM candidates are hints, not ad labels.', 'No matching of sessions to videos is assumed.', 'Background throttling and missing frame callbacks are possible.'], rows };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'ottsub-ad-observation-' + startedAt.replace(/[:.]/g, '-') + '.json';
    shadow.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  button('start', '기록 시작', start);
  button('content', '본편 확인', () => mark('content'));
  button('ad', '광고 시작', () => mark('ad-start'));
  button('next', '다음 광고', () => mark('next-ad'));
  button('return', '본편 복귀', () => mark('content-return'));
  button('stop', '정지', () => stop());
  button('save', 'JSON 저장', save);
  button('reset', '기록 비우기', () => {
    if (!confirm('저장하지 않은 기록도 지워져. 기록을 비울까?')) return;
    rows = []; endedReason = null; overflow = false; lastDom = lastPlayerShape = '';
    videoIds = new WeakMap(); sessionIds = new Map(); sourceIds = new Map(); nextVideo = 0; update();
  });
  panel.append(hint); document.documentElement.append(host); update();
  window.addEventListener('pagehide', () => stop('pagehide'));
})();
