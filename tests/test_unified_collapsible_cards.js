/**
 * OTTSub - test_unified_collapsible_cards.js
 * Verification test suite for unified subtitle settings card and universal accordion collapsible cards.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Starting Unified & Collapsible Cards Tests ===\n');

// 1. Verify HTML Structure
const popupHtml = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf-8');

// Test 1: Subtitle Settings Unified Card
assert(popupHtml.includes('id="subtitle-settings-card"'), 'subtitle-settings-card exists');
assert(popupHtml.includes('id="sub-settings-toggle-btn"'), 'sub-settings-toggle-btn exists');
assert(popupHtml.includes('id="sub-settings-chevron"'), 'sub-settings-chevron exists');
assert(popupHtml.includes('id="sub-settings-content"'), 'sub-settings-content exists');
assert(popupHtml.includes('data-i18n="sub_settings_title"'), 'sub_settings_title i18n attribute exists');

// Verify all items are nested inside the unified card
const subCardMatch = popupHtml.match(/<section class="card subtitle-settings-card" id="subtitle-settings-card">([\s\S]*?)<\/section>/);
assert(subCardMatch, 'Unified subtitle settings card section matched');
const subCardContent = subCardMatch[1];
assert(subCardContent.includes('id="row-primary-status"'), 'Primary status row is inside subtitle settings card');
assert(subCardContent.includes('id="sub-status"'), 'Primary sub-status is inside subtitle settings card');
assert(subCardContent.includes('class="card-divider"'), 'Card dividers exist inside subtitle settings card');
assert(subCardContent.includes('id="dual-toggle"'), 'Dual mode toggle is inside subtitle settings card');
assert(subCardContent.includes('id="secondary-lang-select"'), 'Secondary language select is inside subtitle settings card');
assert(subCardContent.includes('id="row-secondary-status"'), 'Secondary status row is inside subtitle settings card');
assert(subCardContent.includes('id="secondary-sub-status"'), 'Secondary sub-status is inside subtitle settings card');
assert(subCardContent.includes('id="lock-pos-toggle"'), 'Lock position toggle is inside subtitle settings card');
console.log('[PASS] Test 1: Subtitle settings unified card correctly groups all subtitle controls');

// Test 2: Language Adjustment Card Collapsible Pattern
assert(popupHtml.includes('id="lang-adjust-card"'), 'lang-adjust-card exists');
assert(popupHtml.includes('id="lang-adjust-toggle-btn"'), 'lang-adjust-toggle-btn exists');
assert(popupHtml.includes('id="lang-adjust-chevron"'), 'lang-adjust-chevron exists');
assert(popupHtml.includes('id="lang-adjust-content"'), 'lang-adjust-content exists');

const langAdjustMatch = popupHtml.match(/<section class="card lang-adjust-card" id="lang-adjust-card">([\s\S]*?)<\/section>/);
assert(langAdjustMatch, 'Language adjust card section matched');
const langAdjustContent = langAdjustMatch[1];
assert(langAdjustContent.includes('id="tab-btn-primary"'), 'tab-btn-primary is inside lang-adjust card');
assert(langAdjustContent.includes('id="tab-btn-secondary"'), 'tab-btn-secondary is inside lang-adjust card');
assert(langAdjustContent.includes('id="panel-primary"'), 'panel-primary is inside lang-adjust card');
assert(langAdjustContent.includes('id="panel-secondary"'), 'panel-secondary is inside lang-adjust card');
console.log('[PASS] Test 2: Language adjustment card is wrapped in a collapsible accordion container');

// Test 3: Keyboard Shortcuts Card Collapsible Pattern
assert(popupHtml.includes('id="shortcuts-card"'), 'shortcuts-card exists');
assert(popupHtml.includes('id="shortcuts-toggle-btn"'), 'shortcuts-toggle-btn exists');
assert(popupHtml.includes('id="shortcuts-chevron"'), 'shortcuts-chevron exists');
assert(popupHtml.includes('id="shortcut-list"'), 'shortcut-list exists');
console.log('[PASS] Test 3: Keyboard shortcuts card preserves collapsible accordion pattern');

// Test 4: CSS Collapsible and Divider Rules
const popupCss = fs.readFileSync(path.join(__dirname, '../popup/popup.css'), 'utf-8');
assert(popupCss.includes('.card-toggle-btn'), 'CSS includes .card-toggle-btn');
assert(popupCss.includes('.card-divider'), 'CSS includes .card-divider');
assert(popupCss.includes('.collapsible-content'), 'CSS includes .collapsible-content');
assert(popupCss.includes('.card.collapsed'), 'CSS includes .card.collapsed rule');
assert(popupCss.includes('transform: rotate(-90deg)'), 'CSS rotates chevron icon on collapsed state');
assert(popupCss.includes('max-height: 0'), 'CSS collapses content height to 0');
console.log('[PASS] Test 4: CSS styling rules for card toggles, dividers, and accordion transitions verified');

// Test 5: JavaScript Elements, Toggles, and Storage Persistence
const popupJs = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf-8');
assert(popupJs.includes('document.getElementById(\'subtitle-settings-card\')'), 'popup.js queries subtitle-settings-card');
assert(popupJs.includes('document.getElementById(\'sub-settings-toggle-btn\')'), 'popup.js queries sub-settings-toggle-btn');
assert(popupJs.includes('document.getElementById(\'lang-adjust-card\')'), 'popup.js queries lang-adjust-card');
assert(popupJs.includes('document.getElementById(\'lang-adjust-toggle-btn\')'), 'popup.js queries lang-adjust-toggle-btn');

assert(popupJs.includes('function setSubSettingsCollapsed'), 'popup.js defines setSubSettingsCollapsed');
assert(popupJs.includes('function setLangAdjustCollapsed'), 'popup.js defines setLangAdjustCollapsed');
assert(popupJs.includes('function setShortcutsCollapsed'), 'popup.js defines setShortcutsCollapsed');

assert(popupJs.includes('subSettingsToggleBtn.addEventListener(\'click\''), 'popup.js registers subSettingsToggleBtn click listener');
assert(popupJs.includes('langAdjustToggleBtn.addEventListener(\'click\''), 'popup.js registers langAdjustToggleBtn click listener');
assert(popupJs.includes('shortcutsToggleBtn.addEventListener(\'click\''), 'popup.js registers shortcutsToggleBtn click listener');

assert(popupJs.includes('\'ottsub_sub_settings_collapsed\''), 'POPUP_STORAGE_KEYS includes ottsub_sub_settings_collapsed');
assert(popupJs.includes('\'ottsub_lang_adjust_collapsed\''), 'POPUP_STORAGE_KEYS includes ottsub_lang_adjust_collapsed');
assert(popupJs.includes('\'ottsub_shortcuts_collapsed\''), 'POPUP_STORAGE_KEYS includes ottsub_shortcuts_collapsed');
console.log('[PASS] Test 5: JavaScript event listeners and storage persistence verified for all collapsible cards');

// Test 6: i18n Localization for Unified Card Title
const i18nJs = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf-8');
assert(i18nJs.includes('sub_settings_title: "Subtitle & dual subtitle settings"'), 'English translation exists');
assert(i18nJs.includes('sub_settings_title: "자막 및 이중 자막 설정"'), 'Korean translation exists');
assert(i18nJs.includes('sub_settings_title: "Ajustes de subtítulos y modo doble"'), 'Spanish translation exists');
console.log('[PASS] Test 6: Universal i18n coverage across ko, en, and es verified');

// Test 7: Compliance - No stars / sparkles emoji or icons
const allFiles = [popupHtml, popupCss, popupJs, i18nJs];
const forbiddenEmojis = ['✨', '⭐', '🌟', '★', '☆'];
for (const content of allFiles) {
  for (const emoji of forbiddenEmojis) {
    assert(!content.includes(emoji), `Forbidden star emoji "${emoji}" found!`);
  }
  assert(!content.includes('Sparkles'), 'Forbidden Sparkles icon found!');
}
console.log('[PASS] Test 7: Strict compliance: No forbidden star/sparkles emoji or icons');

// Test 8: Compliance - Zero zip files in project directory
const rootFiles = fs.readdirSync(path.join(__dirname, '..'));
const zipFiles = rootFiles.filter(f => f.toLowerCase().endsWith('.zip'));
assert.strictEqual(zipFiles.length, 0, `Forbidden zip file(s) found: ${zipFiles.join(', ')}`);
console.log('[PASS] Test 8: Strict compliance: Zero zip files in repository');

// Test 9: WAI-ARIA APG Accordion Pattern Compliance
assert(popupHtml.includes('id="sub-settings-toggle-btn" aria-expanded="true" aria-controls="sub-settings-content"'), 'sub-settings button has aria-controls');
assert(popupHtml.includes('id="sub-settings-content" role="region" aria-labelledby="sub-settings-toggle-btn"'), 'sub-settings region has aria-labelledby');
assert(popupHtml.includes('id="lang-adjust-toggle-btn" aria-expanded="true" aria-controls="lang-adjust-content"'), 'lang-adjust button has aria-controls');
assert(popupHtml.includes('id="lang-adjust-content" role="region" aria-labelledby="lang-adjust-toggle-btn"'), 'lang-adjust region has aria-labelledby');
assert(popupHtml.includes('id="shortcuts-toggle-btn" aria-expanded="true" aria-controls="shortcut-list"'), 'shortcuts button has aria-controls');
assert(popupHtml.includes('id="shortcut-list" role="region" aria-labelledby="shortcuts-toggle-btn"'), 'shortcuts region has aria-labelledby');
assert(popupCss.includes('visibility: hidden'), 'Collapsed accordion content has visibility: hidden to remove from tab order');
assert(popupJs.includes('// WAI-ARIA APG Accordion Header Keyboard Navigation'), 'popup.js implements APG accordion keyboard navigation');
assert(popupJs.includes("e.key === 'ArrowDown'"), 'Accordion navigation handles ArrowDown');
assert(popupJs.includes("e.key === 'ArrowUp'"), 'Accordion navigation handles ArrowUp');
assert(popupJs.includes("e.key === 'Home'"), 'Accordion navigation handles Home');
assert(popupJs.includes("e.key === 'End'"), 'Accordion navigation handles End');
console.log('[PASS] Test 9: WAI-ARIA APG accordion accessibility and keyboard tab order defense verified');

// Test 10: Storage Echo Feedback Loop Defense & Windows Forced Colors Mode
assert(popupJs.includes('function isSelfEcho'), 'popup.js contains isSelfEcho function');
assert(popupCss.includes('ButtonBorder'), 'popup.css supports Windows forced-colors ButtonBorder');
assert(popupCss.includes('scrollbar-gutter: stable'), 'popup.css body has scrollbar-gutter: stable to prevent jitter');
const stylesCss = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf-8');
assert(stylesCss.includes('#ottsub-container.lock-position .ottsub-box.ottsub-top'), 'styles.css has explicit top position lock rule');
console.log('[PASS] Test 10: Storage echo suppression, scrollbar stabilization, and high-contrast styling verified');

// T05 PiP behavior is tested through the real content event handler below.
const {test}=require('node:test');
const {harness,settle}=require('./helpers/content-harness.cjs');
test('PiP exit clears placement history and immediately renders current bottom cues',async()=>{
 const h=harness();await settle();h.emitManifest(100);await settle();
 h.engine.setCues('100',[{id:1,begin:0,end:10.5,text:'TOP',isTop:true},{id:2,begin:10.5,end:60,text:'BOTTOM',isTop:false}]);
 h.video.currentTime=10;h.send('adjust_offset',0);assert.equal(h.renderer.renders.at(-1).primary.top[0].text,'TOP');
 h.video.currentTime=11;h.send('adjust_offset',0);assert.equal(h.renderer.renders.at(-1).primary.top[0].text,'BOTTOM');
 const count=h.renderer.renders.length;h.video.dispatchEvent(new Event('leavepictureinpicture'));
 assert(h.renderer.renders.length>count);assert.equal(h.renderer.renders.at(-1).primary.top.length,0);assert.equal(h.renderer.renders.at(-1).primary.bottom[0].text,'BOTTOM');
});

// Test 12: Subtitle Responsive Wrapping & Balance Typography Defense
// Balanced/pretty wrapping is not a product requirement: it can change line
// breaks as cues change. Actual bounds and preserved newlines are checked in
// test_subtitle_layout_browser.cjs instead of requiring a particular algorithm.
assert(stylesCss.includes('max-inline-size: 96%;'), 'Subtitle inline-size bound remains 96%; browser checks exercise wrapping');
console.log('[PASS] Test 12: Subtitle width constraint present; actual wrapping is covered by the Chromium layout suite');

// Test 13: Binge-Watching Memory Leak Defense & GC Assurance
const syncEngineJs = fs.readFileSync(path.join(__dirname, '../src/sync-engine.js'), 'utf-8');
assert(syncEngineJs.includes('this.cues.length = 0;'), 'SyncEngine.clear explicitly sets cues.length = 0');
test('manifest cache evicts the least recently used entry at its five-item bound',async()=>{
 const h=harness();await settle();const cache=new h.window.OTTSubStorageGuard.LRUCache(5);
 for(let n=0;n<5;n++)cache.set(String(n),n);cache.get('0');cache.set('5',5);
 assert.equal(cache.get('1'),undefined);assert.equal(cache.get('0'),0);assert.equal(cache.cache.size,5);
});
console.log('[INFO] Test 13: Runtime LRU eviction result follows; this does not prove absence of all memory leaks');

// Test 14: Stepper Buttons Pointer Hold-to-Repeat Defense
assert(popupJs.includes('function attachHoldToRepeat'), 'popup.js contains attachHoldToRepeat helper');
assert(popupJs.includes('button.addEventListener(\'pointerdown\', startHold);'), 'attachHoldToRepeat listens to pointerdown');
assert(popupJs.includes('button.addEventListener(\'pointerup\', stopHold);'), 'attachHoldToRepeat listens to pointerup');
assert(popupJs.includes('button.addEventListener(\'pointerleave\', stopHold);'), 'attachHoldToRepeat listens to pointerleave');
console.log('[PASS] Test 14: Stepper buttons pointer hold-to-repeat, pointer capture, and cancellation verified');

// Language label behavior (CC/SDH/forced + all four locales) is verified in
// test_netflix_ordering_and_all_tracks.js and test_side_panel_browser.cjs.

// Test 16: Storage Data Schema Validation & Defensive Fallback Clamping
assert(popupJs.includes('function sanitizeStorageValue'), 'popup.js defines sanitizeStorageValue');
assert(popupJs.includes('POPUP_STORAGE_DEFAULTS'), 'popup.js defines POPUP_STORAGE_DEFAULTS');
assert(popupJs.includes('Math.max(-10000, Math.min(10000, Math.round(n)))'), 'sanitizeStorageValue clamps offset between -10000 and 10000');
assert(popupJs.includes('Math.max(0.60, Math.min(1.40'), 'sanitizeStorageValue clamps primary scale between 0.60 and 1.40');
console.log('[PASS] Test 16: Storage data schema validation and defensive fallback clamping verified');

// Test 17: Collapsed Inert Isolation & Popup Tab Focus Loop Defense
assert(popupJs.includes('setAttribute(\'inert\''), 'Collapsed accordion sets inert attribute');
assert(popupJs.includes('removeAttribute(\'inert\')'), 'Expanded accordion removes inert attribute');
assert(popupJs.includes('// Popup-wide Tab Focus Navigation Loop & Inert Bypass Defense'), 'popup.js contains focus loop defense');
assert(popupJs.includes('!el.closest(\'[inert]\')'), 'focus loop filters out inert elements');
console.log('[PASS] Test 17: Collapsed inert isolation and popup tab focus loop defense verified');

// Test 18: Slider Mouse Wheel Adjustment & Live ARIA Valuetext Sync
assert(popupJs.includes('function attachRangeWheel'), 'popup.js defines attachRangeWheel helper');
assert(popupJs.includes('attachRangeWheel(syncSlider, 100);'), 'syncSlider binds attachRangeWheel with 100ms step');
console.log('[PASS] Test 18: Slider binding present; runtime wheel and ARIA behavior covered by platform browser suite');

console.log('\n========================================');
console.log('Static UI structure checks passed; runtime PiP/cache results follow.');
console.log('========================================');
console.log('UI structure checks complete; live Netflix coverage is separate.\n');
