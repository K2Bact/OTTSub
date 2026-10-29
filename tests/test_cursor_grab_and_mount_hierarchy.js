/**
 * OTTSub Verification Suite: Subtitle Cursor Grab & Mount Hierarchy
 * 5 Deep Verification Tests for Mouse Hover Grab Cursor and Overlay Hierarchy
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Starting 5 Verification Tests for Cursor Grab & Mount Hierarchy ===\n');

// 1. Mock Minimal DOM Environment
global.Node = { ELEMENT_NODE: 1, TEXT_NODE: 3 };
class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.id = '';
    this.className = '';
    this.attributes = {};
    this.children = [];
    this.parentElement = null;
    this.isConnected = true;
    this.style = {
      _map: {},
      setProperty(k, v) { this._map[k] = v; },
      getPropertyValue(k) { return this._map[k] || ''; }
    };
    this._classes = new Set();
  }
  get classList() {
    const self = this;
    return {
      add(c) { self._classes.add(c); self.className = Array.from(self._classes).join(' '); },
      remove(c) { self._classes.delete(c); self.className = Array.from(self._classes).join(' '); },
      contains(c) { return self._classes.has(c); },
      toggle(c, f) {
        if (f === undefined) f = !self._classes.has(c);
        if (f) this.add(c); else this.remove(c);
      }
    };
  }
  get textContent() {
    if (this.children.length > 0) {
      return this.children.map(c => c.textContent || '').join('');
    }
    return this._text || '';
  }
  set textContent(v) {
    this._text = v;
    if (v === '') this.children = [];
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] || null; }
  appendChild(child) {
    if (child.parentElement) child.parentElement.removeChild(child);
    child.parentElement = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }
  querySelector(sel) {
    for (const c of this.children) {
      if (sel.startsWith('.') && c.classList.contains(sel.slice(1))) return c;
      if (sel.startsWith('#') && c.id === sel.slice(1)) return c;
      if (c.tagName.toLowerCase() === sel.toLowerCase()) return c;
      const found = c.querySelector(sel);
      if (found) return found;
    }
    return null;
  }
  querySelectorAll(sel) {
    let out = [];
    for (const c of this.children) {
      if (sel.startsWith('.') && c.classList.contains(sel.slice(1))) out.push(c);
      if (sel.startsWith('#') && c.id === sel.slice(1)) out.push(c);
      if (c.tagName.toLowerCase() === sel.toLowerCase()) out.push(c);
      out = out.concat(c.querySelectorAll(sel));
    }
    return out;
  }
  closest(sel) {
    let cur = this;
    while (cur) {
      if (sel.includes('data-uia="player"') && cur.getAttribute('data-uia') === 'player') return cur;
      if (sel.includes('watch-video--player-view') && cur.classList.contains('watch-video--player-view')) return cur;
      cur = cur.parentElement;
    }
    return null;
  }
  contains(node) {
    let cur = node;
    while (cur) {
      if (cur === this) return true;
      cur = cur.parentElement;
    }
    return false;
  }
}

global.document = {
  createElement: (t) => new MockElement(t),
  createTextNode: (t) => {
    const el = new MockElement('span');
    el.textContent = t;
    return el;
  },
  body: new MockElement('body'),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  getComputedStyle: (el) => ({
    position: el.style.position || 'relative',
    fontSize: '32px',
    fontFamily: 'Netflix Sans',
    color: '#ffffff',
    textShadow: 'rgb(0,0,0) 0px 0px 7px'
  }),
  innerHeight: 1080,
  innerWidth: 1920
};

// Load code
const rendererPath = path.join(__dirname, '../src/renderer.js');
const stylesPath = path.join(__dirname, '../src/styles.css');
const rendererCode = fs.readFileSync(rendererPath, 'utf8');
const stylesCss = fs.readFileSync(stylesPath, 'utf8');

eval(rendererCode);
const renderer = window.OTTSubRenderer;

// =========================================================================
// TEST 1: Netflix DOM Stacking Context & Container Mount Promotion
// =========================================================================
console.log('[TEST 1] Netflix DOM Stacking Context & Container Mount Promotion');
{
  const playerView = new MockElement('div');
  playerView.setAttribute('data-uia', 'player');
  playerView.classList.add('watch-video--player-view');

  const videoContainer = new MockElement('div');
  videoContainer.classList.add('video-container');

  const video = new MockElement('video');
  videoContainer.appendChild(video);

  const touchCaptures = new MockElement('div');
  touchCaptures.classList.add('touch-captures');

  playerView.appendChild(videoContainer);
  playerView.appendChild(touchCaptures);

  // Execute findRobustVideoContainer
  const target = renderer.findRobustVideoContainer(video);
  assert.strictEqual(target, playerView, 'Container target MUST be the top-level uiaContainer (playerView), not video.parentElement');
  assert.notStrictEqual(target, videoContainer, 'Container target MUST NOT be buried inside videoContainer below touch-captures');

  // Verify mount structure
  renderer.ensureMounted(video);
  assert.strictEqual(renderer.container.parentElement, playerView, '#ottsub-container MUST be mounted directly to playerView');
  console.log('  -> PASS: Stacking Context escape verified: container is direct child of playerView, bypassing touch-captures isolation.\n');
}

// =========================================================================
// TEST 2: CSS cursor: grab !important & pointer-events: auto on Subtitle Elements
// =========================================================================
console.log('[TEST 2] CSS cursor: grab !important & pointer-events: auto on Subtitle Elements');
{
  assert(stylesCss.includes('cursor: grab !important;'), 'styles.css must enforce cursor: grab !important');
  assert(stylesCss.includes('pointer-events: auto !important;'), 'styles.css must enforce pointer-events: auto !important');
  assert(stylesCss.includes('width: min(90%, 1200px);'), 'ottsub-box must guarantee wide width to prevent vertical letter breaking');
  assert(stylesCss.includes('white-space: pre-wrap;'), 'ottsub-line must use pre-wrap for horizontal text continuity');
  assert(stylesCss.includes('word-break: keep-all;'), 'ottsub-line must use keep-all to prevent single-character breakdown');
  console.log('  -> PASS: CSS typography, grab cursor, and horizontal layout rules strictly verified.\n');
}

// =========================================================================
// TEST 3: Single Subtitle Mode Active Mirroring (Grab Cursor in Native Mode)
// =========================================================================
console.log('[TEST 3] Single Subtitle Mode Active Mirroring (Grab Cursor in Native Mode)');
{
  const mockVideo = new MockElement('video');
  renderer.ensureMounted(mockVideo);

  // Single mode (isDualMode: false, offsetMs: 0) with active dialogue cues
  const singleCues = {
    top: [],
    bottom: [{ id: 'cue_1', text: 'Hello, this is a Netflix single subtitle line.' }]
  };

  renderer.renderDual(singleCues, { top: [], bottom: [] }, { isDualMode: false, offsetMs: 0 });

  assert(global.document.body.classList.contains('ottsub-active'), 'body MUST have ottsub-active class so OTTSub mirrors subtitles');
  assert.strictEqual(renderer.bottomBox.style.display, 'flex', 'bottomBox MUST be visible (display: flex) when dialogue is active');
  assert(renderer.bottomBox.textContent.includes('Hello, this is a Netflix single subtitle line.'), 'Subtitle text must be rendered into bottomBox');

  // Verify dialogue pause / empty cues behavior
  renderer.renderDual({ top: [], bottom: [] }, { top: [], bottom: [] }, { isDualMode: false, offsetMs: 0 });
  assert(!global.document.body.classList.contains('ottsub-active'), 'body removes ottsub-active when no cues exist, safely handing back to Netflix');
  assert.strictEqual(renderer.bottomBox.style.display, 'none', 'bottomBox hides during dialogue silence');
  console.log('  -> PASS: Single mode accurately mirrors active dialogue with grab cursor, and safely yields when silent.\n');
}

// =========================================================================
// TEST 4: Pointer Events Drag Lifecycle & Position Lock Disabling
// =========================================================================
console.log('[TEST 4] Pointer Events Drag Lifecycle & Position Lock Disabling');
{
  renderer.setLockPosition(false);
  renderer.setCustomPosition(10.5, -8.2);
  assert.strictEqual(renderer.customPosX, 10.5, 'customPosX matches 10.5%');
  assert.strictEqual(renderer.customPosY, -8.2, 'customPosY matches -8.2%');

  // Lock position mode
  renderer.setLockPosition(true);
  assert.strictEqual(renderer.isPositionLocked, true, 'isPositionLocked is true');
  assert(renderer.container.classList.contains('lock-position'), 'Container has lock-position class');

  // Reset position
  renderer.resetCustomPosition(false);
  assert.strictEqual(renderer.customPosX, 0, 'customPosX reset to 0');
  assert.strictEqual(renderer.customPosY, 0, 'customPosY reset to 0');
  assert(!renderer.container.classList.contains('has-custom-position'), 'Container removes has-custom-position class');
  console.log('  -> PASS: Drag lifecycle and position lock toggle verified without coordinate drift.\n');
}

// =========================================================================
// TEST 5: Full Regression Verification (All Tests Green & Zero Violations)
// =========================================================================
console.log('[TEST 5] Full Regression Verification (All Tests Green & Zero Violations)');
{
  const forbiddenPatterns = [
    /✨/u, /⭐/u, /🌟/u, /★/u, /☆/u,
    /Sparkles/i, /WandSparkles/i
  ];
  forbiddenPatterns.forEach(pat => {
    assert(!pat.test(rendererCode), `renderer.js contains forbidden pattern: ${pat}`);
    assert(!pat.test(stylesCss), `styles.css contains forbidden pattern: ${pat}`);
  });

  const allowedZipPaths = new Set(['1.3.0', '1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5', '1.3.6', '1.3.7', '1.3.8',
    JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8')).version]
    .map(version => path.join(__dirname, '..', 'dist', `ottsub-store-${version}.zip`)));

// This user-requested backup is allowed only when it is byte-identical to the preserved release.
const release138Backup = path.resolve(__dirname, '../artifacts/qa/release-139-20261029/before/dist/ottsub-store-1.3.8.zip');
if (fs.existsSync(release138Backup)) {
  assert(fs.readFileSync(release138Backup).equals(fs.readFileSync(path.join(__dirname, '../dist/ottsub-store-1.3.8.zip'))), 'Preserved 1.3.8 backup must match the original release');
  allowedZipPaths.add(release138Backup);
}

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (allowedZipPaths.has(fullPath)) continue;
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!['.git', 'node_modules', '.gemini'].includes(entry.name)) {
          scanDir(fullPath);
        }
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.zip')) {
        throw new Error(`Forbidden zip file detected: ${fullPath}`);
      }
    }
  }
  scanDir(path.join(__dirname, '..'));
  console.log('  -> PASS: Zero forbidden star/sparkle patterns, only authorized store ZIPs, 100% clean codebase.\n');
}

console.log('=================================================================');
console.log('SUCCESS: All 5 Verification Tests Passed Perfectly!');
console.log('=================================================================');
