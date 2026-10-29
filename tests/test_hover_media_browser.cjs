// Real HTMLVideoElement playback, frame callbacks, mouse hit testing and events.
// Only Netflix API/network/ad inputs are simulated. No external media is used.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join((process.env.USERPROFILE || process.env.HOME),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..');
(async()=>{
 const context=await chromium.launchPersistentContext('',{headless:true,channel:'chromium',args:[`--disable-extensions-except=${root}`,`--load-extension=${root}`,'--autoplay-policy=no-user-gesture-required']});
 let failureSnapshot=async()=>null;
 const cases=[],errors=[];const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false,detail:e.message});throw e;}};
 try{
  await context.route('**/*',route=>route.request().url().startsWith('chrome-extension://')?route.continue():route.fulfill({contentType:'text/html',body:'<div data-uia="player" style="width:1000px;height:600px;position:relative"><video muted style="width:1000px;height:600px"></video><div class="player-timedtext">English line</div></div>'}));
  await context.addInitScript(()=>{
   const data=()=>document.documentElement.dataset, video=()=>document.querySelector('video');
   const time=()=>data().ad==='true'?Number(data().adTime):video().currentTime;
   const player={getMovieId:()=>Number(location.pathname.split('/').pop()),getCurrentTime:()=>video().currentTime*1000,
    getTextTrack:()=>({trackId:data().nativeTrack||'EN',isNoneTrack:data().nativeOff==='true',bcp47:data().nativeTrack==='JA'?'ja':'en',rawTrackType:'subtitles'}),getTimedTextTrackList:()=>[]};
   window.netflix={appContext:{state:{playerApp:{getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['one'],getVideoPlayerBySessionId:()=>player},
    getPlaybackStateBySessionId:()=>({currentTime:time()*1000,currentAdBreak:data().ad==='true'?{}:undefined}),
    getOpenPlaybackSessions:()=>[{videoId:player.getMovieId(),currentTime:time()*1000,currentAdBreakState:data().ad==='true'?'start':'end'}]})}}}};
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const cdp=await context.newCDPSession(page),worlds=[];cdp.on('Runtime.executionContextCreated',e=>worlds.push(e.context));await cdp.send('Runtime.enable');
  await page.goto('https://www.netflix.com/watch/700');
  let world;
  for(let i=0;i<40&&!world;i++){
   for(const w of worlds)try{if((await cdp.send('Runtime.evaluate',{contextId:w.id,expression:'typeof OTTSubPlaybackClock === "function"',returnByValue:true})).result.value){world=w.id;break;}}catch{}
   if(!world)await page.waitForTimeout(50);
  }
  assert(world);
  const isolated=async expression=>{const r=await cdp.send('Runtime.evaluate',{contextId:world,expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const extensionId=await isolated('chrome.runtime.id');
  // Keep causal evidence when a real decoder stalls; clock-reset alone cannot
  // distinguish a hover timeout from a media-event invalidation.
  await isolated(`window.testClockResets=[];const reset=OTTSubPlaybackClock.prototype.reset;
    OTTSubPlaybackClock.prototype.reset=function(...args){
      const video=document.querySelector('video');testClockResets.push({at:performance.now(),time:video?.currentTime,
        paused:video?.paused,readyState:video?.readyState,stack:new Error().stack});
      if(testClockResets.length>100)testClockResets.shift();return reset.apply(this,args);
    };`);
  await isolated(`window.fetch=async url=>({url,ok:true,status:200,text:async()=>url.includes('/ja')?
    'WEBVTT\\n\\n00:00:01.000 --> 00:00:01.600\\n原文一\\n\\n00:00:02.000 --> 00:00:02.600\\n原文二\\n\\n00:00:03.000 --> 00:00:03.600\\n原文三\\n':
    'WEBVTT\\n\\n00:00:00.000 --> 00:01:00.000\\n'+(url.includes('/ko')?'한국어 대사':'English line')+'\\n'});chrome.storage.local.set({ottsub_hover_pause:true,ottsub_secondary_lang:'ko',ottsub_blur_target:'none'});`);
  const control=await context.newPage();await control.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  const status=()=>control.evaluate(async()=>{const [t]=await chrome.tabs.query({url:'https://www.netflix.com/watch/*'});return chrome.tabs.sendMessage(t.id,{action:'getStatus'});});
  failureSnapshot=async()=>({status:await status(),resets:await isolated('testClockResets'),rows:await isolated('__ottsubLocalDiagnostics.snapshot().rows.slice(-1200)'),media:await page.evaluate(()=>({time:document.querySelector('video').currentTime,duration:document.querySelector('video').duration,paused:document.querySelector('video').paused,events:window.mediaEvents}))});
  await page.bringToFront();
  // Encode six seconds of our own blank moving canvas, then play the actual
  // decoded WebM at 0.5x. Do not override pause/play/currentTime/frame callbacks.
  await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;
   const drawing=canvas.getContext('2d');let n=0;
   const timer=setInterval(()=>{drawing.fillStyle=n++%2?'#222':'#333';drawing.fillRect(0,0,320,180);},50);
   const stream=canvas.captureStream(20),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'}),chunks=[];
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start();await new Promise(resolve=>setTimeout(resolve,6000));recorder.stop();await done;
   clearInterval(timer);stream.getTracks().forEach(t=>t.stop());
   const video=document.querySelector('video');video.src=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));video.muted=true;video.playbackRate=0.5;
   window.mediaEvents=[];for(const name of ['play','playing','pause','seeking','seeked','ended','waiting','stalled','loadedmetadata','loadeddata','emptied','ratechange'])video.addEventListener(name,()=>mediaEvents.push({name,at:performance.now(),time:video.currentTime,paused:video.paused,readyState:video.readyState}));
   await video.play();
  });
  await page.evaluate(()=>{
   const track=lang=>({trackId:lang.toUpperCase(),bcp47:lang,ttDownloadables:{'webvtt-lssdh-ios8':{downloadUrls:{a:'https://cdn.nflxvideo.net/'+lang}}}});
   JSON.parse(JSON.stringify({movieId:700,timedtexttracks:['en','ko','ja'].map(track)}));
  });
  await page.waitForFunction(()=>document.querySelector('.ottsub-line-secondary')?.textContent.includes('한국어'),null,{timeout:6000});
  const moveTo=async lang=>{const box=await page.locator(`.ottsub-bottom .ottsub-line-${lang}`).boundingBox();assert(box);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);};
  const paused=()=>page.waitForFunction(()=>document.querySelector('video').paused,null,{timeout:2000});
  const playing=()=>page.waitForFunction(()=>!document.querySelector('video').paused,null,{timeout:2000});
  await check('locked hover releases real video and real pointer reaches a timeline overlapping text',async()=>{
   await isolated('OTTSubRenderer.setLockPosition(true)');await moveTo('secondary');await paused();
   const before=await page.locator('.ottsub-bottom .ottsub-line-secondary').boundingBox();
   await isolated(`(()=>{const p=OTTSubRenderer.container.parentElement,r=p.getBoundingClientRect(),line=OTTSubRenderer.bottomBox.querySelector('.ottsub-line-secondary').getBoundingClientRect();const bar=document.createElement('div');bar.dataset.uia='timeline';bar.id='test-timeline';bar.style.cssText='position:absolute;z-index:1;left:0;width:100%;height:12px;top:'+(line.y+line.height/2-r.y-6)+'px';bar.addEventListener('pointerdown',e=>{if(e.isTrusted)bar.dataset.clicked='true';});p.append(bar);})()`);
   await page.mouse.move(before.x+before.width/2+1,before.y+before.height/2);await playing();
   await page.mouse.down();await page.mouse.up();assert.equal(await page.locator('#test-timeline').getAttribute('data-clicked'),'true');
   const after=await page.locator('.ottsub-bottom .ottsub-line-secondary').boundingBox();assert.equal(after.y,before.y);
   await page.locator('#test-timeline').evaluate(el=>el.remove());await page.mouse.move(2,2);
  });
  await check('turning hover pause off releases an owned pause but preserves a manual pause',async()=>{
   await playing();await moveTo('primary');await paused();
   await isolated('new Promise(resolve=>chrome.storage.local.set({ottsub_hover_pause:false},resolve))');
   await playing();await page.mouse.move(2,2);
   await isolated('new Promise(resolve=>chrome.storage.local.set({ottsub_hover_pause:true},resolve))');
   await page.locator('video').evaluate(v=>v.pause());await moveTo('secondary');await page.waitForTimeout(130);
   await isolated('new Promise(resolve=>chrome.storage.local.set({ottsub_hover_pause:false},resolve))');
   await page.mouse.move(2,2);await page.waitForTimeout(130);assert.equal(await page.locator('video').evaluate(v=>v.paused),true);
   await isolated('new Promise(resolve=>chrome.storage.local.set({ottsub_hover_pause:true},resolve))');
   await page.locator('video').evaluate(v=>v.play());
  });
  const recovered=()=>page.waitForFunction(()=>document.body.classList.contains('ottsub-active')&&document.querySelector('.ottsub-line-secondary')?.textContent.includes('한국어'),null,{timeout:6000});
  const ad=async()=>{await page.evaluate(()=>{const d=document.documentElement.dataset;d.adTime=String(document.querySelector('video').currentTime);d.ad='true';const el=document.createElement('span');el.className='mmvz9h';el.textContent='15';document.querySelector('[data-uia="player"]').append(el);});await page.waitForFunction(()=>!document.body.classList.contains('ottsub-active'));};
  const endAd=()=>page.evaluate(()=>{document.documentElement.dataset.ad='false';document.querySelector('.mmvz9h').remove();});
  await check('native ON: real mouse pauses and resumes decoded video, locked and unlocked',async()=>{
   for(const lock of [true,false]){
    await isolated(`OTTSubRenderer.setLockPosition(${lock})`);
    for(const lang of ['primary','secondary']){
     await moveTo(lang);await paused();const before=await page.locator('video').evaluate(v=>v.currentTime);await page.waitForTimeout(160);assert.equal(await page.locator('video').evaluate(v=>v.currentTime),before);
     await page.mouse.move(2,2);await playing();
    }
   }
   assert((await page.evaluate(()=>mediaEvents.filter(e=>e.name==='pause').length))>=4);
  });
  await check('native OFF: ad hides subtitles; real media progress restores both languages',async()=>{
   await page.evaluate(()=>{document.documentElement.dataset.nativeOff='true';document.querySelector('.player-timedtext').textContent='';});
   await ad();await page.waitForTimeout(350);await endAd();await recovered();
   assert.equal((await status()).clockSource,'session');
   const log=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');assert.equal(log.clockVerification,'session-progress');
  });
  await check('controlled waiting/stalled events retain fresh post-ad proof on the same decoded video',async()=>{
   // Deterministic event ordering supplements (does not replace) actual decoder
   // events below. Dispatching these events must not manufacture a clock reset.
   for(const event of ['waiting','stalled']){
    await page.locator('video').evaluate((v,name)=>{if(v.readyState<2)throw Error('No current frame');v.dispatchEvent(new Event(name));},event);
    assert.equal((await status()).displaySuppressed,false,`${event} must not erase valid content-session proof`);
    assert.match(await page.locator('.ottsub-line-secondary').textContent(),/한국어/);
   }
  });
  await check('post-ad locked hover > raw-clock expiry preserves subtitles and resumes real video',async()=>{
   await isolated('OTTSubRenderer.setLockPosition(true)');await moveTo('primary');await paused();
   const before=await page.locator('video').evaluate(v=>v.currentTime);await page.waitForTimeout(2500);
   assert.equal(await page.locator('video').evaluate(v=>v.currentTime),before);assert.equal((await status()).displaySuppressed,false);
   assert.match(await page.locator('.ottsub-line-secondary').textContent(),/한국어/);
   await page.mouse.move(2,2);await playing();await page.waitForTimeout(300);assert.equal((await status()).displaySuppressed,false);
   await isolated('OTTSubRenderer.setLockPosition(false)');await moveTo('secondary');await paused();
   await page.mouse.move(2,2);await playing();
   await isolated('new Promise(resolve=>chrome.storage.local.set({ottsub_hover_pause:false},resolve))');await page.waitForTimeout(100);
   await moveTo('primary');await page.waitForTimeout(180);assert.equal(await page.locator('video').evaluate(v=>v.paused),false);
   await page.mouse.move(2,2);await isolated('new Promise(resolve=>chrome.storage.local.set({ottsub_hover_pause:true},resolve))');
  });
  await check('actual seek revokes old clock and reacquires OFF session without native cues',async()=>{
   await page.locator('video').evaluate(v=>{v.currentTime=0.2;});
   await page.waitForFunction(()=>mediaEvents.some(e=>e.name==='seeked'));await recovered();
   assert.equal((await status()).clockSource,'session');assert.equal((await status()).clockVerified,true);
  });
  await check('ad during hover revokes pause ownership; removing captions never autoplays',async()=>{
   await moveTo('secondary');await paused();const playCount=await page.evaluate(()=>mediaEvents.filter(e=>e.name==='play').length);
   await ad();await page.mouse.move(2,2);await page.waitForTimeout(350);
   assert.equal(await page.locator('video').evaluate(v=>v.paused),true);
   assert.equal(await page.evaluate(()=>mediaEvents.filter(e=>e.name==='play').length),playCount);
   await endAd();await page.locator('video').evaluate(v=>v.play());await recovered();
  });
  await check('user pause remains paused after mouse enter and leave',async()=>{
   await page.locator('video').evaluate(v=>v.pause());await moveTo('primary');await page.waitForTimeout(180);await page.mouse.move(2,2);await page.waitForTimeout(180);
   assert.equal(await page.locator('video').evaluate(v=>v.paused),true);
  });
  await check('native ON silent post-ad recovery renders both languages and preserves real hover ownership',async()=>{
   await page.evaluate(()=>{
    const d=document.documentElement.dataset;d.nativeOff='false';d.nativeTrack='JA';document.querySelector('video').currentTime=0.1;
    document.querySelector('.player-timedtext').textContent='';
   });
   await ad();await page.locator('video').evaluate(v=>v.play());await page.waitForTimeout(250);await endAd();await recovered();
   const log=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
   assert.equal(log.nativeVerification,'ready');assert.equal(log.clockVerification,'session-progress');
   assert.equal(log.nativeLength,0);
   for(const lock of [true,false]){
    await isolated(`OTTSubRenderer.setLockPosition(${lock})`);await moveTo('primary');await paused();await page.waitForTimeout(lock?2500:180);
    assert.equal((await status()).displaySuppressed,false);await page.mouse.move(2,2);await playing();
   }
  });
  assert.equal(errors.length,0);console.log(JSON.stringify({browserVersion:context.browser().version(),total:cases.length,passed:true,cases,errors,mediaEvents:await page.evaluate(()=>mediaEvents)},null,2));
 }catch(e){console.log(JSON.stringify({total:cases.length,passed:false,cases,errors,diagnostics:await failureSnapshot().catch(()=>null)},null,2));throw e;}finally{await context.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
