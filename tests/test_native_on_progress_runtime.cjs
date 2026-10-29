const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
const override=process.env.OTTSub_TEST_SOURCE;
const source=override&&fs.existsSync(path.join(override,'src/video/playback-clock.js'))?override:root;
vm.runInNewContext(fs.readFileSync(path.join(source,'src/video/playback-clock.js'),'utf8'),ctx);
function fixture(unit=1000){
 const clock=new ctx.window.OTTSubPlaybackClock(),video={};
 const cues=[{begin:12,end:12.5,text:'A'},{begin:13,end:13.5,text:'B'},{begin:14,end:14.5,text:'C'}];
 clock.setTracks([{key:'native:t1',cues}]);
 const sample=(at,extra={})=>{
  const media=27+at/1000,raw=(10+at/1000)*unit;
  return clock.observe({video,mediaTime:media,rate:1,paused:false,readyState:4,nativeText:'',
   nativeTrack:{status:'selected',id:'t1'},nativeVerification:'ready',allowCalibration:true,
   adSignal:'absent',sessionAdReason:'session-progress',
   session:{status:'ok',session:'s1',video,at,videoTime:media,playback:{raw,adValue:'undefined'},open:{status:'ok',raw,adState:'other'}},...extra},at);
 };
 const verify=()=>{for(let at=0;at<=1200;at+=200)sample(at);return clock.selected;};
 return {clock,video,sample,verify};
}
for(const unit of [1,1000])test(`ON with silent exact native track restores from session unit ${unit}`,()=>{
 const f=fixture(unit);assert.equal(f.verify()?.verification,'session-progress');
 assert.equal(f.clock.baseTime(28.5,1500),11.5);
 assert(f.sample(1400,{allowCalibration:false}));
});
for(const state of ['loading','ambiguous','track-missing','unavailable','failed'])test(`ON ${state} cannot borrow an unverified language track`,()=>{
 const f=fixture();for(let at=0;at<=2000;at+=200)assert.equal(f.sample(at,{nativeVerification:state}),null);
});
test('wrong exact identity never enables the ON progress path',()=>{
 const f=fixture();for(let at=0;at<=2000;at+=200)assert.equal(f.sample(at,{nativeTrack:{status:'selected',id:'t2'}}),null);
});
for(const kind of ['stale','conflict','seek','not-ready','session-change','ad','hidden','pause-ad'])test(`ON progress revokes on ${kind}`,()=>{
 const f=fixture();assert(f.verify());const extra={};
 if(kind==='stale')extra.session={status:'ok',video:f.video,at:0};
 if(kind==='conflict'||kind==='session-change')extra.session={status:'ok',video:f.video,at:1400,videoTime:28.4,session:kind==='session-change'?'s2':'s1',playback:{raw:11400,adValue:'undefined'},open:{status:'ok',raw:kind==='conflict'?50000:11400,adState:'other'}};
 if(kind==='seek')extra.seeking=true;if(kind==='not-ready')extra.readyState=1;
 if(kind==='ad')extra.adSignal='present';if(kind==='hidden')extra.hidden=true;if(kind==='pause-ad')extra.pauseAd=true;
 assert.equal(f.sample(1400,extra),null);
});
test('late wrong onset revokes provisional proof and cannot reacquire it in silence',()=>{
 const f=fixture();assert(f.verify());f.sample(1400);
 assert.equal(f.sample(1600,{nativeText:'C'}),null);
 for(let at=1800;at<=5000;at+=200)assert.equal(f.sample(at),null);
 assert.equal(f.clock.progressRejected,true);
 f.clock.reset();assert(f.verify(),'New clock epoch may verify again');
});
test('correct later onsets hand off to native video without a blank interval',()=>{
 const f=fixture();assert(f.verify());let handoff=false;
 for(let at=1400;at<=4200;at+=200){
  const text=at===2000?'A':at===3000?'B':at===4000?'C':'';
  const selected=f.sample(at,{allowCalibration:false,nativeText:text});
  assert(selected);if(selected.source==='video')handoff=true;
 }
 assert(handoff);assert.equal(f.clock.selected.offset,17);
});
test('old seek location cannot release captions before fresh destination progress',()=>{
 const f=fixture();
 for(let at=0;at<=800;at+=200)assert.equal(f.sample(at,{session:{status:'ok',session:'s1',video:f.video,at,videoTime:27+at/1000,playback:{raw:1500000,adValue:'undefined'},open:{status:'ok',raw:1500000,adState:'other'}}}),null);
 let selected;
 for(let at=1000;at<=5000;at+=200){
  selected=f.sample(at);if(selected)assert(Math.abs(selected.time-(10+at/1000))<0.01);
 }
 assert(selected);
});
test('recorded stepped session restores before dialogue, then independent onsets refine it',()=>{
 const data=require('./fixtures/native-on-post-ad-2026-10-11.json');
 const clock=new ctx.window.OTTSubPlaybackClock(),video={};
 clock.setTracks([{key:'native:t1',cues:data.cueBegins.map(begin=>({begin,end:begin+0.5,text:`cue:${begin}`}))}]);
 let first=null,handoff=null,dropouts=0;
 for(const row of data.samples){
  const selected=clock.observe({video,mediaTime:row.media,rate:row.rate,paused:row.paused,readyState:4,
   nativeText:row.textKey===null?'':`cue:${row.textKey}`,nativeTrack:{status:'selected',id:'t1'},nativeVerification:'ready',
   allowCalibration:!first,adSignal:'absent',sessionAdReason:'session-progress',
   session:{status:'ok',session:row.sessionId,video,at:row.sessionAt,videoTime:row.pairedMedia,
    playback:{raw:row.raw,adValue:'undefined'},open:{status:'ok',raw:row.openRaw,adState:'other'}}},row.at);
  if(selected&&!first)first={at:row.at,selected:{...selected}};
  if(first&&!selected)dropouts++;
  if(selected?.source==='video'&&!handoff)handoff={at:row.at,offset:selected.offset};
 }
 assert(first);assert(first.at<348043,'Recover before the first original dialogue');
 assert.equal(first.selected.verification,'session-progress');assert.equal(dropouts,0);
 assert(handoff);assert(Math.abs(handoff.offset+2014.205)<0.01);
 console.log(JSON.stringify({replay:'native-on-post-ad',first,delaySeconds:(first.at-data.recoveryAt)/1000,handoff,dropouts}));
});
