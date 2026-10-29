const {supportedUILocales}=require('./helpers/ui-locales.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,setSaved}=require('./test_hindi_track_kind_browser.cjs');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join((process.env.USERPROFILE || process.env.HOME),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
 const artifacts=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/test_platform_shortcuts_browser');fs.mkdirSync(artifacts,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:320,height:900}});page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
  let os='mac';
  await page.route('**/*',async r=>{
   const pathname=new URL(r.request().url()).pathname;
   if(pathname==='/fixture.js')return r.fulfill({contentType:'application/javascript',body:fixture()+`;chrome.runtime.getPlatformInfo=cb=>queueMicrotask(()=>cb({os:${JSON.stringify(os)}}));`});
   const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404,body:'missing'});
   const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};let body=fs.readFileSync(file);
   if(pathname==='/popup/popup.html')body=body.toString().replace('<head>','<head><script src="/fixture.js"></script>');
   return r.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body});
  });
  for(os of ['mac','win'])for(const lang of supportedUILocales()){
   const name=`${os} ${lang} 320px labels survive language change`;
   try{
    setSaved({ottsub_ui_lang:lang,ottsub_shortcuts_collapsed:false});await page.goto('http://ottsub.test/popup/popup.html');
    await page.waitForFunction(l=>document.documentElement.lang===l&&document.getElementById('status-badge').classList.contains('active'),lang);
    assert.equal(await page.evaluate(()=>OTTSubPlatform.getOS()),os);
    assert.deepEqual(await page.locator('[data-shortcut-modifier]').allTextContents(),Array(6).fill(os==='mac'?'Option':'Alt'));
    assert.equal((await page.locator('.shortcut-desc').allTextContents()).some(text=>text.includes(os==='mac'?'Alt +':'Option +')),false);
    assert.equal(await page.locator('.shortcut-keys').first().evaluate(el=>getComputedStyle(el).whiteSpace),'nowrap');
    const measure=()=>page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,overlap:[...document.querySelectorAll('.shortcut-item')].some(el=>{const k=el.querySelector('.shortcut-keys').getBoundingClientRect(),d=el.querySelector('.shortcut-desc').getBoundingClientRect();return Math.min(k.right,d.right)-Math.max(k.left,d.left)>0.5;}),ltr:[...document.querySelectorAll('.shortcut-keys')].every(el=>getComputedStyle(el).direction==='ltr')}));
    assert.deepEqual(await measure(),{overflow:false,overlap:false,ltr:true});
    const next=lang==='ko'?'ar':'ko';await page.selectOption('#ui-lang-select',next);await page.waitForFunction(l=>document.documentElement.lang===l,next);
    assert.deepEqual(await page.locator('[data-shortcut-modifier]').allTextContents(),Array(6).fill(os==='mac'?'Option':'Alt'));
    assert.equal((await page.locator('.shortcut-desc').allTextContents()).some(text=>text.includes(os==='mac'?'Alt +':'Option +')),false);
    assert.deepEqual(await measure(),{overflow:false,overlap:false,ltr:true});
    if(lang==='ko'){await page.selectOption('#ui-lang-select','ko');await page.screenshot({path:path.join(artifacts,`${os}-shortcuts-320.png`),fullPage:true});}
    cases.push({name,passed:true});
   }catch(e){cases.push({name,passed:false});errors.push(e.stack);}
  }
  await page.addScriptTag({path:path.join(root,'src/input/keyboard-router.js')});
  await page.evaluate(()=>{window.shortcutActions=[];OTTSubKeyboardRouter.registerActionHandler(a=>shortcutActions.push(a));document.addEventListener('keydown',OTTSubKeyboardRouter.handleKeyDown,true);document.activeElement?.blur();});
  for(const [combo,action]of [['[','adjust_primary_sync'],['Alt+]','adjust_secondary_sync'],['Alt+b','toggle_blur'],['Meta+[',null],['Control+Alt+b',null],['Shift+Alt+b',null]]){
   const name=`browser KeyboardEvent ${combo}`;try{
    const before=await page.evaluate(()=>shortcutActions.length);await page.keyboard.press(combo);
    const actions=await page.evaluate(()=>shortcutActions);assert.equal(actions.length,before+(action?1:0));if(action)assert.equal(actions.at(-1),action);
    cases.push({name,passed:true});
   }catch(e){cases.push({name,passed:false});errors.push(e.stack);}
  }

  await check('panel restores both saved offsets and the active slider on opening',async()=>{
   setSaved({ottsub_ui_lang:'ko',ottsub_offset:300,ottsub_secondary_offset:-200});
   await page.goto('http://ottsub.test/popup/popup.html');
   await page.waitForFunction(()=>document.getElementById('status-badge').classList.contains('active'));
   await page.waitForFunction(()=>document.getElementById('sync-value').textContent==='+0.3s'&&document.getElementById('secondary-sync-value').textContent==='-0.2s');
   assert.equal(await page.locator('#sync-value').textContent(),'+0.3s');
   assert.equal(await page.locator('#secondary-sync-value').textContent(),'-0.2s');
   await page.locator('#sync-card-secondary').click();
   assert.equal(await page.locator('#sync-slider').getAttribute('aria-valuetext'),'-0.2s');
  });
  await check('external shortcut storage updates refresh both offsets and the selected slider',async()=>{
   await page.locator('#sync-card-secondary').click();
   await page.evaluate(()=>chrome.storage.local.set({ottsub_offset:500,ottsub_revision_ottsub_offset:{n:99,origin:'external-test',value:500},ottsub_secondary_offset:-300,ottsub_revision_ottsub_secondary_offset:{n:99,origin:'external-test',value:-300}}));
   await page.waitForFunction(()=>document.getElementById('sync-value').textContent==='+0.5s'&&document.getElementById('secondary-sync-value').textContent==='-0.3s');
   await page.locator('#sync-card-secondary').click();
   assert.equal(await page.locator('#sync-slider').getAttribute('aria-valuetext'),'-0.3s');
  });
  await check('live content status reconciles offsets even without a storage event',async()=>{
   await page.locator('#sync-card-secondary').click();
   await page.evaluate(()=>{demoStatus.offset=700;demoStatus.secondaryOffset=-400;});
   await page.waitForFunction(()=>document.getElementById('sync-value').textContent==='+0.7s'&&document.getElementById('secondary-sync-value').textContent==='-0.4s');
   assert.equal(await page.locator('#sync-slider').getAttribute('aria-valuetext'),'-0.4s');
  });

  await check('sync catch-up cannot replay old local offsets over the live content display',async()=>{
   const display=await page.evaluate(async()=>{
    const payload=await chrome.storage.local.get(['ottsub_offset','ottsub_secondary_offset','ottsub_revision_ottsub_offset','ottsub_revision_ottsub_secondary_offset']);
    // Reproduce the revision guard's deferred sync write without a timing delay.
    await chrome.storage.sync.set(payload);
    return {primary:document.getElementById('sync-value').textContent,secondary:document.getElementById('secondary-sync-value').textContent,aria:document.getElementById('sync-slider').getAttribute('aria-valuetext')};
   });
   assert.deepEqual(display,{primary:'+0.7s',secondary:'-0.4s',aria:'-0.4s'});
  });

  await check('wheel adjusts only the active target by 100ms and announces the new value',async()=>{
   await page.evaluate(()=>{delete demoStatus.offset;delete demoStatus.secondaryOffset;});
   await page.locator('#sync-slider').hover();await page.mouse.wheel(0,-1);
   await page.waitForFunction(()=>document.getElementById('secondary-sync-value').textContent==='-0.3s');
   assert.equal(await page.locator('#sync-value').textContent(),'+0.7s');
   assert.equal(await page.locator('#sync-slider').getAttribute('aria-valuetext'),'-0.3s');
  });

  await check('real slider command payloads update the production content engines',async()=>{
   const {harness,settle}=require('./helpers/content-harness.cjs');const content=harness();await settle();
   for(const [target,action,field] of [['primary','set_offset','offset'],['secondary','set_secondary_offset','secondaryOffset']]){
    await page.locator('#sync-card-'+target).click();
    await page.evaluate(()=>commands.length=0);
    await page.locator('#sync-slider').focus();await page.keyboard.press('ArrowRight');
    const expected=Number(await page.locator('#sync-slider').inputValue());
    const sent=await page.evaluate(action=>commands.findLast(c=>c.action===action),action);
    assert(sent,'slider must send the active target command');
    content.send(sent.action,sent.value);
    assert.equal(content.send('getStatus')[field],expected);
   }
  });
 }finally{console.log(JSON.stringify({passed:!errors.length,total:cases.length,cases,errors},null,2));await browser.close();if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
