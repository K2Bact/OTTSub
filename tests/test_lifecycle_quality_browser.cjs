const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,root}=require('./helpers/offline-popup.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<div data-uia="player" style="position:relative;width:900px;height:600px"><video style="width:900px;height:600px"></video></div>'}));await page.goto('https://ottsub.test/watch/1');
  await page.evaluate(()=>{
   // Track only global roots and media queries, never detached DOM nodes.
   const add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;
   window.resources=[];const relevant=t=>t===window||t===document||t instanceof MediaQueryList;
   EventTarget.prototype.addEventListener=function(type,fn,opt){if(relevant(this)&&!resources.some(r=>r.target===this&&r.type===type&&r.fn===fn&&r.capture===!!(typeof opt==='boolean'?opt:opt?.capture)))resources.push({target:this,type,fn,capture:!!(typeof opt==='boolean'?opt:opt?.capture)});return add.call(this,type,fn,opt);};
   EventTarget.prototype.removeEventListener=function(type,fn,opt){const capture=!!(typeof opt==='boolean'?opt:opt?.capture);resources=resources.filter(r=>r.target!==this||r.type!==type||r.fn!==fn||r.capture!==capture);return remove.call(this,type,fn,opt);};
   const NativeResizeObserver=ResizeObserver;window.activeObservers=new Set();
   window.ResizeObserver=class extends NativeResizeObserver{observe(...args){activeObservers.add(this);return super.observe(...args);}disconnect(){activeObservers.delete(this);return super.disconnect();}};
   window.frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  });
  for(const file of ['src/interaction/controls-hit-detector.js','src/renderer.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});
  await check('destroy cancels queued fullscreen work without resurrecting the overlay',async()=>{
   const r=await page.evaluate(async()=>{OTTSubRenderer.ensureMounted(document.querySelector('video'));document.dispatchEvent(new Event('fullscreenchange'));OTTSubRenderer.destroy();await frames();return {container:!!OTTSubRenderer.container,nodes:document.querySelectorAll('#ottsub-container').length};});
   assert.deepEqual(r,{container:false,nodes:0});
  });
  await check('300 mount/render/destroy cycles return global listeners, observers and overlay nodes to baseline',async()=>{
   const cdp=await page.context().newCDPSession(page);await cdp.send('HeapProfiler.collectGarbage');
   const before=await cdp.send('Runtime.getHeapUsage');
   const r=await page.evaluate(async()=>{
    OTTSubRenderer.destroy();await frames();const baseline=resources.length;
    for(let i=0;i<300;i++){
     if(i%15===0){const old=document.querySelector('video'),v=old.cloneNode();old.replaceWith(v);}
     OTTSubRenderer.ensureMounted(document.querySelector('video'));
     OTTSubRenderer.renderDual({top:[],bottom:[{begin:0,end:1e6,text:'Cycle '+i}]},{top:[],bottom:[]},{isDualMode:false});
     if(document.querySelectorAll('#ottsub-container').length!==1)throw Error('duplicate overlay '+i);
     if(i%10===0)document.dispatchEvent(new Event('fullscreenchange'));
     OTTSubRenderer.destroy();OTTSubRenderer.destroy();await frames();
     if(resources.length!==baseline||activeObservers.size||document.querySelector('#ottsub-container'))throw Error('retained resources '+JSON.stringify({i,baseline,listeners:resources.map(r=>r.type),observers:activeObservers.size}));
    }return {cycles:300,baseline,listeners:resources.length,observers:activeObservers.size};
   });assert.equal(r.listeners,r.baseline);assert.equal(r.observers,0);
   await cdp.send('HeapProfiler.collectGarbage');const after=await cdp.send('Runtime.getHeapUsage');
   assert(after.usedSize-before.usedSize<3*1024*1024,JSON.stringify({before,after}));
   cases.push({name:'garbage-collected heap growth after 300 cycles stays below 3 MiB',passed:true,deltaBytes:after.usedSize-before.usedSize});await cdp.detach();
  });
  await check('500 destroyed popup subscriptions reject delayed reads and events without retaining listeners',async()=>{
   const code=fs.readFileSync(path.join(root,'popup/modules/settings-binding.js'),'utf8');
   const r=await page.evaluate(async code=>{
    const {bindPopupSettings}=await import(URL.createObjectURL(new Blob([code],{type:'text/javascript'})));let applied=0,late=0;const listeners=new Set();
    for(let i=0;i<500;i++){
     let callback;const storage={local:{get:(keys,cb)=>{callback=cb;}},onChanged:{addListener:fn=>listeners.add(fn),removeListener:fn=>listeners.delete(fn)}};
     const binding=bindPopupSettings({storage,keys:['x'],selectChanges:c=>Object.fromEntries(Object.entries(c).map(([k,v])=>[k,v.newValue])),apply:()=>applied++});
     const saved=[...listeners];saved[0]({x:{newValue:i}},'local');binding.destroy();binding.destroy();const before=applied;
     callback({x:-1});saved[0]({x:{newValue:-1}},'local');if(applied!==before)late++;
     if(listeners.size)throw Error('retained popup listener');
    }return {applied,late,listeners:listeners.size};
   },code);assert.deepEqual(r,{applied:500,late:0,listeners:0});
  });
 }finally{await browser.close();console.log(JSON.stringify({passed:cases.length>0&&!errors.length,total:cases.length,cases,errors},null,2));if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
