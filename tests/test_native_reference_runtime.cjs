const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ctx = { window: {}, AbortController };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/video/native-reference.js'), 'utf8'), ctx);
const payload = { movieId: '100', nativeIdentityVersion: 1, availableTracks: [
  { identityTokens: ['t1'], bcp47: 'ja', urls: ['https://cdn.nflxvideo.net/ja-cc'] },
  { identityTokens: ['t2'], bcp47: 'ja', urls: ['https://cdn.nflxvideo.net/ja-normal'] },
  { identityTokens: ['t3'], bcp47: 'en', urls: ['https://cdn.nflxvideo.net/en'] }] };
const tick = async () => { for(let i=0;i<8;i++) await Promise.resolve(); };
test('exact selected track wins over same-language CC/normal and display languages', async () => {
  const calls=[];const n=new ctx.window.OTTSubNativeReference(async urls=>{calls.push(urls[0]);return [{text:'原文',begin:10,end:11}];},s=>s);
  assert.equal(n.update({id:'t1'},payload,'100',1).length,0); await tick();
  const tracks=n.update({id:'t1'},payload,'100',1);
  assert.equal(tracks[0].key,'native:t1');assert.equal(tracks[0].cues[0].plainText,'原文');
  assert.deepEqual(calls,['https://cdn.nflxvideo.net/ja-cc']);
});
test('missing/ambiguous IDs, OFF, absent URLs and wrong movie never guess by language', () => {
  const n=new ctx.window.OTTSubNativeReference(()=>{throw Error('must not fetch');},s=>s);
  for (const [track,p,mid,status] of [[{id:'t9'},payload,'100','track-missing'],[{status:'off'},payload,'100','off'],
    [{id:'t1'},payload,'200','track-missing'],[{id:'t1'},{...payload,availableTracks:[payload.availableTracks[0],payload.availableTracks[0]]},'100','ambiguous'],
    [{id:'t1'},{...payload,availableTracks:[{identityTokens:['t1']}]},'100','urls-missing']]) {
    assert.equal(n.update(track,p,mid,1).length,0);assert.equal(n.status,status);
  }
});
test('late fetches cannot cross track or episode generation even if cancellation is ignored', async () => {
  const pending=[];const n=new ctx.window.OTTSubNativeReference((urls,signal)=>new Promise(resolve=>pending.push({resolve,signal})),s=>s);
  n.update({id:'t1'},payload,'100',1);await tick();
  n.update({id:'t2'},payload,'100',2);await tick();
  pending[0].resolve([{text:'OLD'}]);await tick();assert.equal(n.cues.length,0);assert(pending[0].signal.aborted);
  pending[1].resolve([{text:'NEW'}]);await tick();assert.equal(n.cues[0].text,'NEW');
  n.reset();assert.equal(n.cues.length,0);
});
test('legacy manifests retain compatibility; failed fetch does not loop on each sample', async () => {
  let count=0;const n=new ctx.window.OTTSubNativeReference(async()=>{count++;throw Error('offline');},s=>s);
  assert.equal(n.update({id:'t1'},{movieId:'100'},'100',1),null);
  n.update({id:'t1'},payload,'100',1);await tick();assert.equal(n.status,'failed');
  for(let i=0;i<20;i++) n.update({id:'t1'},payload,'100',1);
  assert.equal(count,1);
});
