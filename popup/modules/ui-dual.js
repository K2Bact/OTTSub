/**
 * OTTSub - popup/modules/ui-dual.js
 * Dual subtitles toggling, dynamic track list population, and localized language labels.
 */

import { queuePopupStorageSave } from './storage.js';


export const DEFAULT_FALLBACK_TRACKS = [
  { language: 'ko', bcp47: 'ko', label: '한국어', i18nKey: 'lang_ko' },
  { language: 'en', bcp47: 'en', label: '영어', i18nKey: 'lang_en' },
  { language: 'ja', bcp47: 'ja', label: '일본어', i18nKey: 'lang_ja' },
  { language: 'es', bcp47: 'es', label: '스페인어', i18nKey: 'lang_es' },
  { language: 'zh-Hans', bcp47: 'zh-Hans', label: '중국어(간체)', i18nKey: 'lang_zh' },
  { language: 'fr', bcp47: 'fr', label: '프랑스어', i18nKey: 'lang_fr' },
  { language: 'de', bcp47: 'de', label: '독일어', i18nKey: 'lang_de' },
  { language: 'hi', bcp47: 'hi', label: '힌디어', i18nKey: 'lang_hi' }
];

let lastPopulatedTrackSignature = '';
let preferredLanguage = null, userChangedLanguage = false, lastTracks = null;

// Reuse the formatter, not its output: provider labels and track markers stay fresh.
const displayNamesCache = new Map();
function languageDisplayNames(locale) {
  if (displayNamesCache.has(locale)) return displayNamesCache.get(locale);
  const formatter = new Intl.DisplayNames([locale], { type: 'language' });
  if (displayNamesCache.size >= 16) displayNamesCache.delete(displayNamesCache.keys().next().value);
  displayNamesCache.set(locale, formatter);
  return formatter;
}

export function restoreSecondaryLanguage(lang, initial = false) {
  if (initial && userChangedLanguage) return;
  if (typeof lang !== 'string' || !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(lang)) return;
  preferredLanguage = lang.toLowerCase();
  populateSecondaryLangOptions(lastTracks);
}

export function getLocalizedLanguageLabel(track, uiLang) {
  if (!track || typeof track !== 'object') return '';
  const rawLang = String(track.bcp47 || track.language || '').trim();
  // Netflix names the Spain track "Spanish". Intl adds "European" for es-ES;
  // simplify only its display name, preserving the exact track selection code.
  const displayLang = rawLang.toLowerCase() === 'es-es' ? 'es' : rawLang;
  const baseCode = String(track.language || rawLang.split('-')[0] || '').trim().toLowerCase();
  const rawLabel = String(track.label || track.description || track.languageDescription || track.displayName || '').trim();

  // Latin scripts cannot distinguish English/German/Spanish by a regex.
  // Prefer explicit Netflix page locale; unique scripts also support legacy data.
  const rawSourceLocale = String(track.labelLocale || '').replaceAll('_', '-').toLowerCase();
  const sourceLocale = rawSourceLocale.split('-')[0];
  const scripts = {ko:/[\uac00-\ud7a3]/,ja:/[\u3040-\u30ff]/,ar:/[\u0600-\u06ff]/,hi:/[\u0900-\u097f]/,he:/[\u0590-\u05ff]/,bn:/[\u0980-\u09ff]/};
  const sourceScripts = { ...scripts, ja:/[\u3040-\u30ff\u3400-\u9fff]/ };
  const otherScript = /[\uac00-\ud7a3\u3040-\u30ff\u3400-\u9fff\u0600-\u06ff\u0900-\u097f\u0590-\u05ff\u0980-\u09ff]/.test(rawLabel);
  const cyrillicScript = /\p{Script=Cyrillic}/u.test(rawLabel);
  const thaiScript = /\p{Script=Thai}/u.test(rawLabel);
  const foreignScript = otherScript || cyrillicScript || thaiScript;
  // Han characters alone cannot distinguish Traditional from Simplified Chinese.
  const traditionalProvider = uiLang === 'zh-TW' && /^zh-(?:tw|hant)(?:-|$)/.test(rawSourceLocale) && /[\u3400-\u9fff]/.test(rawLabel);
  // Keep Portugal and Brazil page locales distinct even though both use Latin.
  const portugueseProvider = uiLang === 'pt-PT' && rawSourceLocale === 'pt-pt' && !foreignScript;
  // Cyrillic is shared with other languages; require an explicit Russian page locale.
  const russianProvider = uiLang === 'ru' && sourceLocale === 'ru' && cyrillicScript && !otherScript && !thaiScript;
  // Adopt Thai provider text only with an explicit Thai page locale and matching script.
  const thaiProvider = uiLang === 'th' && sourceLocale === 'th' && thaiScript && !otherScript && !cyrillicScript;
  const localizedProvider = !!rawLabel && rawLabel.toLowerCase() !== rawLang.toLowerCase()
    && (traditionalProvider || portugueseProvider || russianProvider || thaiProvider || !['zh-TW', 'ru', 'th'].includes(uiLang) && (scripts[uiLang]?.test(rawLabel)
      || sourceLocale === uiLang && (sourceScripts[uiLang] ? sourceScripts[uiLang].test(rawLabel) : !foreignScript)));

  const i18n = window.OTTSubI18n;
  // 2. Check if track matches a built-in translation key
  if (track.i18nKey && typeof i18n?.t === 'function') {
    const translated = i18n.t(track.i18nKey);
    if (translated && translated !== track.i18nKey) {
      return translated;
    }
  }

  let localizedName = '';
  let englishName = '';

  if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
    try {
      const dnUi = languageDisplayNames(uiLang);
      localizedName = dnUi.of(displayLang) || dnUi.of(baseCode) || '';
    } catch (_) {}

    try {
      const dnEn = languageDisplayNames('en');
      englishName = dnEn.of(displayLang) || dnEn.of(baseCode) || '';
    } catch (_) {}
  }

  let displayText = '';
  if (localizedProvider) {
    displayText = rawLabel;
  } else if (uiLang === 'ko') {
    displayText = localizedName || rawLabel || englishName || rawLang || baseCode;
  } else if (uiLang === 'es') {
    const capitalized = localizedName ? localizedName.charAt(0).toUpperCase() + localizedName.slice(1) : '';
    displayText = capitalized || rawLabel || englishName || rawLang || baseCode;
  } else {
    displayText = localizedName || englishName || rawLabel || rawLang || baseCode;
  }

  // Preserve CC / SDH marker if present and not already part of label
  const isCC = track.isCC || (rawLabel && (/\[cc\]|\(cc\)|\[sdh\]|\(sdh\)/i.test(rawLabel))) || track.trackType === 'closedcaptions' || track.trackType === 'assistive' || String(track.trackType).toLowerCase() === 'sdh';
  if (isCC && !/[\[(]\s*(?:cc|sdh)\s*[\])]/i.test(displayText)) {
    displayText += ' [CC]';
  }

  // Preserve Forced Narrative marker if present
  const isForced = track.isForcedNarrative || String(track.trackType).toLowerCase() === 'forced_narrative' || (rawLabel && /\[forced\]|\(forced\)|강제/i.test(rawLabel));
  if (isForced && !displayText.includes('[강제]') && !displayText.includes('[Forced]')) {
    displayText += (uiLang === 'ko' ? ' [강제]' : ' [Forced]');
  }

  return displayText;
}

export function populateSecondaryLangOptions(tracks, activeLang) {
  lastTracks = tracks;
  const secondaryLangSelect = document.getElementById('secondary-lang-select');
  if (!secondaryLangSelect) return;

  const i18n = window.OTTSubI18n;
  const uiLang = (typeof i18n?.getLanguage === 'function') ? i18n.getLanguage() : 'en';
  const hasValidTracks = Array.isArray(tracks) && tracks.length > 0;
  const rawTrackList = Array.isArray(tracks) ? tracks : [];

  const uniqueTracks = [];
  const seenValues = new Set();

  for (const t of rawTrackList) {
    if (!t || typeof t !== 'object') continue;
    const rawLang = String(t.bcp47 || t.language || '').trim().toLowerCase();
    const baseCode = String(t.language || rawLang.split('-')[0] || '').trim().toLowerCase();
    if (!baseCode && !rawLang) continue;

    const optValue = (rawLang && rawLang !== baseCode) ? rawLang : baseCode;
    if (seenValues.has(optValue)) continue;
    seenValues.add(optValue);

    uniqueTracks.push({
      track: t,
      value: optValue,
      label: getLocalizedLanguageLabel(t, uiLang).replace(/\s*[\[(]\s*(?:cc|sdh)\s*[\])]/ig, ''),
      i18nKey: t.i18nKey
    });
  }

  const targetLang = (preferredLanguage || activeLang || secondaryLangSelect.value || 'ko').trim().toLowerCase();
  let selectedValue = targetLang;

  const exactMatch = uniqueTracks.find(item => item.value.toLowerCase() === targetLang || (item.track?.id && String(item.track.id) === targetLang));
  if (exactMatch) {
    selectedValue = exactMatch.value;
  } else {
    // Keep the requested regional language while tracks are loading or unavailable.
    // Rendering a list must never silently replace the saved preference with Korean.
    const track = { language: targetLang.split('-')[0], bcp47: targetLang };
    uniqueTracks.push({ track, value: targetLang, label: languageAvailabilityLabel(targetLang, tracks, uiLang), disabled: true });
    selectedValue = targetLang;
  }

  secondaryLangSelect.dataset.availability = !Array.isArray(tracks) ? 'unknown' : !exactMatch ? 'unsupported' : 'available';
  const signature = JSON.stringify([uniqueTracks.map(u => [u.value, u.label, !!u.disabled]), uiLang, selectedValue]);
  if (signature === lastPopulatedTrackSignature && secondaryLangSelect.value === selectedValue) {
    return;
  }

  const hadFocus = (typeof document !== 'undefined' && document.activeElement === secondaryLangSelect);
  if (hadFocus && signature === lastPopulatedTrackSignature) {
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of uniqueTracks) {
    const opt = document.createElement('option');
    opt.value = item.value;
    opt.disabled = !!item.disabled;
    opt.textContent = item.label;
    if (item.i18nKey) {
      opt.setAttribute('data-i18n-option', item.i18nKey);
    }
    if (item.value === selectedValue) {
      opt.selected = true;
    }
    fragment.appendChild(opt);
  }

  secondaryLangSelect.textContent = '';
  secondaryLangSelect.appendChild(fragment);
  secondaryLangSelect.value = selectedValue;
  lastPopulatedTrackSignature = signature;
  if (hadFocus && typeof secondaryLangSelect.focus === 'function') {
    try { secondaryLangSelect.focus(); } catch (_) {}
  }
}

export function updateDualModeUI(isEnabled) {
  const dualToggle = document.getElementById('dual-toggle');
  const dualSubOptions = document.getElementById('dual-sub-options');
  const syncCardSecondary = document.getElementById('sync-card-secondary');

  if (dualToggle) {
    dualToggle.checked = !!isEnabled;
  }
  if (dualSubOptions) {
    dualSubOptions.style.opacity = isEnabled ? '1' : '0.45';
    dualSubOptions.style.pointerEvents = isEnabled ? 'auto' : 'none';
  }
  if (syncCardSecondary) {
    syncCardSecondary.style.opacity = isEnabled ? '1' : '0.6';
  }
}

export function setupDualControls(sendCommandFn = null) {
  const dualToggle = document.getElementById('dual-toggle');
  const secondaryLangSelect = document.getElementById('secondary-lang-select');

  if (dualToggle) {
    dualToggle.addEventListener('change', () => {
      const isEnabled = dualToggle.checked;
      updateDualModeUI(isEnabled);
      queuePopupStorageSave('ottsub_dual_mode', isEnabled);
      if (typeof sendCommandFn === 'function') {
        sendCommandFn('set_dual_mode', { enabled: isEnabled });
      }
    });
  }

  if (secondaryLangSelect) {
    secondaryLangSelect.addEventListener('change', () => {
      const chosenLang = secondaryLangSelect.value;
      userChangedLanguage = true;
      preferredLanguage = chosenLang;
      queuePopupStorageSave('ottsub_secondary_lang', chosenLang);
      if (typeof sendCommandFn === 'function') {
        sendCommandFn('set_secondary_lang', { lang: chosenLang });
      }
    });
  }
}

export function languageAvailabilityLabel(code, tracks, uiLang) {
  const key = Array.isArray(tracks) ? 'language_unsupported' : 'language_checking';
  const label = getLocalizedLanguageLabel({ bcp47: code }, uiLang);
  return `${label} — ${window.OTTSubI18n?.t(key) || key}`;
}
