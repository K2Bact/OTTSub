const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,popup,root}=require('./helpers/offline-popup.cjs');
const {supportedUILocales}=require('./helpers/ui-locales.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<div data-uia="player" style="position:relative;width:950px;height:650px"><video style="width:950px;height:650px"></video></div>'}));await page.goto('https://ottsub.test/watch/1');
  for(const file of ['src/parser.js','src/renderer.js','src/hud.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});
  await page.addStyleTag({content:fs.readFileSync(path.join(root,'src/styles.css'),'utf8')});
  await check('actual parser to renderer keeps adversarial markup inert in Chromium',async()=>{
   const r=await page.evaluate(()=>{
    window.hit=0;const corpus=['<img src=x onerror="hit++">text','<svg onload="hit++">text</svg>','<a href="javascript:hit++">text</a>','<iframe srcdoc="<script>hit++</script>">text</iframe>','<i onclick="hit++">text</i>','&lt;img src=x onerror=hit++&gt;','&#x3c;script&#x3e;hit++&#x3c;/script&#x3e;','<ruby onclick="hit++">漢<rt>かん</rt></ruby>','<math><mtext>text</mtext></math>','<style>body{display:none}</style>text','<script>hit++</script>text','<b><u><i>text</b></u></i>'];
    OTTSubRenderer.ensureMounted(document.querySelector('video'));
    for(const text of corpus){const cue=OTTSubParser.parse('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n'+text+'\n')[0];OTTSubRenderer.renderDual({top:[],bottom:cue?[cue]:[]},{top:[],bottom:[]},{isDualMode:false});
     if(OTTSubRenderer.bottomBox.querySelector('img,svg,script,iframe,style,a,math,[onload],[onclick],[onerror],[srcdoc]'))throw Error(text);
    }return {count:corpus.length,hit,visible:document.body.checkVisibility()};
   });assert.deepEqual(r,{count:12,hit:0,visible:true});
  });
  await check('200 HUD show/repeat/recovery/destroy cycles leave no owned timers, frames or nodes',async()=>{
   const r=await page.evaluate(()=>{
    const timers=new Set(),frames=new Set(),st=window.setTimeout,ct=window.clearTimeout,raf=window.requestAnimationFrame,caf=window.cancelAnimationFrame;
    window.setTimeout=(...a)=>{const id=st(...a);timers.add(id);return id;};window.clearTimeout=id=>{timers.delete(id);ct(id);};window.requestAnimationFrame=fn=>{const id=raf(fn);frames.add(id);return id;};window.cancelAnimationFrame=id=>{frames.delete(id);caf(id);};
    let calls=0;
    for(let i=0;i<200;i++){
     OTTSubHUD.show('Repeat '+i,5000,'ar');OTTSubHUD.show('Repeat '+i,5000,'ar');
     OTTSubHUD.setRecoveryNotice('<img src=x> temporary','Show',()=>calls++);const button=OTTSubHUD.recoveryElem.querySelector('button');
     OTTSubHUD.setRecoveryNotice('Updated','Show',()=>calls+=2);button.click();OTTSubHUD.destroy();button.click();
     if(timers.size||frames.size||document.querySelector('#ottsub-hud,.ottsub-recovery-notice'))throw Error('HUD retained cycle '+i);
    }window.setTimeout=st;window.clearTimeout=ct;window.requestAnimationFrame=raf;window.cancelAnimationFrame=caf;return{calls,timers:timers.size,frames:frames.size};
   });assert.deepEqual(r,{calls:400,timers:0,frames:0});
  });
  await page.close();
  const p=await popup(browser,{locale:'en'});p.page.on('pageerror',e=>errors.push(e.message));
  await check('75 live locale changes retain direction, translated control names and one UI instance',async()=>{
   for(let round=0;round<5;round++)for(const locale of supportedUILocales()){
    await p.page.locator('#ui-lang-select').selectOption(locale);await p.page.waitForFunction(l=>document.documentElement.lang===l,locale);
    const r=await p.page.evaluate(()=>({dir:document.documentElement.dir,actual:document.getElementById('dual-toggle').getAttribute('aria-label'),expected:OTTSubI18n.t('dual_title'),ui:document.querySelectorAll('#ui-lang-select').length,overflow:document.documentElement.scrollWidth>innerWidth}));
    assert.equal(r.dir,['ar','he'].includes(locale)?'rtl':'ltr');assert.equal(r.actual,r.expected);assert.equal(r.ui,1);assert.equal(r.overflow,false);
   }
  });
  await check('provider labels remain literal text in actual language options',async()=>{
   const polls=await p.page.evaluate(()=>commands.filter(m=>m.action==='getStatus').length);
   await p.page.evaluate(()=>{demoStatus.availableTracks=[{bcp47:'en',label:'<img src=x onerror="window.attack=1">English',labelLocale:'en',urls:['en']},{bcp47:'hi',label:'<svg onload="window.attack=1">',labelLocale:'en',urls:['hi']}];});
   await p.page.waitForFunction(n=>commands.filter(m=>m.action==='getStatus').length>n,polls);
   assert.equal(await p.page.locator('select img,select svg,select script').count(),0);assert.equal(await p.page.evaluate(()=>!!window.attack),false);
  });
  await check('dark forced-colors keyboard switches stay selected through subsequent status polls',async()=>{
   await p.page.emulateMedia({forcedColors:'active',colorScheme:'dark',reducedMotion:'reduce'});
   await p.page.locator('#dual-toggle').focus();await p.page.keyboard.press('Space');
   const count=await p.page.evaluate(()=>commands.filter(m=>m.action==='getStatus').length);
   await p.page.waitForFunction(n=>commands.filter(m=>m.action==='getStatus').length>=n+2,count);
   const r=await p.page.locator('#dual-toggle').evaluate(el=>({checked:el.checked,track:getComputedStyle(el.nextElementSibling).backgroundColor,knob:getComputedStyle(el.nextElementSibling,'::before').backgroundColor}));assert.equal(r.checked,false);assert.notEqual(r.track,r.knob);
   const out=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/full-review-20261021');fs.mkdirSync(out,{recursive:true});await p.page.screenshot({path:path.join(out,'dark-forced-colors.png'),fullPage:true});
  });await p.context.close();
 }finally{await browser.close();console.log(JSON.stringify({passed:cases.length>0&&!errors.length,total:cases.length,cases,errors},null,2));if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
