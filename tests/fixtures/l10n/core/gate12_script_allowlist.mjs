/**
 * 게이트 12 — 문자 체계 허용 목록. 로케일마다 그 언어가 쓰는 문자와 라틴 문자만.
 *
 * 2026-10-15 제미나이의 이탈리아어 검수가 Suidoku 아카데미 이탈리아어 문장 한가운데서
 * 힌디어 낱말을 찾았다 — 「Elimina tutti gli अन्य candidati」(Hidden Triple 설명).
 * 그때까지 어느 게이트도 보지 못했다. 게이트 4 는 **금지 목록**이다: 한글은 ko 밖에서,
 * 번체는 zh-CN 에서, 간체는 zh-TW 에서. 데바나가리가 이탈리아어에 들어가는 경우는
 * 목록에 없었다. 2026-09-28 힌디어 안의 한글 한 글자도 같은 종류였다(게이트 4 주석).
 *
 * 금지 목록은 다음 조합을 또 놓친다 — 13개 언어면 문자 체계 짝이 백 개가 넘는다.
 * 그래서 방향을 뒤집는다. 로케일마다 **쓰는 문자**를 적고, 그 밖의 글자(\p{L})는
 * 전부 막는다. 라틴은 어디서나 허용한다(X-Wing·Logic Score·Play 같은 이름).
 * 문자 판정은 Script_Extensions(scx) — 일본어 장음 「ー」 와 아랍어 「ـ」(타트윌)는
 * Script 로는 Common 이라 Script 로 재면 오탐이 287건 난다(2026-10-16 실측).
 *
 * 처음 돌렸을 때(2026-10-16, Suidoku 13개 언어 · 화면 + 아카데미 전부) 걸린 것은
 * 그 힌디어 낱말 하나뿐이었다.
 *
 * 숫자·기호·이모지·문장부호는 글자(\p{L})가 아니라 보지 않는다. 언어 선택 목록
 * (`screens.settings.languages.*`)은 각 언어 이름을 그 언어 글자로 적으므로 뺀다.
 * 목록에 없는 로케일은 통과시키지 않고 위반으로 알린다 — 조용히 건너뛰면 그 언어는
 * 검사가 없는데 초록으로 보인다.
 */

const LATIN_ONLY = [
  'af', 'az', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'en', 'es', 'et', 'eu', 'fi', 'fil', 'fr', 'ga', 'gl',
  'hr', 'hu', 'id', 'is', 'it', 'lt', 'lv', 'ms', 'mt', 'nb', 'nl', 'nn', 'no', 'pl', 'pt', 'ro', 'sk',
  'sl', 'sq', 'sv', 'sw', 'tl', 'tr', 'uz', 'vi',
];
const OWN_SCRIPTS = {
  ar: ['Arabic'], fa: ['Arabic'], ur: ['Arabic'],
  he: ['Hebrew'],
  hi: ['Devanagari'], mr: ['Devanagari'], ne: ['Devanagari'],
  bn: ['Bengali'], ta: ['Tamil'], te: ['Telugu'], th: ['Thai'],
  ru: ['Cyrillic'], uk: ['Cyrillic'], bg: ['Cyrillic'], sr: ['Cyrillic'], kk: ['Cyrillic'],
  el: ['Greek'], ka: ['Georgian'], hy: ['Armenian'],
  ko: ['Hangul'],
  ja: ['Hiragana', 'Katakana', 'Han'],
  zh: ['Han'],
};
for (const l of LATIN_ONLY) OWN_SCRIPTS[l] = [];

/** The scripts a locale may write in besides Latin, or null when this gate has no list for it. */
export function scriptsFor(locale) {
  const base = String(locale).split(/[-_]/)[0].toLowerCase();
  return Object.prototype.hasOwnProperty.call(OWN_SCRIPTS, base) ? OWN_SCRIPTS[base] : null;
}

function foreignLetterRegex(scripts) {
  const allowed = ['Latin', ...scripts].map((s) => String.raw`\p{scx=${s}}`).join('');
  return new RegExp(String.raw`(?![${allowed}])\p{L}`, 'u');
}

export function auditGate12ScriptAllowlist(dictionaries) {
  const violations = [];
  for (const [locale, dict] of Object.entries(dictionaries)) {
    if (!dict) continue;
    const scripts = scriptsFor(locale);
    if (!scripts) {
      violations.push({ locale, key: 'SYSTEM', message: `No script list for locale "${locale}" — add it to OWN_SCRIPTS in gate12_script_allowlist.mjs` });
      continue;
    }
    const re = foreignLetterRegex(scripts);
    for (const [key, val] of Object.entries(dict)) {
      if (typeof val !== 'string' || key.startsWith('screens.settings.languages.')) continue;
      const m = val.match(re);
      if (m) {
        const cp = m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
        violations.push({ locale, key, message: `Letter "${m[0]}" (U+${cp}) is not ${['Latin', ...scripts].join('/')}: "${val}"` });
      }
    }
  }
  return violations;
}
