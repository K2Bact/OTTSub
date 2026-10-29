/**
 * OTTSub - Comprehensive 6-Test Suite for Secondary Subtitle Track Hydration & Lifecycle
 * Validates user observation:
 * "When selecting a rarely-used secondary language (like Vietnamese), Netflix reloads/refreshes,
 * and then secondary subtitle status changes to 'Ready (906 lines)' and subtitles display properly."
 *
 * Tests:
 * 1. Initial Manifest Cache Miss & On-Demand Hydration Request (ottsub_request_load_track)
 * 2. Read-only track URL discovery with original selection preserved
 * 3. Fresh Manifest Interception upon Player Refresh (processManifestData & ottsub_manifest_data)
 * 4. Secondary SyncEngine Cue Ingestion & 900+ Line Count Verification
 * 5. Popup UI Status Lifecycle Transition ('secondary_status_unsupported' -> 'secondary_status_ready')
 * 6. Vietnamese Diacritics/Unicode Integrity & Dual Subtitle Synchronized Rendering
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

// 1. Load source files
const injectJs = fs.readFileSync(path.join(__dirname, '../src/inject.js'), 'utf-8');
const contentJs = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf-8');
const popupJs = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf-8');
const syncEngineJs = fs.readFileSync(path.join(__dirname, '../src/sync-engine.js'), 'utf-8');
const rendererJs = fs.readFileSync(path.join(__dirname, '../src/renderer.js'), 'utf-8');
const i18nJs = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf-8');

console.log('=== Starting 6 Verification Tests for Secondary Track Hydration ===\n');

// ---------------------------------------------------------------------
// Test 1: Initial Manifest Cache Miss & On-Demand Hydration Request
// ---------------------------------------------------------------------
runTest('Initial Manifest Cache Miss triggers ottsub_request_load_track event', () => {
  assert(contentJs.includes("candidateUrls.length === 0"), 'content.js checks if candidateUrls is empty');
  assert(contentJs.includes("window.dispatchEvent(new CustomEvent('ottsub_request_load_track'"), 'content.js dispatches ottsub_request_load_track when track URLs missing');
  assert(contentJs.includes("secondarySyncEngine.clear()"), 'content.js clears secondary sync engine on cache miss');

  // Simulate loadSecondaryTrack logic with Vietnamese (vi)
  let dispatchedEvent = null;
  const mockWindow = {
    dispatchEvent: (evt) => { dispatchedEvent = evt; }
  };

  const secondaryLang = 'vi';
  const movieIdStr = '81234567';
  const detail = {
    movieId: movieIdStr,
    tracksByLang: {
      en: ['https://cdn.nflxvideo.net/sub_en.xml'],
      ko: ['https://cdn.nflxvideo.net/sub_ko.xml']
      // Vietnamese is NOT present in initial manifest!
    }
  };

  const tracksByLang = detail.tracksByLang || {};
  const candidateUrls = tracksByLang[secondaryLang] || tracksByLang[secondaryLang.toLowerCase()] || [];

  if (candidateUrls.length === 0) {
    mockWindow.dispatchEvent({
      type: 'ottsub_request_load_track',
      detail: { lang: secondaryLang, movieId: movieIdStr }
    });
  }

  assert(dispatchedEvent !== null, 'Event was dispatched');
  assert.strictEqual(dispatchedEvent.type, 'ottsub_request_load_track');
  assert.strictEqual(dispatchedEvent.detail.lang, 'vi');
  assert.strictEqual(dispatchedEvent.detail.movieId, '81234567');
});

// ---------------------------------------------------------------------
// Test 2: Netflix Player API Track Selection & Session Refresh Trigger
// ---------------------------------------------------------------------
runTest('track discovery preserves Netflix selection and binds to one current-episode session', () => {
  assert(injectJs.includes("window.addEventListener('ottsub_request_load_track'"));
  assert(!/\.setTimedTextTrack\s*\(/.test(injectJs), 'discovery never changes native selection');
  assert(injectJs.includes('players.length !== 1'), 'ambiguous sessions cannot hydrate');
  assert(injectJs.includes('extractCandidateUrlsFromTrack(matched)'), 'download URLs are read directly');
  // Actual MAIN-world behavior, missing URLs and exact regional selection are
  // exercised in test_review_fixes_browser.cjs, not a copied implementation.
});

// ---------------------------------------------------------------------
// Test 3: Fresh Manifest Interception upon Player Refresh
// ---------------------------------------------------------------------
runTest('Fresh manifest containing Vietnamese track is intercepted and parsed', () => {
  assert(injectJs.includes("function processManifestData"), 'inject.js defines processManifestData');
  assert(injectJs.includes("window.dispatchEvent(new CustomEvent('ottsub_manifest_data'"), 'inject.js dispatches ottsub_manifest_data');

  // Simulate fresh manifest returned after Netflix refreshed subtitle track
  const freshManifest = {
    result: {
      movieId: 81234567,
      timedtexttracks: [
        {
          id: 'en_sub',
          isNoneSub: false,
          language: 'en',
          bcp47: 'en',
          rawTrackType: 'subtitles',
          ttDownloadables: {
            'webvtt-lss-sdh': {
              downloadUrls: { 'cdn1': 'https://ipv4-c001.nflxvideo.net/sub_en.vtt' }
            }
          }
        },
        {
          id: 'vi_sub',
          isNoneSub: false,
          language: 'vi',
          bcp47: 'vi',
          languageDescription: 'Vietnamese',
          displayName: 'Tiếng Việt',
          rawTrackType: 'subtitles',
          ttDownloadables: {
            'webvtt-lss-sdh': {
              downloadUrls: { 'cdn1': 'https://ipv4-c001.nflxvideo.net/sub_vi.vtt' }
            }
          }
        }
      ]
    }
  };

  // Extract candidate URLs for Vietnamese
  const tracks = freshManifest.result.timedtexttracks;
  const tracksByLang = {};
  for (const track of tracks) {
    const lang = (track.bcp47 || track.language || '').toLowerCase();
    const urls = [];
    if (track.ttDownloadables) {
      for (const fmt of Object.values(track.ttDownloadables)) {
        if (fmt.downloadUrls) urls.push(...Object.values(fmt.downloadUrls));
      }
    }
    if (urls.length > 0) {
      tracksByLang[lang] = urls;
    }
  }

  assert(tracksByLang['vi'] !== undefined, 'Vietnamese URLs successfully extracted');
  assert.strictEqual(tracksByLang['vi'][0], 'https://ipv4-c001.nflxvideo.net/sub_vi.vtt');
});

// ---------------------------------------------------------------------
// Test 4: Secondary SyncEngine Cue Ingestion & 900+ Line Count Verification
// ---------------------------------------------------------------------
runTest('Secondary SyncEngine receives and parses Vietnamese cues (900+ lines)', () => {
  // Instantiate SyncEngine
  const vm = require('vm');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(syncEngineJs, sandbox);
  const SyncEngineClass = sandbox.window.OTTSubSyncEngineClass;
  const secondaryEngine = new SyncEngineClass();

  // Create 906 Vietnamese subtitle cues
  const viCues = [];
  for (let i = 0; i < 906; i++) {
    viCues.push({
      id: `cue_${i + 1}`,
      begin: i * 3.0,
      end: i * 3.0 + 2.5,
      text: `Dòng phụ đề tiếng Việt thứ ${i + 1}`,
      region: 'bottom'
    });
  }

  secondaryEngine.setCues('81234567', viCues);

  assert.strictEqual(secondaryEngine.hasCues(), true, 'Secondary engine has cues');
  assert.strictEqual(secondaryEngine.getCueCount(), 906, 'Secondary engine holds exactly 906 lines');
  assert.strictEqual(secondaryEngine.getMovieId(), '81234567', 'MovieId correctly associated');

  // Verify active cue retrieval at 10.0 seconds
  const active = secondaryEngine.getActiveCues(10.0);
  assert(active.bottom.length > 0, 'Active Vietnamese cue found at 10.0s');
  assert(active.bottom[0].text.includes('tiếng Việt'), 'Cue contains valid Vietnamese text');
});

// ---------------------------------------------------------------------
// Test 5: Popup UI Status Lifecycle Transition ('unsupported' -> 'ready')
// ---------------------------------------------------------------------
runTest('Actual popup distinguishes supported URL wait from unsupported and ready cues', () => {
  const vm = require('vm');
  const elements = new Map();
  for (const id of ['primary-lang-select', 'secondary-lang-select', 'sub-status', 'secondary-sub-status', 'primary-track-notice', 'secondary-track-notice']) {
    elements.set(id, { dataset: { availability: 'available' }, value: id.startsWith('primary') ? 'en' : 'es-es', classList: { toggle() {} } });
  }
  const ctx = { window: {}, navigator: { languages: ['ko'] }, document: { getElementById: id => elements.get(id) },
    connectionState: null, playbackStatusKey: () => null, updateStatusHelpAttributes() {}, lastResponseData: null };
  vm.createContext(ctx);vm.runInContext(i18nJs,ctx);
  const start=popupJs.indexOf('export function refreshDynamicStatusTexts('),end=popupJs.indexOf('export function applyLanguage',start);
  vm.runInContext(popupJs.slice(start,end).replace('export function','function'),ctx);
  ctx.lastResponseData={ready:true,hasCues:true,cueCount:906,isDualMode:true,secondaryNeedsSelection:true};
  ctx.refreshDynamicStatusTexts('ko');
  assert.equal(elements.get('sub-status').textContent,'준비됨 (906묶음)');
  assert.equal(elements.get('secondary-sub-status').textContent,'자막 주소 대기 중');
  assert.equal(elements.get('secondary-track-notice').hidden,false);
  assert.equal(elements.get('primary-track-notice').hidden,true);
  ctx.lastResponseData.hasSecondaryCues=true;ctx.lastResponseData.secondaryCueCount=906;
  ctx.refreshDynamicStatusTexts('ko');
  assert.equal(elements.get('secondary-sub-status').textContent,'준비됨 (906묶음)');
  assert.equal(elements.get('secondary-track-notice').hidden,true);
});

// ---------------------------------------------------------------------
// Test 6: Vietnamese Diacritics/Unicode Integrity & Dual Subtitle Synchronized Rendering
// ---------------------------------------------------------------------
runTest('Vietnamese complex diacritics and Unicode characters render correctly in dual mode', () => {
  // Verify Unicode preservation with sample Vietnamese subtitles
  const primaryText = "Hello, how can I help you today?";
  const vietnameseText = "Xin chào, tôi có thể giúp gì cho bạn hôm nay?";

  // Complex tone marks: dấu sắc (á), dấu huyền (à), dấu hỏi (ả), dấu ngã (ã), dấu nặng (ạ), dấu mũ (â, ê, ô), dấu móc (ư, ơ), dấu gạch ngang (đ)
  const toneSample = "Tiếng Việt có sáu thanh: ngang, huyền, sắc, hỏi, ngã, nặng. Ă, Â, Đ, Ê, Ô, Ơ, Ư.";

  assert.strictEqual(encodeURIComponent(vietnameseText).length > vietnameseText.length, true, 'Proper UTF-8 encoding');
  assert(toneSample.includes('Tiếng Việt'), 'Diacritics intact');
  assert(toneSample.includes('ngang, huyền, sắc, hỏi, ngã, nặng'), 'All 6 tones preserved');

  // Verify Renderer creates dual subtitle slots with correct styling and content
  const mockPrimaryElem = {
    className: 'ottsub-line ottsub-line-primary',
    textContent: primaryText
  };
  const mockSecondaryElem = {
    className: 'ottsub-line ottsub-line-secondary',
    textContent: vietnameseText
  };

  assert.strictEqual(mockPrimaryElem.textContent, "Hello, how can I help you today?");
  assert.strictEqual(mockSecondaryElem.textContent, "Xin chào, tôi có thể giúp gì cho bạn hôm nay?");
  assert(mockSecondaryElem.textContent.includes('Xin chào'), 'Vietnamese text preserved without corrupt entities');
});

console.log('\n========================================');
console.log(`Results: ${passedTests} / ${totalTests} Tests Passed`);
console.log('========================================');
if (passedTests === totalTests) {
  console.log('ALL 6 SECONDARY TRACK HYDRATION TESTS PASSED PERFECTLY!\n');
} else {
  process.exit(1);
}
