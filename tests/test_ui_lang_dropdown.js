/**
 * Test Suite: UI Language Switcher Dropdown (KO, EN, ES, and future expansions)
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Starting UI Language Dropdown Tests ===\n');

// Test 1: Static fallback is English-name order; runtime pins the system locale.
const popupHtml = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf-8');
assert(popupHtml.includes('id="ui-lang-select"'), 'popup.html contains #ui-lang-select');
assert(popupHtml.includes('value="ko"'), 'ui-lang-select contains Korean (ko)');
assert(popupHtml.includes('value="en"'), 'ui-lang-select contains English (en)');
assert(popupHtml.includes('value="es"'), 'ui-lang-select contains Spanish (es)');
const options=[...popupHtml.matchAll(/<option value="([^"]+)" data-english-name="([^"]+)"/g)];
assert.deepStrictEqual(options.map(m=>m[1]),['ar','bn','zh-TW','en','fi','fr','de','he','hi','ja','ko','ms','pt-PT','ru','es','th','tr']);
assert.deepStrictEqual(options.map(m=>m[2]),['Arabic','Bengali','Chinese (Traditional)','English','Finnish','French','German','Hebrew','Hindi','Japanese','Korean','Malay','Portuguese (Portugal)','Russian','Spanish','Thai','Turkish']);
console.log('[PASS] Test 1: Seventeen native language options use an English-name alphabetical fallback');

// Test 2: CSS styling contains .ui-lang-select
const popupCss = fs.readFileSync(path.join(__dirname, '../popup/popup.css'), 'utf-8');
assert(popupCss.includes('.ui-lang-select'), 'popup.css styles .ui-lang-select');
assert(popupCss.includes('.lang-select-wrapper'), 'popup.css styles .lang-select-wrapper');
console.log('[PASS] Test 2: CSS contains .ui-lang-select and .lang-select-wrapper rules');

// Test 3: JavaScript logic connects ui-lang-select to i18n
const popupJs = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf-8');
assert(popupJs.includes('document.getElementById(\'ui-lang-select\')'), 'popup.js retrieves ui-lang-select');
assert(popupJs.includes('uiLangSelect.value = validLang'), 'popup.js synchronizes uiLangSelect with validLang');
assert(popupJs.includes('queuePopupStorageSave(\'ottsub_ui_lang\', chosenLang)'), 'popup.js persists chosenLang to storage');
console.log('[PASS] Test 3: JavaScript connects dropdown to i18n and storage');

// Test 4: Functional verification with i18n module
global.window = global;
global.document = { querySelectorAll: () => [] };
const i18nCode = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf-8');
eval(i18nCode);
const i18n = window.OTTSubI18n;

// Verify switching to Spanish
i18n.setLanguage('es');
assert(i18n.getLanguage() === 'es', 'i18n language is set to es');
assert(i18n.t('ext_subtitle') === 'Sincronización y subtítulos dobles para Netflix', 'Spanish ext_subtitle translated');

// Verify switching to Korean
i18n.setLanguage('ko');
assert(i18n.getLanguage() === 'ko', 'i18n language is set to ko');
assert(i18n.t('ext_subtitle') === '넷플릭스 자막 싱크 & 이중 자막', 'Korean ext_subtitle translated');

// Verify switching to English
i18n.setLanguage('en');
assert(i18n.getLanguage() === 'en', 'i18n language is set to en');
assert(i18n.t('ext_subtitle') === 'Netflix subtitle sync & dual subtitles', 'English ext_subtitle translated');
console.log('[PASS] Test 4: Dynamic language switching across ko, en, and es verified');

console.log('\n========================================');
console.log('Results: 4 / 4 Tests Passed');
console.log('========================================');
console.log('UI LANGUAGE DROPDOWN FULLY VERIFIED!');
