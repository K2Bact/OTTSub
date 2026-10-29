const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,popup,root}=require('./helpers/offline-popup.cjs');
const {supportedUILocales}=require('./helpers/ui-locales.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 const out=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/accessibility-quality');fs.mkdirSync(out,{recursive:true});
 const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
 try{
  for(const locale of supportedUILocales()){
   const {context,page}=await popup(browser,{locale,width:320});page.on('pageerror',e=>errors.push(e.message));
   await page.waitForFunction(()=>document.getElementById('status-badge').classList.contains('active'));
   await page.emulateMedia({reducedMotion:'reduce'});for(const button of await page.locator('.card-toggle-btn').all())if(await button.getAttribute('aria-expanded')==='false')await button.click();
   await check(`${locale}: readable text contrast, named controls and 320 CSS-pixel reflow`,async()=>{
    const r=await page.evaluate(()=>{
     const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
     const over=(f,b)=>{const a=f[3]??1;return f.slice(0,3).map((v,i)=>v*a+b[i]*(1-a));};
     const bg=el=>{const chain=[];for(let p=el;p;p=p.parentElement)chain.unshift(rgb(getComputedStyle(p).backgroundColor));return chain.reduce((b,f)=>over(f,b),[255,255,255]);};
     const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
     const failures=[];
     for(const el of document.querySelectorAll('body *')){
      if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())||!el.getClientRects().length||el.closest('[hidden],.collapsed .card-body,.collapsed .learning-body')||el.closest('.logo-title,.color-chip'))continue;
      const css=getComputedStyle(el);if(css.visibility==='hidden'||parseFloat(css.opacity)===0||el.closest(':disabled'))continue;
      const back=bg(el),color=over(rgb(css.color),back),a=lum(color),b=lum(back),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      const large=parseFloat(css.fontSize)>=24||parseFloat(css.fontSize)>=18.66&&parseInt(css.fontWeight,10)>=700;
      if(ratio<(large?3:4.5))failures.push({element:el.id||el.className,ratio:Math.round(ratio*100)/100,color:css.color,text:el.textContent.trim().slice(0,35)});
     }
     const unnamed=[...document.querySelectorAll('button,input,select')].filter(el=>el.getClientRects().length&&!el.closest('[hidden]')&&!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')&&!el.textContent.trim()&&!el.closest('label')?.textContent.trim()).map(el=>el.id);
     return{failures,unnamed,overflow:document.documentElement.scrollWidth>innerWidth};
    });assert.deepEqual(r.failures,[],JSON.stringify(r.failures));assert.deepEqual(r.unnamed,[]);assert.equal(r.overflow,false);
   });
   await check(`${locale}: forced colors retain a non-color selected state and keyboard focus`,async()=>{
    await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
    const chip=page.locator('#primary-color-palette .color-chip').first();await chip.focus();
    const state=await chip.evaluate(el=>({role:el.getAttribute('role'),checked:el.getAttribute('aria-checked'),outline:getComputedStyle(el).outlineStyle,focus:el===document.activeElement,forced:matchMedia('(forced-colors: active)').matches}));
    assert.equal(state.role,'radio');assert.equal(state.checked,'true');assert(state.focus&&state.forced);assert.notEqual(state.outline,'none');
    assert.equal(await page.locator('#sync-card-primary').getAttribute('aria-selected'),'true');
    const toggle=page.locator('#dual-toggle');
    const before=await toggle.evaluate(el=>{const knob=getComputedStyle(el.nextElementSibling,'::before');return {checked:el.checked,knob:knob.backgroundColor,track:getComputedStyle(el.nextElementSibling).backgroundColor,position:knob.transform};});
    assert.notEqual(before.knob,before.track,'forced-color switch thumb must contrast with its track');
    await toggle.focus();await page.keyboard.press('Space');
    await page.waitForFunction(position=>getComputedStyle(document.querySelector('#dual-toggle + .slider-round'),'::before').transform!==position,before.position,{timeout:1500});
    const after=await toggle.evaluate(el=>{const knob=getComputedStyle(el.nextElementSibling,'::before');return {checked:el.checked,knob:knob.backgroundColor,track:getComputedStyle(el.nextElementSibling).backgroundColor,position:knob.transform,outline:getComputedStyle(el.nextElementSibling).outlineStyle};});
    assert.notEqual(after.checked,before.checked);assert.notEqual(after.position,before.position,'switch state is also shown by position');assert.notEqual(after.knob,after.track);assert.notEqual(after.outline,'none');
    await page.keyboard.press('Space');
    if(['en','ar','th'].includes(locale))await page.screenshot({path:path.join(out,`forced-colors-${locale}.png`),fullPage:true});
   });
   await context.close();
  }
  for(const locale of ['en','ar','th']){
   const {context,page}=await popup(browser,{locale,width:640});
   await check(`${locale}: 200 percent text enlargement keeps controls within the panel`,async()=>{
    await page.evaluate(()=>{const sizes=[...document.querySelectorAll('body *')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);for(const[el,size]of sizes)el.style.fontSize=size*2+'px';});
    const r=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,offscreen:[...document.querySelectorAll('button,input,select')].filter(el=>el.getClientRects().length).filter(el=>{const r=el.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5;}).map(el=>el.id)}));
    assert.equal(r.overflow,false);assert.deepEqual(r.offscreen,[]);await page.screenshot({path:path.join(out,`large-text-${locale}.png`),fullPage:true});
   });await context.close();
  }
 }finally{await browser.close();console.log(JSON.stringify({passed:cases.length>0&&!errors.length,total:cases.length,cases,errors},null,2));if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
