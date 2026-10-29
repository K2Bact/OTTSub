const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..');
const file=path.join(__dirname,'timeline.json');
function replay(baseline=false){
 const bytes=fs.readFileSync(file),data=JSON.parse(bytes),rows=data.rows,ctx={window:{}};
 const source=fs.readFileSync(path.join(baseline?path.join(__dirname,'before'):root,'src/video/playback-clock.js'),'utf8');
 vm.runInNewContext(source,ctx);vm.runInNewContext(fs.readFileSync(path.join(root,'src/video/playback-gate.js'),'utf8'),ctx);
 const clock=new ctx.window.OTTSubPlaybackClock(),gate=new ctx.window.OTTSubPlaybackGate(),video={};gate.reset(data.movieId);
 const cs=rows.filter(r=>r.type==='clock'&&r.at>=509635.6);
 const tracks=[{key:'native:t2',cues:[...new Set(cs.filter(r=>r.matchCount===1).map(r=>r.cueBegin))].map(begin=>({begin,end:begin+1,text:`cue:${begin}`}))}];
 let bridge,g,firsts=[],inAd=false,awaiting=false,checked=0,differences=[],proofs=[],onsets=[],firstSample=[],relapses=[],seenContent=false;
 for(const r of rows){
  if(r.type==='bridge'&&r.accepted&&r.observation)bridge=r;
  if(r.type==='gate')g=r;
  if(r.at<509635.6||!bridge||!g)continue;
  const suspended=g.ad!=='absent'||g.pauseAd;
  if(!(r.type==='clock'||r.type==='gate'&&suspended))continue;
  const sample={video,mediaTime:r.media,rate:r.rate||1,readyState:4,paused:r.reason==='paused',seeking:r.reason==='seeking',
   hidden:g.hidden,pauseAd:g.pauseAd,adSignal:g.ad,sessionAdReason:g.sessionAdReason,
   nativeTrack:bridge.observation.track,nativeVerification:r.nativeVerification,nativeText:r.matchCount===1?`cue:${r.cueBegin}`:'',
   player:{raw:bridge.raw,videoTime:bridge.pairedVideo,at:bridge.at,session:bridge.observation.session},
   session:{...bridge.observation,video,at:bridge.at}};
  gate.observe(sample,r.at);
  if(suspended){
   if(g.state==='AD'&&!inAd){proofs.push({at:r.at,proof:clock.sessionProof?{ready:clock.sessionProof.ready,values:[...clock.sessionProof.values.values()]}:null});inAd=true;awaiting=true;}
   clock.suspendForAd(sample,r.at);continue;
  }
  inAd=false;clock.setTracks(r.nativeVerification==='ready'?tracks:[]);
  const verified=gate.clockVerified;
  const selected=clock.observe({...sample,allowCalibration:gate.requiresClock},r.at);
  if(verified&&!selected)gate.invalidateClock();
  if(selected&&gate.requiresClock&&gate.stableAbsence(r.at))gate.confirmClock(selected.source,r.at);
  if(r.reason==='first-sample'||r.reason==='candidate-timing-check'){
   const x={at:r.at,reason:r.reason,cueBegin:r.cueBegin,selected:selected?.source||null,verification:selected?.verification||null,
    outputErrorMs:selected&&r.cueBegin!==null?Math.round((clock.baseTime(r.media,r.at)-r.cueBegin)*1000):null,
    session:clock.candidates(sample,r.at).filter(c=>c.source==='session').map(c=>({key:c.key,time:c.time,delta:r.cueBegin===null?null:c.time-r.cueBegin}))};
   if(r.reason==='first-sample')firstSample.push(x);else onsets.push(x);
  }
  const actual=selected?{source:selected.source,unit:selected.unit||1,track:selected.track,offset:selected.offset==null?null:Math.round(selected.offset*1000)/1000}:null;
  if(JSON.stringify(actual)!==JSON.stringify(r.selected))differences.push({at:r.at,recorded:r.selected,actual});
  if(!gate.status(r.at).displaySuppressed){if(awaiting){firsts.push({at:r.at,selected:actual});awaiting=false;}seenContent=true;}
  else if(seenContent&&verified&&!selected)relapses.push(r.at);
  checked++;
 }
 return {baseline,sourceSHA256:crypto.createHash('sha256').update(source).digest('hex'),captureSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),checked,firsts,proofs,firstSample,onsets,differences,relapses};
}
if(require.main===module){const results=[replay(true),replay()];fs.writeFileSync(path.join(__dirname,'replay-results.json'),JSON.stringify({scope:'Numeric replay of new movie only. Unique cue texts synthesized; readyState playable except logged reasons. No real DOM/network or audio replay.',results},null,2)+'\n');console.log(JSON.stringify(results.map(({differences,onsets,...r})=>({...r,differenceCount:differences.length,firstOnsets:onsets.slice(0,3)})),null,2));}
module.exports={replay};
