// Per-key logical revisions. Wall-clock differences between computers are irrelevant.
// Values remain in the original local keys for existing readers; sync envelopes
// pair each value with its revision so delayed echoes cannot roll back an edit.
(() => {
  'use strict';
  const prefix = 'ottsub_revision_';
  window.OTTSubSettingsRevisions = function create(validate) {
    const known = new Map(), pending = new Map();
    const origin = globalThis.crypto?.randomUUID?.() || `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    let timer = null, initialized = false;
    const compare = (a, b) => !b ? 1 : a.n - b.n || a.origin.localeCompare(b.origin);
    const read = area => new Promise(resolve => {
      try { chrome.storage[area].get(null, data => resolve(chrome.runtime.lastError ? {} : data || {})); }
      catch (_) { resolve({}); }
    });
    const write = (area, values) => {
      try {
        const p = chrome.storage[area]?.set(values, () => { void chrome.runtime.lastError; });
        p?.catch?.(() => {});
      } catch (_) { /* A failed sync never overwrites the newer local value. */ }
    };
    const valid = (key, record) => record && Number.isSafeInteger(record.n) && record.n > 0
      && typeof record.origin === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(record.origin)
      && Object.hasOwn(validate({ [key]: record.value }), key)
      && validate({ [key]: record.value })[key] === record.value;
    const flush = () => {
      clearTimeout(timer); timer = null;
      if (!initialized || !pending.size) return;
      const payload = {};
      for (const [key, record] of pending) {
        payload[key] = record.value; payload[prefix + key] = record;
      }
      pending.clear(); write('sync', payload);
    };
    const schedule = (key, record) => {
      pending.set(key, record); clearTimeout(timer); timer = setTimeout(flush, 350);
    };
    const accept = (key, record, area) => {
      if (!valid(key, record)) return;
      const prior = known.get(key), order = compare(record, prior);
      if (order < 0) {
        if (area === 'local') write('local', { [key]: prior.value, [prefix + key]: prior });
        schedule(key, prior); return;
      }
      if (order === 0) return;
      known.set(key, record);
      // Cancel a queued earlier edit before an accepted remote value can be echoed.
      pending.delete(key);
      if (area !== 'local') write('local', { [key]: record.value, [prefix + key]: record });
      if (area !== 'sync') schedule(key, record);
    };
    const buffered = [];
    const changed = (changes, area) => {
      if (area !== 'local' && area !== 'sync') return;
      if (!initialized) { buffered.push([changes, area]); return; }
      for (const [name, change] of Object.entries(changes)) {
        if (name.startsWith(prefix)) accept(name.slice(prefix.length), change.newValue, area);
      }
    };
    chrome.storage.onChanged.addListener(changed);
    const ready = Promise.all([read('local'), read('sync')]).then(([local, sync]) => {
      // Seed both snapshots first, then materialize their maximum revision.
      for (const values of [local, sync]) for (const [name, record] of Object.entries(values)) {
        if (!name.startsWith(prefix)) continue;
        const key = name.slice(prefix.length);
        if (valid(key, record) && compare(record, known.get(key)) > 0) known.set(key, record);
      }
      initialized = true;
      for (const [changes, area] of buffered) changed(changes, area);
      buffered.length = 0;
      for (const [key, record] of known) {
        if (!valid(key, local[prefix + key]) || compare(record, local[prefix + key]) !== 0 || local[key] !== record.value)
          write('local', { [key]: record.value, [prefix + key]: record });
        if (!valid(key, sync[prefix + key]) || compare(record, sync[prefix + key]) !== 0 || sync[key] !== record.value)
          schedule(key, record);
      }
    });
    const save = (key, value) => {
      if (!initialized) { ready.then(() => save(key, value)); return; }
      const clean = validate({ [key]: value });
      if (!Object.hasOwn(clean, key)) return;
      const previous = known.get(key);
      if (previous?.value === clean[key]) return;
      const n = (previous?.n || 0) + 1;
      if (!Number.isSafeInteger(n)) return;
      const record = { n, origin, value: clean[key] };
      known.set(key, record);
      write('local', { [key]: record.value, [prefix + key]: record });
      schedule(key, record);
    };
    return { save, flush, ready, current: key => known.get(key) };
  };
})();
