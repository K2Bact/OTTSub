// Execute the actual bounded discovery helpers with controlled ownership/time.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/content.js'),'utf8');
const helpers=source.slice(source.indexOf('  function isCurrentRequest('),source.indexOf('  async function loadSecondaryTrack('));
function fixture(){
 const events=[];
 const ctx=vm.createContext({CustomEvent,performance:{now:()=>0},episodeGeneration:1,activeMovieId:'100',
  getCurrentMovieId:()=>ctx.watchId,watchId:'100',protectTrackData:()=>ctx.protected,protected:false,
  window:{dispatchEvent:e=>events.push(e.detail)},primaryRequest:null,secondaryRequest:null});
 vm.runInContext(helpers,ctx);
 const make=lang=>({lang,needsUrls:true,generation:1,controller:new AbortController()});
 return {ctx,events,make};
}
test('missing-address discovery is initial read plus at most three later reads',()=>{
 const {ctx,events,make}=fixture();ctx.secondaryRequest=make('es-es');
 ctx.requestMissingTrackUrls(ctx.secondaryRequest,'100');
 for(const now of [1000,1500,3000,4500,7500,9000,20000,50000])ctx.discoverMissingTrackUrls(now);
 assert.equal(events.length,4);assert.equal(ctx.secondaryRequest.discoveryRemaining,0);
 assert(events.every(e=>e.lang==='es-es'&&e.movieId==='100'));
});
test('late address discovery never reads stale/aborted requests or protected playback',()=>{
 for(const block of [ctx=>ctx.watchId='200',ctx=>ctx.episodeGeneration=2,
   ctx=>ctx.secondaryRequest.controller.abort(),ctx=>ctx.protected=true]){
  const {ctx,events,make}=fixture();ctx.secondaryRequest=make('ar');
  ctx.requestMissingTrackUrls(ctx.secondaryRequest,'100');block(ctx);ctx.discoverMissingTrackUrls(20000);
  assert.equal(events.length,1);
 }
});
test('resolved requests stop discovery; primary and secondary use their own language',()=>{
 const {ctx,events,make}=fixture();ctx.primaryRequest=make('ar');ctx.secondaryRequest=make('es-es');
 ctx.requestMissingTrackUrls(ctx.primaryRequest,'100');ctx.requestMissingTrackUrls(ctx.secondaryRequest,'100');
 ctx.secondaryRequest.needsUrls=false;ctx.discoverMissingTrackUrls(1500);
 assert.deepEqual(events.map(e=>e.lang),['ar','es-es','ar']);
});
