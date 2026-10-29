const {supportedUILocales}=require('./helpers/ui-locales.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join((process.env.USERPROFILE || process.env.HOME),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const artifact=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/test_hindi_track_kind_browser');
fs.mkdirSync(artifact,{recursive:true});
let saved={ottsub_ui_lang:'hi',ottsub_primary_lang:'en',ottsub_secondary_lang:'hi',ottsub_primary_track_kind:'normal',ottsub_secondary_track_kind:'cc',ottsub_dual_mode:true,ottsub_sub_settings_collapsed:false};
const fixture=()=>`const settings=${JSON.stringify(saved)},listeners=[];window.commands=[];
window.demoStatus={ready:true,build:${JSON.stringify(manifest.version_name)},movieId:'100',hasCues:true,cueCount:120,hasSecondaryCues:true,secondaryCueCount:110,isDualMode:true,playbackState:'CONTENT',availableTracks:[{bcp47:'en',isCC:true,urls:['en-cc']},{bcp47:'en',isCC:false,urls:['en-normal']},{bcp47:'hi',isCC:false,urls:['hi-normal']},{bcp47:'hi',isCC:true,urls:['hi-cc']}]};
// Keep storage areas independent: a deferred sync write must not become a local event.
const makeArea=(state,areaName)=>({
 get(keys,cb){const data=structuredClone(state);if(cb)queueMicrotask(()=>cb(data));return Promise.resolve(data);},
 set(values,cb){
  const changes={};
  for(const[k,v]of Object.entries(structuredClone(values))){
   if(JSON.stringify(state[k])===JSON.stringify(v))continue;
   changes[k]={oldValue:state[k],newValue:v};state[k]=v;
  }
  if(cb)queueMicrotask(cb);
  if(Object.keys(changes).length)queueMicrotask(()=>listeners.forEach(fn=>fn(changes,areaName)));
  return Promise.resolve();
 }
});
window.chrome={runtime:{id:'test',getManifest:()=>(${JSON.stringify(manifest)})},storage:{local:makeArea(settings,'local'),sync:makeArea(structuredClone(settings),'sync'),onChanged:{addListener:fn=>listeners.push(fn),removeListener:fn=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);}}},tabs:{query(q,cb){queueMicrotask(()=>cb([{id:1,url:'https://www.netflix.com/watch/100'}]));},sendMessage(id,m,cb){commands.push(m);if(m.action==='set_dual_mode')demoStatus.isDualMode=!!m.value?.enabled;if(m.action==='set_primary_track_kind')settings.ottsub_primary_track_kind=m.value.kind;if(m.action==='set_secondary_track_kind')settings.ottsub_secondary_track_kind=m.value.kind;const response={...demoStatus,primaryLang:settings.ottsub_primary_lang,secondaryLang:settings.ottsub_secondary_lang,primaryTrackKind:settings.ottsub_primary_track_kind,secondaryTrackKind:settings.ottsub_secondary_track_kind};if(cb)queueMicrotask(()=>cb(response));return Promise.resolve(response);}},i18n:{getUILanguage:()=> navigator.languages?.[0] || navigator.language || 'en'}};window.savedSettings=settings;`;
if(require.main===module)(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
 try{
  const page=await browser.newPage({viewport:{width:430,height:950}});page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const pathname=new URL(route.request().url()).pathname;
   if(pathname==='/fixture.js')return route.fulfill({contentType:'application/javascript',body:fixture()});
   const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'not found'});
   let body=fs.readFileSync(file);const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.png':'image/png'};
   if(pathname==='/popup/popup.html')body=body.toString().replace('<head>','<head><script src="/fixture.js"></script>');
   return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body});
  });
  await page.goto('http://ottsub.test/popup/popup.html');
  await page.waitForFunction(()=>document.documentElement.lang==='hi'&&document.getElementById('secondary-track-kind').value==='cc');
  await check('Hindi is a selectable, restored LTR interface with Hindi status and subtitle language',async()=>{
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'hi');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
   assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'मुख्य भाषा');
   assert.match(await page.locator('#secondary-lang-select').textContent(),/हिन्दी/);
   assert.match(await page.locator('#sub-status').textContent(),/प्रविष्टियाँ/);
  });
  await check('same-language CC/normal are separate type choices, with plain language labels',async()=>{
   assert(!/CC|SDH/.test(await page.locator('#primary-lang-select').textContent()));
   for(const side of ['primary','secondary'])assert.deepEqual(await page.locator(`#${side}-track-kind option`).evaluateAll(list=>list.map(o=>[o.value,o.disabled])),[['auto',false],['normal',false],['cc',false]]);
  });
  await check('primary and secondary selection sends independent commands and saves kind',async()=>{
   await page.locator('#primary-track-kind').selectOption('cc');await page.locator('#secondary-track-kind').selectOption('normal');
   const r=await page.evaluate(()=>({settings:savedSettings,commands:commands.filter(c=>c.action.endsWith('_track_kind'))}));
   assert.equal(r.settings.ottsub_primary_track_kind,'cc');assert.equal(r.settings.ottsub_secondary_track_kind,'normal');
   assert(r.commands.some(c=>c.action==='set_primary_track_kind'&&c.value.kind==='cc'));
   assert(r.commands.some(c=>c.action==='set_secondary_track_kind'&&c.value.kind==='normal'));
  });
  await check('type selection survives closing/reloading the settings page',async()=>{
   saved=await page.evaluate(()=>({...savedSettings}));await page.reload();
   await page.waitForFunction(()=>document.getElementById('primary-track-kind').value==='cc');
   assert.equal(await page.locator('#secondary-track-kind').inputValue(),'normal');
  });
  await check('unavailable selected CC stays selected and disabled; normal is not substituted',async()=>{
   await page.evaluate(()=>{demoStatus.availableTracks=demoStatus.availableTracks.filter(t=>!t.isCC);demoStatus.hasCues=false;demoStatus.primaryNeedsSelection=true;});
   await page.waitForFunction(()=>document.getElementById('primary-track-kind').dataset.availability==='unsupported');
   assert.equal(await page.locator('#primary-track-kind').inputValue(),'cc');
   assert.equal(await page.locator('#primary-track-kind option[value="cc"]').isDisabled(),true);
   assert.match(await page.locator('#sub-status').textContent(),/उपलब्ध नहीं/);
   // macOS native select menus are outside headless Chromium keyboard control.
   // Keep the disabled-selection checks above; exercise an enabled choice on Mac.
   if(process.platform==='darwin')await page.locator('#primary-track-kind').selectOption('auto');
   else {await page.locator('#primary-track-kind').focus();await page.keyboard.press('Home');}
   assert.equal(await page.locator('#primary-track-kind').inputValue(),'auto');
  });
  await check('all supported interface languages translate type selectors without horizontal overflow',async()=>{
   for(const lang of supportedUILocales()){
    await page.locator('#ui-lang-select').selectOption(lang);await page.waitForFunction(l=>document.documentElement.lang===l,lang);
    assert.equal(await page.locator('html').getAttribute('dir'),['ar','he'].includes(lang)?'rtl':'ltr');
    assert(!/track_kind_/.test(await page.locator('#primary-track-kind').textContent()));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,lang);
   }
  });
  await check('Hindi learning controls retain shaped text and selected language',async()=>{
   await page.locator('#ui-lang-select').selectOption('hi');
   await page.locator('#learning-toggle-btn').click();
   assert.match(await page.locator('#learning-body').textContent(),/माउस/);
   await page.screenshot({path:path.join(artifact,'hindi-cc-panel.png'),fullPage:true});
  });
 }finally{console.log(JSON.stringify({passed:!errors.length,total:cases.length,nativeSelectKeyboard:process.platform==='darwin'?'not covered headlessly; enabled selection API checked':'Home key checked',cases,errors},null,2));await browser.close();if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={fixture,setSaved:values=>{saved={...saved,...values};}};
