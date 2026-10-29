export function auditGate2Tokens(dictionaries, baseLocale = 'ko') {
  const violations = [];
  const baseDict = dictionaries[baseLocale];
  if (!baseDict) return violations;

  const extractTokens = (str) => {
    if (typeof str !== 'string') return [];
    const matches = str.match(/\{[a-zA-Z0-9_]+\}/g) || [];
    return matches.sort();
  };

  for (const [key, baseVal] of Object.entries(baseDict)) {
    const baseTokens = extractTokens(baseVal);
    // No early exit when the base has no tokens. That skip made the check one-way: a
    // translation that grew a {ghost} its source never had passed as symmetric
    // (external audit V08, 2026-09-12; fixed 2026-09-30). Extra tokens are a mismatch too.

    for (const [locale, dict] of Object.entries(dictionaries)) {
      if (locale === baseLocale) continue;
      const targetVal = dict[key];
      if (typeof targetVal !== 'string') continue;

      const targetTokens = extractTokens(targetVal);
      if (JSON.stringify(baseTokens) !== JSON.stringify(targetTokens)) {
        violations.push({
          locale,
          key,
          message: `Token mismatch: expected [${baseTokens.join(', ')}], got [${targetTokens.join(', ')}]`
        });
      }
    }
  }

  return violations;
}
