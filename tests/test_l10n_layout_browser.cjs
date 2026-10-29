const {supportedUILocales}=require('./helpers/ui-locales.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,setSaved}=require('./test_hindi_track_kind_browser.cjs');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join((process.env.USERPROFILE || process.env.HOME),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 const artifacts=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/test_l10n_layout_browser');fs.mkdirSync(artifacts,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:320,height:900}});page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async r=>{
   const pathname=new URL(r.request().url()).pathname;
   if(pathname==='/fixture.js')return r.fulfill({contentType:'application/javascript',body:fixture()});
   const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404,body:'missing'});
   const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};let body=fs.readFileSync(file);
   if(pathname==='/popup/popup.html')body=body.toString().replace('<head>','<head><script src="/fixture.js"></script>');
   return r.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body});
  });
  for(const width of [320,360,430])for(const lang of supportedUILocales()){
   setSaved({ottsub_ui_lang:lang,ottsub_primary_track_kind:'normal',ottsub_secondary_track_kind:'cc',ottsub_learning_collapsed:false});
   await page.setViewportSize({width,height:900});await page.goto('http://ottsub.test/popup/popup.html');
   await page.waitForFunction(l=>document.documentElement.lang===l&&document.getElementById('status-badge').classList.contains('active'),lang);
   for(const state of ['connected','delayed','disconnected']){
    const name=`${lang} ${width}px ${state}`;
    try{
     await page.evaluate(s=>{
      if(s==='disconnected'){delete demoStatus.build;chrome.tabs.query=(q,cb)=>cb([]);}
      if(s==='delayed'){demoStatus.playbackState='RECOVERING';demoStatus.displaySuppressed=true;}
     },state);
     if(state==='delayed')await page.waitForFunction(()=>!document.getElementById('playback-notice').hidden);
     if(state==='disconnected')await page.waitForFunction(()=>document.getElementById('status-badge').textContent===OTTSubI18n.t('panel_no_tab'));
     const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,clips:[...document.querySelectorAll('.title-row,.header-actions,.card-toggle-btn,.card-row,button,select,.sync-target-card')].filter(el=>el.getClientRects().length).flatMap(el=>{const r=el.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5?[{element:el.id||el.className,left:r.left,right:r.right,text:el.textContent.trim().slice(0,50)}]:[];}),obsoleteButtons:document.querySelectorAll('[data-i18n="btn_sub_500"],[data-i18n="btn_sub_100"],[data-i18n="btn_reset"],[data-i18n="btn_add_100"],[data-i18n="btn_add_500"]').length,cardCase:getComputedStyle(document.querySelector('.card-title')).textTransform,direction:document.documentElement.dir}));
     assert.equal(metrics.overflow,false,JSON.stringify(metrics));assert.deepEqual(metrics.clips,[],JSON.stringify(metrics));assert.equal(metrics.obsoleteButtons,0);assert.equal(metrics.cardCase,'none');assert.equal(metrics.direction,['ar','he'].includes(lang)?'rtl':'ltr');
     const ccLabel=await page.locator('#secondary-track-kind option[value="cc"]').textContent();
     assert.equal(state==='disconnected'?ccLabel.startsWith('CC — '):ccLabel==='CC',true);
     assert.equal(await page.locator('#secondary-track-kind').getAttribute('title'),await page.evaluate(()=>OTTSubI18n.t('track_kind_cc')));
     assert.equal(await page.locator('.shortcut-keys').first().evaluate(el=>getComputedStyle(el).direction),'ltr');
     if(lang==='ms')assert.equal(await page.locator('[data-i18n="blur_target_both"]').evaluate(el=>el.scrollWidth<=el.clientWidth),true,'Malay both-target label must remain readable without ellipsis');
     if(lang==='bn')assert.equal(await page.locator('[data-i18n="blur_target_both"]').evaluate(el=>el.scrollWidth<=el.clientWidth),true,'Bengali both-target label must remain readable without ellipsis');
     if(lang==='tr')assert.equal(await page.locator('[data-i18n="blur_target_both"]').evaluate(el=>el.scrollWidth<=el.clientWidth),true,'Turkish both-target label must remain readable without ellipsis');
     if(lang==='zh-TW')assert.equal(await page.locator('[data-i18n="blur_target_both"]').evaluate(el=>el.scrollWidth<=el.clientWidth),true,'Traditional Chinese both-target label must remain readable without ellipsis');
     if(lang==='pt-PT')for(const key of ['none','primary','secondary','both'])assert.equal(await page.locator(`[data-i18n="blur_target_${key}"]`).evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const css=getComputedStyle(el);return range.getBoundingClientRect().width<=el.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)+0.5;}),true,`Portugal ${key} target must fit without ellipsis`);
     if(['ru','th'].includes(lang))for(const key of ['none','primary','secondary','both'])assert.equal(await page.locator(`[data-i18n="blur_target_${key}"]`).evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const css=getComputedStyle(el);return range.getBoundingClientRect().width<=el.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)+0.5;}),true,`${lang} ${key} target must fit without ellipsis`);
     cases.push({name,passed:true});
    }catch(e){cases.push({name,passed:false});errors.push(e.message);await page.screenshot({path:path.join(artifacts,`failed-${lang}-${width}-${state}.png`),fullPage:true});}
    if(width===320&&state==='connected')await page.screenshot({path:path.join(artifacts,`review-${lang}-320.png`),fullPage:true});
   }
  }
 }finally{console.log(JSON.stringify({passed:!errors.length,total:cases.length,cases,errors},null,2));await browser.close();if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
