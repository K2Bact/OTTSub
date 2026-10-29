const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { fixture, setSaved } = require('./test_hindi_track_kind_browser.cjs');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(process.env.USERPROFILE || process.env.HOME, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }
const root = path.resolve(__dirname, '..'), cases = [], errors = [];
const baseline = process.argv.includes('--baseline');
const artifact = process.env.OTTSUB_QA_ARTIFACT_DIR || path.join(root, 'artifacts/qa/manual/test_popup_settings_browser');
fs.mkdirSync(artifact, { recursive: true });
const delayedFixture = () => fixture() + `
chrome.tabs.query = (query, callback) => queueMicrotask(() => callback([]));
const originalLocal = chrome.storage.local;
window.storageWrites = 0;
chrome.storage.local = {...originalLocal,
  get(keys, callback) {
    if (document.readyState === 'loading') return originalLocal.get(keys, callback);
    window.popupRequestedKeys = keys;
    const snapshot = {...savedSettings};
    window.releasePopupRead = () => callback(snapshot);
    return Promise.resolve(snapshot);
  },
  set(values, callback) { storageWrites++; return originalLocal.set(values, callback); }
};`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const check = async (name, run) => {
    try { await run(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false }); errors.push(error.stack); }
  };
  try {
    const page = await browser.newPage({ viewport: { width: 430, height: 950 } });
    page.setDefaultTimeout(5000);
    page.on('pageerror', error => errors.push(error.stack));
    await page.route('**/*', async route => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === '/fixture.js') return route.fulfill({ contentType: 'application/javascript', body: delayedFixture() });
      const file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: 'missing' });
      let body = fs.readFileSync(file);
      if (pathname === '/popup/popup.html') body = body.toString().replace('<head>', '<head><script src="/fixture.js"></script>');
      return route.fulfill({ contentType: ({ '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' })[path.extname(file)] || 'application/octet-stream', body });
    });
    setSaved({ ottsub_ui_lang: 'en', ottsub_active_sync_target: 'primary', ottsub_offset: 100,
      ottsub_secondary_offset: -200, ottsub_primary_scale: 1.2, ottsub_sub_settings_collapsed: true });
    await page.goto('http://ottsub.test/popup/popup.html');
    await page.waitForFunction(() => typeof releasePopupRead === 'function');
    await check('late initial snapshot cannot roll back accepted language, target or offsets', async () => {
      await page.evaluate(() => chrome.storage.local.set({ ottsub_ui_lang: 'he', ottsub_active_sync_target: 'secondary',
        ottsub_offset: 800, ottsub_secondary_offset: -400 }));
      await page.waitForFunction(() => document.documentElement.lang === 'he' && document.getElementById('sync-slider').value === '-400');
      await page.evaluate(() => releasePopupRead());
      const actual = await page.evaluate(() => ({ lang: document.documentElement.lang,
        secondary: document.getElementById('sync-card-secondary').getAttribute('aria-selected'),
        offset: document.getElementById('sync-slider').value }));
      assert.deepEqual(actual, { lang: 'he', secondary: 'true', offset: '-400' });
    });
    if (!baseline) {
      await check('untouched initial settings restore without writing settings or commands back', async () => {
        assert.equal(await page.locator('#primary-scale-val').textContent(), '120%');
        assert.equal(await page.locator('#subtitle-settings-card').evaluate(el => el.classList.contains('collapsed')), true);
        const result = await page.evaluate(() => ({ writes: storageWrites, commands: commands.filter(c => c.action !== 'getStatus') }));
        assert.deepEqual(result, { writes: 1, commands: [] });
      });
      await check('binding teardown ignores pending reads and callbacks, and a fresh instance has one subscription', async () => {
        const result = await page.evaluate(async () => {
          const { bindPopupSettings } = await import('/popup/modules/settings-binding.js');
          const listeners = new Set(), applied = [];
          let release, historical;
          const storage = { local: { get: (_, cb) => { release = cb; } }, onChanged: {
            addListener(fn) { historical = fn; listeners.add(fn); }, removeListener: fn => listeners.delete(fn) } };
          const options = { storage, validate: v => v, selectChanges: changes => Object.fromEntries(Object.entries(changes)
            .filter(([, c]) => c.newValue !== undefined).map(([k, c]) => [k, c.newValue])), apply: (v, source) => applied.push([v, source]) };
          const old = bindPopupSettings(options), pending = release;
          old.destroy(); old.destroy(); pending({ old: true }); historical({ old: { newValue: true } }, 'local');
          const afterDestroy = { subscriptions: listeners.size, calls: applied.length };
          const current = bindPopupSettings(options);
          const subscriptions = listeners.size;
          historical({ fresh: { newValue: 2 } }, 'local'); release({ fresh: 1, untouched: 3 });
          current.destroy();
          return { afterDestroy, subscriptions, applied, afterRestart: listeners.size };
        });
        assert.deepEqual(result, { afterDestroy: { subscriptions: 0, calls: 0 }, subscriptions: 1,
          applied: [[{ fresh: 2 }, { initial: false }], [{ untouched: 3 }, { initial: true }]], afterRestart: 0 });
      });
      await check('sync, rejected values and removed keys cannot resurrect stale snapshot settings', async () => {
        const result = await page.evaluate(async () => {
          const { bindPopupSettings } = await import('/popup/modules/settings-binding.js');
          const applied = []; let emit, release;
          const storage = { local: { get: (_, cb) => { release = cb; } }, onChanged: { addListener: fn => { emit = fn; }, removeListener() {} } };
          const guard = OTTSubStorageGuard;
          const binding = bindPopupSettings({ storage, validate: guard.validateStorageSchema,
            selectChanges: changes => guard.validateStorageSchema(Object.fromEntries(Object.entries(changes).map(([k, c]) => [k, c.newValue]))),
            apply: (v, source) => applied.push([v, source]) });
          emit({ ottsub_offset: { newValue: 999 } }, 'sync');
          emit({ ottsub_offset: { oldValue: 100, newValue: undefined }, ottsub_ui_lang: { newValue: '<invalid>' } }, 'local');
          release({ ottsub_offset: 100, ottsub_ui_lang: 'en', ottsub_hover_pause: false, unexpected: true });
          binding.destroy(); return applied;
        });
        assert.deepEqual(result, [[{ ottsub_ui_lang: 'en', ottsub_hover_pause: false }, { initial: true }]]);
      });
      await check('initial read errors leave live updates working and absent storage is harmless', async () => {
        const result = await page.evaluate(async () => {
          const { bindPopupSettings } = await import('/popup/modules/settings-binding.js');
          const results = [];
          for (const throws of [false, true]) {
            let emit; const applied = [];
            const storage = { local: { get(_, cb) { if (throws) throw Error('offline'); cb({ obsolete: true }); } },
              onChanged: { addListener: fn => { emit = fn; }, removeListener() {} } };
            const binding = bindPopupSettings({ storage, validate: v => v, selectChanges: () => ({ live: true }),
              hasReadError: () => true, apply: v => applied.push(v) });
            emit({ live: { newValue: true } }, 'local'); binding.destroy(); results.push(applied);
          }
          bindPopupSettings({ apply: () => { throw Error('unexpected apply'); } }).destroy();
          return results;
        });
        assert.deepEqual(result, [[{ live: true }], [{ live: true }]]);
      });
      await check('incomplete storage APIs never subscribe when removal is unavailable', async () => {
        const actual = await page.evaluate(async () => {
          const { bindPopupSettings } = await import('/popup/modules/settings-binding.js');
          let subscriptions = 0, reads = 0;
          for (const removeListener of [undefined, true]) {
            const binding = bindPopupSettings({ storage: { local: { get() { reads++; } }, onChanged: {
              addListener() { subscriptions++; }, removeListener } }, selectChanges: () => ({}), apply() {} });
            binding.destroy(); binding.destroy();
          }
          return { subscriptions, reads };
        });
        assert.deepEqual(actual, { subscriptions: 0, reads: 0 });
      });
      await check('one language choice translates once and same-language storage echoes do not repaint', async () => {
        await page.evaluate(() => {
          window.originalUpdateDOM = OTTSubI18n.updateDOM; window.languagePaints = 0;
          OTTSubI18n.updateDOM = function (...args) { languagePaints++; return originalUpdateDOM.apply(this, args); };
        });
        try {
          await page.selectOption('#ui-lang-select', 'en');
          await page.waitForFunction(() => savedSettings.ottsub_ui_lang === 'en' && document.documentElement.lang === 'en');
          const choice = await page.evaluate(() => languagePaints);
          await page.evaluate(() => chrome.storage.local.set({ ottsub_ui_lang: 'en' }));
          assert.deepEqual({ choice, sameEcho: await page.evaluate(() => languagePaints) }, { choice: 1, sameEcho: 1 });
        } finally {
          await page.evaluate(() => { OTTSubI18n.updateDOM = originalUpdateDOM; });
          await page.selectOption('#ui-lang-select', 'he');
        }
      });
      await check('language implementation is available through ESM without a window alias', async () => {
        const actual = await page.evaluate(async () => ({ global: typeof window.applyLanguage,
          module: typeof (await import('/popup/popup.js')).applyLanguage }));
        assert.deepEqual(actual, { global: 'undefined', module: 'function' });
      });
      await check('popup initial read requests setting keys including legacy lock, without unrelated data', async () => {
        const keys = await page.evaluate(() => popupRequestedKeys);
        assert(Array.isArray(keys));
        assert(keys.includes('ottsub_active_sync_target'));
        assert(keys.includes('ottsub_ui_lang'));
        assert(keys.includes('ottsub_lock_position'));
        assert(!keys.some(key => key.startsWith('ottsub_revision_')));
      });
      await check('offset-only changes do not query unrelated style or learning controls', async () => {
        const queried = await page.evaluate(async () => {
          const ids = [], originalId = document.getElementById, originalQuery = document.querySelectorAll;
          document.getElementById = function (id) { ids.push(id); return originalId.call(this, id); };
          document.querySelectorAll = function (query) { ids.push(query); return originalQuery.call(this, query); };
          try { await chrome.storage.local.set({ ottsub_offset: 900 }); await Promise.resolve(); }
          finally { document.getElementById = originalId; document.querySelectorAll = originalQuery; }
          return ids;
        });
        assert(queried.includes('sync-value'));
        assert(!queried.some(id => /scale|spacing|color|blur|hover|bg-box|pos-toggle/.test(id)), JSON.stringify(queried));
      });
      await check('shallow production schema ignores cyclic and invalid values without recursing', async () => {
        const actual = await page.evaluate(() => {
          const values = { ottsub_offset: 300 }; values.self = values; values.ottsub_primary_color = values;
          return OTTSubStorageGuard.validateStorageSchema(values);
        });
        assert.deepEqual(actual, { ottsub_offset: 300 });
      });
      await check('accepted style edits survive a late initial snapshot without a second edited flag', async () => {
        setSaved({ ottsub_ui_lang: 'he', ottsub_primary_scale: 1.2 });
        await page.reload(); await page.waitForFunction(() => typeof releasePopupRead === 'function');
        await page.locator('#btn-primary-scale-inc').evaluate(el => el.click());
        await page.waitForFunction(() => savedSettings.ottsub_primary_scale === 1.05);
        await page.evaluate(() => releasePopupRead());
        assert.equal(await page.locator('#primary-scale-val').textContent(), '105%');
      });
      await check('popup pagehide disconnects its settings UI subscription', async () => {
        const result = await page.evaluate(async () => {
          const before = listeners.length;
          window.dispatchEvent(new PageTransitionEvent('pagehide'));
          const after = listeners.length;
          await chrome.storage.local.set({ ottsub_ui_lang: 'en' });
          return { removed: before - after, lang: document.documentElement.lang };
        });
        assert.deepEqual(result, { removed: 1, lang: 'he' });
      });
    }
  } finally {
    await browser.close();
    const report = { passed: !errors.length, total: cases.length, cases, errors };
    fs.writeFileSync(path.join(artifact, baseline ? 'popup-settings-before.json' : 'popup-settings-after.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (errors.length) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
