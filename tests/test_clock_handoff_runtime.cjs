const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ctx = {window:{}};
for (const name of ['playback-clock','playback-gate']) {
  const root=name==='playback-clock'&&process.env.OTTSub_TEST_SOURCE ? process.env.OTTSub_TEST_SOURCE : path.join(__dirname,'../src');
  vm.runInNewContext(fs.readFileSync(path.join(root, `video/${name}.js`),'utf8'),ctx);
}
const capture = require('./fixtures/session-clock-handoff-20261010.json');

test('real .9 capture: session recovery hands over without the second seven-second suppression', () => {
  const clock=new ctx.window.OTTSubPlaybackClock(), gate=new ctx.window.OTTSubPlaybackGate(), video={};
  const begins=[...new Set(capture.samples.map(r=>r[2]).filter(r=>r!==null))];
  clock.setTracks([{key:'native:t37',cues:begins.map(begin=>({begin,end:begin+1,text:`cue:${begin}`}))}]);
  gate.reset('100'); gate.observe({video,adSignal:'present'},68400);
  let first=null, handoff=null, checked=0;
  for(const [at,media,cue,mode,bridgeAt,raw,pairedVideo,sessionRaw] of capture.samples) {
    const sample={video,mediaTime:media,rate:1,readyState:4,paused:mode==='paused',seeking:mode==='seeking',
      adSignal:'absent',nativeText:cue===null?'':`cue:${cue}`,
      player:{at:bridgeAt,raw,videoTime:pairedVideo,session:'s2'},
      session:{status:'ok',video,at:bridgeAt,session:'s2',playback:{raw:sessionRaw,adValue:'undefined'},open:{status:'ok',raw:sessionRaw,adState:'other'}}};
    gate.observe(sample,at);
    const wasVerified=gate.clockVerified;
    const selected=clock.observe({...sample,allowCalibration:gate.requiresClock},at);
    if(wasVerified&&!selected)gate.invalidateClock();
    if(selected&&gate.requiresClock&&gate.stableAbsence(at))gate.confirmClock(selected.source,at);
    if(!first&&selected){first={at,source:selected.source};}
    if(!handoff&&selected?.key==='video-calibrated'){handoff={at,offset:selected.offset};}
    if(first) {
      assert(selected,`clock lost at ${at}`);
      assert.equal(gate.status(at).displaySuppressed,false,`gate suppressed at ${at}`);
      assert(Number.isFinite(clock.baseTime(media,at)));
    }
    assert((clock.calibration?.values.size||0)<=3);
    checked++;
  }
  assert.equal(checked,534);assert.deepEqual(first,{at:93858.1,source:'session'});
  assert.equal(handoff.at,96567);assert(Math.abs(handoff.offset-17.033)<0.001);
  gate.observe({video,adSignal:'present'},192700);clock.reset();
  assert.equal(gate.status(192700).displaySuppressed,true);assert.equal(clock.selected,null);
});

function fixture() {
  const clock=new ctx.window.OTTSubPlaybackClock(), video={};
  const cues=[10,11,12,13,14].map((begin,i)=>({begin,end:begin+.5,text:`line${i}`}));
  clock.setTracks([{key:'native:t1',cues}]);
  const feed=(now,text='',extra={})=>{
    const time=9.8+now/1000;
    return clock.observe({video,mediaTime:time+17,rate:1,readyState:4,paused:false,nativeText:text,
      allowCalibration:!clock.selected,
      session:{status:'ok',video,at:now,session:'s1',playback:{raw:time*1000},open:{status:'ok',raw:time*1000,adState:'other'}},...extra},now);
  };
  const two=()=>{for(let n=0;n<=1200;n+=200)feed(n,n===200?'line0':n===1200?'line1':'');assert.equal(clock.selected.source,'session');};
  const third=(extra={})=>{for(let n=1400;n<=2200;n+=200)feed(n,n===2200?'line2':'',extra);return clock.selected;};
  return {clock,video,cues,feed,two,third};
}
test('two onsets are insufficient for video handoff; third independent onset completes it',()=>{
  const f=fixture();f.two();assert.equal(f.clock.calibration.values.size,2);
  const selected=f.third();assert.equal(selected.key,'video-calibrated');assert.equal(selected.offset,17);
});
test('no recovery permission means no opportunistic calibration of normal playback',()=>{
  const f=fixture();for(let n=0;n<=2200;n+=200)f.feed(n,n===200?'line0':n===1200?'line1':n===2200?'line2':'',{allowCalibration:false});
  assert.equal(f.clock.selected.source,'session');assert.equal(f.clock.calibration,null);
});
test('repeated or ambiguous onsets do not supply the third independent proof',()=>{
  for(const kind of ['repeat','ambiguous']) {
    const f=fixture();
    if(kind==='ambiguous')f.clock.setTracks([{key:'native:t1',cues:[...f.cues,{begin:50,end:51,text:'line2'}]}]);
    f.two();for(let n=1400;n<=2200;n+=200)f.feed(n,n===2200?(kind==='repeat'?'line1':'line2'):'');
    assert.equal(f.clock.selected.source,'session');assert.equal(f.clock.calibration.values.size,kind==='repeat'?1:2);
  }
});
test('drifting video offset cannot take over from a verified session',()=>{
  const f=fixture();f.two();
  for(let n=1400;n<=2200;n+=200)f.feed(n,n===2200?'line2':'',{mediaTime:9.8+n/1000+17+(n-1200)/2000});
  assert.equal(f.clock.selected.source,'session');assert.equal(f.clock.calibration.values.size,1);
});
test('seek, video/rate/track/session changes, buffering, gaps and new ads discard pending handoff proof',()=>{
  for(const kind of ['seek','video','rate','track','session','buffer','gap','ad']) {
    const f=fixture();f.two();let extra={},now=1400;
    if(kind==='seek')extra.seeking=true;
    if(kind==='video')extra.video={};
    if(kind==='rate')extra.rate=2;
    if(kind==='buffer')extra.readyState=1;
    if(kind==='track')f.clock.setTracks([{key:'native:t2',cues:f.cues}]);
    if(kind==='session')extra.session={status:'ok',video:f.video,at:1400,session:'new',playback:{raw:11200},open:{status:'ok',raw:11200,adState:'other'}};
    if(kind==='gap')now=2400;
    if(kind==='ad')f.clock.reset(); // content.js resets on every positive/unknown ad sample.
    f.feed(now,'',extra);
    assert.equal(f.clock.selected,null,kind);assert.equal(f.clock.calibration,null,kind);
    assert.equal(f.clock.calibrationAllowed,false,kind);
  }
});
test('after handoff, wrong-timeline onsets still revoke verification and a seek discards the offset',()=>{
  const f=fixture();f.two();f.third();
  f.feed(2400);f.feed(2600,'line0');f.feed(2800);f.feed(3000,'line1');assert.equal(f.clock.selected,null);
  const g=fixture();g.two();g.third();g.feed(2400,'',{seeking:true});assert.equal(g.clock.selected,null);assert.equal(g.clock.calibration,null);
});
