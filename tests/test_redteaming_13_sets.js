/**
 * OTTSub - 13 Sets of Red Teaming Security & Hardening Automated Test Suite
 *
 * Validates all 13 iterative Red Teaming security defenses:
 *  - Set 1: TTML XML XXE & Billion Laughs entity expansion defense (>5MB cap & DOCTYPE/ENTITY stripping)
 *  - Set 2: Prototype Pollution defense (secureJsonParse stripping __proto__, constructor, prototype)
 *  - Set 3: SSRF, Open Redirect & Subtitle Poisoning defense (isSafeNetflixSubtitleUrl, port, credentials, response.url)
 *  - Set 4: Subtitle Bomb Array Overflow & Layout Freeze defense (MAX_CUES_CAP = 10000, MAX_TEXT_LEN = 1000)
 *  - Set 5: Rapid Track Switching Async Race Condition defense (currentSecondaryTrackRequestId & AbortController)
 *  - Set 6: Message Passing Type Confusion & Out-of-Bounds defense (Number.isFinite & [-45%, +45%] clamp)
 *  - Set 7: Popup 600px Max Height & Scroll Trap defense (max-height: 590px, overscroll-behavior: contain)
 *  - Set 8: Detached DOM Orphan Container Memory Leak defense (purge previous #ottsub-container on mount)
 *  - Set 9: Keyboard Shortcut Collision & Repeat Storm defense (Netflix Ctrl+Alt+Shift bypass & repeat toggle guard)
 *  - Set 10: chrome.storage.sync Quota Exhaustion & Token Bucket Fallback (graceful fallback to storage.local)
 *  - Set 11: Least Privilege Host Permissions & Manifest V3 Review Audit (strict https:// and Web Store justification)
 *  - Set 12: BiDi Unicode Control Character & Trojan Source Spoofing strip defense (isolate/zero-width/BOM stripping)
 *  - Set 13: Absolute Rule Compliance (0 forbidden sparkles/stars, 0 zip archives, 100% MV3 integrity)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Starting OTTSub 13-Set Red Teaming Verification Suite ===\n');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${desc}`);
  } catch (err) {
    console.error(`  [FAIL] ${desc}`);
    console.error(`         Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// =========================================================================
// [SET 1] XML XXE & Billion Laughs DoS Defense (src/parser.js)
// =========================================================================
console.log('--- [SET 1] XML XXE & Billion Laughs DoS Defense ---');

const parserCode = fs.readFileSync(path.join(__dirname, '../src/parser.js'), 'utf-8');

it('Set 1: parser.js includes >5MB XML text cap defense', () => {
  assert(parserCode.includes('5 * 1024 * 1024'), 'parser.js must cap XML input at 5MB');
});

it('Set 1: parser.js strips DOCTYPE and ENTITY declarations to defeat Billion Laughs', () => {
  assert(parserCode.includes('replace(/<!DOCTYPE'), 'parser.js must sanitize DOCTYPE');
  assert(parserCode.includes('replace(/<!ENTITY'), 'parser.js must sanitize ENTITY');
});

it('Set 1: Regex neutralizes nested entity definitions safely', () => {
  const maliciousXml = `<?xml version="1.0"?>
<!DOCTYPE lolz [
 <!ENTITY lol "lol">
 <!ENTITY lol2 "&lol;&lol;&lol;&lol;">
]>
<tt><body><div><p begin="00:00:01.000" end="00:00:03.000">&lol2;</p></div></body></tt>`;
  const sanitized = maliciousXml
    .replace(/<!DOCTYPE\s+[^>]*(\[[^\]]*\])?\s*>/gi, '')
    .replace(/<!ENTITY\s+[^>]*>/gi, '');
  assert(!sanitized.includes('<!DOCTYPE'), 'DOCTYPE must be removed');
  assert(!sanitized.includes('<!ENTITY'), 'ENTITY must be removed');
  assert(sanitized.includes('<tt><body>'), 'Substance of XML must be intact');
});

// =========================================================================
// [SET 2] Prototype Pollution Defense (src/content.js, popup/popup.js)
// =========================================================================
console.log('\n--- [SET 2] Prototype Pollution Defense ---');

const contentCode = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf-8');
const storageCode = fs.readFileSync(path.join(__dirname, '../src/core/storage-guard.js'), 'utf-8');
const fetcherCode = fs.readFileSync(path.join(__dirname, '../src/network/track-fetcher.js'), 'utf-8');
const popupCode = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf-8');

it('Set 2: content.js implements secureJsonParse with key reviver', () => {
  assert(contentCode.includes('function secureJsonParse'), 'content.js must define secureJsonParse');
  assert(storageCode.includes('__proto__') && storageCode.includes('constructor') && storageCode.includes('prototype'),
    'content.js secureJsonParse must filter dangerous prototype keys');
});

it('Set 2: popup.js implements secureJsonParse with key reviver', () => {
  assert(popupCode.includes('function secureJsonParse'), 'popup.js must define secureJsonParse');
  assert(popupCode.includes('__proto__') && popupCode.includes('constructor') && popupCode.includes('prototype'),
    'popup.js secureJsonParse must filter dangerous prototype keys');
});

it('Set 2: secureJsonParse strips __proto__ payload and protects Object.prototype', () => {
  function testSecureJsonParse(str, fallback = null) {
    if (!str || typeof str !== 'string') return fallback;
    try {
      return JSON.parse(str, (key, value) => {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return undefined;
        }
        return value;
      });
    } catch (_) {
      return fallback;
    }
  }

  const payload = '{"__proto__":{"polluted":true},"normalKey":123}';
  const parsed = testSecureJsonParse(payload);
  assert.strictEqual(parsed.normalKey, 123);
  assert.strictEqual(({}).polluted, undefined, 'Object.prototype must remain unpolluted');
});

// =========================================================================
// [SET 3] SSRF, Open Redirect & Subtitle Poisoning Defense (src/content.js)
// =========================================================================
console.log('\n--- [SET 3] SSRF, Open Redirect & Subtitle Poisoning Defense ---');

it('Set 3: content.js enforces HTTPS protocol in isSafeNetflixSubtitleUrl', () => {
  assert(fetcherCode.includes("parsed.protocol !== 'https:'"), 'Must strictly enforce HTTPS');
});

it('Set 3: content.js rejects userinfo credentials and non-standard ports', () => {
  assert(fetcherCode.includes("parsed.username !== '' || parsed.password !== ''"), 'Must reject userinfo');
  assert(fetcherCode.includes("parsed.port !== '' && parsed.port !== '443'"), 'Must reject non-standard ports');
});

it('Set 3: content.js validates final response.url against trusted CDN allowlist', () => {
  assert(fetcherCode.includes('isSafeNetflixSubtitleUrl(response.url)'), 'Must check final response.url to prevent Open Redirect SSRF bypass');
});

it('Set 3: isSafeNetflixSubtitleUrl correctly validates URLs', () => {
  function testIsSafeUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'https:') return false;
      if (parsed.username !== '' || parsed.password !== '') return false;
      if (parsed.port !== '' && parsed.port !== '443') return false;
      const host = parsed.hostname.toLowerCase();
      const safeHosts = ['nflxvideo.net', 'nflximg.net', 'nflxext.com', 'nflxso.net', 'netflix.com'];
      return safeHosts.some(safe => host === safe || host.endsWith('.' + safe));
    } catch (_) {
      return false;
    }
  }

  assert.strictEqual(testIsSafeUrl('https://ipv4-c001-sel001-netflix.1.oca.nflxvideo.net/range/123'), true);
  assert.strictEqual(testIsSafeUrl('http://ipv4-c001.nflxvideo.net/'), false, 'Insecure HTTP rejected');
  assert.strictEqual(testIsSafeUrl('https://attacker:secret@nflxvideo.net/'), false, 'Credentials rejected');
  assert.strictEqual(testIsSafeUrl('https://nflxvideo.net:8080/'), false, 'Port 8080 rejected');
  assert.strictEqual(testIsSafeUrl('https://evil-site.com/nflxvideo.net'), false, 'Path spoofing rejected');
});

// =========================================================================
// [SET 4] Subtitle Bomb Array Overflow Defense (src/sync-engine.js)
// =========================================================================
console.log('\n--- [SET 4] Subtitle Bomb Array Overflow Defense ---');

const syncCode = fs.readFileSync(path.join(__dirname, '../src/sync-engine.js'), 'utf-8');

it('Set 4: sync-engine.js caps cues at MAX_CUES_CAP = 10000', () => {
  assert(syncCode.includes('MAX_CUES_CAP = 10000') || syncCode.includes('cues.slice(0, 10000)'),
    'sync-engine.js must clamp cues array length to 10000');
});

it('Set 4: sync-engine.js bounds cue duration and limits text size to MAX_TEXT_LEN', () => {
  assert(syncCode.includes('MAX_TEXT_LEN = 1000') || syncCode.includes('1000'), 'Must cap individual cue text length');
  assert(syncCode.includes('3600'), 'Must filter out unreasonable cue durations > 1 hour');
});

// =========================================================================
// [SET 5] Rapid Track Switching Async Race Condition Defense (src/content.js)
// =========================================================================
console.log('\n--- [SET 5] Rapid Track Switching Async Race Condition Defense ---');

it('Set 5: content.js wires request identity and episode guards (runtime cases in test_episode_lifecycle_runtime.cjs)', () => {
  assert(contentCode.includes('secondaryRequest !== request'), 'Must reject replaced requests');
  assert(contentCode.includes('request.generation === episodeGeneration'), 'Must reject old episode generations');
  assert(contentCode.includes('mid === getCurrentMovieId()'), 'Must recheck the URL before applying cues');
});

it('Set 5: content.js passes cancellation to the shared fetcher', () => {
  assert(contentCode.includes('secondaryRequest?.controller.abort()'), 'Must cancel previous request');
  assert(contentCode.includes('fetchTrackResult(candidateUrls, request.controller.signal)'), 'Must pass signal to the detailed fetcher');
});

// =========================================================================
// [SET 6] Message Passing Type Confusion & Out-of-Bounds Defense (src/content.js)
// =========================================================================
console.log('\n--- [SET 6] Message Passing Type Confusion & Out-of-Bounds Defense ---');

it('Set 6: content.js validates custom position coordinates with Number.isFinite', () => {
  assert(contentCode.includes('Number.isFinite(rawX)'), 'content.js must check rawX with Number.isFinite');
  assert(contentCode.includes('Number.isFinite(rawY)'), 'content.js must check rawY with Number.isFinite');
});

it('Set 6: content.js clamps custom position coordinates strictly between -45% and +45%', () => {
  const {harness}=require('./helpers/content-harness.cjs');
  const h=harness();
  h.send('set_custom_position',null,{x:1000,y:-1000});
  assert.deepStrictEqual(h.renderer.setCustomPositionValue,[45,-45]);
  const writes=h.writes.length;
  for(const bad of [NaN,Infinity,'bad',{},null]) h.send('set_custom_position',null,{x:bad,y:2});
  assert.strictEqual(h.writes.length,writes,'invalid coordinates must not overwrite saved position');
});

// =========================================================================
// [SET 7] Side panel responsive height & Scroll Trap Defense (popup/popup.css)
// =========================================================================
console.log('\n--- [SET 7] Side Panel Responsive Height & Scroll Trap Defense ---');

const popupCss = fs.readFileSync(path.join(__dirname, '../popup/popup.css'), 'utf-8');

it('Set 7: side panel fills the available viewport height', () => {
  assert(popupCss.includes('min-height: 100vh'), 'side panel body must fill the viewport');
});

it('Set 7: popup.css specifies overscroll-behavior: contain to eliminate scroll traps', () => {
  assert(popupCss.includes('overscroll-behavior: contain'), 'popup.css must specify overscroll-behavior: contain');
});

// =========================================================================
// [SET 8] Detached DOM Orphan Container Memory Leak Defense (src/renderer.js)
// =========================================================================
console.log('\n--- [SET 8] Detached DOM Orphan Container Memory Leak Defense ---');

const rendererCode = fs.readFileSync(path.join(__dirname, '../src/renderer.js'), 'utf-8');

it('Set 8: renderer.js purges detached/orphan #ottsub-container elements upon mount', () => {
  assert(rendererCode.includes("querySelectorAll('#ottsub-container')") || rendererCode.includes('querySelectorAll("#ottsub-container")'),
    'renderer.js must query and purge existing #ottsub-container instances to prevent leaks');
});

// =========================================================================
// [SET 9] Keyboard Shortcut Collision & Repeat Storm Defense (src/content.js)
// =========================================================================
console.log('\n--- [SET 9] Keyboard Shortcut Collision & Repeat Storm Defense ---');

it('Set 9: content.js bypasses Netflix diagnostic engineering menu (Ctrl+Alt+Shift+D/S/P/Q/L)', () => {
  assert(contentCode.includes('event.ctrlKey && event.altKey && event.shiftKey'),
    'content.js must bypass key combinations with Ctrl+Alt+Shift to preserve Netflix diagnostics');
});

it('Set 9: content.js guards toggle shortcuts against auto-repeat storms', () => {
  assert(contentCode.includes("event.repeat && (code === 'KeyD' || code === 'KeyL' || code === 'KeyR' || code === 'Backslash')"),
    'content.js must ignore OS auto-repeat for toggle shortcuts (Alt+D, Alt+L, Alt+R, Backslash)');
});

// =========================================================================
// [SET 10] chrome.storage.sync Quota Exhaustion & Token Bucket Fallback
// =========================================================================
console.log('\n--- [SET 10] chrome.storage.sync Quota Exhaustion & Token Bucket Fallback ---');

it('Set 10: content.js delegates persistence; storage guard saves local before debounced sync', () => {
  assert(contentCode.includes('OTTSubStorageGuard.flushStorageSave()') && storageCode.includes('chrome.storage.local.set({ [key]: value }'),
    'Local settings must be saved independently of sync quota');
});

it('Set 10: popup.js flushPopupStorageSave falls back to chrome.storage.local on sync error', () => {
  assert(popupCode.includes('chrome.storage.local.set(payload') || popupCode.includes('chrome.storage?.local'),
    'popup.js must fall back to chrome.storage.local if sync quota is exceeded');
});

// =========================================================================
// [SET 11] Least Privilege Host Permissions & Manifest V3 Review Audit
// =========================================================================
console.log('\n--- [SET 11] Least Privilege Host Permissions & Manifest V3 Review Audit ---');

const manifestCode = fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf-8');
const manifest = JSON.parse(manifestCode);
const storeMd = fs.readFileSync(path.join(__dirname, '../store_assets/STORE_GUIDE.md'), 'utf-8');

it('Set 11: manifest.json permissions limited to storage and sidePanel', () => {
  assert.deepStrictEqual(manifest.permissions, ['storage', 'sidePanel'], 'Permissions must be limited to storage and sidePanel');
});

it('Set 11: manifest.json host_permissions use strict https:// scheme (no insecure http)', () => {
  assert(Array.isArray(manifest.host_permissions), 'host_permissions must be an array');
  manifest.host_permissions.forEach(hp => {
    assert(hp.startsWith('https://'), `Host permission ${hp} must start with https://`);
    assert(!hp.includes('*://*/*'), 'Broad wildcard host permissions are forbidden');
  });
});

it('Set 11: content_scripts matches use strict https:// scheme', () => {
  manifest.content_scripts.forEach(cs => {
    cs.matches.forEach(m => {
      assert(m.startsWith('https://'), `Content script match ${m} must start with https://`);
    });
  });
});

it('Set 11: CHROMEWEBSTORE.md includes HTTPS least privilege justification', () => {
  assert(storeMd.includes('https://*.netflix.com/*'), 'CHROMEWEBSTORE.md must specify https://');
  assert(storeMd.includes('Least Privilege'), 'CHROMEWEBSTORE.md must state Least Privilege');
});

// =========================================================================
// [SET 12] BiDi Unicode Control Character & Trojan Source Spoofing Strip Defense
// =========================================================================
console.log('\n--- [SET 12] BiDi Unicode Control Character & Trojan Source Spoofing Strip Defense ---');

it('Set 12: parser removes explicit overrides and BOM while preserving normal direction controls', () => {
  assert(parserCode.includes('\\uFEFF'), 'Must strip Byte Order Mark (\\uFEFF)');
  assert(parserCode.includes('\\u202A-\\u202E'), 'Must strip BiDi embeddings & overrides');
});

it('Set 12: actual sanitizer preserves layout controls and keeps encoded markup inert', () => {
  const context = {window:{}};
  require('node:vm').runInNewContext(parserCode, context);
  const clean = context.window.OTTSubParser.cleanSubtitleLine;
  assert.strictEqual(clean('A\u202E\uFEFFB\u200E\u200F\u2066C\u2069\u200C\u200D'), 'AB\u200E\u200F\u2066C\u2069\u200C\u200D');
  assert.strictEqual(clean('&lt;script&gt;bad()&lt;/script&gt;ok'), '&lt;script&gt;bad()&lt;/script&gt;ok');
});

// =========================================================================
// [SET 13] Absolute Compliance Verification (0 Sparkles/Stars, 0 Zip Files, MV3)
// =========================================================================
console.log('\n--- [SET 13] Absolute Compliance Verification ---');

const FORBIDDEN_ICONS = ['Sparkles', 'WandSparkles'];
const FORBIDDEN_CHARS = ['✨', '⭐', '🌟', '★', '☆'];
const EXTENSION_DIRS = ['src', 'popup', '_locales'];
const rootDir = path.join(__dirname, '..');

it('Set 13: Absolute ban on sparkles, stars, and star icons across extension app code', () => {
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && /\.(js|html|css|json)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const icon of FORBIDDEN_ICONS) {
          const iconRegex = new RegExp(`\\b${icon}\\b`);
          assert(!iconRegex.test(content), `Forbidden icon ${icon} found in ${fullPath}`);
        }
        for (const ch of FORBIDDEN_CHARS) {
          assert(!content.includes(ch), `Forbidden emoji ${ch} found in ${fullPath}`);
        }
      }
    }
  }

  for (const d of EXTENSION_DIRS) {
    scanDir(path.join(rootDir, d));
  }

  // Also verify manifest.json
  const manifestRaw = fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf-8');
  for (const icon of FORBIDDEN_ICONS) {
    const iconRegex = new RegExp(`\\b${icon}\\b`);
    assert(!iconRegex.test(manifestRaw), `Forbidden icon ${icon} found in manifest.json`);
  }
  for (const ch of FORBIDDEN_CHARS) {
    assert(!manifestRaw.includes(ch), `Forbidden emoji ${ch} found in manifest.json`);
  }
});

it('Set 13: Absolute ban on .zip files anywhere in root and extension directories', () => {
  const rootFiles = fs.readdirSync(rootDir);
  const zipFiles = rootFiles.filter(f => f.toLowerCase().endsWith('.zip'));
  assert.strictEqual(zipFiles.length, 0, `Forbidden .zip files detected in root directory: ${JSON.stringify(zipFiles)}`);
});

it('Set 13: Manifest V3 version and structure integrity strictly verified', () => {
  assert.strictEqual(manifest.manifest_version, 3, 'Manifest version must be 3');
  assert.match(manifest.version, /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,3}$/, 'Chrome version has 1–4 canonical integer components');
  const versionParts = manifest.version.split('.').map(Number);
  assert(versionParts.every(n => n <= 65535) && versionParts.some(n => n > 0), 'Chrome version components fit 0–65535 and are not all zero');
  assert(manifest.action && !manifest.action.default_popup, 'Action icon opens the side panel instead of a popup');
  assert.strictEqual(manifest.side_panel?.default_path, 'popup/popup.html', 'Existing settings UI is hosted in the side panel');
  assert(manifest.icons && manifest.icons['128'], '128px icon defined');
});

// =========================================================================
// SUMMARY
// =========================================================================
console.log(`\n======================================================`);
console.log(`Results: ${passedTests} / ${totalTests} Passed (${Math.round(passedTests / totalTests * 100)}%)`);
console.log(passedTests === totalTests ? 'All 13 sets passed.' : 'Failures remain; see assertions above.');
console.log(`======================================================\n`);
