// Offline Chromium integration: all shipped scripts, actual parser/renderer, no Netflix connection.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join((process.env.USERPROFILE || process.env.HOME), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }
const root = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => r.fulfill({ contentType: 'text/html', body: '<div data-uia="player" style="width:1200px;height:700px;position:relative"><video style="width:1200px;height:700px"></video></div>' }));
    await page.goto('https://ottsub.test/watch/100');
    await page.evaluate(() => {
      const listeners = new Set();
      window.audit = { writes: [], requests: [], time: 10, deferred: false, hydration: [] };
      const storage = (area, initial) => ({
        get(keys, cb) { cb({ ...initial }); },
        set(values, cb) {
          audit.writes.push({ area, values });
          const changes = {};
          for (const [key, value] of Object.entries(values)) {
            if (initial[key] !== value) { changes[key] = { oldValue: initial[key], newValue: value }; initial[key] = value; }
          }
          queueMicrotask(() => { if (Object.keys(changes).length) for (const fn of [...listeners]) fn(changes, area); cb?.(); });
        }
      });
      window.chrome = { i18n: { getUILanguage: () => 'en', getMessage: k => k }, runtime: { id: 'test', onMessage: { addListener: fn => { audit.message = fn; } } },
        storage: { local: storage('local', { ottsub_offset: 700, ottsub_primary_scale: 1.2 }), sync: storage('sync', { ottsub_offset: 100, ottsub_lock_pos: true }),
          onChanged: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) } } };
      const v = document.querySelector('video');
      for (const [k, value] of Object.entries({ paused: true, ended: false, readyState: 4 })) Object.defineProperty(v, k, { get: () => value });
      Object.defineProperty(v, 'currentTime', { get: () => audit.time });
      window.fetch = (url, { signal } = {}) => new Promise(resolve => {
        const req = { url, signal, resolve: label => resolve({ url, ok: true, status: 200,
          text: async () => `WEBVTT\n\n00:00:00.000 --> 00:01:00.000\n${label || url}\n` }) };
        audit.requests.push(req); if (!audit.deferred) req.resolve();
      });
      window.netflix = { appContext: { state: { playerApp: { getAPI: () => ({ videoPlayer: {
        getAllPlayerSessionIds: () => ['session'], getVideoPlayerBySessionId: () => ({
          getMovieId: () => Number(location.pathname.match(/\d+/)?.[0]),
          getTimedTextTrackList: () => [{ bcp47: 'vi' }], setTimedTextTrack: track => audit.hydration.push(track)
        })
      } }) } } } };
      window.send = (action, value) => { let status; audit.message({ action, value }, { id: 'test' }, r => status = r); return status; };
      window.emitManifest = mid => dispatchEvent(new CustomEvent('ottsub_manifest_data', { detail: {
        source: 'ottsub_injected', movieId: String(mid), urls: [`https://cdn.nflxvideo.net/${mid}/en`],
        tracksByLang: { ko: [`https://cdn.nflxvideo.net/${mid}/ko`] }, availableTracks: [{ lang: 'ko' }]
      } }));
      window.settle = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
    });
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    for (const group of manifest.content_scripts) {
      for (const file of group.css || []) await page.addStyleTag({ content: fs.readFileSync(path.join(root, file), 'utf8') });
      for (const file of group.js || []) await page.addScriptTag({ content: fs.readFileSync(path.join(root, file), 'utf8') });
    }
    const result = await page.evaluate(async () => {
      await settle();
      const initial = send('getStatus'), initialWrites = audit.writes.length;
      emitManifest(100); await settle(); send('adjust_offset', 0);
      const rendered = OTTSubRenderer.bottomBox?.textContent;
      emitManifest(200); await settle();
      const afterPrefetch = send('getStatus').movieId, requestsAfterPrefetch = audit.requests.length;
      history.pushState({}, '', '/watch/200'); await settle();
      const afterNavigation = { status: send('getStatus'), text: OTTSubRenderer.bottomBox?.textContent };
      audit.deferred = true; history.replaceState({}, '', '/watch/300'); emitManifest(300);
      const pending = audit.requests.filter(r => r.url.includes('/300/'));
      history.pushState({}, '', '/watch/400');
      for (const r of pending) r.resolve('STALE 300'); await settle();
      const afterLate = send('getStatus');
      const nativeVisibleWhileLoading = !document.body.classList.contains('ottsub-active');
      dispatchEvent(new CustomEvent('ottsub_request_load_track', { detail: { movieId: '300', lang: 'vi' } }));
      const staleHydrationCalls = audit.hydration.length;
      dispatchEvent(new CustomEvent('ottsub_request_load_track', { detail: { movieId: '400', lang: 'vi' } }));
      const currentHydrationCalls = audit.hydration.length;
      history.pushState({}, '', '/browse');
      const exited = { status: send('getStatus'), container: !!OTTSubRenderer.container, nativeVisible: !document.body.classList.contains('ottsub-active') };
      return { initial, initialWrites, rendered, afterPrefetch, requestsAfterPrefetch, afterNavigation, afterLate,
        requestsAborted: pending.every(r => r.signal?.aborted), nativeVisibleWhileLoading, staleHydrationCalls, currentHydrationCalls, exited };
    });
    assert.equal(result.initial.offset, 700);
    assert.equal(result.initial.primaryScale, 1.2);
    assert.equal(result.initial.isPositionLocked, true);
    assert.equal(result.initialWrites, 0);
    assert.match(result.rendered, /100\/en/); assert.match(result.rendered, /100\/ko/);
    assert.equal(result.afterPrefetch, '100'); assert.equal(result.requestsAfterPrefetch, 2);
    assert.equal(result.afterNavigation.status.movieId, '200'); assert.match(result.afterNavigation.text, /200\/en/);
    assert.equal(result.afterLate.cueCount, 0); assert.equal(result.afterLate.secondaryCueCount, 0);
    assert.equal(result.requestsAborted, true); assert.equal(result.nativeVisibleWhileLoading, true);
    assert.equal(result.staleHydrationCalls, 0); assert.equal(result.currentHydrationCalls, 0, 'missing URL discovery must not change the original track');
    assert.equal(result.exited.status.movieId, null); assert.equal(result.exited.status.ready, false);
    assert.equal(result.exited.container, false); assert.equal(result.exited.nativeVisible, true);
    const chinese = await page.evaluate(async()=>{
      audit.deferred=false;history.pushState({},'', '/watch/500');
      dispatchEvent(new CustomEvent('ottsub_manifest_data',{detail:{source:'ottsub_injected',movieId:'500',urls:['https://cdn.nflxvideo.net/en'],
        tracksByLang:{'zh-hans':['https://cdn.nflxvideo.net/zh-hans'],'zh-hant':['https://cdn.nflxvideo.net/zh-hant']},availableTracks:[{bcp47:'zh-Hans'},{bcp47:'zh-Hant'}]}}));
      await settle();audit.message({action:'set_primary_lang',lang:'zh-Hant'},{id:'test'},()=>{});
      audit.message({action:'set_secondary_lang',lang:'zh-Hans'},{id:'test'},()=>{});await settle();send('adjust_offset',0);
      return {text:OTTSubRenderer.bottomBox.textContent,status:send('getStatus')};
    });
    assert.match(chinese.text,/zh-hant/);assert.match(chinese.text,/zh-hans/);assert.equal(chinese.status.primaryResolvedLang,'zh-hant');
    for (const [mid, lang] of [[600, 'es-es'], [601, 'ar']]) {
      await page.evaluate(async ({mid, lang}) => {
        window.lateDiscovery = { urlsReady: false, reads: 0, switches: 0 };
        const player = { getMovieId: () => mid,
          getTimedTextTrackList: () => {
            lateDiscovery.reads++;
            return [{ bcp47: lang, trackId: `late-${mid}`,
              ...(lateDiscovery.urlsReady ? { ttDownloadables: { webvtt: { downloadUrls: {a: `https://cdn.nflxvideo.net/${lang}`} } } } : {}) }];
          }, setTimedTextTrack: () => lateDiscovery.switches++ };
        window.netflix = { appContext: {state: {playerApp: {getAPI: () => ({videoPlayer: {
          getAllPlayerSessionIds: () => ['late'], getVideoPlayerBySessionId: () => player
        }})}}}};
        history.pushState({}, '', `/watch/${mid}`);
        audit.message({action:'set_primary_lang', lang:'en'}, {id:'test'}, ()=>{});
        audit.message({action:'set_secondary_lang', lang}, {id:'test'}, ()=>{});
        dispatchEvent(new CustomEvent('ottsub_manifest_data', {detail: {source:'ottsub_injected', movieId:String(mid),
          urls:['https://cdn.nflxvideo.net/en'], tracksByLang:{en:['https://cdn.nflxvideo.net/en']},
          availableTracks:[{bcp47:'en', urls:['https://cdn.nflxvideo.net/en']}, {bcp47:lang, hasUrls:false}]}}));
        await settle();
      }, {mid, lang});
      assert.equal(await page.evaluate(()=>send('getStatus').secondaryNeedsSelection), true);
      await page.evaluate(()=>lateDiscovery.urlsReady=true);
      await page.waitForFunction(()=>send('getStatus').hasSecondaryCues, {timeout:10000});
      const loaded = await page.evaluate(()=>({status:send('getStatus'), ...lateDiscovery}));
      assert.equal(loaded.status.secondaryLang, lang);
      assert.equal(loaded.status.secondaryNeedsSelection, false);
      assert.equal(loaded.switches, 0, 'late metadata discovery must not change Netflix language');
      assert(loaded.reads >= 2, 'player list is read again after initial URL miss');
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, browserVersion: browser.version(), errors, result }, null, 2));
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
