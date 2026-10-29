const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function modules() {
  const window = {};
  for (const file of ['src/parser.js', 'src/sync-engine.js', 'src/layout/dual-placement.js']) {
    const saved = process.env.OTTSub_TEST_SOURCE && path.join(process.env.OTTSub_TEST_SOURCE, file);
    vm.runInNewContext(fs.readFileSync(saved && fs.existsSync(saved) ? saved : path.join(root, file), 'utf8'), { window, console });
  }
  return window;
}
const cue = (id, begin, end, text = id, isTop = false) => ({ id, begin, end, text, isTop });
const texts = result => Array.from(result.bottom, c => c.text);

test('two old rows hand off without displaying the next two-line cue early', () => {
  const { OTTSubSyncEngine: e } = modules();
  e.setCues('1', [cue('A', 1, 10), cue('B', 1, 10), cue('C', 10, 15, 'C\nD')]);
  for (const t of [9.98, 9.99, 9.995, 9.999]) assert.deepEqual(texts(e.getActiveCues(t)), ['A', 'B'], `t=${t}`);
  for (const t of [10, 10.001, 10.01]) assert.deepEqual(texts(e.getActiveCues(t)), ['C\nD'], `t=${t}`);
});
test('expired non-pointer cue never remains visible while a long cue pins the pointer', () => {
  const { OTTSubSyncEngine: e } = modules();
  e.setCues('1', [cue('long', 0, 20), cue('short', 1, 10), cue('next', 12, 15)]);
  assert.deepEqual(texts(e.getActiveCues(10.001)), ['long']);
});
test('start-inclusive and end-exclusive intervals hold for direct and sequential lookup', () => {
  const { OTTSubSyncEngine: e } = modules(); e.setCues('1', [cue('A', 1, 2)]);
  for (const [t, expected] of [[0.999, []], [1, ['A']], [1.999, ['A']], [2, []]]) {
    assert.deepEqual(texts(e.getActiveCues(t)), expected);
    assert.deepEqual(Array.from(e.findCuesAtTime(t), c => c.text), expected);
  }
});
test('one-millisecond rewind restores cues after their end', () => {
  const { OTTSubSyncEngine: e } = modules(); e.setCues('1', [cue('A', 0, 1), cue('B', 2, 3)]);
  e.getActiveCues(1); assert.deepEqual(texts(e.getActiveCues(0.999)), ['A']);
});
test('seek back includes long cues over 600 seconds', () => {
  const { OTTSubSyncEngine: e } = modules();
  e.setCues('1', [cue('LONG', 0, 900), ...Array.from({ length: 200 }, (_, i) => cue(`short${i}`, i * 4, i * 4 + 1))]);
  e.getActiveCues(901); assert(texts(e.getActiveCues(700)).includes('LONG'));
});
test('parser trims every previous row, with another region interleaved', () => {
  const { OTTSubParser: p } = modules();
  const result = p.deOverlapCues([cue('A', 1, 10.05), cue('T', 1, 20, 'T', true), cue('B', 1, 10.05), cue('C', 10, 15)]);
  assert.equal(result.find(c => c.id === 'A').end, 10);
  assert.equal(result.find(c => c.id === 'B').end, 10);
  assert.equal(result.find(c => c.id === 'T').end, 20);
});
test('co-starting short cues survive parser normalization', () => {
  const { OTTSubParser: p } = modules();
  assert.equal(p.deOverlapCues([cue('A', 1, 1.1), cue('B', 1, 1.1)]).length, 2);
});
test('both rows of a co-starting new group survive the hand-off', () => {
  const { OTTSubSyncEngine: e } = modules();
  e.setCues('1', [cue('A', 1, 10.05), cue('B', 1, 10.05), cue('C', 10, 10.1), cue('D', 10, 10.1)]);
  assert.deepEqual(texts(e.getActiveCues(10)), ['C', 'D']);
});
test('existing short-overlap policy is applied consistently at 10/50/200ms; longer overlap survives', () => {
  for (const overlap of [0.01, 0.05, 0.2, 0.201, 0.5]) {
    const { OTTSubSyncEngine: e, OTTSubParser: p } = modules();
    const rows = [cue('A', 1, 10 + overlap), cue('B', 1, 10 + overlap), cue('C', 10, 15)];
    const expected = overlap <= 0.2 ? ['C'] : ['A', 'B', 'C'];
    e.setCues('1', rows); assert.deepEqual(texts(e.getActiveCues(10)), expected);
    e.setCues('1', p.deOverlapCues(rows)); assert.deepEqual(texts(e.getActiveCues(10)), expected);
  }
});
test('top and bottom cues never replace each other during overlap', () => {
  const { OTTSubSyncEngine: e } = modules();
  e.setCues('1', [cue('A', 1, 10.05), cue('T', 10, 15, 'T', true)]);
  const result = e.getActiveCues(10); assert.deepEqual(texts(result), ['A']); assert.equal(result.top[0].text, 'T');
});
test('offset changes and fast lookup preserve the same boundary behavior', () => {
  const { OTTSubSyncEngine: e } = modules(); e.setCues('1', [cue('A', 0, 1), cue('B', 1, 2)]);
  e.setOffset(100); assert.deepEqual(texts(e.getActiveCuesFast(0.9)), ['B']);
  e.setOffset(-100); assert.deepEqual(texts(e.getActiveCuesFast(0.9)), ['A']);
  assert.deepEqual(texts(e.getActiveCuesFast(0)), []);
});

const bottom = { top: [], bottom: [cue('B', 0, 30)] }, top = { top: [cue('T', 0, 30)], bottom: [] };
const options = mediaTime => ({ mediaTime, isDualMode: true });
test('either language can lift the complete pair without mutating input', () => {
  const { OTTSubDualPlacement: Layout } = modules();
  for (const [pri, sec] of [[top, bottom], [bottom, top]]) {
    const result = new Layout().resolve(pri, sec, options(10));
    assert.equal(result.primary.top.length, 1); assert.equal(result.secondary.top.length, 1);
    assert.equal(result.primary.bottom.length + result.secondary.bottom.length, 0);
    assert.equal(bottom.bottom.length, 1);
  }
});
test('six-second hold moves both languages; both return together at expiry', () => {
  const { OTTSubDualPlacement: Layout } = modules(); const l = new Layout();
  l.resolve(top, bottom, options(10));
  for (const t of [11, 12, 13, 14, 15, 16]) {
    const r = l.resolve(bottom, bottom, options(t)); assert.equal(r.primary.top.length + r.secondary.top.length, 2);
  }
  const r = l.resolve(bottom, bottom, options(16.001)); assert.equal(r.primary.bottom.length + r.secondary.bottom.length, 2);
});
test('disabled secondary cannot lift primary, even with an old latch', () => {
  const { OTTSubDualPlacement: Layout } = modules(); const l = new Layout(); l.resolve(top, bottom, options(10));
  const r = l.resolve(bottom, top, { mediaTime: 10.1, isDualMode: false });
  assert.equal(r.primary.bottom.length, 1); assert.equal(r.secondary.top.length + r.secondary.bottom.length, 0);
});
test('seek, offset change and reset clear placement history', () => {
  const { OTTSubDualPlacement: Layout } = modules();
  for (const next of [{ mediaTime: 9 }, { mediaTime: 14 }, { mediaTime: 10.1, primaryOffset: 100 }, { mediaTime: 10.1, secondaryOffset: 100 }]) {
    const l = new Layout(); l.resolve(top, bottom, options(10));
    assert.equal(l.resolve(bottom, bottom, { ...options(10.1), ...next }).primary.bottom.length, 1);
  }
  const l = new Layout(); l.resolve(top, bottom, options(10)); l.reset();
  assert.equal(l.resolve(bottom, bottom, options(10.1)).primary.bottom.length, 1);
});
