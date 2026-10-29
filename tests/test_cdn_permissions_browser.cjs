// Real extension ISOLATED fetch + native CORS through a loopback-only TLS proxy.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http'),https=require('node:https'),net=require('node:net');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const artifacts=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/test_cdn_permissions_browser');fs.mkdirSync(artifacts,{recursive:true});
const domains=['nflxvideo.net','nflximg.net','nflxext.com','nflxso.net'];
const netflix='https://www.netflix.com';
const oldHosts=['https://*.netflix.com/*',...domains.map(host=>`https://*.${host}/*`)];
const cues='WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nOffline CDN cue\n';
const cases=[],errors=[],measurements=[];
async function offlineNetwork(){
 const requests=[],sockets=new Set();
 const track=socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));socket.on('error',()=>{});};
 const tls=https.createServer({key:fs.readFileSync(path.join(root,'tests/fixtures/cdn-network/server-key.pem')),cert:fs.readFileSync(path.join(root,'tests/fixtures/cdn-network/server-cert.pem'))},(req,res)=>{
  const host=req.headers.host?.split(':')[0],kind=req.url;
  requests.push({host,kind,origin:req.headers.origin||null});
  if(host==='www.netflix.com'&&kind!=='/same-origin.vtt'){res.writeHead(200,{'content-type':'text/html'});return res.end('<html><body>Offline permission fixture</body></html>');}
  const headers={'content-type':'text/vtt'};
  if(kind!=='/cors-denied')headers['access-control-allow-origin']=host==='cdn.nflxso.net'?'*':netflix;
  if(kind==='/redirect'){res.writeHead(302,{...headers,location:'https://cdn.nflxso.net/allowed'});return res.end();}
  res.writeHead(kind==='/forbidden'?403:200,headers);res.end(cues);
 });
 tls.on('connection',track);
 await new Promise(resolve=>tls.listen(0,'127.0.0.1',resolve));
 const proxy=http.createServer((_req,res)=>{res.writeHead(403);res.end();});proxy.on('connection',track);
 const allowed=new Set(['www.netflix.com',...domains.map(host=>`cdn.${host}`)]);
 proxy.on('connect',(req,client,head)=>{
  const [host,port]=req.url.split(':');
  if(port!=='443'||!allowed.has(host)){client.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
  const upstream=net.connect(tls.address().port,'127.0.0.1',()=>{
   client.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)upstream.write(head);client.pipe(upstream).pipe(client);
  });track(upstream);upstream.on('error',()=>client.destroy());client.on('error',()=>upstream.destroy());
 });
 await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
 return {requests,server:`http://127.0.0.1:${proxy.address().port}`,close:async()=>{for(const socket of sockets)socket.destroy();await Promise.all([new Promise(resolve=>proxy.close(resolve)),new Promise(resolve=>tls.close(resolve))]);}};
}
async function variant(name,hosts){
 const extension=fs.mkdtempSync(path.join(artifacts,`${name}-extension-`));
 const profile=fs.mkdtempSync(path.join(artifacts,`${name}-profile-`));
 let context,network;
 try{
  for(const folder of ['src','popup','icons','_locales','tools/local-diagnostics'])fs.cpSync(path.join(root,folder),path.join(extension,folder),{recursive:true});
  fs.writeFileSync(path.join(extension,'manifest.json'),JSON.stringify({...manifest,host_permissions:hosts},null,2));
  network=await offlineNetwork();const requests=network.requests;
  context=await chromium.launchPersistentContext(profile,{headless:true,channel:'chromium',proxy:{server:network.server},ignoreHTTPSErrors:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--disable-background-networking','--ignore-certificate-errors']});
  const page=await context.newPage(),cdp=await context.newCDPSession(page),worlds=[];
  cdp.on('Runtime.executionContextCreated',e=>worlds.push(e.context));await cdp.send('Runtime.enable');
  await page.goto(`${netflix}/watch/100`);
  let world;
  for(let attempt=0;attempt<40&&!world;attempt++){
   for(const candidate of worlds){try{const r=await cdp.send('Runtime.evaluate',{contextId:candidate.id,expression:'typeof OTTSubTrackFetcher === "object"',returnByValue:true});if(r.result.value){world=candidate.id;break;}}catch{}}
   if(!world)await page.waitForTimeout(50);
  }
  assert(world,'Actual extension ISOLATED downloader must load');
  const isolated=async expression=>{const r=await cdp.send('Runtime.evaluate',{contextId:world,expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const extensionId=await isolated('chrome.runtime.id');
  assert.equal(await page.evaluate(()=>typeof window.OTTSubTrackFetcher),'undefined','Downloader must not be evaluated in the MAIN world');
  const pageCors=await page.evaluate(async()=>{try{await fetch('https://cdn.nflxvideo.net/cors-denied');return 'readable';}catch{return 'blocked';}});
  assert.equal(pageCors,'blocked','Native page CORS must reject a response without allow-origin');
  cases.push({name:`${name}: native page CORS baseline`,passed:true});
  const check=async(label,urls,expected)=>{
   const result=await isolated(`OTTSubTrackFetcher.fetchTrackResult(${JSON.stringify(urls)}).then(r=>({status:r.status,count:r.cues.length,text:r.cues[0]?.text||null,rejected:r.rejectedUrls.length}))`);
   assert.equal(result.status,expected,`${name}: ${label}: ${JSON.stringify(result)}`);
   if(expected==='ready'){assert.equal(result.count,1);assert.equal(result.text,'Offline CDN cue');}else assert.equal(result.count,0);
   cases.push({name:`${name}: ${label}`,passed:true});
   measurements.push({variant:name,label,result});
  };
  for(const host of domains){
   await check(`${host} CORS allowed`,[`https://cdn.${host}/allowed`],'ready');
   await check(`${host} CORS denied`,[`https://cdn.${host}/cors-denied`],'failed');
  }
  await check('same-origin subtitle',[`${netflix}/same-origin.vtt`],'ready');
  await check('cross-CDN redirect',['https://cdn.nflxvideo.net/redirect'],'ready');
  await check('rejected address retained',['https://cdn.nflxvideo.net/forbidden'],'addresses-rejected');
  const before=requests.length;
  await check('untrusted host rejected',['https://cdn.nflxvideo.net.evil.test/allowed'],'failed');
  await check('HTTP rejected',['http://cdn.nflxvideo.net/allowed'],'failed');
  assert.equal(requests.length,before,'URL safety failures must not issue HTTP requests');
  assert(requests.filter(r=>domains.some(d=>r.host.endsWith(d))).every(r=>r.origin===netflix||r.origin==='null'),'Content requests must retain page CORS origin semantics, including cross-origin redirect taint');
  const panel=await context.newPage();await panel.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  const state=await panel.evaluate(async()=>({hosts:(await chrome.permissions.getAll()).origins,tab:(await chrome.tabs.query({url:'https://www.netflix.com/watch/*'}))[0]}));
  assert.deepEqual(state.hosts.sort(),hosts.slice().sort());assert.equal(state.tab.url,`${netflix}/watch/100`);
  cases.push({name:`${name}: declared hosts and Netflix tab visibility`,passed:true});
  measurements.push({variant:name,hosts:state.hosts,requests});
 }finally{
  await context?.close();
  if(network){measurements.push({variant:name,requests:network.requests});await network.close();}
  for(const target of [extension,profile]){if(!path.resolve(target).startsWith(path.resolve(artifacts)+path.sep))throw Error('Unsafe QA cleanup');fs.rmSync(target,{recursive:true,force:true});}
 }
}
(async()=>{
 try{assert.deepEqual(manifest.host_permissions,['https://*.netflix.com/*']);await variant('five-hosts',oldHosts);await variant('netflix-only',manifest.host_permissions);}
 catch(error){errors.push(error.stack);}
 fs.writeFileSync(path.join(artifacts,'cdn-permissions-measurements.json'),JSON.stringify({measurements,coverage:'Offline Chromium with real extension ISOLATED downloader. Not live Netflix, account access, DRM or Mac verification.'},null,2));
 console.log(JSON.stringify({passed:!errors.length,total:cases.length,cases,errors},null,2));if(errors.length)process.exitCode=1;
})();
