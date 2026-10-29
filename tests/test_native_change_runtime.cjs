const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/video/playback-clock.js'),'utf8'),ctx);
function fixture(rate=1){
 const clock=new ctx.window.OTTSubPlaybackClock(),video={};
 const cues=[2,3,4].map((t,i)=>({begin:10+t*rate,end:10+t*rate+.5,text:['A','B','C'][i]}));
 clock.setTracks([{key:'native:t1',cues}]);
 const sample=(at,extra={})=>{const time=10+at/1000*rate;return {video,mediaTime:time+17,rate,paused:false,readyState:4,nativeText:'',
  nativeTrack:{status:'selected',id:'t1'},nativeVerification:'ready',allowCalibration:true,
  adSignal:'absent',sessionAdReason:'session-progress',
  session:{status:'ok',session:'s1',video,at,videoTime:time+17,playback:{raw:time*1000,adValue:'undefined'},open:{status:'ok',raw:time*1000,adState:'other'}},...extra};};
 for(let at=0;at<=8000;at+=200)clock.observe(sample(at,{nativeText:at===2000?'A':at===3000?'B':at===4000?'C':''}),at);
 assert.equal(clock.selected.source,'video');assert(clock.sessionProof.ready);
 return {clock,sample,cues};
}
for(const rate of [1,1.5,2]) for(const state of ['loading','off','urls-missing'])test(`native ${state}, rate ${rate}: preserve verified clock without a spoken line`,()=>{
 const {clock,sample,cues}=fixture(rate);
 const pulse=at=>sample(at,{nativeVerification:state,nativeTrack:state==='off'?{status:'off'}:{status:'selected',id:'t2'}});
 clock.setTracks([],pulse(8100),8100);
 for(let at=8100;at<=20000;at+=100){const s=pulse(at);assert.equal(clock.observe(s,at)?.source,'video');assert(Math.abs(clock.baseTime(s.mediaTime,at)-(s.mediaTime-17))<.001);}
 const ready=sample(20100,{nativeTrack:{status:'selected',id:'t2'}});clock.setTracks([{key:'native:t2',cues}],ready,20100);
 assert.equal(clock.observe(ready,20100)?.source,'video');
});
for(const kind of ['seek','ad','unknown','video','session','stale','drift','rate'])test(`native reference change never bypasses ${kind}`,()=>{
 const {clock,sample}=fixture();const s=sample(8100,{nativeVerification:'loading'});
 if(kind==='seek')s.seeking=true;if(kind==='ad'||kind==='unknown')s.adSignal=kind==='ad'?'present':'unknown';
 if(kind==='video')s.video={};if(kind==='session')s.session.session='s2';if(kind==='stale')s.session.at=7000;
 if(kind==='drift')s.session.playback.raw=s.session.open.raw=999000;if(kind==='rate')s.rate=2;
 clock.setTracks([],s,8100);assert.equal(clock.selected,null);assert.equal(clock.referenceContinuity,null);
});
test('seek during pending new native download revokes retained clock',()=>{
 const {clock,sample}=fixture();const s=sample(8100,{nativeVerification:'loading'});clock.setTracks([],s,8100);assert(clock.observe(s,8100));
 clock.beginSeek(8150);assert.equal(clock.selected,null);assert.equal(clock.referenceContinuity,null);
});
for(const kind of ['stale','session','drift','paused'])test(`retained reference clock continues monitoring ${kind}`,()=>{
 const {clock,sample}=fixture();const s=sample(8100,{nativeVerification:'loading'});clock.setTracks([],s,8100);assert(clock.observe(s,8100));
 const next=sample(8200,{nativeVerification:'loading'});
 if(kind==='stale')next.session.at=7000;if(kind==='session')next.session.session='new';if(kind==='drift')next.session.playback.raw=next.session.open.raw=90000;
 if(kind==='paused'){next.paused=true;next.mediaTime=s.mediaTime;next.session.videoTime=s.mediaTime;next.session.playback.raw=next.session.open.raw=s.session.playback.raw;}
 assert.equal(!!clock.observe(next,8200),kind==='paused');
});
test('an already checked session-progress clock survives native reference download without new speech',()=>{
 const {clock,sample,cues}=fixture();clock.reset();
 for(let at=10000;at<=11600;at+=200)clock.observe(sample(at,{nativeVerification:'off',nativeTrack:{status:'off'}}),at);
 assert.equal(clock.selected.verification,'session-progress');
 const s=sample(11800,{nativeVerification:'loading',nativeTrack:{status:'selected',id:'t2'},allowCalibration:false});clock.setTracks([],s,11800);
 assert.equal(clock.observe(s,11800)?.verification,'session-progress');
 const ready=sample(12000,{nativeTrack:{status:'selected',id:'t2'},allowCalibration:false});clock.setTracks([{key:'native:t2',cues}],ready,12000);
 assert.equal(clock.observe(ready,12000)?.verification,'session-progress');
});
test('new matching native onset updates track identity and permits fresh seek evidence',()=>{
 const {clock,sample}=fixture();const switched=at=>sample(at,{nativeTrack:{status:'selected',id:'t2'}});
 const s=switched(8100);clock.setTracks([{key:'native:t2',cues:[{begin:19,end:20,text:'NEW'}]}],s,8100);
 for(let at=8200;at<=10000;at+=200)clock.observe({...switched(at),nativeText:at===9000?'NEW':''},at);
 assert.equal(clock.selected.track,'native:t2');assert.equal(clock.sessionProof.ready,true);
 clock.beginSeek(10100);assert.equal(clock.seekProof.track,'native:t2');
});
test('track replacement with no decoded frame never keeps provisional session clock',()=>{
 const {clock,sample}=fixture();clock.reset();for(let at=10000;at<=11600;at+=200)clock.observe(sample(at,{nativeVerification:'off',nativeTrack:{status:'off'}}),at);
 assert(clock.selected);clock.setTracks([],sample(11800,{readyState:1}),11800);assert.equal(clock.selected,null);
});
test('reset clears retained reference and a new episode cannot inherit it',()=>{
 const {clock,sample}=fixture();clock.setTracks([],sample(8100),8100);assert(clock.referenceContinuity);clock.reset();assert.equal(clock.referenceContinuity,null);assert.equal(clock.selected,null);
 assert.equal(clock.observe(sample(8200,{video:{},nativeVerification:'loading'}),8200),null);
});
