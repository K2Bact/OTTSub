const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join((process.env.USERPROFILE || process.env.HOME),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
 try{
  const page=await browser.newPage({viewport:{width:1000,height:700}});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const rel=new URL(r.request().url()).pathname.slice(1);if(rel.startsWith('popup/')||rel==='src/i18n.js')return r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(root,rel),'utf8')});return r.fulfill({contentType:'text/html',body:'<div data-uia="player" style="position:relative;width:960px;height:650px"><video style="width:960px;height:650px"></video><div data-uia="timeline" style="position:absolute;top:360px;left:0;width:960px;height:25px;background:red"></div></div><select id="primary-lang-select"></select><select id="secondary-lang-select"></select>'});});
  await page.goto('https://www.netflix.com/watch/100');
  await page.addStyleTag({content:fs.readFileSync(path.join(root,'src/styles.css'),'utf8')});
  for(const file of ['src/interaction/controls-hit-detector.js','src/renderer.js','src/i18n.js','src/hud.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});
  await page.evaluate(()=>{const r=OTTSubRenderer;r.ensureMounted(document.querySelector('video'));r.setLockPosition(true);r.bottomBox.style.cssText='display:block;position:absolute;top:350px;bottom:auto;left:50%;transform:translateX(-50%)';r.bottomBox.append(r._createLineElement('Clickable subtitle text','ottsub-line-primary'));window.hovers=[];r.onSubtitleHoverChange=(v)=>hovers.push(v);window.clicks=0;document.querySelector('[data-uia="timeline"]').addEventListener('pointerdown',e=>{if(e.isTrusted)clicks++;});});
  await check('locked subtitles keep position; real click and drag reach overlapped timeline',async()=>{
   const before=await page.locator('.ottsub-line').boundingBox();const x=before.x+before.width/2,y=374;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+80,y);await page.mouse.up();
   const after=await page.locator('.ottsub-line').boundingBox();assert.equal(await page.evaluate(()=>clicks),1);assert.deepEqual(after,before);assert.equal(await page.evaluate(()=>OTTSubRenderer.isDragging),false);
  });
  await check('outside controls subtitle hover resumes without disabling position lock',async()=>{
   await page.evaluate(()=>document.querySelector('[data-uia="timeline"]').style.display='none');await page.mouse.move(10,10);const box=await page.locator('.ottsub-line').boundingBox();await page.mouse.move(box.x+20,box.y+10);await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>hovers.at(-1)),true);assert.equal(await page.evaluate(()=>OTTSubRenderer.isPositionLocked),true);
  });
  await page.evaluate(async()=>{window.dual=await import('/popup/modules/ui-dual.js');window.primary=await import('/popup/modules/ui-primary.js');OTTSubI18n.setLanguage('ko');});
  await check('unknown language list does not offer invented languages; saved preference labelled',async()=>{
   const r=await page.evaluate(()=>{primary.restorePrimaryLanguage('ja');dual.restoreSecondaryLanguage('ja');primary.populatePrimaryLangOptions(null);dual.populateSecondaryLangOptions(null);return [...document.querySelectorAll('select')].map(s=>({text:s.selectedOptions[0].textContent,values:[...s.options].map(o=>o.value)}));});
   assert.match(r[0].text,/확인 중/);assert.match(r[1].text,/확인 중/);assert.deepEqual(r[0].values,['auto','ja']);assert.deepEqual(r[1].values,['ja']);
  });
  await check('unsupported Japanese is disabled and labelled; later supported Japanese becomes selectable',async()=>{
   for(const tracks of [[{bcp47:'en'},{bcp47:'ko'}],[],[{bcp47:'ja'}]]){
    const r=await page.evaluate(tracks=>{primary.populatePrimaryLangOptions(tracks);dual.populateSecondaryLangOptions(tracks);return [...document.querySelectorAll('select')].map(s=>({value:s.value,text:s.selectedOptions[0].textContent,disabled:s.selectedOptions[0].disabled}));},tracks);
    for(const s of r){assert.equal(s.value,'ja');assert.equal(s.disabled,!tracks.some(t=>t.bcp47==='ja'));if(s.disabled)assert.match(s.text,/지원 안 함/);}
   }
  });
  await check('recovery notice exposes working native-subtitle action and clears',async()=>{
   await page.evaluate(()=>OTTSubHUD.setRecoveryNotice('Timing delayed','Show original',()=>{window.nativeClicked=true;OTTSubHUD.setRecoveryNotice(null);}));await page.locator('.ottsub-recovery-notice button').click();assert.equal(await page.evaluate(()=>nativeClicked),true);assert.equal(await page.locator('.ottsub-recovery-notice').count(),0);
  });
  await check('fine custom positions survive renderer restore to hundredth percent',async()=>{
   const pos=await page.evaluate(()=>{OTTSubRenderer.setCustomPosition(1.234,-2.346);return [OTTSubRenderer.customPosX,OTTSubRenderer.customPosY];});assert.deepEqual(pos,[1.23,-2.35]);
  });
  await check('pointer burst coalesces 100 events into at most two hit-stack reads',async()=>{
   const count=await page.evaluate(async()=>{
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const original=document.elementsFromPoint.bind(document);let reads=0;document.elementsFromPoint=(...args)=>{reads++;return original(...args);};
    try{for(let i=0;i<100;i++)document.dispatchEvent(new PointerEvent('pointermove',{clientX:i,clientY:100}));await new Promise(r=>requestAnimationFrame(r));return reads;}finally{document.elementsFromPoint=original;}
   });assert(count<=2,`hit reads: ${count}`);
  });
  await check('visibility API exceptions use computed visibility and preserve real control priority',async()=>{
   const states=await page.evaluate(()=>{
    const control=document.querySelector('[data-uia="timeline"]');control.style.display='block';control.checkVisibility=()=>{throw Error('simulated API failure');};
    const detector=OTTSubRenderer._controlsHit;detector.point={x:300,y:374};
    detector.refresh();const visible=OTTSubRenderer.container.classList.contains('native-controls-hit');
    control.style.opacity='0';detector.refresh();const hidden=OTTSubRenderer.container.classList.contains('native-controls-hit');
    delete control.checkVisibility;control.style.display='none';control.style.opacity='1';return {visible,hidden};
   });assert.deepEqual(states,{visible:true,hidden:false});
  });
  await check('disabled saved option leaves supported language choices selectable',async()=>{
   await page.evaluate(()=>{primary.restorePrimaryLanguage('ja');dual.restoreSecondaryLanguage('ja');const t=[{bcp47:'en'},{bcp47:'ko'}];primary.populatePrimaryLangOptions(t);dual.populateSecondaryLangOptions(t);});
   for(const id of ['primary-lang-select','secondary-lang-select']){
    const select=page.locator('#'+id);
    assert.equal(await select.locator('option[value="ja"]').isDisabled(),true);
    // macOS owns the native select popup; Playwright cannot drive it headlessly.
    // Native Chrome keyboard menu navigation is a separate live Mac check.
    if(process.platform==='darwin'){
     for(const value of ['en','ko']){await select.selectOption(value);assert.equal(await select.inputValue(),value);}
    }else{
     await select.focus();await page.keyboard.press('Home');assert.notEqual(await select.inputValue(),'ja');
     await page.keyboard.press('ArrowDown');assert.notEqual(await select.inputValue(),'ja');
    }
   }
  });
  await check('automatic primary option says languages are being checked before manifest arrives',async()=>{
   await page.evaluate(()=>{primary.restorePrimaryLanguage('auto');primary.populatePrimaryLangOptions(null);});assert.match(await page.locator('#primary-lang-select').textContent(),/확인 중/);
  });
  await check('track signatures retain unchanged nodes but refresh delimiter-containing labels',async()=>{
   const changed=await page.evaluate(()=>{dual.restoreSecondaryLanguage('en');const t=[{bcp47:'en',label:'영어 | A:B'}];dual.populateSecondaryLangOptions(t);const s=document.querySelector('#secondary-lang-select'),old=s.options[0];dual.populateSecondaryLangOptions(t);const kept=s.options[0]===old;dual.populateSecondaryLangOptions([{bcp47:'en',label:'영어 | A:C'}]);return {kept,label:s.options[0].textContent};});assert.equal(changed.kept,true);assert.equal(changed.label,'영어 | A:C');
  });
  await check('CC/SDH suffix detection handles lower case and parenthesis without duplication',async()=>{
   const labels=await page.evaluate(()=>['Subtitle [cc]','Subtitle (sdh)','Subtitle [ SDH ]'].map(label=>dual.getLocalizedLanguageLabel({label,isCC:true},'en')));assert.deepEqual(labels,['Subtitle [cc]','Subtitle (sdh)','Subtitle [ SDH ]']);
  });
  await check('live recovery notice updates text, callback and parent without losing focus',async()=>{
   await page.evaluate(()=>{window.oldAction=0;window.newAction=0;window.playerClicks=0;document.body.addEventListener('click',()=>playerClicks++);OTTSubHUD.setRecoveryNotice('한국어','원본',()=>oldAction++);});
   await page.locator('.ottsub-recovery-notice button').focus();
   await page.evaluate(()=>OTTSubHUD.setRecoveryNotice('English','Show original',()=>newAction++));
   assert.equal(await page.locator('.ottsub-recovery-notice span').textContent(),'English');assert.equal(await page.locator('.ottsub-recovery-notice button').evaluate(e=>e===document.activeElement),true);
   await page.keyboard.press('Enter');assert.deepEqual(await page.evaluate(()=>[oldAction,newAction,playerClicks]),[0,1,0]);
   await page.evaluate(()=>OTTSubHUD.setRecoveryNotice(null));assert.equal(await page.locator('.ottsub-recovery-notice').count(),0);
  });
  await check('detector cleanup cancels pending frame and removes listener',async()=>{
   const calls=await page.evaluate(async()=>{const d=OTTSubRenderer._controlsHit;let calls=0;d.refresh=()=>calls++;document.dispatchEvent(new PointerEvent('pointermove',{clientX:1,clientY:1}));d.destroy();calls=0;document.dispatchEvent(new PointerEvent('pointermove',{clientX:2,clientY:2}));await new Promise(r=>requestAnimationFrame(r));return calls;});assert.equal(calls,0);
  });
 }finally{console.log(JSON.stringify({passed:!errors.length,total:cases.length,nativeSelectKeyboard:process.platform==='darwin'?'not covered headlessly; enabled selection API checked':'Home/ArrowDown keys checked',cases,errors},null,2));await browser.close();if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
