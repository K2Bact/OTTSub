const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join((process.env.USERPROFILE || process.env.HOME), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }
const root = path.resolve(__dirname, '..'), cases = [], errors = [], measurements = {};
const artifacts = process.env.OTTSUB_QA_ARTIFACT_DIR || path.join(root, 'artifacts/qa/manual/test_review40_browser');
fs.mkdirSync(artifacts, { recursive: true });
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
async function check(name, action) {
  try { await action(); cases.push({ name, passed: true }); }
  catch (error) { cases.push({ name, passed: false }); errors.push(error.stack); }
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    await page.setContent('<div data-uia="player" style="position:relative;width:100%;height:600px"><video style="width:100%;height:600px"></video></div>');
    for (const file of ['src/parser.js', 'src/renderer.js']) await page.addScriptTag({ content: source(file) });
    await page.addStyleTag({ content: source('src/styles.css') });
    await check('nested bold/underline stays flat; crossed tags retain both character styles', async () => {
      const data = await page.evaluate(() => {
        const render = text => OTTSubRenderer._createLineElement(OTTSubParser.cleanSubtitleLine(text));
        const nested = render('<b><b>A</b></b><u><u>B</u></u><i></i>');
        const crossed = render('<b><i>A</b>B</i>C');
        const deep = render('<b>'.repeat(5000) + 'X' + '</b>'.repeat(5000));
        document.body.append(nested, crossed, deep);
        return { nested: nested.textContent, duplicates: !!nested.querySelector('b b,u u'), empty: [...nested.querySelectorAll('i,b,u')].some(el => !el.textContent),
          bold: crossed.querySelector('b')?.textContent, italic: [...crossed.querySelectorAll('i')].map(el => el.textContent).join(''), text: crossed.textContent, deepTags: deep.querySelectorAll('*').length };
      });
      assert.equal(data.nested, 'AB'); assert.equal(data.duplicates, false); assert.equal(data.empty, false);
      assert.equal(data.bold, 'A'); assert.equal(data.italic, 'AB'); assert.equal(data.text, 'ABC'); assert.equal(data.deepTags, 1);
    });
    await check('VTT wrappers keep dialogue; encoded angle brackets remain literal and non-executable', async () => {
      const data = await page.evaluate(() => {
        const cue = OTTSubParser.parse('WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n<c.yellow><v Speaker><span>A</span></v></c> &lt;tag&gt; &lt;script&gt;window.attacked=true&lt;/script&gt;<script>bad()</script>')[0];
        const line = OTTSubRenderer._createLineElement(cue.text); document.body.append(line);
        const ttml = OTTSubParser.parse('<tt><body><p begin="1s" end="3s">&lt;tag&gt; &amp; text</p></body></tt>')[0];
        return { text: line.textContent, active: !!line.querySelector('script,span span,[onclick]'), attacked: !!window.attacked,
          ttml: OTTSubRenderer._createLineElement(ttml.text).textContent };
      });
      assert.equal(data.text, 'A <tag> <script>window.attacked=true</script>'); assert.equal(data.active, false); assert.equal(data.attacked, false);
      assert.equal(data.ttml, '<tag> & text');
    });
    await page.evaluate(() => OTTSubRenderer.ensureMounted(document.querySelector('video')));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await check('cancelled frames cannot mutate a new gesture; wrong pointer cannot end it', async () => {
      const data = await page.evaluate(() => {
        const r = OTTSubRenderer, raf = window.requestAnimationFrame, cancel = window.cancelAnimationFrame, frames = [];
        window.requestAnimationFrame = fn => { frames.push(fn); return frames.length; }; window.cancelAnimationFrame = () => {};
        const event = (type, id, x) => r.bottomBox.dispatchEvent(new PointerEvent(type, { pointerType: 'mouse', button: 0, pointerId: id, clientX: x, clientY: 300, bubbles: true }));
        try {
          r.setCustomPosition(4, 2); event('pointerdown', 1, 400); event('pointermove', 1, 500); const old = frames.at(-1); r.cancelDrag();
          event('pointerdown', 2, 400); event('pointermove', 2, 450); const pending = r._dragRafId;
          old(); const stale = { x: r.customPosX, pending: r._dragRafId === pending };
          event('pointerup', 1, 450); const wrongPointer = r.isDragging;
          frames.at(-1)(); event('pointerup', 2, 450);
          return { stale, wrongPointer, moved: r.customPosX !== 4, dragging: r.isDragging };
        } finally { r.cancelDrag(); window.requestAnimationFrame = raf; window.cancelAnimationFrame = cancel; }
      });
      assert.equal(data.stale.x, 4); assert.equal(data.stale.pending, true); assert(data.wrongPointer && data.moved); assert.equal(data.dragging, false);
    });
    await check('geometry changed before ResizeObserver delivery cancels a queued move', async () => {
      const data = await page.evaluate(() => {
        const r = OTTSubRenderer, raf = window.requestAnimationFrame, cancel = window.cancelAnimationFrame; let callback;
        window.requestAnimationFrame = fn => { callback = fn; return 77; }; window.cancelAnimationFrame = () => {};
        try {
          r.setCustomPosition(4, 2);
          for (const [type, x] of [['pointerdown', 400], ['pointermove', 500]]) r.bottomBox.dispatchEvent(new PointerEvent(type, { pointerType: 'mouse', button: 0, pointerId: 3, clientX: x, clientY: 300, bubbles: true }));
          document.querySelector('video').style.width = '500px'; callback();
          return { x: r.customPosX, y: r.customPosY, dragging: r.isDragging };
        } finally { r.cancelDrag(); window.requestAnimationFrame = raf; window.cancelAnimationFrame = cancel; document.querySelector('video').style.width = '100%'; }
      });
      assert.deepEqual(data, { x: 4, y: 2, dragging: false });
    });
    await check('four-line primary and secondary cues fit the tested 720p/1080p/4K viewports', async () => {
      measurements.layout = [];
      for (const [width, height] of [[1280, 720], [1920, 1080], [3840, 2160]]) {
        await page.setViewportSize({ width, height });
        const data = await page.evaluate(height => {
          document.body.style.margin = '0'; const video = document.querySelector('video'); video.style.height = height + 'px'; video.parentElement.style.height = height + 'px';
          const r = OTTSubRenderer; r.destroy(); r.ensureMounted(video); r.resetCustomPosition(); r.setLockPosition(true);
          const lines = 'First line\nSecond line\nThird line\nFourth line';
          const cues = { top: [], bottom: [{ id: 1, text: lines }] };
          r.renderDual(cues, cues, { isDualMode: true });
          return [...r.container.querySelectorAll('.ottsub-line')].map(el => {
            const rect = el.getBoundingClientRect(); return { text: el.textContent, top: rect.top, bottom: rect.bottom, height: rect.height, clipped: rect.top < 0 || rect.bottom > innerHeight };
          });
        }, height);
        measurements.layout.push({ width, height, lines: data }); assert.equal(data.length, 2); assert(data.every(line => !line.clipped), JSON.stringify(data));
      }
    });
    await check('500 identical render requests retain the same cue DOM nodes', async () => {
      const data = await page.evaluate(() => {
        const r = OTTSubRenderer, cues = { top: [], bottom: [{ id: 1, text: 'Same cue' }] };
        r.renderDual(cues, cues, { isDualMode: true }); const first = r.bottomBox.querySelector('.ottsub-line');
        for (let i = 0; i < 500; i++) r.renderDual(cues, cues, { isDualMode: true });
        return { retained: first === r.bottomBox.querySelector('.ottsub-line'), lines: r.bottomBox.querySelectorAll('.ottsub-line').length };
      });
      measurements.repeatRender = data; assert.equal(data.retained, true); assert.equal(data.lines, 2);
    });
    await check('reported 720p two-plus-two lines at 120%/100% fit with controls visible', async () => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const data = await page.evaluate(() => {
        const video = document.querySelector('video'); video.style.height = '720px'; video.parentElement.style.height = '720px';
        const control = document.createElement('div'); control.dataset.uia = 'timeline'; control.style.cssText = 'position:absolute;bottom:0;width:100%;height:40px'; video.parentElement.append(control);
        const r = OTTSubRenderer; r.destroy(); r.setLockPosition(false); r.ensureMounted(video); r.setPrimaryScale(1.2); r.setSecondaryScale(1);
        r.renderDual({ top: [], bottom: [{ id: 2, text: 'First primary line\nSecond primary line' }] },
          { top: [], bottom: [{ id: 3, text: 'First secondary line\nSecond secondary line' }] }, { isDualMode: true });
        const lines = [...r.container.querySelectorAll('.ottsub-line')].map(el => { const rect = el.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom }; });
        return { lines, controlsVisible: r.container.classList.contains('controls-visible') };
      });
      measurements.reportedLayout = data; assert(data.controlsVisible); assert.equal(data.lines.length, 2);
      assert(data.lines.every(line => line.top >= 0 && line.bottom <= 720)); assert(data.lines[0].bottom <= data.lines[1].top);
    });
  } finally { await browser.close(); }

  // Separate, local extension profile; never the user's open browser/profile.
  const profile = fs.mkdtempSync(path.join(artifacts, 'review40-profile-'));
  const context = await chromium.launchPersistentContext(profile, { headless: true, channel: 'chromium',
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`, '--disable-background-networking'] });
  try {
    await context.route(/^https?:/, route => route.fulfill({ contentType: 'text/html', body: '<html><body>Offline fixture</body></html>' }));
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;
    await check('real Chrome storage local and sync retain settings after 12 immediate panel closes', async () => {
      const values = [];
      for (let i = 1; i <= 12; i++) {
        const panel = await context.newPage(); await panel.goto(`chrome-extension://${extensionId}/popup/popup.html`);
        await panel.waitForFunction(() => !!window.OTTSubStorageGuard);
        await panel.evaluate(value => OTTSubStorageGuard.queueStorageSave('ottsub_secondary_scale', value), 0.5 + i / 100);
        await panel.close();
        const expected = 0.5 + i / 100;
        await worker.evaluate(async value => {
          const end = Date.now() + 2500;
          while (Date.now() < end) {
            if ((await chrome.storage.sync.get('ottsub_secondary_scale')).ottsub_secondary_scale === value) return;
            await new Promise(resolve => setTimeout(resolve, 25));
          }
          throw Error('Closed panel setting was not retained by Chrome storage.sync');
        }, expected);
        const saved = await worker.evaluate(async () => ({ local: await chrome.storage.local.get('ottsub_secondary_scale'), sync: await chrome.storage.sync.get('ottsub_secondary_scale') }));
        assert.equal(saved.local.ottsub_secondary_scale, expected); assert.equal(saved.sync.ottsub_secondary_scale, expected); values.push(expected);
      }
      measurements.rapidClose = { cycles: values.length, values, cloudPropagationTested: false };
    });
    await check('real onActivated event triggers an immediate current-window query', async () => {
      const panel = await context.newPage(); await panel.goto(`chrome-extension://${extensionId}/popup/popup.html`);
      await panel.evaluate(async () => {
        const { startStatusConnection } = await import('./modules/status-connection.js');
        window.activationStates = []; window.testConnection = startStatusConnection(value => activationStates.push(value.state));
      });
      const tabId = await panel.evaluate(async () => (await chrome.tabs.create({ url: 'https://example.test/offline', active: false })).id);
      await panel.evaluate(() => activationStates.length = 0);
      await panel.evaluate(id => chrome.tabs.update(id, { active: true }), tabId);
      await panel.waitForFunction(() => activationStates.includes('status_waiting'));
      await panel.evaluate(async id => { testConnection.stop(); await chrome.tabs.remove(id); }, tabId); await panel.close();
    });
  } finally {
    await context.close();
    // Validate the absolute target before deleting only this test's profile.
    const resolved = path.resolve(profile), allowed = path.resolve(artifacts) + path.sep;
    if (!resolved.startsWith(allowed)) throw Error('Unsafe profile cleanup target');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
  fs.writeFileSync(path.join(artifacts, 'review40-measurements.json'), JSON.stringify(measurements, null, 2));
  console.log(JSON.stringify({ passed: !errors.length, total: cases.length, cases, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
