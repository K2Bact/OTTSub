// Load the real diagnostic extension in Chromium. Netflix I/O is entirely mocked.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { summarize } = require('../scripts/summarize-ad-observation.cjs');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join((process.env.USERPROFILE || process.env.HOME), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }
const extension = path.resolve(__dirname, '../tools/ad-observer');
(async () => {
  const context = await chromium.launchPersistentContext('', { headless: true, channel: 'chromium', acceptDownloads: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  const cases = [], errors = [];
  const check = (name, passed) => { cases.push({ name, passed: !!passed }); assert.ok(passed, name); };
  try {
    await context.route('**/*', r => r.fulfill({ contentType: 'text/html', body: '<html><body><video style="width:640px;height:360px"></video><div data-uia="ad-break-counter" style="display:none">PRIVATE SUBTITLE SECRET</div></body></html>' }));
    await context.addInitScript(() => {
      window.probeTest = { t: 0, current: 10, playerTime: 10000, session: 'PRIVATE_SESSION_TOKEN', intervals: new Map(), next: 0, frames: new Map(), frameId: 0, ad: false, calls: 0 };
      performance.now = () => probeTest.t;
      window.setInterval = (fn, ms) => { const id = ++probeTest.next; probeTest.intervals.set(id, { fn, ms }); return id; };
      window.clearInterval = id => probeTest.intervals.delete(id);
      window.tick = (ms = 500) => { probeTest.t += ms; for (const { fn } of [...probeTest.intervals.values()]) fn(); };
      const player = { getCurrentTime() { probeTest.calls++; return probeTest.playerTime; }, getDuration: () => 3600000, getMovieId: () => 100, isPaused: () => false,
        getAdState() { throw new Error('Unknown method must not be called'); }, seek() { throw new Error('Must not seek'); } };
      window.netflix = { appContext: { state: { playerApp: { getAPI: () => ({ videoPlayer: { getAllPlayerSessionIds: () => [probeTest.session], getVideoPlayerBySessionId: () => player } }) } } } };
      for (const [key, get] of Object.entries({ currentTime: () => probeTest.current, currentSrc: () => 'https://cdn.example/sub?SECRET_TOKEN', duration: () => 3600, paused: () => false })) {
        Object.defineProperty(HTMLMediaElement.prototype, key, { configurable: true, get });
      }
      HTMLMediaElement.prototype.play = () => { throw new Error('Must not play'); };
      HTMLMediaElement.prototype.pause = () => { throw new Error('Must not pause'); };
      HTMLVideoElement.prototype.requestVideoFrameCallback = fn => { const id = ++probeTest.frameId; probeTest.frames.set(id, fn); return id; };
      HTMLVideoElement.prototype.cancelVideoFrameCallback = id => probeTest.frames.delete(id);
      window.flushFrame = () => { for (const [id, fn] of [...probeTest.frames]) { probeTest.frames.delete(id); fn(probeTest.t, { mediaTime: probeTest.current - 0.01, presentedFrames: 100 }); } };
    });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.goto('https://www.netflix.com/watch/100');
    await page.getByRole('button', { name: '기록 시작', exact: true }).waitFor();
    check('actual extension MAIN world mounts and remains idle', await page.evaluate(() => probeTest.calls === 0 && probeTest.intervals.size === 0));
    await page.getByRole('button', { name: '기록 시작', exact: true }).click();
    check('explicit start reads player API and binds one timer', await page.evaluate(() => probeTest.calls === 1 && probeTest.intervals.size === 1));
    await page.getByRole('button', { name: '본편 확인', exact: true }).click();
    await page.evaluate(() => { flushFrame(); tick(); probeTest.current = 0; probeTest.playerTime = 10000; document.querySelector('[data-uia]').style.display = 'block'; tick(); });
    await page.getByRole('button', { name: '광고 시작', exact: true }).click();
    await page.evaluate(() => { probeTest.current = 5; tick(5000); const old = document.querySelector('video'); const v = document.createElement('video'); v.style.cssText = old.style.cssText; old.replaceWith(v); probeTest.session = 'SECOND_PRIVATE_SESSION'; tick(); });
    await page.getByRole('button', { name: '다음 광고', exact: true }).click();
    await page.evaluate(() => { probeTest.current = 10; probeTest.playerTime = 10000; document.querySelector('[data-uia]').style.display = 'none'; tick(); });
    await page.getByRole('button', { name: '본편 복귀', exact: true }).click();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'JSON 저장', exact: true }).click();
    const download = await downloading;
    const raw = fs.readFileSync(await download.path(), 'utf8'), data = JSON.parse(raw);
    check('export has marks and raw clocks without unit conversion', data.rows.some(r => r.type === 'mark' && r.label === 'ad-start') && data.rows.some(r => r.videos?.[0]?.currentTime === 0 && r.players.sessions[0].values.getCurrentTime.value === 10000));
    check('private URLs, session IDs and page text excluded', !/SECRET|PRIVATE|cdn\.example/.test(raw));
    check('video replacement cleans up and tracks stable aliases', data.rows.some(r => r.type === 'video-detached' && r.id === 'v1') && data.rows.some(r => r.type === 'video-attached' && r.id === 'v2'));
    check('frame samples carry media time and observation age timestamp', data.rows.some(r => r.videos?.[0]?.frame?.mediaTime === 9.99 && r.videos[0].frame.at === 0));
    check('DOM candidate visibility transitions retained without text', data.rows.some(r => r.type === 'dom-candidates' && r.candidates[0]?.visible) && data.rows.some(r => r.type === 'dom-candidates' && r.candidates[0]?.visible === false));
    check('unknown player methods discovered without invocation', data.rows.some(r => r.type === 'player-methods' && r.sessions[0].methods.includes('getAdState')));
    check('save stops timers and cancels pending frames', await page.evaluate(() => probeTest.intervals.size === 0 && probeTest.frames.size === 0));
    const summary = summarize(data);
    check('offline summary flags observation gaps and retains marked transitions', summary.gaps.length > 0 && summary.hasAdStartMark && summary.hasContentReturnMark && summary.checkpoints.length === 4);
    page.on('dialog', d => d.accept());
    await page.getByRole('button', { name: '기록 비우기', exact: true }).click();
    await page.getByRole('button', { name: '기록 시작', exact: true }).click();
    await page.evaluate(() => tick(900000));
    check('15-minute limit stops without deleting log', (await page.getByRole('status').textContent()).includes('15분 경과') && await page.evaluate(() => probeTest.intervals.size === 0 && probeTest.frames.size === 0));
    await page.getByRole('button', { name: '기록 비우기', exact: true }).click();
    await page.evaluate(() => { window.netflix = undefined; });
    await page.getByRole('button', { name: '기록 시작', exact: true }).click();
    await page.evaluate(() => { history.pushState({}, '', '/browse'); tick(); });
    check('missing player API does not throw and leaving watch stops', (await page.getByRole('status').textContent()).includes('재생 화면 이탈'));
    await page.getByRole('button', { name: '기록 비우기', exact: true }).click();
    await page.getByRole('button', { name: '기록 시작', exact: true }).click();
    check('non-watch page cannot start recording', await page.evaluate(() => probeTest.intervals.size === 0));
    check('observer never calls playback mutators or unknown methods', errors.length === 0);
    await page.evaluate(() => { history.pushState({}, '', '/watch/100'); });
    await page.getByRole('button', { name: '기록 시작', exact: true }).click();
    await page.evaluate(() => { for (let i = 0; i < 12100; i++) document.querySelector('video').dispatchEvent(new Event('waiting')); });
    check('event flood reaches bounded limit and releases resources', (await page.getByRole('status').textContent()).includes('기록 용량 도달') && await page.evaluate(() => probeTest.intervals.size === 0 && probeTest.frames.size === 0));
    if (process.env.OTTSub_AD_QA_OUT) {
      fs.mkdirSync(process.env.OTTSub_AD_QA_OUT, { recursive: true });
      await page.screenshot({ path: path.join(process.env.OTTSub_AD_QA_OUT, 'observer-panel.png') });
      fs.writeFileSync(path.join(process.env.OTTSub_AD_QA_OUT, 'synthetic-observation.json'), raw);
      fs.writeFileSync(path.join(process.env.OTTSub_AD_QA_OUT, 'synthetic-summary.json'), JSON.stringify(summary, null, 2));
    }
  } finally {
    const report = { total: cases.length, passed: cases.filter(c => c.passed).length, cases, errors };
    if (process.env.OTTSub_AD_QA_OUT) {
      fs.mkdirSync(process.env.OTTSub_AD_QA_OUT, { recursive: true });
      fs.writeFileSync(path.join(process.env.OTTSub_AD_QA_OUT, 'browser-report.json'), JSON.stringify(report, null, 2));
    }
    console.log(JSON.stringify(report, null, 2));
    await context.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
