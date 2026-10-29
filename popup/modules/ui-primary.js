import { queuePopupStorageSave } from './storage.js';
import { languageAvailabilityLabel, getLocalizedLanguageLabel } from './ui-dual.js';

let selected = 'auto', edited = false, tracks = null, resolved = null;
const valid = value => value === 'auto' || (typeof value === 'string' && /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(value));

export function restorePrimaryLanguage(value, initial = false) {
  if (!valid(value) || (initial && edited)) return;
  if (selected !== value.toLowerCase()) resolved = null;
  selected = value.toLowerCase();
  populatePrimaryLangOptions(tracks);
}

export function populatePrimaryLangOptions(availableTracks, resolvedLanguage = undefined) {
  tracks = availableTracks;
  if (resolvedLanguage !== undefined) resolved = valid(resolvedLanguage) && resolvedLanguage !== 'auto' ? resolvedLanguage : null;
  const select = document.getElementById('primary-lang-select');
  if (!select) return;
  const i18n = window.OTTSubI18n, lang = i18n?.getLanguage() || 'en';
  const autoLabel = !Array.isArray(tracks)
    ? `${i18n?.t('primary_lang_auto') || 'Automatic'} — ${i18n?.t('language_checking') || 'Checking languages'}`
    : selected === 'auto' && resolved
    ? i18n?.t('primary_lang_auto_resolved', { language: getLocalizedLanguageLabel({ bcp47: resolved }, lang) }) || `Automatic (${resolved})`
    : i18n?.t('primary_lang_auto') || 'Automatic';
  const choices = new Map([['auto', autoLabel]]);
  for (const track of Array.isArray(tracks) ? tracks : []) {
    const code = String(track?.bcp47 || track?.language || '').toLowerCase();
    if (valid(code) && !choices.has(code)) choices.set(code, getLocalizedLanguageLabel(track, lang).replace(/\s*[\[(]\s*(?:cc|sdh)\s*[\])]/ig, ''));
  }
  const unavailable = selected !== 'auto' && !choices.has(selected);
  if (unavailable) choices.set(selected, languageAvailabilityLabel(selected, tracks, lang));
  select.dataset.availability = !Array.isArray(tracks) ? 'unknown' : unavailable ? 'unsupported' : 'available';
  const signature = JSON.stringify([...choices]);
  if (select.dataset.options !== signature) {
    select.replaceChildren(...[...choices].map(([value, label]) => Object.assign(new Option(label, value), { disabled: value === selected && unavailable })));
    select.dataset.options = signature;
  }
  select.value = selected;
}

export function setupPrimaryControls(sendCommand) {
  const select = document.getElementById('primary-lang-select');
  if (!select) return;
  populatePrimaryLangOptions(null);
  select.addEventListener('change', () => {
    if (!valid(select.value)) return;
    selected = select.value.toLowerCase(); edited = true;
    resolved = null;
    queuePopupStorageSave('ottsub_primary_lang', selected);
    sendCommand('set_primary_lang', { lang: selected });
  });
}
