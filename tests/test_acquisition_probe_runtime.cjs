const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {injectHarness}=require('./helpers/inject-harness.cjs');
function fixture(){
 const h=injectHarness();h.ctx.fixtureTime=1000;h.ctx.Date={now:()=>h.ctx.fixtureTime};
 const replies=[];h.ctx.window.addEventListener('ottsub_local_acquisition_data',e=>replies.push(JSON.parse(e.detail)));
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../tools/local-diagnostics/acquisition-main.js'),'utf8'),h.ctx);
 return {...h,replies,stringify:vm.runInContext('JSON.stringify',h.ctx),parse:vm.runInContext('JSON.parse',h.ctx),
  inspect:()=>h.ctx.window.dispatchEvent(new CustomEvent('ottsub_local_acquisition_request'))};
}
test('local observer records the actual post-hook hydration flag without changing serialization',()=>{
 const h=fixture(),input={url:'/manifest',params:{viewableId:100,profiles:['imsc1.1'],supportsPartialHydration:true}};
 const before=JSON.stringify(input);const body=h.stringify(input);assert.equal(body,before);assert.equal(JSON.stringify(input),before);assert.equal(JSON.parse(body).params.supportsPartialHydration,true);
 h.inspect();const request=h.replies[0].requests[0];
 assert.equal(request.before.settings.find(s=>typeof s.partial==='boolean').partial,true);
 assert.equal(request.after.settings.find(s=>typeof s.partial==='boolean').partial,true);
 assert.equal(request.after.movieId,'100');
});
test('raw, player and merged track readiness are compared without exporting URLs or original IDs',()=>{
 const h=fixture(),secret='PRIVATE_SIGNED_URL_OR_TRACK_ID';
 const track={bcp47:'es-ES',trackId:secret,hydrated:false,label:'PRIVATE_DIALOGUE',downloadables:{}};
 const player={getMovieId:()=>100,getTimedTextTrackList:()=>[track]};
 h.ctx.window.netflix={appContext:{state:{playerApp:{getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['private-session'],getVideoPlayerBySessionId:()=>player}})}}}};
 h.parse(JSON.stringify({movieId:100,partiallyHydrated:true,timedtexttracks:[track]}));
 let tokenCalls=0;const token=h.ctx.window.OTTSubTrackToken;
 h.ctx.window.OTTSubTrackToken=(id)=>{tokenCalls++;return token(id);};
 h.inspect();const data=h.replies[0],serialized=JSON.stringify(data);
 assert.equal(data.raw.partial,true);assert.equal(data.raw.tracks[0].hydrated,false);
 assert.equal(data.player.matchingPlayers,1);assert.equal(data.merged[0].language,'es-es');
 assert.equal(serialized.includes(secret),false);assert.equal(serialized.includes('PRIVATE_DIALOGUE'),false);
 assert.equal(serialized.includes('private-session'),false);assert.equal(tokenCalls,0);
 assert.equal('tokens' in data.raw.tracks[0],false);
});
test('snapshots do not select ambiguous players and inspection rate is bounded',()=>{
 const h=fixture();let reads=0;
 const player={getMovieId:()=>100,getTimedTextTrackList:()=>{reads++;return[];}};
 h.ctx.window.netflix={appContext:{state:{playerApp:{getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['a','b'],getVideoPlayerBySessionId:()=>player}})}}}};
 h.inspect();h.inspect();assert.equal(h.replies.length,1);assert.equal(h.replies[0].player.matchingPlayers,2);assert.equal(reads,0);
 h.ctx.fixtureTime+=201;h.ctx.window.location.pathname='/browse';h.inspect();assert.equal(h.replies.length,1);
});
test('unrelated requests and forged token formats cannot leak into local snapshots',()=>{
 const h=fixture();h.stringify({url:'/account',params:{token:'SECRET'}});
 h.ctx.window.OTTSubTrackToken=()=> 'https://private.example/secret';
 h.parse(JSON.stringify({movieId:100,timedtexttracks:[{bcp47:'ar',trackId:'SECRET'}]}));
 h.inspect();assert.equal(h.replies[0].requests.length,0);
 assert.equal('tokens' in h.replies[0].raw.tracks[0],false);
 assert.equal(JSON.stringify(h.replies[0]).includes('private.example'),false);
});

test('local report sees the alternate player app path without invoking setters',()=>{
 const h=fixture();let setters=0;
 const player={getMovieId:()=>100,getTimedTextTrackList:()=>[{bcp47:'es-ES',hydrated:false}],setTimedTextTrack:()=>setters++};
 h.ctx.window.netflix={appContext:{state:{playerApp:{getAPI:()=>{throw Error('unavailable');}}},getPlayerApp:()=>({getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['s'],getVideoPlayerBySessionId:()=>player}})})}};
 h.inspect();assert.equal(h.replies[0].player.matchingPlayers,1);
 assert.equal(h.replies[0].player.tracks[0].language,'es-es');assert.equal(setters,0);
});

test('both observed track-list getters are compared independently without leaking values or calling setters',()=>{
 const h=fixture();let setters=0;
 const player={getMovieId:()=>100,getTimedTextTrackList:()=>{throw Error('legacy failure');},
  getTextTrackList:()=>[{bcp47:'es-ES',trackId:'PRIVATE_ID',downloadables:{imsc:{downloadUrls:{a:'PRIVATE_URL'}}}}],
  setTextTrack:()=>setters++,setTimedTextTrack:()=>setters++};
 h.ctx.window.netflix={appContext:{getPlayerApp:()=>({getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['s'],getVideoPlayerBySessionId:()=>player}})})}};
 h.inspect();const p=h.replies[0].player;assert.equal(p.legacyStatus,'failed');assert.equal(p.modern.status,'array');
 assert.equal(p.modern.tracks[0].language,'es-es');assert.equal(p.modern.tracks[0].urls,1);
 assert.equal(JSON.stringify(h.replies).includes('PRIVATE'),false);assert.equal(setters,0);
});

test('asynchronous modern lists are reported without exposing their payload or unhandled rejection',async()=>{
 const h=fixture(),player={getMovieId:()=>100,getTextTrackList:()=>Promise.reject(Error('private'))};
 h.ctx.window.netflix={appContext:{getPlayerApp:()=>({getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['s'],getVideoPlayerBySessionId:()=>player}})})}};
 h.inspect();assert.equal(h.replies[0].player.modern.status,'async');assert.equal(h.replies[0].player.legacyStatus,'unavailable');
 await new Promise(resolve=>setImmediate(resolve));
});
