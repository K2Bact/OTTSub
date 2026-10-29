// Adopted OTTSub copy rules, not universal grammar or another platform's policy.
export function auditOttsubProfile(dictionaries, {metadata = {}, requiredLocales = []} = {}) {
  const violations = [];
  const report = (locale, key, message) => violations.push({locale, key, message});
  if (!dictionaries.en?.ext_subtitle || !dictionaries.ko?.primary_lang_label) {
    report('SYSTEM', 'input', 'Actual OTTSub interface dictionaries are required; Chrome metadata alone is not a full UI audit');
  }
  for (const locale of requiredLocales) {
    if (!dictionaries[locale] || !Object.keys(dictionaries[locale]).length) report(locale, 'SYSTEM', 'Declared interface locale is missing or empty');
    if (!metadata[locale]) report(locale, 'metadata', 'Declared interface locale has no extension metadata');
  }
  for (const [locale, dict] of Object.entries(dictionaries)) {
    for (const [key, value] of Object.entries(dict)) {
      if (typeof value !== 'string' || !value.trim()) report(locale, key, 'Interface copy must be a nonempty string');
    }
  }
  const en = dictionaries.en || {};
  if (/\bWaiting Video\b/.test(en.status_waiting_video || '')) report('en', 'status_waiting_video', 'Use the preposition for when waiting for a video');
  if (/^0\.0s Reset$/.test(en.btn_reset || '')) report('en', 'btn_reset', 'Use an action-first reset label');
  const sentenceKeys = ['ext_subtitle', 'sub_settings_title', 'primary_status_label', 'primary_lang_label', 'secondary_status_label', 'secondary_lang_label', 'shortcuts_title', 'learning_card_title', 'btn_reset_defaults', 'support_btn'];
  for (const key of sentenceKeys) {
    const words = String(en[key] || '').match(/[A-Za-z]+/g) || [];
    if (words.slice(1).some(word => /^[A-Z][a-z]+$/.test(word) && !['Netflix', 'Chrome', 'OTTSub'].includes(word))) report('en', key, 'OTTSub adopts sentence case for this interface label');
  }
  const ko = dictionaries.ko || {};
  for (const key of ['btn_reset', 'shortcut_reset', 'shortcut_alt_reset', 'hud_sync_reset']) {
    if (/리셋/.test(ko[key] || '')) report('ko', key, 'Use the adopted 초기화 term for this reset action');
  }
  for (const key of ['sub_status_ready_desc', 'secondary_status_ready_desc']) {
    if (/완벽/.test(ko[key] || '')) report('ko', key, 'Loaded cues do not prove complete or perfect subtitles');
  }
  for (const locale of ['es', 'de']) for (const key of ['sync_slider_help', 'btn_reset', 'shortcut_reset', 'shortcut_alt_reset', 'hud_sync_reset']) {
    if (/\d,\d/.test(dictionaries[locale]?.[key] || '')) report(locale, key, 'OTTSub uses an ASCII decimal point in its shared technical sync token');
  }
  for (const [locale, messages] of Object.entries(metadata)) {
    for (const [key, limit] of [['extName', 75], ['extDescription', 132]]) {
      const text = messages[key]?.message;
      if (typeof text !== 'string' || !text.trim() || text.length > limit) report(locale, `metadata.${key}`, `Extension text must be nonempty and at most ${limit} UTF-16 code units; inspect non-BMP characters separately`);
    }
  }
  return violations;
}
export default auditOttsubProfile;
