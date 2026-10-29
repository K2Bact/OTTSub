// Offline Chromium integration: all shipped scripts, actual parser/renderer, no Netflix connection.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join((process.env.USERPROFILE || process.env.HOME), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }
const root = path.resolve(__dirname, '..');
const {popup}=require('./helpers/offline-popup.cjs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    async function makeContentPage(mutateFetcher=false) {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => r.fulfill({ contentType: 'text/html', body: '<div data-uia="player" style="width:1200px;height:700px;position:relative"><video style="width:1200px;height:700px"></video></div>' }));
    await page.goto('https://ottsub.test/watch/100');
    await page.evaluate(() => {
      const listeners = new Set();
      window.audit = { writes: [], requests: [], time: 10, deferred: false, hydration: [] };
      const storage = (area, initial) => ({
        get(keys, cb) { cb({ ...initial }); },
        set(values, cb) {
          audit.writes.push({ area, values });
          const changes = {};
          for (const [key, value] of Object.entries(values)) {
            if (initial[key] !== value) { changes[key] = { oldValue: initial[key], newValue: value }; initial[key] = value; }
          }
          queueMicrotask(() => { if (Object.keys(changes).length) for (const fn of [...listeners]) fn(changes, area); cb?.(); });
        }
      });
      window.chrome = { i18n: { getUILanguage: () => 'en', getMessage: k => k }, runtime: { id: 'test', onMessage: { addListener: fn => { audit.message = fn; } } },
        storage: { local: storage('local', { ottsub_offset: 700, ottsub_primary_scale: 1.2 }), sync: storage('sync', { ottsub_offset: 100, ottsub_lock_pos: true }),
          onChanged: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) } } };
      const v = document.querySelector('video');
      for (const [k, value] of Object.entries({ paused: true, ended: false, readyState: 4 })) Object.defineProperty(v, k, { get: () => value });
      Object.defineProperty(v, 'currentTime', { get: () => audit.time });
      window.fetch = (url, { signal } = {}) => new Promise(resolve => {
        let bodyResolve; const body=new Promise(r=>bodyResolve=r);
        const req = {url,signal,releaseBody:label=>bodyResolve(`WEBVTT\n\n00:00:00.000 --> 00:01:00.000\n${label || url}\n`),
          resolve:label=>{resolve({url,ok:true,status:200,text:()=>body});if(!audit.deferBodies)req.releaseBody(label);}};
        audit.requests.push(req); if (!audit.deferred) req.resolve();
      });
      window.netflix = { appContext: { state: { playerApp: { getAPI: () => ({ videoPlayer: {
        getAllPlayerSessionIds: () => ['session'], getVideoPlayerBySessionId: () => ({
          getMovieId: () => Number(location.pathname.match(/\d+/)?.[0]),
          getTimedTextTrackList: () => [{ bcp47: 'vi' }], setTimedTextTrack: track => audit.hydration.push(track)
        })
      } }) } } } };
      window.send = (action, value) => { let status; audit.message({ action, value }, { id: 'test' }, r => status = r); return status; };
      window.emitManifest = mid => dispatchEvent(new CustomEvent('ottsub_manifest_data', { detail: {
        source: 'ottsub_injected', movieId: String(mid), urls: [`https://cdn.nflxvideo.net/${mid}/en`],
        tracksByLang: { ko: [`https://cdn.nflxvideo.net/${mid}/ko`] }, availableTracks: [{ lang: 'ko' }]
      } }));
      window.settle = async () => { for (let i = 0; i < 40; i++) await Promise.resolve(); };
    });
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    for (const group of manifest.content_scripts) {
      for (const file of group.css || []) await page.addStyleTag({ content: fs.readFileSync(path.join(root, file), 'utf8') });
      for (const file of group.js || []) {
        let code = fs.readFileSync(path.join(root, file), 'utf8');
        if (mutateFetcher && file === 'src/network/track-fetcher.js') {
          assert(code.includes('if (signal.aborted) {'));
          code = code.replace('if (signal.aborted) {', 'if (false) { // disposable cancellation mutation');
        }
        await page.addScriptTag({ content: code });
      }
    }
    await page.evaluate(() => {
      audit.parsedBodies = [];
      const parse = OTTSubParser.parse;
      OTTSubParser.parse = function(text, ...args) { audit.parsedBodies.push(text); return parse.call(this, text, ...args); };
      window.emitKindManifest = mid => {
        const track = (lang, cc) => ({bcp47:lang,isCC:cc,urls:[`https://cdn.nflxvideo.net/${mid}/${lang}-${cc?'cc':'normal'}`]});
        const tracks=[track('en',false),track('en',true),track('ko',false),track('ko',true)];
        dispatchEvent(new CustomEvent('ottsub_manifest_data',{detail:{source:'ottsub_injected',movieId:String(mid),
          urls:tracks[0].urls,tracksByLang:{en:tracks[0].urls,ko:tracks[2].urls},availableTracks:tracks}}));
      };
    });
    return page;
    }
    const page=await makeContentPage();
    const result=await page.evaluate(async()=>{
      await settle();audit.deferBodies=true;emitManifest(100);await settle();
      const old=audit.requests.slice();
      audit.message({action:'set_primary_lang',lang:'ko'},{id:'test'},()=>{});await settle();
      const switched=send('getStatus');
      history.pushState({},'', '/watch/200');emitManifest(200);await settle();
      return {oldCount:old.length,switched,before:send('getStatus')};
    });
    assert(result.oldCount>=2);assert.equal(result.switched.primaryLang,'ko');
    assert.equal(result.before.movieId,'200');assert.equal(result.before.hasCues,false);
    const panel=await popup(browser,{extra:`chrome.tabs.sendMessage=(id,m,cb)=>{commands.push(m);const p=window.contentStatus?window.contentStatus(m):Promise.resolve(demoStatus);p.then(r=>cb?.(r));return p;};`});
    await panel.context.exposeBinding('contentStatus',async(_,message)=>page.evaluate(m=>new Promise(resolve=>audit.message(m,{id:'test'},resolve)),message));
    await panel.page.reload();
    await panel.page.waitForFunction(()=>document.getElementById('primary-lang-select').value==='ko');
    const pendingPanel=await panel.page.locator('#sub-status').getAttribute('data-status-key');
    assert.notEqual(pendingPanel,'sub_status_ready');
    const late=await page.evaluate(async()=>{
      const current=audit.requests.filter(r=>r.url.includes('/200/'));
      for(const r of current)r.releaseBody('CURRENT '+r.url);await settle();send('adjust_offset',0);
      const loaded={status:send('getStatus'),text:OTTSubRenderer.bottomBox?.textContent};
      for(const r of audit.requests.filter(r=>r.url.includes('/100/')))r.releaseBody('STALE PREVIOUS EPISODE');
      await settle();send('adjust_offset',0);
      return {currentCount:current.length,loaded,status:send('getStatus'),text:OTTSubRenderer.bottomBox?.textContent,
        aborted:audit.requests.filter(r=>r.url.includes('/100/')).every(r=>r.signal?.aborted),nativeChanges:audit.hydration.length};
    });
    fs.mkdirSync(process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/compound'),{recursive:true});
    fs.writeFileSync(path.join(process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/compound'),'compound-state.json'),JSON.stringify(late,null,2));
    assert(late.currentCount>0);assert(late.loaded.status.hasCues);assert.equal(late.status.primaryLang,'ko');
    assert.match(late.text,/CURRENT.*200\/ko/);assert.doesNotMatch(late.text,/STALE/);assert(late.aborted);assert.equal(late.nativeChanges,0);
    await panel.page.waitForFunction(()=>document.getElementById('sub-status').dataset.statusKey==='sub_status_ready');
    await panel.page.reload();await panel.page.waitForFunction(()=>document.getElementById('sub-status').dataset.statusKey==='sub_status_ready');
    assert.equal(await panel.page.locator('#primary-lang-select').inputValue(),'ko');
    await panel.context.close();assert.deepEqual(errors,[]);
    const churnResults=[],churnCases=[];
    async function kindCase(side,order,mutant=false) {
      const testPage=await makeContentPage(mutant);
      try { return await testPage.evaluate(async({side,order})=>{
        await settle();emitKindManifest(100);await settle();
        send('set_primary_track_kind','normal');send('set_secondary_track_kind','normal');await settle();send('adjust_offset',0);
        const before=send('getStatus'),lang=side==='primary'?'en':'ko';audit.deferBodies=true;
        send(`set_${side}_track_kind`,'cc');await settle();
        const old=[...audit.requests].reverse().find(r=>r.url.endsWith(`/${lang}-cc`));if(!old)throw Error('missing held CC request');
        if(side==='secondary')send('set_dual_mode',false);
        send(`set_${side}_track_kind`,'normal');await settle();
        const current=[...audit.requests].reverse().find(r=>r.url.endsWith(`/${lang}-normal`));if(!current||current===old)throw Error('missing current normal request');
        const parseMark=audit.parsedBodies.length;
        for(const request of order==='stale-first'?[old,current]:[current,old]){
          request.releaseBody(request===old?'STALE_KIND_'+side:'CURRENT_KIND_'+side);await settle();send('adjust_offset',0);
        }
        const offText=OTTSubRenderer.container?.textContent||'',off=send('getStatus'),requestsBeforeOn=audit.requests.length;
        if(side==='secondary'){send('set_dual_mode',true);await settle();send('adjust_offset',0);}
        const after=send('getStatus'),text=OTTSubRenderer.container?.textContent||'';
        return {side,order,before,after,off,offText,text,oldAborted:old.signal.aborted,
          staleParsed:audit.parsedBodies.slice(parseMark).some(t=>t.includes('STALE_KIND_')),
          requestsBeforeOn,requestsAfterOn:audit.requests.length};
      },{side,order}); } finally { await testPage.close(); }
    }
    for(const side of ['primary','secondary'])for(const order of ['stale-first','current-first']){
      const r=await kindCase(side,order);churnResults.push(r);
      assert.equal(r.oldAborted,true);assert.equal(r.staleParsed,false);assert.doesNotMatch(r.text,/STALE_KIND_/);
      assert(r.text.includes('CURRENT_KIND_'+side),JSON.stringify(r));assert.equal(r.after[side+'TrackKind'],'normal');
      const other=side==='primary'?'secondaryCueCount':'cueCount';assert.equal(r.after[other],r.before[other]);
      if(side==='secondary'){
        assert.equal(r.off.isDualMode,false);assert(!r.offText.includes('CURRENT_KIND_secondary'));
        assert.equal(r.after.isDualMode,true);assert.equal(r.requestsAfterOn,r.requestsBeforeOn);
      }
      churnCases.push({name:`${side} normal/CC ${order} rejects superseded body and preserves other role${side==='secondary'?' through OFF/ON':''}`,passed:true});
    }
    const cancellationMutation=await kindCase('primary','current-first',true);
    assert.equal(cancellationMutation.staleParsed,true,'cancellation mutation must be caught before stale body parsing');
    churnCases.push({name:'disposable fetch cancellation mutation is caught by the parser oracle',passed:true});
    assert.deepEqual(errors,[]);
    const cases=[
      'held response bodies survive language switch without old cues',
      'episode transition clears cues while bodies are pending',
      'reloaded real popup reads current content status through a local bridge',
      'reverse body completion cannot overwrite current episode or track',
      'popup reload after recovery retains current language and ready state'
    ].map(name=>({name,passed:true})).concat(churnCases);
    console.log(JSON.stringify({passed:true,total:cases.length,cases,errors,result,late,churnResults,
      negativeControl:{staleParsed:cancellationMutation.staleParsed,scope:'Only the disposable page fetcher source was mutated; product files were preserved.'}},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
