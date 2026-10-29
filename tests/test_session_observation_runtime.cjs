const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');

function fixture() {
  let now = 100;
  const listeners = new Map(), attributes = new Map(), responses = [];
  const video = { currentTime: 42, isConnected: true,
    setAttribute: (key, value) => attributes.set(key, value), getAttribute: key => attributes.get(key) };
  const player = { getMovieId: () => 100, getCurrentTime: () => 42000,
    getTextTrack: () => ({ trackId: 'PRIVATE_TRACK_ID', bcp47: 'es-419', rawTrackType: 'closedcaptions', displayName: 'PRIVATE_TEXT' }),
    play() { throw Error('must not play'); }, pause() { throw Error('must not pause'); }, setTextTrack() { throw Error('must not change track'); } };
  const app = { videoPlayer: { getAllPlayerSessionIds: () => ['PRIVATE_SESSION_ID'], getVideoPlayerBySessionId: () => player },
    getPlaybackStateBySessionId: () => ({ currentTime: 12000 }),
    getOpenPlaybackSessions: () => [{ videoId: 100, currentTime: 12000, currentAdBreakState: 'end' }] };
  const window = { netflix: { appContext: { state: { playerApp: { getAPI: () => app } } } },
    addEventListener(type, fn) { const list = listeners.get(type) || []; list.push(fn); listeners.set(type, list); },
    removeEventListener(type, fn) { listeners.set(type, (listeners.get(type) || []).filter(f => f !== fn)); },
    dispatchEvent(event) {
      if (event.type === 'ottsub_clock_response') responses.push(JSON.parse(event.detail));
      for (const fn of listeners.get(event.type) || []) fn(event);
    } };
  const context = { window, location: { pathname: '/watch/100' }, performance: { now: () => now },
    document: { querySelectorAll: selector => selector === 'video' || selector.startsWith('[data-ottsub-clock-video=') ? [video] : [] },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }, clearTimeout };
  for (const name of ['netflix-playback-bridge.js', 'netflix-playback-adapter.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/video', name), 'utf8'), context);
  }
  const adapter = new window.OTTSubNetflixPlaybackAdapter(() => {});
  adapter.setOwner('100', 1);
  window.addEventListener('ottsub_clock_response', adapter.receive);
  const request = () => { now += 250; adapter.requestClock(video, now); return responses.at(-1); };
  return { app, player, window, adapter, video, responses, request, setNow: value => { now = value; } };
}

function signalFixture() {
  const f = fixture();
  let raw = 2151566, ad = 'start';
  f.app.getPlaybackStateBySessionId = () => ({ currentTime: raw, currentAdBreak: ad === 'start' ? {} : undefined });
  f.app.getOpenPlaybackSessions = () => [{ videoId: 100, currentTime: raw, currentAdBreakState: ad }];
  const sample = (options = {}) => f.adapter.applySessionSignal({ video: f.video, mediaTime: 10,
    adSignal: 'absent', readyState: 4, rate: 1, paused: false, ...options }, f.adapter.sessionObservation?.at ?? 0);
  const step = (time, state = 'other', options = {}) => { raw = time; ad = state; f.request(); return sample(options); };
  return { ...f, sample, step };
}

test('strict player owner mismatch latches across unavailable APIs and clears only on match or new owner', () => {
  const f = fixture(); assert.equal(f.request().ownerState, 'matched');
  f.player.getMovieId = () => 200;
  assert.equal(f.request().ownerState, 'mismatch'); assert.equal(f.adapter.episodeMismatch, true);
  f.adapter.invalidateClock(); assert.equal(f.adapter.episodeMismatch, true);
  f.player.getMovieId = () => undefined;
  assert.equal(f.request().ownerState, 'unknown'); assert.equal(f.adapter.episodeMismatch, true);
  f.player.getMovieId = () => 100;
  assert.equal(f.request().ownerState, 'matched'); assert.equal(f.adapter.episodeMismatch, false);
  f.player.getMovieId = () => 200; f.request();
  f.adapter.setOwner('200', 2); assert.equal(f.adapter.episodeMismatch, false);
});

test('session-only ad starts before countdown DOM; either API can assert it', () => {
  const f = signalFixture();
  assert.equal(f.step(2151566, 'start').adSignal, 'present');
  assert.equal(f.sample().domAdSignal, 'absent');
  delete f.app.getPlaybackStateBySessionId;
  assert.equal(f.step(2151566, 'start').adSignal, 'present');
  f.app.getPlaybackStateBySessionId = () => ({ currentTime: 1, currentAdBreak: true });
  f.app.getOpenPlaybackSessions = () => [];
  f.request(); assert.equal(f.sample().adSignal, 'present');
});

test('quiet-DOM polling leaves onset headroom under ordinary 2ms timer overhead', () => {
  const f = fixture();
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/video/playback-clock.js'), 'utf8'), { window: f.window });
  const clock = new f.window.OTTSubPlaybackClock();
  clock.setTracks([{ key: 'primary', cues: [
    { begin: 0.4, end: 0.8, text: 'First' }, { begin: 1.4, end: 1.8, text: 'Second' }
  ] }]);
  let now = 0, delay, result;
  // Exercise the adapter's real sample->schedule cadence, without DOM mutation
  // wakeups. Clock inputs are controlled here; the media suite covers real DOM.
  f.adapter.running = true;
  f.adapter.schedule = ms => { delay = ms; };
  f.adapter.onSample = (_, at) => {
    const time = at / 1000;
    result = clock.observe({ video: f.video, mediaTime: time, rate: 1, paused: false, readyState: 4,
      nativeText: time >= 0.4 && time < 0.8 ? 'First' : time >= 1.4 && time < 1.8 ? 'Second' : '' }, at);
  };
  for (let i = 0; i < 10; i++) {
    f.setNow(now); f.adapter.sampleNow();
    assert(Number.isFinite(delay)); now += delay + 2;
  }
  assert.equal(result?.source, 'video', 'Normal polling must permit two distinct native onsets');
});

test('ad exit needs distinct forward session changes; missing/end/other and repeated replies do not release', () => {
  const f = signalFixture(); f.step(2151566, 'start');
  for (const state of [undefined, 'end', 'other', 'other']) {
    assert.equal(f.step(2151566, state).adSignal, 'unknown');
  }
  assert.equal(f.step(2154026).adSignal, 'unknown');
  assert.equal(f.sample().adSignal, 'unknown'); // Same accepted response is not new evidence.
  assert.equal(f.step(2154026).adSignal, 'unknown');
  assert.equal(f.step(2155038).adSignal, 'absent');
  assert.equal(f.sample().sessionAdReason, 'session-progress');
});

test('consecutive ads, DOM conflicts and seeking discard partial exit evidence', () => {
  const f = signalFixture(); f.step(10, 'start');
  f.step(10); f.step(11);
  assert.equal(f.step(12, 'other', { adSignal: 'present' }).adSignal, 'present');
  assert.equal(f.step(13).adSignal, 'unknown');
  f.step(14);
  assert.equal(f.step(15, 'start').adSignal, 'present');
  f.step(15); f.step(16);
  assert.equal(f.step(17, 'other', { seeking: true }).adSignal, 'unknown');
  assert.equal(f.step(18).adSignal, 'unknown');
  f.step(19); assert.equal(f.step(20).adSignal, 'absent');
});

test('stale, future and lost session observations cannot end a known session ad', () => {
  const f = signalFixture(); f.step(10, 'start');
  f.step(10); f.step(11);
  const o = f.adapter.sessionObservation;
  for (const now of [o.at - 1, o.at + 1000]) {
    assert.equal(f.adapter.applySessionSignal({ video: f.video, adSignal: 'absent' }, now).adSignal, 'unknown');
  }
  f.adapter.sessionObservation = null;
  assert.equal(f.sample().adSignal, 'unknown');
  f.step(12); f.step(13); assert.equal(f.step(14).adSignal, 'absent');
});

test('session/video/source changes and backwards time restart exit evidence', () => {
  for (const change of ['session', 'video', 'source', 'backwards', 'rate']) {
    const f = signalFixture(); f.step(10, 'start'); f.step(10); f.step(11);
    if (change === 'session') f.app.videoPlayer.getAllPlayerSessionIds = () => ['new-session'];
    if (change === 'source') delete f.app.getPlaybackStateBySessionId;
    f.request();
    if (change === 'video') { f.adapter.sessionObservation.video = {}; }
    if (change === 'backwards') f.adapter.sessionObservation.playback.raw = 2;
    assert.equal(f.sample(change === 'rate' ? { rate: 2 } : {}).adSignal, 'unknown', change);
  }
});

test('clock invalidation and hidden-tab stop preserve ad latch; new episode clears ownership', () => {
  const f = signalFixture(); f.step(10, 'start');
  f.adapter.invalidateClock(); assert.equal(f.sample().adSignal, 'unknown');
  f.adapter.setOwner('200', 2); assert.equal(f.sample().adSignal, 'absent');
  f.adapter.setOwner('100', 3); f.step(10, 'start');
  f.adapter.stop(); assert.equal(f.adapter.sessionAdRequired, true);
  assert.equal(f.sample().adSignal, 'unknown');
});

test('ordinary playback without session APIs keeps DOM behavior; paused progress does not end an ad', () => {
  const f = signalFixture();
  assert.equal(f.sample().adSignal, 'absent');
  assert.equal(f.sample({ adSignal: 'uncertain' }).adSignal, 'uncertain');
  assert.equal(f.sample({ pauseAd: true }).pauseAd, true);
  f.step(10, 'start');
  f.step(10); f.step(11);
  assert.equal(f.step(12, 'other', { paused: true }).adSignal, 'unknown');
  assert.equal(f.step(13).adSignal, 'unknown');
  assert.equal(f.step(14).adSignal, 'absent');
});

test('observed session progress only allows recovery; it never verifies subtitle time', () => {
  const f = signalFixture();
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/video/playback-gate.js'), 'utf8'), { window: f.window });
  const gate = new f.window.OTTSubPlaybackGate(); gate.reset('100');
  let now = 0;
  const observe = s => gate.observe(s, now += 250);
  assert.equal(observe(f.step(10, 'start')).playbackState, 'AD');
  observe(f.step(10)); observe(f.step(11));
  assert.equal(observe(f.step(12)).playbackState, 'RECOVERING');
  for (let i = 13; i < 65; i++) assert.equal(observe(f.step(i)).displaySuppressed, true);
  assert.equal(gate.clockVerified, false);
  assert.equal(gate.status(now).playbackState, 'RECOVERY_DELAYED');
});

test('recorded last 15-second interval: session starts earlier than DOM; exit never opens unverified captions', () => {
  const f = signalFixture();
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/video/playback-gate.js'), 'utf8'), { window: f.window });
  const gate = new f.window.OTTSubPlaybackGate(); gate.reset('100');
  const trace = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/session-ad-last-15s.json'), 'utf8'));
  let firstAd, firstDomAd, recoveredAt, domEndedAt, started = false;
  for (const e of trace.events) {
    if (e.type === 'session') {
      f.adapter.sessionObservation = { ...e, video: f.video };
      continue;
    }
    if (e.ad === 'present') firstDomAd ??= e.at;
    else if (firstDomAd && e.ad === 'absent') domEndedAt ??= e.at;
    // Missing media state is intentionally fixed: this replay tests signal ordering,
    // not timing/seek inference or recovery from the original caption track.
    const s = f.adapter.applySessionSignal({ video: e.video ? f.video : null, adSignal: e.ad,
      pauseAd: e.pauseAd, mediaTime: e.media, readyState: 4, paused: false, rate: 1 }, e.at);
    const status = gate.observe(s, e.at);
    if (status.playbackState === 'AD') { firstAd ??= e.at; started = true; }
    if (started) assert.equal(status.displaySuppressed, true);
    if (started && status.playbackState === 'RECOVERING') recoveredAt ??= e.at;
  }
  assert(firstAd < firstDomAd, `${firstAd} vs ${firstDomAd}`);
  assert(firstDomAd - firstAd > 1000);
  assert(recoveredAt > domEndedAt && recoveredAt - domEndedAt < 5000);
  assert.equal(gate.clockVerified, false);
  assert.equal(gate.state, 'RECOVERY_DELAYED');
});

test('records separate raw clocks and track metadata without private IDs or display text', () => {
  const f = fixture(), r = f.request(), o = f.adapter.sessionObservation;
  assert.equal(f.adapter.bridge.raw, 42000);
  assert.equal(o.playback.raw, 12000); assert.equal(o.open.raw, 12000);
  assert.equal(o.playback.adValue, 'undefined'); assert.equal(o.open.adState, 'end');
  assert.equal(o.videoTime, 42); assert.equal(o.track.language, 'es-419');
  assert.equal(o.track.kind, 'closedcaptions'); assert.match(o.track.id, /^t\d+$/);
  assert(!JSON.stringify(r).includes('PRIVATE_'));
  const token = o.track.id; assert.equal(f.request().observation.track.id, token);
});

test('records before/during/after ad field shapes without interpreting missing as an end', () => {
  const f = fixture();
  for (const [value, expected] of [[undefined, 'undefined'], [null, 'null'], [false, 'false'], [true, 'true'], [{ url: 'PRIVATE_URL' }, 'object'], ['PRIVATE_STRING', 'other']]) {
    f.app.getPlaybackStateBySessionId = () => ({ currentTime: 12000, currentAdBreak: value });
    f.app.getOpenPlaybackSessions = () => [{ videoId: 100, currentTime: 12000, currentAdBreakState: 'start' }];
    const r = f.request(); assert.equal(r.observation.playback.adValue, expected);
    assert.equal(f.adapter.sessionObservation.open.adState, 'start');
    assert(!JSON.stringify(r).includes('PRIVATE_'));
  }
});

test('optional API failures leave the pre-existing player clock usable', () => {
  const f = fixture();
  delete f.app.getPlaybackStateBySessionId;
  f.app.getOpenPlaybackSessions = () => { throw Error('unavailable'); };
  f.player.getTextTrack = () => { throw Error('unavailable'); };
  f.request();
  assert.equal(f.adapter.bridge.raw, 42000);
  assert.equal(f.adapter.sessionObservation.playback, null);
  assert.equal(f.adapter.sessionObservation.open.status, 'unavailable');
  assert.equal(f.adapter.sessionObservation.track, null);
});

test('observation is retained when player.getCurrentTime fails, but no clock is selected', () => {
  const f = fixture(); f.player.getCurrentTime = () => { throw Error('unavailable'); };
  f.request(); assert.equal(f.adapter.bridge, null);
  assert.equal(f.adapter.sessionObservation.playback.raw, 12000);
});

test('current movie ownership excludes other players and open sessions', () => {
  const f = fixture();
  f.app.videoPlayer.getAllPlayerSessionIds = () => ['preview', 'current'];
  f.app.videoPlayer.getVideoPlayerBySessionId = id => id === 'current' ? f.player : { getMovieId: () => 999 };
  f.app.getPlaybackStateBySessionId = id => { assert.equal(id, 'current'); return { currentTime: 12000 }; };
  f.app.getOpenPlaybackSessions = () => [{ videoId: 999, currentTime: 999000, currentAdBreakState: 'start' }, { videoId: 100, currentTime: 12000 }];
  f.request(); assert.equal(f.adapter.sessionObservation.open.raw, 12000);
  f.app.videoPlayer.getVideoPlayerBySessionId = () => f.player;
  f.request(); assert.equal(f.adapter.bridge, null); assert.equal(f.adapter.sessionObservation.status, 'ambiguous');
});

test('open session duplicates, no match and excessive list length do not choose the first entry', () => {
  const f = fixture();
  for (const [list, expected] of [[[], 'missing'], [[{ videoId: 999 }], 'missing'], [[{ videoId: 100 }, { videoId: 100 }], 'ambiguous'], [Array(9).fill({ videoId: 100 }), 'ambiguous']]) {
    f.app.getOpenPlaybackSessions = () => list; f.request();
    assert.equal(f.adapter.sessionObservation.open.status, expected);
    assert.equal(f.adapter.sessionObservation.open.raw, null);
  }
});

test('alternate playerApp accessor works and selected/off track transitions are distinguishable', () => {
  const f = fixture(); f.window.netflix.appContext = { getPlayerApp: () => ({ getAPI: () => f.app }) };
  const first = f.request().observation.track.id;
  f.player.getTextTrack = () => ({ trackId: 'OTHER_PRIVATE_TRACK', bcp47: 'ko', isNoneTrack: true });
  f.request(); assert.equal(f.adapter.sessionObservation.track.status, 'off');
  assert.notEqual(f.adapter.sessionObservation.track.id, first);
  f.player.getTextTrack = () => null;
  f.request(); assert.equal(f.adapter.sessionObservation.track, null);
});

test('receiver rejects malformed extra observations without poisoning usable clock data', () => {
  const f = fixture(), r = f.request();
  for (const change of [{ session: 's999' }, { session: { toString: null, valueOf: null } }, { playback: { raw: -1, adValue: 'object' } },
    { track: { status: 'selected', id: 'PRIVATE_ID', language: 'ko', kind: 'subtitles' } },
    { open: { status: 'missing', raw: 12, adState: 'start' } }]) {
    f.adapter.pending = { requestId: r.requestId, video: f.video, at: 350 };
    f.adapter.receiveBridge({ detail: JSON.stringify({ ...r, observation: { ...r.observation, ...change } }) });
    assert.equal(f.adapter.sessionObservation, null); assert.equal(f.adapter.bridge.raw, 42000);
  }
  f.adapter.pending = { requestId: r.requestId, video: f.video, at: 350 };
  f.adapter.receiveBridge({ detail: JSON.stringify({ ...r, observation: { ...r.observation, extra: 'PRIVATE_DATA' } }) });
  assert(!JSON.stringify(f.adapter.sessionObservation).includes('PRIVATE_DATA'));
});

test('wrong owner, stale responses and invalidation cannot introduce a new observation', () => {
  const f = fixture(), r = f.request();
  for (const change of [{ requestId: 999 }, { movieId: '200' }, { episodeGeneration: 2 }]) {
    f.adapter.invalidateClock(); f.adapter.pending = { requestId: r.requestId, video: f.video, at: 350 };
    f.adapter.receiveBridge({ detail: JSON.stringify({ ...r, ...change }) });
    assert.equal(f.adapter.sessionObservation, null);
  }
  f.setNow(1500); f.adapter.receiveBridge({ detail: JSON.stringify(r) });
  assert.equal(f.adapter.sessionObservation, null);
  f.request(); assert(f.adapter.sessionObservation); f.adapter.stop();
  assert.equal(f.adapter.sessionObservation, null);
});
