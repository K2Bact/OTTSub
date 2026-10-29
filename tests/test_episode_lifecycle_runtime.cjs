const { test } = require('node:test');
const assert = require('node:assert/strict');
const { harness, settle } = require('./helpers/content-harness.cjs');

test('restores local settings over legacy sync without writing them back', async () => {
  const h = harness({ local: { ottsub_offset: 700, ottsub_primary_scale: 1.2 }, sync: { ottsub_offset: 100, ottsub_secondary_offset: -500, ottsub_lock_pos: true } });
  await settle();
  assert.deepEqual(h.storageErrors, []);
  assert.equal(h.engine.offsetMs, 700);
  assert.equal(h.send('getStatus').secondaryOffset, -500);
  assert.deepEqual(h.renderer.setPrimaryScaleValue, [1.2]);
  assert.deepEqual(h.renderer.setLockPositionValue, [true]);
  assert.equal(h.writes.length, 0);
});
test('settings changed during initial read win; style notifications do not echo writes', async () => {
  const h = harness({ local: { ottsub_primary_scale: 0.8 }, deferSettings: true });
  h.emitStorage({ ottsub_primary_scale: { newValue: 1.3 } });
  for (const read of h.reads) read.cb(read.data);
  await settle();
  assert.deepEqual(h.renderer.setPrimaryScaleValue, [1.3]);
  assert.equal(h.writes.length, 0);
});
test('invalid storage values are ignored and bounds are enforced', async () => {
  const h = harness({ local: { ottsub_dual_mode: 'false', ottsub_secondary_lang: {}, ottsub_primary_scale: Infinity, ottsub_offset: 100000 } });
  await settle();
  assert.equal(h.engine.offsetMs, 60000);
  h.emitStorage({ ottsub_secondary_lang: { newValue: {} } });
  h.emitManifest(100); await settle();
  assert(h.requests.some(r => r.url.endsWith('/ko')));
});
test('foreign prefetch stays cached without replacing current cues or languages', async () => {
  const h = harness(); await settle(); h.emitManifest(100); await settle();
  h.emitManifest(200); await settle();
  assert.equal(h.engine.getMovieId(), '100');
  assert.equal(h.requests.length, 2);
  assert.equal(h.send('getStatus').availableTracks[0].lang, 'episode-100');
  h.navigate(200); await settle();
  assert.equal(h.engine.getMovieId(), '200');
});
test('duplicate manifest notifications do not restart pending or completed downloads', async () => {
  const h = harness({ deferredFetch: true }); await settle();
  h.emitManifest(100); h.emitManifest(100);
  assert.equal(h.requests.length, 2);
  for (const r of h.requests) r.resolve(); await settle();
  h.emitManifest(100); await settle();
  assert.equal(h.requests.length, 2);
});
test('late previous-episode replies cannot populate new episode, even if fetch ignores cancellation', async () => {
  const h = harness({ deferredFetch: true }); await settle(); h.emitManifest(100);
  const old = [...h.requests]; h.navigate(200);
  assert(old.every(r => r.signal?.aborted));
  for (const r of old) r.resolve('STALE'); await settle();
  assert.equal(h.engine.getMovieId(), null);
  assert.equal(h.send('getStatus').secondaryCueCount, 0);
});
test('A-B-A navigation rejects the first A generation', async () => {
  const h = harness({ deferredFetch: true }); await settle(); h.emitManifest(100);
  const old = [...h.requests]; h.navigate(200); h.navigate(100);
  for (const r of h.requests.slice(2)) r.resolve('NEW A'); await settle();
  for (const r of old) r.resolve('OLD A'); await settle();
  assert.equal(h.engine.cues[0].text, 'NEW A');
});
test('URL-only transition is caught by watchdog and by async commit guard', async () => {
  const h = harness({ deferredFetch: true }); await settle(); h.emitManifest(100);
  h.navigate(200, false);
  for (const r of h.requests) r.resolve('STALE'); await settle();
  assert.equal(h.engine.getMovieId(), null);
  h.tick(); h.emitManifest(200); for (const r of h.requests.slice(2)) r.resolve(); await settle();
  assert.equal(h.engine.getMovieId(), '200');
});
test('leaving playback clears cues, unmounts renderer and removes old video listeners', async () => {
  const h = harness(); await settle(); h.emitManifest(100); await settle();
  h.navigate(null);
  const count = h.renderer.renders.length;
  h.video.dispatchEvent(new Event('timeupdate'));
  assert.equal(h.engine.getMovieId(), null);
  assert.equal(h.renderer.container, null);
  assert.equal(h.renderer.renders.length, count);
});
test('replacing video cancels callback on its owner; cancelled callback cannot restart loop', async () => {
  const h = harness(); await settle(); h.video.paused = false; h.video.dispatchEvent(new Event('play'));
  const old = h.video, callback = [...old.frames.values()][0];
  assert.equal(typeof callback, 'function');
  h.video = h.makeVideo(true); h.tick();
  assert.equal(old.frames.size, 0);
  const frameCount = h.video.nextFrame;
  callback(0, { mediaTime: 10 });
  assert.equal(h.video.nextFrame, frameCount);
});
test('missing selected language requests hydration, never substitutes unrelated language', async () => {
  const h = harness(); await settle(); h.emitManifest(100); await settle();
  h.emitStorage({ ottsub_secondary_lang: { newValue: 'vi' } }); await settle();
  assert.equal(h.hydration.at(-1).lang, 'vi');
  assert.equal(h.hydration.at(-1).movieId, '100');
  assert.equal(h.send('getStatus').secondaryCueCount, 0);
  assert.equal(h.requests.length, 2);
});

test('saved primary language selects exact region and leaves secondary independent', async () => {
  const h = harness({ local: { ottsub_primary_lang: 'es-419' }, sync: { ottsub_primary_lang: 'ko' } });
  await settle();
  h.emitManifest(100, { tracksByLang: { es: ['https://cdn.nflxvideo.net/es'], 'es-419': ['https://cdn.nflxvideo.net/latin'], ko: ['https://cdn.nflxvideo.net/ko'] } });
  await settle();
  assert.equal(h.send('getStatus').primaryLang, 'es-419');
  assert.equal(h.engine.cues[0].text, 'https://cdn.nflxvideo.net/latin');
  assert.equal(h.send('getStatus').secondaryLang, 'ko');
  assert.equal(h.send('getStatus').secondaryCueCount, 1);
  h.send('set_primary_lang', { lang: 'auto' }); await settle();
  assert.equal(h.engine.cues[0].text, 'https://cdn.nflxvideo.net/100/en');
  assert(h.writes.some(w => w.value.ottsub_primary_lang === 'auto'));
});

test('missing primary language clears old cues and requests hydration without unrelated fallback', async () => {
  const h = harness(); await settle(); h.emitManifest(100); await settle();
  h.send('set_primary_lang', { lang: 'de' }); await settle();
  assert.equal(h.engine.cues.length, 0);
  assert.equal(h.hydration.at(-1).lang, 'de');
  assert.equal(h.send('getStatus').secondaryCueCount, 1);
  h.emitManifest(100, { tracksByLang: { de: ['https://cdn.nflxvideo.net/de'], ko: ['https://cdn.nflxvideo.net/ko'] } }); await settle();
  assert.equal(h.engine.cues[0].text, 'https://cdn.nflxvideo.net/de');
});

test('rapid primary changes reject stale downloads even when cancellation is ignored', async () => {
  const h = harness({ deferredFetch: true }); await settle(); h.emitManifest(100);
  const old = h.requests.find(r => r.url.endsWith('/en'));
  h.send('set_primary_lang', { lang: 'ko' });
  h.send('set_primary_lang', { lang: 'auto' });
  assert(old.signal.aborted);
  for (const r of h.requests.filter(r => r !== old)) r.resolve('LATEST');
  await settle(); old.resolve('STALE'); await settle();
  assert.equal(h.engine.cues[0].text, 'LATEST');
  assert.equal(h.send('getStatus').primaryLang, 'auto');
});

test('late primary settings restore cancels default fetch and invalid values do not change language', async () => {
  const h = harness({ local: { ottsub_primary_lang: 'ko' }, deferSettings: true, deferredFetch: true });
  h.emitManifest(100);
  const old = h.requests.find(r => r.url.endsWith('/en'));
  for (const read of h.reads) read.cb(read.data); await settle();
  assert(old.signal.aborted);
  for (const r of h.requests) r.resolve(); await settle();
  assert.equal(h.engine.cues[0].text, 'https://cdn.nflxvideo.net/100/ko');
  h.send('set_primary_lang', { lang: '<bad>' });
  assert.equal(h.send('getStatus').primaryLang, 'ko');
});
test('language saved before initial manifest replaces any default-language request', async () => {
  const h = harness({ local: { ottsub_secondary_lang: 'vi' }, deferSettings: true, deferredFetch: true });
  h.emitManifest(100, { tracksByLang: { ko: ['https://cdn.nflxvideo.net/ko'], vi: ['https://cdn.nflxvideo.net/vi'] } });
  const ko = h.requests.find(r => r.url.endsWith('/ko'));
  for (const read of h.reads) read.cb(read.data); await settle();
  assert(ko.signal.aborted);
  assert(h.requests.some(r => r.url.endsWith('/vi')));
});

test('delayed sync notification cannot undo a newer local change', async () => {
  const h = harness(); await settle();
  h.emitStorage({ ottsub_offset: { newValue: 1200 } }, 'local');
  h.emitStorage({ ottsub_offset: { newValue: 300 } }, 'sync');
  assert.equal(h.engine.offsetMs, 1200);
});
test('delayed sync failure cannot overwrite a newer local save', async () => {
  const h = harness(); await settle(); let finishSync;
  h.window.chrome.storage.sync.set = (payload, cb) => { finishSync = cb; };
  const guard = h.window.OTTSubStorageGuard;
  guard.queueStorageSave('ottsub_offset', 100); guard.flushStorageSave();
  guard.queueStorageSave('ottsub_offset', 800);
  h.window.chrome.runtime.lastError = { message: 'sync quota' }; finishSync();
  delete h.window.chrome.runtime.lastError;
  assert.equal(h.writes.filter(w => w.area === 'local').at(-1).value.ottsub_offset, 800);
});
test('fetcher retains a deadline with external cancellation, then retries timeouts', async () => {
  const h = harness(); await settle(); const outer = new AbortController(); let attempts = 0;
  h.window.fetch = (url, { signal }) => new Promise((resolve, reject) => {
    attempts++;
    signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), { once: true });
  });
  const pending = h.window.OTTSubTrackFetcher.fetchAndParseTrack(['https://cdn.nflxvideo.net/test'], outer.signal);
  const deadline = [...h.timers.values()].find(t => t.ms === 6000);
  assert(deadline); deadline.fn(); await settle();
  const retry = [...h.timers.values()].find(t => t.ms >= 150 && t.ms < 300);
  assert(retry); retry.fn(); await settle();
  assert.equal(attempts, 2);
  outer.abort(); assert.equal((await pending).length, 0);
  assert.equal(h.timers.size, 0);
});
test('cancellation during retry delay prevents further network attempts', async () => {
  const h = harness(); await settle(); const outer = new AbortController(); let attempts = 0;
  h.window.fetch = async () => { attempts++; throw new Error('offline'); };
  const pending = h.window.OTTSubTrackFetcher.fetchAndParseTrack(['https://cdn.nflxvideo.net/test'], outer.signal);
  await settle(); outer.abort(); assert.equal((await pending).length, 0);
  assert.equal(attempts, 1); assert.equal(h.timers.size, 0);
});
test('forbidden candidate falls through immediately; unsafe redirects are never parsed', async () => {
  const h = harness(); await settle(); const calls = [];
  h.window.fetch = async url => {
    calls.push(url);
    return { url: url.endsWith('redirect') ? 'https://untrusted.test/sub' : url, status: url.endsWith('403') ? 403 : 200,
      ok: !url.endsWith('403'), text: async () => { assert(!url.endsWith('redirect')); return 'GOOD'; } };
  };
  const cues = await h.window.OTTSubTrackFetcher.fetchAndParseTrack([
    'https://cdn.nflxvideo.net/403', 'https://cdn.nflxvideo.net/redirect', 'https://cdn.nflxext.com/valid'
  ]);
  assert.equal(cues[0].text, 'GOOD'); assert.equal(calls.length, 3);
});
test('fetcher retries transient HTTP failures and rejects deceptive URLs', async () => {
  const h = harness(); await settle(); let attempts = 0;
  const fetcher = h.window.OTTSubTrackFetcher;
  for (const url of ['http://cdn.nflxvideo.net/x', 'https://nflxvideo.net.bad.test/x', 'https://u:p@nflxvideo.net/x', 'https://nflxvideo.net:444/x']) {
    assert.equal(fetcher.isSafeNetflixSubtitleUrl(url), false);
  }
  h.window.fetch = async url => ({ url, status: ++attempts === 1 ? 503 : 200, ok: attempts > 1, text: async () => 'RECOVERED' });
  const pending = fetcher.fetchAndParseTrack(['https://cdn.nflxvideo.net/test']); await settle();
  [...h.timers.values()].find(t => t.ms >= 150 && t.ms < 300).fn();
  assert.equal((await pending)[0].text, 'RECOVERED'); assert.equal(attempts, 2);
});
