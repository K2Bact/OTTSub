const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/video/playback-gate.js'), 'utf8'), ctx);
const Gate = ctx.window.OTTSubPlaybackGate;
function fixture() {
  const gate = new Gate(), video = {};
  gate.reset('100');
  const observe = (adSignal, now, extra = {}) => gate.observe({ adSignal, video, mediaTime: 10, ...extra }, now);
  return { gate, video, observe };
}
test('AD22: no-ad first observation allows existing video clock; inactive never allows it', () => {
  const { gate, observe } = fixture();
  assert.equal(gate.status(0).displaySuppressed, true);
  assert.equal(observe('absent', 0).displaySuppressed, false);
  gate.reset(null);
  assert.equal(observe('absent', 250).playbackState, 'INACTIVE');
});
test('AD03/05: initial and consecutive ads latch; 300 ms gap never releases subtitles', () => {
  const { observe } = fixture();
  assert.equal(observe('present', 0).playbackState, 'AD');
  assert.equal(observe('absent', 250).playbackState, 'RECOVERING');
  assert.equal(observe('absent', 500).displaySuppressed, true);
  assert.equal(observe('present', 550).playbackState, 'AD');
  assert.equal(observe('unknown', 750).playbackState, 'AD');
  assert.equal(observe('uncertain', 1000).playbackState, 'AD');
});
test('AD21: timeout reports delayed verification, never a clock verification bypass', () => {
  const { gate, observe } = fixture();
  observe('present', 0);
  for (let now = 250; now <= 20000; now += 250) assert.equal(observe('absent', now).displaySuppressed, true);
  assert.equal(gate.status(20000).playbackState, 'RECOVERY_DELAYED');
  assert.equal(gate.adHistory, true);
});
test('AD06: long/hidden gaps do not count as observed recovery time', () => {
  const { gate, observe } = fixture();
  observe('present', 0); observe('absent', 250);
  observe('absent', 20000);
  assert.equal(gate.recoveryMs, 0);
  observe('absent', 20250, { hidden: true });
  observe('absent', 40250);
  assert.equal(gate.recoveryMs, 0);
  assert.equal(gate.absentCount, 1);
});
test('background gap requires a verified clock even if no ad was observed before hiding',()=>{
  const {gate,observe}=fixture();assert.equal(observe('absent',0).displaySuppressed,false);
  observe('absent',100,{hidden:true});
  for(let now=30200;now<=32000;now+=200)assert.equal(observe('absent',now,{mediaTime:500}).displaySuppressed,true);
  assert.equal(gate.confirmClock('session',32000),true);
  assert.equal(gate.status(32000).displaySuppressed,false);
});
test('AD06b: uncertain UI suppresses immediately and cannot revert to initial allowance', () => {
  const { gate, observe } = fixture();
  observe('absent', 0);
  assert.equal(observe('uncertain', 250).displaySuppressed, true);
  for (let now = 500; now <= 3000; now += 250) observe('absent', now);
  assert.equal(gate.status(3000).displaySuppressed, true);
});
test('AD06b: temporary unknown needs a fresh continuous second, missing samples reset it', () => {
  const { observe } = fixture();
  observe('absent', 0); observe('unknown', 250);
  for (const now of [500, 750, 1000, 1501, 1751, 2001, 2251]) assert.equal(observe('absent', now).displaySuppressed, true);
  assert.equal(observe('absent', 2501).displaySuppressed, false);
});
test('AD19: pause-ad is independently suppressed, resumes without creating ad history', () => {
  const { gate, observe } = fixture();
  assert.equal(observe('absent', 0, { pauseAd: true }).suppressionReason, 'pause-ad');
  assert.equal(observe('absent', 250).displaySuppressed, false);
  assert.equal(gate.adHistory, false);
  observe('present', 500, { pauseAd: true });
  assert.equal(observe('absent', 750).displaySuppressed, true);
});
test('stale observation closes display even if the observer has not ticked', () => {
  const { gate, observe } = fixture();
  observe('absent', 100);
  assert.equal(gate.status(1099).displaySuppressed, false);
  assert.equal(gate.status(1100).suppressionReason, 'observation-stale');
  assert.equal(gate.status(99).displaySuppressed, true);
});
test('AD19: pause-ad time discontinuity cannot silently reuse the previous video clock', () => {
  const { gate, observe } = fixture();
  observe('absent', 0, { pauseAd: true });
  observe('absent', 250, { mediaTime: 100 });
  for (let now = 500; now <= 2000; now += 250) assert.equal(observe('absent', now, { mediaTime: 100 }).displaySuppressed, true);
  assert.equal(gate.adHistory, false);
  assert.equal(gate.status(2000).suppressionReason, 'clock-unverified');
});
test('AD17: new episode drops prior ad evidence, same episode cannot timeout-reset it', () => {
  const { gate, observe } = fixture();
  observe('present', 0); gate.reset('200');
  assert.equal(observe('absent', 250).displaySuppressed, false);
  assert.equal(gate.adHistory, false);
});
