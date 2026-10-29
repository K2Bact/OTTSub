const {test}=require('node:test');
const assert=require('node:assert/strict');
const {harness,settle}=require('./helpers/content-harness.cjs');
const {injectHarness}=require('./helpers/inject-harness.cjs');
const track=(lang,id,kind,urls=true)=>({bcp47:lang,trackId:id,rawTrackType:kind==='cc'?'closedcaptions':'subtitles',ttDownloadables:urls?{webvtt:{downloadUrls:{a:`https://cdn.nflxvideo.net/${id}`}}}:{}});
const payload=(mid=100,missing=false)=>({urls:[`https://cdn.nflxvideo.net/${mid}-normal`],tracksByLang:{en:[`https://cdn.nflxvideo.net/${mid}-normal`,`https://cdn.nflxvideo.net/${mid}-cc`]},availableTracks:[
 {bcp47:'en',id:`${mid}-normal`,isCC:false,urls:missing?[]:[`https://cdn.nflxvideo.net/${mid}-normal`]},
 {bcp47:'en',id:`${mid}-cc`,isCC:true,urls:[`https://cdn.nflxvideo.net/${mid}-cc`]}
]});

test('normal and CC use their own addresses in either manifest order; empty normal never borrows CC',()=>{
 for(const reverse of [false,true]){
  const h=injectHarness(),tracks=[track('en','normal','normal'),track('en','cc','cc')];
  h.parse(JSON.stringify({movieId:100,timedtexttracks:reverse?tracks.reverse():tracks}));
  const m=h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'],p=h.ctx.window.OTTSubTrackLanguages;
  assert.deepEqual([...p.urls(m,'en','normal')],['https://cdn.nflxvideo.net/normal']);
  assert.deepEqual([...p.urls(m,'en','cc')],['https://cdn.nflxvideo.net/cc']);
 }
 const h=injectHarness();h.parse(JSON.stringify({movieId:100,timedtexttracks:[track('en','normal','normal',false),track('en','cc','cc')]}));
 const m=h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'];
 assert.deepEqual([...h.ctx.window.OTTSubTrackLanguages.urls(m,'en','normal')],[]);
 assert.deepEqual([...h.ctx.window.OTTSubTrackLanguages.urls(m,'en','auto')],[]);
 assert.deepEqual([...h.ctx.window.OTTSubTrackLanguages.urls({tracksByLang:{en:['wrong']}},'en','cc')],[]);
});

test('type classification handles raw SDH, assistive and case/spacing in labels',()=>{
 const p=injectHarness().ctx.window.OTTSubTrackLanguages;
 for(const t of [{rawTrackType:'SDH'},{trackType:'assistive'},{label:'English [ CC ]'},{displayName:'English (sdh)'},{isCC:true}]) assert.equal(p.trackKind(t),'cc');
 assert.equal(p.trackKind({rawTrackType:'subtitles',label:'English'}),'normal');
 assert.deepEqual([...p.urls(payload(),'en','invalid')],[]);
});

test('requested regional kind never falls back to another region or the opposite type',()=>{
 const p=injectHarness().ctx.window.OTTSubTrackLanguages;
 const m={availableTracks:[{bcp47:'es-ES',isCC:false,urls:['spain']},{bcp47:'es-419',isCC:true,urls:['latin-cc']}]};
 assert.deepEqual([...p.urls(m,'es-es','cc')],[]);
 assert.deepEqual([...p.urls(m,'es-419','normal')],[]);
});

test('primary and secondary independently load normal and CC; new episode keeps type preferences',async()=>{
 const h=harness({local:{ottsub_primary_lang:'en',ottsub_secondary_lang:'en',ottsub_primary_track_kind:'normal',ottsub_secondary_track_kind:'cc'}});
 await settle();h.emitManifest(100,payload());await settle();
 assert.equal(h.engine.cues[0].text,'https://cdn.nflxvideo.net/100-normal');
 assert.deepEqual(h.requests.map(r=>r.url),['https://cdn.nflxvideo.net/100-normal','https://cdn.nflxvideo.net/100-cc']);
 assert.equal(h.send('getStatus').primaryTrackKind,'normal');assert.equal(h.send('getStatus').secondaryTrackKind,'cc');
 h.navigate(200);h.emitManifest(200,payload(200));await settle();
 assert.equal(h.engine.cues[0].text,'https://cdn.nflxvideo.net/200-normal');
 assert.equal(h.send('getStatus').secondaryCueCount,1);
 assert.deepEqual(h.requests.slice(-2).map(r=>r.url),['https://cdn.nflxvideo.net/200-normal','https://cdn.nflxvideo.net/200-cc']);
});

test('rapid CC/normal changes cancel old replies and save validated preferences',async()=>{
 const h=harness({local:{ottsub_primary_lang:'en',ottsub_secondary_lang:'en'},deferredFetch:true});
 await settle();h.emitManifest(100,payload());const old=[...h.requests];
 h.send('set_primary_track_kind',{kind:'cc'});const cc=h.requests.at(-1);
 assert.equal(cc.url,'https://cdn.nflxvideo.net/100-cc');assert.equal(old[0].signal.aborted,true);
 cc.resolve('CC');await settle();old[0].resolve('STALE NORMAL');await settle();assert.equal(h.engine.cues[0].text,'CC');
 h.send('set_primary_track_kind',{kind:'invalid'});assert.equal(h.send('getStatus').primaryTrackKind,'cc');
 assert(h.writes.some(w=>w.value.ottsub_primary_track_kind==='cc'));
 h.send('set_secondary_track_kind',{kind:'cc'});const secondary=h.requests.at(-1);secondary.resolve('SECONDARY CC');await settle();
 old[1].resolve('STALE SECONDARY');await settle();assert.equal(h.send('getStatus').secondaryCueCount,1);
 h.send('set_secondary_track_kind',{kind:'normal'});assert.equal(h.send('getStatus').secondaryCueCount,0);
 assert.equal(h.requests.at(-1).url,'https://cdn.nflxvideo.net/100-normal');
});

test('missing normal requests exactly normal without using a loaded CC address',async()=>{
 const h=harness({local:{ottsub_primary_lang:'en',ottsub_secondary_lang:'en',ottsub_primary_track_kind:'normal',ottsub_secondary_track_kind:'cc'}});
 await settle();h.emitManifest(100,payload(100,true));await settle();
 assert.equal(h.send('getStatus').cueCount,0);assert.equal(h.send('getStatus').primaryNeedsSelection,true);
 assert.deepEqual(h.requests.map(r=>r.url),['https://cdn.nflxvideo.net/100-cc']);
 assert.equal(h.hydration[0].kind,'normal');assert.equal(h.hydration[0].lang,'en');
});

test('automatic primary language with explicit CC hydrates missing English CC',async()=>{
 const h=harness({local:{ottsub_primary_track_kind:'cc'}});await settle();
 const m=payload();m.availableTracks[1].urls=[];h.emitManifest(100,m);await settle();
 assert.equal(h.send('getStatus').cueCount,0);assert(h.hydration.some(r=>r.lang==='en'&&r.kind==='cc'));
});

test('missing CC does not request or download the only normal track; restored invalid kind stays auto',async()=>{
 const h=harness({local:{ottsub_primary_lang:'en',ottsub_primary_track_kind:'cc',ottsub_secondary_track_kind:'bogus'}});await settle();
 const m=payload();m.availableTracks=m.availableTracks.slice(0,1);h.emitManifest(100,m);await settle();
 assert.equal(h.send('getStatus').cueCount,0);assert.equal(h.send('getStatus').primaryTrackKind,'cc');assert.equal(h.send('getStatus').secondaryTrackKind,'auto');
 assert(!h.requests.some(r=>r.url.endsWith('normal')));
});

test('discovery prepares exact CC track even when normal of the same language already has URLs',async()=>{
 const h=injectHarness();let selectedCalls=0,prepared=[];
 const normal=track('en','normal','normal'),cc=track('en','cc','cc',false);cc.hydrated=false;
 const audio={trackId:'audio',hydrated:true},video={trackId:'video',hydrated:true};
 const segment={movieId:100,manifest:{manifestResult:{movieId:100,timedtexttracks:[normal,cc]}},tracks:{audioTrack:audio,videoTrack:video,getCompatibleTrackSet:()=>({audioTrack:audio,videoTrack:video,timedTextTrack:cc})}};
 const playback={currentSegment:segment,hydrateRequiredTracks:async(a,t,v)=>{prepared.push([a,t,v]);cc.hydrated=true;cc.ttDownloadables=track('en','cc','cc').ttDownloadables;}};
 const player={getMovieId:()=>100,getTimedTextTrackList:()=>[normal,cc],getInternalPlayer:()=>({playback,findPlayerTextTrack:t=>t}),setTextTrack:()=>selectedCalls++};
 h.ctx.window.netflix={appContext:{getPlayerApp:()=>({getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['s'],getVideoPlayerBySessionId:()=>player}})})}};
 h.parse(JSON.stringify(segment.manifest.manifestResult));
 h.ctx.window.dispatchEvent(new CustomEvent('ottsub_request_load_track',{detail:{movieId:'100',lang:'en',kind:'cc'}}));await settle();
 assert.deepEqual(prepared,[['audio','cc','video']]);assert.equal(selectedCalls,0);
 assert.deepEqual([...h.ctx.window.OTTSubTrackLanguages.urls(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'],'en','cc')],['https://cdn.nflxvideo.net/cc']);
});
