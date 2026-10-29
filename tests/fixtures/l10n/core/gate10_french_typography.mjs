/**
 * 게이트 10 — 프랑스어 조판.
 *
 * 프랑스어는 두 부분으로 된 구두점(: ; ! ?)과 « » 안쪽에 공백을 둔다. 그 공백이
 * 보통 공백(U+0020)이면 좁은 버튼·알림에서 줄이 그 자리에서 끊겨 「?」 「:」 만 다음
 * 줄 첫머리로 떨어진다. 그래서 공백은 있어야 하고, 줄바꿈 없는 공백이어야 한다.
 *
 *   검사                     틀린 예                      맞는 예
 *   ① 구두점 앞 보통 공백     "Rang : {rank}"              "Rang : {rank}"
 *   ② 구두점 앞 공백 없음     "Exemple pratique 1: …"      "Exemple pratique 1 : …"
 *   ③ « » 안쪽 보통 공백      "« Supprimer les pubs »"     "« Supprimer les pubs »"
 *   ④ 곧은 아포스트로피       "l'application"              "l’application"
 *   ⑤ 곧은 큰따옴표           "\"nageoires\""              "« nageoires »"
 *   ⑥ 점 세 개                "Recherche..."               "Recherche…" (U+2026)
 *
 * 공백은 U+00A0 하나로 통일한다. 국립인쇄원 규범은 ; ! ? 앞에 더 좁은 공백(U+202F)을
 * 권하지만, 앱이 싣는 글꼴에 그 글자가 없으면 대체 글꼴로 그려진다 — U+00A0 은 어느
 * 글꼴에나 있다. 검사는 둘 다 맞는 것으로 본다.
 *
 * ② 의 콜론은 뒤에 공백이 올 때만 본다 — "12:30", "https://" 는 콜론이 아니다.
 *
 * 2026-10-13 Suidoku 프랑스어 검수(제미나이 FR-07·14·26)에서 생겼다. 당시 화면 문구
 * 95곳 · 아카데미 103곳이 ① 이었고, 제미나이가 보지 못한 아카데미 연습 제목 84곳이 ②
 * 였다("Exemple pratique 1: …"). 기준은 `rules/fr/README.md`.
 *
 * `fixFrenchTypography` 는 같은 규칙으로 고친다. 문서·생성기가 프랑스어를 새로 쓸 때
 * 같은 함수를 지나가게 하면 규칙이 두 벌이 되지 않는다.
 */

const NB = '[\\u00A0\\u202F]';
const RULES = [
  { re: / [:;!?]/, why: 'plain space before : ; ! ? — use a no-break space (U+00A0)' },
  { re: /[^\s  ([{]([;!?])/, why: 'no space before ; ! ? — French puts a no-break space there' },
  { re: /[^\s  ]:(?=\s)/, why: 'no space before : — French puts a no-break space there' },
  { re: new RegExp(`«(?!${NB})|(?<!${NB})»`), why: 'guillemets need a no-break space inside: « … »' },
  { re: /'/, why: 'straight apostrophe — use ’ (U+2019)' },
  { re: /"/, why: 'straight double quote — use « … »' },
  // ⑥ added 2026-10-14 from Gemini FR-29: four loading texts used "..." while three others already used "…".
  { re: /\.\.\./, why: 'three dots — use the ellipsis … (U+2026)' },
];

export function isFrench(locale) {
  return locale === 'fr' || locale.startsWith('fr-');
}

export function frenchTypographyProblems(text) {
  if (typeof text !== 'string') return [];
  return RULES.filter((r) => r.re.test(text)).map((r) => r.why);
}

export function fixFrenchTypography(text) {
  let open = true;
  return text
    .replace(/'/g, '’')
    .replace(/\.\.\./g, '…')
    .replace(/"/g, () => { const q = open ? '« ' : ' »'; open = !open; return q; })
    .replace(/« +/g, '« ')
    .replace(/ +»/g, ' »')
    .replace(/ ([:;!?])/g, ' $1')
    .replace(/([^\s  ([{])([;!?])/g, '$1 $2')
    .replace(/([^\s  ]):(?=\s)/g, '$1 :');
}

export function auditGate10FrenchTypography(dictionaries) {
  const violations = [];
  for (const [locale, dict] of Object.entries(dictionaries)) {
    if (!isFrench(locale) || !dict) continue;
    for (const [key, val] of Object.entries(dict)) {
      for (const why of frenchTypographyProblems(val)) {
        violations.push({ locale, key, message: `French typography: ${why}: ${JSON.stringify(val).slice(0, 120)}` });
      }
    }
  }
  return violations;
}
