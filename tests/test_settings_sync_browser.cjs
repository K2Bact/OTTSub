// Offline extension settings propagation regression. Test relay replaces Chrome cloud transport.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
let chromium;
try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..');
const base=path.resolve(process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual'));
assert(base===root||base.startsWith(root+path.sep),'Keep test artifacts inside OTTSub.');
const label=`settings-sync-${Date.now()}-${process.pid}`,out=path.join(base,label),runtime=path.join(out,'runtime');
assert(!fs.existsSync(out),'Do not overwrite previous evidence.');fs.mkdirSync(out,{recursive:true});
const traceStart=Date.now();
const trace=(phase,detail={})=>fs.appendFileSync(path.join(out,'phases.ndjson'),JSON.stringify({at:new Date().toISOString(),elapsedMs:Date.now()-traceStart,phase,freeMemory:require('node:os').freemem(),...detail})+'\n');
trace('suite:start');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const prefix='ottsub_revision_';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const report={passed:false,label,startedAt:new Date().toISOString(),platform:process.platform,arch:process.arch,probeSha256:hash(__filename),pageErrors:[],uiChecks:[],
 coverage:{storage:'Actual native local/sync APIs in two isolated unpacked-extension profiles',transport:'Explicit test relay of per-key changes; no Chrome cloud connection or physical second device',offline:'Relay withheld, then delivered in controlled order; OS network was not changed',writeFailure:'Injected exception for one sync.set in one test page, not an actual Chrome quota exhaustion'},
 cases:[],transfers:[],errors:[]};
const sessions=[];
function copy(dir,to){
 fs.mkdirSync(to,{recursive:true});
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const from=path.join(dir,e.name),dest=path.join(to,e.name);
  assert(!fs.lstatSync(from).isSymbolicLink(),`Unexpected link ${from}`);
  if(e.isDirectory())copy(from,dest);else fs.copyFileSync(from,dest);
 }
}
function prepare(){
 for(const folder of ['src','popup','icons','_locales'])copy(path.join(root,folder),path.join(runtime,folder));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 for(const entry of manifest.content_scripts)entry.js=entry.js.filter(f=>!f.startsWith('tools/local-diagnostics/'));
 fs.writeFileSync(path.join(runtime,'manifest.json'),JSON.stringify(manifest,null,2));
 report.build=manifest.version_name;report.runtimeManifest=manifest;
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 report.runtimeFiles=Object.fromEntries(walk(runtime).filter(f=>path.relative(runtime,f)!=='manifest.json').map(f=>{
  const rel=path.relative(runtime,f).replaceAll('\\','/');assert.equal(hash(f),hash(path.join(root,rel)));return[rel,hash(f)];
 }));
 report.productSourceHashes={...report.runtimeFiles,'manifest.json':hash(path.join(root,'manifest.json'))};
}
async function launch(name){
 trace('browser:launching',{name});
 const profile=path.join(out,'profiles',name);assert(profile.startsWith(path.join(out,'profiles')+path.sep));
 const context=await chromium.launchPersistentContext(profile,{headless:true,channel:'chromium',viewport:{width:380,height:900},
  args:[`--disable-extensions-except=${runtime}`,`--load-extension=${runtime}`,'--disable-sync','--disable-background-networking']});
 await context.route(/^https?:/,route=>route.abort());
 let worker;
 try{worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker',{timeout:10000});}
 catch(error){await context.close();throw error;}
 const id=new URL(worker.url()).host;
 await worker.evaluate(()=>{
  globalThis.__syncProbeEvents=[];
  chrome.storage.onChanged.addListener((changes,area)=>__syncProbeEvents.push({at:Date.now(),area,changes}));
 });
 const session={name,profile,context,worker,id,closed:false,page:null,sequence:sessions.length+1};sessions.push(session);trace('browser:ready',{name});
 report.browser=context.browser().version();return session;
}
const snapshot=s=>s.worker.evaluate(async()=>({local:await chrome.storage.local.get(null),sync:await chrome.storage.sync.get(null)}));
async function until(fn,message){
 const deadline=Date.now()+6000;
 while(Date.now()<deadline){if(await fn())return;await wait(25);}
 throw new Error(`Timeout: ${message}`);
}
async function panel(s){
 const p=await s.context.newPage();p.on('pageerror',error=>report.pageErrors.push({profile:s.name,error:error.stack||String(error)}));await p.goto(`chrome-extension://${s.id}/popup/popup.html`);
 await p.waitForFunction(()=>window.OTTSubStorageGuard&&document.querySelector('#build-version')?.textContent);
 await p.evaluate(()=>new Promise(resolve=>OTTSubStorageGuard.readSettings(['ottsub_ui_lang'],resolve)));
 s.page=p;return p;
}
const save=async(p,values,flush=true)=>p.evaluate(async({values,flush})=>{
 const storage=await import('./modules/storage.js');
 for(const [k,v]of Object.entries(values))storage.queuePopupStorageSave(k,v);
 if(flush)storage.flushPopupStorageSave();
},{values,flush});
async function expect(s,values,area='local'){
 await until(async()=>{const data=(await snapshot(s))[area];return Object.entries(values).every(([k,v])=>data[k]===v);},`${s.name} ${area} ${JSON.stringify(values)}`);
}
async function packet(s,keys){
 await until(async()=>{const {local,sync}=await snapshot(s);return keys.every(k=>local[prefix+k]&&JSON.stringify(local[prefix+k])===JSON.stringify(sync[prefix+k])&&local[k]===sync[k]);},`${s.name} acknowledged sync packet`);
 const state=(await snapshot(s)).sync;
 return Object.fromEntries(keys.flatMap(k=>[[k,state[k]],[prefix+k,state[prefix+k]]]));
}
async function deliver(from,to,payload,note){
 const startedAt=Date.now();await to.worker.evaluate(values=>chrome.storage.sync.set(values),payload);
 report.transfers.push({from:from.name,to:to.name,note,startedAt,writeCompletedAt:Date.now(),payload});
}
async function ui(s,values){
 let lastActual;
 await until(async()=>{
  const p=s.page;
  const actual=await p.evaluate(()=>({lang:document.documentElement.lang,selected:document.getElementById('ui-lang-select').value,
   primary:document.getElementById('sync-value').textContent,secondary:document.getElementById('secondary-sync-value').textContent,
   scale:document.getElementById('primary-scale-val').textContent,
   secondaryScale:document.getElementById('secondary-scale-val').textContent,
   primaryColor:document.querySelector('#primary-color-palette [aria-checked="true"]')?.getAttribute('data-color'),
   secondaryColor:document.querySelector('#secondary-color-palette [aria-checked="true"]')?.getAttribute('data-color'),
   blurTarget:document.querySelector('#blur-target-control [aria-checked="true"]')?.getAttribute('data-target'),
   blurMode:document.querySelector('#blur-mode-control [aria-checked="true"]')?.getAttribute('data-mode'),
   hoverPause:document.getElementById('hover-pause-toggle').checked,locked:document.getElementById('lock-pos-toggle').checked,
   activeTarget:document.querySelector('[data-sync-target][aria-selected="true"]')?.getAttribute('data-sync-target')}));
  lastActual=actual;
  return Object.entries(values).every(([k,v])=>actual[k]===v);
 },`${s.name} UI ${JSON.stringify(values)}`);
 report.uiChecks.push({profile:s.name,expected:values,actual:lastActual,passed:true});
}
async function close(s){
 trace('browser:closing',{name:s.name});
 if(s.closed)return;
 try{
  const events=await s.worker.evaluate(()=>__syncProbeEvents);
  fs.writeFileSync(path.join(out,`events-${s.name}-${s.sequence}.json`),JSON.stringify(events,null,2));
 }finally{trace('browser:events-saved',{name:s.name});await s.context.close();s.closed=true;trace('browser:closed',{name:s.name});}
}
async function check(name,fn){
 trace('case:start',{name});
 const startedAt=Date.now();
 try{
  const details=await fn();report.cases.push({name,passed:true,durationMs:Date.now()-startedAt,details});
 }catch(error){
  report.cases.push({name,passed:false,durationMs:Date.now()-startedAt,error:error.stack||String(error)});throw error;
 }finally{fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify(report,null,2));trace('case:finished',{name,passed:report.cases.at(-1)?.passed});}
}
async function flush(s){await s.page.evaluate(()=>OTTSubStorageGuard.flushStorageSave());}
let a,b;
(async()=>{
 prepare();a=await launch('A');b=await launch('B');assert.equal(a.id,b.id);report.extensionId=a.id;
 await panel(a);await panel(b);
 const initial={ottsub_ui_lang:'zh-tw',ottsub_offset:300,ottsub_secondary_offset:-200,ottsub_primary_scale:1.2,
  ottsub_secondary_scale:0.9,ottsub_primary_color:'#80deea',ottsub_secondary_color:'#ffe082',ottsub_blur_target:'both',
  ottsub_blur_mode:'blur_14',ottsub_hover_pause:true,ottsub_lock_pos:true,ottsub_active_sync_target:'secondary'};
 await check('A to B: Taiwan UI and representative settings through native APIs',async()=>{
  await a.page.selectOption('#ui-lang-select','zh-TW');await save(a.page,initial);
  const payload=await packet(a,Object.keys(initial));await deliver(a,b,payload,'A to B baseline');
  await expect(b,initial);await ui(b,{lang:'zh-TW',selected:'zh-TW',primary:'+0.3s',secondary:'-0.2s',scale:'120%',secondaryScale:'90%',
   primaryColor:'#80deea',secondaryColor:'#ffe082',blurTarget:'both',blurMode:'blur_14',hoverPause:true,locked:true,activeTarget:'secondary'});
  return {settingCount:Object.keys(initial).length,A:await snapshot(a),B:await snapshot(b)};
 });
 await check('B to A: user selection and independent color change update actual open UI',async()=>{
  await b.page.selectOption('#ui-lang-select','tr');await save(b.page,{ottsub_primary_color:'#ffe082'});
  const values={ottsub_ui_lang:'tr',ottsub_primary_color:'#ffe082'};
  await deliver(b,a,await packet(b,Object.keys(values)),'B to A manual edit');await expect(a,values);await ui(a,{lang:'tr',selected:'tr',primaryColor:'#ffe082'});
  return {A:await snapshot(a),B:await snapshot(b)};
 });
 await check('Disjoint offline edits merge without rolling back the other field',async()=>{
  await save(a.page,{ottsub_primary_scale:1.25});await save(b.page,{ottsub_secondary_color:'#ffffff'});
  const ap=await packet(a,['ottsub_primary_scale']),bp=await packet(b,['ottsub_secondary_color']);
  await deliver(a,b,ap,'disjoint reconnect A to B');await deliver(b,a,bp,'disjoint reconnect B to A');
  const expected={ottsub_primary_scale:1.25,ottsub_secondary_color:'#ffffff',ottsub_primary_color:'#ffe082'};
  await expect(a,expected);await expect(b,expected);await ui(a,{scale:'125%',secondaryColor:'#ffffff'});await ui(b,{scale:'125%',secondaryColor:'#ffffff'});
  return {A:await snapshot(a),B:await snapshot(b)};
 });
 await check('Offline same-field edits: higher logical revision survives later arrival of an older edit',async()=>{
  await save(a.page,{ottsub_offset:400});await save(a.page,{ottsub_offset:500});await save(b.page,{ottsub_offset:-300});
  const ap=await packet(a,['ottsub_offset']),bp=await packet(b,['ottsub_offset']);
  assert(ap[prefix+'ottsub_offset'].n>bp[prefix+'ottsub_offset'].n);
  await deliver(a,b,ap,'higher revision first');await deliver(b,a,bp,'stale offline edit later');
  await expect(a,{ottsub_offset:500});await expect(b,{ottsub_offset:500});await flush(a);await flush(b);
  await expect(a,{ottsub_offset:500},'sync');await expect(b,{ottsub_offset:500},'sync');await ui(b,{primary:'+0.5s'});
  return {submitted:{ap,bp},A:await snapshot(a),B:await snapshot(b)};
 });
 for(const order of ['A-first','B-first'])await check(`Equal-revision offline conflict converges with ${order} reconnect order`,async()=>{
  const av=order==='A-first'?600:800,bv=order==='A-first'?700:900;
  await save(a.page,{ottsub_offset:av});await save(b.page,{ottsub_offset:bv});
  const ap=await packet(a,['ottsub_offset']),bp=await packet(b,['ottsub_offset']),ar=ap[prefix+'ottsub_offset'],br=bp[prefix+'ottsub_offset'];
  assert.equal(ar.n,br.n);const winner=ar.origin.localeCompare(br.origin)>0?ar:br;
  if(order==='A-first'){await deliver(a,b,ap,'equal revision A first');await deliver(b,a,bp,'equal revision B second');}
  else{await deliver(b,a,bp,'equal revision B first');await deliver(a,b,ap,'equal revision A second');}
  await expect(a,{ottsub_offset:winner.value});await expect(b,{ottsub_offset:winner.value});await flush(a);await flush(b);
  await expect(a,{ottsub_offset:winner.value},'sync');await expect(b,{ottsub_offset:winner.value},'sync');
  return {submitted:{ar,br},expectedWinner:winner,A:await snapshot(a),B:await snapshot(b)};
 });
 await check('Duplicate and reversed delivery preserves latest value and reaches idle',async()=>{
  await save(a.page,{ottsub_secondary_offset:-400});const old=await packet(a,['ottsub_secondary_offset']);
  await save(a.page,{ottsub_secondary_offset:-500});const newer=await packet(a,['ottsub_secondary_offset']);
  await deliver(a,b,newer,'new before old');await deliver(a,b,old,'delayed older patch');await deliver(a,b,old,'duplicate older patch');
  await expect(b,{ottsub_secondary_offset:-500});await flush(b);await expect(b,{ottsub_secondary_offset:-500},'sync');
  await wait(450);const beforeIdle=await b.worker.evaluate(()=>__syncProbeEvents.length);await wait(450);
  const afterIdle=await b.worker.evaluate(()=>__syncProbeEvents.length);assert.equal(afterIdle,beforeIdle);await ui(b,{secondary:'-0.5s'});
  return {old,newer,eventsAtStartOfIdle:beforeIdle,eventsAtEndOfIdle:afterIdle,B:await snapshot(b)};
 });
 await check('Raw value before revision cannot update UI until matching metadata arrives',async()=>{
  await save(a.page,{ottsub_ui_lang:'he'});const payload=await packet(a,['ottsub_ui_lang']);
  await deliver(a,b,{ottsub_ui_lang:payload.ottsub_ui_lang},'raw first');await ui(b,{lang:'tr'});
  await deliver(a,b,{[prefix+'ottsub_ui_lang']:payload[prefix+'ottsub_ui_lang']},'metadata later');
  await expect(b,{ottsub_ui_lang:'he'});await ui(b,{lang:'he',selected:'he'});
  return {B:await snapshot(b)};
 });
 await check('Revision before stale raw value keeps canonical UI and repairs raw sync on reopening',async()=>{
  await save(a.page,{ottsub_ui_lang:'ar'});const payload=await packet(a,['ottsub_ui_lang']);
  await deliver(a,b,{[prefix+'ottsub_ui_lang']:payload[prefix+'ottsub_ui_lang']},'metadata first');await ui(b,{lang:'ar'});
  await deliver(a,b,{ottsub_ui_lang:'he'},'late old raw value');await expect(b,{ottsub_ui_lang:'ar'});await ui(b,{lang:'ar'});
  const splitState=await snapshot(b);await b.page.close();await panel(b);await ui(b,{lang:'ar'});await expect(b,{ottsub_ui_lang:'ar'},'sync');
  return {splitState,reopened:await snapshot(b)};
 });
 await check('Closed receiving panel materializes incoming revisions on next opening',async()=>{
  await b.page.close();await save(a.page,{ottsub_ui_lang:'bn',ottsub_secondary_offset:-700});
  const payload=await packet(a,['ottsub_ui_lang','ottsub_secondary_offset']);await deliver(a,b,payload,'panel closed receiver');
  const beforeOpening=await snapshot(b);await panel(b);await expect(b,{ottsub_ui_lang:'bn',ottsub_secondary_offset:-700});
  await ui(b,{lang:'bn',selected:'bn',secondary:'-0.7s'});return {beforeOpening,afterOpening:await snapshot(b)};
 });
 await check('Restarted receiving browser accepts queued offline changes and persists them',async()=>{
  await close(b);await save(a.page,{ottsub_ui_lang:'zh-tw',ottsub_secondary_offset:-800});
  const queued=await packet(a,['ottsub_ui_lang','ottsub_secondary_offset']);b=await launch('B');assert.equal(a.id,b.id);
  await deliver(a,b,queued,'queued while browser stopped');await panel(b);await expect(b,{ottsub_ui_lang:'zh-tw',ottsub_secondary_offset:-800});
  await ui(b,{lang:'zh-TW',selected:'zh-TW',secondary:'-0.8s'});await close(b);
  b=await launch('B');await panel(b);await expect(b,{ottsub_ui_lang:'zh-tw',ottsub_secondary_offset:-800});await ui(b,{lang:'zh-TW',secondary:'-0.8s'});
  return {B:await snapshot(b)};
 });
 await check('Failed sync write preserves local edit and startup retransmits acknowledged local revision',async()=>{
  const previous=(await snapshot(a)).sync.ottsub_secondary_offset;
  await a.page.evaluate(()=>{window.__syncSetBeforeProbe=chrome.storage.sync.set;chrome.storage.sync.set=()=>{throw new Error('Injected sync write failure');};});
  await save(a.page,{ottsub_secondary_offset:-900});await expect(a,{ottsub_secondary_offset:-900});
  const failedState=await snapshot(a);assert.equal(failedState.sync.ottsub_secondary_offset,previous);
  await a.page.evaluate(()=>{chrome.storage.sync.set=window.__syncSetBeforeProbe;delete window.__syncSetBeforeProbe;});
  await a.page.close();await panel(a);await expect(a,{ottsub_secondary_offset:-900},'sync');
  const payload=await packet(a,['ottsub_secondary_offset']);await deliver(a,b,payload,'recovered startup retransmission');
  await expect(b,{ottsub_secondary_offset:-900});await ui(b,{secondary:'-0.9s'});
  return {failedState,recovered:await snapshot(a),B:await snapshot(b)};
 });
 assert.deepEqual(report.pageErrors,[]);report.passed=true;
})().catch(async error=>{
 report.errors.push(error.stack||String(error));process.exitCode=1;
 for(const s of sessions.filter(s=>!s.closed))try{report[`failure${s.name}`]=await snapshot(s);}catch{}
}).finally(async()=>{
 for(const s of sessions.filter(s=>!s.closed)){
  try{await close(s);}catch(error){report.errors.push('Cleanup: '+(error.stack||String(error)));report.passed=false;process.exitCode=1;}
 }
 report.sourceChanged=Object.entries(report.productSourceHashes||{}).filter(([f,h])=>!fs.existsSync(path.join(root,f))||hash(path.join(root,f))!==h).map(([f])=>f);
 if(report.sourceChanged.length){report.passed=false;report.errors.push('Product sources changed during test: '+report.sourceChanged.join(', '));process.exitCode=1;}
 report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));trace('suite:closed',{passed:report.passed});
 console.log(JSON.stringify({passed:report.passed,total:report.cases.length,plannedTotal:12,browser:report.browser,
  cases:report.cases.map(({name,passed,error})=>({name,passed,...(error?{error}:{})})),errors:report.errors,
  uiComparisons:report.uiChecks.length,transfers:report.transfers.length,artifact:path.relative(root,path.join(out,'result.json')).replaceAll('\\','/'),coverage:report.coverage}));
});
