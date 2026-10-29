const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'../../..'),out=path.dirname(__dirname);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const zip=path.join(root,'dist/ottsub-store-1.3.3.zip'),zipHash=hash(zip);
const slides=[
 {eyebrow:'01 / दो भाषाओं के उपशीर्षक',headline:'दो भाषाएँ,<br>एक साथ।',description:'Netflix पर उपलब्ध उपशीर्षकों में से<br>मुख्य और सहायक भाषा चुनें।',detail:'<div class="demo-screen"><div class="demo-label">उपशीर्षक का उदाहरण</div><div class="line1">Let’s take the long way home.</div><div class="line2">चलो लंबे रास्ते से घर चलें।</div></div><p class="hint">अंग्रेज़ी ＋ हिन्दी · हर भाषा की अलग सेटिंग</p>'},
 {eyebrow:'02 / समय समायोजन',headline:'उपशीर्षकों का समय<br>अपनी पसंद से बदलें।',description:'हर भाषा का समय अलग-अलग बदलें।<br>0.1 सेकंड के चरणों में समायोजन करें।',detail:'<div class="keyrow"><div class="keycard"><div class="keys">[ &nbsp; ]</div><div class="keylabel">मुख्य भाषा<br><span class="accent">−0.1 / +0.1 सेकंड</span></div></div><div class="keycard"><div class="keys">Alt + [ / ]</div><div class="keylabel">सहायक भाषा<br><span class="accent">−0.1 / +0.1 सेकंड</span></div></div></div><p class="hint">Mac पर Option · Windows पर Alt। पैनल के स्लाइडर से भी समय बदलें।</p>'},
 {eyebrow:'03 / भाषा सीखना',headline:'उपशीर्षकों से सीखें।<br>अपने ढंग से।',description:'सहायक उपशीर्षक धुंधले करके अभ्यास करें।<br>माउस ऊपर ले जाने पर वीडियो रोकें।',detail:'<div class="demo-screen"><div class="demo-label">सीखने का उदाहरण</div><div class="line1">One more step. You’re almost there.</div><div class="line2" style="filter:blur(5px)">बस एक कदम और। मंज़िल पास है।</div></div><div class="steps"><div class="step"><span class="num">1</span>पढ़ें</div><div class="step"><span class="num">2</span>जाँचें</div><div class="step"><span class="num">3</span>आगे देखें</div></div>'}
];
let html=fs.readFileSync(path.join(root,'store_assets/es/source/index.html'),'utf8')
 .replace('<html lang="es">','<html lang="hi">').replace('Capturas en español','हिन्दी स्क्रीनशॉट')
 .replace('Panel lateral · Ajustes de OTTSub','साइड पैनल · OTTSub सेटिंग').replace('Interfaz de OTTSub en español','OTTSub का हिन्दी इंटरफ़ेस')
 .replace('Para Netflix · Los idiomas disponibles varían según el título. Interfaz y subtítulos con datos de demostración.','Netflix के लिए · उपलब्ध भाषाएँ शीर्षक पर निर्भर करती हैं। इंटरफ़ेस और उपशीर्षकों में डेमो डेटा है।')
 .replace('</style>','body{font-family:"Nirmala UI","Noto Sans Devanagari","Segoe UI",sans-serif}h1{font-size:48px;line-height:1.35;letter-spacing:0}.eyebrow,.demo-label{letter-spacing:0}.line1,.keys{font-family:"Segoe UI",Arial,sans-serif}.keys{font-size:26px}</style>')
 .replace(/const slides=\[[\s\S]*?\];const s=/,`const slides=${JSON.stringify(slides)};const s=`);
fs.writeFileSync(path.join(__dirname,'index.html'),html);
const names=['screenshot1_dual_hi.jpg','screenshot2_sync_hi.jpg','screenshot3_learning_hi.jpg'];
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report={version:'1.3.3',locale:'hi',demoData:true,uploaded:false,screenshots:[],packageSha256:zipHash};
 try{
  for(let i=0;i<3;i++){
   const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',async route=>{
    const pathname=new URL(route.request().url()).pathname;
    if(pathname==='/panel.html')return route.fulfill({contentType:'text/html; charset=utf-8',body:fs.readFileSync(path.join(root,'popup/popup.html'),'utf8').replace('<head>','<head><base href="/popup/"><script src="/fixture.js"></script>')});
    const file=pathname==='/'||pathname==='/index.html'?path.join(__dirname,'index.html'):pathname==='/fixture.js'?path.join(__dirname,'fixture.js'):/^\/(popup|src|icons)\//.test(pathname)?path.resolve(root,'.'+pathname):null;
    if(!file||!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
    const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
    return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
   });
   await page.goto(`http://ottsub-preview.test/?slide=${i+1}`);
   const panel=page.frames().find(frame=>frame.url().includes('/panel.html'));
   await panel.waitForFunction(()=>window.OTTSubI18n?.getLanguage()==='hi'&&document.getElementById('build-version')?.textContent==='1.3.3');
   await panel.waitForFunction(()=>document.getElementById('status-badge').classList.contains('active'));
   if(i===1)await panel.locator('#sync-slider').evaluate(el=>{el.value='-100';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
   await page.evaluate(()=>document.fonts.ready);await panel.evaluate(()=>document.fonts.ready);
   const state=await panel.evaluate(()=>({language:OTTSubI18n.getLanguage(),version:document.getElementById('build-version').textContent,primary:document.getElementById('primary-lang-select').value,secondary:document.getElementById('secondary-lang-select').value,overflow:document.documentElement.scrollWidth>innerWidth,sync:document.getElementById('sync-value').textContent,blur:document.querySelector('#blur-target-control .active')?.dataset.target,hoverPause:document.getElementById('hover-pause-toggle').checked}));
   assert.equal(state.language,'hi');assert.equal(state.version,'1.3.3');assert.equal(state.primary,'en');assert.equal(state.secondary,'hi');assert.equal(state.overflow,false);assert.deepEqual(errors,[]);
   if(i===2){assert.equal(state.blur,'secondary');assert.equal(state.hoverPause,true);}
   await page.screenshot({path:path.join(out,names[i]),type:'jpeg',quality:95});
   report.screenshots.push({file:names[i],width:1280,height:800,format:'JPEG',sha256:hash(path.join(out,names[i])),ui:state,pageErrors:errors});
   await page.close();
  }
  assert.equal(hash(zip),zipHash);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
