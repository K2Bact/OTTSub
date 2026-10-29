const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'src/video/playback-clock.js'),'utf8'),ctx);
function fixture(unit=1000,offset=0) {
 const clock=new ctx.window.OTTSubPlaybackClock(),video={};
 const cues=[10,11,16,17,18,19,20,21,22,100].map(begin=>({begin,end:begin+.8,text:`cue${begin}`}));
 clock.setTracks([{key:'native:t1',cues}]);
 const sample=(now,time,text='',extra={})=>({video,mediaTime:time+offset,rate:1,readyState:4,paused:false,seeking:false,
   adSignal:'absent',nativeText:text,nativeTrack:{status:'selected',id:'t1'},nativeVerification:'ready',
   sessionAdReason:'session-progress',allowCalibration:false,
   session:{video,at:now,status:'ok',session:'s1',playback:{raw:(time-.2)*unit},open:{status:'ok',raw:(time-.2)*unit,adState:'other'}},...extra});
 const feed=(now,time,text='',extra={})=>clock.observe(sample(now,time,text,extra),now);
 const prime=()=>{
   for(let now=0;now<=5000;now+=200)feed(now,9.8+now/1000,now===200?'cue10':now===1200?'cue11':'',{allowCalibration:offset!==0});
   // A calibrated-video precondition is covered separately below using three onsets.
   assert.equal(clock.selected?.source,'video');assert.equal(clock.sessionProof?.ready,true);
 };
 const ad=(mutate=()=>({}))=>{
   for(let now=5200;now<=20200;now+=200){
     const s=sample(now,14.8,'',{adSignal:'present'});s.session.playback.adValue='object';s.session.open.adState='start';
     Object.assign(s,mutate(now,s));clock.suspendForAd(s,now);assert.equal(clock.selected,null);
   }
 };
 const resume=(extra={})=>{
   for(let n=0;n<6;n++)feed(20400+n*200,14.8+n*.2,'',{mediaTime:31.8+n*.2,allowCalibration:true,...extra});
   return feed(21600,16,'cue16',{mediaTime:33,allowCalibration:true,...extra});
 };
 return {clock,video,cues,sample,feed,prime,ad,resume};
}
test('verified relationship survives a 15s ad; first fresh onset restores video in either raw unit',()=>{
 for(const unit of [1,1000]){
   const f=fixture(unit);f.prime();f.ad();assert(f.clock.adProof);assert.equal(f.clock.baseTime(33,20200),null);
   const selected=f.resume();assert.equal(selected?.key,'video-calibrated');assert.equal(selected.offset,17);
   assert.equal(f.clock.baseTime(33.2,21800),16.200000000000003);
 }
});
test('startup ad, unverified display track and session-only clock cannot teach a relationship',()=>{
 const f=fixture();f.ad();assert.equal(f.clock.adProof,null);assert.equal(f.resume(),null);
 for(const kind of ['legacy','session']){
  const g=fixture();
  for(let n=0;n<=5000;n+=200)g.feed(n,9.8+n/1000,n===200?'cue10':n===1200?'cue11':'',
    kind==='legacy'?{nativeVerification:'unavailable'}:{mediaTime:26.8+n/1000});
  assert.equal(g.clock.sessionProof,null,kind);g.ad();assert.equal(g.clock.adProof,null,kind);
 }
});
test('only independent raw changes count and memory remains bounded',()=>{
 const f=fixture();f.prime();assert(f.clock.sessionProof.values.size<=5);
 for(let n=5200;n<6000;n+=200)f.feed(n,15+((n-5200)/1000));
 assert(f.clock.sessionProof.values.size<=5);
 const g=fixture();g.prime();g.clock.sessionProof=null;
 const raw=g.sample(5200,15).session;
 for(let n=5200;n<=5600;n+=200)g.feed(n,15+(n-5200)/1000,'',{session:{...raw,at:n}});
 assert.equal(g.clock.sessionProof?.ready,false);
});
for(const kind of ['seek','video','session','track','off','rate','buffer','hidden','pause-ad','missing','stale','ad-clock-runs','backwards']){
 test(`ad proof is revoked by ${kind}`,()=>{
  const f=fixture();f.prime();f.ad((now,s)=>{
   if(now!==10200)return {};
   const overrides={seek:{seeking:true},video:{video:{}},session:{session:{...s.session,session:'s2'}},
     track:{nativeTrack:{status:'selected',id:'t2'}},off:{nativeTrack:{status:'off'}},rate:{rate:2},
     buffer:{readyState:1},hidden:{hidden:true},'pause-ad':{pauseAd:true},missing:{session:null},
     stale:{session:{...s.session,at:now-1000}},
     'ad-clock-runs':{session:{...s.session,playback:{raw:20000}}},backwards:{session:{...s.session,playback:{raw:10000}}}};
   return overrides[kind];
  });assert.equal(f.clock.adProof,null);assert.equal(f.resume(),null);
 });
}
test('new episode/reset, track cue replacement and observation gaps discard the proof',()=>{
 for(const kind of ['reset','tracks','gap']){
  const f=fixture();f.prime();f.ad();
  if(kind==='reset')f.clock.reset();
  if(kind==='tracks')f.clock.setTracks([{key:'native:t1',cues:f.cues.slice()}]);
  if(kind==='gap')f.feed(21600,16,'',{mediaTime:33,allowCalibration:true});
  assert.equal(f.clock.adProof,null,kind);
 }
});
for(const kind of ['wrong-cue','unknown-progress','disagreeing-apis','raw-jump','raw-reset','paused']){
 test(`post-ad ${kind} cannot take the one-onset shortcut`,()=>{
  const f=fixture();f.prime();f.ad();
  for(let n=0;n<6;n++)f.feed(20400+n*200,14.8+n*.2,'',{mediaTime:31.8+n*.2,allowCalibration:true});
  const s=f.sample(21600,16,'cue16',{mediaTime:33,allowCalibration:true});
  if(kind==='wrong-cue')s.nativeText='cue100';
  if(kind==='unknown-progress')s.sessionAdReason='awaiting-session-progress';
  if(kind==='disagreeing-apis')s.session.open.raw+=1000;
  if(kind==='raw-jump'){s.session.playback.raw=100000;s.session.open.raw=100000;s.nativeText='cue100';}
  if(kind==='raw-reset'){s.session.playback.raw=0;s.session.open.raw=0;}
  if(kind==='paused')s.paused=true;
  assert.equal(f.clock.observe(s,21600),null);
 });
}
test('ambiguous or unchanged text is not a unique onset',()=>{
 const f=fixture();f.clock.setTracks([{key:'native:t1',cues:[...f.cues,{begin:60,end:61,text:'cue16'}]}]);
 f.prime();f.ad();assert.equal(f.resume(),null);
 const g=fixture();g.prime();g.ad();
 for(let n=0;n<=6;n++)g.feed(20400+n*200,14.8+n*.2,'cue16',{mediaTime:31.8+n*.2,allowCalibration:true});
 assert.equal(g.clock.selected,null);
});
test('silence never restores; stale post-ad proof expires',()=>{
 const f=fixture();f.prime();f.ad();
 for(let n=0;n<=55;n++)f.feed(20400+n*200,14.8+n*.2,'',{mediaTime:31.8+n*.2,allowCalibration:true});
 assert.equal(f.clock.selected,null);assert.equal(f.clock.adProof,null);
});
test('mismatched first onset discards shortcut but ordinary three-onset recovery remains',()=>{
 const f=fixture();f.prime();f.ad();
 f.resume({session:{...f.sample(21600,16).session,playback:{raw:16200},open:{status:'ok',raw:16200}}});
 assert.equal(f.clock.selected,null);assert.equal(f.clock.adProof,null);
 for(let n=21800;n<=23600;n+=200){const time=16+(n-21600)/1000;f.feed(n,time,n===22600?'cue17':n===23600?'cue18':'',{mediaTime:time+17,allowCalibration:true});}
 assert.equal(f.clock.selected?.key,'video-calibrated');
});
test('wrong later onsets and seeks revoke a restored clock',()=>{
 const f=fixture();f.prime();f.ad();f.resume();
 f.feed(21800,16.2,'',{mediaTime:33.2});f.feed(22000,16.4,'cue100',{mediaTime:33.4});
 f.feed(22200,16.6,'',{mediaTime:33.6});f.feed(22400,16.8,'cue10',{mediaTime:33.8});
 assert.equal(f.clock.selected,null);
 const g=fixture();g.prime();g.ad();g.resume();g.feed(21800,16.2,'',{mediaTime:33.2,seeking:true});assert.equal(g.clock.selected,null);
});
test('long ads expire retained proof; unknown signal alone cannot arm it',()=>{
 const f=fixture();f.prime();
 f.clock.suspendForAd(f.sample(5200,14.8,'',{adSignal:'unknown'}),5200);assert.equal(f.clock.adProof,null);
 const g=fixture();g.prime();g.ad();
 for(let n=20400;n<=186000;n+=200)g.clock.suspendForAd(g.sample(n,14.8,'',{adSignal:'present'}),n);
 assert.equal(g.clock.adProof,null);
});
test('a second ad learns from calibrated video, without accumulating the old video offset',()=>{
 const f=fixture();f.prime();f.ad();f.resume();
 for(let n=21800;n<=24600;n+=200)f.feed(n,16+(n-21600)/1000,'',{mediaTime:33+(n-21600)/1000});
 assert.equal(f.clock.sessionProof.ready,true);
 for(let n=24800;n<=39800;n+=200)f.clock.suspendForAd(f.sample(n,19,'',{mediaTime:36,adSignal:'present'}),n);
 assert(f.clock.adProof);
 for(let n=40000;n<42000;n+=200)f.feed(n,19+(n-40000)/1000,'',{mediaTime:53+(n-40000)/1000,allowCalibration:true});
 const result=f.feed(42000,21,'cue21',{mediaTime:55,allowCalibration:true});
 assert.equal(result.verification,'ad-memory-onset');assert.equal(result.offset,34);
 assert.equal(f.clock.baseTime(55,42000),21);
});
test('both captured timelines recover earlier with no later loss',()=>{
 const {replay}=require('./fixtures/ad-clock-memory/replay.cjs');
 for(const [folder,delay] of [['2026-10-10',1829.1],['2026-10-10-handoff',3406.3]]){
  const old=replay(folder,true),current=replay(folder);
  assert.equal(current.retainedAtEntry,true);assert.equal(current.first.delayMs,delay);
  assert(current.first.delayMs<old.first.delayMs);assert.equal(current.dropouts,0);
  assert(current.onsetErrorsMs.every(n=>Math.abs(n)<50));
 }
});
