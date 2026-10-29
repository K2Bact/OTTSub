const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
let chromium;
try { ({chromium} = require('playwright')); }
catch { ({chromium} = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }
const root = path.resolve(__dirname, '../../..');
const out = path.dirname(__dirname);
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const zip = path.join(root, 'dist/ottsub-store-1.3.2.zip');
const zipHash = hash(zip);
const slides = [
 {eyebrow:'01 / ZWEISPRACHIGE UNTERTITEL', headline:'Zwei Sprachen.<br>Ein Blick.', description:'Wähle zwei verfügbare Untertitelsprachen.<br>Stelle beide in der Seitenleiste ein.', detail:'<div class="demo-screen"><div class="demo-label">UNTERTITELBEISPIEL</div><div class="line1">Let’s take the long way home.</div><div class="line2">Nehmen wir den längeren Weg nach Hause.</div></div><p class="hint">Englisch + Deutsch · Beide Sprachen separat einstellbar</p>'},
 {eyebrow:'02 / SYNCHRONISATION', headline:'Untertitel im<br>richtigen Takt.', description:'Passe das Timing jeder Sprache separat an.<br>In präzisen Schritten von 0,1 Sekunden.', detail:'<div class="keyrow"><div class="keycard"><div class="keys">[ &nbsp; ]</div><div class="keylabel">Hauptuntertitel<br><span class="accent">−0,1 s / +0,1 s</span></div></div><div class="keycard"><div class="keys">Alt + [ / ]</div><div class="keylabel">Zweituntertitel<br><span class="accent">−0,1 s / +0,1 s</span></div></div></div><p class="hint">Auch über die Regler in der Seitenleiste einstellbar.</p>'},
 {eyebrow:'03 / SPRACHEN LERNEN', headline:'Sprachen lernen.<br>Zeile für Zeile.', description:'Blende die Übersetzung zum Üben unscharf aus.<br>Pausiere beim Zeigen auf die Untertitel.', detail:'<div class="demo-screen"><div class="demo-label">ÜBUNGSBEISPIEL</div><div class="line1">One more step. You’re almost there.</div><div class="line2" style="filter:blur(5px)">Noch ein Schritt. Du bist fast am Ziel.</div></div><div class="steps"><div class="step"><span class="num">1</span>Lesen</div><div class="step"><span class="num">2</span>Prüfen</div><div class="step"><span class="num">3</span>Weitersehen</div></div>'}
];
// Reuse the established store layout, with German copy and the current real UI.
let html = fs.readFileSync(path.join(root, 'store_assets/es/source/index.html'), 'utf8')
 .replace('<html lang="es">', '<html lang="de">')
 .replace('Capturas en español', 'Screenshots auf Deutsch')
 .replace('Panel lateral · Ajustes de OTTSub', 'Seitenleiste · OTTSub-Einstellungen')
 .replace('Interfaz de OTTSub en español', 'OTTSub-Einstellungen auf Deutsch')
 .replace('Para Netflix · Los idiomas disponibles varían según el título. Interfaz y subtítulos con datos de demostración.', 'Für Netflix · Verfügbare Sprachen variieren je nach Titel. Oberfläche und Untertitel mit Demodaten.')
 .replace(/const slides=\[[\s\S]*?\];const s=/, `const slides=${JSON.stringify(slides)};const s=`);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
let fixture = fs.readFileSync(path.join(root, 'store_assets/es/source/fixture.js'), 'utf8')
 .replaceAll("'es'", "'de'").replaceAll("'Español'", "'Deutsch'")
 .replace("version:'1.3.1'", "version:'1.3.2'")
 .replace("ready:true, movieId:'demo'", "ready:true, build:'1.3.2', movieId:'100', blurTarget:slide===3?'secondary':'none', blurMode:'blur_8', hoverPause:true")
 .replace('watch/demo', 'watch/100');
fs.writeFileSync(path.join(__dirname, 'fixture.js'), fixture);
const names = ['screenshot1_dual_de.jpg', 'screenshot2_sync_de.jpg', 'screenshot3_learning_de.jpg'];
(async () => {
 const browser = await chromium.launch({headless:true});
 const report = {version:'1.3.2', locale:'de', demoData:true, uploaded:false, screenshots:[], packageSha256:zipHash};
 try {
  for (let i=0; i<3; i++) {
   const page = await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
   const errors=[];
   page.on('pageerror', error => errors.push(error.message));
   await page.route('**/*', async route => {
    const pathname = new URL(route.request().url()).pathname;
    let file;
    if (pathname==='/panel.html') {
     const panel=fs.readFileSync(path.join(root,'popup/popup.html'),'utf8').replace('<head>','<head><base href="/popup/"><script src="/fixture.js"></script>');
     return route.fulfill({contentType:'text/html; charset=utf-8',body:panel});
    }
    if (pathname==='/' || pathname==='/index.html') file=path.join(__dirname,'index.html');
    else if (pathname==='/fixture.js') file=path.join(__dirname,'fixture.js');
    else if (/^\/(popup|src|icons)\//.test(pathname)) file=path.resolve(root,'.'+pathname);
    if (!file || !file.startsWith(root+path.sep) || !fs.existsSync(file)) return route.fulfill({status:404,body:'Not found'});
    const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
    return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
   });
   await page.goto(`http://ottsub-preview.test/?slide=${i+1}`);
   const panel=page.frames().find(frame=>frame.url().includes('/panel.html'));
   await panel.waitForFunction(()=>window.OTTSubI18n?.getLanguage()==='de' && document.getElementById('build-version')?.textContent==='1.3.2');
   await panel.waitForFunction(()=>document.getElementById('status-badge').classList.contains('active'));
   if (i===1) await panel.locator('#sync-slider').evaluate(el=>{el.value='-100';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
   await page.evaluate(()=>document.fonts.ready);
   await panel.evaluate(()=>document.fonts.ready);
   const state=await panel.evaluate(()=>({language:OTTSubI18n.getLanguage(),version:document.getElementById('build-version').textContent,primary:document.getElementById('primary-lang-select').value,secondary:document.getElementById('secondary-lang-select').value,overflow:document.documentElement.scrollWidth>innerWidth,sync:document.getElementById('sync-value').textContent,blur:document.querySelector('#blur-target-control .active')?.dataset.target,hoverPause:document.getElementById('hover-pause-toggle').checked}));
   assert.equal(state.language,'de'); assert.equal(state.version,'1.3.2'); assert.equal(state.secondary,'de'); assert.equal(state.overflow,false); assert.deepEqual(errors,[]);
   if(i===2){assert.equal(state.blur,'secondary');assert.equal(state.hoverPause,true);}
   const file=path.join(out,names[i]);
   await page.screenshot({path:file,type:'jpeg',quality:95});
   report.screenshots.push({file:names[i],width:1280,height:800,format:'JPEG',sha256:hash(file),ui:state,pageErrors:errors});
   await page.close();
  }
  assert.equal(hash(zip),zipHash,'Existing store ZIP remains unchanged');
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
