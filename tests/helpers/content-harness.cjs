// Runs production modules, with only browser/Chrome I/O replaced by controlled fixtures.
// OTTSub_TEST_SOURCE can point at a saved pre-repair tree to verify regression coverage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const sourceRoot = process.env.OTTSub_TEST_SOURCE || root;
const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

function harness({ local = {}, sync = {}, deferSettings = false, deferredFetch = false, beforeContent = null } = {}) {
  const window = new EventTarget(), document = new EventTarget();
  const timers = new Map(), intervals = [], requests = [], writes = [], reads = [];
  const storageListeners = new Set(), messageListeners = [], hydration = [], storageErrors = [];
  let nextTimer = 0, video;
  const renderer = { container: null, renders: [], destroyCount: 0,
    ensureMounted() { this.container = { isConnected: true }; },
    clear() { this.renders.length = 0; },
    destroy() { this.container = null; this.destroyCount++; this.clear(); },
    renderDual(primary, secondary) { this.renders.push({ primary, secondary }); }
  };
  for (const method of ['setLockPosition', 'setPrimaryLineSpacing', 'setSecondaryLineSpacing',
    'setPrimaryOffsetY', 'setSecondaryOffsetY', 'setPrimaryScale', 'setSecondaryScale',
    'setPrimaryColor', 'setSecondaryColor', 'setPrimaryBgBoxEnabled', 'setSecondaryBgBoxEnabled',
    'setBgBoxEnabled', 'setBlurTarget', 'setBlurMode', 'setHoverPause', 'setCustomPosition',
    'resetCustomPosition', 'invalidateStyleCache']) renderer[method] = (...args) => { renderer[method + 'Value'] = args; };
  const makeVideo = (playing = false) => {
    const v = new EventTarget();
    Object.assign(v, { paused: !playing, ended: false, readyState: 4, currentTime: 10, playbackRate: 1,
      isConnected: true, frames: new Map(), cancelled: [], nextFrame: 0,
      requestVideoFrameCallback(fn) { this.frames.set(++this.nextFrame, fn); return this.nextFrame; },
      cancelVideoFrameCallback(id) { this.cancelled.push(id); this.frames.delete(id); }
    });
    return v;
  };
  video = makeVideo();
  Object.assign(document, { hidden: false, visibilityState: 'visible', documentElement: { dataset: {} },
    body: { classList: { remove() {}, contains() { return false; } } }, querySelectorAll: () => video ? [video] : [], querySelector: () => video });
  const emitStorage = (changes, area = 'local') => { for (const fn of [...storageListeners]) fn(changes, area); };
  const area = (name, data) => ({
    get(keys, cb) {
      if (deferSettings) reads.push({ name, cb, data });
      else { try { cb(data); } catch (err) { storageErrors.push(err.message); } }
    },
    set(value, cb) { writes.push({ area: name, value }); cb?.(); }
  });
  const chrome = { runtime: { id: 'test', onMessage: { addListener: fn => messageListeners.push(fn) } },
    storage: { local: area('local', local), sync: area('sync', sync),
      onChanged: { addListener: fn => storageListeners.add(fn), removeListener: fn => storageListeners.delete(fn) } } };
  Object.assign(window, { document, chrome, location: { pathname: '/watch/100', href: 'https://www.netflix.com/watch/100' },
    OTTSubRenderer: renderer, OTTSubHUD: { show() {}, destroy() {} },
    OTTSubParser: { parse: text => [{ id: 1, begin: 0, end: 60, text, isTop: false }] },
    console, URL, AbortController, AbortSignal, CustomEvent, setTimeout: (fn, ms) => { timers.set(++nextTimer, { fn, ms }); return nextTimer; },
    clearTimeout: id => timers.delete(id), setInterval: fn => intervals.push(fn),
    requestAnimationFrame: fn => { timers.set(++nextTimer, { fn, ms: 16 }); return nextTimer; },
    cancelAnimationFrame: id => timers.delete(id),
    fetch: (url, options = {}) => new Promise(resolve => {
      const request = { url, signal: options.signal, resolve: (text = url, status = 200) => resolve({ url, ok: status === 200, status, text: async () => text }) };
      requests.push(request);
      if (!deferredFetch) request.resolve();
    })
  });
  window.window = window;
  // DOM observation is I/O in this Node harness; the real adapter has Chromium coverage.
  window.performance = performance;
  window.OTTSubNetflixPlaybackAdapter = class {
    constructor(onSample) { this.onSample = onSample; this.running = false; }
    static read() { return { video, adSignal: video ? 'absent' : 'unknown', pauseAd: false }; }
    static cueText(text) { return text; }
    setOwner() {}
    invalidateClock() {}
    start() { this.running = true; this.sampleNow(); }
    sampleNow() { if (this.running) this.onSample(window.OTTSubNetflixPlaybackAdapter.read(), performance.now()); }
    stop() { this.running = false; }
  };
  const ctx = vm.createContext(window);
  const load = file => vm.runInContext(fs.readFileSync(path.join(fs.existsSync(path.join(sourceRoot, file)) ? sourceRoot : root, file), 'utf8'), ctx, { filename: file });
  for (const file of ['src/core/track-languages.js', 'src/sync-engine.js', 'src/core/storage-guard.js', 'src/network/track-fetcher.js', 'src/network/track-recovery.js', 'src/layout/dual-placement.js', 'src/video/playback-gate.js', 'src/video/playback-clock.js', 'src/video/native-reference.js']) load(file);
  beforeContent?.({ window, document, load });
  load('src/content.js');
  window.addEventListener('ottsub_request_load_track', e => hydration.push(e.detail));
  const emitManifest = (mid, extras = {}) => window.dispatchEvent(new CustomEvent('ottsub_manifest_data', { detail: {
    source: 'ottsub_injected', movieId: String(mid), urls: [`https://cdn.nflxvideo.net/${mid}/en`],
    tracksByLang: { ko: [`https://cdn.nflxvideo.net/${mid}/ko`] }, availableTracks: [{ lang: `episode-${mid}` }], ...extras
  } }));
  const navigate = (mid, notify = true) => {
    window.location.pathname = mid ? `/watch/${mid}` : '/browse';
    if (notify) window.dispatchEvent(new CustomEvent('ottsub_nav_change'));
  };
  const send = (action, value, extra = {}) => { let result; messageListeners[0]({ action, value, ...extra }, { id: 'test' }, r => result = r); return result; };
  return { window, document, renderer, timers, requests, writes, reads, hydration, storageErrors, emitStorage, emitManifest, navigate, send,
    engine: window.OTTSubSyncEngine, tick: () => intervals.forEach(fn => fn()), makeVideo,
    get video() { return video; }, set video(v) { video = v; }, load };
}


module.exports = { harness, settle };
