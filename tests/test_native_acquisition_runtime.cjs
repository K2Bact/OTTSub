const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {injectHarness}=require('./helpers/inject-harness.cjs');
// Execute the two methods from the exact public player revision observed in HAR.
const file=path.join(__dirname,'fixtures/netflix-player-reference.js');
const bytes=fs.readFileSync(file);
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'cad1459c7d509d9a152734510732e75a8c721a858bf03b204b952305d85a25df');
const reference=bytes.toString();
const extract=(start,end)=>{const a=reference.indexOf(start),b=reference.indexOf(end,a);assert(a>=0&&b>a);return reference.slice(a,b);};
const native=new Function('K',`return ({${extract('hydrateRequiredTracks(e,t,n){','getAdManager(){')},${extract('processNewManifest(e,t=this.currentSegment,n=!1){','forceSegmentTransition(')}});`)({tracksHydrated:'tracks-hydrated'});
const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('the observed public API getters share one list and omit original download metadata',()=>{
 assert(reference.includes('this.getTimedTextTrackList=()=>this.getInternalPlayer().getTextTrackList()'));
 const method=extract('getTrackPublicInterface(e){','isPlayerAudioTrack(e){');
 const api=new Function(`return ({${method}});`)();api.isPlayerAudioTrack=()=>false;api.isPlayerTextTrack=()=>true;
 const raw={trackId:'spain',bcp47:'es-ES',displayName:'Spanish',hydrated:true,downloadables:{private:'PRIVATE_URL'},isNone:()=>false,isForced:()=>false};
 const publicTrack=api.getTrackPublicInterface(raw);assert.equal(publicTrack.bcp47,'es-ES');
 assert.equal('downloadables' in publicTrack,false);assert.equal('hydrated' in publicTrack,false);
 assert.strictEqual(api.getTrackPublicInterface(raw),publicTrack);
});
function fixture(){
 const h=injectHarness(),observations=[],sent=[],stored=[],events=[];let setterCalls=0;
 const audio={trackId:'audio',hydrated:true},video={trackId:'video',hydrated:true};
 const target={trackId:'spain',bcp47:'es-ES',hydrated:false};
 const selected={trackId:'korean',bcp47:'ko',hydrated:true};
 const publicTarget={trackId:'spain',bcp47:'es-ES'},publicSelected={trackId:'korean',bcp47:'ko'};
 const result=()=>({movieId:100,partiallyHydrated:true,timedtexttracks:[
  {trackId:'korean',bcp47:'ko',hydrated:true,ttDownloadables:{'imsc1.1':{downloadUrls:{a:'https://cdn.nflxvideo.net/ko'}}}},
  {trackId:'spain',bcp47:'es-ES',hydrated:target.hydrated,ttDownloadables:target.hydrated?{'imsc1.1':{downloadUrls:{a:'https://cdn.nflxvideo.net/es-ES'}}}:{}}
 ]});
 const noSetter=()=>{setterCalls++;throw Error('must never select tracks');};
 const segment={movieId:100,playbackContextId:'PRIVATE_CONTEXT',playbackParams:{},manifest:{manifestResult:result()},parsedManifest:{},livePlaybackManager:{isLive:false},
  tracks:{audioTrack:audio,videoTrack:video,timedTextTrack:selected,getCompatibleTrackSet:()=>({audioTrack:audio,videoTrack:video,timedTextTrack:target}),setVideoTrack:noSetter,setAudioTrack:noSetter,setTextTrack:noSetter,setTracks:noSetter},
  audioTrackList:[audio],timedTextTrackList:[selected,target],videoTrackList:[video]};
 let response=()=>Promise.resolve({manifestResult:result()});
 const playback={currentSegment:segment,hydrateRequiredTracks:native.hydrateRequiredTracks,processNewManifest:native.processNewManifest,
  sendManifestRequest:(owner,requirements,flag)=>{sent.push({owner,requirements,flag});return response();},
  manifestParserFactory:{create:()=>({hydrateManifest:(old,parsed,incoming)=>{target.hydrated=true;incoming.manifestResult=result();return{manifest:incoming,parsedManifest:parsed};}})},
  manifestFetcher:{storeManifest:(...args)=>stored.push(args)},findSession:()=>null,fireEvent:e=>events.push(e)};
 const internal={playback,findPlayerTextTrack:p=>p===publicTarget?target:undefined};
 const player={getMovieId:()=>100,getTimedTextTrackList:()=>[publicSelected,publicTarget],getInternalPlayer:()=>internal,setTextTrack:noSetter,setTimedTextTrack:noSetter};
 const api={getAllPlayerSessionIds:()=>['s'],getVideoPlayerBySessionId:()=>player};
 h.ctx.window.netflix={appContext:{getPlayerApp:()=>({getAPI:()=>({videoPlayer:api})})}};
 h.ctx.window.addEventListener('ottsub_track_acquisition',e=>observations.push(e.detail));
 h.parse(JSON.stringify(segment.manifest.manifestResult));
 return{...h,segment,playback,internal,player,api,target,audio,video,selected,result,sent,stored,events,observations,
  setterCalls:()=>setterCalls,respond:fn=>{response=fn;},
  request:(lang='es-es',mid='100')=>h.ctx.window.dispatchEvent(new CustomEvent('ottsub_request_load_track',{detail:{lang,movieId:mid}}))};
}

test('native preparation hydrates the exact selected secondary while leaving native audio/video/text selection intact',async()=>{
 const h=fixture();h.request();await settle();
 assert.equal(h.sent.length,1);assert.strictEqual(h.sent[0].owner,h.segment);assert.equal(h.sent[0].flag,false);
 assert.deepEqual(h.sent[0].requirements,{originalPlaybackContextId:'PRIVATE_CONTEXT',requiredAudioTrackId:'audio',requiredTextTrackId:'spain',requiredVideoTrackId:'video'});
 assert.strictEqual(h.segment.tracks.audioTrack,h.audio);assert.strictEqual(h.segment.tracks.videoTrack,h.video);assert.strictEqual(h.segment.tracks.timedTextTrack,h.selected);
 assert.equal(h.setterCalls(),0);assert.deepEqual(h.events,['tracks-hydrated']);assert.equal(h.stored.length,1);
 assert.deepEqual([...h.ctx.window.OTTSubTrackLanguages.urls(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'],'es-es')],['https://cdn.nflxvideo.net/es-ES']);
 assert.deepEqual(h.observations.map(x=>x.status),['preparing','ready']);assert.equal(JSON.stringify(h.observations).includes('PRIVATE'),false);
});

test('already prepared internal metadata is read without a new request',async()=>{
 const h=fixture();h.target.hydrated=true;h.segment.manifest.manifestResult=h.result();h.request();await settle();
 assert.equal(h.sent.length,0);assert.equal(h.observations.at(-1).status,'metadata-ready');assert.equal(h.setterCalls(),0);
});

test('repeated discovery never overlaps preparation or repeats a failed track request',async()=>{
 const h=fixture();let reject;h.respond(()=>new Promise((_,r)=>{reject=r;}));
 for(let i=0;i<5;i++)h.request();assert.equal(h.sent.length,1);reject(Error('PRIVATE_FAILURE'));await settle();
 h.request();await settle();assert.equal(h.sent.length,1);assert.equal(h.observations.at(-1).status,'failed');assert.equal(h.setterCalls(),0);
});

test('different region, forced tracks, stale movie, ambiguous player and incompatible audio/video are never prepared',async()=>{
 for(const mode of ['region','forced','movie','ambiguous','audio','video','identity','busy-native','missing-method','ad','branching','live']){
  const h=fixture();
  if(mode==='region')h.target.bcp47='es-419';
  if(mode==='forced')h.player.getTimedTextTrackList=()=>[{trackId:'spain',bcp47:'es-ES',isForcedNarrative:true}];
  if(mode==='movie')h.segment.movieId=200;
  if(mode==='ambiguous')h.api.getAllPlayerSessionIds=()=>['s','duplicate'];
  if(mode==='audio')h.segment.tracks.getCompatibleTrackSet=()=>({audioTrack:{...h.audio},videoTrack:h.video,timedTextTrack:h.target});
  if(mode==='video')h.video.hydrated=false;
  if(mode==='identity')h.target.trackId='other';
  if(mode==='busy-native')h.internal.pendingTrackHydration={};
  if(mode==='missing-method')h.playback.hydrateRequiredTracks=undefined;
  if(mode==='ad')h.segment.manifest.manifestResult.isAd=true;
  if(mode==='branching')h.segment.playbackParams.isBranching=true;
  if(mode==='live')h.segment.livePlaybackManager.isLive=true;
  h.request();await settle();assert.equal(h.sent.length,0,mode);assert.equal(h.setterCalls(),0,mode);
 }
});

test('a preparation result from an old route or replaced segment is not published as current metadata',async()=>{
 for(const mode of ['route','segment']){
  const h=fixture();let resolve;h.respond(()=>new Promise(r=>{resolve=r;}));h.request();
  if(mode==='route')h.ctx.window.location.pathname='/watch/200';else h.playback.currentSegment={movieId:100};
  resolve({manifestResult:h.result()});await settle();
  assert.deepEqual([...h.ctx.window.OTTSubTrackLanguages.urls(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'],'es-es')],[],mode);
  assert.equal(h.observations.some(x=>x.status==='ready'),false);assert.equal(h.setterCalls(),0);
 }
});
