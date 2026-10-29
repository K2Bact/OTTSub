/**
 * OTTSub - parser.js
 * Robust subtitle parser supporting Netflix TTML (DFXP/XML) and WebVTT formats.
 * Handles tickRate (10,000,000 ticks/sec), timecodes, italics, line breaks, and region positioning.
 */
(() => {
  'use strict';

  // Preserve directional marks/isolates and join controls used by real text.
  // Remove explicit embeddings/overrides, BOM and non-printable ASCII controls.
  const UNICODE_CONTROL_REGEX = /[\u202A-\u202E\uFEFF\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

  /**
   * Safe code point converter: verifies boundaries (0 to 0x10FFFF) and non-surrogate status
   * to prevent RangeError: Invalid code point from String.fromCodePoint and preserve emojis/astral characters.
   */
  function safeFromCodePoint(codePoint, raw) {
    if (
      typeof codePoint === 'number' &&
      !isNaN(codePoint) &&
      codePoint >= 0 &&
      codePoint <= 0x10FFFF &&
      !(codePoint >= 0xD800 && codePoint <= 0xDFFF)
    ) {
      try {
        return String.fromCodePoint(codePoint);
      } catch (_) {
        return raw;
      }
    }
    return raw;
  }

  /**
   * Safely decode HTML entities commonly found in WebVTT subtitles
   * Loops up to 3 passes to unwrap double/triple escaped entities (e.g. &amp;#39; -> &#39; -> ')
   */
  function decodeHtmlEntities(str) {
    if (!str || !str.includes('&')) return str;
    let decoded = str;
    let passes = 0;
    while (decoded.includes('&') && passes < 3) {
      const prev = decoded;
      decoded = decoded
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (raw, dec) => safeFromCodePoint(parseInt(dec, 10), raw))
        .replace(/&#x([0-9a-fA-F]+);/g, (raw, hex) => safeFromCodePoint(parseInt(hex, 16), raw));
      if (decoded === prev) break;
      passes++;
    }
    return decoded;
  }

  /**
   * Normalize safe emphasis, preserve text direction, and remove active markup.
   */
  function escapeText(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function normalizeEmphasis(text) {
    const counts = { i: 0, b: 0, u: 0 }, output = [];
    let open = [];
    const transition = desired => {
      let shared = 0;
      while (shared < open.length && shared < desired.length && open[shared] === desired[shared]) shared++;
      for (let i = open.length - 1; i >= shared; i--) output.push(`</${open[i]}>`);
      for (let i = shared; i < desired.length; i++) output.push(`<${desired[i]}>`);
      open = desired;
    };
    for (const token of text.split(/(<\/?(?:i|b|u)>)/g)) {
      const tag = token.match(/^<(\/?)(i|b|u)>$/);
      if (tag) counts[tag[2]] = Math.max(0, counts[tag[2]] + (tag[1] ? -1 : 1));
      else if (token) {
        transition(/\S/.test(token) ? ['i','b','u'].filter(name => counts[name] > 0) : []);
        output.push(token);
      }
    }
    transition([]);
    return output.join('');
  }
  function cleanSubtitleLine(line) {
    if (!line) return '';
    const text = line.replace(UNICODE_CONTROL_REGEX, ''), output = [], suppressed = [];
    // Each scan stops at either angle bracket: unclosed/nested '<' input stays linear.
    // Keep only attribute-free emphasis. Suppress script/style/ruby annotation bodies.
    const tags = /<([^<>]*)>/g;
    let cursor = 0, match;
    while ((match = tags.exec(text))) {
      if (!suppressed.length) output.push(text.slice(cursor, match.index));
      const tag = match[1].match(/^\s*(\/?)\s*([a-z][\w:-]*)\b/i);
      if (tag) {
        const close = !!tag[1], name = tag[2].toLowerCase();
        if (['script', 'style', 'rt'].includes(name)) {
          if (close && suppressed.at(-1) === name) suppressed.pop();
          else if (!close && !/\/\s*$/.test(match[1])) suppressed.push(name);
        } else if (!suppressed.length && ['i', 'em', 'b', 'strong', 'u'].includes(name)) {
          output.push(`<${close ? '/' : ''}${({em:'i',strong:'b'})[name] || name}>`);
        }
      }
      cursor = tags.lastIndex;
    }
    if (!suppressed.length) output.push(text.slice(cursor));
    let cleaned = output.join('');
    // Decode only text tokens, then escape them again. Encoded angle brackets
    // describe literal cue text; they must never become formatting or active DOM.
    cleaned = cleaned.split(/(<\/?(?:i|b|u)>)/g).map(token =>
      /^<\/?(?:i|b|u)>$/.test(token) ? token : escapeText(decodeHtmlEntities(token).replace(UNICODE_CONTROL_REGEX, ''))).join('');
    return normalizeEmphasis(cleaned);
  }

  /**
   * Parse timestamp string to seconds (float)
   * Supports: "12345678t", "12.345s", "01:23:45.678", "00:00:12:34"
   * Clamps negative or NaN inputs to 0.0s to prevent timeline corruption.
   */
  function parseTimestamp(timeStr, tickRate = 10000000, frameRate = 24) {
    if (typeof timeStr !== 'string' || !timeStr) return 0;
    const str = timeStr.trim().replace(',', '.');
    if (str.startsWith('-')) return 0;
    let res = 0;

    // 1. Tick format: "12345678t" or raw integer
    if (str.endsWith('t')) {
      res = parseInt(str.slice(0, -1), 10) / tickRate;
    } else if (/^\d+$/.test(str)) {
      res = parseInt(str, 10) / tickRate;
    } else if (str.endsWith('s')) {
      // 2. Seconds format: "12.345s"
      res = parseFloat(str.slice(0, -1)) || 0;
    } else {
      // 3. Timecode format: "HH:MM:SS.mmm", "HH:MM:SS:FF" (frames), or "MM:SS.mmm"
      const parts = str.split(':');
      if (parts.length === 4) {
        const hours = parseFloat(parts[0]) || 0;
        const minutes = parseFloat(parts[1]) || 0;
        const seconds = parseFloat(parts[2]) || 0;
        const frames = parseFloat(parts[3]) || 0;
        res = hours * 3600 + minutes * 60 + seconds + (frames / (frameRate || 24));
      } else if (parts.length === 3) {
        const hours = parseFloat(parts[0]) || 0;
        const minutes = parseFloat(parts[1]) || 0;
        const seconds = parseFloat(parts[2]) || 0;
        res = hours * 3600 + minutes * 60 + seconds;
      } else if (parts.length === 2) {
        const minutes = parseFloat(parts[0]) || 0;
        const seconds = parseFloat(parts[1]) || 0;
        res = minutes * 60 + seconds;
      } else {
        res = parseFloat(str) || 0;
      }
    }

    if (!Number.isFinite(res) || res < 0) return 0;
    const rounded = Math.round(res * 1000) / 1000;
    return Number.isFinite(rounded) ? rounded : 0;
  }

  /**
   * Recursively extract text and basic safe styling from TTML XML nodes
   */
  function extractNodeContent(node, inherited = false, readStyle = el => {
    const style = {};
    for (const key of ['fontStyle', 'fontWeight', 'textDecoration']) {
      const value = el.getAttribute?.('tts:' + key) || el.getAttribute?.(key);
      if (value) style[key] = value;
    }
    return style;
  }) {
    const style = { ...(typeof inherited === 'boolean' ? (inherited ? {fontStyle: 'italic'} : {}) : inherited), ...readStyle(node) };
    let result = '';

    for (const child of node.childNodes) {
      if (child.nodeType === 8 || (typeof Node !== 'undefined' && child.nodeType === Node.COMMENT_NODE)) {
        continue;
      }
      // Handle both TEXT_NODE (3) and CDATA_SECTION_NODE (4)
      if (child.nodeType === 3 || child.nodeType === 4 ||
          (typeof Node !== 'undefined' && (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE))) {
        let text = escapeText(child.nodeValue);
        if (style.textDecoration?.split(/\s+/).includes('underline')) text = `<u>${text}</u>`;
        if (style.fontWeight === 'bold') text = `<b>${text}</b>`;
        if (style.fontStyle === 'italic') text = `<i>${text}</i>`;
        result += text;
      } else if (child.nodeType === 1 || (typeof Node !== 'undefined' && child.nodeType === Node.ELEMENT_NODE)) {
        const tagName = child.nodeName.toLowerCase();
        // Skip TTML / HTML ruby annotation text nodes
        if (tagName === 'rt' || child.getAttribute('tts:ruby') === 'text' || child.getAttribute('ruby') === 'text') {
          continue;
        }
        if (tagName === 'br') {
          result += '\n';
        } else {
          result += extractNodeContent(child, style, readStyle);
        }
      }
    }

    return result;
  }

  /**
   * Parse TTML / DFXP XML subtitle text
   */
  function parseTTML(xmlText) {
    if (!xmlText || typeof xmlText !== 'string') return [];
    // Red Teaming Set 1 Defense: Reject oversized XML bombs (>5MB) to prevent tab freezing
    if (xmlText.length > 5 * 1024 * 1024) return [];

    try {
      // Red Teaming Set 1 Defense: Strip DOCTYPE and ENTITY declarations to eliminate XXE & Billion Laughs bombs
      const sanitizedXml = xmlText
        .replace(/<!DOCTYPE\s+[^>]*(\[[^\]]*\])?\s*>/gi, '')
        .replace(/<!ENTITY\s+[^>]*>/gi, '');

      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitizedXml, 'text/xml');
      if (doc.querySelector('parsererror')) {
        return [];
      }

      // Extract document-level tickRate (default: 10,000,000)
      let tickRate = 10000000;
      const ttElem = doc.querySelector('tt');
      if (ttElem) {
        const rawRate = ttElem.getAttribute('ttp:tickRate') ||
                        ttElem.getAttribute('tickRate') ||
                        ttElem.getAttributeNS('http://www.w3.org/ns/ttml#parameter', 'tickRate');
        if (rawRate) {
          const parsedRate = parseInt(rawRate, 10);
          if (!isNaN(parsedRate) && parsedRate > 0) {
            tickRate = parsedRate;
          }
        }
      }

      // Extract document-level frameRate (default: 24)
      let frameRate = 24;
      if (ttElem) {
        const rawFps = ttElem.getAttribute('ttp:frameRate') ||
                       ttElem.getAttribute('frameRate') ||
                       ttElem.getAttributeNS('http://www.w3.org/ns/ttml#parameter', 'frameRate');
        if (rawFps) {
          const parsedFps = parseFloat(rawFps);
          if (!isNaN(parsedFps) && parsedFps > 0) {
            frameRate = parsedFps;
          }
        }
      }

      // Resolve the geometry used by horizontal subtitle regions. displayAlign is
      // relative to a region, so "before" in a bottom region is still bottom.
      const stylingNS = 'http://www.w3.org/ns/ttml#styling';
      const styleElements = new Map();
      doc.querySelectorAll('style').forEach(el => {
        const id = el.getAttribute('xml:id') || el.getAttribute('id');
        if (id) styleElements.set(id, el);
      });
      const readStyle = (el, seen = new Set()) => {
        if (!el || seen.has(el) || seen.size > 16) return {};
        const nextSeen = new Set(seen); nextSeen.add(el);
        const result = {};
        for (const ref of (el.getAttribute('style') || '').trim().split(/\s+/)) {
          Object.assign(result, readStyle(styleElements.get(ref), nextSeen));
        }
        for (const child of Array.from(el.children || [])) {
          if (child.localName === 'style') Object.assign(result, readStyle(child, nextSeen));
        }
        for (const key of ['origin', 'extent', 'displayAlign', 'fontStyle', 'fontWeight', 'textDecoration']) {
          const value = el.getAttributeNS?.(stylingNS, key) || el.getAttribute('tts:' + key) || el.getAttribute(key);
          if (value) result[key] = value;
        }
        return result;
      };
      const inheritedStyle = node => {
        const ancestors = [];
        for (let current = node.parentElement; current; current = current.parentElement) ancestors.unshift(current);
        let region = '';
        for (let current = node; current && !region; current = current.parentElement) region = current.getAttribute('region') || '';
        const regionElement = Array.from(doc.querySelectorAll('region')).find(el => (el.getAttribute('xml:id') || el.getAttribute('id')) === region);
        return Object.assign({}, readStyle(regionElement), ...ancestors.map(el => readStyle(el)));
      };
      const rootExtent = readStyle(ttElem).extent?.trim().split(/\s+/)[1];
      const rootHeight = rootExtent?.endsWith('px') ? parseFloat(rootExtent) : null;
      const toPercentY = value => {
        if (!value) return null;
        if (/^-?\d+(?:\.\d+)?%$/.test(value)) return parseFloat(value);
        if (/^-?\d+(?:\.\d+)?px$/.test(value) && rootHeight > 0) return parseFloat(value) * 100 / rootHeight;
        return null; // Unknown units must not be mistaken for percentages.
      };
      const isTopRegion = (style, id = '') => {
        const y = style.origin ? toPercentY(style.origin.trim().split(/\s+/)[1])
          : (style.extent || style.displayAlign ? 0 : null);
        if (y !== null) {
          const height = toPercentY(style.extent?.trim().split(/\s+/)[1]);
          const align = (style.displayAlign || 'before').toLowerCase();
          const availableHeight = height ?? Math.max(0, 100 - y);
          const anchor = y + (align === 'after' ? availableHeight : align === 'center' ? availableHeight / 2 : 0);
          return anchor < 50;
        }
        // Compatibility for legacy named regions lacking usable geometry.
        return id.toLowerCase().includes('top');
      };

      const regionMap = Object.create(null);
      const regionElements = doc.querySelectorAll('tt head layout region, layout region, region');
      regionElements.forEach(reg => {
        const id = reg.getAttribute('xml:id') || reg.getAttribute('id') || '';
        if (!id) return;

        regionMap[id] = readStyle(reg);
      });

      const cues = [];
      const pElements = doc.querySelectorAll('tt > body > div > p, tt body div p, p');

      pElements.forEach(p => {
        const beginAttr = p.getAttribute('begin');
        const endAttr = p.getAttribute('end');
        const durAttr = p.getAttribute('dur');

        let regionId = '';
        for (let node = p; node && !regionId; node = node.parentElement) regionId = node.getAttribute('region') || '';
        const isTop = isTopRegion({ ...(regionMap[regionId] || {}), ...readStyle(p) }, regionId);

        // Case 1: Paragraph has explicit timing
        if (beginAttr && (endAttr || durAttr)) {
          const begin = parseTimestamp(beginAttr, tickRate, frameRate);
          const end = endAttr
            ? parseTimestamp(endAttr, tickRate, frameRate)
            : (begin + parseTimestamp(durAttr, tickRate, frameRate));

          let text = cleanSubtitleLine(extractNodeContent(p, inheritedStyle(p), readStyle))
            .replace(UNICODE_CONTROL_REGEX, '')
            .replace(/\u00A0/g, ' ')
            .trim();

          const plainText = text.replace(/<[^>]+>/g, '').trim();
          if (plainText.length > 0 && end > begin) {
            cues.push({
              id: cues.length,
              begin: begin,
              end: end,
              text: text,
              isTop: isTop
            });
          }
          return;
        }

        // Case 2: Paragraph lacks timestamps, check nested timed <span> elements
        const timedSpans = p.querySelectorAll('span[begin]');
        if (timedSpans && timedSpans.length > 0) {
          timedSpans.forEach(span => {
            const sBeginAttr = span.getAttribute('begin');
            const sEndAttr = span.getAttribute('end');
            const sDurAttr = span.getAttribute('dur');
            if (!sBeginAttr || (!sEndAttr && !sDurAttr)) return;

            const begin = parseTimestamp(sBeginAttr, tickRate, frameRate);
            const end = sEndAttr
              ? parseTimestamp(sEndAttr, tickRate, frameRate)
              : (begin + parseTimestamp(sDurAttr, tickRate, frameRate));

            let text = cleanSubtitleLine(extractNodeContent(span, inheritedStyle(span), readStyle))
              .replace(UNICODE_CONTROL_REGEX, '')
              .replace(/\u00A0/g, ' ')
              .trim();

            const plainText = text.replace(/<[^>]+>/g, '').trim();
            if (plainText.length > 0 && end > begin) {
              cues.push({
                id: cues.length,
                begin: begin,
                end: end,
                text: text,
                isTop: isTop
              });
            }
          });
        }
      });

      return cues.sort((a, b) => a.begin - b.begin);
    } catch (_) {
      return [];
    }
  }

  /**
   * Parse WebVTT subtitle text
   */
  function parseWebVTT(vttText) {
    const lines = vttText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const cues = [];
    let currentCue = null;
    let cueId = 0;
    let inNoteBlock = false;

    // Support both dot and comma millisecond separators: 00:01:23.456 or 00:01:23,456
    const timeRegex = /^((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})(?=\s|$)/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        inNoteBlock = false;
        if (currentCue && currentCue.text.length > 0 && currentCue.end > currentCue.begin) {
          cues.push(currentCue);
        }
        currentCue = null;
        continue;
      }

      // Skip NOTE, STYLE, and REGION blocks until the next empty line
      if (!currentCue && /^(?:NOTE|STYLE|REGION)(?:\s|$)/.test(line)) {
        inNoteBlock = true;
        continue;
      }
      if (inNoteBlock) continue;

      const match = line.match(timeRegex);
      if (match) {
        if (currentCue && currentCue.text.length > 0 && currentCue.end > currentCue.begin) {
          cues.push(currentCue);
        }

        // WebVTT line cue setting determines vertical placement:
        // line: <= 35% or line: 0..4 indicates top region
        let isTop = false;
        const lineSetting = line.match(/\bline:(-?\d+(?:\.\d+)?%?)/i);
        if (lineSetting) {
          const valStr = lineSetting[1];
          if (valStr.endsWith('%')) {
            const pct = parseFloat(valStr);
            if (!isNaN(pct) && pct <= 35) isTop = true;
          } else {
            const lineNum = parseFloat(valStr);
            if (!isNaN(lineNum) && lineNum >= 0 && lineNum <= 4) isTop = true;
          }
        } else if (/\btop\b/i.test(line)) {
          isTop = true;
        }

        currentCue = {
          id: cueId++,
          begin: parseTimestamp(match[1]),
          end: parseTimestamp(match[2]),
          text: '',
          isTop: isTop
        };
      } else {
        // If the next line is a timestamp line, this current line is an optional cue identifier
        const nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
        if (timeRegex.test(nextLine)) {
          // Finalize any previous cue before the new cue ID
          if (currentCue && currentCue.text.length > 0 && currentCue.end > currentCue.begin) {
            cues.push(currentCue);
            currentCue = null;
          }
          continue;
        }

        if (currentCue) {
          // Sanitize line: strip control characters, decode entities, keep safe emphasis tags
          const cleanedLine = cleanSubtitleLine(line);
          currentCue.text = currentCue.text ? `${currentCue.text}\n${cleanedLine}` : cleanedLine;
        }
      }
    }

    if (currentCue && currentCue.text.length > 0 && currentCue.end > currentCue.begin) {
      cues.push(currentCue);
    }

    return cues.sort((a, b) => a.begin - b.begin);
  }

  /**
   * Existing product policy: hand off to a later group when overlap is <=200ms.
   * Co-starting rows, different vertical regions, and longer overlaps survive.
   * Short intentional overlaps cannot be distinguished without source metadata;
   * this heuristic must be checked against real subtitle fixtures.
   */
  function deOverlapCues(cues, maxGlitchOverlapSec = 0.2) {
    if (!Array.isArray(cues) || cues.length <= 1) return cues;

    // Ensure sorted strictly by begin time, then end time
    cues.sort((a, b) => a.begin - b.begin || a.end - b.end);

    const starts = { top: [], bottom: [] };
    for (const cue of cues) {
      const list = starts[cue.isTop ? 'top' : 'bottom'];
      if (list[list.length - 1] !== cue.begin) list.push(cue.begin);
    }
    for (const current of cues) {
      const list = starts[current.isTop ? 'top' : 'bottom'];
      let low = 0, high = list.length;
      // Find the first later group starting within the existing 200ms hand-off
      // window. All rows of the old group are trimmed; co-starting rows survive.
      const threshold = current.end - maxGlitchOverlapSec - 1e-9;
      while (low < high) {
        const mid = (low + high) >> 1;
        if (list[mid] <= current.begin || list[mid] < threshold) low = mid + 1;
        else high = mid;
      }
      if (low < list.length && list[low] < current.end) current.end = list[low];
    }

    return cues.filter(c => c.end > c.begin);
  }

  // Universal parse function (Stability Set 6: Zero-Crash Parser Execution Guard)
  window.OTTSubParser = {
    parse(content) {
      if (typeof content !== 'string' || content.length > 5 * 1024 * 1024 || content.trim().length === 0) {
        return [];
      }
      try {
        const rawCues = content.trim().startsWith('WEBVTT')
          ? parseWebVTT(content)
          : parseTTML(content);
        return deOverlapCues(rawCues);
      } catch (parseErr) {
        console.warn('[OTTSub Parser] Malformed subtitle input prevented crash:', parseErr);
        return [];
      }
    },
    deOverlapCues,
    normalizeEmphasis,
    cleanSubtitleLine,
    extractNodeContent,
    decodeHtmlEntities,
    parseTimestamp
  };
})();
