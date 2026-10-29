const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.env.OTTSub_TEST_SOURCE||path.resolve(__dirname,'..'),ctx={window:{}};
for(const name of ['playback-clock','playback-gate'])vm.runInNewContext(fs.readFileSync(path.join(root,`src/video/${name}.js`),'utf8'),ctx);
function fixture(unit=1000,rate=1){
 const clock=new ctx.window.OTTSubPlaybackClock(),video={};
 const cues=[2,3,4].map((n,i)=>({begin:10+rate*n,end:10+rate*n+0.5,text:['A','B','C'][i]}));
 clock.setTracks([{key:'native:t1',cues}]);
 const sample=(at,time,extra={})=>({video,mediaTime:time+17,rate,paused:false,readyState:4,nativeText:'',
  nativeTrack:{status:'selected',id:'t1',language:'ja'},nativeVerification:'ready',allowCalibration:true,
  adSignal:'absent',domAdSignal:'absent',sessionAdSignal:'absent',sessionAdReason:'session-progress',
  session:{status:'ok',session:'s1',video,at,videoTime:time+17,playback:{raw:time*unit,adValue:'undefined'},open:{status:'ok',raw:time*unit,adState:'other'}},...extra});
 for(let at=0;at<=6000;at+=200)clock.observe(sample(at,10+rate*at/1000,{nativeText:at===2000?'A':at===3000?'B':at===4000?'C':''}),at);
 assert.equal(clock.selected.source,'video');assert.equal(clock.sessionProof.ready,true);
 if(clock.beginSeek)clock.beginSeek(6200);else clock.reset();
 const pulse=(at=6800,extra={})=>clock.observe(sample(at,40+rate*(at-6400)/1000,extra),at);
 return {clock,video,sample,pulse};
}
test('a verified 1.5x relationship survives a seek when the rate stays 1.5x',()=>{
 const f=fixture(1000,1.5);assert.equal(f.clock.seekProof.rate,1.5);
 assert.equal(f.pulse(6800),null);assert.equal(f.pulse(7000)?.verification,'seek-session-confirmed');
 assert.equal(f.clock.selected.offset,17);
});
for(const unit of [1,1000])test(`silent seek reuses independently verified relationship with two new updates, unit ${unit}`,()=>{
 const f=fixture(unit);assert(f.clock.seekProof);assert.equal(f.clock.selected,null);
 f.clock.suspendForAd(f.sample(6400,40,{adSignal:'unknown',sessionAdSignal:'unknown',sessionAdReason:'awaiting-session-progress'}),6400);
 assert(f.clock.seekProof);assert.equal(f.pulse(6800),null);
 const selected=f.pulse(7000);assert.equal(selected.verification,'seek-session-confirmed');assert.equal(selected.offset,17);
 assert.equal(f.clock.baseTime(57.8,7200),40.8);
});
test('seeking samples retain only hint, never display permission',()=>{
 const f=fixture();assert.equal(f.pulse(6400,{seeking:true}),null);assert(f.clock.seekProof);
 assert.equal(f.pulse(6600),null);assert.equal(f.pulse(6800)?.verification,'seek-session-confirmed');
});
test('stale pre-seek raw cannot restore even when bridge responds repeatedly',()=>{
 const f=fixture();for(let at=6400;at<=7800;at+=200){const s=f.sample(at,40+(at-6400)/1000);s.session.playback.raw=s.session.open.raw=16000;assert.notEqual(f.clock.observe(s,at)?.verification,'seek-session-confirmed');}
});
test('frozen destination raw and duplicate callbacks are not two observations',()=>{
 const f=fixture();const s=f.sample(6400,40);for(const at of [6400,6500,6600])assert.equal(f.clock.observe(s,at),null);
});
for(const kind of ['ad','uncertain','video','rate','track','session','expired','reset'])test(`${kind} cannot reuse seek proof`,()=>{
 const f=fixture();let at=6400,extra={};
 if(kind==='ad'||kind==='uncertain'){f.clock.suspendForAd(f.sample(at,40,{adSignal:kind==='ad'?'present':'uncertain'}),at);assert.equal(f.clock.seekProof,null);}
 if(kind==='video')extra.video={};if(kind==='rate')extra.rate=2;
 if(kind==='track')extra.nativeTrack={status:'selected',id:'t2'};
 if(kind==='session'){const session=f.sample(at,40).session;extra.session={...session,session:'s2'};}
 if(kind==='expired')at=11200;if(kind==='reset')f.clock.reset();
 assert.notEqual(f.pulse(at,extra)?.verification,'seek-session-confirmed');
 assert.equal(f.clock.seekProof,null);
});
test('without independent video proof, seek takes the ordinary verification path',()=>{
 const f=fixture();f.clock.reset();f.clock.selected={source:'session',verification:'session-progress'};f.clock.beginSeek(6200);assert.equal(f.clock.seekProof,null);
});
test('gate only shortens stable absence for a separately confirmed seek clock',()=>{
 const gate=new ctx.window.OTTSubPlaybackGate(),video={};gate.reset('100');
 gate.observe({video,mediaTime:10,adSignal:'present'},0);
 for(const at of [200,400,600])gate.observe({video,mediaTime:10+at/1000,adSignal:'absent'},at);
 assert.equal(gate.confirmClock('video',600),false);assert.equal(gate.confirmClock('video',600,'session-progress'),false);
 assert.equal(gate.confirmClock('video',600,'seek-session-confirmed'),true);
});
test('combined gate/clock returns in 400ms after absent versus 1000ms without prior proof',()=>{
 function run(fast){const f=fixture();if(!fast)f.clock.reset();const gate=new ctx.window.OTTSubPlaybackGate();gate.reset('100');gate.observe({video:f.video,adSignal:'present'},6200);
  for(let at=6400;at<=8000;at+=200){const s=f.sample(at,40+(at-6400)/1000);gate.observe(s,at);const chosen=f.clock.observe(s,at);if(chosen&&gate.confirmClock(chosen.source,at,chosen.verification))return at-6400;}}
 assert.equal(run(true),400);assert.equal(run(false),1000);
});
