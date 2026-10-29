export function auditGate1Completeness(dictionaries, baseLocale = 'ko') {
  const violations = [];
  const baseDict = dictionaries[baseLocale];
  if (!baseDict) {
    violations.push({ locale: baseLocale, key: 'SYSTEM', message: `Base locale [${baseLocale}] not found.` });
    return violations;
  }

  const baseKeys = Object.keys(baseDict);

  for (const [locale, dict] of Object.entries(dictionaries)) {
    if (locale === baseLocale) continue;
    for (const key of baseKeys) {
      if (dict[key] === undefined || dict[key] === null || dict[key] === '') {
        violations.push({ locale, key, message: `Missing key in [${locale}]` });
      }
    }
  }

  return violations;
}
