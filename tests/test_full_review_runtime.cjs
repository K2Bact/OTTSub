const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const {test}=require('node:test');
const load=(file,extra={})=>{const window={};vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window,...extra});return window;};
test('random seeks, rewinds, offset changes and micro-overlap match an independent linear oracle',()=>{
 const {OTTSubSyncEngineClass:Engine}=load('src/sync-engine.js');assert(Engine);
 let seed=0x7516ab;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 let lookups=0;
 for(let sample=0;sample<40;sample++){
  const engine=new Engine(),list=Array.from({length:160},(_,id)=>{const begin=Math.round(rand()*20000)/100;return{id,begin,end:begin+(1+Math.floor(rand()*800))/100,text:'cue '+id,isTop:rand()<.3};});engine.setCues('test',list);
  const cues=[...engine.cues];
  for(let step=0;step<220;step++){
   if(step%5===0)engine.setOffset(Math.round((rand()-.5)*20000));const t=step%11===0?cues[Math.floor(rand()*cues.length)].end:rand()*215;
   const at=Math.max(0,t)+engine.offsetMs/1000;
   const expected=side=>cues.filter(c=>!!c.isTop===side&&c.begin<=at&&at<c.end).filter((c,_,active)=>!active.some(next=>next.begin>c.begin&&next.begin>=c.end-.200000001&&next.begin<c.end)).map(c=>c.id);
   const actual=engine.getActiveCues(t);assert.deepEqual(Array.from(actual.top,c=>c.id),expected(true));assert.deepEqual(Array.from(actual.bottom,c=>c.id),expected(false));lookups++;
  }
 }
 assert.equal(lookups,8800);
});
test('network URL matrix follows parsed hostnames, protocols, credentials and ports',()=>{
 const {OTTSubTrackFetcher:f}=load('src/network/track-fetcher.js',{URL});let count=0;
 for(const host of ['nflxvideo.net','nflxso.net','nflximg.net','nflxext.com','netflix.com']){
  for(const prefix of ['', 'cdn.']){assert(f.isSafeNetflixSubtitleUrl('https://'+prefix+host+'/s'));for(const url of ['http://'+prefix+host+'/s','https://'+prefix+host+'.evil.test/s','https://'+prefix+'evil'+host+'/s','https://'+prefix+host+'@evil.test/s','https://user:pass@'+prefix+host+'/s','https://'+prefix+host+':81/s','https://'+prefix+host.replaceAll('i','і')+'.evil.test/s','javascript:https://'+prefix+host,'file://'+prefix+host+'/s','https://evil.test/?'+prefix+host,'https://'+prefix+host+'%2eevil.test/s','https://'+prefix+host+'\\@evil.test/s']){
   // Backslash is a URL path separator, so the actual parsed host, not text, decides.
   const actualHost=(()=>{try{return new URL(url).hostname;}catch{return '';}})();
   if(actualHost===prefix+host&&url.includes('\\@'))assert(f.isSafeNetflixSubtitleUrl(url));else assert.equal(f.isSafeNetflixSubtitleUrl(url),false,url);count++;
  }}
 }assert.equal(count,120);
});
test('status connection stop releases pagehide closures on 400 repeated lifecycles',()=>{
 const listeners=new Set(),timers=new Set(),activations=new Set(),window={addEventListener:(type,fn)=>listeners.add(fn),removeEventListener:(type,fn)=>listeners.delete(fn)};
 const chrome={runtime:{getManifest:()=>({version_name:'test'})},tabs:{query:(q,cb)=>cb([]),onActivated:{addListener:fn=>activations.add(fn),removeListener:fn=>activations.delete(fn)}}};
 const ctx={window,chrome,setTimeout:fn=>{timers.add(fn);return fn;},clearTimeout:fn=>timers.delete(fn),setInterval:fn=>{timers.add(fn);return fn;},clearInterval:fn=>timers.delete(fn)};
 vm.runInNewContext(fs.readFileSync(path.join(root,'popup/modules/status-connection.js'),'utf8').replace('export function startStatusConnection','function startStatusConnection')+'\nthis.start=startStatusConnection;',ctx);
 for(let i=0;i<400;i++){const connection=ctx.start(()=>{});connection.stop();connection.stop();}
 assert.equal(timers.size,0);assert.equal(activations.size,0);assert.equal(listeners.size,0);
});
test('subtitle length cap must not split a valid astral Unicode character',()=>{
 const {OTTSubSyncEngineClass:Engine}=load('src/sync-engine.js');const e=new Engine();
 for(const text of ['x'.repeat(999)+'👩','x'.repeat(998)+'👩','x'.repeat(999)+'𠀀','x'.repeat(998)+'👩'+'z']){
  e.setCues('test',[{id:1,begin:0,end:10,text}]);assert(e.cues[0].text.length<=1000);assert(e.cues[0].text.isWellFormed());assert(text.startsWith(e.cues[0].text));
 }
});
function connectionHarness(deferQuery=false){
 const updates=[],queries=[],messages=[],timeouts=new Map(),intervals=new Map(),events=new Set(),activations=new Set();let next=0;
 const chrome={runtime:{getManifest:()=>({version_name:'current'})},windows:{getCurrent:cb=>cb({id:1})},tabs:{query:(q,cb)=>{queries.push(cb);if(!deferQuery)cb([{id:10,url:'https://www.netflix.com/watch/100'}]);},sendMessage:(id,message,cb)=>messages.push(cb),onActivated:{addListener:fn=>activations.add(fn),removeListener:fn=>activations.delete(fn)}}};
 const context={window:{addEventListener:(name,fn)=>events.add(fn),removeEventListener:(name,fn)=>events.delete(fn)},chrome,setTimeout:fn=>{timeouts.set(++next,fn);return next;},clearTimeout:id=>timeouts.delete(id),setInterval:fn=>{intervals.set(++next,fn);return next;},clearInterval:id=>intervals.delete(id)};
 vm.runInNewContext(fs.readFileSync(path.join(root,'popup/modules/status-connection.js'),'utf8').replace('export function startStatusConnection','function startStatusConnection')+'\nthis.start=startStatusConnection;',context);
 const connection=context.start(value=>updates.push(value));return{connection,updates,queries,messages,timeouts,intervals,events,activations};
}
test('closing during tab lookup prevents the late query from sending a message or updating UI',()=>{
 const h=connectionHarness(true);h.connection.stop();h.queries[0]([{id:10,url:'https://www.netflix.com/watch/100'}]);
 assert.equal(h.messages.length,0);assert.equal(h.updates.length,0);assert.equal(h.timeouts.size,0);assert.equal(h.intervals.size,0);assert.equal(h.events.size,0);assert.equal(h.activations.size,0);
});
test('timeout, newer response and build mismatch never accept an old status owner',()=>{
 const h=connectionHarness();const [id,timeout]=[...h.timeouts][0];h.timeouts.delete(id);timeout();assert.equal(h.updates.at(-1).state,'panel_disconnected');
 h.connection.poll();h.messages[1]({build:'current',movieId:'new'});assert.equal(h.updates.at(-1).response.movieId,'new');
 h.messages[0]({build:'current',movieId:'old'});assert.equal(h.updates.at(-1).response.movieId,'new');
 h.connection.poll();h.messages[2]({build:'obsolete',movieId:'other'});assert.equal(h.updates.at(-1).state,'panel_disconnected');assert.equal(h.updates.at(-1).response,null);h.connection.stop();
});
test('runtime commands reject foreign senders and malformed action envelopes without changing settings',async()=>{
 const {harness,settle}=require('./helpers/content-harness.cjs');let listener;
 const h=harness({beforeContent:({window})=>{const add=window.chrome.runtime.onMessage.addListener;window.chrome.runtime.onMessage.addListener=fn=>{listener=fn;add(fn);};}});await settle();
 const old=h.send('getStatus').offset,writes=h.writes.length;
 assert.equal(listener({action:'set_offset',value:9000},{id:'foreign'},()=>{throw Error('foreign callback');}),false);
 for(const request of [null,{}, {action:9}])assert.equal(listener(request,{id:'test'},()=>{throw Error('malformed callback');}),false);
 assert.equal(h.send('getStatus').offset,old);assert.equal(h.writes.length,writes);h.send('set_offset',100);assert.equal(h.send('getStatus').offset,100);
});
