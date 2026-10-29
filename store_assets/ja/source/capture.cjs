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
 {eyebrow:'01 / 二言語字幕', headline:'2つの言語を、<br>ひと目で。', description:'利用できる字幕から2つの言語を選択。<br>サイドパネルでそれぞれ設定できます。', detail:'<div class="demo-screen"><div class="demo-label">字幕の表示例</div><div class="line1">Let’s take the long way home.</div><div class="line2">遠回りして帰ろう。</div></div><p class="hint">英語 ＋ 日本語 · 言語ごとに設定可能</p>'},
 {eyebrow:'02 / 字幕の同期', headline:'字幕のタイミングを<br>思いどおりに。', description:'言語ごとに字幕のタイミングを調整。<br>0.1秒単位で細かく合わせられます。', detail:'<div class="keyrow"><div class="keycard"><div class="keys">[ &nbsp; ]</div><div class="keylabel">主字幕<br><span class="accent">−0.1秒 / +0.1秒</span></div></div><div class="keycard"><div class="keys">Alt + [ / ]</div><div class="keylabel">副字幕<br><span class="accent">−0.1秒 / +0.1秒</span></div></div></div><p class="hint">サイドパネルのスライダーでも調整できます。</p>'},
 {eyebrow:'03 / 語学学習', headline:'字幕で学ぶ。<br>一行ずつ。', description:'訳文をぼかして、理解力を試す。<br>字幕にマウスを重ねると一時停止できます。', detail:'<div class="demo-screen"><div class="demo-label">学習の表示例</div><div class="line1">One more step. You’re almost there.</div><div class="line2" style="filter:blur(5px)">あと一歩。もうすぐだよ。</div></div><div class="steps"><div class="step"><span class="num">1</span>読む</div><div class="step"><span class="num">2</span>確認する</div><div class="step"><span class="num">3</span>続きを見る</div></div>'}
];
// Reuse the established store layout, with Japanese copy and the current real UI.
let html = fs.readFileSync(path.join(root, 'store_assets/es/source/index.html'), 'utf8')
 .replace('<html lang="es">', '<html lang="ja">')
 .replace('Capturas en español', '日本語のスクリーンショット')
 .replace('Panel lateral · Ajustes de OTTSub', 'サイドパネル · OTTSubの設定')
 .replace('Interfaz de OTTSub en español', 'OTTSubの日本語設定画面')
 .replace('Para Netflix · Los idiomas disponibles varían según el título. Interfaz y subtítulos con datos de demostración.', 'Netflix用 · 利用できる言語は作品によって異なります。画面と字幕はデモデータです。')
 .replace('</style>', 'body{font-family:"Yu Gothic","Meiryo","Segoe UI",sans-serif}h1{font-size:54px;line-height:1.25;letter-spacing:-1px}.eyebrow{letter-spacing:1px}.demo-label{letter-spacing:1px}.line1{font-family:"Segoe UI",Arial,sans-serif}.keys{font-size:26px}</style>')
 .replace(/const slides=\[[\s\S]*?\];const s=/, `const slides=${JSON.stringify(slides)};const s=`);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
let fixture = fs.readFileSync(path.join(root, 'store_assets/es/source/fixture.js'), 'utf8')
 .replaceAll("'es'", "'ja'").replaceAll("'Español'", "'日本語'")
 .replace("version:'1.3.1'", "version:'1.3.2'")
 .replace("ready:true, movieId:'demo'", "ready:true, build:'1.3.2', movieId:'100', blurTarget:slide===3?'secondary':'none', blurMode:'blur_8', hoverPause:true")
 .replace('watch/demo', 'watch/100');
fs.writeFileSync(path.join(__dirname, 'fixture.js'), fixture);
const names = ['screenshot1_dual_ja.jpg', 'screenshot2_sync_ja.jpg', 'screenshot3_learning_ja.jpg'];
(async () => {
 const browser = await chromium.launch({headless:true});
 const report = {version:'1.3.2', locale:'ja', demoData:true, uploaded:false, screenshots:[], packageSha256:zipHash};
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
   await panel.waitForFunction(()=>window.OTTSubI18n?.getLanguage()==='ja' && document.getElementById('build-version')?.textContent==='1.3.2');
   await panel.waitForFunction(()=>document.getElementById('status-badge').classList.contains('active'));
   if (i===1) await panel.locator('#sync-slider').evaluate(el=>{el.value='-100';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
   await page.evaluate(()=>document.fonts.ready);
   await panel.evaluate(()=>document.fonts.ready);
   const state=await panel.evaluate(()=>({language:OTTSubI18n.getLanguage(),version:document.getElementById('build-version').textContent,primary:document.getElementById('primary-lang-select').value,secondary:document.getElementById('secondary-lang-select').value,overflow:document.documentElement.scrollWidth>innerWidth,sync:document.getElementById('sync-value').textContent,blur:document.querySelector('#blur-target-control .active')?.dataset.target,hoverPause:document.getElementById('hover-pause-toggle').checked}));
   assert.equal(state.language,'ja'); assert.equal(state.version,'1.3.2'); assert.equal(state.secondary,'ja'); assert.equal(state.overflow,false); assert.deepEqual(errors,[]);
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
