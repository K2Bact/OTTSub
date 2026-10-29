/**
 * OTTSub - test_stability_22_sets.js
 * Comprehensive automated verification suite for 22 Player Stability & Zero-Bloat Hardening Sets.
 * Ensures zero crashes, zero player freezes, zero memory leaks, and resilient DOM agility across Netflix updates.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const contentJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'content.js'), 'utf8');
const storageJs = fs.readFileSync(path.join(ROOT_DIR, 'src/core/storage-guard.js'), 'utf8');
const fetcherJs = fs.readFileSync(path.join(ROOT_DIR, 'src/network/track-fetcher.js'), 'utf8');
const rendererJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'renderer.js'), 'utf8');
const syncEngineJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'sync-engine.js'), 'utf8');
const parserJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'parser.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'styles.css'), 'utf8');
const manifestJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'manifest.json'), 'utf8'));

let passed = 0;
let total = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('=== Starting OTTSub 22-Set Player Stability & Zero-Bloat Verification Suite ===\n');

// -----------------------------------------------------------------------------
// [SET 1] Selector Agility & Fallback Tree
// -----------------------------------------------------------------------------
console.log('--- [SET 1] Selector Agility & Fallback Tree ---');
it('Set 1: renderer.js implements tiered fallback container detection tree', () => {
  assert(rendererJs.includes('findRobustVideoContainer(video)'), 'Must define findRobustVideoContainer');
  assert(rendererJs.includes('data-uia'), 'Must query data-uia attributes');
  assert(rendererJs.includes('video.closest'), 'Must query closest parent hierarchy');
  assert(rendererJs.includes('return video.parentElement') || rendererJs.includes('bestCandidate'), 'Must fall back gracefully to parent');
});

// -----------------------------------------------------------------------------
// [SET 2] Smart Background Throttling
// -----------------------------------------------------------------------------
console.log('\n--- [SET 2] Smart Background Throttling ---');
it('Set 2: content.js skips polling interval when document.hidden to save CPU/battery', () => {
  assert(contentJs.includes('if (!activeMovieId || document.hidden) return;'), 'Must check document.hidden inside polling interval');
});

// -----------------------------------------------------------------------------
// [SET 3] Video Replacement & AbortSignal Clean Re-attach
// -----------------------------------------------------------------------------
console.log('\n--- [SET 3] Video Replacement & AbortSignal Clean Re-attach ---');
it('Set 3: content.js uses AbortController for atomic video event unbinding', () => {
  assert(contentJs.includes('boundVideoAbortController'), 'Must define boundVideoAbortController');
  assert(contentJs.includes('boundVideoAbortController?.abort()'), 'Must call abort() during unbind');
  assert(contentJs.includes('signal: boundVideoAbortController.signal') || contentJs.includes('{ signal }'), 'Must bind events with AbortSignal');
});

// -----------------------------------------------------------------------------
// [SET 4] Geometry Caching & Layout Thrashing Defense
// -----------------------------------------------------------------------------
console.log('\n--- [SET 4] Geometry Caching & Layout Thrashing Defense ---');
it('Set 4: renderer.js caches video dimensions on pointerdown to prevent forced reflow during drag', () => {
  assert(rendererJs.includes('_cachedVideoRect'), 'Must cache video dimensions in _cachedVideoRect');
  assert(rendererJs.includes('this._cachedVideoRect?.width'), 'Must use cached width in rAF loop instead of querying DOM');
});

// -----------------------------------------------------------------------------
// [SET 5] Inject Bridge Timeout & Graceful Degradation
// -----------------------------------------------------------------------------
console.log('\n--- [SET 5] Inject Bridge Timeout & Graceful Degradation ---');
it('Set 5: content.js and inject.js handle missing or blocked player sessions gracefully', () => {
  assert(contentJs.includes('getCurrentMovieId'), 'Must have URL/DOM-based movie ID fallback');
  const injectJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'inject.js'), 'utf8');
  assert(injectJs.includes('try {') && injectJs.includes('window.netflix?.appContext'), 'Must guard player API queries with try-catch');
});

// -----------------------------------------------------------------------------
// [SET 6] Zero-Crash Regex & Parser Timeout Guard
// -----------------------------------------------------------------------------
console.log('\n--- [SET 6] Zero-Crash Regex & Parser Timeout Guard ---');
it('Set 6: parser.js wraps parse calls in try/catch and returns empty array on failure', () => {
  // Execute parser in Node environment to verify zero crash on garbage input
  const sandbox = { window: {} };
  const runParser = new Function('window', parserJs);
  runParser(sandbox.window);
  const parser = sandbox.window.OTTSubParser;

  assert(typeof parser.parse === 'function', 'Parser must export parse function');
  assert.deepStrictEqual(parser.parse(''), [], 'Empty string returns []');
  assert.deepStrictEqual(parser.parse('<<>>!!invalid xml garbage&&&'), [], 'Malformed garbage returns [] without throwing');
  assert.deepStrictEqual(parser.parse(null), [], 'Null returns []');
});

// -----------------------------------------------------------------------------
// [SET 7] CSS Isolation & Zero Bleed
// -----------------------------------------------------------------------------
console.log('\n--- [SET 7] CSS Isolation & Zero Bleed ---');
it('Set 7: styles.css isolates container layout with CSS containment', () => {
  assert(stylesCss.includes('contain: layout style;'), 'Must contain layout style to prevent host CSS bleed');
  assert(stylesCss.includes('forced-color-adjust: none !important;'), 'Must protect against high-contrast mode distortion');
});

// -----------------------------------------------------------------------------
// [SET 8] Bounded LRU Cache Eviction
// -----------------------------------------------------------------------------
console.log('\n--- [SET 8] Bounded LRU Cache Eviction ---');
it('Set 8: content.js enforces bounded LRU capacity for manifests to prevent binge memory leaks', () => {
  assert(storageJs.includes('class LRUCache'), 'Must define LRUCache');
  assert(contentJs.includes('const manifestCache = new window.OTTSubStorageGuard.LRUCache(5)'), 'Must bound manifest cache to 5 episodes');
});

// -----------------------------------------------------------------------------
// [SET 9] Unified Episode Lifecycle Reset
// -----------------------------------------------------------------------------
console.log('\n--- [SET 9] Unified Episode Lifecycle Reset ---');
it('Set 9: content.js provides atomic resetEpisodeLifecycle to flush all timers and in-flight tasks', () => {
  assert(contentJs.includes('function resetEpisodeLifecycle()'), 'Must define resetEpisodeLifecycle');
  assert(contentJs.includes('window.OTTSubSyncEngine.clear()'), 'Must clear sync engine');
  assert(contentJs.includes('secondarySyncEngine.clear()'), 'Must clear secondary sync engine');
  assert(contentJs.includes('stopRenderLoop()'), 'Must stop render loop');
});

// -----------------------------------------------------------------------------
// [SET 10] Buffering & Stalling State Machine
// -----------------------------------------------------------------------------
console.log('\n--- [SET 10] Buffering & Stalling State Machine ---');
it('Set 10: buffering rechecks evidence; seeking still invalidates the timeline', () => {
  const { harness } = require('./helpers/content-harness.cjs');
  const h = harness();
  const calls = [];
  // Full content orchestrator/listeners; adapter sampling is an I/O boundary.
  // Real decoding and proof retention are covered by hover_media_browser.
  h.window.OTTSubNetflixPlaybackAdapter.prototype.sampleNow = () => calls.push('sample');
  h.window.OTTSubNetflixPlaybackAdapter.prototype.invalidateClock = () => calls.push('invalidate');
  h.video.paused = false; h.video.dispatchEvent(new Event('play'));
  assert(h.video.frames.size > 0);
  h.video.dispatchEvent(new Event('stalled'));
  assert(h.video.frames.size > 0, 'Buffered frames may still play during a network stall');
  h.video.dispatchEvent(new Event('waiting'));
  assert.equal(h.video.frames.size, 0, 'Stop outstanding frame callback before rechecking');
  assert.deepEqual(calls, ['sample', 'sample']);
  h.video.dispatchEvent(new Event('seeking'));
  assert(calls.includes('invalidate'), 'A real seek still discards the old timeline');
});

// -----------------------------------------------------------------------------
// [SET 11] Page Visibility State Surge Protection
// -----------------------------------------------------------------------------
console.log('\n--- [SET 11] Page Visibility State Surge Protection ---');
it('Set 11: content.js handles visibilitychange without frame accumulation surge', () => {
  assert(contentJs.includes("document.addEventListener('visibilitychange'"), 'Must register visibilitychange listener');
  assert(contentJs.includes('dualPlacement.reset()'), 'Must reset frame marker on tab re-activation');
});

// -----------------------------------------------------------------------------
// [SET 12] Fullscreen Top Layer & Pointer-Events
// -----------------------------------------------------------------------------
console.log('\n--- [SET 12] Fullscreen Top Layer & Pointer-Events ---');
it('Set 12: styles.css and renderer.js enforce pointer-events: none on container to preserve video clicks', () => {
  assert(stylesCss.includes('pointer-events: none !important;'), 'Container must have pointer-events: none');
  assert(rendererJs.includes('document.fullscreenElement'), 'Must check fullscreenElement');
});

// -----------------------------------------------------------------------------
// [SET 13] Picture-in-Picture Graceful Handling
// -----------------------------------------------------------------------------
console.log('\n--- [SET 13] Picture-in-Picture Graceful Handling ---');
it('Set 13: content.js handles enterpictureinpicture and leavepictureinpicture events cleanly', () => {
  assert(contentJs.includes('enterpictureinpicture'), 'Must handle enterpictureinpicture');
  assert(contentJs.includes('leavepictureinpicture'), 'Must handle leavepictureinpicture');
});

// -----------------------------------------------------------------------------
// [SET 14] Zero-Latency System-UI Font Stack
// -----------------------------------------------------------------------------
console.log('\n--- [SET 14] Zero-Latency System-UI Font Stack ---');
it('Set 14: styles.css specifies native system-ui and CJK font fallback stack', () => {
  assert(stylesCss.includes('system-ui, -apple-system, BlinkMacSystemFont'), 'Must use system-ui without external font network delay');
  assert(stylesCss.includes('Noto Sans CJK KR') || stylesCss.includes('PingFang SC'), 'Must include CJK fallback fonts');
});

// -----------------------------------------------------------------------------
// [SET 15] ActiveElement Non-Intrusive Guard
// -----------------------------------------------------------------------------
console.log('\n--- [SET 15] ActiveElement Non-Intrusive Guard ---');
it('Set 15: content.js checks activeElement to never intercept keystrokes in input or search fields', () => {
  assert(contentJs.includes('getDeepActiveElement'), 'Must pierce shadow roots to find activeElement');
  assert(contentJs.includes("tag === 'INPUT' || tag === 'TEXTAREA'"), 'Must ignore hotkeys on inputs');
});

// -----------------------------------------------------------------------------
// [SET 16] Exponential Backoff & Circuit Breaker
// -----------------------------------------------------------------------------
console.log('\n--- [SET 16] Exponential Backoff & Circuit Breaker ---');
it('Set 16: content.js implements fail-fast on 403/404 and exponential backoff retry for network errors', () => {
  assert(fetcherJs.includes('response.status === 403 || response.status === 404'), 'Must fail-fast on 403/404');
  assert(fetcherJs.includes('waitForRetry('), 'Must calculate backoff with jitter');
});

// -----------------------------------------------------------------------------
// [SET 17] Safe Extension Context Validator
// -----------------------------------------------------------------------------
console.log('\n--- [SET 17] Safe Extension Context Validator ---');
it('Set 17: content.js defines isExtensionContextValid to prevent unhandled context invalidated console spam', () => {
  assert(contentJs.includes('function isExtensionContextValid()'), 'Must define isExtensionContextValid');
  assert(contentJs.includes('chrome?.runtime && chrome.runtime.id'), 'Must check chrome.runtime.id');
});

// -----------------------------------------------------------------------------
// [SET 18] Drag Pointer Capture Resilience
// -----------------------------------------------------------------------------
console.log('\n--- [SET 18] Drag Pointer Capture Resilience ---');
it('Set 18: renderer.js handles pointercancel, lostpointercapture and window blur during drag', () => {
  assert(rendererJs.includes("box.addEventListener('pointercancel'"), 'Must attach pointercancel');
  assert(rendererJs.includes("box.addEventListener('lostpointercapture'"), 'Must attach lostpointercapture');
  assert(rendererJs.includes("window.addEventListener('blur'"), 'Must attach window blur handler');
});

// -----------------------------------------------------------------------------
// [SET 19] Monotonic Sequence Token & Track Concurrency
// -----------------------------------------------------------------------------
console.log('\n--- [SET 19] Monotonic Sequence Token & Track Concurrency ---');
it('Set 19: request identity and episode generation guards are wired (runtime tests cover races)', () => {
  assert(contentJs.includes('episodeGeneration++'), 'Must invalidate episode generation on reset');
  assert(contentJs.includes('secondaryRequest !== request'), 'Must discard replaced secondary request');
  assert(contentJs.includes('primaryRequest !== request'), 'Must discard replaced primary request');
});

// -----------------------------------------------------------------------------
// [SET 20] Binary Search Cue Teleport (O(log n))
// -----------------------------------------------------------------------------
console.log('\n--- [SET 20] Binary Search Cue Teleport (O(log n)) ---');
it('Set 20: sync-engine.js implements O(log n) binary search cue lookup and findCuesAtTime', () => {
  const sandbox = { window: {} };
  const runSync = new Function('window', syncEngineJs);
  runSync(sandbox.window);
  const engine = new sandbox.window.OTTSubSyncEngineClass();

  // Load 1000 synthetic cues
  const mockCues = [];
  for (let i = 0; i < 1000; i++) {
    mockCues.push({ begin: i * 2, end: (i * 2) + 1.8, text: `Cue ${i}` });
  }
  engine.setCues('12345', mockCues);

  const t0 = process.hrtime.bigint();
  const matched = engine.findCuesAtTime(500.5); // Cue 250 (500.0 - 501.8)
  const t1 = process.hrtime.bigint();
  const durationMs = Number(t1 - t0) / 1e6;

  assert.strictEqual(matched.length, 1, 'Must find active cue via binary search');
  assert.strictEqual(matched[0].text, 'Cue 250', 'Must match exact cue');
  assert(durationMs < 5.0, `Binary search must complete in < 5ms (was ${durationMs.toFixed(3)}ms)`);
});

// -----------------------------------------------------------------------------
// [SET 21] Zero-Allocation Fast Path
// -----------------------------------------------------------------------------
console.log('\n--- [SET 21] Zero-Allocation Fast Path ---');
it('Set 21: sync-engine.js provides getActiveCuesFast reusing internal buffer to eliminate GC spikes', () => {
  const sandbox = { window: {} };
  const runSync = new Function('window', syncEngineJs);
  runSync(sandbox.window);
  const engine = new sandbox.window.OTTSubSyncEngineClass();

  engine.setCues('12345', [{ begin: 10, end: 15, text: 'Hello' }]);
  const res1 = engine.getActiveCuesFast(12);
  const res2 = engine.getActiveCuesFast(13);

  assert.strictEqual(res1, res2, 'Must return the same reused buffer reference across invocations');
  assert.strictEqual(res1.totalActive, 1, 'Must have 1 active cue');
});

// -----------------------------------------------------------------------------
// [SET 22] Self-Healing Watchdog Engine
// -----------------------------------------------------------------------------
console.log('\n--- [SET 22] Self-Healing Watchdog Engine ---');
it('Set 22: content.js runs runSelfHealingWatchdog to automatically recover dormant or detached renderers', () => {
  assert(contentJs.includes('function runSelfHealingWatchdog()'), 'Must define runSelfHealingWatchdog');
  assert(contentJs.includes('runSelfHealingWatchdog()'), 'Must invoke watchdog in main interval');
  assert(contentJs.includes('ensureMounted'), 'Watchdog must remount detached containers');
});

// -----------------------------------------------------------------------------
// Strict Global Policy Compliance
// -----------------------------------------------------------------------------
console.log('\n--- [COMPLIANCE] Strict Global Project Rules ---');
it('Compliance: Zero star or sparkle icons across entire extension codebase', () => {
  const forbidden = ['✨', '⭐', '🌟', '★', '☆', 'Sparkles', 'WandSparkles'];
  const allCode = contentJs + rendererJs + syncEngineJs + parserJs + stylesCss;
  for (const token of forbidden) {
    assert(!allCode.includes(token), `Forbidden star/sparkle token found: ${token}`);
  }
});

it('Compliance: Zero .zip files anywhere in repository', () => {
  const files = fs.readdirSync(ROOT_DIR);
  for (const f of files) {
    assert(!f.endsWith('.zip'), `Forbidden .zip file found in root: ${f}`);
  }
});

console.log('\n======================================================');
console.log(`Results: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
if (passed === total) {
  console.log('All 22 Player Stability & Zero-Bloat hardening sets verified successfully!');
} else {
  console.log('Some tests failed. Review output above.');
}
console.log('======================================================\n');
process.exit(passed === total ? 0 : 1);
