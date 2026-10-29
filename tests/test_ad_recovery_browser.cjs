// Full unpacked product extension: real MAIN/ISOLATED worlds, mocked media/network.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join((process.env.USERPROFILE || process.env.HOME), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }
const root = path.resolve(__dirname, '..');
const traceDir=path.resolve(process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual'));
assert(traceDir.startsWith(root+path.sep));fs.mkdirSync(traceDir,{recursive:true});
const traceStart=Date.now(),traceFile=path.join(traceDir,`ad-recovery-phases-${process.pid}.ndjson`);
const trace=(phase,detail={})=>fs.appendFileSync(traceFile,JSON.stringify({at:new Date().toISOString(),elapsedMs:Date.now()-traceStart,phase,freeMemory:require('node:os').freemem(),...detail})+'\n');
trace('suite:start');
(async () => {
  const context = await chromium.launchPersistentContext('', { headless: true, channel: 'chromium',
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`] });
  trace('browser:launched');
  const cases = [], errors = [];
  const check = async (name, fn) => {
    trace('case:start',{name});
    try { await fn(); cases.push({name,passed:true});trace('case:pass',{name}); }
    catch(e) { cases.push({name,passed:false,detail:e.message});trace('case:fail',{name,error:e.message});throw e; }
  };
  try {
    await context.route('**/*', route => route.request().url().startsWith('chrome-extension://') ? route.continue() : route.fulfill({ contentType:'text/html', body:
      '<div data-uia="player" style="width:1000px;height:600px"><video style="width:1000px;height:600px"></video><div class="player-timedtext"></div></div>' }));
    await context.addInitScript(() => {
      performance.now = () => Number(document.documentElement?.dataset.now || 0);
      const data = () => document.documentElement.dataset;
      const player = { getMovieId: () => Number(location.pathname.match(/\d+/)?.[0]), getCurrentTime: () => (Number(data().base || 10) + Number(data().playerShift || 0)) * Number(data().unit || 1000),
        getTextTrack: () => ({ trackId: data().nativeTrackId || 'PRIVATE_NATIVE_TRACK', isNoneTrack: data().nativeOff === 'true', bcp47: data().nativeLang || 'ko', rawTrackType: 'closedcaptions', displayName: 'PRIVATE_DISPLAY_NAME' }),
        getTimedTextTrackList: () => [], setTimedTextTrack() { data().hydrations = String(Number(data().hydrations || 0)+1); } };
      window.netflix = { appContext: { state: { playerApp: { getAPI: () => ({
        getPlaybackStateBySessionId: () => data().sessionApi === 'missing' ? null : ({ currentTime: (Number(data().base || 10) + Number(data().sessionLag || 0)) * 1000,
          currentAdBreak: data().sessionAd === 'start' ? { privateUrl: 'https://PRIVATE_AD_URL/' } : undefined }),
        getOpenPlaybackSessions: () => data().sessionApi === 'missing' ? [] : [{ videoId: Number(location.pathname.match(/\d+/)?.[0]),
          currentTime: (Number(data().base || 10) + Number(data().sessionLag || 0)) * 1000, currentAdBreakState: data().sessionAd || 'end' }],
        videoPlayer: {
        getAllPlayerSessionIds: () => data().multi === 'true' ? ['one','two'] : [data().session || 'one'],
        getVideoPlayerBySessionId: () => player
      } }) } } } };
      HTMLMediaElement.prototype.play = () => Promise.reject(new Error('test: unexpected play'));
      HTMLMediaElement.prototype.pause = () => { throw new Error('test: unexpected pause'); };
      Object.defineProperty(HTMLMediaElement.prototype,'currentTime',{get:()=>Number(data().media || 10)});
    });
    const page = await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
    const cdp = await context.newCDPSession(page), worlds = [];
    cdp.on('Runtime.executionContextCreated',e=>worlds.push(e.context));
    await cdp.send('Runtime.enable');
    await page.goto('https://www.netflix.com/watch/100');
    let world;
    for(let attempt=0;attempt<40&&!world;attempt++) {
      for(const candidate of worlds) {
        try { const r=await cdp.send('Runtime.evaluate',{contextId:candidate.id,expression:'typeof window.OTTSubPlaybackClock === "function"',returnByValue:true}); if(r.result.value) {world=candidate.id;break;} } catch(_) {}
      }
      if(!world) await page.waitForTimeout(50);
    }
    assert(world,'product ISOLATED context must load');
    const isolated = async expression => {
      const result=await cdp.send('Runtime.evaluate',{contextId:world,expression,returnByValue:true,awaitPromise:true});
      if(result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const extensionId=await isolated('chrome.runtime.id');
    await isolated(`(() => {
      performance.now=()=>Number(document.documentElement.dataset.now||0);
      const data=()=>document.documentElement.dataset;
      for(const [key,get] of Object.entries({currentTime:()=>Number(data().media||10),paused:()=>false,readyState:()=>4,ended:()=>false,seeking:()=>false,playbackRate:()=>1})) Object.defineProperty(HTMLMediaElement.prototype,key,{get});
      window.testFrames=new Map();let frameId=0;
      HTMLVideoElement.prototype.requestVideoFrameCallback=callback=>{testFrames.set(++frameId,callback);return frameId;};
      HTMLVideoElement.prototype.cancelVideoFrameCallback=id=>testFrames.delete(id);
      window.requests=[];
      window.fetch=async url=>{ requests.push(url); const ko=url.includes('/ko'); const bad=url.includes('BAD');
        return {url,ok:true,status:200,text:async()=> 'WEBVTT\\n\\n00:00:10.000 --> 00:00:10.800\\n'+(bad?'BAD FIRST':ko?'첫 대사':url.includes('/es')?'Primera frase':'First phrase')+'\\n\\n00:00:11.000 --> 00:00:12.000\\n'+(bad?'BAD SECOND':ko?'둘째 대사':url.includes('/es')?'Segunda frase':'Second phrase')+'\\n'};
      };
      window.emitTestManifest=(suffix='')=>dispatchEvent(new CustomEvent('ottsub_manifest_data',{detail:{source:'ottsub_injected',movieId:location.pathname.match(/\\d+/)[0],urls:['https://cdn.nflxvideo.net/en'+suffix],tracksByLang:{ko:['https://cdn.nflxvideo.net/ko'+suffix],'es-419':['https://cdn.nflxvideo.net/es'+suffix]},availableTracks:[{language:'ko',bcp47:'ko'},{language:'es',bcp47:'es-419'}]}}));
      window.settleTest=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
    })()`);
    const popup=await context.newPage();
    popup.on('pageerror',e=>errors.push(e.message));
    // An extension page opened as a test tab is not a toolbar popup. Bind its
    // active-tab query to our Netflix fixture, as a toolbar popup would be bound.
    await popup.addInitScript(() => {
      const query=chrome.tabs.query.bind(chrome.tabs);
      chrome.tabs.query=(options,callback)=>query(options?.active?{url:'https://www.netflix.com/watch/*'}:options,callback);
    });
    await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    const status=()=>popup.evaluate(async()=>{
      const tabs=await chrome.tabs.query({url:'https://www.netflix.com/watch/*'});
      return await chrome.tabs.sendMessage(tabs[0].id,{action:'getStatus'});
    });
    let now=0;
    const pulse=async(base,text='',shift=0,extra={})=>{
      now+=200;
      await page.evaluate(({now,base,text,shift,extra})=>{
        Object.assign(document.documentElement.dataset,{now:String(now),base:String(base),media:String(base+shift),...extra});
        document.querySelector('.player-timedtext').textContent=text;
      },{now,base,text,shift,extra});
      await isolated("(async()=>{dispatchEvent(new CustomEvent('ottsub_nav_change'));await settleTest();const frames=[...testFrames.values()];testFrames.clear();for(const frame of frames)frame(performance.now(),{mediaTime:Number(document.documentElement.dataset.media)});await settleTest();})()");
    };
    const advertisement=async()=>{
      await page.evaluate(()=>{const el=document.createElement('span');el.className='mmvz9h';el.textContent='20';document.querySelector('[data-uia="player"]').append(el);});
      await pulse(9.8,''); assert.equal((await status()).playbackState,'AD');
      await page.evaluate(()=>document.querySelector('.mmvz9h').remove());
    };
    const recover=async(shift=0,extra={})=>{
      await pulse(9.8,'',shift,extra); await pulse(10,'First phrase',shift,extra);
      for(const base of [10.2,10.4,10.6,10.8]) await pulse(base,'',shift,extra);
      await pulse(11,'Second phrase',shift,extra);
      return status();
    };
    await check('real MAIN/ISOLATED manifest load and read-only clock bridge',async()=>{
      await isolated('emitTestManifest(); settleTest()');
      for(const base of [8.8,9,9.2,9.4,9.6,9.8]) await pulse(base);
      assert.equal((await status()).displaySuppressed,false);
      assert.equal(await page.evaluate(()=>typeof OTTSubPlaybackClock),'undefined');
      assert.equal(await isolated('typeof window.netflix'),'undefined');
      assert.match(await page.locator('video').getAttribute('data-ottsub-clock-video'),/^v\d+$/);
    });
    await check('regional secondary selection persists across popup close/reopen and missing options',async()=>{
      await popup.reload();
      await popup.waitForFunction(()=>!!document.querySelector('#secondary-lang-select option[value="es-419"]'));
      await popup.selectOption('#secondary-lang-select','es-419');
      await popup.waitForFunction(async()=> (await chrome.storage.local.get('ottsub_secondary_lang')).ottsub_secondary_lang==='es-419');
      await popup.reload();
      await popup.waitForFunction(()=>document.querySelector('#secondary-lang-select').value==='es-419');
      assert.equal((await status()).secondaryLang,'es-419');
      await pulse(10,'First phrase');
      await popup.waitForFunction(async()=>{const [tab]=await chrome.tabs.query({url:'https://www.netflix.com/watch/*'});return (await chrome.tabs.sendMessage(tab.id,{action:'getStatus'})).hasSecondaryCues;});
      // The fixture disables real frame callbacks; request the normal manual render.
      await popup.evaluate(async()=>{const [tab]=await chrome.tabs.query({url:'https://www.netflix.com/watch/*'});await chrome.tabs.sendMessage(tab.id,{action:'set_secondary_offset',value:0});});
      assert.match(await isolated('OTTSubRenderer.bottomBox.textContent'),/Primera frase/,JSON.stringify(await status()));
      await popup.evaluate(async()=>{const m=await import('./modules/ui-dual.js');m.populateSecondaryLangOptions([{language:'ko',bcp47:'ko'}]);});
      assert.equal(await popup.locator('#secondary-lang-select').inputValue(),'es-419');
      await popup.selectOption('#secondary-lang-select','ko');
      await popup.waitForFunction(async()=> (await chrome.storage.local.get('ottsub_secondary_lang')).ottsub_secondary_lang==='ko');
      await pulse(10.2,'First phrase');
    });
    await check('primary selection persists, renders the chosen regional language and keeps secondary independent',async()=>{
      await popup.reload();
      await popup.waitForFunction(()=>!!document.querySelector('#primary-lang-select option[value="es-419"]'));
      await popup.selectOption('#primary-lang-select','es-419');
      await popup.waitForFunction(async()=> (await chrome.storage.local.get('ottsub_primary_lang')).ottsub_primary_lang==='es-419');
      await popup.reload();
      await popup.waitForFunction(()=>document.querySelector('#primary-lang-select').value==='es-419');
      await pulse(10,'First phrase');
      await popup.waitForFunction(async()=>{const [tab]=await chrome.tabs.query({url:'https://www.netflix.com/watch/*'});const s=await chrome.tabs.sendMessage(tab.id,{action:'getStatus'});return s.primaryLang==='es-419' && s.hasCues;});
      await popup.evaluate(async()=>{const [tab]=await chrome.tabs.query({url:'https://www.netflix.com/watch/*'});await chrome.tabs.sendMessage(tab.id,{action:'set_offset',value:0});});
      const text=await isolated('OTTSubRenderer.bottomBox.textContent');
      assert.match(text,/Primera frase/);assert.match(text,/첫 대사/);assert.doesNotMatch(text,/First phrase/);
      assert.equal((await status()).secondaryLang,'ko');
      await popup.evaluate(async()=>{const m=await import('./modules/ui-primary.js');m.populatePrimaryLangOptions([{language:'ko',bcp47:'ko'}]);});
      assert.equal(await popup.locator('#primary-lang-select').inputValue(),'es-419');
      await popup.selectOption('#primary-lang-select','auto');
      await popup.waitForFunction(async()=> (await chrome.storage.local.get('ottsub_primary_lang')).ottsub_primary_lang==='auto');
      await pulse(10.2,'First phrase');
    });
    await check('AD07: native cue onsets restore dual subtitles using video clock',async()=>{
      await advertisement(); const s=await recover();
      assert.equal(s.displaySuppressed,false);assert.equal(s.clockSource,'video');assert.equal(s.clockVerified,true);
      const text=await isolated('OTTSubRenderer.bottomBox.textContent');assert.match(text,/Second phrase/);assert.match(text,/둘째 대사/);
    });
    await check('AD08/18: player milliseconds restore when video includes ad time, offsets apply once',async()=>{
      await advertisement();
      const s=await recover(30,{unit:'1000'});
      assert.equal(s.displaySuppressed,false);assert.equal(s.clockSource,'player');
      await popup.evaluate(async()=>{const [tab]=await chrome.tabs.query({url:'https://www.netflix.com/watch/*'});await chrome.tabs.sendMessage(tab.id,{action:'set_offset',value:200});});
      assert.equal((await status()).offset,200);
      assert.match(await isolated('OTTSubRenderer.bottomBox.textContent'),/Second phrase/);
      assert.equal(await isolated('OTTSubSyncEngine.lastTime'),11);
    });
    await check('AD14: seek invalidates verified clock and resumes only after new onset evidence',async()=>{
      await isolated("document.querySelector('video').dispatchEvent(new Event('seeking'))");
      assert.equal((await status()).displaySuppressed,true);
      const s=await recover(30,{unit:'1'});assert.equal(s.clockSource,'player');assert.equal(s.displaySuppressed,false);
    });
    await check('AD10: multiple matching sessions cannot select a player clock',async()=>{
      await advertisement();const s=await recover(30,{multi:'true'});
      assert.equal(s.displaySuppressed,true);
      assert.equal(s.clockVerified,false);
    });
    await check('AD21: long fallback continues to verify and can recover later',async()=>{
      for(let i=0;i<55;i++)await pulse(11.2+i/5,'',30,{multi:'false'});
      assert.equal((await status()).playbackState,'RECOVERY_DELAYED');
      const s=await recover(30,{multi:'false',unit:'1000'});assert.equal(s.displaySuppressed,false);
    });
    await check('AD16: ad manifest cannot overwrite already validated content after recovery',async()=>{
      await advertisement();await isolated("emitTestManifest('BAD'); settleTest()");await recover(30);
      assert.equal(await isolated("OTTSubSyncEngine.cues.some(c=>c.text.includes('BAD'))"),false);
    });
    await check('AD22: first-ad startup stages a manifest and validates it before activation',async()=>{
      await advertisement();
      await page.evaluate(()=>{const el=document.createElement('span');el.className='mmvz9h';el.textContent='20';document.querySelector('[data-uia="player"]').append(el);history.pushState({},'','/watch/200');});
      await isolated("dispatchEvent(new CustomEvent('ottsub_nav_change')); emitTestManifest(); settleTest()");
      assert.equal((await status()).hasCues,false);
      await page.evaluate(()=>document.querySelector('.mmvz9h').remove());
      // Stable absence starts candidate downloads. Then collect two new onsets.
      for(let i=0;i<7;i++)await pulse(8+i/5,'',30);
      await isolated('settleTest()'); const s=await recover(30);
      assert.equal(s.displaySuppressed,false);assert.equal(s.movieId,'200');assert.equal(s.hasCues,true);assert.equal(s.hasSecondaryCues,true);
    });
    await check('AD24: three ad cycles do not accumulate offsets or clocks',async()=>{
      const before=(await status()).offset;
      for(let i=0;i<3;i++){await advertisement();const s=await recover(30);assert.equal(s.clockSource,'player');assert.equal(s.offset,before);}
    });
    await check('AD20: receiver rejects stale, malformed, oversized and wrong-owner responses',async()=>{
      const checks=await isolated(`(() => {
        const adapter=new OTTSubNetflixPlaybackAdapter(()=>{}), video=document.querySelector('video');
        adapter.setOwner('200',7);
        const now=performance.now(), token=video.getAttribute('data-ottsub-clock-video');
        const base={version:1,requestId:5,movieId:'200',episodeGeneration:7,status:'ok',sessions:[{id:'s1',raw:11000}],videos:[{id:token,time:41}]};
        const result=[];
        for(const extra of [{requestId:4},{movieId:'100'},{episodeGeneration:6},{sessions:[{id:'x',raw:NaN}]},{videos:Array(9).fill({id:token,time:41})}]){
          adapter.pending={requestId:5,video,at:now}; adapter.bridge=null;
          adapter.receiveBridge({detail:JSON.stringify({...base,...extra})});result.push(adapter.bridge===null);
        }
        adapter.pending={requestId:5,video,at:now-1000};adapter.receiveBridge({detail:JSON.stringify(base)});result.push(adapter.bridge===null);
        adapter.pending={requestId:5,video,at:now};adapter.receiveBridge({detail:JSON.stringify(base)});result.push(adapter.bridge?.raw===11000);
        adapter.stop();result.push(adapter.pending===null&&adapter.bridge===null);
        return result;
      })()`);
      assert(checks.every(Boolean));
    });
    await check('AD23: actual popup polls suppressed status and localizes notices',async()=>{
      await advertisement();
      // Reload popup while Netflix is the active tab, so its actual query binds to it.
      await page.bringToFront();await popup.reload();
      await popup.waitForFunction(()=>!document.getElementById('playback-notice').hidden,null,{timeout:3000});
      for(const lang of ['ko','en','es','de','ja']){
        await popup.selectOption('#ui-lang-select',lang);
        const text=await popup.locator('#playback-notice').textContent();assert(text.length>20);assert(!text.includes('playback_'));
      }
      await popup.reload();await popup.waitForFunction(()=>document.getElementById('ui-lang-select').value==='ja');
      assert.equal(await popup.locator('[data-i18n="primary_lang_label"]').textContent(),'主字幕の言語');
      assert.match(await popup.locator('#primary-auto-description').textContent(),/英語/);
      // A rate-limited/missed request may take its 1 s timeout before retrying.
      // Supply silent content before the two onsets instead of assuming instant API availability.
      for(let i=0;i<7;i++)await pulse(8+i/5,'',30);
      const recovered=await recover(30);
      assert.equal(recovered.displaySuppressed,false,JSON.stringify(recovered));
      await popup.waitForFunction(()=>document.getElementById('playback-notice').hidden,null,{timeout:3000});
    });
    await check('both raw clocks include ads: three native onsets calibrate and restore both languages',async()=>{
      await page.evaluate(()=>{document.documentElement.dataset.sessionApi='missing';});
      await isolated(`(() => {
        const fetchOriginal=window.fetch;
        window.fetch=async url=>{const response=await fetchOriginal(url);const oldText=response.text;
          response.text=async()=>await oldText()+'\\n00:00:12.000 --> 00:00:13.000\\n'+(url.includes('/ko')?'셋째 대사':'Third phrase')+'\\n';return response;};
        emitTestManifest('CAL');
      })()`);
      await isolated('settleTest()');
      await advertisement();
      for(let i=0;i<7;i++)await pulse(8+i/5,'',32,{playerShift:'32'});
      assert.equal((await recover(32,{playerShift:'32'})).displaySuppressed,true);
      for(const base of [11.2,11.4,11.6,11.8])await pulse(base,'',32);
      await pulse(12,'Third phrase',32);
      const s=await status();assert.equal(s.displaySuppressed,false,JSON.stringify(s));
      assert.equal(s.clockVerified,true);
      const text=await isolated('OTTSubRenderer.bottomBox.textContent');
      assert.match(text,/Third phrase/);assert.match(text,/셋째 대사/);
      const log=await isolated('__ottsubLocalDiagnostics.snapshot()');
      assert(log.rows.some(r=>r.type==='clock'&&r.selected?.offset===32));
      await page.evaluate(()=>{delete document.documentElement.dataset.sessionApi;});
    });
    await check('learning settings restore and real mouse hover pauses/resumes position-locked subtitles',async()=>{
      await popup.evaluate(async()=>{
        await chrome.storage.local.set({ottsub_blur_target:'both',ottsub_blur_mode:'blur_14',ottsub_hover_pause:true,ottsub_learning_collapsed:false});
      });
      await popup.reload();
      await popup.waitForFunction(()=>document.querySelector('[data-target="both"]').getAttribute('aria-checked')==='true');
      assert.equal(await popup.locator('[data-mode="blur_14"]').getAttribute('aria-checked'),'true');
      assert(await popup.locator('#hover-pause-toggle').isChecked());
      await popup.locator('[data-target="none"]').click();
      assert(await popup.locator('#hover-pause-toggle').isEnabled());
      await isolated(`(() => {
        const video=document.querySelector('video');
        Object.defineProperty(video,'paused',{configurable:true,get:()=>document.documentElement.dataset.hoverPaused==='true'});
        video.pause=()=>{document.documentElement.dataset.hoverPaused='true';};
        video.play=()=>{document.documentElement.dataset.hoverPaused='false';return Promise.resolve();};
        OTTSubRenderer.setBlurTarget('none');
        OTTSubRenderer.setLockPosition(true);
      })()`);
      const hoverLine=async selector=>{
        const box=await page.locator(selector).boundingBox();assert(box,'subtitle must be visible');
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
      };
      await page.mouse.move(2,2);
      await hoverLine('.ottsub-bottom .ottsub-line-primary');
      await page.waitForFunction(()=>document.documentElement.dataset.hoverPaused==='true',null,{timeout:1500});
      await page.mouse.move(2,2);
      await page.waitForFunction(()=>document.documentElement.dataset.hoverPaused==='false',null,{timeout:1500});
      // Coordinate input exercises CSS hit testing; dispatchEvent would bypass it.
      for(const locked of [true,false]) {
        await isolated(`OTTSubRenderer.setLockPosition(${locked})`);
        for(const language of ['primary','secondary']) {
          await hoverLine(`.ottsub-bottom .ottsub-line-${language}`);
          await page.waitForFunction(()=>document.documentElement.dataset.hoverPaused==='true',null,{timeout:1500});
          await page.mouse.move(2,2);
          await page.waitForFunction(()=>document.documentElement.dataset.hoverPaused==='false',null,{timeout:1500});
        }
      }
      await isolated('OTTSubRenderer.setLockPosition(true)');
      const positionBefore=await isolated('[OTTSubRenderer.customPosX,OTTSubRenderer.customPosY]');
      await hoverLine('.ottsub-bottom .ottsub-line-primary');
      await page.waitForFunction(()=>document.documentElement.dataset.hoverPaused==='true',null,{timeout:1500});
      await page.mouse.down();await page.mouse.move(100,100,{steps:3});await page.mouse.up();
      assert.deepEqual(await isolated('[OTTSubRenderer.customPosX,OTTSubRenderer.customPosY]'),positionBefore);
      assert.equal(await isolated('OTTSubRenderer.isDragging'),false,'lock must still prevent dragging');
      await page.mouse.move(2,2);
      await page.waitForFunction(()=>document.documentElement.dataset.hoverPaused==='false',null,{timeout:1500});
      // Interactive Netflix choices must keep their existing pointer priority.
      await page.evaluate(()=>{const el=document.createElement('div');el.className='akira-choice-container';document.body.append(el);});
      await hoverLine('.ottsub-bottom .ottsub-line-primary');
      await page.waitForTimeout(160);
      assert.equal(await page.evaluate(()=>document.documentElement.dataset.hoverPaused),'false');
      await page.mouse.move(2,2);
      await page.evaluate(()=>document.querySelector('.akira-choice-container').remove());
      // A video paused by the user must not be resumed by leaving the subtitle.
      await page.evaluate(()=>{document.documentElement.dataset.hoverPaused='true';});
      await hoverLine('.ottsub-bottom .ottsub-line-secondary');await page.waitForTimeout(160);
      await page.mouse.move(2,2);await page.waitForTimeout(160);
      assert.equal(await page.evaluate(()=>document.documentElement.dataset.hoverPaused),'true');
      await page.evaluate(()=>{document.documentElement.dataset.hoverPaused='false';});
      await popup.locator('#hover-pause-row .toggle-switch').click();
      await popup.waitForFunction(async()=> (await chrome.storage.local.get('ottsub_hover_pause')).ottsub_hover_pause===false);
      await popup.reload();
      await popup.waitForFunction(()=>!document.querySelector('#hover-pause-toggle').checked);
      assert.equal(await popup.locator('[data-target="none"]').getAttribute('aria-checked'),'true');
      assert.equal((await status()).hoverPause,false);
      await hoverLine('.ottsub-bottom .ottsub-line-primary');await page.waitForTimeout(160);
      assert.equal(await page.evaluate(()=>document.documentElement.dataset.hoverPaused),'false','disabled hover must not pause');
      await page.mouse.move(2,2);
    });
    await check('MAIN session observations reach local diagnostics without exposing track IDs or ad objects',async()=>{
      await pulse(14,'',0,{sessionAd:'start'});
      const observed=await isolated('window.__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="bridge"&&r.observation?.open?.adState==="start").at(-1)?.observation');
      assert(observed);assert.equal(observed.playback.adValue,'object');
      assert.equal(observed.playback.raw,14000);assert.equal(observed.open.raw,14000);
      assert.equal(observed.track.language,'ko');assert.equal(observed.track.kind,'closedcaptions');
      assert.match(observed.track.id,/^t\d+$/);
      assert.equal((await status()).playbackState,'AD');
      assert.equal(await isolated("document.body.classList.contains('ottsub-active')"),false);
      assert.equal(await isolated('OTTSubRenderer.bottomBox.textContent'),'');
      await pulse(14.2,'',0,{sessionAd:'end'});
      assert.equal((await status()).playbackState,'AD');
    });
    await check('session-only exit requires forward progress and still waits for native-clock verification',async()=>{
      // No countdown DOM exists. An unknown post-ad state matches the real log.
      await pulse(14.2,'',0,{sessionAd:'other'});
      assert.equal((await status()).playbackState,'AD');
      await pulse(14.4,''); await pulse(14.6,'');
      assert.equal((await status()).playbackState,'RECOVERING');
      assert.equal((await status()).displaySuppressed,true);
      for(let i=0;i<7;i++)await pulse(14.8+i/5,'');
      assert.equal((await status()).displaySuppressed,true);
      const diagnostics=await isolated('__ottsubLocalDiagnostics.snapshot()');
      assert(diagnostics.rows.some(r=>r.type==='gate'&&r.domAd==='absent'&&r.sessionAd==='present'&&r.state==='AD'));
      assert(diagnostics.rows.some(r=>r.type==='gate'&&r.sessionAdReason==='session-progress'&&r.requiresClock));
    });
    await check('local diagnostics downloads bounded structured data without dialogue or URLs',async()=>{
      const snapshot=await isolated('window.__ottsubLocalDiagnostics.snapshot()');
      assert(snapshot.rows.some(r=>r.type==='manifest-tracks'&&r.tracks.some(t=>t.language==='es-419')));
      assert(snapshot.rows.some(r=>r.type==='track-fetch'&&r.cues>0));
      assert(snapshot.rows.some(r=>r.type==='gate'&&r.state==='AD'));
      assert(snapshot.rows.some(r=>r.type==='clock'&&r.matchCount===1));
      assert(snapshot.rows.some(r=>r.type==='bridge'&&r.accepted));
      const text=JSON.stringify(snapshot);
      for(const forbidden of ['First phrase','Second phrase','첫 대사','Primera frase','https://','PRIVATE_']) assert(!text.includes(forbidden),forbidden);
      assert(snapshot.rows.length<=12000);
      const downloadPromise=page.waitForEvent('download');
      await page.locator('#ottsub-local-diagnostics').getByText('JSON 저장',{exact:true}).click();
      const download=await downloadPromise;
      assert.match(download.suggestedFilename(),/^ottsub-local-.*\.json$/);
      const saved=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
      assert.equal(saved.format,'ottsub-local-diagnostics-v1');
      assert(saved.rows.length>0);
    });
    await check('exact Japanese CC reference restores English/Korean with session clock after video resets',async()=>{
      await isolated(`(() => {
        const previous=window.fetch;
        window.fetch=async url=> {
          if(url.includes('/ja-cc'))return {url,ok:true,status:200,text:async()=>
            'WEBVTT\\n\\n00:00:10.000 --> 00:00:10.800\\n原文一\\n\\n00:00:11.000 --> 00:00:12.000\\n原文二\\n\\n00:00:12.000 --> 00:00:13.000\\n原文三\\n'};
          const response=await previous(url), text=await response.text();
          return {...response,text:async()=>text+'\\n00:00:12.000 --> 00:00:13.000\\n'+(url.includes('/ko')?'셋째 대사':'Third phrase')+'\\n'};
        };
      })()`);
      await page.evaluate(()=>{
        Object.assign(document.documentElement.dataset,{nativeTrackId:'PRIVATE_JA_CC',nativeLang:'ja',sessionAd:'other',playerShift:'0',multi:'false'});
        history.pushState({},'', '/watch/900');
      });
      await pulse(8,'');
      // Exercise production JSON interception, exact aliases and shared MAIN tokens.
      await page.evaluate(()=>{
        const track=(id,lang,url)=>({trackId:id,bcp47:lang,rawTrackType:id.includes('CC')?'closedcaptions':'subtitles',
          ttDownloadables:{'webvtt-lssdh-ios8':{downloadUrls:{a:'https://cdn.nflxvideo.net/'+url}}}});
        JSON.parse(JSON.stringify({movieId:900,timedtexttracks:[track('EN','en','en'),track('KO','ko','ko'),
          track('PRIVATE_JA_NORMAL','ja','ja-normal'),track('PRIVATE_JA_CC','ja','ja-cc')]}));
      });
      await isolated('settleTest()');
      for(const base of [8.2,8.4,8.6])await pulse(base,'');
      await pulse(8.8,'',-8,{sessionAd:'start',playerShift:'-8'});
      assert.equal((await status()).playbackState,'AD');
      for(const base of [8.8,9,9.2,9.4,9.6,9.8])await pulse(base,'',-8,{sessionAd:'other',playerShift:'-8'});
      await pulse(10,'原文一',-8,{playerShift:'-8'});
      for(const base of [10.2,10.4,10.6,10.8])await pulse(base,'',-8);
      await pulse(11,'原文二',-8);
      const state=await status();assert.equal(state.displaySuppressed,false,JSON.stringify(state));
      assert.equal(state.clockSource,'session');
      const text=await isolated('OTTSubRenderer.bottomBox.textContent');
      assert.match(text,/Second phrase/);assert.match(text,/둘째 대사/);assert.doesNotMatch(text,/原文/);
      const requests=await isolated('requests');
      // Native CC fetch bypasses the display-only language grouping.
      const diagnostics=await isolated('__ottsubLocalDiagnostics.snapshot()');
      assert(diagnostics.rows.some(r=>r.type==='clock'&&r.nativeVerification==='ready'&&r.selected?.source==='session'&&r.clockVerification==='session-progress'));
      assert.equal(await page.evaluate(()=>Number(document.documentElement.dataset.hydrations||0)),0);
      assert(!JSON.stringify(diagnostics).includes('PRIVATE_JA_CC'));
    });
    await check('third native onset hands off to video while both displayed languages survive session jitter',async()=>{
      for(const base of [11.2,11.4,11.6,11.8])await pulse(base,'',-8);
      await pulse(12,'原文三',-8);
      const state=await status();assert.equal(state.displaySuppressed,false);assert.equal(state.clockSource,'video');
      const last=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
      assert.equal(last.selected.source,'video');assert(Math.abs(last.selected.offset+8)<0.001);
      // Delay the session updates without making content time run backwards;
      // a real backwards jump must still close the independent ad gate.
      for(const [base,lag] of [[12.2,-0.1],[12.4,-0.2],[12.6,-0.3]]) {
        await pulse(base,'原文三',-8,{sessionLag:String(lag)});
        assert.equal((await status()).displaySuppressed,false);
        // Also exercise the normal manual-render command after the frame tick.
        await popup.evaluate(async()=>{const [tab]=await chrome.tabs.query({url:'https://www.netflix.com/watch/*'});await chrome.tabs.sendMessage(tab.id,{action:'set_offset',value:0});});
        const text=await isolated('OTTSubRenderer.bottomBox.textContent');
        assert.match(text,/Third phrase/);assert.match(text,/셋째 대사/);assert.doesNotMatch(text,/原文/);
      }
      await page.evaluate(()=>{delete document.documentElement.dataset.sessionLag;});
    });
    await check('native OFF waits for session progress, then recovers without any native text',async()=>{
      await pulse(12.8,'',-8,{nativeOff:'true'});
      assert.equal((await status()).displaySuppressed,true);
      await popup.waitForFunction(()=>document.getElementById('status-badge').dataset.statusKey==='playback_session_wait',null,{timeout:3000});
      assert((await popup.locator('#playback-notice').textContent()).length>30);
      for(let i=1;i<=10;i++)await pulse(12.8+i/5,'',-8,{nativeOff:'true'});
      assert.equal((await status()).displaySuppressed,false);
      const last=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
      assert.equal(last.nativeVerification,'off');assert.equal(last.clockVerification,'session-progress');
      await pulse(13,'',-8,{nativeOff:'false',nativeTrackId:'PRIVATE_JA_MISSING'});
      assert.equal((await status()).displaySuppressed,true);
    });
    await check('next episode starts with ad and native OFF: wait for its downloads, reject previous cues',async()=>{
      await isolated(`(() => {
        const previous=window.fetch; window.releaseOff=[];
        window.fetch=async url=>{
          if(url.includes('/off-next/'))await new Promise(resolve=>releaseOff.push(resolve));
          const response=await previous(url);
          if(!url.includes('/off-next/'))return response;
          return {...response,text:async()=> 'WEBVTT\\n\\n00:00:00.000 --> 00:01:00.000\\n'+(url.includes('/ko')?'NEXT 한국어':'NEXT English')+'\\n'};
        };
      })()`);
      await page.evaluate(()=>{
        history.pushState({},'', '/watch/910');
        Object.assign(document.documentElement.dataset,{nativeOff:'true',sessionAd:'start',playerShift:'15'});
      });
      for(let i=0;i<8;i++)await pulse(1,'',15);
      assert.equal((await status()).playbackState,'AD');assert.equal((await status()).hasCues,false);
      await page.evaluate(()=>{
        const track=lang=>({trackId:lang,bcp47:lang,ttDownloadables:{'webvtt-lssdh-ios8':{downloadUrls:{a:'https://cdn.nflxvideo.net/off-next/'+lang}}}});
        JSON.parse(JSON.stringify({movieId:910,timedtexttracks:['en','ko'].map(track)}));
      });
      for(let i=0;i<20;i++)await pulse(1+i/5,'',15,{sessionAd:'other'});
      assert.equal((await status()).displaySuppressed,true);assert.equal((await status()).hasCues,false);
      assert.equal(await isolated('releaseOff.length'),2);
      const clock=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
      assert.equal(clock.clockVerification,'session-progress');
      await isolated('releaseOff.forEach(resolve=>resolve()); settleTest()');await pulse(5,'',15);
      assert.equal((await status()).displaySuppressed,false);assert.equal((await status()).movieId,'910');
      const text=await isolated('OTTSubRenderer.bottomBox.textContent');
      assert.match(text,/NEXT English/);assert.match(text,/NEXT 한국어/);assert.doesNotMatch(text,/First phrase|Second phrase/);
    });
    await check('starting in an ad waits for display downloads even when exact native clock verifies first',async()=>{
      await isolated(`(() => {
        const previous=window.fetch; window.releaseDisplay=[];
        window.fetch=async url=>{
          if(url.includes('/slow/en')||url.includes('/slow/ko')) await new Promise(resolve=>releaseDisplay.push(resolve));
          return previous(url);
        };
      })()`);
      await page.evaluate(()=>{
        Object.assign(document.documentElement.dataset,{nativeTrackId:'PRIVATE_JA_CC',nativeLang:'ja',nativeOff:'false',sessionAd:'start',playerShift:'-8'});
        history.pushState({},'', '/watch/901');
      });
      // Navigation may cause a same-tick request to hit MAIN's rate limit. Allow
      // the bounded 1s pending timeout, without supplying any display cues.
      for(let i=0;i<7;i++)await pulse(7.6+i/5,'',-7);
      assert.equal((await status()).playbackState,'AD');
      await page.evaluate(()=>{
        const track=(id,lang,url)=>({trackId:id,bcp47:lang,ttDownloadables:{'webvtt-lssdh-ios8':{downloadUrls:{a:'https://cdn.nflxvideo.net/slow/'+url}}}});
        JSON.parse(JSON.stringify({movieId:901,timedtexttracks:[track('EN','en','en'),track('KO','ko','ko'),track('PRIVATE_JA_CC','ja','ja-cc')]}));
      });
      for(let i=0;i<15;i++)await pulse(7+i/5,'',-6,{sessionAd:'other',playerShift:'-6'});
      const reference=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
      assert.equal(reference?.nativeVerification,'ready',JSON.stringify(reference));
      await pulse(10,'原文一',-6);
      for(const base of [10.2,10.4,10.6,10.8])await pulse(base,'',-6);
      await pulse(11,'原文二',-6);
      assert.equal((await status()).displaySuppressed,true);
      assert.equal(await isolated('releaseDisplay.length'),2);
      const selected=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1).selected');
      assert.equal(selected?.source,'session');
      await isolated('releaseDisplay.forEach(resolve=>resolve()); settleTest()');
      await pulse(11.2,'原文二',-6);
      const state=await status();assert.equal(state.displaySuppressed,false,JSON.stringify(state));
      const text=await isolated('OTTSubRenderer.bottomBox.textContent');
      assert.match(text,/Second phrase/);assert.match(text,/둘째 대사/);
    });
    await check('verified pre-ad clock restores both languages on the first matching post-ad onset',async()=>{
      await isolated(`(() => {
        const previous=window.fetch;
        window.fetch=async url=>{const response=await previous(url),text=await response.text();
          return {...response,text:async()=>text+'\\n00:00:20.000 --> 00:00:22.000\\n'+
            (url.includes('/ja-cc')?'復帰一':url.includes('/ko')?'광고 뒤 첫 대사':'First after ad')+'\\n'};};
      })()`);
      await page.evaluate(()=>{
        Object.assign(document.documentElement.dataset,{nativeTrackId:'PRIVATE_JA_CC',nativeOff:'false',sessionAd:'other',playerShift:'0'});
        history.pushState({},'', '/watch/902');
      });
      for(const base of [6.6,6.8,7,7.2,7.4,7.6,7.8])await pulse(base);
      await page.evaluate(()=>{
        const track=(id,lang,url)=>({trackId:id,bcp47:lang,ttDownloadables:{'webvtt-lssdh-ios8':{downloadUrls:{a:'https://cdn.nflxvideo.net/'+url}}}});
        JSON.parse(JSON.stringify({movieId:902,timedtexttracks:[track('EN','en','en'),track('KO','ko','ko'),track('PRIVATE_JA_CC','ja','ja-cc')]}));
      });
      await isolated('settleTest()');
      for(let i=0;i<=35;i++){const base=8+i/5;await pulse(base,base===10?'原文一':base===11?'原文二':'');}
      const pre=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
      assert.equal(pre.selected?.source,'video');assert.equal(pre.nativeVerification,'ready');
      for(let i=0;i<75;i++){
        await pulse(15.2,'',0,{sessionAd:'start',media:String(15.2+i/5)});
        assert.equal((await status()).displaySuppressed,true);
        assert.equal(await isolated('OTTSubRenderer.bottomBox?.textContent||""'),'');
      }
      // Verified progress can now release before speech. Prior independent
      // ad-memory proof still permits a video handoff on the first matching cue.
      for(let i=0;i<24;i++)await pulse(15.2+i/5,'',17,{sessionAd:'other',playerShift:'17'});
      assert.equal((await status()).displaySuppressed,false);
      assert.equal((await status()).clockSource,'session');
      await pulse(20,'復帰一',17);
      const state=await status();assert.equal(state.displaySuppressed,false,JSON.stringify(state));
      assert.equal(state.clockSource,'video');
      const text=await isolated('OTTSubRenderer.bottomBox.textContent');
      assert.match(text,/First after ad/);assert.match(text,/광고 뒤 첫 대사/);assert.doesNotMatch(text,/復帰一/);
      const post=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
      assert.equal(post.selected.offset,17);
      assert.equal(post.adMemory.restored,true);
      assert.equal(await page.evaluate(()=>Number(document.documentElement.dataset.hydrations||0)),0);
    });
    await check('automatic primary label follows committed Korean/English cues, clears on navigation and survives reopening',async()=>{
      await popup.selectOption('#ui-lang-select','ko');
      await popup.selectOption('#primary-lang-select','auto');
      await isolated(`(() => {const previous=window.fetch;window.releasePrimaryLabel=[];window.fetch=async url=>{
        if(url.includes('/hold/ko'))await new Promise(resolve=>window.releasePrimaryLabel.push(resolve));
        return previous(url);};})()`);
      const navigate=async mid=>{
        await page.evaluate(mid=>{history.pushState({},'', '/watch/'+mid);Object.assign(document.documentElement.dataset,{sessionAd:'other',playerShift:'0'});},mid);
        for(let i=0;i<8;i++)await pulse(8+i/5);
      };
      const manifest=async(mid,langs)=>page.evaluate(({mid,langs})=>{
        const track=lang=>({trackId:lang,bcp47:lang,ttDownloadables:{'webvtt-lssdh-ios8':{downloadUrls:{a:'https://cdn.nflxvideo.net/'+(mid===903?'hold/':'')+lang}}}});
        JSON.parse(JSON.stringify({movieId:mid,timedtexttracks:langs.map(track)}));
      },{mid,langs});
      await navigate(903);await manifest(903,['ko']);await isolated('settleTest()');
      assert.equal((await status()).primaryResolvedLang,null);
      await popup.waitForFunction(()=>document.querySelector('#primary-lang-select option:checked').textContent==='자동');
      await isolated('releasePrimaryLabel.forEach(resolve=>resolve()); settleTest()');await pulse(10);
      assert.equal((await status()).primaryResolvedLang,'ko');
      await popup.waitForFunction(()=>document.querySelector('#primary-lang-select option:checked').textContent==='자동 (한국어)');
      assert.equal(await popup.locator('#primary-lang-select').inputValue(),'auto');
      await popup.reload();await popup.waitForFunction(()=>document.querySelector('#primary-lang-select option:checked').textContent==='자동 (한국어)');
      for(const lang of ['de','es','en','ko']){
        await popup.selectOption('#ui-lang-select',lang);
        assert(!/English first|영어 우선|Englisch zuerst|inglés primero/.test(await popup.locator('#primary-lang-select option:checked').textContent()));
        assert((await popup.locator('#primary-lang-select option:checked').textContent()).includes('('));
      }
      await navigate(904);assert.equal((await status()).primaryResolvedLang,null);
      await popup.waitForFunction(()=>document.querySelector('#primary-lang-select option:checked').textContent==='자동 — 지원 언어 확인 중');
      await manifest(904,['ko','en']);await isolated('settleTest()');await pulse(10);
      assert.equal((await status()).primaryResolvedLang,'en');
      await popup.waitForFunction(()=>document.querySelector('#primary-lang-select option:checked').textContent==='자동 (영어)');
      assert.equal((await status()).primaryLang,'auto');
      await popup.selectOption('#primary-lang-select','ko');await pulse(10.2);
      assert.equal((await status()).primaryResolvedLang,'ko');
      await popup.waitForFunction(()=>document.querySelector('#primary-lang-select').value==='ko');
      assert.equal(await popup.locator('#primary-lang-select option[value="auto"]').textContent(),'자동');
    });
    await check('late native reference uses visible text plus a fresh onset; session progression corroborates jittered onsets',async()=>{
      await popup.selectOption('#primary-lang-select','auto');
      await isolated(`(() => {const previous=window.fetch;window.releaseWitness=[];
        window.fetch=async url=>{if(url.includes('/witness/ja-cc'))await new Promise(resolve=>releaseWitness.push(resolve));return previous(url);};})()`);
      await page.evaluate(()=>{
        history.pushState({},'', '/watch/905');
        Object.assign(document.documentElement.dataset,{nativeTrackId:'PRIVATE_JA_CC',nativeOff:'false',sessionAd:'start',playerShift:'31',sessionLag:'0'});
      });
      for(let i=0;i<8;i++)await pulse(7.8,'',31);
      await page.evaluate(()=>{
        const track=(id,lang,url)=>({trackId:id,bcp47:lang,ttDownloadables:{'webvtt-lssdh-ios8':{downloadUrls:{a:'https://cdn.nflxvideo.net/witness/'+url}}}});
        JSON.parse(JSON.stringify({movieId:905,timedtexttracks:[track('EN','en','en'),track('KO','ko','ko'),track('PRIVATE_JA_CC','ja','ja-cc')]}));
      });
      for(let i=0;i<11;i++)await pulse(7.8+i/5,'',31,{sessionAd:'other'});
      await pulse(10,'原文一',31,{sessionLag:'-0.1'});
      assert.equal((await status()).nativeVerification,'loading');
      await isolated('releaseWitness.forEach(resolve=>resolve()); settleTest()');
      await pulse(10.2,'原文一',31);assert.equal((await status()).displaySuppressed,true);
      for(const base of [10.4,10.6,10.8])await pulse(base,'',31);
      await pulse(11,'原文二',31);
      let state=await status();assert.equal(state.displaySuppressed,false,JSON.stringify(state));assert.equal(state.clockSource,'session');
      let row=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
      assert.equal(row.clockVerification,'session-visible-witness');
      // The verified session is 100ms behind this onset. Advance past the cue
      // boundary and render manually because frame callbacks are disabled here.
      await pulse(11.2,'原文二',31);
      await popup.evaluate(async()=>{const [tab]=await chrome.tabs.query({url:'https://www.netflix.com/watch/*'});await chrome.tabs.sendMessage(tab.id,{action:'set_offset',value:0});});
      let text=await isolated('OTTSubRenderer.bottomBox.textContent');assert.match(text,/Second phrase/);assert.match(text,/둘째 대사/);
      await page.evaluate(()=>document.querySelector('video').dispatchEvent(new Event('seeking')));
      await pulse(9.8,'',31,{sessionLag:'-0.28'});
      // Wait for the adapter to establish the same session's new progression.
      for(const base of [9.9,10,10.1,10.2,10.3,10.4,10.5,10.6,10.7,10.8])await pulse(base,'',31);
      // Use cues 11 and 12; neither has been shown in this verification epoch.
      await pulse(11,'原文二',31);
      for(const base of [11.2,11.4,11.6,11.8])await pulse(base,'',31);
      await pulse(12,'原文三',31,{sessionLag:'-0.07'});
      state=await status();assert.equal(state.displaySuppressed,false,JSON.stringify(state));assert.equal(state.clockSource,'video');
      row=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
      assert.equal(row.clockVerification,'session-corroborated-onsets');assert.equal(row.selected.offset,31);
      text=await isolated('OTTSubRenderer.bottomBox.textContent');assert.match(text,/Third phrase/);assert.match(text,/셋째 대사/);
    });
    await check('verified same-session seek restores in silence without downloading tracks again',async()=>{
      for(const base of [12.2,12.4,12.6,12.8,13,13.2])await pulse(base,'',31);
      const fetches=await isolated('requests.length'),started=now;
      await page.evaluate(()=>document.querySelector('video').dispatchEvent(new Event('seeking')));
      assert.equal((await status()).displaySuppressed,true);
      let recovered=null;
      for(let i=0;i<10;i++){await pulse(40+i/5,'',31);if(!(await status()).displaySuppressed){recovered=now-started;break;}}
      assert(recovered!==null&&recovered<=1000,`seek recovery ${recovered}ms`);
      const row=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
      assert.equal(row.clockVerification,'seek-session-confirmed');assert.equal(await isolated('requests.length'),fetches);
    });
    await check('intro and recap buttons use normal seeking recovery; no subtitle re-download',async()=>{
      const fetches=await isolated('requests.length');
      for(const [kind,destination] of [['intro',80],['recap',140]]){
        for(let i=0;i<8;i++)await pulse(destination-20+i/5,'',31);
        await page.evaluate(kind=>{
          const button=document.createElement('button');button.id='test-skip';button.textContent=`Skip ${kind}`;
          button.addEventListener('click',()=>document.querySelector('video').dispatchEvent(new Event('seeking')));
          document.body.append(button);
        },kind);
        await page.locator('#test-skip').click();assert.equal((await status()).displaySuppressed,true);
        await page.evaluate(()=>document.querySelector('#test-skip').remove());
        for(let i=0;i<16;i++)await pulse(destination+i/5,'',31);
        assert.equal((await status()).displaySuppressed,false,kind);
      }
      assert.equal(await isolated('requests.length'),fetches);
    });
    await check('return after a background time jump revokes old clock until current session is rechecked',async()=>{
      await isolated(`Object.defineProperty(document,'hidden',{configurable:true,get:()=>document.documentElement.dataset.testHidden==='true'});
        document.documentElement.dataset.testHidden='true';document.dispatchEvent(new Event('visibilitychange'));`);
      assert.equal((await status()).displaySuppressed,true);
      await page.evaluate(()=>Object.assign(document.documentElement.dataset,{media:'236',base:'205'}));
      await isolated(`document.documentElement.dataset.testHidden='false';document.dispatchEvent(new Event('visibilitychange'));`);
      assert.equal((await status()).displaySuppressed,true);
      for(let i=0;i<24;i++)await pulse(205+i/5,'',31);
      assert.equal((await status()).displaySuppressed,false);
      await isolated('delete document.hidden;');
    });
    await check('native ON new-episode ad recovers in silence only after current display downloads; wrong late cue revokes it',async()=>{
      await isolated(`(() => {const previous=window.fetch;window.releaseOnDisplay=[];
        window.fetch=async url=>{
          if(!url.includes('/silent-on/'))return previous(url);
          const native=url.includes('/ja');
          if(!native)await new Promise(resolve=>releaseOnDisplay.push(resolve));
          return {url,ok:true,status:200,text:async()=>native?
            'WEBVTT\\n\\n00:01:40.000 --> 00:01:41.000\\n未来の原文\\n':
            'WEBVTT\\n\\n00:00:00.000 --> 00:10:00.000\\n'+(url.includes('/ko')?'SILENT 한국어':'SILENT English')+'\\n'};
        };})()`);
      await page.evaluate(()=>{
        history.pushState({},'', '/watch/911');
        Object.assign(document.documentElement.dataset,{nativeTrackId:'SILENT_JA',nativeLang:'ja',nativeOff:'false',sessionAd:'start',playerShift:'31',sessionLag:'0'});
      });
      for(let i=0;i<8;i++)await pulse(1,'',31);
      assert.equal((await status()).playbackState,'AD');
      await page.evaluate(()=>{
        const track=(id,lang)=>({trackId:id,bcp47:lang,ttDownloadables:{'webvtt-lssdh-ios8':{downloadUrls:{a:'https://cdn.nflxvideo.net/silent-on/'+lang}}}});
        JSON.parse(JSON.stringify({movieId:911,timedtexttracks:[track('SILENT_EN','en'),track('SILENT_KO','ko'),track('SILENT_JA','ja')]}));
      });
      for(let i=0;i<20;i++)await pulse(1+i/5,'',31,{sessionAd:'other'});
      let state=await status();assert.equal(state.displaySuppressed,true);assert.equal(state.hasCues,false);
      let row=await isolated('__ottsubLocalDiagnostics.snapshot().rows.filter(r=>r.type==="clock").at(-1)');
      assert.equal(row.clockVerification,'session-progress');assert.equal(row.nativeVerification,'ready');assert.equal(row.nativeLength,0);
      assert.equal(await isolated('releaseOnDisplay.length'),2);
      await isolated('releaseOnDisplay.forEach(resolve=>resolve());settleTest()');await pulse(5,'',31);
      state=await status();assert.equal(state.displaySuppressed,false);assert.equal(state.movieId,'911');
      const text=await isolated('OTTSubRenderer.bottomBox.textContent');assert.match(text,/SILENT English/);assert.match(text,/SILENT 한국어/);assert.doesNotMatch(text,/NEXT English/);
      await pulse(5.2,'未来の原文',31);assert.equal((await status()).displaySuppressed,true);
      for(let i=0;i<10;i++)await pulse(5.4+i/5,'',31);
      assert.equal((await status()).displaySuppressed,true,'Do not relearn a session disproved by exact native dialogue');
    });
    await check('foreign native subtitles stay hidden during verification but remain readable to the clock',async()=>{
      // Continue from 7.2 at the normal 200ms cadence. An artificial jump
      // would start a new verification epoch instead of testing this hold.
      await pulse(7.4,'未来の原文',31);
      assert.equal((await status()).nativeFallbackHidden,true);
      assert.equal(await page.locator('.player-timedtext').evaluate(el=>getComputedStyle(el).visibility),'hidden');
      assert.equal((await isolated('OTTSubNetflixPlaybackAdapter.read().nativeText')).trim(),'未来の原文');
      for(let i=0;i<55;i++)await pulse(7.6+i/5,'未来の原文',31);
      assert.equal((await status()).playbackState,'RECOVERY_DELAYED');
      assert.equal((await status()).nativeFallbackHidden,true);
      await popup.waitForFunction(()=>document.querySelector('#status-badge').dataset.statusKey==='playback_delayed');
      await popup.locator('#show-native').click();
      await popup.waitForFunction(()=>document.querySelector('#status-badge').dataset.statusKey==='playback_native');
      assert.equal((await status()).nativeFallbackHidden,false);
      assert.equal((await status()).displaySuppressed,true,'explicit native fallback never verifies the OTTSub clock');
      assert.equal(await page.locator('.player-timedtext').evaluate(el=>getComputedStyle(el).visibility),'visible');
    });
    await check('seek recovery removes the temporary native mask; a real ad releases native ad captions',async()=>{
      await page.evaluate(()=>document.querySelector('video').dispatchEvent(new Event('seeking')));
      for(let i=0;i<16;i++)await pulse(30+i/5,'',31);
      assert.equal((await status()).displaySuppressed,false);
      assert.equal((await status()).nativeFallbackHidden,false);
      await pulse(33.2,'広告',31,{sessionAd:'start'});
      assert.equal((await status()).playbackState,'AD');assert.equal((await status()).nativeFallbackHidden,false);
      assert.equal(await page.locator('.player-timedtext').evaluate(el=>getComputedStyle(el).visibility),'visible');
    });
    await check('leaving the episode cannot leave a native subtitle mask on the page',async()=>{
      await page.evaluate(()=>history.pushState({},'', '/browse'));
      await isolated("dispatchEvent(new CustomEvent('ottsub_nav_change')); settleTest()");
      assert.equal(await page.evaluate(()=>document.body.classList.contains('ottsub-recovery-native-hidden')),false);
    });
    assert.deepEqual(errors,[]);
  } catch(error){ errors.push(error.stack);process.exitCode=1; }
  finally { trace('browser:closing',{cases:cases.length,errors:errors.length});console.log(JSON.stringify({passed:!errors.length,total:cases.length,cases,errors},null,2));await context.close();trace('suite:closed'); }
})().catch(error=>{console.error(error);process.exitCode=1;});
