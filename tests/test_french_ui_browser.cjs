// French UI integration with the actual popup; external network is blocked.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,popup,root}=require('./helpers/offline-popup.cjs');
const out=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/french-ui');fs.mkdirSync(out,{recursive:true});
const cases=[],errors=[],plannedTotal=8;let bindings,blurWidths,browserVersion;
const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
(async()=>{
 const browser=await chromium.launch({headless:true});browserVersion=browser.version();
 try{
  const {context,page}=await popup(browser,{locale:'fr',width:320,extra:';chrome.i18n.getUILanguage=()=>"fr-FR";'});
  page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.stack));
  try{
   await page.waitForFunction(()=>document.getElementById('status-badge').classList.contains('active'));
   await check('French system-first order, labels and ready cue counts use the real initialization',async()=>{
    assert.equal(await page.locator('html').getAttribute('lang'),'fr');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
    assert.deepEqual(await page.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),['fr','ar','bn','zh-TW','en','fi','de','he','hi','ja','ko','ms','pt-PT','ru','es','th','tr']);
    assert.equal(await page.locator('#ui-lang-select option[value="fr"]').textContent(),'Français (FR)');
    assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'Langue principale');
    assert.equal(await page.locator('#sub-status').textContent(),'Prêts (120 segments)');
    assert.equal(await page.locator('#secondary-sub-status').textContent(),'Prêts (110 segments)');
   });
   await check('Every French text/title/ARIA binding agrees with the dictionary and live state',async()=>{
    bindings=await page.evaluate(()=>{
     const overrides={'status-badge':OTTSubI18n.t('status_connected'),'sub-status':OTTSubI18n.t('sub_status_ready',{count:120}),'secondary-sub-status':OTTSubI18n.t('secondary_status_ready',{count:110})};
     return [['data-i18n',null],['data-i18n-title','title'],['data-i18n-aria-label','aria-label']].map(([data,attr])=>({type:data,items:[...document.querySelectorAll('['+data+']')].map(el=>({key:el.getAttribute(data),actual:attr?el.getAttribute(attr):el.textContent,expected:!attr&&overrides[el.id]||OTTSubI18n.t(el.getAttribute(data))}))}));
    });
    for(const group of bindings){assert(group.items.length>0);for(const item of group.items)assert.equal(item.actual,item.expected,JSON.stringify(item));}
    assert.equal(await page.locator('[data-i18n="keyboard_layout_help"]').count(),0);
    assert.equal(await page.locator('#btn-ctee').getAttribute('href'),'https://buymeacoffee.com/k2bact');
   });
   await check('Expanded French learning controls fit 320/360/430px without concealment-label ellipsis',async()=>{
    for(const width of [320,360,430]){await page.setViewportSize({width,height:1100});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,width);assert.equal(await page.locator('#learning-toggle-btn').getAttribute('aria-expanded'),'true');}
    await page.setViewportSize({width:320,height:1100});
    const states=[
     ['playback_ad',{playbackState:'AD',displaySuppressed:true}],
     ['playback_recovering',{playbackState:'RECOVERING',displaySuppressed:true}],
     ['playback_delayed',{playbackState:'RECOVERY_DELAYED',displaySuppressed:true,nativeFallbackHidden:true}],
     ['playback_session_wait',{playbackState:'RECOVERING',displaySuppressed:true,nativeVerification:'off'}],
     ['playback_track_unavailable',{playbackState:'RECOVERING',displaySuppressed:true,nativeVerification:'failed'}],
     ['playback_native',{playbackState:'NATIVE_FALLBACK',displaySuppressed:true}],
     ['status_connected',{playbackState:'CONTENT',displaySuppressed:false}]
    ];
    for(const width of [320,360,430]){
     await page.setViewportSize({width,height:1100});
     for(const[key,data]of states){
      await page.evaluate(data=>Object.assign(demoStatus,{nativeFallbackHidden:false,nativeVerification:null,suppressionReason:null},data),data);
      await page.waitForFunction(key=>document.getElementById('status-badge').dataset.statusKey===key,key);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}: ${key}`);
     }
    }
    await page.setViewportSize({width:320,height:1100});
    blurWidths=await page.locator('#blur-target-control button').evaluateAll(els=>els.map(el=>{const range=document.createRange();range.selectNodeContents(el);const css=getComputedStyle(el);return{text:el.textContent,width:range.getBoundingClientRect().width,available:el.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)};}));
    assert.equal(blurWidths.length,4);for(const label of blurWidths)assert(label.width<=label.available,JSON.stringify(label));
    await page.screenshot({path:path.join(out,'french-learning-expanded-320.png'),fullPage:true});
    await page.locator('#learning-card').screenshot({path:path.join(out,'french-learning-card-320.png')});
   });
   await check('Arabic and Hebrew transitions restore French LTR without changing system-first order',async()=>{
    for(const rtl of ['ar','he']){await page.selectOption('#ui-lang-select',rtl);assert.equal(await page.locator('html').getAttribute('dir'),'rtl');await page.selectOption('#ui-lang-select','fr');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');assert.equal(await page.locator('#ui-lang-select option').first().getAttribute('value'),'fr');}
   });
   await check('French provider labels require matching locale and preserve French regional/CC identity',async()=>{
    const r=await page.evaluate(async()=>{const {getLocalizedLanguageLabel:label}=await import('./modules/ui-dual.js');const t={bcp47:'fr-CA',label:'français (Canada)',labelLocale:'fr_CA',id:'canada',urls:['fr-ca-url']},before=JSON.stringify(t);return{local:label(t,'fr'),cc:label({...t,isCC:true},'fr'),wrong:label({...t,label:'UNTRUSTED',labelLocale:'en'},'fr'),mixed:label({...t,label:'français Я'},'fr'),unchanged:before===JSON.stringify(t)};});
    assert.equal(r.local,'français (Canada)');assert.equal(r.cc,'français (Canada) [CC]');assert.doesNotMatch(r.wrong,/UNTRUSTED/);assert.doesNotMatch(r.mixed,/Я/);assert(r.unchanged);
   });
   await check('French status dialog opens by keyboard, localizes help and restores focus',async()=>{
    await page.locator('#status-badge').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.id),'popover-close');
    assert.equal(await page.locator('#popover-close').getAttribute('aria-label'),'Fermer');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'status-badge');
   });
  }finally{await context.close();}
  await check('French release-labelled UI keeps the developer report link hidden',async()=>{
   const state=await popup(browser,{locale:'fr',extra:';chrome.runtime.getManifest=()=>({version:"1.3.9"});'});
   try{assert.equal(await state.page.locator('#dev-research-row').isVisible(),false);assert.equal(await state.page.locator('#dev-research-link').getAttribute('href'),null);}finally{await state.context.close();}
  });
 }finally{await browser.close();}
 const context=await chromium.launchPersistentContext(path.join(out,'french-native-profile'),{headless:true,channel:'chromium',args:[`--disable-extensions-except=${root}`,`--load-extension=${root}`]});
 try{
  await context.route(/^https?:/,route=>route.abort());
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker',{timeout:8000}),id=new URL(worker.url()).host;
  await worker.evaluate(()=>chrome.storage.local.set({ottsub_ui_lang:'fr'}));
  const page=await context.newPage();page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.stack));await page.goto(`chrome-extension://${id}/popup/popup.html`);await page.waitForFunction(()=>document.documentElement.lang==='fr');
  await check('Actual unpacked extension persists manual French selection and reloads its localized disconnected UI',async()=>{
   for(const lang of ['en','fr']){await page.selectOption('#ui-lang-select',lang);await page.waitForFunction(async l=>(await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang===l,lang);}
   await page.reload();await page.waitForFunction(()=>document.documentElement.lang==='fr');assert.equal(await page.locator('#ui-lang-select').inputValue(),'fr');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'Langue principale');
  });
 }finally{await context.close();}
 if(cases.length!==plannedTotal)errors.push(`Incomplete execution: ${cases.length}/${plannedTotal}`);
 const report={passed:!errors.length,plannedTotal,total:cases.length,cases,errors,browserVersion,bindings:bindings?.map(x=>({type:x.type,count:x.items.length})),blurWidths};fs.writeFileSync(path.join(out,'french-ui-result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(errors.length)process.exitCode=1;
})().catch(e=>{errors.push(e.stack);const report={passed:false,plannedTotal,total:cases.length,cases,errors,browserVersion};fs.writeFileSync(path.join(out,'french-ui-result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));process.exitCode=1;});
