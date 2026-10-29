// Full pre-ad/ad/post-ad numeric replay. Caption identities are synthetic.
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict'), crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..');
function replay(folder,baseline=false) {
  const file={'2026-10-10':'first.json','2026-10-10-handoff':'second.json'}[folder];
  if(!file)throw Error(`Unknown replay fixture: ${folder}`);
  const bytes=fs.readFileSync(path.join(__dirname,file));
  const data=JSON.parse(bytes),rows=data.rows,ctx={window:{}};
  const source=fs.readFileSync(path.join(baseline?path.join(__dirname,'before'):root,'src/video/playback-clock.js'),'utf8');
  vm.runInNewContext(source,ctx);
  vm.runInNewContext(fs.readFileSync(path.join(root,'src/video/playback-gate.js'),'utf8'),ctx);
  const clock=new ctx.window.OTTSubPlaybackClock(),gate=new ctx.window.OTTSubPlaybackGate(),video={};
  const ad=rows.find(r=>r.type==='gate'&&r.state==='AD');
  const dom=rows.find(r=>r.type==='gate'&&r.at>=ad.at&&r.domAd==='present');
  const end=rows.find(r=>r.type==='gate'&&r.at>dom.at&&r.domAd==='absent');
  const clocks=rows.filter(r=>r.type==='clock'&&r.at>=25000);
  assert(clocks.every(r=>r.matchCount<=1 && r.nativeVerification==='ready'));
  const track=clocks.find(r=>r.matchTrack).matchTrack;
  clock.setTracks([{key:track,cues:[...new Set(clocks.filter(r=>r.matchCount===1).map(r=>r.cueBegin))].map(begin=>({begin,end:begin+1,text:`cue:${begin}`}))}]);
  gate.reset(data.movieId);
  let bridge,g,lastNormal,first=null,wasActive=false,dropouts=0,retainedAtEntry=null,preProof=null,proofLostAt=null,checked=0;
  const errors=[];
  for(const r of rows) {
    if(r.type==='bridge'&&r.accepted&&r.observation)bridge=r;
    if(r.type==='gate')g=r;
    if(r.at<25000||!bridge||!g)continue;
    const suspended=g.ad!=='absent'||g.pauseAd;
    if(!(r.type==='clock'||r.type==='gate'&&suspended))continue;
    const sample={video,mediaTime:r.media,rate:r.rate||lastNormal?.rate||1,readyState:4,
      paused:r.reason==='paused',seeking:r.reason==='seeking',hidden:g.hidden,pauseAd:g.pauseAd,
      adSignal:g.ad,sessionAdReason:g.sessionAdReason,nativeTrack:bridge.observation.track,
      nativeVerification:r.nativeVerification,nativeText:r.matchCount===1?`cue:${r.cueBegin}`:'',
      player:{raw:bridge.raw,videoTime:bridge.pairedVideo,at:bridge.at,session:bridge.observation.session},
      session:{...bridge.observation,video,at:bridge.at}};
    gate.observe(sample,r.at);
    if(suspended) {
      if(r.at===ad.at)preProof=clock.sessionProof?{ready:clock.sessionProof.ready,bias:clock.sessionProof.bias,updates:clock.sessionProof.values.size}:null;
      if(baseline)clock.reset();else clock.suspendForAd(sample,r.at);
      if(r.at===ad.at)retainedAtEntry=!!clock.adProof;
      if(retainedAtEntry&&!clock.adProof&&!proofLostAt)proofLostAt=r.at;
      assert(!clock.selected);assert(gate.status(r.at).displaySuppressed);
      continue;
    }
    lastNormal=sample;checked++;
    const verified=gate.clockVerified,selected=clock.observe({...sample,allowCalibration:gate.requiresClock},r.at);
    if(verified&&!selected)gate.invalidateClock();
    if(selected&&gate.requiresClock&&gate.stableAbsence(r.at))gate.confirmClock(selected.source,r.at);
    const active=!gate.status(r.at).displaySuppressed;
    if(r.at>end.at) {
      if(active&&!first)first={at:r.at,delayMs:Math.round((r.at-end.at)*10)/10,source:selected?.source,offset:selected?.offset};
      if(first&&wasActive&&!active)dropouts++;wasActive=active;
      if(first&&r.reason==='candidate-timing-check'&&selected)errors.push(Math.round((clock.baseTime(r.media,r.at)-r.cueBegin)*1000));
    }
  }
  return {folder,baseline,sourceSHA256:crypto.createHash('sha256').update(source).digest('hex'),captureSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),checked,preProof,retainedAtEntry,proofLostAt,first,dropouts,onsetErrorsMs:errors};
}
if(require.main===module){
 const results=['2026-10-10','2026-10-10-handoff'].flatMap(f=>[replay(f,true),replay(f)]);
 fs.writeFileSync(path.join(__dirname,'replay-results.json'),JSON.stringify({scope:'Numeric replay starting at 25s, after initial seeks. Real ad signals/session/track identity; unique cue text synthesized. Missing readyState/paused fields assumed playable except recorded reasons. Not Netflix rendering/network playback.',results},null,2)+'\n');
 console.log(JSON.stringify(results,null,2));
}
module.exports={replay};
