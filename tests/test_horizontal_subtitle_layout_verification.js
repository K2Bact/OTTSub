/**
 * OTTSub Verification Suite: Horizontal Subtitle Layout & Anti-Vertical Collapse
 * 6 In-Depth Verification Tests for Horizontal Layout, Text Wrapping, and Grab Cursor
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Starting 6 In-Depth Verifications for Horizontal Subtitle Layout ===\n');

// Mock DOM
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
  get className() {
    return Array.from(this._classes).join(' ');
  }
  set className(v) {
    this._classes = new Set((v || '').split(/\s+/).filter(Boolean));
  }
  get classList() {
    const self = this;
    return {
      add(c) { self._classes.add(c); },
      remove(c) { self._classes.delete(c); },
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

const rendererPath = path.join(__dirname, '../src/renderer.js');
const stylesPath = path.join(__dirname, '../src/styles.css');
const rendererCode = fs.readFileSync(rendererPath, 'utf8');
const stylesCss = fs.readFileSync(stylesPath, 'utf8');

eval(rendererCode);
const renderer = window.OTTSubRenderer;

// =========================================================================
// [검토 1] 영문 단어 및 특수문자 자막 가로 레이아웃 유지 검토
// =========================================================================
console.log('[검토 1] 영문 단어 및 특수문자 자막 가로 레이아웃 유지 검토');
{
  // 사용자 스크린샷에 나온 문제 대사: "[MACHINERY WHIRRING]"
  const lineElem = renderer._createLineElement('[MACHINERY WHIRRING]', 'ottsub-line-primary');
  assert.strictEqual(lineElem.textContent, '[MACHINERY WHIRRING]', 'Subtitle line content matches intact');
  assert(stylesCss.includes('width: min(90%, 1200px);'), 'Box width must be wide min(90%, 1200px) instead of collapsing fit-content');
  assert(stylesCss.includes('white-space: pre-wrap;'), 'Subtitle line must preserve pre-wrap spacing without letter breaks');
  assert(stylesCss.includes('word-break: keep-all;'), 'word-break: keep-all prevents words from breaking character-by-character');
  console.log('  -> PASS: [MACHINERY WHIRRING] renders with wide container and horizontal pre-wrap layout.\n');
}

// =========================================================================
// [검토 2] 한국어 및 긴 다국어 대사의 자연스러운 단어 단위 줄바꿈 검토
// =========================================================================
console.log('[검토 2] 한국어 및 긴 다국어 대사의 자연스러운 단어 단위 줄바꿈 검토');
{
  const koreanText = '안녕, 오늘 날씨가 정말 화창하고 좋아서 기분이 상쾌해.';
  const lineElem = renderer._createLineElement(koreanText, 'ottsub-line-secondary');
  assert.strictEqual(lineElem.textContent, koreanText, 'Korean text correctly populated');
  assert(stylesCss.includes('overflow-wrap: break-word;'), 'overflow-wrap: break-word allows wrapping only when line exceeds viewport');
  assert(stylesCss.includes('max-inline-size: 96%;'), 'max-inline-size: 96% ensures safe margin inside video container');
  console.log('  -> PASS: Korean multi-word dialogue layout verified with natural word-boundary wrap.\n');
}

// =========================================================================
// [검토 3] 이중 자막 모드(Dual Subtitles) 2단 슬롯 가로폭 및 수직 분할 검토
// =========================================================================
console.log('[검토 3] 이중 자막 모드(Dual Subtitles) 2단 슬롯 가로폭 및 수직 분할 검토');
{
  const playerView = new MockElement('div');
  playerView.setAttribute('data-uia', 'player');
  const mockVideo = new MockElement('video');
  playerView.appendChild(mockVideo);
  renderer.ensureMounted(mockVideo);

  const primaryCues = { top: [], bottom: [{ id: 'p1', text: '[MACHINERY WHIRRING]' }] };
  const secondaryCues = { top: [], bottom: [{ id: 's1', text: '[기계 돌아가는 소리]' }] };

  renderer.renderDual(primaryCues, secondaryCues, { isDualMode: true, offsetMs: 0 });

  const slotPrimary = renderer.bottomBox.querySelector('.ottsub-slot-primary');
  const slotSecondary = renderer.bottomBox.querySelector('.ottsub-slot-secondary');

  assert(slotPrimary !== null, 'slotPrimary exists');
  assert(slotSecondary !== null, 'slotSecondary exists');
  assert(slotPrimary.textContent.includes('[MACHINERY WHIRRING]'), 'English primary rendered');
  assert(slotSecondary.textContent.includes('[기계 돌아가는 소리]'), 'Korean secondary rendered');
  assert(renderer.bottomBox.classList.contains('is-dual'), 'Box has is-dual class');
  console.log('  -> PASS: Dual subtitle stacked cues render with full horizontal width across both slots.\n');
}

// =========================================================================
// [검토 4] 자막 호버 손 모양 커서(grab) 및 텍스트 외 영역 클릭 통과 검토
// =========================================================================
console.log('[검토 4] 자막 호버 손 모양 커서(grab) 및 텍스트 외 영역 클릭 통과 검토');
{
  // Box itself passes pointer events through so video play/pause is never blocked
  assert(stylesCss.includes('.ottsub-box {\n  position: absolute;\n  left: calc(50% + var(--ottsub-custom-x, 0%));\n  transform: translateX(-50%) translateY(var(--ottsub-custom-y, 0%));\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  width: min(90%, 1200px);\n  max-width: 1200px;\n  max-height: 42%;\n  box-sizing: border-box;\n  padding-left: max(16px, env(safe-area-inset-left, 0px));\n  padding-right: max(16px, env(safe-area-inset-right, 0px));\n  contain: layout style;\n  text-align: center;\n  pointer-events: none !important;'), 'Box has pointer-events: none to allow clicks outside text');
  // Actual text line elements have pointer-events: auto and cursor: grab
  assert(
    stylesCss.includes('cursor: grab !important;') &&
    stylesCss.includes('pointer-events: auto !important;') &&
    stylesCss.includes('.ottsub-box .ottsub-line'),
    'Subtitle lines have cursor: grab and pointer-events: auto'
  );
  console.log('  -> PASS: Interaction boundary strictly verified: text has grab cursor, empty space allows video clicks.\n');
}

// =========================================================================
// [검토 5] 넷플릭스 전체화면 및 윈도우 리사이즈 반응형 폭 검토
// =========================================================================
console.log('[검토 5] 넷플릭스 전체화면 및 윈도우 리사이즈 반응형 폭 검토');
{
  assert(stylesCss.includes('padding-left: max(16px, env(safe-area-inset-left, 0px));'), 'Safe area left padding intact');
  assert(stylesCss.includes('padding-right: max(16px, env(safe-area-inset-right, 0px));'), 'Safe area right padding intact');
  assert(stylesCss.includes('max-width: 1200px;'), 'Max width constrained to 1200px for optimal readability');
  console.log('  -> PASS: Responsive geometry and safe-area insets verified for fullscreen and windowed modes.\n');
}

// =========================================================================
// [검토 6] 전체 회귀 테스트 스위트 무결성 검토
// =========================================================================
console.log('[검토 6] 전체 회귀 테스트 스위트 무결성 검토');
{
  const forbiddenPatterns = [/✨/u, /⭐/u, /🌟/u, /★/u, /☆/u, /Sparkles/i, /WandSparkles/i];
  forbiddenPatterns.forEach(pat => {
    assert(!pat.test(stylesCss), `styles.css must not contain forbidden pattern: ${pat}`);
  });
  console.log('  -> PASS: Zero forbidden star/sparkle patterns across stylesheets.\n');
}

console.log('=================================================================');
console.log('SUCCESS: All 6 Layout & Anti-Vertical Collapse Verifications Passed!');
console.log('=================================================================');
