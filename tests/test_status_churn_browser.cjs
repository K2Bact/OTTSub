// Native tabs/onActivated/sendMessage and the unmodified popup; Netflix responses are fixture-only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('./helpers/offline-popup.cjs');
const root=path.resolve(__dirname,'..'),out=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/status-churn');
fs.mkdirSync(out,{recursive:true});
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const fixture=`let hold=false,next=0;const waiting=[];const movieId=location.pathname.split('/').pop();
const response=offset=>({ready:true,build:chrome.runtime.getManifest().version_name||chrome.runtime.getManifest().version,movieId,
 hasCues:true,cueCount:Number(movieId),hasSecondaryCues:false,isDualMode:true,primaryLang:'en',primaryResolvedLang:'en',secondaryLang:'ko',primaryTrackKind:'normal',secondaryTrackKind:'normal',
 offset:offset??(movieId==='100'?1100:2200),secondaryOffset:0,availableTracks:[{bcp47:'en',urls:['fixture-en']},{bcp47:'ko',urls:['fixture-ko']}]});
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(sender.id!==chrome.runtime.id)return false;
 if(message.action==='getStatus'){next++;if(hold)waiting.push(reply);else reply(response());return true;}
 if(message.action==='fixture-hold'){hold=true;reply({held:waiting.length});}
 if(message.action==='fixture-stats')reply({held:waiting.length,requests:next});
 if(message.action==='fixture-release'){hold=false;const jobs=waiting.splice(0);for(const fn of jobs)fn(response(message.offset));reply({released:jobs.length});}
 return false;
});`;
function extensionCopy(name,mutant){
 const dir=path.join(out,`native-${process.pid}-${name}`);fs.mkdirSync(dir,{recursive:true});
 for(const folder of ['src','popup','_locales','icons'])fs.cpSync(path.join(root,folder),path.join(dir,folder),{recursive:true});
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 manifest.content_scripts=[{matches:['https://www.netflix.com/*'],js:['fixture-status.js'],run_at:'document_start',world:'ISOLATED'}];
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2));fs.writeFileSync(path.join(dir,'fixture-status.js'),fixture);
 const file=path.join(dir,'popup/modules/status-connection.js'),original=fs.readFileSync(file,'utf8');
 assert.equal(original,fs.readFileSync(path.join(root,'popup/modules/status-connection.js'),'utf8'));
 if(mutant){const guard='if (closed || token !== generation || !pending) return;';assert(original.includes(guard));fs.writeFileSync(file,original.replace(guard,'if (false) return; // disposable negative control'));}
 return {dir,moduleSha256:hash(original),testedModuleSha256:hash(fs.readFileSync(file)),permissions:manifest.permissions};
}
async function variant(name,mutant=false){
 const copy=extensionCopy(name,mutant),context=await chromium.launchPersistentContext('',{headless:true,channel:'chromium',args:[`--disable-extensions-except=${copy.dir}`,`--load-extension=${copy.dir}`]});
 try{
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());if(url.protocol==='chrome-extension:')return route.continue();
   if(url.hostname==='www.netflix.com')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Offline native tab fixture</title><p>Offline status fixture</p>'});
   return route.abort();
  });
  const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker',{timeout:8000}),id=new URL(worker.url()).host;
  await worker.evaluate(()=>chrome.storage.local.set({ottsub_ui_lang:'en'}));
  const a=await context.newPage();await a.goto('https://www.netflix.com/watch/100');
  const b=await context.newPage();await b.goto('https://www.netflix.com/watch/200');
  const tabs=await worker.evaluate(()=>chrome.tabs.query({}));
  const tabA=tabs.find(t=>t.url==='https://www.netflix.com/watch/100'),tabB=tabs.find(t=>t.url==='https://www.netflix.com/watch/200');assert(tabA?.id&&tabB?.id&&tabA.id!==tabB.id);
  const control=(tabId,action,offset)=>worker.evaluate(({tabId,action,offset})=>chrome.tabs.sendMessage(tabId,{action,offset}),{tabId,action,offset});
  const active=tabId=>worker.evaluate(id=>chrome.tabs.update(id,{active:true}),tabId);
  const panel=await context.newPage();
  await panel.addInitScript(()=>{
   const audit=window.__statusAudit={sent:[],responses:[],activations:[],renders:[],intervals:new Map(),timeouts:new Map(),subscribers:new Set()};
   for(const [set,clear,key]of [['setInterval','clearInterval','intervals'],['setTimeout','clearTimeout','timeouts']]){
    const nativeSet=window[set],nativeClear=window[clear];window[set]=(fn,ms,...args)=>{let id;const action=(...values)=>{if(key==='timeouts')audit[key].delete(id);return fn(...values);};id=nativeSet(action,ms,...args);audit[key].set(id,ms);return id;};window[clear]=id=>{audit[key].delete(id);return nativeClear(id);};
   }
   const nativeSend=chrome.tabs.sendMessage.bind(chrome.tabs);
   chrome.tabs.sendMessage=(...args)=>{
    if(args[1]?.action==='getStatus'){
     const seq=audit.sent.length+1;audit.sent.push({id:args[0],seq});const cb=args.at(-1);
     if(typeof cb==='function')args[args.length-1]=response=>{audit.responses.push({id:args[0],seq,movieId:response?.movieId,offset:response?.offset});return cb(response);};
    }return nativeSend(...args);
   };
   const event=chrome.tabs.onActivated,add=event.addListener.bind(event),remove=event.removeListener.bind(event);
   add(info=>audit.activations.push(info));event.addListener=fn=>{audit.subscribers.add(fn);return add(fn);};event.removeListener=fn=>{audit.subscribers.delete(fn);return remove(fn);};
   addEventListener('DOMContentLoaded',()=>new MutationObserver(()=>audit.renders.push(document.getElementById('sync-value')?.textContent)).observe(document.getElementById('sync-value'),{childList:true,subtree:true,characterData:true}),{once:true});
  });
  await panel.goto(`chrome-extension://${id}/popup/popup.html`);
  const value=()=>panel.locator('#sync-value').textContent();
  const waitValue=text=>panel.waitForFunction(text=>document.getElementById('sync-value').textContent.includes(text),text,{timeout:5000});
  await active(tabA.id);await waitValue('1.1');await control(tabA.id,'fixture-hold');
  const count=await panel.evaluate(()=>__statusAudit.sent.length);
  await panel.waitForFunction(({id,count})=>__statusAudit.sent.slice(count).some(x=>x.id===id),{id:tabA.id,count},{timeout:2500});
  assert((await control(tabA.id,'fixture-stats')).held>0);
  await active(tabB.id);await waitValue('2.2');
  const mark=await panel.evaluate(()=>({renders:__statusAudit.renders.length,responses:__statusAudit.responses.length,sent:__statusAudit.sent.length}));
  const released=await control(tabA.id,'fixture-release',7700);assert(released.released>0);
  await panel.waitForFunction(({id,count})=>__statusAudit.responses.slice(count).some(x=>x.id===id),{id:tabA.id,count:mark.responses},{timeout:2500});
  const staleApplied=await panel.evaluate(mark=>__statusAudit.renders.slice(mark.renders).some(x=>x?.includes('7.7')),mark);
  if(mutant)return {name,staleApplied,value:await value(),actualIds:[tabA.id,tabB.id],moduleSha256:copy.moduleSha256,testedModuleSha256:copy.testedModuleSha256};
  assert.equal(staleApplied,false);assert((await value()).includes('2.2'));
  await panel.waitForFunction(({id,count})=>__statusAudit.sent.slice(count).some(x=>x.id===id),{id:tabB.id,count:mark.sent},{timeout:2500});
  const stalePolls=await panel.evaluate(({id,count})=>__statusAudit.sent.slice(count).filter(x=>x.id===id).length,{id:tabA.id,count:mark.sent});assert.equal(stalePolls,0);
  const switches=[];
  for(let i=0;i<10;i++){const tab=i%2===0?tabA:tabB,offset=i%2===0?'1.1':'2.2';await active(tab.id);await waitValue(offset);switches.push({tabId:tab.id,offset,value:await value()});}
  await control(tabB.id,'fixture-hold');const heldAt=await panel.evaluate(()=>__statusAudit.sent.length);
  await panel.waitForFunction(({id,count})=>__statusAudit.sent.slice(count).some(x=>x.id===id),{id:tabB.id,count:heldAt},{timeout:2500});
  const stopped=await panel.evaluate(()=>{dispatchEvent(new Event('pagehide'));return{value:document.getElementById('sync-value').textContent,responses:__statusAudit.responses.length,pollTimers:[...__statusAudit.intervals.values()].filter(ms=>ms===500).length,deadlines:[...__statusAudit.timeouts.values()].filter(ms=>ms===1500).length,subscribers:__statusAudit.subscribers.size};});
  assert.equal(stopped.pollTimers,0);assert.equal(stopped.deadlines,0);assert.equal(stopped.subscribers,0);
  assert((await control(tabB.id,'fixture-release',9900)).released>0);
  await panel.waitForFunction(count=>__statusAudit.responses.length>count,stopped.responses,{timeout:2500});assert.equal(await value(),stopped.value);
  return {name,staleApplied,stalePolls,switches,stopped,actualIds:[tabA.id,tabB.id],browser:context.browser()?.version(),moduleSha256:copy.moduleSha256,testedModuleSha256:copy.testedModuleSha256,coverage:'Real current popup and native tabs/onActivated/sendMessage; content status is an explicit offline fixture. Not live Netflix or native toolbar UX.'};
 }finally{await context.close();}
}
(async()=>{
 const positive=await variant('current'),negative=await variant('mutant',true);assert.equal(positive.moduleSha256,positive.testedModuleSha256);assert.notEqual(negative.moduleSha256,negative.testedModuleSha256);assert.equal(negative.staleApplied,true,'owner-guard mutation must be caught');
 const cases=[
  {name:'native delayed old-tab reply never overwrites the current popup',passed:!positive.staleApplied},
  {name:'ten native tab activations restore current-tab UI',passed:positive.switches.length===10},
  {name:'settled active tab never starts new polls for the old tab',passed:positive.stalePolls===0},
  {name:'pagehide stops polling/listeners and ignores the pending native reply',passed:positive.stopped.pollTimers===0&&positive.stopped.deadlines===0&&positive.stopped.subscribers===0},
  {name:'disposable owner-guard mutation is detected by the same UI oracle',passed:negative.staleApplied}
 ];
 const report={passed:true,total:cases.length,browserVersion:positive.browser,cases,errors:[],positive,negativeControl:negative};fs.writeFileSync(path.join(out,'native-status-churn.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(error=>{console.error(error);process.exitCode=1;});