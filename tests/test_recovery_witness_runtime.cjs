const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../src/video/playback-clock.js'),'utf8'),ctx);
function fixture(unit=1000){
 const clock=new ctx.window.OTTSubPlaybackClock(),video={};
 const cues=[10,11,12,13,20].map(begin=>({begin,end:begin+.8,text:`cue${begin}`}));
 clock.setTracks([{key:'native:t1',cues}]);
 const feed=(now,time,text='',delta=-.1,extra={})=>clock.observe({video,mediaTime:time+31,rate:1,readyState:4,paused:false,
   adSignal:'absent',sessionAdReason:'session-progress',allowCalibration:true,nativeVerification:'ready',nativeTrack:{status:'selected',id:'t1'},nativeText:text,
   session:{video,status:'ok',at:now,session:'s1',playback:{raw:(time+delta)*unit},open:{status:'ok',raw:(time+delta)*unit,adState:'other'}},...extra},now);
 return {clock,video,cues,feed};
}
test('already visible exact cue alone cannot restore; a later genuine onset can verify the session',()=>{
 for(const unit of [1,1000]){
  const f=fixture(unit);assert.equal(f.feed(0,10,'cue10'),null);
  for(let n=200;n<=800;n+=200)assert.equal(f.feed(n,10+n/1000),null);
  const selected=f.feed(1000,11,'cue11');assert.equal(selected.source,'session');assert.equal(selected.unit,unit);
  assert.equal(selected.verification,'session-visible-witness');assert.equal(f.clock.calibration.values.size,1);
 }
});
test('a mid-cue initial value, repeated text and a late observed transition are not onset evidence',()=>{
 for(const kind of ['mid-cue','repeat','late']){
  const f=fixture();f.feed(0,10,'cue10',kind==='mid-cue'?.6:-.1);
  for(let n=200;n<=800;n+=200)f.feed(n,10+n/1000,kind==='repeat'?'cue10':'');
  assert.equal(f.feed(kind==='late'?1100:1000,11,kind==='repeat'?'cue10':'cue11'),null,kind);
 }
});
test('two genuine onsets need agreeing video offsets, session progression and one absolute match',()=>{
 const f=fixture();f.feed(0,9.8);f.feed(200,10,'cue10',-.28);
 for(let n=400;n<=1000;n+=200)f.feed(n,9.8+n/1000);
 const selected=f.feed(1200,11,'cue11',-.07);
 assert.equal(selected.source,'video');assert.equal(selected.offset,31);assert.equal(selected.verification,'session-corroborated-onsets');
});
for(const kind of ['both-late','relative-drift','video-drift','same-cue','ambiguous','no-session']){
 test(`two-onset corroboration rejects ${kind}`,()=>{
  const f=fixture();if(kind==='ambiguous')f.clock.setTracks([{key:'native:t1',cues:[...f.cues,{begin:50,end:51,text:'cue11'}]}]);
  const extra=kind==='no-session'?{session:null}:{};
  f.feed(0,9.8,'',-.1,extra);f.feed(200,10,'cue10',-.28,extra);
  for(let n=400;n<=1000;n+=200)f.feed(n,9.8+n/1000,'',-.1,extra);
  const selected=f.feed(1200,11,kind==='same-cue'?'cue10':'cue11',kind==='both-late'?-.3:kind==='relative-drift'?.1:-.07,
    {...extra,...(kind==='video-drift'?{mediaTime:42.4}:{})});
  assert.equal(selected,null);
 });
}
for(const kind of ['seek','gap','rate','video','session','track','off','unavailable','ad','stale','frozen']){
 test(`visible witness cannot cross ${kind}`,()=>{
  const f=fixture();f.feed(0,10,'cue10');let extras={};
  if(kind==='seek')extras.seeking=true;
  if(kind==='rate')extras.rate=2;
  if(kind==='video')extras.video={};
  if(kind==='off')f.clock.setTracks([]);
  if(kind==='track')f.clock.setTracks([{key:'native:t2',cues:f.cues}]);
  if(kind==='ad')f.clock.suspendForAd({adSignal:'present'},200);
  if(kind==='session')extras.session={video:f.video,status:'ok',at:200,session:'s2',playback:{raw:10000}};
  if(kind==='unavailable')extras.session=null;
  if(kind==='stale')extras.session={video:f.video,status:'ok',at:-1000,session:'s1',playback:{raw:10000}};
  if(kind==='frozen'){
   for(let n=200;n<=2200;n+=200)f.feed(n,10+n/1000,'',0,{session:{video:f.video,status:'ok',at:n,session:'s1',playback:{raw:9900}}});
   assert.equal(f.clock.recoveryWitnesses.size,0);return;
  }
  f.feed(kind==='gap'?1200:200,10.2,'',-.1,extras);
  assert.equal(f.clock.recoveryWitnesses.size,0);
 });
}
test('unverified tracks, normal playback and hidden/pause-ad states cannot create a witness',()=>{
 for(const extra of [{nativeVerification:'loading'},{allowCalibration:false},{nativeTrack:{status:'off'}},{hidden:true},{pauseAd:true},{sessionAdReason:'unavailable'}]){
  const f=fixture();f.feed(0,10,'cue10',-.1,extra);assert.equal(f.clock.recoveryWitnesses.size,0);
 }
});
test('both absolute session matches retain the existing two-onset session path',()=>{
 const f=fixture();f.feed(0,9.8);f.feed(200,10,'cue10',-.1);
 for(let n=400;n<=1000;n+=200)f.feed(n,9.8+n/1000);
 assert.equal(f.feed(1200,11,'cue11',-.1).source,'session');
});
test('captured startup and mid-roll recover sooner; the baseline exactly reproduces all 927 selections',()=>{
 const {replay}=require('./fixtures/recovery-witness/replay.cjs');
 const before=replay(true),after=replay();assert.equal(before.checked,927);assert.equal(before.differences.length,0);
 assert.deepEqual(before.firsts.map(r=>r.at),[561059,695783.5]);assert.deepEqual(after.firsts.map(r=>r.at),[556531.3,693695.6]);
 assert.deepEqual(after.relapses,[]);
});
