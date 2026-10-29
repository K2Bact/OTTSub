const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join((process.env.USERPROFILE || process.env.HOME),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..'),cases=[],errors=[];
const artifacts=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/test_review38_browser');fs.mkdirSync(artifacts,{recursive:true});
const source=file=>fs.readFileSync(path.join(root,file),'utf8');
async function check(name,fn){try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1000,height:700}});page.setDefaultTimeout(5000);
  await page.route('**/*',r=>r.fulfill({contentType:r.request().url().includes('/manifest')?'application/json':'text/html',body:r.request().url().includes('/manifest')?JSON.stringify({movieId:100,timedtexttracks:[{trackId:'en',bcp47:'en',ttDownloadables:{webvtt:{downloadUrls:{a:'https://cdn.nflxvideo.net/en'}}}}]}):'<html><body></body></html>'}));
  await page.goto('https://www.netflix.com/watch/100');
  await page.evaluate(()=>{window.events=[];window.clones=new WeakSet();window.failClone=false;const clone=Response.prototype.clone,json=Response.prototype.json;Response.prototype.clone=function(){const r=clone.call(this);clones.add(r);return r;};Response.prototype.json=function(...args){if(failClone&&clones.has(this))return Promise.reject(new Error('controlled clone failure'));return json.apply(this,args);};addEventListener('ottsub_manifest_data',e=>events.push(e.detail));});
  for(const f of ['src/core/track-languages.js','src/inject.js','src/parser.js','src/renderer.js'])await page.addScriptTag({content:source(f)});
  await page.addStyleTag({content:source('src/styles.css')});
  await check('one capture preserves original body with either consumer order',async()=>{
   await page.evaluate(async()=>{window.response=await fetch('/manifest');});await page.waitForFunction(()=>events.length===1);assert.equal(await page.evaluate(()=>response.bodyUsed),false);await page.evaluate(()=>response.json());assert.equal(await page.evaluate(()=>events.length),1);
   const count=await page.evaluate(async()=>{const r=await fetch('/manifest?again');const body=await r.json();await new Promise(resolve=>setTimeout(resolve,30));return{events:events.length,movieId:body.movieId};});assert.equal(count.events,2);assert.equal(count.movieId,100);
  });
  await check('clone failure keeps original JSON fallback',async()=>{
   const count=await page.evaluate(async()=>{failClone=true;const r=await fetch('/manifest?fallback');await r.json();await new Promise(resolve=>setTimeout(resolve,30));failClone=false;return events.length;});assert.equal(count,3);
  });
  await check('same-identity manifest hydration is still observed',async()=>{
   const data=await page.evaluate(()=>{const m={movieId:100,timedtexttracks:[{trackId:'same',bcp47:'es-ES'}]};JSON.parse(JSON.stringify(m));m.timedtexttracks[0].ttDownloadables={webvtt:{downloadUrls:{a:'https://cdn.nflxvideo.net/new'}}};JSON.parse(JSON.stringify(m));return{count:events.length,urls:__OTT_SUB_MANIFEST_STORE__['100'].tracksByLang['es-es']};});assert.equal(data.count,5);assert.deepEqual(data.urls,['https://cdn.nflxvideo.net/new']);
  });
  await check('TTML referenced and inherited emphasis honors child normal overrides in DOM',async()=>{
   const data=await page.evaluate(()=>{const xml='<tt xmlns:tts="http://www.w3.org/ns/ttml#styling"><head><styling><style xml:id="all" tts:fontWeight="bold" tts:fontStyle="italic" tts:textDecoration="underline"/></styling></head><body><div><p begin="1s" end="3s" style="all">A<span tts:fontStyle="normal">B</span></p></div></body></tt>';const cue=OTTSubParser.parse(xml)[0],line=OTTSubRenderer._createLineElement(cue.text);document.body.replaceChildren(line);return{text:line.textContent,html:line.innerHTML,bold:!!line.querySelector('b'),underline:!!line.querySelector('u'),italics:line.querySelector('i')?.textContent};});assert.equal(data.text,'AB');assert(data.bold&&data.underline);assert.equal(data.italics,'A');
   assert.equal(await page.evaluate(()=>OTTSubRenderer._createLineElement('<3 & 2').textContent),'<3 & 2');
  });
  await check('mixed RTL controls/joins and nested VTT emphasis survive without active attributes',async()=>{
   const data=await page.evaluate(()=>{const text='هذه C++\u200E. \u2066Netflix\u2069 می\u200Cروم',cue=OTTSubParser.parse('WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n<b onclick="window.attacked=true"><i>'+text+'</i></b><img onerror="window.attacked=true">')[0],line=OTTSubRenderer._createLineElement(cue.text);document.body.replaceChildren(line);return{original:text,text:line.textContent,both:!!line.querySelector('b i, i b'),direction:getComputedStyle(line).direction,active:!!line.querySelector('[onclick],[onerror],img,script'),attacked:!!window.attacked};});assert.equal(data.text,data.original);assert(data.both);assert.equal(data.direction,'rtl');assert.equal(data.active,false);assert.equal(data.attacked,false);await page.screenshot({path:path.join(artifacts,'rtl-emphasis.png')});
  });
  await page.addStyleTag({content:source('src/styles.css')});
  await page.evaluate(()=>{document.body.innerHTML='<div data-uia="player" style="position:relative;width:1000px;height:600px"><video style="width:1000px;height:600px"></video></div>';OTTSubRenderer.ensureMounted(document.querySelector('video'));});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await check('resize cancels captured drag and queued moves while preserving position',async()=>{
   await page.evaluate(()=>{const r=OTTSubRenderer;r.setCustomPosition(4,2);r.bottomBox.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'mouse',button:0,pointerId:4,clientX:500,clientY:400,bubbles:true}));document.querySelector('video').style.width='500px';});await page.waitForFunction(()=>!OTTSubRenderer.isDragging);
   const data=await page.evaluate(async()=>{const r=OTTSubRenderer;r.bottomBox.dispatchEvent(new PointerEvent('pointermove',{pointerId:4,clientX:600,clientY:400,bubbles:true}));await new Promise(resolve=>requestAnimationFrame(resolve));return{x:r.customPosX,y:r.customPosY,dragging:r.container.classList.contains('is-dragging'),pointer:r._dragPointer};});assert.equal(data.x,4);assert.equal(data.y,2);assert.equal(data.dragging,false);assert.equal(data.pointer,null);
  });
  await check('fullscreen transition ends drag before remount',async()=>{
   const data=await page.evaluate(()=>{const r=OTTSubRenderer;r.bottomBox.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'mouse',button:0,pointerId:8,clientX:300,clientY:200,bubbles:true}));document.dispatchEvent(new Event('fullscreenchange'));return{dragging:r.isDragging,frame:r._dragRafId};});assert.equal(data.dragging,false);assert.equal(data.frame,null);
  });
 }finally{await browser.close();console.log(JSON.stringify({passed:!errors.length,total:cases.length,cases,errors},null,2));if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
