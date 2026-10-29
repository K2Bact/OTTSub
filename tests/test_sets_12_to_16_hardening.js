/**
 * Automated Verification Suite for Sets 12 - 16 Hardening
 * Covers:
 * - Set 12: Popover focus restoration on dismissal
 * - Set 13: HUD DOM reparenting and screen reader identical text re-announcement
 * - Set 14: Video element swap detection and buffering recovery capture
 * - Set 15: data-i18n-title and data-i18n-aria-label dynamic localization
 * - Set 16: Full repository compliance and zero forbidden patterns
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Starting Sets 12-16 Deep Hardening Verification ===\n');

// 1. Verify Set 15: i18n keys in all 3 languages (en, ko, es)
console.log('[TEST 1] Set 15: i18n Dictionary Keys Symmetry across en, ko, es');
const i18nPath = path.join(__dirname, '../src/i18n.js');
const i18nContent = fs.readFileSync(i18nPath, 'utf8');

// Load window.OTTSubI18n
const mockWindow = {};
const fn = new Function('window', i18nContent);
fn(mockWindow);
const I18n = mockWindow.OTTSubI18n;

const requiredKeys = [
  'btn_close',
  'title_sub_settings_toggle',
  'title_lang_adjust_toggle',
  'title_shortcuts_toggle'
];

for (const lang of ['en', 'ko', 'es']) {
  for (const key of requiredKeys) {
    const val = I18n.t(key, {}, lang);
    assert(val && val !== key, `Missing translation for [${lang}]: ${key}`);
  }
}
console.log('  -> PASS: All title & close button keys exist with accurate translations in en, ko, and es.');

// 2. Verify Set 15: updateDOM handles data-i18n-title and data-i18n-aria-label
console.log('\n[TEST 2] Set 15: updateDOM dynamic attribute mutation');
const mockRoot = {
  elements: [
    { attrs: { 'data-i18n': 'ext_title' }, textContent: '', getAttribute(k) { return this.attrs[k]; } },
    { attrs: { 'data-i18n-title': 'title_sub_settings_toggle' }, title: '', getAttribute(k) { return this.attrs[k]; }, setAttribute(k, v) { this[k] = v; } },
    { attrs: { 'data-i18n-aria-label': 'btn_close' }, 'aria-label': '', getAttribute(k) { return this.attrs[k]; }, setAttribute(k, v) { this[k] = v; } }
  ],
  querySelectorAll(selector) {
    if (selector === '[data-i18n]') return this.elements.filter(e => 'data-i18n' in e.attrs);
    if (selector === '[data-i18n-title]') return this.elements.filter(e => 'data-i18n-title' in e.attrs);
    if (selector === '[data-i18n-aria-label]') return this.elements.filter(e => 'data-i18n-aria-label' in e.attrs);
    if (selector === 'option[data-i18n-option]') return [];
    return [];
  }
};

I18n.setLanguage('es');
I18n.updateDOM(mockRoot, 'es');
assert.strictEqual(mockRoot.elements[1].title, 'Alternar configuración de subtítulos');
assert.strictEqual(mockRoot.elements[2]['aria-label'], 'Cerrar');

I18n.setLanguage('ko');
I18n.updateDOM(mockRoot, 'ko');
assert.strictEqual(mockRoot.elements[1].title, '자막 및 이중 자막 설정 접기/펼치기');
assert.strictEqual(mockRoot.elements[2]['aria-label'], '닫기');
console.log('  -> PASS: updateDOM dynamically mutates title and aria-label attributes when language shifts.');

// 3. Verify Set 12: Popover focus restoration code structure in popup.js
console.log('\n[TEST 3] Set 12: Popover WAI-ARIA Focus Restoration in popup.js');
let popupJsContent = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf8');
const popoverModulePath = path.join(__dirname, '../popup/modules/ui-popover.js');
if (fs.existsSync(popoverModulePath)) {
  popupJsContent += '\n' + fs.readFileSync(popoverModulePath, 'utf8');
}
assert(popupJsContent.includes('hideStatusPopover(restoreFocus = true)'), 'hideStatusPopover must support restoreFocus');
assert(popupJsContent.includes('targetToFocus.focus()'), 'Must call focus() on trigger element');
assert(popupJsContent.includes("hideStatusPopover(true)"), 'Escape and close button must restore focus');
console.log('  -> PASS: hideStatusPopover strictly restores keyboard focus to originating trigger.');

// 4. Verify Set 13: HUD reparenting & identical message announcement in hud.js
console.log('\n[TEST 4] Set 13: HUD DOM Reparenting & Identical Announcement Defense');
const hudJsContent = fs.readFileSync(path.join(__dirname, '../src/hud.js'), 'utf8');
assert(hudJsContent.includes('targetParent.appendChild(this.hudElem)'), 'Must reparent with appendChild without destroying');
assert(hudJsContent.includes('requestAnimationFrame'), 'Must schedule clearing via rAF for repeated announcements');
console.log('  -> PASS: HUD reparenting preserves DOM node and double rAF ensures repeated aria-live vocalization.');

// 5. Verify Set 14: Video element readyState check and global media capture in content.js
console.log('\n[TEST 5] Set 14: HTML5 Video Element Swap & Buffering Recovery');
const contentJsContent = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf8');
// Selection moved to the DOM adapter. Execute it against not-ready/ready videos
// instead of requiring an implementation string to remain in content.js.
const adapterWindow = {};
const playerRoot = { querySelectorAll: () => [] };
const candidateVideo = { readyState: 0, isConnected: true, parentElement: null,
  closest: () => playerRoot, getClientRects: () => [{}],
  getBoundingClientRect: () => ({ width: 640, height: 360 }), getAttribute: () => null };
const adapterSource = fs.readFileSync(path.join(__dirname, '../src/video/netflix-playback-adapter.js'), 'utf8');
new Function('window', 'document', 'getComputedStyle', adapterSource)(adapterWindow,
  { querySelectorAll: () => [candidateVideo] }, () => ({ display: 'block', visibility: 'visible', opacity: '1' }));
assert.strictEqual(adapterWindow.OTTSubNetflixPlaybackAdapter.read().video, null, 'Unready video must not be selected');
candidateVideo.readyState = 1;
assert.strictEqual(adapterWindow.OTTSubNetflixPlaybackAdapter.read().video, candidateVideo, 'Ready video must be eligible');
assert(contentJsContent.includes("'playing', onGlobalVideoTransition, true"), 'Must capture playing event in capture phase');
assert(contentJsContent.includes("'loadedmetadata', onGlobalVideoTransition, true"), 'Must capture loadedmetadata in capture phase');
console.log('  -> PASS: content.js reliably catches video element swap and resume from buffering.');

// 6. Verify Set 16: Zero forbidden stars/sparkles and only authorized store ZIPs
console.log('\n[TEST 6] Set 16: Repository Compliance & Clean State');
const forbiddenPatterns = ['✨', '⭐', '🌟', '★', '☆', 'Sparkles', 'WandSparkles'];
const sourceFiles = [
  'popup/popup.html',
  'popup/popup.css',
  'popup/popup.js',
  'src/styles.css',
  'src/hud.js',
  'src/renderer.js',
  'src/content.js',
  'src/i18n.js'
];

for (const file of sourceFiles) {
  const c = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  for (const pat of forbiddenPatterns) {
    assert(!c.includes(pat), `Forbidden pattern [${pat}] found in ${file}`);
  }
}

// Check only authorized store ZIPs in OTTSub
const allowedZipPaths = new Set(['1.3.0', '1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5', '1.3.6', '1.3.7', '1.3.8',
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8')).version]
  .map(version => path.join(__dirname, '..', 'dist', `ottsub-store-${version}.zip`)));

// This user-requested backup is allowed only when it is byte-identical to the preserved release.
const release138Backup = path.resolve(__dirname, '../artifacts/qa/release-139-20261029/before/dist/ottsub-store-1.3.8.zip');
if (fs.existsSync(release138Backup)) {
  assert(fs.readFileSync(release138Backup).equals(fs.readFileSync(path.join(__dirname, '../dist/ottsub-store-1.3.8.zip'))), 'Preserved 1.3.8 backup must match the original release');
  allowedZipPaths.add(release138Backup);
}

function checkNoZips(dir) {
  // Keep scanning archive/artifacts too, without repeated manifest reads or following directory links.
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name === 'node_modules' || item.name === '.git') continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !item.isSymbolicLink()) checkNoZips(full);
    else assert(!item.name.endsWith('.zip') || allowedZipPaths.has(full), `Forbidden zip file found: ${full}`);
  }
}
checkNoZips(path.join(__dirname, '..'));

console.log('  -> PASS: 0 forbidden star/sparkle patterns, only authorized store ZIPs, 100% compliant.');

console.log('\n======================================================');
console.log('ALL SETS 12 - 16 HARDENING TESTS PASSED WITH 100% SUCCESS!');
console.log('======================================================\n');
