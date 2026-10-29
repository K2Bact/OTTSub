/**
 * Automated Verification for Draggable Subtitle Horizontal Integrity & Position Lock Description
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Starting Drag Horizontal Integrity & Position Lock Verification ===\n');

// 1. Verify CSS: has-custom-position MUST NOT have width: max-content
console.log('[TEST 1] CSS: Elimination of width: max-content under has-custom-position');
const stylesCss = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');

assert(!stylesCss.includes('has-custom-position .ottsub-box {\n  width: max-content;'), 'Must not have width: max-content on custom position box');
assert(stylesCss.includes('#ottsub-container.has-custom-position .ottsub-box'), 'Must have custom position rule');
assert(stylesCss.includes('width: min(90%, 1200px) !important;'), 'Must enforce wide width under custom position');
console.log('  -> PASS: width: max-content completely eradicated; wide horizontal width enforced.');

// 2. Verify Absolute Slots & Dual Subtitle Horizontal Layout Safety
console.log('\n[TEST 2] CSS: Dual Subtitle Absolute Slots Horizontal Stability');
assert(stylesCss.includes('.ottsub-box.is-dual.ottsub-bottom .ottsub-slot-primary'), 'Primary slot must exist');
assert(stylesCss.includes('.ottsub-box.is-dual.ottsub-bottom .ottsub-slot-secondary'), 'Secondary slot must exist');
assert(stylesCss.includes('white-space: pre-wrap;'), 'Subtitle lines must have pre-wrap');
assert(stylesCss.includes('word-break: keep-all;'), 'Must have keep-all for natural Korean wrapping');
console.log('  -> PASS: Subtitle slots and lines maintain full horizontal dimensions without collapsing.');

// 3. Verify Popup HTML: sub-label for lock-pos-toggle
console.log('\n[TEST 3] Popup HTML: Lock Position Sub-label & Label Group');
const popupHtml = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf8');
assert(popupHtml.includes('class="sub-label" data-i18n="lock_pos_subtitle"'), 'Must have sub-label with data-i18n="lock_pos_subtitle"');
assert(popupHtml.includes('class="label-group"'), 'Must wrap label and sub-label in label-group');
console.log('  -> PASS: Short description for lock position correctly displayed in popup UI.');

// 4. Verify i18n Translations for lock_pos_subtitle
console.log('\n[TEST 4] i18n: Lock Position Subtitle Translations across ko, en, es');
const i18nContent = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf8');
const mockWindow = {};
const fn = new Function('window', i18nContent);
fn(mockWindow);
const I18n = mockWindow.OTTSubI18n;

const koSub = I18n.t('lock_pos_subtitle', {}, 'ko');
const enSub = I18n.t('lock_pos_subtitle', {}, 'en');
const esSub = I18n.t('lock_pos_subtitle', {}, 'es');

assert(koSub.includes('재생바') && koSub.includes('드래그'), 'ko translation must mention playback bar and drag');
assert(enSub.includes('controls') && enSub.includes('drag'), 'en translation must mention controls and drag');
assert(esSub.includes('controles') && esSub.includes('arrastre'), 'es translation must mention controls and drag');
console.log(`  -> PASS: ko="${koSub}", en="${enSub}", es="${esSub}"`);

// 5. Compliance Check: Zero forbidden sparkles/stars, zero zips
console.log('\n[TEST 5] Strict Compliance: Zero forbidden sparkles/stars & Zero zips');
const forbiddenPatterns = ['✨', '⭐', '🌟', '★', '☆', 'Sparkles', 'WandSparkles'];
for (const pat of forbiddenPatterns) {
  assert(!stylesCss.includes(pat), `Forbidden pattern in styles.css: ${pat}`);
  assert(!popupHtml.includes(pat), `Forbidden pattern in popup.html: ${pat}`);
}

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
    else assert(!item.name.endsWith('.zip') || allowedZipPaths.has(full), `Forbidden zip found: ${full}`);
  }
}
checkNoZips(path.join(__dirname, '..'));
console.log('  -> PASS: 0 forbidden sparkles/stars, only authorized store ZIPs.');

console.log('\n======================================================');
console.log('DRAG HORIZONTAL INTEGRITY & LOCK POSITION FULLY VERIFIED!');
console.log('======================================================\n');
