const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join((process.env.USERPROFILE || process.env.HOME),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..');
const artifacts=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/test_acquisition_inspector_browser');
fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:900,height:700}});
  await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<div style="background:#222;color:white;height:680px">Offline Netflix fixture</div>'}));
  await page.goto('https://ottsub.test/watch/100');
  await page.evaluate(()=>{
   const listeners=[];
   window.chrome={runtime:{getManifest:()=>({version_name:'1.3.1-local-native-acquisition-20261014.31'})},
    storage:{local:{get:(_,cb)=>cb({ottsub_primary_lang:'en',ottsub_secondary_lang:'es-es',ottsub_ui_lang:'ko'})},onChanged:{addListener:f=>listeners.push(f)}}};
   window.OTTSubPlaybackGate=class{observe(){return{};}};
   window.OTTSubPlaybackClock=class{observe(){return{};}reset(){}};
   window.OTTSubNetflixPlaybackAdapter=class{receiveBridge(){}};
   window.OTTSubTrackFetcher={fetchAndParseTrack:async()=>[]};
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedReport=text;}}});
   const player={getMovieId:()=>100,getTimedTextTrackList:()=>[{bcp47:'es-ES'}],getTextTrackList:()=>[{bcp47:'es-ES',hydrated:false}]};
   window.netflix={appContext:{getPlayerApp:()=>({getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['s'],getVideoPlayerBySessionId:()=>player}})})}};
  });
  for(const file of ['src/core/track-languages.js','src/inject.js','tools/local-diagnostics/acquisition-main.js','tools/local-diagnostics/collector.js'])
   await page.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});
  await page.evaluate(()=>{
   JSON.stringify({url:'/manifest',params:{viewableId:100,profiles:['imsc1.1'],supportsPartialHydration:true}});
   JSON.parse('{"movieId":100,"partiallyHydrated":true,"timedtexttracks":[{"bcp47":"es-ES","trackId":"PRIVATE_ID","hydrated":false,"downloadables":{}}]}');
  });
  await page.locator('#ottsub-local-diagnostics').getByRole('button',{name:'주소 조사',exact:true}).click();
  const pre=page.locator('#ottsub-local-diagnostics').locator('#acquisition');
  const text=await pre.textContent();
  assert.match(text,/보조: es-es/);assert.match(text,/true → true/);
  assert.match(text,/Netflix 원본 manifest: partial=true/);assert.match(text,/es-es: 준비=미완료 주소=0/);
  assert.match(text,/getTimedTextTrackList: array/);assert.match(text,/getTextTrackList: array/);
  assert.equal(text.includes('PRIVATE_ID'),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
  const copy=page.locator('#ottsub-local-diagnostics').getByRole('button',{name:'조사 내용 복사',exact:true});
  await copy.click();assert.equal(await page.evaluate(()=>copiedReport),text);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));
  await copy.click();const fallback=page.locator('#ottsub-local-diagnostics').getByRole('textbox',{name:'조사 내용 수동 복사'});
  assert.equal(await fallback.isVisible(),true);assert.equal(await fallback.inputValue(),text);
  const selection=await fallback.evaluate(el=>[el.selectionStart,el.selectionEnd]);assert.deepEqual(selection,[0,text.length]);
  await page.screenshot({path:path.join(artifacts,'address-inspector.png')});
  await page.locator('#ottsub-local-diagnostics').getByRole('button',{name:'주소 조사',exact:true}).click();
  assert.equal(await pre.isHidden(),true);
  assert.equal(await copy.isDisabled(),true);assert.equal(await fallback.isHidden(),true);
  console.log(JSON.stringify({passed:true,total:1,cases:[{name:'live acquisition report shows applied request and raw/merged metadata without secrets',passed:true}]}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
