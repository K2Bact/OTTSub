const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {harness,settle}=require('./helpers/content-harness.cjs');
const root=path.resolve(__dirname,'..');
function load(file,extras={}){const ctx=vm.createContext({window:{},...extras});vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);return ctx;}
const old='https://cdn.nflxvideo.net/old',fresh='https://cdn.nflxvideo.net/fresh';
function manifest(urls){return {urls:['https://cdn.nflxvideo.net/en'],tracksByLang:{en:['https://cdn.nflxvideo.net/en'],'es-es':urls},availableTracks:[{bcp47:'en',urls:['https://cdn.nflxvideo.net/en']},{bcp47:'es-es',urls}]};}
async function spanish(){const h=harness({local:{ottsub_secondary_lang:'es-es'},deferredFetch:true});await settle();h.emitManifest(100,manifest([old]));await settle();return h;}
test('normal directional marks, isolates and join controls survive literal and encoded input',()=>{
 const p=load('src/parser.js').window.OTTSubParser,text='C++\u200E\u200F\u2066Netflix\u2069می\u200Cروم\u200D';
 assert.equal(p.cleanSubtitleLine(text),text);assert.equal(p.cleanSubtitleLine('a&#x200E;&#x2066;b&#x2069;&#x200C;'),'a\u200E\u2066b\u2069\u200C');assert.equal(p.cleanSubtitleLine('a&#x202E;\uFEFF\x01b'),'ab');
});
test('safe emphasis strips attributes; encoded markup remains inert literal text',()=>{
 const p=load('src/parser.js').window.OTTSubParser;
 assert.equal(p.cleanSubtitleLine('<strong onclick="bad()">A <em>B</em> <u>C</u></strong>'),'<b>A </b><i><b>B</b></i> <b><u>C</u></b>');
 assert.equal(p.cleanSubtitleLine('&lt;script&gt;bad()&lt;/script&gt;&lt;style&gt;x&lt;/style&gt;<img onerror="bad()">OK'),'&lt;script&gt;bad()&lt;/script&gt;&lt;style&gt;x&lt;/style&gt;OK');assert.equal(p.cleanSubtitleLine('<i>A <i>B</i> C</i>'),'<i>A B C</i>');
});
test('JIS reset aliases share repeat, input, IME and modifier guards',()=>{
 const document={activeElement:null},router=load('src/input/keyboard-router.js',{document}).window.OTTSubKeyboardRouter;let actions=[];router.registerActionHandler(a=>actions.push(a));
 const press=(code,extras={})=>{let prevented=false;router.handleKeyDown({code,preventDefault(){prevented=true;},stopImmediatePropagation(){},getModifierState:()=>false,...extras});return prevented;};
 for(const code of ['Backslash','IntlYen','IntlRo']){assert(press(code));assert.equal(actions.at(-1),'reset_primary_sync');assert(press(code,{altKey:true}));assert.equal(actions.at(-1),'reset_secondary_sync');for(const extra of [{repeat:true},{ctrlKey:true},{metaKey:true},{shiftKey:true},{isComposing:true},{getModifierState:()=>true}])assert.equal(press(code,extra),false);document.activeElement={tagName:'INPUT'};assert.equal(press(code),false);document.activeElement=null;}
});
test('recovery isolates roles/kinds, bounds reads, excludes rejected URLs and resets',()=>{
 const Recovery=load('src/network/track-recovery.js').window.OTTSubTrackRecovery,r=new Recovery(2);let calls=0;const key=r.key(1,'secondary','es-es','normal');
 assert(r.refresh(key,[old],()=>calls++));assert.equal(r.refresh(key,[old],()=>calls++),false);assert.deepEqual([...r.freshUrls(key,[old,fresh])],[fresh]);r.reject(key,[fresh]);assert.equal(r.freshUrls(key,[fresh]).length,0);
 assert(r.refresh(r.key(1,'secondary','es-es','cc'),[old],()=>calls++));assert.equal(r.refresh(r.key(1,'primary','es-es','normal'),[old],()=>calls++),false);assert.equal(calls,2);r.clear();assert(r.refresh(key,[old],()=>calls++));
});
test('403 causes one metadata read; cached rejected URL is skipped; fresh exact-language URL loads',async()=>{
 const h=await spanish();h.requests.find(r=>r.url===old).resolve('',403);await settle();assert.equal(h.hydration.length,1);assert.equal(h.hydration[0].lang,'es-es');
 for(let i=0;i<5;i++){h.emitManifest(100,manifest([old]));h.tick();await settle();}assert.equal(h.requests.filter(r=>r.url===old).length,1);assert.equal(h.hydration.length,1);
 h.emitManifest(100,manifest([old,fresh]));await settle();const r=h.requests.find(r=>r.url===fresh);assert(r);r.resolve('fresh cues');await settle();assert.equal(h.send('getStatus').hasSecondaryCues,true);assert.equal(h.hydration.length,1);
});
test('subsequent 404 never loops rejected addresses or repeated metadata reads',async()=>{
 const h=await spanish();h.requests.find(r=>r.url===old).resolve('',403);await settle();h.emitManifest(100,manifest([fresh]));await settle();h.requests.find(r=>r.url===fresh).resolve('',404);await settle();h.emitManifest(100,manifest([old,fresh]));await settle();assert.equal(h.requests.filter(r=>r.url===fresh).length,1);assert.equal(h.hydration.length,1);
});
test('successful alternate CDN avoids metadata refresh',async()=>{
 const h=await spanish();h.emitManifest(100,manifest([old,fresh]));await settle();h.requests.filter(r=>r.url===old).at(-1).resolve('',403);await settle();h.requests.find(r=>r.url===fresh).resolve('alternative');await settle();assert.equal(h.hydration.length,0);assert.equal(h.send('getStatus').hasSecondaryCues,true);
});
test('late rejected response from previous episode cannot refresh new episode',async()=>{
 const h=await spanish(),r=h.requests.find(r=>r.url===old);h.navigate(200);r.resolve('',403);await settle();assert.equal(h.hydration.length,0);assert.equal(h.send('getStatus').movieId,'200');
});
test('protected playback defers rejected-address metadata refresh',async()=>{
 const h=await spanish(),read=h.window.OTTSubNetflixPlaybackAdapter.read;h.window.OTTSubNetflixPlaybackAdapter.read=()=>({...read(),adSignal:'present'});h.tick();h.requests.find(r=>r.url===old).resolve('',403);await settle();assert.equal(h.hydration.length,0);
});
