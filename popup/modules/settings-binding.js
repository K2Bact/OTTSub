// Own one popup's storage subscription and its asynchronous initial snapshot.
// Values, revisions and UI state remain with the injected guard and UI modules.
export function bindPopupSettings({ storage, keys = null, validate = values => values,
  selectChanges, apply, hasReadError = () => false } = {}) {
  let closed = false, reading = true, subscribed = false;
  const changedDuringRead = new Set();
  const requestedKeys = Array.isArray(keys) ? new Set(keys) : null;
  const remember = key => {
    if (!requestedKeys || requestedKeys.has(key)) changedDuringRead.add(key);
  };

  const changed = (changes, area) => {
    // Revision reconciliation mirrors accepted sync values into local.
    if (closed || area !== 'local') return;
    const values = selectChanges(changes, area);
    if (reading) {
      for (const key of Object.keys(values)) remember(key);
      for (const [key, change] of Object.entries(changes)) {
        if (change.newValue === undefined) remember(key);
      }
    }
    if (Object.keys(values).length) apply(values, { initial: false });
  };

  const finishRead = (snapshot, failed = false) => {
    if (closed || !reading) return;
    reading = false;
    const values = failed ? {} : validate(snapshot || {});
    for (const key of changedDuringRead) delete values[key];
    changedDuringRead.clear();
    if (Object.keys(values).length) apply(values, { initial: true });
  };

  const destroy = () => {
    if (closed) return;
    closed = true;
    changedDuringRead.clear();
    if (subscribed) storage.onChanged.removeListener(changed);
  };

  if (typeof storage?.local?.get !== 'function' || typeof storage?.onChanged?.addListener !== 'function'
    || typeof storage?.onChanged?.removeListener !== 'function') return { destroy };
  storage.onChanged.addListener(changed);
  subscribed = true;
  try {
    const pending = storage.local.get(keys, snapshot => finishRead(snapshot, hasReadError()));
    pending?.catch?.(() => finishRead(null, true));
  } catch (_) {
    // A failed initial read does not disable subsequent accepted local changes.
    finishRead(null, true);
  }
  return { destroy };
}
