const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join((process.env.USERPROFILE || process.env.HOME),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=process.env.OTTSub_TEST_SOURCE||path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false,detail:e.message});errors.push(e.stack);}};
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<div style="position:relative;width:900px;height:600px"><video style="width:900px;height:600px"></video></div>'}));
  await page.goto('https://www.netflix.com/watch/100');
  for(const file of ['src/styles.css','src/renderer.js']){
   const content=fs.readFileSync(path.join(root,file),'utf8');
   if(file.endsWith('.css'))await page.addStyleTag({content});else await page.addScriptTag({content});
  }
  await check('explicit br and newline each retain two lines without extra slot flex items',async()=>{
   const m=await page.evaluate(()=>{
    const r=OTTSubRenderer;r.ensureMounted(document.querySelector('video'));
    const h=text=>{const el=r._createLineElement(text,'ottsub-line-primary');r.bottomBox.replaceChildren(el);return el.getBoundingClientRect().height;};
    return {one:h('AAAA BBBB'),br:h('AAAA<br>BBBB'),lf:h('AAAA\nBBBB')};
   });assert(m.br>m.one*1.7,JSON.stringify(m));assert(Math.abs(m.br-m.lf)<2);
  });
  await page.evaluate(()=>{
   window.records=[];window.selected={bcp47:'ja',trackId:'original'};window.setterCalls=0;window.ambiguous=false;
   window.playerTracks=[{trackId:'es',bcp47:'es',ttDownloadables:{webvtt:{downloadUrls:{a:'https://cdn.nflxvideo.net/es'}}}},
    {trackId:'latam',bcp47:'es-419',ttDownloadables:{webvtt:{downloadUrls:{a:'https://cdn.nflxvideo.net/latam'}}}}, {trackId:'vi',bcp47:'vi'}];
   const player={getMovieId:()=>100,getTextTrack:()=>selected,getTimedTextTrackList:()=>playerTracks,setTimedTextTrack:t=>{selected=t;setterCalls++;}};
   const api={videoPlayer:{getAllPlayerSessionIds:()=>ambiguous?['s','s2']:['s'],getVideoPlayerBySessionId:()=>player}};
   window.netflix={appContext:{state:{playerApp:{getAPI:()=>api}}}};
   window.fetch=async(input,init)=>{window.receivedInput=input;window.receivedInit=init;const r=input instanceof Request?new Request(input,init):new Request(input,init);if(r.signal.aborted)throw new DOMException('aborted','AbortError');records.push({url:r.url,method:r.method,headers:[...r.headers],credentials:r.credentials,cache:r.cache,redirect:r.redirect,referrerPolicy:r.referrerPolicy,integrity:r.integrity,keepalive:r.keepalive,body:[...new Uint8Array(await r.arrayBuffer())]});return {bodyUsed:true};};
  });
  for(const file of ['src/core/track-languages.js','src/inject.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});
  await check('POST Request identity, bytes and metadata reach native fetch unchanged',async()=>{
   const r=await page.evaluate(async()=>{
    const input=new Request('https://www.netflix.com/manifest',{method:'POST',body:'{"movieId":100,"profiles":[]}',headers:{'X-Test':'kept','Content-Type':'application/json'},credentials:'include',cache:'no-store',redirect:'manual',referrerPolicy:'origin',integrity:'sha256-test',keepalive:true});await fetch(input);return {...records.at(-1),sameInput:receivedInput===input};
   });assert.equal(r.url,'https://www.netflix.com/manifest');assert.equal(r.method,'POST');assert.equal(r.keepalive,true);assert.equal(r.credentials,'include');assert.equal(r.cache,'no-store');assert.equal(r.redirect,'manual');assert.equal(r.integrity,'sha256-test');assert(r.headers.some(([k,v])=>k==='x-test'&&v==='kept'));assert.equal(r.sameInput,true);assert.equal(Buffer.from(r.body).toString(),'{"movieId":100,"profiles":[]}');
  });
  await check('Request init overrides and non-JSON bytes survive',async()=>{
   const r=await page.evaluate(async()=>{const input=new Request('https://www.netflix.com/manifest',{method:'POST',body:'old'}),init={method:'PUT',body:new Uint8Array([0,255,128,1]),headers:{'X-New':'yes'},keepalive:true};await fetch(input,init);return {...records.at(-1),sameInput:receivedInput===input,sameInit:receivedInit===init};});assert.equal(r.sameInput,true);assert.equal(r.sameInit,true);
   assert.equal(r.method,'PUT');assert.deepEqual(r.body,[0,255,128,1]);assert(r.headers.some(([k,v])=>k==='x-new'&&v==='yes'));assert.equal(r.url,'https://www.netflix.com/manifest');
  });
  await check('aborted request remains aborted and ordinary requests are not patched',async()=>{
   const r=await page.evaluate(async()=>{const c=new AbortController();c.abort();let error;try{await fetch(new Request('https://www.netflix.com/manifest',{signal:c.signal}));}catch(e){error=e.name;}await fetch('https://www.netflix.com/ordinary',{method:'POST',body:'unchanged'});return {error,row:records.at(-1)};});
   assert.equal(r.error,'AbortError');assert.doesNotMatch(r.row.url,/showAll/);assert.equal(Buffer.from(r.row.body).toString(),'unchanged');
  });
  const discover=lang=>page.evaluate(lang=>{dispatchEvent(new CustomEvent('ottsub_request_load_track',{detail:{lang,movieId:'100'}}));return {calls:setterCalls,selected:selected.bcp47,payload:__OTT_SUB_MANIFEST_STORE__['100']};},lang);
  await check('read-only discovery chooses regional URLs and never changes original track',async()=>{
   await page.evaluate(()=>JSON.parse('{"movieId":100,"timedtexttracks":[{"trackId":"en","bcp47":"en","ttDownloadables":{"webvtt":{"downloadUrls":{"a":"https://cdn.nflxvideo.net/en"}}}}]}'));
   const r=await discover('es-419');assert.equal(r.calls,0);assert.equal(r.selected,'ja');assert.deepEqual(r.payload.tracksByLang['es-419'],['https://cdn.nflxvideo.net/latam']);assert.deepEqual(r.payload.tracksByLang.en,['https://cdn.nflxvideo.net/en']);
  });
  await check('missing URLs and ambiguous sessions do not trigger native selection',async()=>{
   const before=await page.evaluate(()=>JSON.stringify(__OTT_SUB_MANIFEST_STORE__['100']));assert.equal((await discover('vi')).calls,0);
   await page.evaluate(()=>ambiguous=true);assert.equal((await discover('es')).calls,0);assert.equal(await page.evaluate(()=>JSON.stringify(__OTT_SUB_MANIFEST_STORE__['100'])),before);
   await page.evaluate(()=>{ambiguous=false;history.pushState({},'', '/watch/200');});assert.equal((await discover('es')).calls,0);
  });
 }finally{console.log(JSON.stringify({passed:!errors.length,total:cases.length,cases,errors},null,2));await browser.close();if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
