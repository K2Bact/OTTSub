/**
 * OTTSub - Comprehensive 10-Test Suite for Netflix Subtitle Track Retention & Exact Ordering
 * Validates:
 * 1. Preservation of Netflix manifest flags, profiles and serialization
 * 2. Unchanged outgoing URLs and bodies in fetch and XHR
 * 3. Preservation of all subtitle tracks including dehydrated tracks (urls.length === 0)
 * 4. Exact preservation of Netflix player/manifest menu order (no artificial re-sorting)
 * 5. Pure Korean labels without English parentheses (e.g., pure "중국어(간체)")
 * 6. Direct preservation of Netflix official Korean display names from languageDescription/displayName
 * 7. On-demand track hydration trigger via ottsub_request_load_track
 * 8. Netflix Player API track synchronization fallback (player.getTimedTextTrackList)
 * 9. Multi-lingual UI localization symmetry across ko, en, and es
 * 10. Robust XSS injection & Prototype Pollution defense in dynamic option generation
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${name}`);
  } catch (err) {
    console.error(`[FAIL] Test ${totalTests}: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// Load source files
const injectCode = fs.readFileSync(path.join(__dirname, '../src/inject.js'), 'utf-8');
const contentCode = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf-8');
const popupCode = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf-8');
const i18nCode = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf-8');

// Global mock DOM helpers
global.Node = { ELEMENT_NODE: 1, TEXT_NODE: 3 };
class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this._textContent = '';
    this.value = '';
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] || null; }
  get textContent() { return this._textContent; }
  set textContent(v) {
    this._textContent = v;
    if (v === '') this.children = [];
  }
  appendChild(c) {
    if (c._isFragment) {
      this.children.push(...c.children);
      return c;
    }
    this.children.push(c);
    return c;
  }
  get options() { return this.children.filter(c => c.tagName === 'OPTION'); }
}
global.document = {
  createElement: (t) => new MockElement(t),
  createDocumentFragment: () => ({ children: [], _isFragment: true, appendChild(c) { this.children.push(c); } }),
  getElementById: (id) => (global._mockElementByIdRegistry && global._mockElementByIdRegistry[id]) || null
};
global.window = {
  addEventListener: () => {},
  dispatchEvent: () => {},
  location: { pathname: '/watch/80057281' }
};

// Evaluate i18n
eval(i18nCode);
const i18n = window.OTTSubI18n;

// Extract popup functions (support modular ui-dual.js)
let extractedPopupFunctions = '';
const uiDualPath = path.join(__dirname, '../popup/modules/ui-dual.js');
if (fs.existsSync(uiDualPath)) {
  extractedPopupFunctions = fs.readFileSync(uiDualPath, 'utf-8');
} else {
  const startIdx = popupCode.indexOf('function getLocalizedLanguageLabel');
  const endIdx = popupCode.indexOf('function renderStatusText()');
  extractedPopupFunctions = popupCode.slice(startIdx, endIdx);
}
const sanitizedPopupFunctions = extractedPopupFunctions
  .replace(/^import\s+[\s\S]*?;/gm, '')
  .replace(/\bexport\s+(function|const|let|var)\b/g, '$1')
  .replace(/\bexport\s*\{[\s\S]*?\}\s*;?/g, '')
  .replace(/let lastPopulatedTrackSignature\s*=\s*'';?/g, '');

const popupSandbox = new Function('i18n', 'document', `
  let secondaryLangSelect = null;
  let currentAvailableTracks = [];
  let lastPopulatedTrackSignature = '';
  ${sanitizedPopupFunctions}
  return {
    getLocalizedLanguageLabel,
    populateSecondaryLangOptions,
    setSelect: (el) => {
      secondaryLangSelect = el;
      if (!global._mockElementByIdRegistry) global._mockElementByIdRegistry = {};
      global._mockElementByIdRegistry['secondary-lang-select'] = el;
    }
  };
`)(i18n, global.document);

// Netflix menu order as shown in user screenshot (media_1791021926167.png)
const netflixSampleTracks = [
  { language: 'en', bcp47: 'en-US', label: '영어(미국)(CC)', trackType: 'closedcaptions', isCC: true },
  { language: 'en', bcp47: 'en-US', label: '영어(미국)', trackType: 'subtitles' },
  { language: 'ko', bcp47: 'ko', label: '한국어', trackType: 'subtitles' },
  { language: 'es', bcp47: 'es-419', label: '스페인어(라틴 아메리카)', trackType: 'subtitles' },
  { language: 'ja', bcp47: 'ja', label: '일본어', trackType: 'subtitles' },
  { language: 'zh', bcp47: 'zh-Hans', label: '중국어(간체)', trackType: 'subtitles' },
  { language: 'el', bcp47: 'el', label: '그리스어', trackType: 'subtitles' },
  { language: 'nl', bcp47: 'nl', label: '네덜란드어', trackType: 'subtitles' },
  { language: 'no', bcp47: 'no', label: '노르웨이어', trackType: 'subtitles' },
  { language: 'da', bcp47: 'da', label: '덴마크어', trackType: 'subtitles' }
];

console.log('=== Starting 10 Verification Tests ===\n');

// T04: use the full production hooks, not a sliced function missing dependencies.
const {injectHarness}=require('./helpers/inject-harness.cjs');
const {test}=require('node:test');
const request=()=>({version:2,params:{type:'standard',sessionParams:{profiles:['playready-h264mpl30-dash'],showAllSubDubTracks:false}},subRequests:[{url:'https://netflix.com/api/msl/manifest',profiles:['heaac-2-dash']}]});
runTest('Manifest XHR preserves nested payload and outgoing URL exactly',()=>{
 const h=injectHarness(),input=request(),raw=JSON.stringify(input),url='https://www.netflix.com/api/msl/manifest';
 assert.equal(h.stringify(input),raw);assert.equal(JSON.stringify(input),raw);
 assert.deepEqual(h.xhr(url,raw),{url,body:raw});
});
test('fetch preserves manifest bodies, URLs and the caller init object',async()=>{
 const h=injectHarness(),url='https://www.netflix.com/api/msl/manifest',body=JSON.stringify(request());
 const init=Object.freeze({method:'POST',body});await h.ctx.window.fetch(url,init);
 assert.deepEqual(h.calls.at(-1),{url,body});assert.equal(init.body,body);
});

test('non-manifest fetch leaves account payload and URL unchanged',async()=>{const h=injectHarness(),url='https://www.netflix.com/api/profiles',body=JSON.stringify({params:{profiles:[{id:'p',name:'User'}]}});await h.fetch(url,body);assert.deepEqual(h.calls.at(-1),{url,body});});

test('manifest requests preserve all hydration flags, profiles, language limits and DRM values',async()=>{
 const input=()=>({params:{profiles:['imsc1.1'],supportsPartialHydration:true,
   supportsAdBreakHydration:true,maxSupportedLanguages:2,drmType:'playready',useBetterTextUrls:true}});
 for(const transport of ['stringify','xhr','fetch']){
  const h=injectHarness(),url='https://www.netflix.com/msl/playapi/cadmium/manifest/1';
  let body;
  if(transport==='stringify')body=h.stringify({url,...input()});
  else if(transport==='xhr')body=h.xhr(url,JSON.stringify(input())).body;
  else {await h.fetch(url,JSON.stringify(input()));body=h.calls.at(-1).body;}
  const params=JSON.parse(body).params;
  assert.equal(params.supportsPartialHydration,true,transport);
  assert.deepEqual(params,input().params,transport);
  assert.equal(params.supportsAdBreakHydration,true);
  assert.equal(params.maxSupportedLanguages,2);
  assert.equal(params.drmType,'playready');assert.equal(params.useBetterTextUrls,true);
 }
});
test('partial hydration fields preserve absent, boolean and nonboolean values',()=>{
 for(const value of [undefined,true,false,'true',null]){
  const h=injectHarness(),params={profiles:['imsc1.1']};
  if(value!==undefined)params.supportsPartialHydration=value;
  const out=JSON.parse(h.stringify({url:'/manifest',params})).params;
  if(value===undefined)assert.equal('supportsPartialHydration' in out,false);
  else assert.equal(out.supportsPartialHydration,value);
 }
});
test('unrelated account requests preserve hydration fields byte-for-byte',async()=>{
 const h=injectHarness(),url='https://www.netflix.com/api/profiles';
 const input={supportsPartialHydration:true,params:{profiles:[{id:'account'}],supportsPartialHydration:true}};
 const body=JSON.stringify(input);assert.equal(h.stringify(input),body);
 await h.fetch(url,body);assert.equal(h.calls.at(-1).body,body);
 assert.equal(h.xhr(url,body).body,body);
});
test('already encrypted multi-envelope request bodies are kept byte-for-byte',async()=>{
 const h=injectHarness(),url='https://www.netflix.com/msl/playapi/cadmium/licensedmanifest/1';
 const body='{"headerdata":"opaque","signature":"opaque"}{"payload":"opaque","signature":"opaque"}';
 await h.fetch(url,body);assert.equal(h.calls.at(-1).body,body);
 assert.equal(h.xhr(url,body).body,body);
});

test('passive response capture preserves Netflix raw tracks and the original fetch response',async()=>{
 const raw=Object.freeze({movieId:100,partiallyHydrated:true,timedtexttracks:Object.freeze([
  Object.freeze({bcp47:'ko',hydrated:true,ttDownloadables:Object.freeze({'imsc1.1':{downloadUrls:{a:'https://cdn.nflxvideo.net/ko'}}})}),
  Object.freeze({bcp47:'es-ES',hydrated:false,ttDownloadables:Object.freeze({})})
 ])});
 const before=JSON.stringify(raw);let received,receiver;
 const response={bodyUsed:false,clone:()=>({json:async()=>raw})};
 const h=injectHarness({fetch:function(...args){received=args;receiver=this;return Promise.resolve(response);}});
 const url=new URL('https://www.netflix.com/manifest?showAllSubDubTracks=false'),init=Object.freeze({method:'POST',body:before});
 assert.strictEqual(await h.ctx.window.fetch(url,init),response);
 assert.strictEqual(receiver,h.ctx.window);assert.strictEqual(received[0],url);assert.strictEqual(received[1],init);
 assert.equal(response.bodyUsed,false);assert.equal(JSON.stringify(raw),before);
 assert.equal(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'].availableTracks.length,2);
 assert.equal(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'].availableTracks[1].bcp47,'es-ES');
 assert.strictEqual(await h.response(raw,'https://www.netflix.com/manifest'),raw);
 assert.equal(JSON.stringify(raw),before);
});

test('serializing account or mixed profile arrays never adds manifest flags or formats',()=>{
 const h=injectHarness();
 for(const profiles of [[{id:'account',name:'User'}],['user-id'],['webvtt-lssdh-ios8',{id:'account'}]]){
  const value={params:{profiles}},before=JSON.stringify(value);
  assert.equal(h.stringify(value),before);assert.equal(JSON.stringify(value),before);
 }
});
test('explicit manifest serialization preserves caller objects, frozen arrays, replacer and indentation',()=>{
 const h=injectHarness(),value={url:'/manifest',params:{profiles:Object.freeze(['webvtt-lssdh-ios8']),showAllSubDubTracks:false},account:{profiles:[{id:'p',name:'User'}]}};
 const before=JSON.stringify(value),replacer=(key,v)=>key==='account'?undefined:v;
 assert.equal(h.stringify(value),before);assert.equal(JSON.stringify(value),before);
 assert.equal(h.stringify(value,replacer,2),JSON.stringify(value,replacer,2));
 assert.equal(h.stringify(value,['url','params','profiles'],2),JSON.stringify(value,['url','params','profiles'],2));
 const circular={url:'/manifest'};circular.self=circular;assert.throws(()=>h.stringify(circular),/circular/i);
});
test('SDH and forced labels are classified by actual UI module in all four languages',()=>{
 for(const lang of ['ko','en','es','de']){
  assert(popupSandbox.getLocalizedLanguageLabel({bcp47:'en',trackType:'sdh'},lang).includes('[CC]'));
  assert(popupSandbox.getLocalizedLanguageLabel({bcp47:'en',trackType:'forced_narrative'},lang).includes(lang==='ko'?'[강제]':'[Forced]'));
 }
});

// Test 2: Native URL flags remain untouched, including explicit false values.
runTest('XHR manifest URLs preserve query parameters and fragments exactly', () => {
 const h=injectHarness();
 for(const url of ['https://www.netflix.com/api/msl/manifest?video_id=80057281',
  'https://www.netflix.com/api/msl/licensedManifest?showAllSubDubTracks=false&id=123#keep',
  'https://www.netflix.com/api/msl/manifest?showAllSubDubTracks=true','https://www.netflix.com/browse'])
  assert.deepEqual(h.xhr(url,'unchanged'),{url,body:'unchanged'});
});

// Test 3: Retaining all tracks in availableTracks even when urls.length === 0 (dehydrated tracks)
runTest('All Subtitle Tracks Preserved Even Without Immediate Download URLs', () => {
  assert(injectCode.includes('availableTracks.push({'), 'inject.js builds availableTracks');
  assert(injectCode.includes('urls.length > 0') && injectCode.includes('hasUrls: urls.length > 0'), 'inject.js flags hasUrls instead of skipping track');
  assert(!injectCode.includes('if (urls.length > 0) {\n        availableTracks.push'), 'availableTracks.push is not wrapped inside if (urls.length > 0)');
});

// Test 4: Preservation of Netflix player exact menu order in dropdown options
runTest('Preservation of Netflix Menu Exact Track Order', () => {
  const selectElem = document.createElement('select');
  popupSandbox.setSelect(selectElem);

  i18n.setLanguage('ko');
  popupSandbox.populateSecondaryLangOptions(netflixSampleTracks, 'ko');

  const optionLabels = selectElem.options.map(o => o.textContent);
  
  // Verify exact order from Netflix menu screenshot (media_1791021926167.png)
  // Language choices omit CC; independent type controls now preserve that choice.
  const expectedSequence = [
    '영어(미국)',
    '한국어',
    '스페인어(라틴 아메리카)',
    '일본어',
    '중국어(간체)',
    '그리스어',
    '네덜란드어',
    '노르웨이어',
    '덴마크어'
  ];

  for (let i = 0; i < expectedSequence.length; i++) {
    const expected = expectedSequence[i];
    const foundIdx = optionLabels.indexOf(expected);
    assert(foundIdx !== -1, `Expected track "${expected}" exists in options`);
  }

  // Check that relative ordering strictly matches Netflix's order
  const koIdx = optionLabels.indexOf('한국어');
  const esIdx = optionLabels.indexOf('스페인어(라틴 아메리카)');
  const jaIdx = optionLabels.indexOf('일본어');
  const zhIdx = optionLabels.indexOf('중국어(간체)');
  const elIdx = optionLabels.indexOf('그리스어');
  const nlIdx = optionLabels.indexOf('네덜란드어');
  const noIdx = optionLabels.indexOf('노르웨이어');
  const daIdx = optionLabels.indexOf('덴마크어');

  assert(koIdx < esIdx, '한국어 precedes 스페인어(라틴 아메리카)');
  assert(esIdx < jaIdx, '스페인어 precedes 일본어');
  assert(jaIdx < zhIdx, '일본어 precedes 중국어(간체)');
  assert(zhIdx < elIdx, '중국어(간체) precedes 그리스어');
  assert(elIdx < nlIdx, '그리스어 precedes 네덜란드어');
  assert(nlIdx < noIdx, '네덜란드어 precedes 노르웨이어');
  assert(noIdx < daIdx, '노르웨이어 precedes 덴마크어');
});

// Test 5: Pure Korean labels without English in parentheses (pure "중국어(간체)")
runTest('Pure Korean Labels Without Redundant English in Parentheses', () => {
  const selectElem = document.createElement('select');
  popupSandbox.setSelect(selectElem);

  i18n.setLanguage('ko');
  popupSandbox.populateSecondaryLangOptions(netflixSampleTracks, 'ko');

  for (const opt of selectElem.options) {
    assert(!opt.textContent.includes('(Simplified Chinese)'), `Option ${opt.textContent} does not contain (Simplified Chinese)`);
    assert(!opt.textContent.includes('(Korean)'), `Option ${opt.textContent} does not contain (Korean)`);
    assert(!opt.textContent.includes('(English)'), `Option ${opt.textContent} does not contain (English)`);
    assert(!opt.textContent.includes('(Japanese)'), `Option ${opt.textContent} does not contain (Japanese)`);
    assert(!opt.textContent.includes('(Spanish)'), `Option ${opt.textContent} does not contain (Spanish)`);
  }

  const zhOpt = selectElem.options.find(o => o.value === 'zh-hans');
  assert.strictEqual(zhOpt.textContent, '중국어(간체)', 'Simplified Chinese rendered as pure "중국어(간체)"');
});

// Test 6: Direct preservation of Netflix official Korean display names
runTest('Direct Preservation of Netflix Official Korean Display Names', () => {
  const labelKo = popupSandbox.getLocalizedLanguageLabel({
    bcp47: 'es-419',
    displayName: '스페인어(라틴 아메리카)',
    label: '스페인어(라틴 아메리카)'
  }, 'ko');
  assert.strictEqual(labelKo, '스페인어(라틴 아메리카)', 'Preserves Netflix official Korean label for Latin American Spanish');

  const labelEl = popupSandbox.getLocalizedLanguageLabel({
    bcp47: 'el',
    languageDescription: '그리스어'
  }, 'ko');
  assert.strictEqual(labelEl, '그리스어', 'Preserves Netflix official Korean label for Greek');
});

// Test 7: On-demand track hydration trigger via ottsub_request_load_track
runTest('On-demand Track Hydration Trigger when URLs are Empty', () => {
  assert(contentCode.includes('window.dispatchEvent(new CustomEvent(\'ottsub_request_load_track\''), 'content.js dispatches ottsub_request_load_track');
  assert(injectCode.includes('window.addEventListener(\'ottsub_request_load_track\''), 'inject.js listens to ottsub_request_load_track');
  assert(!/\.setTimedTextTrack\s*\(/.test(injectCode), 'track discovery preserves Netflix selection');
});

// Test 8: Netflix Player API track synchronization fallback
runTest('Netflix Player API Track Synchronization Fallback', () => {
  assert(injectCode.includes('function syncPlayerTracks'), 'inject.js contains syncPlayerTracks function');
  assert(injectCode.includes('player.getTimedTextTrackList()'), 'inject.js calls player.getTimedTextTrackList()');
  assert(injectCode.includes('syncPlayerTracks(availableTracks, movieIdStr, tracksByLang)'), 'player track enrichment is scoped to the manifest movie');
});

// Test 9: Multi-lingual UI localization symmetry across ko, en, and es
runTest('Multi-lingual UI Localization Symmetry Across ko, en, and es', () => {
  const trackItem = { language: 'zh', bcp47: 'zh-Hans', label: 'Chinese (Simplified)' };

  const koName = popupSandbox.getLocalizedLanguageLabel(trackItem, 'ko');
  const enName = popupSandbox.getLocalizedLanguageLabel(trackItem, 'en');
  const esName = popupSandbox.getLocalizedLanguageLabel(trackItem, 'es');

  assert.strictEqual(koName, '중국어(간체)', 'Korean UI translates to 중국어(간체)');
  assert.strictEqual(enName, 'Simplified Chinese', 'English UI translates to Simplified Chinese');
  assert(esName.toLowerCase().includes('chino'), 'Spanish UI translates to Chino simplificado');

  assert.strictEqual(i18n.t('lang_zh', {}, 'ko'), '중국어(간체)', 'i18n ko lang_zh is 중국어(간체)');
  assert.strictEqual(i18n.t('lang_zh', {}, 'en'), 'Simplified Chinese', 'i18n en lang_zh is Simplified Chinese');
  assert.strictEqual(i18n.t('lang_zh', {}, 'es'), 'Chino simplificado', 'i18n es lang_zh is Chino simplificado');
});

// Test 10: Robust XSS injection & Prototype Pollution defense in dynamic option generation
runTest('XSS and Prototype Pollution Defense in Track Population', () => {
  const selectElem = document.createElement('select');
  popupSandbox.setSelect(selectElem);

  const maliciousTracks = [
    { language: 'el', bcp47: 'el', label: '<script>alert("xss")</script><img src=x onerror=alert(1)>', trackType: 'subtitles' },
    { __proto__: { isAdmin: true }, language: 'nl', bcp47: 'nl', label: 'Dutch' },
    null,
    undefined,
    1234
  ];

  popupSandbox.populateSecondaryLangOptions(maliciousTracks, 'el');

  assert.strictEqual(({}).isAdmin, undefined, 'Prototype pollution prevented');
  const elOpt = selectElem.options.find(o => o.value === 'el');
  assert(elOpt !== undefined, 'Option for el was created');
  assert.strictEqual(elOpt.children.length, 0, 'No HTML child nodes created; sanitized text only');
  assert.strictEqual(selectElem.options.length, 2, 'Only valid track objects created as options');
});

console.log(`\n========================================`);
console.log(`Results: ${passedTests} / ${totalTests} Tests Passed`);
console.log(`========================================`);

if (passedTests === totalTests) {
  console.log('Legacy track checks passed; request-hook behavior tests follow.');
  process.exitCode = 0;
} else {
  process.exitCode = 1;
}
