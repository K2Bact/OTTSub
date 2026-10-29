// Render actual package UI with separately served, disclosed demonstration state.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'../..'),locale=process.argv[2];
assert(['he','ms','bn','tr','pt-PT','ru','th','fi'].includes(locale),'Usage: node store_assets/common/capture-localized.cjs he|ms|bn|tr|pt-PT|ru|th|fi [--runtime <reviewed package-input directory>]');
const sourceArgs=process.argv.slice(3);
assert(sourceArgs.length===0||sourceArgs.length===2&&['--runtime','--zip-runtime'].includes(sourceArgs[0]),'Unexpected source options');
const developmentRuntime=sourceArgs[0]==='--runtime';
const assetLocale=locale==='pt-PT'?'pt-pt':locale;
const out=path.join(root,'store_assets',assetLocale),config=JSON.parse(fs.readFileSync(path.join(out,'source/slides.json'),'utf8'));
const version=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')).version;
const runtime=fs.realpathSync(sourceArgs.length?path.resolve(root,sourceArgs[1]):path.join(root,'artifacts/releases',version,'runtime'));
assert(runtime.startsWith(root+path.sep),'Runtime snapshot must remain inside OTTSub');
const manifest=JSON.parse(fs.readFileSync(path.join(runtime,'manifest.json'),'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const zip=developmentRuntime?null:path.join(root,'dist',`ottsub-store-${version}.zip`),zipHash=zip?hash(zip):null;
function sourceHashes(dir=runtime){return Object.fromEntries(fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
 const file=path.join(dir,entry.name);assert(!entry.isSymbolicLink(),'Snapshot links are forbidden');
 return entry.isDirectory()?Object.entries(sourceHashes(file)):[[path.relative(runtime,file).replaceAll('\\','/'),hash(file)]];
}));}
const runtimeHashes=sourceHashes();
if(zip){const receipt=JSON.parse(fs.readFileSync(path.join(root,'dist/package-report.json'),'utf8'));assert.equal(receipt.sha256,zipHash);assert.deepEqual(runtimeHashes,receipt.files);}
assert.equal(manifest.version,version);assert.equal(manifest.version_name,undefined);
const html=fs.readFileSync(path.join(__dirname,'localized-preview.html'),'utf8').replace('{{LANG}}',locale).replace('{{DIR}}',config.direction);
const fixture=`window.storePreview=${JSON.stringify({locale,languageName:config.languageName,manifest})};\n`+fs.readFileSync(path.join(__dirname,'localized-fixture.js'),'utf8');
const names=[`screenshot1_dual_${assetLocale}.jpg`,`screenshot2_sync_${assetLocale}.jpg`,`screenshot3_learning_${assetLocale}.jpg`];
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report={version,locale,demoData:true,uploaded:false,packageSha256:zipHash,
  productSource:developmentRuntime?'Reviewed sanitized package inputs; actual popup HTML/CSS/JS with simulated Chrome API and tracks':'Extracted upload ZIP; actual popup HTML/CSS/JS with simulated Chrome API and tracks',
  developmentBuild:developmentRuntime?JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')).version_name:null,
  runtimeSource:path.relative(root,runtime).replaceAll('\\','/'),runtimeHashes,screenshots:[]};
 try{
  for(let i=0;i<3;i++){
   const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url()),pathname=url.pathname;
    if(url.hostname!=='ottsub-preview.test')return route.abort();
    if(pathname==='/slides.json')return route.fulfill({contentType:'application/json; charset=utf-8',body:JSON.stringify(config)});
    if(pathname==='/fixture.js')return route.fulfill({contentType:'application/javascript; charset=utf-8',body:fixture});
    if(pathname==='/panel.html')return route.fulfill({contentType:'text/html; charset=utf-8',body:fs.readFileSync(path.join(runtime,'popup/popup.html'),'utf8').replace('<head>','<head><base href="/popup/"><script src="/fixture.js"></script>')});
    if(pathname==='/'||pathname==='/index.html')return route.fulfill({contentType:'text/html; charset=utf-8',body:html});
    const file=/^\/(popup|src|icons)\//.test(pathname)?path.resolve(runtime,'.'+pathname):null;
    if(!file||!file.startsWith(runtime+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
    const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
    return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
   });
   await page.goto(`http://ottsub-preview.test/?slide=${i+1}`);
   await page.waitForFunction(()=>window.previewReady);
   const panel=await(await page.locator('#panel').elementHandle()).contentFrame();
   await panel.waitForFunction(({locale,version})=>window.OTTSubI18n?.getLanguage()===locale&&document.getElementById('build-version')?.textContent===version,{locale,version});
   await panel.waitForFunction(()=>document.getElementById('status-badge').classList.contains('active'));
   if(i===1)await panel.locator('#sync-slider').evaluate(el=>{el.value='-100';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
   await page.evaluate(()=>document.fonts.ready);await panel.evaluate(()=>document.fonts.ready);
   const state=await panel.evaluate(()=>({language:OTTSubI18n.getLanguage(),direction:document.documentElement.dir,version:document.getElementById('build-version').textContent,primary:document.getElementById('primary-lang-select').value,secondary:document.getElementById('secondary-lang-select').value,overflow:document.documentElement.scrollWidth>innerWidth,sync:document.getElementById('sync-value').textContent,slider:document.getElementById('sync-slider').value,blur:document.querySelector('#blur-target-control .active')?.dataset.target,hoverPause:document.getElementById('hover-pause-toggle').checked,learningExpanded:document.getElementById('learning-toggle-btn')?.getAttribute('aria-expanded'),learningDisplayed:getComputedStyle(document.getElementById('learning-body')).display!=='none'}));
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,detailBottom:document.querySelector('.detail').getBoundingClientRect().bottom,footerTop:document.querySelector('.footer').getBoundingClientRect().top,textOverflow:[...document.querySelectorAll('h1,.description,.line1,.line2,.keylabel,.hint')].filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.className||el.tagName)}));
   assert.equal(state.language,locale);assert.equal(state.direction,config.direction);assert.equal(state.version,version);assert.equal(state.primary,'en');assert.equal(state.secondary,locale.toLowerCase());assert.equal(state.overflow,false);assert.equal(layout.overflow,false);assert.deepEqual(layout.textOverflow,[]);assert(layout.detailBottom<layout.footerTop-8);assert.deepEqual(errors,[]);
   if(i===1){assert.equal(state.slider,'-100');assert.match(state.sync,/-0[.,]1/);}
   if(i===2){assert.equal(state.blur,'secondary');assert.equal(state.hoverPause,true);assert.equal(state.learningExpanded,'true');assert.equal(state.learningDisplayed,true);}
   await page.screenshot({path:path.join(out,names[i]),type:'jpeg',quality:95});
   report.screenshots.push({file:names[i],width:1280,height:800,format:'JPEG',sha256:hash(path.join(out,names[i])),ui:state,layout,pageErrors:errors});
   await page.close();
  }
  if(zip)assert.equal(hash(zip),zipHash);assert.deepEqual(sourceHashes(),runtimeHashes);
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({locale,version,passed:true,screenshots:report.screenshots.length,packageSha256:zipHash}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
