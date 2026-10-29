const assert=require('node:assert/strict');
const {chromium,popup}=require('./helpers/offline-popup.cjs');
const {supportedUILocales}=require('./helpers/ui-locales.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 try{for(const locale of supportedUILocales()){
  const {page,context}=await popup(browser,{locale});page.setDefaultTimeout(4000);page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.locator('#primary-track-kind').selectOption('cc');
   await page.evaluate(()=>{demoStatus.hasCues=false;demoStatus.hasSecondaryCues=false;demoStatus.availableTracks=demoStatus.availableTracks.filter(t=>!t.isCC);});
   await page.waitForFunction(()=>document.getElementById('sub-status').dataset.statusKey==='language_unsupported');
   const show=async(key,expected)=>{
    await page.waitForFunction(k=>document.getElementById('sub-status').dataset.statusKey===k,key);
    await page.locator('#sub-status').click();
    await page.waitForFunction(()=>document.getElementById('status-popover').classList.contains('visible'));
    const r=await page.evaluate(k=>({actual:document.getElementById('popover-body').textContent,expected:OTTSubI18n.t(k)}),expected);
    assert.equal(r.actual,r.expected,locale+' '+key);await page.locator('#popover-close').click();
   };
   await show('language_unsupported','secondary_status_unsupported_desc');
   assert.equal(await page.locator('#primary-track-kind').inputValue(),'cc');
   await page.locator('#primary-track-kind').selectOption('normal');
   await page.evaluate(()=>{demoStatus.availableTracks=demoStatus.availableTracks.map(t=>({...t,urls:[],hasUrls:false}));demoStatus.primaryNeedsSelection=true;});
   await show('track_download_pending','track_selection_needed');
   await page.evaluate(()=>{demoStatus.playbackState='RECOVERY_DELAYED';demoStatus.nativeFallbackHidden=true;demoStatus.displaySuppressed=true;});
   await show('playback_delayed','playback_delayed_desc');
   assert(await page.locator('#reload-video').isVisible());assert(await page.locator('#show-native').isVisible());
   const sent=await page.evaluate(()=>commands.filter(m=>m.action==='set_primary_lang'||m.action==='set_secondary_lang'));
   assert.deepEqual(sent,[],'help must not change selected languages');
   cases.push({name:locale+': unavailable type, URL pending and delayed recovery have localized actions without automatic language changes',passed:true});
  }catch(e){cases.push({name:locale,passed:false});errors.push(e.stack+' '+JSON.stringify(await page.evaluate(()=>({status:document.getElementById('sub-status').dataset.statusKey,lang:document.getElementById('primary-lang-select').dataset.availability,kind:document.getElementById('primary-track-kind').dataset.availability,demoStatus}))));}finally{await context.close();}
 }}finally{await browser.close();console.log(JSON.stringify({passed:cases.length>0&&!errors.length,total:cases.length,cases,errors},null,2));if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
