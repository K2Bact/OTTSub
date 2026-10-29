// ISOLATED observations and bounded read-only bridge. No playback commands or text logging.
(() => {
  'use strict';
  const PLAYER = '[data-uia="player"], [data-uia="video-player"], .watch-video--player-view, .nf-player-container';
  const AD = 'span[class*="mmvz9h"]';
  const PAUSE_AD = '[data-uia="pause-ad-title-display"], [data-uia="pause-ad-expand-button"]';
  const OWN = '#ottsub-container, #ottsub-hud, #ottsub-ad-observer';
  const NATIVE = '.player-timedtext, [data-uia="player-timedtext"], [data-uia="player-subtitle-text"]';
  function sessionObservation(data) {
    const value = data.observation;
    const raw = n => n === null || typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1e12;
    if (!value || !['ok', 'unavailable', 'ambiguous'].includes(value.status)) return null;
    if (value.status !== 'ok') return value.session === null && value.playback === null && value.open === null && value.track === null
      ? { status: value.status, session: null, playback: null, open: null, track: null } : null;
    if (typeof value.session !== 'string' || !/^s\d{1,12}$/.test(value.session) || data.sessions.length > 1
      || data.sessions.length === 1 && data.sessions[0].id !== value.session) return null;
    const p = value.playback, o = value.open, t = value.track;
    if (p !== null && (!p || !raw(p.raw) || !['undefined', 'null', 'true', 'false', 'object', 'other'].includes(p.adValue))) return null;
    if (!o || !['ok', 'unavailable', 'missing', 'ambiguous'].includes(o.status) || !raw(o.raw)
      || !['start', 'end', 'undefined', 'null', 'other', 'unavailable'].includes(o.adState)
      || o.status !== 'ok' && (o.raw !== null || o.adState !== 'unavailable')) return null;
    if (t !== null && (!t || !['selected', 'off'].includes(t.status)
      || t.id !== null && (typeof t.id !== 'string' || !/^t\d{1,12}$/.test(t.id))
      || t.language !== null && (typeof t.language !== 'string' || t.language.length > 64 || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(t.language))
      || !['subtitles', 'closedcaptions', 'assistive', 'sdh', 'forced_narrative', 'unknown'].includes(t.kind))) return null;
    // Reconstruct the allowlisted fields, never retain arbitrary page-provided data.
    return { status: value.status, session: value.session,
      playback: p === null ? null : { raw: p.raw, adValue: p.adValue },
      open: { status: o.status, raw: o.raw, adState: o.adState },
      track: t === null ? null : { status: t.status, id: t.id, language: t.language, kind: t.kind } };
  }
  function plainText(node) {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1 && node.nodeType !== 11) return '';
    if (node.nodeName === 'BR') return ' ';
    const text = Array.from(node.childNodes).map(plainText).join('');
    return ['DIV', 'P'].includes(node.nodeName) ? ` ${text} ` : text;
  }
  function nativeText(root) {
    const nodes = Array.from(root.querySelectorAll(NATIVE)).filter(el => !el.closest(OWN));
    return nodes.filter(el => !nodes.some(parent => parent !== el && parent.contains(el))).filter(el => {
      // OTTSub itself hides native captions via visibility/opacity; keep reading their
      // DOM updates while ignoring only that presentation rule, not display:none.
      for (let node = el; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (node.hidden || node.getAttribute('aria-hidden') === 'true' || style.display === 'none') return false;
        if (!document.body?.classList.contains('ottsub-active') && !document.body?.classList.contains('ottsub-recovery-native-hidden')
          && (style.visibility === 'hidden' || Number(style.opacity) === 0)) return false;
      }
      return true;
    }).map(plainText).join(' ').slice(0, 8000);
  }
  function visible(el) {
    if (!el?.isConnected || !el.getClientRects().length) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    for (let node = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (node.hidden || node.getAttribute('aria-hidden') === 'true' || style.display === 'none'
        || style.visibility === 'hidden' || style.visibility === 'collapse' || Number(style.opacity) === 0) return false;
    }
    return true;
  }
  function read() {
    try {
      const videos = Array.from(document.querySelectorAll('video')).filter(v => v.readyState >= 1 && visible(v) && v.closest(PLAYER));
      if (videos.length !== 1) return { video: null, root: null, adSignal: 'unknown', pauseAd: null };
      const video = videos[0], root = video.closest(PLAYER);
      const candidates = Array.from(root.querySelectorAll(AD)).filter(visible);
      const present = candidates.some(el => /^(?:\d{1,3}|\d{1,2}:[0-5]\d)$/.test(el.textContent.trim()));
      return { video, root, mediaTime: video.currentTime, rate: video.playbackRate, paused: video.paused,
        readyState: video.readyState, seeking: video.seeking, nativeText: nativeText(root),
        adSignal: present ? 'present' : candidates.length ? 'uncertain' : 'absent',
        pauseAd: Array.from(root.querySelectorAll(PAUSE_AD)).some(visible) };
    } catch (_) { return { video: null, root: null, adSignal: 'unknown', pauseAd: null }; }
  }
  class NetflixPlaybackAdapter {
    constructor(onSample) {
      this.onSample = onSample;
      this.running = false;
      this.timer = null;
      this.observer = null;
      this.root = null;
      this.lastAt = -Infinity;
      this.requestId = 0; this.pending = null; this.bridge = null; this.owner = null; this.sessionObservation = null;
      this.sessionAdRequired = false; this.sessionResume = null;
      this.lastRequestAt = -Infinity;
      this.receive = event => this.receiveBridge(event);
    }
    static read() { return read(); }
    static cueText(text) {
      const template = document.createElement('template');
      template.innerHTML = String(text || '');
      return plainText(template.content);
    }
    setOwner(movieId, episodeGeneration) {
      this.owner = { movieId, episodeGeneration };
      this.episodeMismatch = false;
      this.sessionAdRequired = false;
      this.invalidateClock();
    }
    invalidateClock() {
      this.pending = null; this.bridge = null; this.sessionObservation = null; this.lastRequestAt = -Infinity;
      // Seek/video changes invalidate progress, but cannot erase an observed ad.
      this.sessionResume = null;
    }
    applySessionSignal(sample, now) {
      const dom = sample.adSignal, o = this.sessionObservation;
      let signal = 'unknown', reason = 'unavailable';
      const fresh = o?.status === 'ok' && o.video === sample.video && sample.video
        && now >= o.at && now - o.at < 1000;
      if (fresh) {
        const p = o.playback, open = o.open?.status === 'ok' ? o.open : null;
        if (p?.adValue === 'object' || p?.adValue === 'true' || open?.adState === 'start') {
          this.sessionAdRequired = true; this.sessionResume = null;
          signal = 'present'; reason = 'session-ad';
        } else if (this.sessionAdRequired) {
          // Missing/end/other alone is never an exit. Observe two forward changes
          // in one session's raw clock, then still require separate clock
          // verification. Raw units are deliberately not interpreted here.
          const source = Number.isFinite(p?.raw) ? 'playback' : Number.isFinite(open?.raw) ? 'open' : null;
          const raw = source === 'playback' ? p.raw : source === 'open' ? open.raw : null;
          const usable = source && (!p || ['undefined', 'null', 'false'].includes(p.adValue))
            && dom === 'absent' && !sample.seeking && !sample.pauseAd && sample.readyState >= 2;
          if (!usable) { this.sessionResume = null; reason = 'exit-unconfirmed'; }
          else {
            let r = this.sessionResume;
            if (!r || r.session !== o.session || r.video !== sample.video || r.source !== source
              || o.at < r.at || o.at - r.at >= 1000 || raw < r.raw || sample.rate !== r.rate) {
              r = this.sessionResume = { session: o.session, video: sample.video, source, raw, at: o.at,
                rate: sample.rate, advances: 0, confirmed: false };
            } else if (o.at > r.at) {
              if (sample.paused && !r.confirmed) r.advances = 0;
              else if (!sample.paused && raw > r.raw) r.advances++;
              r.raw = raw; r.at = o.at;
            }
            if (sample.paused && !r.confirmed) r.advances = 0;
            if (r.advances >= 2) r.confirmed = true;
            signal = r.confirmed ? 'absent' : 'unknown';
            reason = r.confirmed ? 'session-progress' : 'awaiting-session-progress';
          }
        } else reason = 'no-session-ad-history';
      } else this.sessionResume = null;
      sample.domAdSignal = dom;
      sample.sessionAdSignal = signal;
      sample.sessionAdReason = reason;
      sample.sessionAdRequired = this.sessionAdRequired;
      sample.adSignal = dom === 'present' || signal === 'present' ? 'present'
        : this.sessionAdRequired && signal !== 'absent' ? 'unknown' : dom;
      // A DOM ad or uncertainty also breaks a partially observed session exit.
      if (dom !== 'absent') this.sessionResume = null;
      return sample;
    }
    receiveBridge(event) {
      const pending = this.pending, now = performance.now();
      if (!pending || typeof event.detail !== 'string' || event.detail.length > 16000 || now - pending.at >= 1000) return;
      let data;
      try { data = JSON.parse(event.detail); } catch (_) { return; }
      if (data?.version !== 1 || data.requestId !== pending.requestId || data.movieId !== this.owner?.movieId
        || data.episodeGeneration !== this.owner?.episodeGeneration || location.pathname.match(/^\/watch\/(\d+)/)?.[1] !== data.movieId
        || !Array.isArray(data.sessions) || data.sessions.length > 8 || !Array.isArray(data.videos) || data.videos.length > 8) return;
      const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1e12;
      if (!['ok', 'unavailable'].includes(data.status)
        || data.ownerState !== undefined && !['matched', 'mismatch', 'unknown', 'ambiguous'].includes(data.ownerState)
        || data.sessions.some(s => typeof s?.id !== 'string' || !/^s\d{1,12}$/.test(s.id) || !finite(s.raw))
        || data.videos.some(v => typeof v?.id !== 'string' || !/^v\d{1,12}$/.test(v.id) || !finite(v.time))) return;
      this.pending = null;
      this.bridge = null;
      this.sessionObservation = null;
      const video = pending.video, id = video?.getAttribute('data-ottsub-clock-video');
      const matches = data.videos.filter(v => v.id === id);
      if (matches.length !== 1 || !video?.isConnected
        || document.querySelectorAll(`[data-ottsub-clock-video="${id}"]`).length !== 1) return;
      if (data.ownerState === 'mismatch' || data.ownerState === 'ambiguous') this.episodeMismatch = true;
      else if (data.ownerState === 'matched') this.episodeMismatch = false;
      const observation = sessionObservation(data);
      if (observation) this.sessionObservation = { ...observation, at: pending.at, videoTime: matches[0].time, video };
      if (data.status !== 'ok' || data.sessions.length !== 1) return;
      this.bridge = { session: data.sessions[0].id, raw: data.sessions[0].raw, videoTime: matches[0].time, at: pending.at, video };
    }
    requestClock(video, now) {
      if (!this.owner?.movieId || !video) return;
      if (this.pending && now - this.pending.at < 1000) return;
      if (now - this.lastRequestAt < 200) return;
      this.pending = { ...this.owner, version: 1, requestId: ++this.requestId, video, at: now };
      this.lastRequestAt = now;
      window.dispatchEvent(new CustomEvent('ottsub_clock_request', { detail: JSON.stringify({ ...this.owner, version: 1, requestId: this.requestId }) }));
    }
    start() {
      if (this.running) return;
      this.running = true;
      window.addEventListener('ottsub_clock_response', this.receive);
      this.sampleNow();
    }
    sampleNow() {
      if (!this.running) return;
      if (this.timer !== null) clearTimeout(this.timer);
      this.timer = null;
      this.lastAt = performance.now();
      const sample = read();
      this.requestClock(sample.video, this.lastAt);
      sample.episodeMismatch = this.episodeMismatch === true;
      sample.player = this.bridge?.video === sample.video && this.lastAt - this.bridge.at < 1000 ? this.bridge : null;
      const o = this.sessionObservation;
      sample.session = o?.status === 'ok' && o.video === sample.video && this.lastAt >= o.at && this.lastAt - o.at < 1000 ? o : null;
      sample.nativeTrack = sample.session?.track || null;
      this.applySessionSignal(sample, this.lastAt);
      if (sample.root !== this.root) {
        this.observer?.disconnect();
        this.observer = null;
        this.root = sample.root;
        if (this.root) {
          this.observer = new MutationObserver(records => {
            const external = records.some(record => {
              const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
              if (target?.closest(OWN)) return false;
              if (record.type === 'childList') {
                return [...record.addedNodes, ...record.removedNodes].some(node =>
                  !(node.nodeType === 1 && node.matches(OWN)));
              }
              return true;
            });
            if (external) this.schedule(Math.max(0, 50 - (performance.now() - this.lastAt)));
          });
          this.observer.observe(this.root, { subtree: true, childList: true, characterData: true, attributes: true,
            attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'] });
        }
      }
      this.onSample(sample, this.lastAt);
      // A native onset needs observations <=250ms apart. Polling at that exact
      // ceiling loses valid onsets after quiet DOM intervals to ordinary timer
      // overhead. Leave headroom; genuinely late samples still fail closed.
      if (this.running) this.schedule(200);
    }
    schedule(delay) {
      if (!this.running) return;
      // One timer, replaced only by an earlier observation deadline.
      const due = performance.now() + delay;
      if (this.timer !== null && this.due <= due) return;
      if (this.timer !== null) clearTimeout(this.timer);
      this.due = due;
      this.timer = setTimeout(() => { this.timer = null; this.sampleNow(); }, delay);
    }
    stop() {
      this.running = false;
      window.removeEventListener('ottsub_clock_response', this.receive);
      this.invalidateClock();
      if (this.timer !== null) clearTimeout(this.timer);
      this.timer = null;
      this.observer?.disconnect();
      this.observer = null;
      this.root = null;
    }
  }
  window.OTTSubNetflixPlaybackAdapter = NetflixPlaybackAdapter;
})();
