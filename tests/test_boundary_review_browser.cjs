const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,popup,root}=require('./helpers/offline-popup.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
 try{
  const {page,context}=await popup(browser,{locale:'en',extra:`Object.assign(savedSettings,{ottsub_offset:{toString:null,valueOf:0},ottsub_primary_scale:{toString:1},ottsub_primary_color:{toString:null},ottsub_secondary_offset:250});`});page.on('pageerror',e=>errors.push(e.message));
  await check('real popup rejects damaged setting objects but restores independent valid values',async()=>{
   await page.waitForFunction(()=>document.getElementById('secondary-sync-value').textContent==='+0.3s');
   const state=await page.evaluate(async()=>{const sync=await import('/popup/modules/ui-sync.js');return{primary:sync.getCurrentPrimaryOffsetMs(),secondary:sync.getCurrentSecondaryOffsetMs(),overflow:document.documentElement.scrollWidth>innerWidth};});
   assert.deepEqual(state,{primary:0,secondary:250,overflow:false});
   await page.locator('#sync-card-secondary').click();assert.equal(await page.locator('#sync-card-secondary').getAttribute('aria-selected'),'true');await page.keyboard.press('ArrowLeft');
   await page.waitForFunction(()=>document.getElementById('sync-card-primary').getAttribute('aria-selected')==='true');
   assert.equal(await page.locator('#sync-card-secondary').getAttribute('aria-selected'),'false');
  });await context.close();
  const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<div data-uia="player" style="position:relative;width:900px;height:650px"><video style="width:900px;height:650px"></video></div>'}));await p.goto('https://ottsub.test/watch/1');
  for(const file of ['src/parser.js','src/sync-engine.js','src/renderer.js'])await p.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});await p.addStyleTag({content:fs.readFileSync(path.join(root,'src/styles.css'),'utf8')});
  await check('malformed WebVTT headers stay offscreen while the following valid cue still renders',async()=>{
   const state=await p.evaluate(()=>{const cues=OTTSubParser.parse('WEBVTT\n\n-00:00:01.000 --> 00:00:02.000\nINVALID\n\ncue-2\n00:00:03.000 --> 00:00:05.000 line:80%\nVALID <i>text</i>\n');OTTSubSyncEngine.setCues('1',cues);OTTSubRenderer.ensureMounted(document.querySelector('video'));const early=OTTSubSyncEngine.getActiveCues(1.5);OTTSubRenderer.renderDual(early,{top:[],bottom:[]},{isDualMode:false});const old=OTTSubRenderer.bottomBox.textContent;OTTSubRenderer.renderDual(OTTSubSyncEngine.getActiveCues(3.5),{top:[],bottom:[]},{isDualMode:false});return{count:cues.length,early:early.totalActive,old,text:OTTSubRenderer.bottomBox.textContent,italic:!!OTTSubRenderer.bottomBox.querySelector('i')};});
   assert.equal(state.count,1);assert.equal(state.early,0);assert.equal(state.old,'');assert.equal(state.text,'VALID text');assert(state.italic);
   const out=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/boundary-review');fs.mkdirSync(out,{recursive:true});await p.screenshot({path:path.join(out,'vtt-boundary.png')});
  });
  await check('single subtitles use available width while long text and explicit line breaks still wrap',async()=>{
   const measurements=await p.evaluate(()=>{
    const r=OTTSubRenderer,box=r.bottomBox;
    const render=(text,dual=false)=>r.renderDual({top:[],bottom:[{id:text,text}]},{top:[],bottom:dual?[{id:'secondary',text:'SECONDARY'}]:[]},{isDualMode:dual});
    const measure=()=>{
     const line=box.querySelector('.ottsub-line-primary'),range=document.createRange();range.selectNodeContents(line);
     const rect=line.getBoundingClientRect(),video=document.querySelector('video').getBoundingClientRect();
     return {text:line.textContent,lines:[...new Set([...range.getClientRects()].filter(x=>x.width>0&&x.height>0).map(x=>Math.round(x.top)))].length,
      left:rect.left,right:rect.right,videoLeft:video.left,videoRight:video.right,wrapperWidth:box.querySelector('.ottsub-slots-wrapper').getBoundingClientRect().width};
    };
    const short=['A short sentence','VALID <i>text</i>','مرحبا بالعالم','ข้อความสั้น'].map(text=>{render(text);return measure();});
    render(('A longer sentence with العربية and ภาษาไทย. ').repeat(8));const long=measure();
    render('First line\nSecond line');const explicit=measure();
    render('Mode switch',true);const dual=box.classList.contains('is-dual');render('Mode switch');const restored=measure();
    return {short,long,explicit,dual,restored};
   });
   const out=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/boundary-review');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'single-wrap-measurements.json'),JSON.stringify(measurements,null,2));
   for(const state of measurements.short){assert.equal(state.lines,1,state.text);assert(state.wrapperWidth>700);}
   assert(measurements.long.lines>1);assert(measurements.long.left>=measurements.long.videoLeft&&measurements.long.right<=measurements.long.videoRight);
   assert.equal(measurements.explicit.lines,2);assert(measurements.dual);assert.equal(measurements.restored.lines,1);
  });
  await check('single subtitle empty space passes clicks through and the text still drags',async()=>{
   const points=await p.evaluate(()=>{
    const r=OTTSubRenderer;r.resetCustomPosition(false);r.renderDual({top:[],bottom:[{id:'click',text:'A short sentence'}]},{top:[],bottom:[]},{isDualMode:false});
    const line=r.bottomBox.querySelector('.ottsub-line-primary'),a=line.getBoundingClientRect(),b=r.bottomBox.getBoundingClientRect();
    const text={x:a.left+a.width/2,y:a.top+a.height/2},empty={x:b.left+20,y:text.y};
    return {text,empty,textHit:!!document.elementFromPoint(text.x,text.y)?.closest('.ottsub-line'),emptyHit:!!document.elementFromPoint(empty.x,empty.y)?.closest('#ottsub-container')};
   });
   assert(points.textHit);assert(!points.emptyHit);
   await p.mouse.move(points.empty.x,points.empty.y);await p.mouse.down();assert.equal(await p.evaluate(()=>OTTSubRenderer.isDragging),false);await p.mouse.up();
   await p.mouse.move(points.text.x,points.text.y);await p.mouse.down();assert.equal(await p.evaluate(()=>OTTSubRenderer.isDragging),true);
   await p.mouse.move(points.text.x+25,points.text.y-20,{steps:3});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await p.mouse.up();
   const moved=await p.evaluate(()=>({dragging:OTTSubRenderer.isDragging,x:OTTSubRenderer.customPosX,y:OTTSubRenderer.customPosY}));assert(!moved.dragging);assert(moved.x>0&&moved.y<0);
   await p.evaluate(()=>OTTSubRenderer.resetCustomPosition(false));
   const out=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/boundary-review');fs.mkdirSync(out,{recursive:true});await p.screenshot({path:path.join(out,'single-short-caption.png')});
  });await p.close();
 }finally{await browser.close();console.log(JSON.stringify({passed:cases.length>0&&!errors.length,total:cases.length,cases,errors},null,2));if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
