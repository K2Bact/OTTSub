// Real popup copy/layout plus a real unpacked MV3 link; all network is local or blocked.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,popup,root}=require('./helpers/offline-popup.cjs');
const artifacts=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/finnish-development');
fs.mkdirSync(artifacts,{recursive:true});
const cases=[],errors=[];let blurWidths=[];
const check=async(name,action)=>{try{await action();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const {context,page}=await popup(browser,{locale:'fi',width:320,extra:';chrome.i18n.getUILanguage=()=>"fi-FI";'});
  page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.waitForFunction(()=>document.getElementById('status-badge').classList.contains('active'));
   await check('Finnish is the system-first UI, translated status and menu ordering remain correct',async()=>{
    assert.equal(await page.locator('html').getAttribute('lang'),'fi');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
    assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'Ensisijainen kieli');
    assert.equal(await page.locator('#sub-status').textContent(),'Valmis (osioita: 120)');
    assert.equal(await page.locator('#secondary-sub-status').textContent(),'Valmis (osioita: 110)');
    assert.deepEqual(await page.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),['fi','ar','bn','zh-TW','en','fr','de','he','hi','ja','ko','ms','pt-PT','ru','es','th','tr']);
    assert.equal(await page.locator('#ui-lang-select option[value="fi"]').textContent(),'Suomi (FI)');
   });
   await check('Finnish learning controls fit 320/360/430px and all four concealment labels fit their buttons',async()=>{
    for(const width of [320,360,430]){
     await page.setViewportSize({width,height:1100});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,width);
     assert.equal(await page.locator('#learning-toggle-btn').getAttribute('aria-expanded'),'true');
    }
    await page.setViewportSize({width:320,height:1100});
    blurWidths=await page.locator('#blur-target-control button').evaluateAll(buttons=>buttons.map(el=>{const range=document.createRange();range.selectNodeContents(el);const css=getComputedStyle(el);return{text:el.textContent,width:range.getBoundingClientRect().width,available:el.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)};}));
    assert.equal(blurWidths.length,4);for(const item of blurWidths)assert(item.width<=item.available,JSON.stringify(item));
    await page.screenshot({path:path.join(artifacts,'finnish-learning-expanded-320.png'),fullPage:true});
   });
   await check('RTL to Finnish restores LTR and Finnish provider labels require explicit locale without mutating identity',async()=>{
    for(const rtl of ['ar','he']){await page.selectOption('#ui-lang-select',rtl);assert.equal(await page.locator('html').getAttribute('dir'),'rtl');await page.selectOption('#ui-lang-select','fi');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');}
    const actual=await page.evaluate(async()=>{
     const {getLocalizedLanguageLabel:label}=await import('./modules/ui-dual.js');
     const track={bcp47:'fi-FI',label:'suomi (Suomi)',labelLocale:'fi_FI',urls:['fi-url'],id:'fi-normal'},before=JSON.stringify(track);
     return {local:label(track,'fi'),cc:label({...track,isCC:true},'fi'),wrong:label({...track,label:'UNTRUSTED-LABEL',labelLocale:'sv'},'fi'),unchanged:before===JSON.stringify(track)};
    });
    assert.equal(actual.local,'suomi (Suomi)');assert.equal(actual.cc,'suomi (Suomi) [CC]');assert.doesNotMatch(actual.wrong,/UNTRUSTED/);assert(actual.unchanged);
   });
  }finally{await context.close();}
  await check('Release-labelled and unlabelled popup never exposes a local report link',async()=>{
   for(const version_name of [undefined,'1.3.7']){
    const state=await popup(browser,{locale:'fi',extra:`;chrome.runtime.getManifest=()=>(${JSON.stringify({version:'1.3.7',version_name})});`});
    try{assert.equal(await state.page.locator('#dev-research-row').isVisible(),false);assert.equal(await state.page.locator('#dev-research-link').getAttribute('href'),null);}finally{await state.context.close();}
   }
  });
 }finally{await browser.close();}
 const native=await chromium.launchPersistentContext(path.join(artifacts,'finnish-development-profile'),{headless:true,channel:'chromium',args:[`--disable-extensions-except=${root}`,`--load-extension=${root}`]});
 try{
  await native.route(/^https?:/,route=>route.abort());native.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  const worker=native.serviceWorkers()[0]||await native.waitForEvent('serviceworker'),id=new URL(worker.url()).host;
  await worker.evaluate(async()=>chrome.storage.local.set({ottsub_ui_lang:'fi'}));
  const panel=await native.newPage();panel.setDefaultTimeout(6000);await panel.goto(`chrome-extension://${id}/popup/popup.html`);
  await panel.waitForFunction(()=>document.documentElement.lang==='fi');
  await check('Actual unpacked Finnish selection persists through a popup reload',async()=>{
   await panel.selectOption('#ui-lang-select','en');await panel.waitForFunction(async()=>(await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang==='en');
   await panel.selectOption('#ui-lang-select','fi');await panel.waitForFunction(async()=>(await chrome.storage.local.get('ottsub_ui_lang')).ottsub_ui_lang==='fi');
   await panel.reload();await panel.waitForFunction(()=>document.documentElement.lang==='fi');assert.equal(await panel.locator('#ui-lang-select').inputValue(),'fi');
  });
  let report;
  await check('Actual developer link opens the local report under the extension CSP',async()=>{
   assert.equal(await panel.locator('#dev-research-row').isVisible(),true);
   assert.equal(await panel.locator('#dev-research-link').getAttribute('href'),`chrome-extension://${id}/tools/dev-research/report.html`);
   [report]=await Promise.all([native.waitForEvent('page'),panel.locator('#dev-research-link').click()]);await report.waitForLoadState('domcontentloaded');
   assert.equal(report.url(),`chrome-extension://${id}/tools/dev-research/report.html`);assert.equal(await report.locator('#comparison-body tr').count(),8);
   assert.equal(await report.locator('script:not([src])').count(),0);assert.equal(await report.locator('script[src="report.js"]').count(),1);
  });
  await check('The extension report filter and calculator execute without inline-script permission',async()=>{
   assert(report);await report.selectOption('#model-filter','ad');assert.equal(await report.locator('#comparison-body tr:visible').count(),1);
   await report.fill('#payer-count','2');assert.match(await report.locator('#gross-result').textContent(),/5,800/);
   await report.selectOption('#model-filter','all');await report.screenshot({path:path.join(artifacts,'development-report.png'),fullPage:false});
  });
 }finally{await native.close();}
 if(errors.length)process.exitCode=1;
 const result={passed:!errors.length,total:cases.length,cases,errors,blurWidths};
 fs.writeFileSync(path.join(artifacts,'finnish-development-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(error=>{errors.push(error.stack);const result={passed:false,total:cases.length,cases,errors,blurWidths};fs.writeFileSync(path.join(artifacts,'finnish-development-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));process.exitCode=1;});
