const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/video/playback-clock.js'), 'utf8'), context);
function fixture(unit = 1000, rate = 1) {
  const clock = new context.window.OTTSubPlaybackClock(), video = {};
  const sample = (at, content = 10 + at / 1000 * rate, extra = {}) => {
    const mediaTime = extra.mediaTime ?? content + 17;
    return clock.observe({video, mediaTime, rate, paused:false, readyState:4,
      nativeVerification:'off', nativeText:'', allowCalibration:true,
      adSignal:'absent', sessionAdReason:'session-progress',
      session:{status:'ok',session:'s1',video,at,videoTime:mediaTime,
        playback:{raw:content*unit,adValue:'undefined'},open:{status:'ok',raw:content*unit,adState:'other'}}, ...extra},at);
  };
  const verify = () => {for(let at=0;at<=1200;at+=200) sample(at);return clock.selected;};
  return {clock,video,sample,verify};
}
for(const unit of [1,1000]) for(const rate of [0.5,1,1.5,2]) test(`OFF recovery with session units ${unit}, rate ${rate}, no native cues`,()=>{
  const f=fixture(unit,rate);const selected=f.verify();
  assert.equal(selected?.verification,'session-progress');assert.equal(selected.unit,unit);
  assert.equal(f.clock.baseTime(30,1300),13);
  assert.equal(f.sample(1400,undefined,{allowCalibration:false})?.verification,'session-progress');
});
test('single/repeated/short observations and conflicting units never suffice',()=>{
  const f=fixture();for(let at=0;at<=4000;at+=200) assert.equal(f.sample(at,10,{mediaTime:27+at/1000}),null);
  const g=fixture();for(let at=0;at<1000;at+=200) assert.equal(g.sample(at),null);
});
test('fresh paused replies retain subtitles for 30 seconds; resume projects media, not wall time',()=>{
  const f=fixture();f.verify();
  for(let at=1400;at<=31400;at+=200) {
    assert(f.sample(at,11.4,{paused:true}));assert.equal(f.clock.baseTime(28.4,at+100),11.399999999999999);
  }
  assert(f.sample(31600,11.4));assert(f.sample(31800,11.6));
  assert(Math.abs(f.clock.baseTime(28.8,31900)-11.8)<1e-8);
});
for(const kind of ['missing','stale','ad','disagree','seek','not-ready','hidden','pause-ad','video','session','rate','backwards','jump','unconfirmed']) test(`OFF trust revoked on ${kind}`,()=>{
  const f=fixture();assert(f.verify());const extra={};
  if(kind==='missing')extra.session=null;
  if(['stale','ad','disagree','session'].includes(kind)) {
    extra.session={status:'ok',session:kind==='session'?'s2':'s1',video:f.video,at:kind==='stale'?0:1400,videoTime:28.4,
      playback:{raw:11400,adValue:kind==='ad'?'object':'undefined'},open:{status:'ok',raw:kind==='disagree'?20000:11400,adState:'other'}};
  }
  if(kind==='seek')extra.seeking=true;if(kind==='not-ready')extra.readyState=1;
  if(kind==='hidden')extra.hidden=true;if(kind==='pause-ad')extra.pauseAd=true;
  if(kind==='video')extra.video={};if(kind==='rate')extra.rate=2;
  if(kind==='backwards')extra.mediaTime=20;if(kind==='jump')extra.mediaTime=50;
  if(kind==='unconfirmed')extra.sessionAdReason='awaiting-session-progress';
  assert.equal(f.sample(1400,undefined,extra),null);
});
test('API freeze while playing and stale replies while paused both expire',()=>{
  const f=fixture();f.verify();
  for(let at=1400;at<3200;at+=200) f.sample(at,11.2,{mediaTime:27+at/1000});
  assert.equal(f.clock.baseTime(30.2,3200),null);
  assert.equal(f.sample(3200,11.2,{mediaTime:30.2}),null);
  const g=fixture();g.verify();g.sample(1400,11.4,{paused:true});assert.equal(g.clock.baseTime(28.4,2400),null);
});
test('clock drift revokes trust instead of gradually moving the subtitle offset',()=>{
  const f=fixture();f.verify();
  assert.equal(f.sample(1400,14,{mediaTime:28.4}),null);
  const g=fixture();g.verify();assert.equal(g.sample(1400,14,{mediaTime:28.4,paused:true}),null);
});
test('frequent DOM observations cannot evict the required one-second evidence span',()=>{
  const f=fixture();for(let at=0;at<=1600;at+=50)f.sample(at);assert.equal(f.clock.selected?.verification,'session-progress');
});
test('seek needs fresh progress, and new ad clears all OFF proof',()=>{
  const f=fixture();f.verify();f.sample(1400,50,{seeking:true});
  for(let at=1600;at<2600;at+=200) assert.equal(f.sample(at,50+(at-1600)/1000),null);
  assert(f.sample(2600,51));
  f.clock.suspendForAd({video:f.video,adSignal:'present'},2800);assert.equal(f.clock.selected,null);assert.equal(f.clock.progressProof,null);
});
test('native ON without an exact selected reference cannot use the progress route',()=>{
  const f=fixture();for(let at=0;at<=4000;at+=200) assert.equal(f.sample(at,undefined,{nativeVerification:'ready'}),null);
});
