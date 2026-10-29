const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { harness, settle } = require('./helpers/content-harness.cjs');
const root = path.resolve(__dirname, '..');
function load(file, extras = {}) {
  const context = vm.createContext({ window: {}, ...extras });
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  return context;
}

test('different rejected tokens get bounded cooldown recovery; same token never loops', () => {
  let now = 0, reads = 0;
  const Recovery = load('src/network/track-recovery.js').window.OTTSubTrackRecovery;
  const recovery = new Recovery(32, () => now), key = recovery.key(1, 'secondary', 'es-es', 'normal');
  const read = () => reads++;
  assert(recovery.refresh(key, ['a'], read));
  now = 9999; assert.equal(recovery.refresh(key, ['b'], read), false);
  recovery.reject(key, ['b']); assert(recovery.pending(key, ['b']));
  assert.deepEqual([...recovery.freshUrls(key, ['a', 'b', 'c'])], ['c']);
  now = 10000; assert(recovery.refresh(key, ['b'], read));
  now = 20000; assert.equal(recovery.refresh(key, ['b'], read), false);
  assert(recovery.refresh(key, ['c'], read));
  now = 30000; assert.equal(recovery.refresh(key, ['d'], read), false);
  assert.equal(recovery.pending(key, ['d']), false); assert.equal(reads, 3);
  assert(recovery.refresh(recovery.key(1, 'secondary', 'de', 'normal'), ['a'], read));
  assert(recovery.refresh(recovery.key(1, 'primary', 'es-es', 'normal'), ['a'], read));
  assert(recovery.refresh(recovery.key(1, 'secondary', 'es-es', 'cc'), ['a'], read));
  recovery.clear(); assert(recovery.refresh(key, ['a'], read));
});

test('provider locale preserves source names without merging regional/CC identities', () => {
  const context = vm.createContext({ window: {}, Intl, console });
  const source = fs.readFileSync(path.join(root, 'popup/modules/ui-dual.js'), 'utf8')
    .replace(/^import .*;\s*$/gm, '').replace(/export /g, '');
  vm.runInContext(source + '\nwindow.label=getLocalizedLanguageLabel;', context);
  const label = context.window.label;
  for (const [locale, text] of Object.entries({ ko: '스페인어', en: 'Spanish', es: 'Español', de: 'Spanisch', ja: 'スペイン語', ar: 'الإسبانية', hi: 'स्पैनिश' })) {
    const track = { bcp47: 'es-ES', label: text, labelLocale: locale };
    assert.equal(label(track, locale), text); assert.equal(track.bcp47, 'es-ES');
  }
  assert.equal(label({ bcp47: 'en-US', label: 'English', labelLocale: 'en-US' }, 'en'), 'English');
  assert.match(label({ bcp47: 'es-ES', label: 'Español', labelLocale: 'es', isCC: true }, 'es'), /^Español.*CC/);
  assert.equal(label({ bcp47: 'es-ES', label: 'Spanisch', labelLocale: 'de' }, 'en'), 'Spanish');
  assert.notEqual(label({ bcp47: 'pt-PT', label: 'pt-PT' }, 'en'), label({ bcp47: 'pt-BR' }, 'en'));
  assert.notEqual(label({ bcp47: 'es-419' }, 'en'), label({ bcp47: 'es-ES' }, 'en'));
  assert.notEqual(label({ bcp47: 'es-ES', label: '英语', labelLocale: 'en' }, 'en'), '英语');
  assert.notEqual(label({ bcp47: 'es-ES', label: '西班牙語' }, 'ja'), '西班牙語');
  assert.equal(label({ bcp47: 'es-ES', label: '西班牙語', labelLocale: 'ja' }, 'ja'), '西班牙語');
});

test('tab activation clears stale status immediately and rejects the old response', () => {
  const updates = [], callbacks = [], listeners = new Set(), timers = new Map();
  let currentTab = 10, id = 0;
  const chrome = { runtime: { getManifest: () => ({ version_name: 'current' }) },
    windows: { getCurrent: callback => callback({ id: 1 }) },
    tabs: { query: (_, callback) => callback([{ id: currentTab, url: 'https://www.netflix.com/watch/100' }]),
      sendMessage: (tabId, _, callback) => callbacks.push({ tabId, callback }),
      onActivated: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) } } };
  const context = vm.createContext({ chrome, window: { addEventListener() {} },
    setTimeout: fn => { timers.set(++id, fn); return id; }, clearTimeout: key => timers.delete(key),
    setInterval: () => ++id, clearInterval() {} });
  vm.runInContext(fs.readFileSync(path.join(root, 'popup/modules/status-connection.js'), 'utf8')
    .replace('export function', 'function') + '\nwindow.start=startStatusConnection;', context);
  const connection = context.window.start(value => updates.push(value));
  assert.equal(callbacks[0].tabId, 10);
  currentTab = 20; for (const fn of listeners) fn({ windowId: 1, tabId: 20 });
  assert.equal(updates.at(-1).state, 'status_waiting'); assert.equal(updates.at(-1).response, null);
  assert.equal(callbacks.at(-1).tabId, 20);
  callbacks[0].callback({ build: 'current', movieId: 'old' });
  assert.equal(updates.length, 1);
  callbacks[1].callback({ build: 'current', movieId: 'new' });
  assert.equal(updates.at(-1).response.movieId, 'new');
  for (const fn of listeners) fn({ windowId: 2, tabId: 30 });
  assert.equal(callbacks.length, 2);
  connection.stop(); assert.equal(listeners.size, 0); assert.equal(timers.size, 0);
  connection.poll(); assert.equal(callbacks.length, 2);
});

test('owner mismatch blocks scheduled and manual rendering, then verified match permits recovery', async () => {
  const h = harness(); await settle(); h.emitManifest(100); await settle();
  assert(h.send('getStatus').hasCues);
  const read = h.window.OTTSubNetflixPlaybackAdapter.read;
  let mismatch = true;
  h.window.OTTSubNetflixPlaybackAdapter.read = () => ({ ...read(), episodeMismatch: mismatch });
  h.tick(); assert.equal(h.send('getStatus').suppressionReason, 'episode-owner-mismatch');
  h.send('set_offset', 100); h.send('set_primary_scale', 1.2);
  assert.equal(h.renderer.renders.length, 0);
  mismatch = false; h.tick();
  assert.notEqual(h.send('getStatus').suppressionReason, 'episode-owner-mismatch');
  h.navigate(200); assert.equal(h.send('getStatus').movieId, '200');
});

test('all seven UI languages have the physical keyboard position/slider explanation', () => {
  const i18n = load('src/i18n.js', { navigator: { language: 'en' }, document: {} }).window.OTTSubI18n;
  for (const locale of ['ko', 'en', 'es', 'de', 'ja', 'ar', 'hi']) {
    const text = i18n.t('keyboard_layout_help', {}, locale);
    assert(text.length > 40); assert.notEqual(text, 'keyboard_layout_help');
  }
});
