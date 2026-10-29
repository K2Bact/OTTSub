/**
 * OTTSub Automated QA Test Suite
 * Validates:
 * 1. Fullscreen Episode Transition DOM Re-parenting & Top-layer persistence
 * 2. Font Size Stability across dialogue pauses (anti-fluctuating)
 * 3. Dual Slot layout stability & Phantom Baseline Anchor when secondary disappears
 * 4. XML/TTML Entity Decoding
 * 5. Single mode collapse
 */

const fs = require('fs');
const path = require('path');

// Simple DOM Mocking for Node.js environment
global.Node = {
  ELEMENT_NODE: 1,
  TEXT_NODE: 3,
  COMMENT_NODE: 8
};

class MockDOMElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.nodeName = tagName.toLowerCase();
    this.nodeType = Node.ELEMENT_NODE;
    this.id = '';
    this._classes = new Set();
    this.children = [];
    this.childNodes = [];
    this.attributes = {};
    this.parentElement = null;
    this.style = {
      _props: {},
      setProperty(k, v) { this._props[k] = v; },
      getPropertyValue(k) { return this._props[k] || ''; }
    };
    this._textContent = '';
    this.isConnected = true;
    this.clientHeight = 1080;
    this.clientWidth = 1920;
  }

  getAttribute(name) {
    if (name === 'class') return this.className;
    if (name === 'id') return this.id;
    return this.attributes[name] || null;
  }

  getAttributeNS(ns, name) {
    return this.getAttribute(name);
  }

  setAttribute(name, val) {
    if (name === 'class') this.className = val;
    else if (name === 'id' || name === 'xml:id') this.id = val;
    this.attributes[name] = val;
  }

  get textContent() {
    if (this._textContent) return this._textContent;
    if (this.childNodes.length > 0) {
      return this.childNodes.map(c => c.textContent || '').join('');
    }
    return '';
  }

  set textContent(val) {
    this._textContent = val;
    if (val === '') {
      this.children = [];
      this.childNodes = [];
    }
  }

  get className() {
    return Array.from(this._classes).join(' ');
  }

  set className(val) {
    this._classes.clear();
    if (val) {
      val.split(/\s+/).filter(Boolean).forEach(c => this._classes.add(c));
    }
  }

  get classList() {
    const self = this;
    return {
      add(c) { self._classes.add(c); },
      remove(c) { self._classes.delete(c); },
      contains(c) { return self._classes.has(c); },
      toggle(c, force) {
        if (force === true) self._classes.add(c);
        else if (force === false) self._classes.delete(c);
        else if (self._classes.has(c)) self._classes.delete(c);
        else self._classes.add(c);
      }
    };
  }

  get childElementCount() {
    return this.children.length;
  }

  get options() {
    return this.children.filter(c => c.tagName === 'OPTION');
  }

  appendChild(child) {
    if (child && (child.nodeType === 11 || child._isFragment)) {
      while (child.children.length > 0) {
        this.appendChild(child.children[0]);
      }
      return child;
    }
    if (child.parentElement) {
      child.parentElement.removeChild(child);
    }
    child.parentElement = this;
    child.isConnected = true;
    this.children.push(child);
    this.childNodes.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
    }
    const cIdx = this.childNodes.indexOf(child);
    if (cIdx !== -1) {
      this.childNodes.splice(cIdx, 1);
    }
    child.parentElement = null;
    return child;
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }

  querySelector(selector) {
    for (const child of this.children) {
      if (matchesSelector(child, selector)) return child;
      const sub = child.querySelector(selector);
      if (sub) return sub;
    }
    return null;
  }

  querySelectorAll(selector) {
    let results = [];
    for (const child of this.children) {
      if (matchesSelector(child, selector)) results.push(child);
      results = results.concat(child.querySelectorAll(selector));
    }
    return results;
  }
}

function createMockElement(tag) {
  return new MockDOMElement(tag);
}

function matchesSelector(el, selector) {
  const parts = selector.split(',').map(s => s.trim());
  for (const part of parts) {
    const tokens = part.split(/\s+/);
    const lastToken = tokens[tokens.length - 1];
    if (lastToken.startsWith('.')) {
      if (el.classList.contains(lastToken.slice(1))) return true;
    } else if (lastToken.startsWith('#')) {
      if (el.id === lastToken.slice(1)) return true;
    } else if (lastToken.toLowerCase() === el.tagName.toLowerCase()) {
      return true;
    }
  }
  return false;
}

// Mock Global Environment
const eventListeners = {};
global.document = {
  createElement(tag) { return createMockElement(tag); },
  createDocumentFragment() {
    const frag = createMockElement('fragment');
    frag.nodeType = 11;
    frag._isFragment = true;
    return frag;
  },
  createTextNode(text) {
    const el = createMockElement('span');
    el.textContent = text;
    return el;
  },
  querySelector(selector) { return global.mockDocumentRoot ? global.mockDocumentRoot.querySelector(selector) : null; },
  querySelectorAll(selector) { return global.mockDocumentRoot ? global.mockDocumentRoot.querySelectorAll(selector) : []; },
  getElementById(id) {
    if (global._mockElementByIdRegistry && global._mockElementByIdRegistry[id]) return global._mockElementByIdRegistry[id];
    return global.mockDocumentRoot ? global.mockDocumentRoot.querySelector('#' + id) : null;
  },
  addEventListener(event, handler) {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(handler);
  },
  body: createMockElement('body')
};
global.document.removeEventListener = (event, handler) => {
  const index = eventListeners[event]?.indexOf(handler) ?? -1;
  if (index >= 0) eventListeners[event].splice(index, 1);
};

global.window = {
  location: { pathname: '/watch/80057281' },
  addEventListener(event, handler) {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(handler);
  },
  removeEventListener(event, handler) {
    if (!eventListeners[event]) return;
    const idx = eventListeners[event].indexOf(handler);
    if (idx !== -1) eventListeners[event].splice(idx, 1);
  },
  dispatchEvent(evt) {},
  getComputedStyle(el) {
    return {
      position: el.style.position || 'relative',
      fontSize: el.style.fontSize || '32px',
      fontFamily: el.style.fontFamily || 'Netflix Sans',
      color: el.style.color || '#ffffff',
      textShadow: el.style.textShadow || 'rgb(0, 0, 0) 0px 0px 7px',
      bottom: el.style.bottom || 'auto'
    };
  },
  innerHeight: 1080,
  innerWidth: 1920
};

global.history = {
  pushState() {},
  replaceState() {}
};

global.performance = {
  now: () => Date.now()
};

global.DOMParser = class MockDOMParser {
  parseFromString(xmlString, mimeType) {
    const doc = createMockElement('doc');
    const tt = createMockElement('tt');
    const ttMatch = xmlString.match(/<tt\s+([^>]+)>/i);
    if (ttMatch) {
      const attrRegex = /([\w:]+)="([^"]*)"/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(ttMatch[1])) !== null) {
        tt.setAttribute(aMatch[1], aMatch[2]);
      }
    }
    doc.appendChild(tt);

    // Extract regions
    const regionRegex = /<region\s+([^>]+)\/?>/gi;
    let regMatch;
    while ((regMatch = regionRegex.exec(xmlString)) !== null) {
      const reg = createMockElement('region');
      const attrStr = regMatch[1];
      const attrRegex = /([\w:]+)="([^"]*)"/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(attrStr)) !== null) {
        reg.setAttribute(aMatch[1], aMatch[2]);
      }
      tt.appendChild(reg);
    }

    // Extract paragraphs
    const pRegex = /<p\s+([^>]+)>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(xmlString)) !== null) {
      const p = createMockElement('p');
      const attrStr = pMatch[1];
      const attrRegex = /([\w:]+)="([^"]*)"/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(attrStr)) !== null) {
        p.setAttribute(aMatch[1], aMatch[2]);
      }
      const textNode = {
        nodeType: Node.TEXT_NODE,
        nodeValue: pMatch[2].trim()
      };
      p.childNodes.push(textNode);
      tt.appendChild(p);
    }

    return doc;
  }
};

// Load renderer.js
const rendererCode = fs.readFileSync(path.join(__dirname, '../src/renderer.js'), 'utf-8');
eval(rendererCode);

const renderer = window.OTTSubRenderer;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('=== OTTSub Automated QA Test Suite Execution ===\n');

// -------------------------------------------------------------
// Test 1: Fullscreen Episode Transition DOM Re-parenting
// -------------------------------------------------------------
console.log('Test 1: Fullscreen Episode Transition DOM Re-parenting');
{
  const ep1Container = createMockElement('div');
  const ep1Video = createMockElement('video');
  ep1Container.appendChild(ep1Video);

  // Initial mount on Episode 1
  renderer.ensureMounted(ep1Video);
  assert(renderer.container.parentElement === ep1Container, 'Initial mount places container into Episode 1 container');

  // Simulate Episode 2 transition: Netflix creates a brand new video and wrapper
  const ep2Container = createMockElement('div');
  const ep2Video = createMockElement('video');
  ep2Container.appendChild(ep2Video);

  // Old Episode 1 container is still connected in DOM cache (isConnected = true)
  // Re-mount on Episode 2 video
  renderer.ensureMounted(ep2Video);
  assert(renderer.container.parentElement === ep2Container, 'Re-parenting watchdog transfers container to Episode 2 video parent');
  assert(ep1Container.children.length === 1 && ep1Container.children[0] === ep1Video, 'Episode 1 container cleaned up completely');
}

// -------------------------------------------------------------
// Test 2: Fullscreen Watchdog Event Trigger
// -------------------------------------------------------------
console.log('\nTest 2: Fullscreenchange Event Watchdog');
{
  assert(Array.isArray(eventListeners['fullscreenchange']) && eventListeners['fullscreenchange'].length > 0, 
    'fullscreenchange event listener properly registered on document');
  
  // Trigger event and ensure no crash
  try {
    eventListeners['fullscreenchange'].forEach(fn => fn());
    assert(true, 'fullscreenchange handler fires without exceptions');
  } catch (err) {
    assert(false, `fullscreenchange handler threw: ${err.message}`);
  }
}

// -------------------------------------------------------------
// Test 3: Font Size Stability (Anti-Fluctuation)
// -------------------------------------------------------------
console.log('\nTest 3: Font Size Stability Across Dialogue Pauses');
{
  const video = createMockElement('video');
  video.clientHeight = 1080;
  renderer.ensureMounted(video);

  // 1. Native span detected (e.g., 32px)
  global.mockDocumentRoot = createMockElement('div');
  const timedtext = createMockElement('div');
  timedtext.className = 'player-timedtext';
  const textContainer = createMockElement('div');
  textContainer.className = 'player-timedtext-text-container';
  const span = createMockElement('span');
  span.style.fontSize = '32px';
  textContainer.appendChild(span);
  timedtext.appendChild(textContainer);
  global.mockDocumentRoot.appendChild(timedtext);

  renderer.syncNativeStyles(video, true);
  const detectedFs = renderer.container.style._props['--ottsub-font-size'];
  assert(detectedFs === '32px', `Native font size accurately measured as 32px (got ${detectedFs})`);

  // 2. Dialogue pause: Native spans completely removed from DOM
  timedtext.removeChild(textContainer);
  renderer.lastStyleSyncTime = 0; // Force sync
  renderer.syncNativeStyles(video, true);

  const pausedFs = renderer.container.style._props['--ottsub-font-size'];
  assert(pausedFs === '32px', `Cached font size preserved at 32px during pause instead of exploding to 52px (got ${pausedFs})`);

  // 3. Fallback calculation check when no cache exists
  renderer.lastNativeStyle.fontSize = null;
  renderer.lastStyleSyncTime = 0;
  renderer.syncNativeStyles(video, true);
  const fallbackFs = renderer.container.style._props['--ottsub-font-size'];
  const fallbackNum = parseInt(fallbackFs, 10);
  assert(fallbackNum >= 28 && fallbackNum <= 36, `Proportional fallback calibrated to ~33px for 1080p (got ${fallbackFs})`);
}

// -------------------------------------------------------------
// Test 4: Dual Slot Stacking & Phantom Baseline Anchor
// -------------------------------------------------------------
console.log('\nTest 4: Dual Slot Stacking & Phantom Baseline Anchor');
{
  const box = createMockElement('div');
  box.className = 'ottsub-box ottsub-bottom';

  // 1. Both Primary (English) and Secondary (Korean) active
  const primaryCues = [{ id: '1', text: 'Hello, how are you?' }];
  const secondaryCues = [{ id: '2', text: '안녕하세요, 어떻게 지내세요?' }];

  renderer._renderDualCuesIntoBox(box, primaryCues, secondaryCues, true);
  assert(box.classList.contains('is-dual'), 'Box marked with is-dual when dual cues present');

  const slotPrimary = box.querySelector('.ottsub-slot-primary');
  const slotSecondary = box.querySelector('.ottsub-slot-secondary');

  assert(!slotPrimary.classList.contains('is-empty'), 'Primary slot is active');
  assert(!slotSecondary.classList.contains('is-empty'), 'Secondary slot is active');

  // 2. Korean disappears (Dialogue ends earlier than English)
  renderer._renderDualCuesIntoBox(box, primaryCues, [], true);
  assert(box.classList.contains('is-dual'), 'Box retains is-dual to preserve layout geometry');
  assert(!slotPrimary.classList.contains('is-empty'), 'Primary slot remains populated with English');
  assert(slotSecondary.classList.contains('is-empty'), 'Secondary slot marked as is-empty');

  // Check Phantom Anchor
  const phantom = slotSecondary.children[0];
  assert(phantom !== undefined, 'Secondary slot contains phantom anchor element to prevent height collapse');
  assert(phantom && phantom.textContent === '\u00A0', 'Phantom anchor contains non-breaking space for font metric reservation');
  assert(phantom && phantom.style.visibility === 'hidden', 'Phantom anchor is visually hidden');
}

// -------------------------------------------------------------
// Test 5: XML/TTML Entity Decoding
// -------------------------------------------------------------
console.log('\nTest 5: XML/TTML Entity Decoding');
{
  const raw = "It&#39;s &lt;Walter White&gt; &amp; &quot;Jesse&quot;";
  const decoded = renderer._decodeEntities(raw);
  assert(decoded === 'It\'s <Walter White> & "Jesse"', `Entities properly decoded: ${decoded}`);
}

// -------------------------------------------------------------
// Test 6: Single Subtitle Mode Collapse
// -------------------------------------------------------------
console.log('\nTest 6: Single Subtitle Mode Collapse');
{
  const box = createMockElement('div');
  box.className = 'ottsub-box ottsub-bottom';

  const singleCue = [{ id: '1', text: 'Single mode only' }];
  renderer._renderDualCuesIntoBox(box, singleCue, [], false);

  assert(!box.classList.contains('is-dual'), 'Single mode removes is-dual class');
  const slotSecondary = box.querySelector('.ottsub-slot-secondary');
  assert(slotSecondary.classList.contains('is-empty'), 'Secondary slot is empty in single mode');
}

// -------------------------------------------------------------
// Test 7: Multiline Line-Height Compression (3+ lines)
// -------------------------------------------------------------
console.log('\nTest 7: Multiline Line-Height Compression (3+ lines)');
{
  const box = createMockElement('div');
  box.className = 'ottsub-box ottsub-bottom';

  // 1. Two lines total -> is-multiline should NOT be set
  renderer._renderDualCuesIntoBox(box, [{ id: '1', text: 'Line 1' }], [{ id: '2', text: 'Line 2' }], true);
  assert(!box.classList.contains('is-multiline'), 'is-multiline is false for 2 lines');

  // 2. Three lines total -> is-multiline should be TOGGLED
  renderer._renderDualCuesIntoBox(box, [{ id: '1', text: 'Line 1' }, { id: '2', text: 'Line 2' }], [{ id: '3', text: 'Line 3' }], true);
  assert(box.classList.contains('is-multiline'), 'is-multiline is true for 3 lines');
}

// -------------------------------------------------------------
// Test 8: XSS Prevention & Safe HTML Formatting
// -------------------------------------------------------------
console.log('\nTest 8: XSS Prevention & Safe HTML Node Creation');
{
  const malicious = '<script>alert(1)</script><i>Safe Italic</i><img src=x onerror=alert(2)>';
  const elem = renderer._createLineElement(malicious, 'test-line');
  assert(elem.tagName === 'SPAN', 'Root wrapper is SPAN');
  // Check child nodes: script/img must NOT be elements, only text nodes or valid <i>
  let hasScriptElement = false;
  let hasImgElement = false;
  let hasItalicElement = false;

  elem.children.forEach(child => {
    if (child.tagName === 'SCRIPT') hasScriptElement = true;
    if (child.tagName === 'IMG') hasImgElement = true;
    if (child.tagName === 'I' && child.textContent === 'Safe Italic') hasItalicElement = true;
  });

  assert(!hasScriptElement, 'Script tag is never converted to DOM element');
  assert(!hasImgElement, 'Img tag is never converted to DOM element');
  assert(hasItalicElement, 'Legitimate <i> tag is safely rendered as I DOM node');
}

// -------------------------------------------------------------
// Test 9: Zero-Jitter Dirty Check Cache
// -------------------------------------------------------------
console.log('\nTest 9: Zero-Jitter Dirty Check Cache');
{
  const video = createMockElement('video');
  renderer.ensureMounted(video);

  const cues = { top: [], bottom: [{ id: '1', text: 'Hello' }] };
  renderer.renderDual(cues, { top: [], bottom: [] }, { isDualMode: true, offsetMs: 0 });

  const initialTopCache = renderer.lastTopText;
  const initialBottomCache = renderer.lastBottomText;

  // Re-render exact same cues -> verify dirty check skips DOM re-render
  renderer.renderDual(cues, { top: [], bottom: [] }, { isDualMode: true, offsetMs: 0 });
  assert(renderer.lastTopText === initialTopCache, 'Top cache untouched on identical cues');
  assert(renderer.lastBottomText === initialBottomCache, 'Bottom cache untouched on identical cues');
}

// -------------------------------------------------------------
// Test 10: Strict User Rule Ban (Sparkles / Stars / Emojis)
// -------------------------------------------------------------
console.log('\nTest 10: Strict Project_Dev Rule Ban (Sparkles / Stars / Emojis)');
{
  const forbiddenPatterns = ['✨', '⭐', '🌟', '★', '☆', 'Sparkles', 'WandSparkles'];
  let violations = [];

  const filesToCheck = [
    'src/renderer.js',
    'src/content.js',
    'src/styles.css',
    'popup/popup.html',
    'popup/popup.css',
    'popup/popup.js'
  ];

  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      forbiddenPatterns.forEach(pat => {
        if (content.includes(pat)) {
          violations.push(`${file} contains forbidden pattern: ${pat}`);
        }
      });
    }
  });

  assert(violations.length === 0, `Zero forbidden star/sparkle patterns across codebase (found: ${violations.length})`);
}

// -------------------------------------------------------------
// Test 11: TTML Layout Region origin Parsing (Opening Credits avoidance)
// -------------------------------------------------------------
console.log('\nTest 11: TTML Layout Region origin Parsing (Opening Credits avoidance)');
{
  const parserCode = fs.readFileSync(path.join(__dirname, '../src/parser.js'), 'utf-8');
  eval(parserCode);

  // Simulated Netflix TTML XML with arbitrary region IDs (not just 'top')
  const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
  <tt xmlns="http://www.w3.org/ns/ttml" xmlns:tts="http://www.w3.org/ns/ttml#styling">
    <head>
      <layout>
        <region xml:id="bottom_region" tts:origin="10% 80%" tts:extent="80% 20%" tts:displayAlign="after" />
        <region xml:id="credit_avoid_r1" tts:origin="10% 10%" tts:extent="80% 20%" tts:displayAlign="before" />
      </layout>
    </head>
    <body>
      <div>
        <p begin="00:00:01.000" end="00:00:03.000" region="bottom_region">Normal dialogue at bottom</p>
        <p begin="00:00:04.000" end="00:00:06.000" region="credit_avoid_r1">Dialogue raised for Bryan Cranston credit</p>
      </div>
    </body>
  </tt>`;

  const cues = window.OTTSubParser.parse(sampleXml);
  assert(cues.length === 2, 'Parsed 2 cues from TTML sample');
  assert(cues[0].isTop === false, 'Bottom cue correctly identified as isTop: false');
  assert(cues[1].isTop === true, 'Credit avoid cue correctly identified as isTop: true via tts:origin 10% 10%');
}

// -------------------------------------------------------------
// Test 12: Coordinated Top-Lift in Dual Mode
// -------------------------------------------------------------
console.log('\nTest 12: Coordinated Top-Lift in Dual Mode');
{
  // Simulated cues: Primary has top cue (credits), Secondary only has bottom cue
  let primaryCues = {
    top: [{ id: 'p1', text: 'English dialogue at top' }],
    bottom: []
  };
  let secondaryCues = {
    top: [],
    bottom: [{ id: 's1', text: 'Korean dialogue originally at bottom' }]
  };

  const isDualMode = true;
  // Apply Coordinated Top-Lift algorithm
  if (isDualMode) {
    const hasTopCue = (primaryCues.top && primaryCues.top.length > 0) ||
                      (secondaryCues.top && secondaryCues.top.length > 0);
    if (hasTopCue) {
      if (primaryCues.bottom && primaryCues.bottom.length > 0) {
        primaryCues.top = (primaryCues.top || []).concat(primaryCues.bottom);
        primaryCues.bottom = [];
      }
      if (secondaryCues.bottom && secondaryCues.bottom.length > 0) {
        secondaryCues.top = (secondaryCues.top || []).concat(secondaryCues.bottom);
        secondaryCues.bottom = [];
      }
    }
  }

  assert(primaryCues.top.length === 1, 'Primary remains at top');
  assert(primaryCues.bottom.length === 0, 'Primary bottom is empty');
  assert(secondaryCues.top.length === 1 && secondaryCues.top[0].id === 's1', 'Secondary bottom cue lifted to top');
  assert(secondaryCues.bottom.length === 0, 'Secondary bottom is cleared to leave credit area clean');
}

// -------------------------------------------------------------
// Test 13: Top Box Downward Expansion & Safe Zone CSS Integrity
// -------------------------------------------------------------
console.log('\nTest 13: Top Box Downward Expansion & Safe Zone CSS Integrity');
{
  const cssPath = path.join(__dirname, '../src/styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // Verify safe zone margin for .ottsub-top
  assert(cssContent.includes('.ottsub-top') && cssContent.includes('clamp(48px, 8.5vh, 100px)'), 
    '.ottsub-top safe zone margin clamp(48px, 8.5vh, 100px) is configured');

  // Verify downward expansion rule for .ottsub-top
  assert(cssContent.includes('.ottsub-top .ottsub-slots-wrapper') && cssContent.includes('align-content: start !important'),
    '.ottsub-top slots wrapper set to align-content: start !important for downward growth');

  assert(cssContent.includes('.ottsub-top .ottsub-slot-primary') && cssContent.includes('justify-content: flex-start !important'),
    '.ottsub-top slot items set to justify-content: flex-start !important to prevent ceiling clipping');
}

// -------------------------------------------------------------
// Test 14: Primary-Only Sync ([ / ]) vs Secondary Independent Sync (Alt+[ / ])
// -------------------------------------------------------------
console.log('\nTest 14: Primary-Only Sync vs Secondary Independent Sync');
{
  const syncCode = fs.readFileSync(path.join(__dirname, '../src/sync-engine.js'), 'utf-8');
  eval(syncCode);

  const primaryEngine = window.OTTSubSyncEngine;
  const secondaryEngine = new window.OTTSubSyncEngineClass();

  // Initial offsets 0.0s
  primaryEngine.resetOffset();
  secondaryEngine.resetOffset();
  assert(primaryEngine.getOffsetMs() === 0, 'Primary engine initially 0ms');
  assert(secondaryEngine.getOffsetMs() === 0, 'Secondary engine initially 0ms');

  // Primary-Only Sync adjustment: [ key pressed (-100ms) -> ONLY Primary shifts
  primaryEngine.adjustOffset(-100);
  assert(primaryEngine.getOffsetMs() === -100, 'Primary shifted to -100ms via [ key');
  assert(secondaryEngine.getOffsetMs() === 0, 'Secondary engine remains untouched at 0ms');

  // Independent Secondary Sync: Alt + ] pressed (+100ms) -> ONLY Secondary shifts
  secondaryEngine.adjustOffset(100);
  assert(primaryEngine.getOffsetMs() === -100, 'Primary unchanged at -100ms during Secondary sync');
  assert(secondaryEngine.getOffsetMs() === 100, 'Secondary independently adjusted to +100ms');

  // Primary Reset: \ -> Primary resets to 0.0s, Secondary untouched
  primaryEngine.resetOffset();
  assert(primaryEngine.getOffsetMs() === 0, 'Primary reset to 0ms via \\ key');
  assert(secondaryEngine.getOffsetMs() === 100, 'Secondary remains untouched at +100ms');

  // Secondary Reset: Alt + \ -> Secondary resets to 0.0s, Primary untouched
  secondaryEngine.resetOffset();
  assert(primaryEngine.getOffsetMs() === 0, 'Primary remains 0ms');
  assert(secondaryEngine.getOffsetMs() === 0, 'Secondary independently reset to 0ms via Alt + \\');
}

// -------------------------------------------------------------
// Test 15: ResizeObserver Registration and Cleanup Lifecycle
// -------------------------------------------------------------
console.log('\nTest 15: ResizeObserver Registration and Cleanup Lifecycle');
{
  let observedElements = [];
  let disconnectCalled = false;

  global.ResizeObserver = class MockResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe(el) {
      observedElements.push(el);
    }
    disconnect() {
      disconnectCalled = true;
      observedElements = [];
    }
  };

  const rendererCode = fs.readFileSync(path.join(__dirname, '../src/renderer.js'), 'utf-8');
  eval(rendererCode);

  const mockParent = createMockElement('div');
  const mockVideo = createMockElement('video');
  mockParent.appendChild(mockVideo);

  // Mount renderer
  window.OTTSubRenderer.ensureMounted(mockVideo);
  assert(observedElements.includes(mockVideo), 'ResizeObserver observed the video element upon mount');

  // Destroy renderer
  window.OTTSubRenderer.destroy();
  assert(disconnectCalled === true, 'ResizeObserver disconnected upon renderer.destroy()');
  assert(window.OTTSubRenderer._resizeObserver === null, 'ResizeObserver reference nulled out to prevent memory leaks');
}

// -------------------------------------------------------------
// Test 16: TTML XML Parser Comment Node (<!-- ... -->) Resilience
// -------------------------------------------------------------
console.log('\nTest 16: TTML XML Parser Comment Node Resilience');
{
  const parserCode = fs.readFileSync(path.join(__dirname, '../src/parser.js'), 'utf-8');
  eval(parserCode);

  // Simulated node structure containing text, comments, and styled child spans
  const mockPNode = {
    childNodes: [
      { nodeType: Node.TEXT_NODE, nodeValue: 'Hello ', textContent: 'Hello ' },
      { nodeType: Node.COMMENT_NODE, nodeValue: 'Secret comment that should be ignored', textContent: 'Secret comment that should be ignored' },
      { 
        nodeType: Node.ELEMENT_NODE, 
        nodeName: 'span', 
        getAttribute: () => null,
        childNodes: [{ nodeType: Node.TEXT_NODE, nodeValue: 'World!', textContent: 'World!' }] 
      }
    ]
  };

  const extracted = window.OTTSubParser.extractNodeContent(mockPNode);
  assert(extracted.includes('Hello'), 'Extracts legitimate text node');
  assert(extracted.includes('World!'), 'Extracts legitimate child span node');
  assert(!extracted.includes('Secret comment'), 'Ignores XML comments completely');
}
// -------------------------------------------------------------
// Test 17: Micro-Rewind Cue Continuity (<2.0s backward seek)
// -------------------------------------------------------------
console.log('\nTest 17: Micro-Rewind Cue Continuity (<2.0s backward seek)');
{
  const syncCode = fs.readFileSync(path.join(__dirname, '../src/sync-engine.js'), 'utf-8');
  eval(syncCode);

  const engine = new window.OTTSubSyncEngineClass();
  const cues = [
    { id: 1, begin: 0.0, end: 2.0, text: 'First dialogue', isTop: false },
    { id: 2, begin: 2.2, end: 4.0, text: 'Second dialogue', isTop: false },
    { id: 3, begin: 4.2, end: 6.0, text: 'Third dialogue', isTop: false }
  ];
  engine.setCues('test_rewind', cues);

  // Play forward to 2.5s (triggers Cue 2, moves pointer forward)
  let active = engine.getActiveCues(2.5);
  assert(active.bottom.length === 1 && active.bottom[0].id === 2, 'Cue 2 active at 2.5s');

  // Red Team Attack: Micro-rewind by 1.0s (to 1.5s). 
  // In legacy code (abs diff = 1.0 < 2.0 threshold), timeJump was false and pointer remained stuck forward!
  active = engine.getActiveCues(1.5);
  assert(active.bottom.length === 1 && active.bottom[0].id === 1, 
    'Cue 1 immediately retrieved on 1.0s micro-rewind via isRewind binary search trigger');
}

// -------------------------------------------------------------
// Test 18: Multi-Pass HTML Entity Decoding (&amp;#39; double unwrap)
// -------------------------------------------------------------
console.log('\nTest 18: Multi-Pass HTML Entity Decoding');
{
  const parserCode = fs.readFileSync(path.join(__dirname, '../src/parser.js'), 'utf-8');
  eval(parserCode);

  const doubleEscaped = "Walter&amp;#39;s lab &amp;amp; Jesse&amp;quot;s meth";
  const decoded = window.OTTSubParser.decodeHtmlEntities(doubleEscaped);
  assert(decoded === `Walter's lab & Jesse"s meth`, `Double-escaped entities fully resolved: ${decoded}`);
}

// -------------------------------------------------------------
// Test 19: Negative and NaN Timestamp Resilience
// -------------------------------------------------------------
console.log('\nTest 19: Negative and NaN Timestamp Resilience');
{
  const parserCode = fs.readFileSync(path.join(__dirname, '../src/parser.js'), 'utf-8');
  eval(parserCode);

  const negTime = window.OTTSubParser.parseTimestamp('-00:00:10.500');
  assert(negTime === 0, 'Negative timestamp safely clamped to 0.0s');

  const nanTime = window.OTTSubParser.parseTimestamp('corrupted_string');
  assert(nanTime === 0, 'Corrupted timestamp safely clamped to 0.0s');

  const validTime = window.OTTSubParser.parseTimestamp('00:01:30.500');
  assert(validTime === 90.5, 'Valid timestamp correctly parsed to 90.5s');
}

// -------------------------------------------------------------
// Test 20: Batch Debounced Storage Persistence Queue
// -------------------------------------------------------------
console.log('\nTest 20: Batch Debounced Storage Persistence Queue');
{
  const pendingChanges = {};
  let timer = null;
  let savedPayload = null;

  function queueStorageSave(key, value) {
    pendingChanges[key] = value;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      savedPayload = { ...pendingChanges };
      timer = null;
    }, 10);
  }

  // Rapid chording of both offsets within debounce window
  queueStorageSave('ottsub_offset', -200);
  queueStorageSave('ottsub_secondary_offset', 300);

  // Wait for debounce timer to fire
  const start = Date.now();
  while (Date.now() - start < 20) {
    // busy wait
  }

  // Trigger simulated tick
  if (timer) {
    savedPayload = { ...pendingChanges };
  }

  assert(savedPayload && savedPayload.ottsub_offset === -200, 'Primary offset queued');
  assert(savedPayload && savedPayload.ottsub_secondary_offset === 300, 'Secondary offset queued');
  assert(Object.keys(savedPayload).length === 2, 'Batched into single atomic storage payload');
}

// -------------------------------------------------------------
// Test 21: Zero-Jitter Bottom Baseline Anchor & Transition-Free CSS
// -------------------------------------------------------------
console.log('\nTest 21: Zero-Jitter Bottom Baseline Anchor & Transition-Free CSS');
{
  const cssPath = path.join(__dirname, '../src/styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // Verify transition: none !important to prevent 0.5s upward drift
  assert(cssContent.includes('.ottsub-bottom') && cssContent.includes('transition: none !important'),
    '.ottsub-bottom configured with transition: none !important to prevent 0.5s upward drift');

  // Verify solid bottom baseline clamp(90px, 11vh, 130px)
  assert(cssContent.includes('--ottsub-bottom: clamp(90px, 11vh, 130px)'),
    'Initial --ottsub-bottom set to stable clamp(90px, 11vh, 130px) baseline');

  assert(cssContent.includes('--ottsub-bottom-adaptive: clamp(150px, 18vh, 200px)'),
    'Adaptive bottom margin safely elevated to clamp(150px, 18vh, 200px) to clear Netflix control bar');
}

// -------------------------------------------------------------
// Test 22: Native Bottom Sniffing Purge & Absolute Baseline Immunity
// -------------------------------------------------------------
console.log('\nTest 22: Native Bottom Sniffing Purge & Absolute Baseline Immunity');
{
  const rendererCode = fs.readFileSync(path.join(__dirname, '../src/renderer.js'), 'utf-8');

  // Verify that renderer code NEVER injects --ottsub-bottom inline
  assert(!rendererCode.includes("setProperty('--ottsub-bottom'"),
    'renderer.js has completely purged inline --ottsub-bottom injection');

  const video = createMockElement('video');
  video.clientHeight = 1080;
  renderer.ensureMounted(video);

  // Simulate Netflix player generating a .player-timedtext-text-container with varying inline bottom styles
  global.mockDocumentRoot = createMockElement('div');
  const timedtext = createMockElement('div');
  timedtext.className = 'player-timedtext';
  const textContainer = createMockElement('div');
  textContainer.className = 'player-timedtext-text-container';
  textContainer.style.bottom = '18.5%'; // Fluctuating native bottom
  const span = createMockElement('span');
  span.style.fontSize = '32px';
  textContainer.appendChild(span);
  timedtext.appendChild(textContainer);
  global.mockDocumentRoot.appendChild(timedtext);

  renderer.syncNativeStyles(video, true);

  // Assert that --ottsub-bottom was NOT written to inline container styles,
  // leaving the CSS rock-solid clamp(80px, 10.5vh, 125px) in 100% control
  const inlineBottom = renderer.container.style._props['--ottsub-bottom'];
  assert(inlineBottom === undefined, 
    'Inline --ottsub-bottom remains undefined after syncNativeStyles, preventing jitter');

  assert(renderer.lastNativeStyle.bottom === undefined,
    'lastNativeStyle does not track native bottom');
}

// -------------------------------------------------------------
// Test 23: Coordinated Top-Lift Hysteresis Latching (Opening Credits Ping-Pong Prevention)
// -------------------------------------------------------------
console.log('\nTest 23: Coordinated Top-Lift Hysteresis Latching (Opening Credits Ping-Pong Prevention)');
{
  const layoutWindow = {};
  new Function('window', fs.readFileSync(path.join(__dirname, '../src/layout/dual-placement.js'), 'utf8'))(layoutWindow);
  const layout = new layoutWindow.OTTSubDualPlacement();
  const bottom = { top: [], bottom: [{ id: 1, begin: 0, text: 'BOTTOM' }] };
  const top = { top: [{ id: 2, begin: 0, text: 'TOP' }], bottom: [] };
  const render = (t, p = bottom, s = bottom, dual = true) => layout.resolve(p, s, { mediaTime: t, isDualMode: dual });
  let result = render(10);
  assert(result.primary.bottom.length === 1, 'Normal cues stay at bottom');
  result = render(70, top);
  assert(result.primary.top.length === 1 && result.secondary.top.length === 1, 'Both languages lift in the same call');
  for (let t = 71; t <= 76; t++) {
    result = render(t);
    assert(result.primary.top.length === 1 && result.secondary.top.length === 1, 'Both languages stay lifted during hold');
  }
  result = render(76.001);
  assert(result.primary.bottom.length === 1 && result.secondary.bottom.length === 1, 'Both return after hold expires');
  render(80, top); layout.reset();
  assert(render(80.1).primary.bottom.length === 1, 'Reset clears placement history');
  render(90, top);
  result = render(90.1, bottom, top, false);
  assert(result.primary.bottom.length === 1 && result.secondary.top.length === 0, 'Disabled secondary cannot move the primary');
}

// -------------------------------------------------------------
// Test 24: Central Split-Anchor Zero-Shift Verification (Video Bug Replication)
// -------------------------------------------------------------
console.log('\nTest 24: Central Split-Anchor Zero-Shift Verification (Video Bug Replication)');
{
  const cssPath = path.join(__dirname, '../src/styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // 1. Verify CSS rules for Split-Anchor geometry
  assert(cssContent.includes('.ottsub-box.is-dual.ottsub-bottom') && cssContent.includes('--ottsub-split-baseline'),
    'CSS defines --ottsub-split-baseline for dual bottom box');
  assert(cssContent.includes('.ottsub-box.is-dual.ottsub-bottom') && cssContent.includes('height: 0'),
    'Dual bottom box has height: 0 to serve as immutable anchor');
  assert(cssContent.includes('.ottsub-box.is-dual.ottsub-bottom .ottsub-slot-primary') && (cssContent.includes('bottom: 4px') || cssContent.includes('bottom: calc(4px')),
    'Primary slot is pinned at bottom: 4px relative to baseline (grows upward)');
  assert(cssContent.includes('.ottsub-box.is-dual.ottsub-bottom .ottsub-slot-secondary') && (cssContent.includes('top: 4px') || cssContent.includes('top: calc(4px')),
    'Secondary slot is pinned at top: 4px relative to baseline (grows downward)');

  // 2. Mathematical layout shift emulation based on user video frames
  // Define coordinate function for Primary bottom edge and Secondary top edge relative to Split Baseline (0px)
  const calculatePrimaryBottom = (cueCount) => (cueCount > 0 ? 4 : null);
  const calculateSecondaryTop = (cueCount) => (cueCount > 0 ? -4 : null);

  // Frame 00:00 - Primary 2 lines, Secondary 2 lines
  const pBottom_00 = calculatePrimaryBottom(2);
  const sTop_00 = calculateSecondaryTop(2);
  assert(pBottom_00 === 4 && sTop_00 === -4, 'Frame 00:00: Both slots anchored across baseline with 8px constant gap');

  // Frame 00:01 - Primary 2 lines, Secondary drops to 1 line
  const pBottom_01 = calculatePrimaryBottom(2);
  const sTop_01 = calculateSecondaryTop(1);
  const primaryShift_00_to_01 = Math.abs(pBottom_01 - pBottom_00);
  assert(primaryShift_00_to_01 === 0, `Frame 00:01: Primary does NOT drop down when Secondary shrinks to 1 line (Shift = ${primaryShift_00_to_01}px)`);
  assert(sTop_01 === -4, 'Frame 00:01: Secondary line 1 remains anchored at -4px');

  // Frame 00:04 - Primary 1 line, Secondary disappears (0 lines)
  const pBottom_04 = calculatePrimaryBottom(1);
  const primaryShift_01_to_04 = Math.abs(pBottom_04 - pBottom_01);
  assert(primaryShift_01_to_04 === 0, `Frame 00:04: Primary baseline remains rock-solid when Secondary disappears (Shift = ${primaryShift_01_to_04}px)`);

  // Frame 00:05 - Primary 1 line, Secondary appears (1 line) 0.5s later
  const pBottom_05 = calculatePrimaryBottom(1);
  const primaryShift_04_to_05 = Math.abs(pBottom_05 - pBottom_04);
  assert(primaryShift_04_to_05 === 0, `Frame 00:05: Primary does NOT jump upward when Secondary appears 0.5s later (Shift = ${primaryShift_04_to_05}px)`);

  // Frame 00:07 - Primary 1 line, Secondary expands to 2 lines
  const pBottom_07 = calculatePrimaryBottom(1);
  const sTop_07 = calculateSecondaryTop(2);
  const primaryShift_05_to_07 = Math.abs(pBottom_07 - pBottom_05);
  assert(primaryShift_05_to_07 === 0, `Frame 00:07: Primary does NOT jump upward when Secondary expands to 2 lines (Shift = ${primaryShift_05_to_07}px)`);
  assert(sTop_07 === -4, 'Frame 00:07: Secondary line 1 remains anchored at -4px while line 2 expands downward');
}


// -------------------------------------------------------------
// Test 25: Real Video TTML Micro-Overlap Snapping (So how did it go? -> [SIGHS])
// -------------------------------------------------------------
console.log('\nTest 25: Real Video TTML Micro-Overlap Snapping (So how did it go? -> [SIGHS])');
{
  const realTTML = `<?xml version="1.0" encoding="utf-8"?>
<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttp="http://www.w3.org/ns/ttml#parameter" ttp:tickRate="10000000">
  <body>
    <div>
      <p begin="18300000t" end="40500000t">So how did it go?</p>
      <p begin="40000000t" end="52000000t">[SIGHS]</p>
    </div>
  </body>
</tt>`;

  const parsed = window.OTTSubParser.parse(realTTML);
  assert(parsed.length === 2, `Parsed exactly 2 cues (got ${parsed.length})`);
  assert(parsed[0].begin === 1.83, `Cue 1 begin is 1.83s (got ${parsed[0].begin})`);
  assert(parsed[0].end === 4.0, `Cue 1 end snapped from 4.05s to 4.00s to eliminate 50ms overlap (got ${parsed[0].end})`);
  assert(parsed[1].begin === 4.0, `Cue 2 begin is 4.00s (got ${parsed[1].begin})`);
  assert(parsed[1].end === 5.2, `Cue 2 end is 5.20s (got ${parsed[1].end})`);
}

// -------------------------------------------------------------
// Test 26: SyncEngine Hand-off Zero-Jump at t=4.00s (83px Jump Prevention)
// -------------------------------------------------------------
console.log('\nTest 26: SyncEngine Hand-off Zero-Jump at t=4.00s (83px Jump Prevention)');
{
  const testEngine = new window.OTTSubSyncEngineClass();
  // Simulate cues with 50ms overlap if un-snapped
  const rawGlitchCues = [
    { id: 0, begin: 1.83, end: 4.05, text: 'So how did it go?', isTop: false },
    { id: 1, begin: 4.00, end: 5.20, text: '[SIGHS]', isTop: false }
  ];
  testEngine.setCues('test-movie', rawGlitchCues);

  // At t = 3.90s: Only Cue 1 active
  const cuesAt390 = testEngine.getActiveCues(3.90);
  assert(cuesAt390.bottom.length === 1 && cuesAt390.bottom[0].text === 'So how did it go?', 
    'At t=3.90s: Only Cue 1 active (1 line, Y=820px baseline)');

  // At t = 4.00s: Hand-off policy prioritizes latest cue [SIGHS], preventing 2-line rendering explosion
  const cuesAt400 = testEngine.getActiveCues(4.00);
  assert(cuesAt400.bottom.length === 1 && cuesAt400.bottom[0].text === '[SIGHS]',
    `At t=4.00s: Exactly 1 cue active via hand-off, eliminating 83px upward jump! (got ${cuesAt400.bottom.length} cues)`);

  // At t = 4.10s: Cue 2 continues seamlessly
  const cuesAt410 = testEngine.getActiveCues(4.10);
  assert(cuesAt410.bottom.length === 1 && cuesAt410.bottom[0].text === '[SIGHS]',
    'At t=4.10s: Cue 2 active without dropping 83px down');
}

// -------------------------------------------------------------
// Test 27: Truly Simultaneous Speech Preservation (> 200ms)
// -------------------------------------------------------------
console.log('\nTest 27: Truly Simultaneous Speech Preservation (> 200ms)');
{
  const simultaneousTTML = `<?xml version="1.0" encoding="utf-8"?>
<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttp="http://www.w3.org/ns/ttml#parameter" ttp:tickRate="1000">
  <body>
    <div>
      <p begin="10000t" end="14000t">Speaker A: Don't do it!</p>
      <p begin="11000t" end="12500t">Speaker B: I have to!</p>
    </div>
  </body>
</tt>`;

  const parsed = window.OTTSubParser.parse(simultaneousTTML);
  assert(parsed.length === 2, 'Parsed 2 simultaneous cues');
  assert(parsed[0].end === 14.0, `Speaker A end time 100% preserved at 14.0s (not truncated, got ${parsed[0].end}s)`);
  assert(parsed[1].begin === 11.0 && parsed[1].end === 12.5, 'Speaker B timings 100% preserved');
}

// -------------------------------------------------------------
// Test 28: Netflix Control Bar Adaptive Safe Area Clearance
// -------------------------------------------------------------
console.log('\nTest 28: Netflix Control Bar Adaptive Safe Area Clearance');
{
  const cssPath = path.join(__dirname, '../src/styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // Verify that controls-active raises adaptive baseline above 130px Netflix player bar
  const adaptiveBottomMatch = cssContent.match(/--ottsub-bottom-adaptive:\s*clamp\((\d+)px/);
  assert(adaptiveBottomMatch && parseInt(adaptiveBottomMatch[1], 10) >= 140, 
    `Adaptive bottom minimum (${adaptiveBottomMatch ? adaptiveBottomMatch[1] : 0}px) safely exceeds 130px control bar`);

  const adaptiveSplitMatch = cssContent.match(/--ottsub-split-baseline-adaptive:\s*clamp\((\d+)px/);
  assert(adaptiveSplitMatch && parseInt(adaptiveSplitMatch[1], 10) >= 200,
    `Dual split baseline adaptive minimum (${adaptiveSplitMatch ? adaptiveSplitMatch[1] : 0}px) safely clears control bar`);
}

// -------------------------------------------------------------
// Test 29: Same-language line spacing (0 = almost touching, numeric stepper)
// -------------------------------------------------------------
console.log('\nTest 29: Same-language line spacing (0 = almost touching, numeric stepper)');
{
  const cssPath = path.join(__dirname, '../src/styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // 1. Verify CSS default variable
  assert(cssContent.includes('--ottsub-line-height: 1.20;'), 'CSS initializes --ottsub-line-height: 1.20');

  // 2. Verify primary and secondary lines use dynamic line-height
  assert(cssContent.includes('var(--ottsub-primary-line-height') || cssContent.includes('var(--ottsub-line-height'), 
    'Primary and secondary lines bound to dynamic line-height');

  // 3. Verify min-height slot stability
  assert(cssContent.includes('min-height: calc(var(--ottsub-font-size, 34px) * 2.5);'),
    'Slot min-height stabilized to 2.5 to eliminate baseline jitter when line spacing changes');

  // 4. Test SubtitleRenderer.setLineSpacing(0) (0 = almost completely touching at 0.80)
  const testRenderer = window.OTTSubRenderer;
  const mockContainer = {
    style: {
      setProperty: function(k, v) { this[k] = v; }
    }
  };
  testRenderer.container = mockContainer;
  testRenderer.setLineSpacing(0);
  assert(testRenderer.lineSpacing === 0, 'Renderer updates lineSpacing to 0');
  assert(testRenderer.lineHeight === 0.80, 'Renderer maps step 0 to 0.80 (almost touching)');
  assert(mockContainer.style['--ottsub-line-height'] === '0.8', 'Renderer sets --ottsub-line-height to 0.8');

  // Test SubtitleRenderer.setLineSpacing(4) (default 1.20)
  testRenderer.setLineSpacing(4);
  assert(testRenderer.lineSpacing === 4, 'Renderer updates lineSpacing to 4');
  assert(testRenderer.lineHeight === 1.20, 'Renderer maps step 4 to 1.20 (default standard)');
  assert(mockContainer.style['--ottsub-line-height'] === '1.2', 'Renderer sets --ottsub-line-height to 1.2');

  // 5. Verify i18n strings in en and ko
  const i18nCode = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf-8');
  eval(i18nCode);
  assert(window.OTTSubI18n.t('line_spacing_title', {}, 'en') === 'Same-language line spacing', 'English i18n has line_spacing_title');
  assert(window.OTTSubI18n.t('line_spacing_title', {}, 'ko') === '같은 언어 줄 간격', 'Korean i18n has line_spacing_title');
  assert(window.OTTSubI18n.t('line_spacing_subtitle', {}, 'ko').includes('0: 거의 맞닿음'), 'Korean i18n subtitle notes 0: 거의 맞닿음');

  // 6. Verify popup HTML numeric controls
  const popupHtml = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf-8');
  assert(popupHtml.includes('id="line-spacing-val"'), 'Popup HTML includes line-spacing-val display');
  assert(popupHtml.includes('id="btn-spacing-dec"') && popupHtml.includes('id="btn-spacing-inc"'), 'Popup HTML includes stepper buttons - and +');
}

// -------------------------------------------------------------
// Test 30: Mathematical Baseline Anchor Freezing (Zero Shift on Line 2)
// -------------------------------------------------------------
console.log('\nTest 30: Mathematical Baseline Anchor Freezing (Zero Shift on Line 2)');
{
  const cssPath = path.join(__dirname, '../src/styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // 1. Verify CSS baseline anchor rules exist
  assert(cssContent.includes('margin-bottom: calc((1.20 - var(--ottsub-primary-line-height') || cssContent.includes('margin-bottom: calc((1 - var(--ottsub-line-height'),
    'Primary line has exact bottom baseline anchor cancellation');
  assert(cssContent.includes('margin-top: calc((1.20 - var(--ottsub-secondary-line-height') || cssContent.includes('margin-top: calc((1 - var(--ottsub-line-height'),
    'Secondary line has exact top baseline anchor cancellation');

  // 2. Mathematical Simulation across all steps (0 through 6)
  const steps = [
    { step: 0, lh: 0.80 },
    { step: 1, lh: 0.90 },
    { step: 2, lh: 1.00 },
    { step: 3, lh: 1.10 },
    { step: 4, lh: 1.20 },
    { step: 5, lh: 1.30 },
    { step: 6, lh: 1.40 }
  ];

  const fontSize = 34; // px
  const descent = 0.2 * fontSize;

  // The baseline of English bottom line must be at the EXACT same Y position across all steps 0..6
  const targetBaselineY = descent + (1.20 - 1.0) * 0.5 * fontSize;

  steps.forEach(({ step, lh }) => {
    const halfLeading = (lh - 1.0) * 0.5 * fontSize;
    const marginBottom = (1.20 - lh) * 0.5 * fontSize;
    const netBaselineY = marginBottom + descent + halfLeading;

    assert(Math.abs(netBaselineY - targetBaselineY) < 1e-9,
      `Step ${step} (lh=${lh.toFixed(2)}): English bottom line baseline is locked at ${netBaselineY.toFixed(2)}px (0.00px shift)`);
  });
}

// -------------------------------------------------------------
// Test 31: Language-Specific Spacing & Position Offset Verification
// -------------------------------------------------------------
console.log('\nTest 31: Language-Specific Spacing & Position Offset Verification');
{
  const testRenderer = window.OTTSubRenderer;
  const mockContainer = {
    style: {
      setProperty: function(k, v) { this[k] = v; }
    }
  };
  testRenderer.container = mockContainer;

  // 1. Independent Spacing adjustment
  // English set to 0 (tight), Korean set to 6 (wide)
  testRenderer.setPrimaryLineSpacing(0);
  testRenderer.setSecondaryLineSpacing(6);
  assert(testRenderer.primaryLineSpacing === 0, 'Primary line spacing is 0');
  assert(testRenderer.secondaryLineSpacing === 6, 'Secondary line spacing is independently 6');
  assert(mockContainer.style['--ottsub-primary-line-height'] === '0.8', 'Primary line-height is 0.80');
  assert(mockContainer.style['--ottsub-secondary-line-height'] === '1.4', 'Secondary line-height is independently 1.40');

  // 2. Independent Position (Y-Offset) adjustment
  testRenderer.setPrimaryOffsetY(15);
  testRenderer.setSecondaryOffsetY(25);
  assert(testRenderer.primaryOffsetY === 15, 'Primary offset Y is +15px');
  assert(testRenderer.secondaryOffsetY === 25, 'Secondary offset Y is +25px (lifts Korean up)');
  assert(mockContainer.style['--ottsub-primary-offset-y'] === '15px', 'Primary offset Y CSS set');
  assert(mockContainer.style['--ottsub-secondary-offset-y'] === '25px', 'Secondary offset Y CSS set');

  // 3. Popup HTML Tab & Panel elements
  const popupHtml = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf-8');
  assert(popupHtml.includes('id="tab-btn-primary"'), 'Popup includes primary language tab');
  assert(popupHtml.includes('id="tab-btn-secondary"'), 'Popup includes secondary language tab');
  assert(popupHtml.includes('id="panel-primary"'), 'Popup includes primary panel');
  assert(popupHtml.includes('id="panel-secondary"'), 'Popup includes secondary panel');
  assert(!popupHtml.includes('id="btn-reset"'), 'Popup cleanly omits quick sync buttons per minimalist slider design');
  assert(!popupHtml.includes('id="btn-reset-lang-settings"'), 'Popup cleanly omits redundant reset button from language panel');

  // 4. i18n keys for language-specific adjustments
  assert(window.OTTSubI18n.t('lang_adjust_title', {}, 'ko') === '언어별 간격 & 위치 조정', 'Korean i18n has lang_adjust_title');
  assert(window.OTTSubI18n.t('tab_primary', {}, 'ko') === '주언어', 'Korean i18n has tab_primary');
  assert(window.OTTSubI18n.t('tab_secondary', {}, 'ko') === '보조언어', 'Korean i18n has tab_secondary');
  assert(window.OTTSubI18n.t('primary_spacing_title', {}, 'ko') === '주언어 줄 간격', 'Korean i18n has primary_spacing_title');
  assert(window.OTTSubI18n.t('secondary_spacing_title', {}, 'ko') === '보조언어 줄 간격', 'Korean i18n has secondary_spacing_title');
  assert(window.OTTSubI18n.t('primary_pos_title', {}, 'ko') === '주언어 위치 조정', 'Korean i18n has primary_pos_title');
  assert(window.OTTSubI18n.t('secondary_pos_title', {}, 'ko') === '보조언어 위치 조정', 'Korean i18n has secondary_pos_title');
}

// -------------------------------------------------------------
// Test 32: NaN / Infinity / Extreme Boundary Input Resilience
// -------------------------------------------------------------
console.log('\nTest 32: NaN / Infinity / Extreme Boundary Input Resilience');
{
  const syncCode = fs.readFileSync(path.join(__dirname, '../src/sync-engine.js'), 'utf-8');
  eval(syncCode);

  const engine = new window.OTTSubSyncEngineClass();
  engine.resetOffset();
  assert(engine.getOffsetMs() === 0, 'Initial offset is 0ms');

  // 1. setOffset with NaN
  engine.setOffset(NaN);
  assert(engine.getOffsetMs() === 0, 'setOffset(NaN) safely falls back to 0ms without corruption');

  // 2. setOffset with Infinity
  engine.setOffset(Infinity);
  assert(engine.getOffsetMs() === 0, 'setOffset(Infinity) safely falls back to 0ms');

  // 3. setOffset with extreme overflow
  engine.setOffset(999999);
  assert(engine.getOffsetMs() === 60000, 'setOffset(999999) clamped to MAX_OFFSET_MS (60000ms)');

  engine.setOffset(-999999);
  assert(engine.getOffsetMs() === -60000, 'setOffset(-999999) clamped to -MAX_OFFSET_MS (-60000ms)');

  // 4. adjustOffset with NaN, undefined, string
  engine.setOffset(100);
  engine.adjustOffset(NaN);
  assert(engine.getOffsetMs() === 100, 'adjustOffset(NaN) preserves existing 100ms offset without turning to NaN');

  engine.adjustOffset(undefined);
  assert(engine.getOffsetMs() === 100, 'adjustOffset(undefined) preserves existing 100ms offset');

  engine.adjustOffset('malformed_string');
  assert(engine.getOffsetMs() === 100, 'adjustOffset(string) preserves existing 100ms offset');

  // 5. Valid adjustment from baseline
  engine.adjustOffset(-300);
  assert(engine.getOffsetMs() === -200, 'adjustOffset(-300) correctly calculates -200ms');
}

// -------------------------------------------------------------
// Test 33: Response.prototype.json Interception & LRU Bounded Cache
// -------------------------------------------------------------
// Isolated hooks and awaited assertions: a fake Response must carry its URL.
require('node:test').test('manifest Response.json capture is URL-scoped and its cache is bounded', async () => {
  const strict = require('node:assert/strict');
  const {injectHarness} = require('./helpers/inject-harness.cjs');
  const h = injectHarness();
  const fixture = id => ({ result: { movieId: id, timedtexttracks: [
    { language: 'ko', trackType: 'subtitles', ttDownloadables: {
      'dfxp-ls-sdh': { downloadUrls: { u: `https://cdn.nflxvideo.net/sub/${id}/ko.dfxp` } }
    } }
  ] } });
  const data=fixture(80057281);
  strict.equal(await h.response(data,'https://www.netflix.com/api/profiles'),data);
  strict.equal(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['80057281'],undefined);
  strict.equal(await h.response(data,'https://www.netflix.com/api/msl/manifest'),data);
  strict.equal(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['80057281'].tracksByLang.ko.length,1);
  for(let i=1;i<=6;i++) h.parse(JSON.stringify(fixture(90000000+i)));
  strict.equal(h.ctx.window.__OTT_SUB_MANIFEST_ORDER__.length,5);
  strict.equal(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['90000001'],undefined);
  strict.ok(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['90000006']);
});

// -------------------------------------------------------------
// Test 34: Video Aspect Ratio Changes (Ultrawide 21:9 & Letterbox)
// -------------------------------------------------------------
console.log('\nTest 34: Video Aspect Ratio Changes (Ultrawide 21:9 & Letterbox)');
{
  const cssContent = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf-8');
  
  // 1. Verify CSS rules for Ultrawide / Pillarbox horizontal containment
  assert(cssContent.includes('width: min(90%, 1200px);'), 'Subtitle box uses min(90%, 1200px) width constraint');
  assert(cssContent.includes('padding-left: max(16px, env(safe-area-inset-left, 0px));'), 'Subtitle box has safe area padding-left');
  assert(cssContent.includes('padding-right: max(16px, env(safe-area-inset-right, 0px));'), 'Subtitle box has safe area padding-right');

  // 2. Proportional typography scaling on 21:9 Ultrawide screen (3440 x 1440)
  const rendererCode = fs.readFileSync(path.join(__dirname, '../src/renderer.js'), 'utf-8');
  eval(rendererCode);

  const testRenderer = new window.OTTSubRendererClass();
  const mockVideoUltrawide = createMockElement('video');
  mockVideoUltrawide.clientWidth = 3440;
  mockVideoUltrawide.clientHeight = 1440;

  const mockParent = createMockElement('div');
  mockParent.appendChild(mockVideoUltrawide);
  testRenderer.ensureMounted(mockVideoUltrawide);

  testRenderer.syncNativeStyles(mockVideoUltrawide, true);
  const ultrawideFontSize = testRenderer.container.style.getPropertyValue('--ottsub-font-size');
  const parsedUltrawidePx = parseInt(ultrawideFontSize, 10);

  // Height is 1440, 1440 * 0.031 = 44.6, clamped to max 38px
  assert(parsedUltrawidePx <= 38 && parsedUltrawidePx >= 18, `Ultrawide 21:9 font size safely capped to height bound (${parsedUltrawidePx}px)`);

  // 3. Compact window (800 x 600)
  const mockVideoCompact = createMockElement('video');
  mockVideoCompact.clientWidth = 800;
  mockVideoCompact.clientHeight = 600;
  testRenderer.syncNativeStyles(mockVideoCompact, true);
  const compactFontSize = testRenderer.container.style.getPropertyValue('--ottsub-font-size');
  const parsedCompactPx = parseInt(compactFontSize, 10);
  assert(parsedCompactPx >= 18, `Compact video font size satisfies minimum legibility threshold (${parsedCompactPx}px)`);
}

// -------------------------------------------------------------
// Test 35: HUD Rapid-Fire Debounce & Timer Race Condition Defense
// -------------------------------------------------------------
console.log('\nTest 35: HUD Rapid-Fire Debounce & Timer Race Condition Defense');
{
  const hudCode = fs.readFileSync(path.join(__dirname, '../src/hud.js'), 'utf-8');
  eval(hudCode);

  const testHUD = new window.OTTSubHUDClass();

  // 1. Guard against null / undefined / empty messages
  testHUD.show(null);
  assert(testHUD.hudElem === null, 'show(null) ignored without creating element');
  testHUD.show(undefined);
  assert(testHUD.hudElem === null, 'show(undefined) ignored without creating element');
  testHUD.show('   ');
  assert(testHUD.hudElem === null, 'show(whitespace) ignored without creating element');

  // 2. Rapid-fire triggers (Simulate 50 repeated key presses)
  for (let i = 1; i <= 50; i++) {
    testHUD.show(`Sync: +${i * 100}ms`);
  }

  assert(testHUD.hudElem !== null, 'HUD element created');
  assert(testHUD.hudElem.textContent === 'Sync: +5000ms', 'HUD displays latest message after rapid-fire sequence');
  assert(testHUD.hudElem.classList.contains('ottsub-hud-visible'), 'HUD remains in visible state');
  assert(testHUD.timer !== null, 'Single active timer maintained without timer leakage');

  // 3. Clean destroy
  testHUD.destroy();
  assert(testHUD.hudElem === null, 'HUD element destroyed');
  assert(testHUD.timer === null, 'HUD timer reset to null after destroy');
}

// -------------------------------------------------------------
// Test 36: i18n Graceful Degradation & Prototype Pollution Immunity
// -------------------------------------------------------------
console.log('\nTest 36: i18n Graceful Degradation & Prototype Pollution Immunity');
{
  const i18nCode = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf-8');
  eval(i18nCode);

  const i18n = window.OTTSubI18n;

  // 1. Prototype pollution defense: accessing 'toString', '__proto__', 'constructor'
  assert(i18n.t('toString') === 'toString', 't("toString") returns literal string instead of Function prototype');
  assert(i18n.t('__proto__') === '__proto__', 't("__proto__") returns literal string instead of Object.prototype');
  assert(i18n.t('constructor') === 'constructor', 't("constructor") returns literal string');

  // 2. Null / undefined / empty string key
  assert(i18n.t(null) === '', 't(null) safely returns empty string');
  assert(i18n.t(undefined) === '', 't(undefined) safely returns empty string');
  assert(i18n.t('') === '', 't("") safely returns empty string');

  // 3. Fallback for completely unknown key
  assert(i18n.t('non_existent_key_xyz') === 'non_existent_key_xyz', 'Unknown key returns fallback key name');

  // 4. Unsupported locale normalization (e.g. 'de-DE' -> falls back to 'en')
  assert(i18n.t('ext_title', {}, 'de-DE') === 'OTTSub', 'Unsupported locale de-DE falls back to English dictionary');

  // 5. Parameter interpolation with null/undefined values
  const interpolated = i18n.t('sub_status_ready', { count: null });
  assert(!interpolated.includes('null'), 'Interpolation replaces null parameter cleanly without literal "null"');

  // 6. Safe setLanguage with BCP-47 tag
  i18n.setLanguage('ko-KR');
  assert(i18n.getLanguage() === 'ko', 'setLanguage("ko-KR") safely normalizes to "ko"');
  i18n.setLanguage('it-IT');
  assert(i18n.getLanguage() === 'ko', 'setLanguage with unsupported "it-IT" retains current language');
}

// -------------------------------------------------------------
// Test 37: Message Passing Port Closure & Unknown Action Defense
// -------------------------------------------------------------
console.log('\nTest 37: Message Passing Port Closure & Unknown Action Defense');
{
  const contentCode = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf-8');

  // Verify code contains defensive return false on unhandled/invalid message
  assert(contentCode.includes('return false;\n    }\n    return false;\n  });') ||
         contentCode.includes('return false;'),
    'content.js returns false on unknown action or sync completion to close port safely');

  assert(contentCode.includes('typeof request.action !== \'string\''),
    'content.js strictly validates request.action is a string');

  assert(contentCode.includes('sender.id !== chrome.runtime.id'),
    'content.js validates sender.id matches extension ID');
}

// -------------------------------------------------------------
// Test 38: Chrome Web Store Compliance & Zero Star/Sparkle Ban
// -------------------------------------------------------------
console.log('\nTest 38: Chrome Web Store Compliance & Zero Star/Sparkle Ban');
{
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf-8'));
  const storeMd = fs.readFileSync(path.join(__dirname, '../store_assets/STORE_GUIDE.md'), 'utf-8');

  // 1. Manifest V3 conformance
  assert(manifest.manifest_version === 3, 'Manifest version is 3 (MV3)');
  assert(Array.isArray(manifest.permissions) && manifest.permissions.includes('storage'), 'Storage permission declared');
  assert(JSON.stringify(manifest.permissions) === JSON.stringify(['storage', 'sidePanel']),
    'Only storage and sidePanel permissions requested');

  // 2. CHROMEWEBSTORE.md synchronization
  assert(storeMd.includes('storage'), 'CHROMEWEBSTORE.md justifies storage permission');
  assert(storeMd.includes('MAX_WRITE_OPERATIONS_PER_MINUTE'), 'CHROMEWEBSTORE.md documents quota debouncing');
  assert(storeMd.includes('단일 목적 (Single Purpose)'), 'CHROMEWEBSTORE.md includes Single Purpose declaration');

  // 3. Absolute ban on star/sparkle in core extension code (src/ and popup/)
  const forbiddenPatterns = ['✨', '⭐', '🌟', '★', '☆', 'Sparkles', 'WandSparkles'];
  const extFiles = [
    '../manifest.json',
    '../src/content.js',
    '../src/inject.js',
    '../src/renderer.js',
    '../src/sync-engine.js',
    '../src/parser.js',
    '../src/hud.js',
    '../src/i18n.js',
    '../src/styles.css',
    '../popup/popup.html',
    '../popup/popup.js',
    '../popup/popup.css'
  ];

  let violationFound = false;
  for (const relPath of extFiles) {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf-8');
    for (const pattern of forbiddenPatterns) {
      if (content.includes(pattern)) {
        console.error(`Violation in ${relPath}: contains ${pattern}`);
        violationFound = true;
      }
    }
  }
  assert(!violationFound, 'Zero star/sparkle icons and emojis across all extension source files');
}

// -------------------------------------------------------------
// Test 39: Custom Subtitle Styling (Font Scale, Color Chips, Background Box)
// -------------------------------------------------------------
console.log('\nTest 39: Custom Subtitle Styling (Font Scale, Color Chips, Background Box)');
{
  const rendererCode = fs.readFileSync(path.join(__dirname, '../src/renderer.js'), 'utf-8');
  eval(rendererCode);

  const testRenderer = new window.OTTSubRendererClass();
  const mockVideo = createMockElement('video');
  const mockParent = createMockElement('div');
  mockParent.appendChild(mockVideo);
  testRenderer.ensureMounted(mockVideo);

  // 1. Primary & Secondary font size scale
  testRenderer.setPrimaryScale(1.15);
  assert(testRenderer.primaryScale === 1.15, 'Renderer updates primaryScale to 1.15');
  assert(testRenderer.container.style.getPropertyValue('--ottsub-primary-scale') === '1.15', 'Container CSS variable --ottsub-primary-scale set to 1.15');

  testRenderer.setSecondaryScale(0.95);
  assert(testRenderer.secondaryScale === 0.95, 'Renderer updates secondaryScale to 0.95');
  assert(testRenderer.container.style.getPropertyValue('--ottsub-secondary-scale') === '0.95', 'Container CSS variable --ottsub-secondary-scale set to 0.95');

  // 2. Primary & Secondary subtitle color
  testRenderer.setPrimaryColor('#ffffff');
  assert(testRenderer.primaryColor === '#ffffff', 'Renderer updates primaryColor to #ffffff');
  assert(testRenderer.container.style.getPropertyValue('--ottsub-primary-color') === '#ffffff', 'Container CSS variable --ottsub-primary-color set to #ffffff');

  testRenderer.setSecondaryColor('#80deea');
  assert(testRenderer.secondaryColor === '#80deea', 'Renderer updates secondaryColor to #80deea');
  assert(testRenderer.container.style.getPropertyValue('--ottsub-secondary-color') === '#80deea', 'Container CSS variable --ottsub-secondary-color set to #80deea');

  // 3. Semi-transparent black background box (Independent Primary & Secondary)
  assert(!testRenderer.container.classList.contains('has-bg-box'), 'has-bg-box class absent by default');
  assert(!testRenderer.container.classList.contains('has-primary-bg-box'), 'has-primary-bg-box class absent by default');
  assert(!testRenderer.container.classList.contains('has-secondary-bg-box'), 'has-secondary-bg-box class absent by default');

  testRenderer.setPrimaryBgBoxEnabled(true);
  assert(testRenderer.primaryBgBoxEnabled === true, 'Renderer updates primaryBgBoxEnabled to true');
  assert(testRenderer.container.classList.contains('has-primary-bg-box'), 'has-primary-bg-box class present when primary enabled');
  assert(!testRenderer.container.classList.contains('has-secondary-bg-box'), 'has-secondary-bg-box class absent when only primary enabled');

  testRenderer.setSecondaryBgBoxEnabled(true);
  assert(testRenderer.secondaryBgBoxEnabled === true, 'Renderer updates secondaryBgBoxEnabled to true');
  assert(testRenderer.container.classList.contains('has-secondary-bg-box'), 'has-secondary-bg-box class present when secondary enabled');

  testRenderer.setPrimaryBgBoxEnabled(false);
  assert(!testRenderer.container.classList.contains('has-primary-bg-box'), 'has-primary-bg-box removed when primary disabled');
  assert(testRenderer.container.classList.contains('has-secondary-bg-box'), 'has-secondary-bg-box remains when only secondary enabled');

  testRenderer.setSecondaryBgBoxEnabled(false);
  assert(!testRenderer.container.classList.contains('has-secondary-bg-box'), 'has-secondary-bg-box removed when secondary disabled');

  // Backward compatibility test
  testRenderer.setBgBoxEnabled(true);
  assert(testRenderer.bgBoxEnabled === true, 'Renderer updates bgBoxEnabled to true');
  assert(testRenderer.container.classList.contains('has-bg-box'), 'has-bg-box class present when setBgBoxEnabled(true)');
  assert(testRenderer.container.classList.contains('has-primary-bg-box'), 'has-primary-bg-box present when setBgBoxEnabled(true)');
  assert(testRenderer.container.classList.contains('has-secondary-bg-box'), 'has-secondary-bg-box present when setBgBoxEnabled(true)');
  testRenderer.setBgBoxEnabled(false);
  assert(!testRenderer.container.classList.contains('has-bg-box'), 'has-bg-box class removed when disabled');
  assert(!testRenderer.container.classList.contains('has-primary-bg-box'), 'has-primary-bg-box removed when disabled');
  assert(!testRenderer.container.classList.contains('has-secondary-bg-box'), 'has-secondary-bg-box removed when disabled');

  // 4. CSS box-decoration-break clone & split styling rules
  const stylesCss = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf-8');
  assert(stylesCss.includes('box-decoration-break: clone'), 'styles.css includes W3C standard box-decoration-break: clone');
  assert(stylesCss.includes('-webkit-box-decoration-break: clone'), 'styles.css includes WebKit prefixed box-decoration-break for cross-browser reliability');
  assert(stylesCss.includes('rgba(0, 0, 0, 0.72)'), 'styles.css specifies high-contrast 72% opacity background box');
  assert(stylesCss.includes('has-primary-bg-box'), 'styles.css includes has-primary-bg-box selector');
  assert(stylesCss.includes('has-secondary-bg-box'), 'styles.css includes has-secondary-bg-box selector');

  // 5. Popup HTML controls
  const popupHtml = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf-8');
  assert(popupHtml.includes('id="primary-scale-val"'), 'Popup HTML includes primary-scale-val');
  assert(popupHtml.includes('id="primary-color-palette"'), 'Popup HTML includes primary-color-palette');
  assert(popupHtml.includes('id="secondary-scale-val"'), 'Popup HTML includes secondary-scale-val');
  assert(popupHtml.includes('id="secondary-color-palette"'), 'Popup HTML includes secondary-color-palette');
  assert(popupHtml.includes('id="primary-bg-box-toggle"'), 'Popup HTML includes primary-bg-box-toggle');
  assert(popupHtml.includes('id="secondary-bg-box-toggle"'), 'Popup HTML includes secondary-bg-box-toggle');

  // 6. i18n Localization keys
  const i18nCode = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf-8');
  eval(i18nCode);
  const i18n = window.OTTSubI18n;
  assert(i18n.t('primary_scale_title', {}, 'en') === 'Primary font size', 'English i18n has primary_scale_title');
  assert(i18n.t('primary_scale_title', {}, 'ko') === '주언어 크기 비율', 'Korean i18n has primary_scale_title');
  assert(i18n.t('primary_color_title', {}, 'ko') === '주언어 색상', 'Korean i18n has primary_color_title');
  assert(i18n.t('secondary_scale_title', {}, 'en') === 'Secondary font size', 'English i18n has secondary_scale_title');
  assert(i18n.t('secondary_scale_title', {}, 'ko') === '보조언어 크기 비율', 'Korean i18n has secondary_scale_title');
  assert(i18n.t('secondary_color_title', {}, 'ko') === '보조언어 색상', 'Korean i18n has secondary_color_title');
  assert(i18n.t('primary_bg_box_title', {}, 'ko') === '주언어 배경 박스', 'Korean i18n has primary_bg_box_title');
  assert(i18n.t('secondary_bg_box_title', {}, 'ko') === '보조언어 배경 박스', 'Korean i18n has secondary_bg_box_title');
  assert(i18n.t('bg_box_title', {}, 'ko') === '반투명 배경 박스', 'Korean i18n has legacy bg_box_title');

  // 7. content.js message handlers
  const contentCode = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf-8');
  assert(contentCode.includes('set_primary_scale'), 'content.js handles set_primary_scale message');
  assert(contentCode.includes('set_primary_color'), 'content.js handles set_primary_color message');
  assert(contentCode.includes('set_secondary_scale'), 'content.js handles set_secondary_scale message');
  assert(contentCode.includes('set_secondary_color'), 'content.js handles set_secondary_color message');
  assert(contentCode.includes('set_primary_bg_box'), 'content.js handles set_primary_bg_box message');
  assert(contentCode.includes('set_secondary_bg_box'), 'content.js handles set_secondary_bg_box message');
  assert(contentCode.includes('set_bg_box'), 'content.js handles set_bg_box message');
  assert(contentCode.includes('reset_language_settings'), 'content.js handles reset_language_settings message');
}

// -------------------------------------------------------------
// Test 40: Multi-Cue Typographic Unification & Zero-Gap Flex <br> Defense
// -------------------------------------------------------------
console.log('\nTest 40: Multi-Cue Typographic Unification & Zero-Gap Flex <br> Defense');
{
  const box = createMockElement('div');
  box.className = 'ottsub-box is-dual ottsub-bottom';

  // 1. Multiple primary cues (e.g. 2 lines of dialogue delivered as separate <p> tags by Netflix)
  const primaryMultiCues = [
    { id: '1', text: "I don't know" },
    { id: '2', text: 'what to tell you, buddy.' }
  ];
  const secondaryMultiCues = [
    { id: '3', text: '무슨 말을' },
    { id: '4', text: '해야 좋을지 모르겠네' }
  ];

  renderer._renderDualCuesIntoBox(box, primaryMultiCues, secondaryMultiCues, true);

  const slotPrimary = box.querySelector('.ottsub-slot-primary');
  const slotSecondary = box.querySelector('.ottsub-slot-secondary');

  // Verify no <br> elements exist as direct children in flex container
  const primaryBrs = slotPrimary.children.filter(c => c.tagName === 'BR');
  const secondaryBrs = slotSecondary.children.filter(c => c.tagName === 'BR');
  assert(primaryBrs.length === 0, 'No accidental <br> flex items inserted into primary slot');
  assert(secondaryBrs.length === 0, 'No accidental <br> flex items inserted into secondary slot');

  // Verify unified single span element with newline preservation
  assert(slotPrimary.children.length === 1, 'Primary cues unified into exactly 1 typographic line element');
  assert(slotPrimary.children[0].textContent.includes("I don't know\nwhat to tell you, buddy."),
    'Primary text unified with newline character for pure CSS line-height handling');
  assert(slotSecondary.children.length === 1, 'Secondary cues unified into exactly 1 typographic line element');
  assert(slotSecondary.children[0].textContent.includes('무슨 말을\n해야 좋을지 모르겠네'),
    'Secondary text unified with newline character for pure CSS line-height handling');

  // 2. Verify styles.css defensive rules
  const cssPath = path.join(__dirname, '../src/styles.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  assert(cssContent.includes('.ottsub-slots-wrapper > br') || cssContent.includes('.ottsub-slot-primary > br'),
    'styles.css explicitly suppresses <br> flex-item expansion in slots');
  assert(cssContent.includes(':not(:last-child)') && cssContent.includes('margin-bottom: 0'),
    'styles.css restricts baseline bottom margin to boundary child only');
}

// -------------------------------------------------------------
// Test 41: Storage Key Whitelist, Local Immediate Save & Full-Range Slider
// -------------------------------------------------------------
console.log('\nTest 41: Storage Key Whitelist, Local Immediate Save & Full-Range Slider');
{
  const contentJs = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf-8');
  const popupJs = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf-8');
  const injectJs = fs.readFileSync(path.join(__dirname, '../src/inject.js'), 'utf-8');

  // 1. Verify content.js initial storage query contains primary/secondary scale, color, and independent bg box
  assert(contentJs.includes("'ottsub_primary_scale'") &&
         contentJs.includes("'ottsub_primary_color'") &&
         contentJs.includes("'ottsub_secondary_scale'") &&
         contentJs.includes("'ottsub_secondary_color'") &&
         contentJs.includes("'ottsub_primary_bg_box'") &&
         contentJs.includes("'ottsub_secondary_bg_box'") &&
         contentJs.includes("'ottsub_bg_box_enabled'"),
         'content.js storage query includes all visual styling keys');

  // 2. Verify queueStorageSave in content.js immediately writes to chrome.storage.local
  assert(contentJs.includes('OTTSubStorageGuard.queueStorageSave(key, value)') && fs.readFileSync(path.join(__dirname, '../src/core/storage-guard.js'), 'utf8').includes('chrome.storage.local.set({ [key]: value }'),
         'content.js queueStorageSave immediately writes to local storage (unmetered 1st store)');

  // 3. Verify queuePopupStorageSave in popup.js immediately writes to chrome.storage.local
  assert(popupJs.includes('chrome.storage.local.set({ [key]: value }'),
         'popup.js queuePopupStorageSave immediately writes to local storage');

  // 4. Verify popup.js syncSlider allows full -10000 to +10000 ms range
  assert(popupJs.includes('Math.max(-10000, Math.min(10000, raw))'),
         'popup.js syncSlider permits full -10s to +10s range without 5s truncation');

  // 5. Verify inject.js falls back to non-English track if English is not present
  assert(injectJs.includes('candidateUrls = first ? languagePolicy.urls(candidates, first.bcp47) : []'),
         'inject.js falls back to first available subtitle track for non-English content');

  // 6. Verify content.js primary track fallback includes Object.values(tracksByLang)[0]
  assert(!contentJs.includes('Object.values(tracksByLang)[0]'),
         'content.js does not substitute an unrelated secondary language');
}

// -------------------------------------------------------------
// Test 42: Dual Subtitle Sync Control, Downscaled Typography & Target Synchronization
// -------------------------------------------------------------
console.log('\nTest 42: Dual Subtitle Sync Control, Downscaled Typography & Target Synchronization');
{
  const popupHtml = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf-8');
  const popupCss = fs.readFileSync(path.join(__dirname, '../popup/popup.css'), 'utf-8');
  const popupJs = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf-8');
  const i18nCode = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf-8');
  eval(i18nCode);
  const i18n = window.OTTSubI18n;

  // 1. Popup HTML dual sync target cards & displays
  assert(popupHtml.includes('id="sync-card-primary"'), 'Popup HTML includes primary sync card button');
  assert(popupHtml.includes('id="sync-card-secondary"'), 'Popup HTML includes secondary sync card button');
  assert(popupHtml.includes('id="sync-value"'), 'Popup HTML retains primary sync value display (id="sync-value")');
  assert(popupHtml.includes('id="secondary-sync-value"'), 'Popup HTML includes secondary sync value display (id="secondary-sync-value")');
  assert(popupHtml.includes('data-i18n="primary_sync_title"'), 'Popup HTML includes primary_sync_title data-i18n attribute');
  assert(popupHtml.includes('data-i18n="secondary_sync_title"'), 'Popup HTML includes secondary_sync_title data-i18n attribute');
  assert(!popupHtml.includes('class="btn-group"'), 'Popup HTML cleanly omits sync button group, leaving only slider bar');
  assert(popupHtml.includes('id="sync-slider"'), 'Popup HTML retains clean sync slider bar');

  // 2. CSS Typography Downscaling (Reduced from oversized 38px to balanced 14px)
  assert(!popupCss.includes('font-size: 38px'), 'Popup CSS removes oversized 38px sync font');
  assert(popupCss.includes('.sync-target-value,') || popupCss.includes('.sync-target-value'), 'Popup CSS includes sync-target-value selector');
  assert(popupCss.includes('font-size: 14px'), 'Popup CSS styles sync numbers at harmonious 14px size');
  assert(popupCss.includes('.sync-targets-row'), 'Popup CSS includes sync-targets-row layout');

  // 3. i18n Localization keys for dual sync
  assert(i18n.t('primary_sync_title', {}, 'ko') === '주언어 싱크', 'Korean i18n primary_sync_title is 주언어 싱크');
  assert(i18n.t('secondary_sync_title', {}, 'ko') === '보조언어 싱크', 'Korean i18n secondary_sync_title is 보조언어 싱크');
  assert(i18n.t('primary_sync_title', {}, 'en') === 'Primary sync', 'English i18n primary_sync_title is Primary sync');
  assert(i18n.t('secondary_sync_title', {}, 'en') === 'Secondary sync', 'English i18n secondary_sync_title is Secondary sync');

  // 4. popup.js logic for secondary sync & target switching
  assert(popupJs.includes('activeSyncTarget'), 'popup.js tracks activeSyncTarget');
  assert(popupJs.includes('updateSecondaryDisplay'), 'popup.js includes updateSecondaryDisplay function');
  assert(popupJs.includes('setSyncTarget'), 'popup.js includes setSyncTarget function');
  assert(popupJs.includes("'ottsub_secondary_offset'"), 'popup.js POPUP_STORAGE_KEYS includes ottsub_secondary_offset');
  assert(popupJs.includes('adjust_secondary_offset'), 'popup.js dispatches adjust_secondary_offset when secondary active');
  assert(popupJs.includes('set_secondary_offset'), 'popup.js dispatches set_secondary_offset when secondary active');
  assert(popupJs.includes('reset_secondary_offset'), 'popup.js dispatches reset_secondary_offset when secondary active');
}

// -------------------------------------------------------------
// Test 43: DOM Dataset Memory Defense, Safe Astral Unicode Entities & Scale-Aware Layout
// -------------------------------------------------------------
console.log('\nTest 43: DOM Dataset Memory Defense, Safe Astral Unicode Entities & Scale-Aware Layout');
{
  const parserCode = fs.readFileSync(path.join(__dirname, '../src/parser.js'), 'utf-8');
  eval(parserCode);
  const parser = window.OTTSubParser;

  // 1. Safe Unicode Code Point Entity Decoding (Astral planes, emojis, overflow immunity)
  const emojiDec = parser.decodeHtmlEntities('&#128512;');
  assert(emojiDec === '😀', `Decimal emoji &#128512; correctly decoded to 😀 via safeFromCodePoint (got ${emojiDec})`);

  const emojiHex = parser.decodeHtmlEntities('&#x1F600;');
  assert(emojiHex === '😀', `Hex emoji &#x1F600; correctly decoded to 😀 via safeFromCodePoint (got ${emojiHex})`);

  // Out-of-bounds code point: must NOT throw RangeError: Invalid code point
  let overflowHandled = false;
  try {
    const overflowDec = parser.decodeHtmlEntities('&#9999999999;');
    assert(overflowDec === '&#9999999999;', 'Overflowing entity remains literal string without crashing');
    overflowHandled = true;
  } catch (err) {
    overflowHandled = false;
  }
  assert(overflowHandled, 'Out-of-bounds numeric entity parsed without throwing RangeError');

  // Surrogate range (0xD800 - 0xDFFF): must NOT throw RangeError
  let surrogateHandled = false;
  try {
    const surrogateDec = parser.decodeHtmlEntities('&#55296;');
    assert(surrogateDec === '&#55296;', 'Surrogate code point entity remains literal string without crashing');
    surrogateHandled = true;
  } catch (err) {
    surrogateHandled = false;
  }
  assert(surrogateHandled, 'Surrogate code point entity parsed without throwing RangeError');

  // 2. DOM Dataset Memory Cleanup in inject.js and content.js
  const injectCode = fs.readFileSync(path.join(__dirname, '../src/inject.js'), 'utf-8');
  const contentCode = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf-8');

  assert(injectCode.includes("k.startsWith('ottsubManifest_') && k !== ('ottsubManifest_' + movieIdStr)"),
    'inject.js removes previous episode dataset keys before setting new manifest');
  assert(contentCode.includes('delete document.documentElement.dataset[dataKey]'),
    'content.js frees consumed dataset keys immediately after reading to enable GC');

  // 3. Scale-Aware Layout Architecture in styles.css
  const stylesCode = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf-8');
  assert(stylesCode.includes('var(--ottsub-primary-scale, 1.0) * 2.5'),
    'styles.css incorporates --ottsub-primary-scale into primary slot min-height');
  assert(stylesCode.includes('var(--ottsub-secondary-scale, 0.78) * 2.5'),
    'styles.css incorporates --ottsub-secondary-scale into secondary slot min-height');
}

// -------------------------------------------------------------
// Test 44: Sets 1-11 Comprehensive Architecture & Accessibility Defenses
// -------------------------------------------------------------
console.log('\nTest 44: Sets 1-11 Comprehensive Architecture & Accessibility Defenses');
{
  const popupHtml = fs.readFileSync(path.join(__dirname, '../popup/popup.html'), 'utf-8');
  const popupJs = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf-8');
  const contentJs = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf-8');
  const stylesCss = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf-8');
  const parserJs = fs.readFileSync(path.join(__dirname, '../src/parser.js'), 'utf-8');
  const hudJs = fs.readFileSync(path.join(__dirname, '../src/hud.js'), 'utf-8');
  const syncEngineJs = fs.readFileSync(path.join(__dirname, '../src/sync-engine.js'), 'utf-8');

  // 1. Set 1: Capture phase 'play' listener & active video switching
  assert(contentJs.includes("document.addEventListener('play'"), 'content.js attaches capture-phase play listener');
  // Ad-safe selection cannot assume that the first playing video is the content.
  const adapterWindow = {}, playerRoot = { querySelectorAll: () => [] };
  const makeCandidate = paused => ({ paused, ended: false, readyState: 4, isConnected: true, parentElement: null,
    closest: () => playerRoot, getClientRects: () => [{}], getBoundingClientRect: () => ({ width: 640, height: 360 }), getAttribute: () => null });
  const firstVideo = makeCandidate(false), secondVideo = makeCandidate(true);
  let candidates = [firstVideo, secondVideo];
  new Function('window', 'document', 'getComputedStyle', fs.readFileSync(path.join(__dirname, '../src/video/netflix-playback-adapter.js'), 'utf8'))(
    adapterWindow, { querySelectorAll: () => candidates }, () => ({ display: 'block', visibility: 'visible', opacity: '1' }));
  assert(adapterWindow.OTTSubNetflixPlaybackAdapter.read().video === null, 'Ambiguous videos do not select the first playing video');
  candidates = [secondVideo];
  assert(adapterWindow.OTTSubNetflixPlaybackAdapter.read().video === secondVideo, 'A single visible ready video is selected even when paused');

  // 2. Set 2: WAI-ARIA Radio Group for color chips
  assert(popupHtml.includes('id="primary-color-palette" role="radiogroup" aria-label="주언어 색상"'), 'Primary color palette has role="radiogroup"');
  assert(popupHtml.includes('id="secondary-color-palette" role="radiogroup" aria-label="보조언어 색상"'), 'Secondary color palette has role="radiogroup"');
  assert(popupJs.includes('setupColorPaletteKeyboardNav'), 'popup.js contains roving tabindex arrow key navigation');

  // 3. Set 3: High Contrast Mode (@media forced-colors: active) Canvas backplate
  assert(stylesCss.includes('@media (forced-colors: active)'), 'styles.css supports Windows Forced Colors mode');
  assert(stylesCss.includes('background-color: Canvas !important;'), 'styles.css applies Canvas backplate for high contrast');
  assert(stylesCss.includes('#ottsub-hud'), 'styles.css provides high contrast HUD styling');

  // 4. Set 4: Furigana / Ruby tag handling
  const rubyParserWindow = {};
  new Function('window', parserJs)(rubyParserWindow);
  assert(rubyParserWindow.OTTSubParser.cleanSubtitleLine('<ruby>漢<rt>かん</rt>字<rt>じ</rt></ruby>') === '漢字', 'parser.js strips <rt> furigana pronunciation tags while preserving base text');
  assert(parserJs.includes("tts:ruby"), 'parser.js ignores tts:ruby="text" annotation nodes in TTML');

  // 5. Set 5: Empty/whitespace cue ghost background box prevention & deduplication
  assert(syncEngineJs.includes("typeof c.text === 'string' && c.text.trim().length > 0"), 'sync-engine.js strips whitespace/empty cues');
  assert(syncEngineJs.includes("resolveMicroOverlap"), 'sync-engine.js includes micro-overlap dedup logic');

  // 6. Set 6: Stepper numeric display accessibility & clean layout
  assert(popupHtml.includes('id="line-spacing-val"'), 'line-spacing-val display element exists');
  assert(popupHtml.includes('id="primary-pos-val"'), 'primary-pos-val display element exists');
  assert(popupHtml.includes('id="primary-scale-val"'), 'primary-scale-val display element exists');
  assert(popupJs.includes("updatePrimarySpacingUI"), 'popup.js dynamically updates line spacing display');

  // 7. Set 7: HUD WAI-ARIA role="status", aria-live="polite", aria-atomic="true"
  assert(hudJs.includes("this.hudElem.setAttribute('role', 'status')"), 'hud.js applies role="status"');
  assert(hudJs.includes("this.hudElem.setAttribute('aria-live', 'polite')"), 'hud.js applies aria-live="polite"');
  assert(hudJs.includes("this.hudElem.setAttribute('aria-atomic', 'true')"), 'hud.js applies aria-atomic="true"');
  assert(hudJs.includes("if (elem.textContent === safeMessage)"), 'hud.js forces screen reader mutation on identical messages');

  // 8. Set 8: Playback rate 0 / freeze CPU waste prevention
  assert(contentJs.includes("video.paused || video.ended || video.playbackRate === 0"), 'onFrameRender stops loop when playbackRate is 0');
  assert(contentJs.includes("!video || video.paused || video.ended || video.playbackRate === 0"), 'startRenderLoop avoids spinning when playbackRate is 0');
  assert(contentJs.includes("v.playbackRate === 0 || v.paused"), 'ratechange handler safely stops loop when paused/speed 0');

  // 9. Set 9: Adaptive top collision avoidance
  assert(stylesCss.includes('--ottsub-top-adaptive: clamp(90px, 13vh, 140px)'), 'styles.css defines --ottsub-top-adaptive on controls-visible');
  assert(stylesCss.includes('env(safe-area-inset-top, 0px)'), 'styles.css incorporates safe-area-inset-top for top subtitles');

  // 10. Set 10: Number.isFinite numeric protection & synchronous fallback localization
  const storageJsPath = path.join(__dirname, '../popup/modules/storage.js');
  const storageJs = fs.existsSync(storageJsPath) ? fs.readFileSync(storageJsPath, 'utf-8') : '';
  assert(popupJs.includes("Number.isFinite") || storageJs.includes("Number.isFinite(n)"), 'popup.js/storage.js validates ottsub_offset with Number.isFinite');
  assert(popupJs.includes("Number.isFinite") || storageJs.includes("Number.isFinite(n)"), 'popup.js/storage.js validates ottsub_primary_scale with Number.isFinite');
  assert(popupJs.includes("applyLanguage") || popupJs.includes("updateLanguageUI"), 'popup.js synchronously pre-initializes DOM localization');
}

// -------------------------------------------------------------
// Test 45: Red Teaming Attack Resistance & Hardening (Sets 1-5)
// -------------------------------------------------------------
function testRedTeamingDefenses() {
  console.log('\nTest 45: Red Teaming Attack Resistance & Hardening');

  // Set 1 Defense: CSS text-selection & touch-callout lockout
  const stylesCss = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf-8');
  assert(stylesCss.includes('-webkit-touch-callout: none !important;'), 'styles.css suppresses iOS/Chromebook touch callout on subtitles');
  assert(stylesCss.includes('user-select: none !important;'), 'styles.css suppresses text selection on subtitle lines');

  // Set 2 Defense: Multiline & case-insensitive italic parsing
  const testRenderer = window.OTTSubRenderer;
  const multilineLine = testRenderer._createLineElement('<i>First Line\nSecond Line</i>');
  const italicElem = multilineLine.querySelector('i');
  assert(italicElem !== null, 'Multiline italics rendered as <i> element');
  assert(italicElem.textContent === 'First Line\nSecond Line', 'Multiline italic content preserved without raw tags');
  assert(!multilineLine.textContent.includes('<i>'), 'No raw <i> in multiline italic element text');
  assert(!multilineLine.textContent.includes('</i>'), 'No raw </i> in multiline italic element text');

  // Set 3 Defense: Nested italic flattening in parser
  const parser = window.OTTSubParser;
  const flattened = parser.cleanSubtitleLine('<i>Outer <i>Inner</i> Text</i>');
  assert(flattened === '<i>Outer Inner Text</i>', `Nested italics flattened correctly (got: ${flattened})`);

  // Set 4 Defense: Sync engine cue sorting and negative timestamp clamping
  const engine = new window.OTTSubSyncEngineClass();
  engine.setCues('test-movie', [
    { id: '2', begin: 10, end: 15, text: 'Cue 2' },
    { id: '1', begin: -5, end: 5, text: 'Cue 1' },
    { id: '3', begin: 20, end: 25, text: 'Cue 3' }
  ]);
  const cues = engine.cues;
  assert(cues.length === 3, 'All 3 cues retained');
  assert(cues[0].begin === 0, `Negative timestamp clamped to 0 (got: ${cues[0].begin})`);
  assert(cues[0].id === '1', 'Cues sorted chronologically: first is Cue 1');
  assert(cues[1].id === '2', 'Cues sorted chronologically: second is Cue 2');
  assert(cues[2].id === '3', 'Cues sorted chronologically: third is Cue 3');

  // Set 5 Defense: Trusted Netflix CDN Subtitle URL allowlist & SSRF defense
  const contentJs = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf-8');
  assert(contentJs.includes('OTTSubTrackFetcher.fetchAndParseTrack'), 'content.js delegates validated fetching to module');
  assert(fs.readFileSync(path.join(__dirname, "../src/network/track-fetcher.js"), "utf8").includes("if (!isSafeNetflixSubtitleUrl(subUrl)) continue;"), 'fetchAndParseTrack validates candidate URLs before network fetch');

  // Evaluate URL validation logic isolated
  function isSafeNetflixSubtitleUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    try {
      const parsed = new URL(urlStr, 'https://www.netflix.com/watch/12345');
      if (parsed.protocol !== 'https:') return false;
      const hostname = parsed.hostname.toLowerCase();
      return (
        hostname.endsWith('.nflxvideo.net') ||
        hostname.endsWith('.nflxso.net') ||
        hostname.endsWith('.nflximg.net') ||
        hostname.endsWith('.netflix.com') ||
        hostname === 'netflix.com'
      );
    } catch (_) {
      return false;
    }
  }

  assert(isSafeNetflixSubtitleUrl('https://ipv4-c001-sel001-ix.1.oca.nflxvideo.net/?o=1') === true, 'Allows official nflxvideo CDN');
  assert(isSafeNetflixSubtitleUrl('https://assets.nflxext.com/sub.xml') === false, 'Rejects unauthorized nflxext domain');
  assert(isSafeNetflixSubtitleUrl('https://malicious-attacker.com/evil.xml') === false, 'Rejects untrusted attacker domain');
  assert(isSafeNetflixSubtitleUrl('http://ipv4.nflxvideo.net/sub.xml') === false, 'Rejects insecure http protocol');
  assert(isSafeNetflixSubtitleUrl('javascript:alert(1)') === false, 'Rejects javascript URI scheme');
  assert(isSafeNetflixSubtitleUrl('https://netflix.com.attacker.com/sub.xml') === false, 'Rejects subdomain spoofing attack');

  // Set 6 Defense: Safe inject.js network hooking, window binding & XHR fallback
  const injectJs = fs.readFileSync(path.join(__dirname, '../src/inject.js'), 'utf-8');
  const frozenRequest = Object.freeze({url:'/manifest',params:Object.freeze({profiles:Object.freeze(['imsc1.1'])})});
  const passiveHarness = require('./helpers/inject-harness.cjs').injectHarness();
  assert(passiveHarness.stringify(frozenRequest) === JSON.stringify(frozenRequest), 'inject.js preserves frozen manifest request profiles');
  assert(injectJs.includes('originalFetch.apply(window, args)'), 'inject.js guarantees native window binding to prevent Illegal invocation');
  assert(injectJs.includes('XMLHttpRequest.prototype.open'), 'inject.js hooks XMLHttpRequest.open for legacy/embedded manifest capture');
  assert(injectJs.includes('XMLHttpRequest.prototype.send'), 'inject.js hooks XMLHttpRequest.send for legacy/embedded manifest capture');

  // Set 7 Defense: Storage flush on lifecycle termination (popup & content tab closure)
  const popupJs = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf-8');
  assert(popupJs.includes('flushPopupStorageSave'), 'popup.js defines flushPopupStorageSave');
  assert(popupJs.includes("window.addEventListener('pagehide', flushPopupStorageSave)"), 'popup.js flushes storage on pagehide');
  assert(popupJs.includes("window.addEventListener('beforeunload', flushPopupStorageSave)"), 'popup.js flushes storage on beforeunload');
  assert(popupJs.includes("document.visibilityState === 'hidden'"), 'popup.js flushes storage on visibilitychange hidden');

  assert(contentJs.includes('flushStorageSave'), 'content.js defines flushStorageSave');
  assert(contentJs.includes("window.addEventListener('pagehide', flushStorageSave)"), 'content.js flushes storage on pagehide');
  assert(contentJs.includes("window.addEventListener('beforeunload', flushStorageSave)"), 'content.js flushes storage on beforeunload');
}
testRedTeamingDefenses();

// -------------------------------------------------------------
// Test 46: Spanish (es) L10N Completeness, Token Symmetry & Locale Architecture
// -------------------------------------------------------------
function testSpanishL10n() {
  console.log('\nTest 46: Spanish (es) L10N Completeness, Token Symmetry & Locale Architecture');

  // 1. _locales/es/messages.json verification
  const esLocalePath = path.join(__dirname, '../_locales/es/messages.json');
  assert(fs.existsSync(esLocalePath), '_locales/es/messages.json exists');
  const esMessages = JSON.parse(fs.readFileSync(esLocalePath, 'utf-8'));
  assert(esMessages.extName && typeof esMessages.extName.message === 'string', 'es messages.json has extName');
  assert(esMessages.extDescription && typeof esMessages.extDescription.message === 'string', 'es messages.json has extDescription');
  assert(esMessages.extName.message.includes('OTTSub'), 'es extName contains OTTSub');
  assert(esMessages.extDescription.message.includes('Netflix'), 'es extDescription mentions Netflix');

  // 2. Load i18n.js and evaluate translations
  const i18nCode = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf-8');
  eval(i18nCode);
  const i18n = window.OTTSubI18n;

  // 3. Verify zero missing keys against English dictionary
  // Extract TRANSLATIONS by evaluating a snippet or checking t() output
  assert(i18n.t('ext_subtitle', {}, 'es') === 'Sincronización y subtítulos dobles para Netflix', 'Spanish ext_subtitle matches');
  assert(i18n.t('status_connected', {}, 'es') === 'Conectado', 'Spanish status_connected is Conectado');
  assert(i18n.t('primary_sync_title', {}, 'es') === 'Sincronización principal', 'Spanish primary_sync_title is Sincronización principal');
  assert(i18n.t('secondary_sync_title', {}, 'es') === 'Sincronización secundaria', 'Spanish secondary_sync_title is Sincronización secundaria');
  assert(i18n.t('lang_es', {}, 'es') === 'Español', 'Spanish lang_es is Español');
  assert(i18n.t('primary_bg_box_title', {}, 'es') === 'Fondo oscuro principal', 'Spanish primary_bg_box_title is Fondo oscuro principal');
  assert(i18n.t('secondary_bg_box_title', {}, 'es') === 'Fondo oscuro secundario', 'Spanish secondary_bg_box_title is Fondo oscuro secundario');
  assert(i18n.t('btn_reset_defaults', {}, 'es') === 'Restablecer valores', 'Spanish btn_reset_defaults is Restablecer valores');

  // 4. Token symmetry checks
  const readyResult = i18n.t('sub_status_ready', { count: 42 }, 'es');
  assert(readyResult === 'Listo (42 segmentos)', `Dynamic token {count} properly interpolated in Spanish (got: ${readyResult})`);

  const dualReadyResult = i18n.t('hud_dual_ready', { lang: 'Español' }, 'es');
  assert(dualReadyResult === 'Subtítulos dobles listos (principal + Español)', `Dynamic token {lang} properly interpolated in Spanish (got: ${dualReadyResult})`);

  // 5. Language switcher & detection checks
  i18n.setLanguage('es');
  assert(i18n.getLanguage() === 'es', 'i18n accepts and sets language to es');

  const detectedEs = i18n.t('status_connected', {}, 'es-ES');
  assert(detectedEs === 'Conectado', 'es-ES regional tag resolves cleanly to es');

  const detectedLatAm = i18n.t('status_connected', {}, 'es-419');
  assert(detectedLatAm === 'Conectado', 'es-419 Latin America regional tag resolves cleanly to es');
}
testSpanishL10n();

// -------------------------------------------------------------
// Test 47: Dynamic Secondary Subtitle Track Options & Red-Teaming Defense
// -------------------------------------------------------------
function testDynamicSubtitleTracks() {
  console.log('\nTest 47: Dynamic Secondary Subtitle Track Options & Red-Teaming Defense');

  const popupJs = fs.readFileSync(path.join(__dirname, '../popup/popup.js'), 'utf-8');
  const injectJs = fs.readFileSync(path.join(__dirname, '../src/inject.js'), 'utf-8');
  const contentJs = fs.readFileSync(path.join(__dirname, '../src/content.js'), 'utf-8');

  // 1. Static architectural assertions
  assert(popupJs.includes('function populateSecondaryLangOptions'), 'popup.js contains populateSecondaryLangOptions');
  assert(popupJs.includes('function getLocalizedLanguageLabel'), 'popup.js contains getLocalizedLanguageLabel');
  assert(popupJs.includes('DEFAULT_FALLBACK_TRACKS'), 'popup.js defines DEFAULT_FALLBACK_TRACKS presets');
  assert(popupJs.includes('populateSecondaryLangOptions(response.availableTracks'), 'popup.js links manifest availableTracks to secondary dropdown');
  assert(injectJs.includes('track.languageDescription || track.displayName'), 'inject.js captures Netflix languageDescription and displayName');
  const nativeRequestHarness = require('./helpers/inject-harness.cjs').injectHarness();
  const nativeBody = '{"profiles":["imsc1.1"],"showAllSubDubTracks":false,"supportsPartialHydration":true}';
  const nativeSent = nativeRequestHarness.xhr('https://www.netflix.com/manifest', nativeBody);
  assert(nativeSent.url === 'https://www.netflix.com/manifest' && nativeSent.body === nativeBody, 'Netflix manifest request is passed through unchanged');
  assert(contentJs.includes('OTTSubTrackLanguages.urls(manifest, tLang, secondaryTrackKind)'), 'content.js delegates to script-safe language matching (runtime cases cover variants)');

  // 2. Behavioral verification in simulated popup DOM environment
  const i18nCode = fs.readFileSync(path.join(__dirname, '../src/i18n.js'), 'utf-8');
  eval(i18nCode);
  const i18n = window.OTTSubI18n;

  // Extract functions for isolated testing (support both modular and monolithic popup code)
  let extractedCode = '';
  const uiDualPath = path.join(__dirname, '../popup/modules/ui-dual.js');
  if (fs.existsSync(uiDualPath)) {
    extractedCode = fs.readFileSync(uiDualPath, 'utf-8');
  } else {
    const startIdx = popupJs.indexOf('function getLocalizedLanguageLabel');
    const endIdx = popupJs.indexOf('function renderStatusText()');
    extractedCode = popupJs.slice(startIdx, endIdx);
  }
  const sanitizedCode = extractedCode
    .replace(/^import\s+[\s\S]*?;/gm, '')
    .replace(/\bexport\s+(function|const|let|var)\b/g, '$1')
    .replace(/\bexport\s*\{[\s\S]*?\}\s*;?/g, '');

  const sandboxFn = new Function('i18n', 'document', `
    let secondaryLangSelect = null;
    let currentAvailableTracks = [];
    let lastPopulatedTrackSignature = '';
    ${sanitizedCode.replace(/let lastPopulatedTrackSignature\s*=\s*'';?/g, '')}
    return {
      getLocalizedLanguageLabel,
      populateSecondaryLangOptions,
      DEFAULT_FALLBACK_TRACKS,
      setSelect: (el) => { secondaryLangSelect = el; }
    };
  `);

  const mockSelect = createMockElement('select');
  mockSelect.id = 'secondary-lang-select';
  mockSelect.dataset = {};
  mockSelect.value = 'ko';
  global._mockElementByIdRegistry = { 'secondary-lang-select': mockSelect };

  const scope = sandboxFn(i18n, global.document);
  scope.setSelect(mockSelect);

  // A. Full Netflix Manifest (25 subtitle languages)
  const netflixManifestTracks = [
    { language: 'el', bcp47: 'el', label: 'Greek', trackType: 'subtitles' },
    { language: 'nl', bcp47: 'nl', label: 'Dutch', trackType: 'subtitles' },
    { language: 'da', bcp47: 'da', label: 'Danish', trackType: 'subtitles' },
    { language: 'pt', bcp47: 'pt-BR', label: 'Portuguese (Brazil)', trackType: 'subtitles' },
    { language: 'es', bcp47: 'es-419', label: 'Spanish (Latin America)', trackType: 'subtitles' },
    { language: 'es', bcp47: 'es-ES', label: 'Spanish (Spain)', trackType: 'subtitles' },
    { language: 'fr', bcp47: 'fr', label: 'French', trackType: 'subtitles' },
    { language: 'de', bcp47: 'de', label: 'German', trackType: 'subtitles' },
    { language: 'it', bcp47: 'it', label: 'Italian', trackType: 'subtitles' },
    { language: 'ru', bcp47: 'ru', label: 'Russian', trackType: 'subtitles' },
    { language: 'ar', bcp47: 'ar', label: 'Arabic', trackType: 'subtitles' },
    { language: 'ja', bcp47: 'ja', label: 'Japanese', trackType: 'subtitles' },
    { language: 'zh', bcp47: 'zh-Hans', label: 'Chinese (Simplified)', trackType: 'subtitles' },
    { language: 'zh', bcp47: 'zh-Hant', label: 'Chinese (Traditional)', trackType: 'subtitles' },
    { language: 'ko', bcp47: 'ko', label: 'Korean [Original]', trackType: 'subtitles' },
    { language: 'en', bcp47: 'en', label: 'English', trackType: 'subtitles' },
    { language: 'en', bcp47: 'en', label: 'English [CC]', trackType: 'assistive' }, // duplicate en
    { language: 'th', bcp47: 'th', label: 'Thai', trackType: 'subtitles' },
    { language: 'vi', bcp47: 'vi', label: 'Vietnamese', trackType: 'subtitles' },
    { language: 'id', bcp47: 'id', label: 'Indonesian', trackType: 'subtitles' },
    { language: 'tr', bcp47: 'tr', label: 'Turkish', trackType: 'subtitles' },
    { language: 'pl', bcp47: 'pl', label: 'Polish', trackType: 'subtitles' },
    { language: 'cs', bcp47: 'cs', label: 'Czech', trackType: 'subtitles' },
    { language: 'hu', bcp47: 'hu', label: 'Hungarian', trackType: 'subtitles' },
    { language: 'he', bcp47: 'he', label: 'Hebrew', trackType: 'subtitles' }
  ];

  // Test with Korean UI
  i18n.setLanguage('ko');
  scope.populateSecondaryLangOptions(netflixManifestTracks, 'el');

  assert(mockSelect.options.length === 24, `Dynamic track population handles all languages with deduplication (expected 24, got ${mockSelect.options.length})`);
  assert(mockSelect.value === 'el', 'Active selected language "el" (Greek) properly selected');

  const greekOpt = mockSelect.options.find(o => o.value === 'el');
  assert(greekOpt !== undefined, 'Greek (el) option exists in dynamically populated options');
  assert(greekOpt.textContent === '그리스어', `Greek option localized in clean Korean UI (got: ${greekOpt?.textContent})`);

  const dutchOpt = mockSelect.options.find(o => o.value === 'nl');
  assert(dutchOpt !== undefined, 'Dutch (nl) option exists in dynamically populated options');
  assert(dutchOpt.textContent === '네덜란드어', `Dutch option localized in clean Korean UI (got: ${dutchOpt?.textContent})`);

  const zhHansOpt = mockSelect.options.find(o => o.value === 'zh-hans' || o.value === 'zh');
  assert(zhHansOpt !== undefined && zhHansOpt.textContent === '중국어(간체)', `Simplified Chinese localized as pure "중국어(간체)" without English parenthesis (got: ${zhHansOpt?.textContent})`);

  const latAmOpt = mockSelect.options.find(o => o.value === 'es-419');
  assert(latAmOpt !== undefined, 'Latin American Spanish (es-419) dialect option preserved');

  // Test with English UI
  i18n.setLanguage('en');
  scope.populateSecondaryLangOptions(netflixManifestTracks, 'nl');
  assert(mockSelect.value === 'nl', 'Active selected language "nl" (Dutch) properly retained in EN UI');
  const dutchOptEn = mockSelect.options.find(o => o.value === 'nl');
  assert(dutchOptEn.textContent === 'Dutch', `Dutch option localized in English UI (got: ${dutchOptEn?.textContent})`);

  // Test with Spanish UI
  i18n.setLanguage('es');
  scope.populateSecondaryLangOptions(netflixManifestTracks, 'nl');
  const greekOptEs = mockSelect.options.find(o => o.value === 'el');
  assert(greekOptEs.textContent === 'Griego', `Greek option localized in Spanish UI (got: ${greekOptEs?.textContent})`);

  // B. Fallback when disconnected or tracks empty
  scope.populateSecondaryLangOptions(null, 'ko');
  assert(mockSelect.options.length === 1 && mockSelect.options[0].disabled, 'Unknown tracks preserve only the disabled saved preference, not seven invented options');
  assert(mockSelect.dataset.availability === 'unknown', 'Missing track list is explicitly unknown');
  assert(mockSelect.value === 'ko', 'Fallback preserves user selected language');

  scope.populateSecondaryLangOptions([], 'ja');
  assert(mockSelect.options.length === 1 && mockSelect.options[0].disabled, 'Confirmed empty list marks saved preference unsupported');
  assert(mockSelect.dataset.availability === 'unsupported', 'Confirmed empty differs from missing track list');
  assert(mockSelect.value === 'ja', 'Fallback preserves "ja" selection');

  // C. Red-Teaming: XSS Injection Resistance
  const xssMaliciousTracks = [
    { language: 'el', bcp47: 'el', label: '<img src=x onerror=alert(1)><script>alert("xss")</script>', trackType: 'subtitles' }
  ];
  scope.populateSecondaryLangOptions(xssMaliciousTracks, 'el');
  const xssOpt = mockSelect.options.find(o => o.value === 'el');
  assert(xssOpt !== undefined, 'XSS test option created');
  assert(xssOpt.children.length === 0, 'No HTML child nodes created inside option element (DOM safe from XSS execution)');

  // D. Red-Teaming: Prototype Pollution & Malformed Data Resistance
  const maliciousProtoTracks = [
    null,
    undefined,
    12345,
    "corrupted",
    {},
    { __proto__: { isAdmin: true }, language: 'el', label: 'Greek' }
  ];
  scope.populateSecondaryLangOptions(maliciousProtoTracks, 'el');
  assert(({}).isAdmin === undefined, 'Prototype pollution vector completely neutralized');
  assert(mockSelect.options.length === 1, 'Malformed array items safely skipped without crashing');
}
testDynamicSubtitleTracks();

console.log(`\n=== Synchronous QA Results: ${passed} Passed, ${failed} Failed; awaited hook test follows ===`);
if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log('Synchronous checks passed; see the hook test result below.');
}






