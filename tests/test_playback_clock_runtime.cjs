const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ctx = { window: {} };
for (const file of ['video/playback-clock.js','video/playback-gate.js','sync-engine.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), ctx);
const cues = [{ begin: 10, end: 10.5, text: 'First phrase' }, { begin: 11, end: 11.5, text: 'Second phrase' }];
function sessionFixture(unit = 1000) {
  const clock = new ctx.window.OTTSubPlaybackClock(), video = {};
  clock.setTracks([{key:'native:t1', cues}]);
  const sample = (now, raw, text = '', extra = {}) => clock.observe({ video,
    mediaTime: now / 1000, rate: 1, paused: false, readyState: 4, nativeText: text,
    session: { status: 'ok', session: 's1', video, at: now,
      playback: { raw: raw * unit, adValue: 'undefined' }, open: { status: 'ok', raw: raw * unit, adState: 'other' } }, ...extra }, now);
  const verify = () => {
    sample(0, 9.8); sample(200, 9.8, 'First phrase');
    for (const now of [400, 600, 800, 1000]) sample(now, 9.8);
    return sample(1200, 11, 'Second phrase');
  };
  return { clock, video, sample, verify };
}
for (const unit of [1, 1000]) test(`session unit ${unit}: repeated snapshots interpolate without restarting while video has reset`, () => {
  const f = sessionFixture(unit), selected = f.verify();
  assert.equal(selected.source, 'session'); assert.equal(selected.unit, unit);
  assert(Math.abs(f.clock.baseTime(1.3,1300)-11.1)<1e-9);
  f.sample(1400,11);assert(Math.abs(f.clock.baseTime(1.5,1500)-11.3)<1e-9);
});
test('frozen session expires even when bridge replies keep arriving', () => {
  const f = sessionFixture(); f.verify();
  for (const now of [1400,1600,1800,2000,2200,2400,2600,2800,3000]) f.sample(now,11);
  assert(Math.abs(f.clock.baseTime(3.19,3190)-12.99)<1e-9);
  assert.equal(f.clock.baseTime(3.2,3200),null);assert.equal(f.sample(3200,11),null);
  f.sample(3400,11);
  assert.equal(f.clock.candidates({video:f.video,mediaTime:3.4},3400).filter(c=>c.source==='session').length,0);
});
test('session interpolation freezes while paused and excludes paused wall time', () => {
  const f=sessionFixture(); f.verify(); f.sample(1400,11,'',{paused:true});
  assert(Math.abs(f.clock.baseTime(1.4,1500)-11.2)<1e-9);
  f.sample(1600,11,'',{paused:true}); f.sample(1800,11,'',{paused:false});
  assert(Math.abs(f.clock.baseTime(1.4,1900)-11.3)<1e-9);
});
test('missing/stale/ad/conflicting session, seeking and exact track changes revoke verification', () => {
  for (const kind of ['missing','stale','ad','disagree','seek','native']) {
    const f=sessionFixture();f.verify();
    const session={status:'ok',session:'s1',video:f.video,at:1400,
      playback:{raw:11200,adValue:'undefined'},open:{status:'ok',raw:11200,adState:'other'}};
    if(kind==='stale')session.at=0;if(kind==='ad')session.playback.adValue='object';
    if(kind==='disagree')session.open.raw=32000;
    if(kind==='native')f.clock.setTracks([{key:'native:t2',cues}]);
    assert.equal(f.sample(1400,11.2,'',{session:kind==='missing'?null:session,seeking:kind==='seek'}),null,kind);
  }
});
function fixture(tracks = [{ key: 'primary', cues }]) {
  const clock = new ctx.window.OTTSubPlaybackClock(), video = {};
  clock.setTracks(tracks);
  const sample = (now, text, { shift = 0, unit = null, session = 's1', ...extra } = {}) => {
    const time = 9.8 + now / 1000;
    return clock.observe({ video, mediaTime: time + shift, nativeText: text, rate: 1, readyState: 4, paused: false,
      player: unit ? { session, raw: time * unit, videoTime: time + shift, at: now } : null, ...extra }, now);
  };
  const verify = (options = {}) => {
    sample(0, '', options); sample(200, 'First phrase', options);
    for (const now of [400,600,800,1000]) sample(now, '', options);
    return sample(1200, 'Second phrase', options);
  };
  return { clock, sample, verify, video };
}
test('AD07/12: two unique onset transitions verify video; offsets are not input', () => {
  const f = fixture(); assert.equal(f.verify().source, 'video');
  assert.equal(f.clock.baseTime(13, 1500), 13);
});
for (const unit of [1,1000]) test(`AD08/09: verify player unit ${unit}, project using paired video delta`, () => {
  const f = fixture(); const result = f.verify({ shift: 30, unit });
  assert.equal(result.source, 'player'); assert.equal(result.unit, unit);
  assert.equal(f.clock.baseTime(41.4, 1600), 11.399999999999999);
  assert.equal(f.clock.baseTime(42, 2200), null);
});
test('V is preferred when both clocks independently match the same onsets', () => {
  assert.equal(fixture().verify({ unit: 1000 }).source, 'video');
});

test('observed post-ad deltas calibrate only after three unique onsets; seek resets the offset', () => {
  // Numeric measurements from local-2026-10-07T10-06-04-593Z; no dialogue retained.
  const observations = [
    [327400.1, 2234.858, 2266.905], [332206.8, 2239.654, 2271.711], [343504.3, 2250.957, 2283.009]
  ];
  const clock = new ctx.window.OTTSubPlaybackClock(), video = {};
  clock.setTracks([{key:'primary',cues:observations.map((r,i)=>({begin:r[1],end:r[1]+1,text:`cue-${i}`}))}]);
  let now = observations[0][0] - 200;
  const feed = (at, media, text='', extra={}) => clock.observe({ video, mediaTime:media, nativeText:text,
    rate:1,readyState:4,paused:false,allowCalibration:true,...extra },at);
  for (let i=0;i<observations.length;i++) {
    const [at,begin,media] = observations[i];
    for (;now<at;now+=200) feed(now,media-(at-now)/1000);
    feed(at-50,media-0.05); const selected=feed(at,media,`cue-${i}`);
    if(i<2) assert.equal(selected,null);
    else { assert.equal(selected.key,'video-calibrated');assert(Math.abs(selected.offset-32.052)<0.001);assert(Math.abs(clock.baseTime(media,at)-begin)<0.01); }
    now=at+200;
  }
  const [at,,media]=observations.at(-1);
  feed(at+100,media+0.1,'',{seeking:true});assert.equal(clock.selected,null);assert.equal(clock.calibration,null);
});

test('calibration rejects drifting offsets, repeated cues and normal playback without permission', () => {
  for (const mode of ['drift','repeat','disabled']) {
    const f=fixture([{key:'primary',cues:[...cues,{begin:12,end:12.8,text:'Third phrase'}]}]);
    for(let now=0;now<=2200;now+=200) {
      const text=now===200?'First phrase':now===1200?(mode==='repeat'?'First phrase':'Second phrase'):now===2200?'Third phrase':'';
      f.sample(now,text,{shift:mode==='drift'?32+now/5000:32,allowCalibration:mode!=='disabled'});
    }
    assert.equal(f.clock.selected,null,mode);
  }
});
test('AD11: repeated phrases are ambiguous across different cue times or tracks', () => {
  for (const tracks of [[{ key:'p', cues: [...cues, { begin:30,end:31,text:'First phrase' }] }], [{ key:'p',cues }, { key:'s',cues }]]) {
    assert.equal(fixture(tracks).verify(), null);
  }
});
test('AD12: first already-visible cue and repeated observations do not count as two onsets', () => {
  const f = fixture(); f.sample(0,'First phrase'); f.sample(200,'First phrase');
  for (const now of [400,600,800,1000]) f.sample(now,'');
  assert.equal(f.sample(1200,'Second phrase'), null);
});
test('AD11: no native text, unrelated language and malformed player values do not verify', () => {
  const f = fixture(); for (let now=0;now<3000;now+=200) assert.equal(f.sample(now,now%400?'OTHER LANGUAGE':'', { shift:30, player:{raw:NaN,videoTime:40,at:now,session:'s1'} }),null);
});
test('AD14: seek, rate change, video replacement and buffering discard evidence', () => {
  for (const change of [{seeking:true},{rate:2},{video:{}},{readyState:1}]) {
    const f=fixture(); f.verify(); f.sample(1400,'',change);
    assert.equal(f.clock.selected,null);
  }
});
test('AD09/20: missing/stale player or changed session cannot keep a verified player clock', () => {
  for (const change of [{unit:null},{unit:1000,session:'s2'},{player:{raw:11000,videoTime:41,at:0,session:'s1'}}]) {
    const f=fixture(); f.verify({shift:30,unit:1000}); f.sample(1400,'',{shift:30,...change});
    assert.equal(f.clock.selected,null);
  }
});
test('player session evidence cannot survive a missing-sample interval', () => {
  const f=fixture(); f.sample(0,'',{shift:30,unit:1000}); f.sample(200,'First phrase',{shift:30,unit:1000});
  f.sample(400,'',{shift:30}); for(const now of [600,800,1000]) f.sample(now,'',{shift:30,unit:1000});
  assert.equal(f.sample(1200,'Second phrase',{shift:30,unit:1000}),null);
});
test('AD06/21: valid clock alone does not bypass stable absence; timeout may recover later', () => {
  const gate=new ctx.window.OTTSubPlaybackGate(), video={}; gate.reset('100');
  gate.observe({adSignal:'present',video},0); gate.observe({adSignal:'absent',video},250);
  assert.equal(gate.confirmClock('video',250),false);
  for(let now=500;now<=11000;now+=250) gate.observe({adSignal:'absent',video},now);
  assert.equal(gate.state,'RECOVERY_DELAYED'); assert.equal(gate.confirmClock('player',11000),true);
  assert.equal(gate.status(11000).clockVerified,true);
  gate.observe({adSignal:'present',video},11250); assert.equal(gate.status(11250).displaySuppressed,true);
});
test('AD18: resetCursor preserves all cues and offset, forces lookup before next render', () => {
  const engine=new ctx.window.OTTSubSyncEngineClass(); engine.setCues('100',cues); engine.setOffset(200);
  engine.getActiveCuesFast(11); const original=engine.cues; let searches=0;
  const search=engine._binarySearch.bind(engine); engine._binarySearch=t=>{searches++;return search(t);};
  engine.resetCursor(); const active=engine.getActiveCuesFast(9.8);
  assert.equal(engine.cues,original);assert.equal(engine.offsetMs,200);assert.equal(searches,1);assert.equal(active.bottom[0].text,'First phrase');
});
test('same-time lines can be matched together after whitespace and NFC normalization', () => {
  const f=fixture([{key:'p',cues:[{begin:10,end:10.5,text:'First'},{begin:10,end:10.5,text:'phrase'},cues[1]]}]);
  assert.equal(f.verify().source,'video');
});
test('AD13: onset tolerance and player interpolation follow 0.5/1/1.5/2x media progression', () => {
  for(const rate of [0.5,1,1.5,2]) {
    const clock=new ctx.window.OTTSubPlaybackClock(), video={};
    const first=10, second=10+rate;
    clock.setTracks([{key:'p',cues:[{begin:first,end:first+0.1,text:'A'},{begin:second,end:second+0.1,text:'B'}]}]);
    for(let now=0;now<=1200;now+=200) {
      const time=10+(now-200)/1000*rate;
      clock.observe({video,mediaTime:time+30,rate,paused:false,readyState:4,nativeText:now===200?'A':now===1200?'B':'',
        player:{raw:time*1000,videoTime:time+30,session:'s1',at:now}},now);
    }
    assert.equal(clock.selected?.source,'player');
    assert(Math.abs(clock.baseTime(second+30+0.1*rate,1300)-(second+0.1*rate))<1e-8);
  }
});
test('two distinct unique native onsets contradicting the chosen clock force revalidation', () => {
  const f=fixture();f.verify();f.sample(1400,'');f.sample(1600,'First phrase');f.sample(1800,'');f.sample(2000,'Second phrase');
  assert.equal(f.clock.selected,null);
});

function bridgeFixture() {
  let handler, now=0; const replies=[], calls=[];
  const player={getMovieId:()=>100,getCurrentTime:()=>11000};
  const api={getAllPlayerSessionIds:()=>['SECRET_SESSION'],getVideoPlayerBySessionId:()=>player};
  const context={window:{addEventListener:(name,fn)=>{handler=fn;},dispatchEvent:e=>replies.push(JSON.parse(e.detail)),netflix:{appContext:{state:{playerApp:{getAPI:()=>({videoPlayer:api})}}}}},
    location:{pathname:'/watch/100'},performance:{now:()=>now},document:{querySelectorAll:()=>[{currentTime:41,getAttribute:()=>null,setAttribute:(...args)=>calls.push(args)}]},CustomEvent:class{constructor(name,options){this.detail=options.detail;}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/video/netflix-playback-bridge.js'),'utf8'),context);
  const send=(overrides={},advance=200)=>{now+=advance;handler({detail:JSON.stringify({version:1,requestId:1,movieId:'100',episodeGeneration:3,...overrides})});return replies.at(-1);};
  return {send,replies,player,api,calls};
}
test('AD20: bridge emits bounded numeric samples and aliases, never raw sessions or method dumps',()=>{
  const f=bridgeFixture(); const data=f.send();
  assert.equal(data.status,'ok');assert.equal(data.sessions[0].raw,11000);assert.equal(data.videos[0].time,41);
  assert(!JSON.stringify(data).includes('SECRET'));assert.match(data.sessions[0].id,/^s\d+$/);
});
test('AD20: bridge rejects wrong versions, movies, IDs and throttles flooded requests',()=>{
  const f=bridgeFixture();
  for(const input of [{version:2},{movieId:'200'},{requestId:-1},{episodeGeneration:NaN}])f.send(input);
  assert.equal(f.replies.length,0);f.send();f.send({},0);assert.equal(f.replies.length,1);
  f.api.getAllPlayerSessionIds=()=>Array(9).fill('x');assert.equal(f.send().status,'unavailable');
});
test('AD10: a second matching session remains ambiguous even if its time method fails',()=>{
  const f=bridgeFixture();f.api.getAllPlayerSessionIds=()=>['one','two'];
  f.api.getVideoPlayerBySessionId=id=>id==='one'?f.player:{getMovieId:()=>100,getCurrentTime:()=>{throw Error('unsupported');}};
  const data=f.send();assert.equal(data.status,'unavailable');assert.equal(data.sessions.length,0);
});
