// Offline production content/DOM integration. All network is fulfilled locally.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join((process.env.USERPROFILE || process.env.HOME), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const cases = [], errors = [];
  const check = async (name, fn) => {
    try { await fn(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error.message }); throw error; }
  };
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => r.fulfill({ contentType: 'text/html', body:
      '<div data-uia="player" style="width:1000px;height:600px;position:relative"><video style="width:1000px;height:600px"></video><div class="player-timedtext">NATIVE</div></div><span class="mmvz9h">20</span>' }));
    await page.goto('https://ottsub.test/watch/100');
    await page.evaluate(() => {
      window.audit = { time: 10, paused: true, hidden: false, plays: 0, pauses: 0, queries: 0, frames: new Map(),
        nextFrame: 0, messages: [], changes: [], requests: [], deferred: false, hydration: [], samples: 0 };
      Object.defineProperty(document, 'hidden', { get: () => audit.hidden });
      const storage = { get: (keys, cb) => cb({}), set: (values, cb) => cb?.() };
      window.chrome = { i18n: { getUILanguage: () => 'en', getMessage: k => k },
        runtime: { id: 'test', onMessage: { addListener: fn => audit.messages.push(fn) } },
        storage: { local: storage, sync: storage, onChanged: { addListener: fn => audit.changes.push(fn), removeListener() {} } } };
      window.video = document.querySelector('video');
      for (const [key, getter] of Object.entries({ paused: () => audit.paused, ended: () => false, readyState: () => 4, currentTime: () => audit.time })) {
        Object.defineProperty(video, key, { get: getter });
      }
      video.play = () => { audit.plays++; audit.paused = false; video.dispatchEvent(new Event('play')); return Promise.resolve(); };
      video.pause = () => { audit.pauses++; audit.paused = true; video.dispatchEvent(new Event('pause')); };
      video.requestVideoFrameCallback = fn => { audit.frames.set(++audit.nextFrame, fn); return audit.nextFrame; };
      video.cancelVideoFrameCallback = id => audit.frames.delete(id);
      window.fetch = (url, { signal } = {}) => new Promise(resolve => {
        const req = { url, signal, resolve: () => resolve({ url, ok: true, status: 200, text: async () =>
          `WEBVTT\n\n00:00:00.000 --> 00:01:00.000\n${url}\n` }) };
        audit.requests.push(req); if (!audit.deferred) req.resolve();
      });
      window.command = (action, value) => { let reply; audit.messages[0]({ action, value }, { id: 'test' }, r => reply = r); return reply; };
      window.statusNow = () => command('getStatus');
      window.settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
      window.emit = (mid, suffix = '') => dispatchEvent(new CustomEvent('ottsub_manifest_data', { detail: {
        source: 'ottsub_injected', movieId: String(mid), urls: [`https://cdn.nflxvideo.net/${mid}/en${suffix}`],
        tracksByLang: { ko: [`https://cdn.nflxvideo.net/${mid}/ko${suffix}`] }, availableTracks: [{ lang: 'ko' }] } }));
      window.ad = text => { const el = document.createElement('span'); el.className = 'mmvz9h test-ad'; el.textContent = text;
        document.querySelector('[data-uia="player"]').append(el); return el; };
      window.navigate = async mid => {
        document.querySelectorAll('.test-ad').forEach(el => el.remove());
        audit.deferred = false; audit.paused = true; audit.time = 10;
        history.pushState({}, '', mid ? `/watch/${mid}` : '/browse');
        dispatchEvent(new CustomEvent('ottsub_nav_change'));
        if (mid) emit(mid);
        await settle();
      };
      addEventListener('ottsub_request_load_track', e => audit.hydration.push(e.detail));
    });
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    const group = manifest.content_scripts.find(g => g.world === 'ISOLATED');
    for (const file of group.css) await page.addStyleTag({ content: fs.readFileSync(path.join(root, file), 'utf8') });
    for (const file of group.js) {
      if (file === 'src/content.js') await page.evaluate(() => {
        const Adapter = OTTSubNetflixPlaybackAdapter;
        window.OTTSubNetflixPlaybackAdapter = class extends Adapter {
          constructor(fn) { super((sample, now) => { audit.samples++; fn(sample, now); }); audit.adapter = this; }
        };
        const fast = OTTSubSyncEngineClass.prototype.getActiveCuesFast;
        OTTSubSyncEngineClass.prototype.getActiveCuesFast = function(...args) { audit.queries++; return fast.apply(this, args); };
      });
      await page.addScriptTag({ content: fs.readFileSync(path.join(root, file), 'utf8') });
    }
    const waitState = state => page.waitForFunction(state => statusNow().playbackState === state, state, { timeout: 3000 });
    const waitAllowed = () => page.waitForFunction(() => !statusNow().displaySuppressed, null, { timeout: 3500 });

    await check('AD01/02: DOM visibility, scope, numeric formats and zero countdown', async () => {
      const result = await page.evaluate(() => {
        const el = ad('0'), read = () => OTTSubNetflixPlaybackAdapter.read().adSignal;
        el.style.cssText = 'display:inline-block;width:60px;height:20px';
        const values = ['0', '0:00', '01:30', '123', '', '1:99', '광고 20', '9999'].map(s => { el.textContent = s; return read(); });
        el.textContent = '20'; el.style.display = 'none'; values.push(read());
        el.style.display = ''; const wrap = document.createElement('div'); el.replaceWith(wrap); wrap.append(el);
        wrap.style.opacity = '0'; values.push(read()); wrap.style.opacity = ''; wrap.setAttribute('aria-hidden', 'true'); values.push(read());
        wrap.remove(); values.push(read()); return values;
      });
      assert.deepEqual(result, ['present','present','present','present','uncertain','uncertain','uncertain','uncertain','absent','absent','absent','absent']);
    });
    await check('AD22: ordinary no-ad playback renders both languages', async () => {
      await page.evaluate(async () => { emit(100); await settle(); command('adjust_offset', 0); });
      assert.deepEqual(await page.evaluate(() => [statusNow().displaySuppressed, /100\/en/.test(OTTSubRenderer.bottomBox.textContent), /100\/ko/.test(OTTSubRenderer.bottomBox.textContent)]), [false,true,true]);
    });
    await check('AD03/15: ad clears both overlays and hover ownership without playing video', async () => {
      await page.evaluate(() => { audit.paused = false; video.dispatchEvent(new Event('play')); OTTSubRenderer.onSubtitleHoverChange(true, 'primary'); });
      await page.waitForTimeout(110);
      assert.equal(await page.evaluate(() => audit.pauses), 1);
      await page.evaluate(() => { ad('0'); }); await waitState('AD');
      await page.waitForTimeout(100);
      assert.deepEqual(await page.evaluate(() => [audit.plays, audit.frames.size, OTTSubRenderer.bottomBox.textContent,
        document.body.classList.contains('ottsub-active'), getComputedStyle(document.querySelector('.player-timedtext')).visibility]), [0,0,'',false,'visible']);
    });
    await check('AD04: settings, timeupdate, play and manual render never query cues in ads', async () => {
      const result = await page.evaluate(async () => {
        const before = audit.queries, pointers = [OTTSubSyncEngine.pointer, OTTSubSyncEngine.lastTime];
        audit.time = 50;
        for (const action of ['set_primary_scale', 'adjust_offset', 'set_dual_mode']) command(action, action === 'set_dual_mode' ? true : 1);
        for (const fn of audit.changes) fn({ ottsub_secondary_offset: { newValue: 300 } }, 'local');
        for (const name of ['timeupdate', 'pause', 'seeked', 'play', 'playing']) video.dispatchEvent(new Event(name));
        await settle();
        return { queries: audit.queries - before, pointers, after: [OTTSubSyncEngine.pointer, OTTSubSyncEngine.lastTime], frames: audit.frames.size,
          native: !document.body.classList.contains('ottsub-active'), cues: statusNow().cueCount };
      });
      assert.equal(result.queries, 0); assert.deepEqual(result.pointers, result.after); assert.equal(result.frames, 0); assert.equal(result.native, true); assert.equal(result.cues, 1);
    });
    await check('AD05: short gap and next ad retain suppression; A does not auto-resume afterwards', async () => {
      await page.evaluate(() => document.querySelector('.test-ad').remove()); await waitState('RECOVERING');
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => statusNow().displaySuppressed), true);
      await page.evaluate(() => { ad('20'); }); await waitState('AD');
      await page.evaluate(() => document.querySelector('.test-ad').remove()); await waitState('RECOVERING');
      await page.waitForTimeout(1200);
      assert.equal(await page.evaluate(() => statusNow().displaySuppressed), true);
    });
    await check('AD16: ad manifest and language hydration cannot replace preserved episode cues', async () => {
      const result = await page.evaluate(async () => {
        const count = audit.requests.length, hydration = audit.hydration.length, text = OTTSubSyncEngine.cues[0].text;
        emit(100, '-AD');
        for (const fn of audit.changes) fn({ ottsub_secondary_lang: { newValue: 'vi' } }, 'local');
        await settle();
        return [audit.requests.length === count, audit.hydration.length === hydration, OTTSubSyncEngine.cues[0].text === text];
      });
      assert.deepEqual(result, [true,true,true]);
    });
    await check('AD17: episode change discards ad latch and old pending manifest', async () => {
      await page.evaluate(async () => { await navigate(200); }); await waitAllowed();
      assert.deepEqual(await page.evaluate(() => [statusNow().movieId, OTTSubSyncEngine.cues[0].text.includes('/200/'), !OTTSubSyncEngine.cues[0].text.includes('-AD')]), ['200',true,true]);
    });
    await check('AD04/16: pre-ad download completion stages cues without advancing or rendering', async () => {
      await page.evaluate(async () => {
        // Restore a loaded secondary before making both downloads pending.
        for (const fn of audit.changes) fn({ ottsub_secondary_lang: { newValue: 'ko' } }, 'local');
        await settle(); audit.deferred = true; emit(200, '-NEW'); audit.oldText = OTTSubSyncEngine.cues[0].text;
      });
      await page.evaluate(() => { ad('15'); }); await waitState('AD');
      const result = await page.evaluate(async () => {
        const queries = audit.queries;
        audit.requests.filter(r => r.url.endsWith('-NEW')).forEach(r => r.resolve()); await settle();
        return [audit.queries === queries, OTTSubSyncEngine.cues[0].text === audit.oldText, !document.body.classList.contains('ottsub-active')];
      });
      assert.deepEqual(result, [true,true,true]);
    });
    await check('AD15: queued hover pause is cancelled before it can fire', async () => {
      await page.evaluate(async () => { await navigate(300); audit.paused = false; video.dispatchEvent(new Event('play'));
        audit.pauseBaseline = audit.pauses; OTTSubRenderer.onSubtitleHoverChange(true, 'primary'); ad('25'); });
      await waitState('AD'); await page.waitForTimeout(120);
      assert.equal(await page.evaluate(() => audit.pauses === audit.pauseBaseline), true);
    });
    await check('AD19: pause-ad suppresses separately and allows same-video no-ad resume', async () => {
      await page.evaluate(async () => { await navigate(400); const el = document.createElement('div'); el.className = 'test-ad';
        el.dataset.uia = 'pause-ad-title-display'; el.textContent = 'Sponsored'; document.querySelector('[data-uia="player"]').append(el); });
      await page.waitForFunction(() => statusNow().suppressionReason === 'pause-ad');
      assert.equal(await page.evaluate(() => document.body.classList.contains('ottsub-active')), false);
      await page.evaluate(() => document.querySelector('.test-ad').remove()); await waitAllowed();
      assert.equal(await page.evaluate(() => statusNow().playbackState), 'CONTENT');
    });
    await check('AD06: background stops observation and clears overlay; visible rechecks', async () => {
      await page.evaluate(() => { audit.hidden = true; document.dispatchEvent(new Event('visibilitychange')); });
      assert.deepEqual(await page.evaluate(() => [audit.adapter.running, audit.adapter.timer, audit.adapter.observer, document.body.classList.contains('ottsub-active')]), [false,null,null,false]);
      await page.evaluate(() => { audit.hidden = false; document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(1200);
      assert.equal(await page.evaluate(()=>statusNow().suppressionReason),'clock-unverified');
      await page.evaluate(()=>navigate(402));await waitAllowed();
    });
    await check('ad beginning while hidden is detected before foreground subtitles can resume', async () => {
      await page.evaluate(() => { audit.hidden = true; document.dispatchEvent(new Event('visibilitychange')); ad('15'); audit.time += 40; });
      await page.evaluate(() => { audit.hidden = false; document.dispatchEvent(new Event('visibilitychange')); });
      await waitState('AD');
      assert.equal(await page.evaluate(() => document.body.classList.contains('ottsub-active')),false);
      assert.equal(await page.locator('.player-timedtext').evaluate(el=>getComputedStyle(el).visibility),'visible');
      await page.evaluate(()=>document.querySelectorAll('.test-ad').forEach(el=>el.remove()));
      // An ad transition must retain the clock barrier; no unverified old cue display.
      await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>statusNow().displaySuppressed),true);
      await page.evaluate(()=>navigate(401));await waitAllowed();
    });
    await check('AD10: multiple visible videos are ambiguous, hidden video is excluded', async () => {
      const result = await page.evaluate(() => {
        const second = document.createElement('video'); second.style.cssText = 'width:100px;height:100px'; Object.defineProperty(second, 'readyState', { get: () => 4 }); video.parentElement.append(second);
        const unknown = OTTSubNetflixPlaybackAdapter.read().adSignal;
        second.style.display = 'none'; const valid = OTTSubNetflixPlaybackAdapter.read().video === video;
        second.remove(); return [unknown,valid];
      });
      assert.deepEqual(result, ['unknown',true]);
    });
    await check('observer ignores own subtree mutations, retaining bounded polling', async () => {
      const count = await page.evaluate(async () => {
        const before = audit.samples;
        for (let i = 0; i < 10; i++) { OTTSubRenderer.container.dataset.test = String(i); OTTSubRenderer.container.style.opacity = '1'; await new Promise(r => setTimeout(r, 30)); }
        return audit.samples - before;
      });
      assert(count <= 3, `unexpected repeated observations: ${count}`);
    });
    await check('AD22: episode starting in an ad never activates downloaded content', async () => {
      await page.evaluate(async () => { await navigate(null); ad('30'); history.pushState({}, '', '/watch/500'); dispatchEvent(new CustomEvent('ottsub_nav_change')); emit(500); await settle(); });
      await waitState('AD');
      assert.deepEqual(await page.evaluate(() => [statusNow().cueCount, audit.requests.some(r => r.url.includes('/500/')), document.body.classList.contains('ottsub-active')]), [0,false,false]);
    });
    await check('AD17: pagehide disposes observer, timer, frames and native hide class', async () => {
      await page.evaluate(() => dispatchEvent(new Event('pagehide')));
      await page.waitForTimeout(1600); // The existing 1500 ms watchdog must not restart a hidden page.
      assert.deepEqual(await page.evaluate(() => [audit.adapter.running, audit.adapter.timer, audit.adapter.observer, audit.frames.size, statusNow().playbackState, document.body.classList.contains('ottsub-active')]), [false,null,null,0,'INACTIVE',false]);
    });
    await check('pageshow restarts observation once and retains initial-ad suppression', async () => {
      await page.evaluate(() => dispatchEvent(new Event('pageshow'))); await waitState('AD');
      assert.deepEqual(await page.evaluate(() => [audit.adapter.running, audit.adapter.timer !== null, document.body.classList.contains('ottsub-active')]), [true,true,false]);
    });
    assert.deepEqual(errors, []);
  } catch (error) { errors.push(error.stack); process.exitCode = 1; }
  finally {
    console.log(JSON.stringify({ passed: !errors.length, total: cases.length, browserVersion: browser.version(), cases, errors }, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
