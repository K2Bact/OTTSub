const {supportedUILocales}=require('./helpers/ui-locales.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,setSaved}=require('./test_hindi_track_kind_browser.cjs');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join((process.env.USERPROFILE || process.env.HOME),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
const root=path.resolve(__dirname,'..'),cases=[],errors=[];
const artifacts=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/test_language_names_browser');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const check=async(name,action)=>{try{await action();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
 try{
  const page=await browser.newPage({viewport:{width:320,height:900}});page.setDefaultTimeout(5000);
  const routeHandler=async route=>{
   const pathname=new URL(route.request().url()).pathname;
   if(pathname==='/fixture.js')return route.fulfill({contentType:'application/javascript',body:fixture()+';window.demoStatus.availableTracks=null;'});
   const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'missing'});
   let body=fs.readFileSync(file);if(pathname==='/popup/popup.html')body=body.toString().replace('<head>','<head><script src="/fixture.js"></script>');
   return route.fulfill({contentType:({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)]||'application/octet-stream',body});
  };
  await page.route('**/*',routeHandler);
  setSaved({ottsub_ui_lang:'en',ottsub_primary_lang:'es-es',ottsub_secondary_lang:'es-es',ottsub_sub_settings_collapsed:false});
  await page.goto('http://ottsub.test/popup/popup.html');
  await page.waitForFunction(()=>document.documentElement.lang==='en'&&document.querySelector('#secondary-lang-select')?.value==='es-es');
  await check('English waiting primary/secondary labels say Spanish while exact es-es preference stays saved',async()=>{
   for(const id of ['primary-lang-select','secondary-lang-select']){assert.equal(await page.locator('#'+id).inputValue(),'es-es');const text=await page.locator('#'+id+' option:checked').textContent();assert.match(text,/^Spanish —/);assert.doesNotMatch(text,/European/);}
   const saved=await page.evaluate(()=>({primary:savedSettings.ottsub_primary_lang,secondary:savedSettings.ottsub_secondary_lang,changes:commands.filter(c=>/set_(?:primary|secondary)_lang/.test(c.action))}));assert.equal(saved.primary,'es-es');assert.equal(saved.secondary,'es-es');assert.equal(saved.changes.length,0);await page.screenshot({path:path.join(artifacts,'spanish-waiting-en.png'),fullPage:true});
  });
  await check('loaded Spain and Latin-American tracks remain distinct and selection commands keep regional code',async()=>{
   await page.evaluate(()=>demoStatus.availableTracks=[{bcp47:'es-ES',label:'Spanish',isCC:false,urls:['spain']},{bcp47:'es-419',label:'Spanish (Latin America)',isCC:false,urls:['latam']}]);
   await page.waitForFunction(()=>document.querySelector('#secondary-lang-select option[value="es-419"]'));
   for(const id of ['primary-lang-select','secondary-lang-select']){assert.equal(await page.locator('#'+id+' option[value="es-es"]').textContent(),'Spanish');assert.notEqual(await page.locator('#'+id+' option[value="es-419"]').textContent(),'Spanish');}
   await page.selectOption('#secondary-lang-select','es-419');await page.waitForFunction(()=>commands.some(c=>c.action==='set_secondary_lang'&&c.value.lang==='es-419'));await page.selectOption('#secondary-lang-select','es-es');await page.waitForFunction(()=>commands.some(c=>c.action==='set_secondary_lang'&&c.value.lang==='es-es'));
  });
  await check('language switching preserves Spain label and preference across supported locales',async()=>{
   for(const locale of supportedUILocales()){await page.selectOption('#ui-lang-select',locale);await page.waitForFunction(l=>document.documentElement.lang===l,locale);const row=await page.evaluate(async()=>{const {getLocalizedLanguageLabel}=await import('/popup/modules/ui-dual.js');const locale=document.documentElement.lang;return{selected:document.querySelector('#secondary-lang-select').value,label:document.querySelector('#secondary-lang-select option[value="es-es"]').textContent,expected:getLocalizedLanguageLabel({bcp47:'es'},locale),scroll:document.documentElement.scrollWidth,width:innerWidth};});assert.equal(row.selected,'es-es');assert.equal(row.label,row.expected);assert(row.scroll<=row.width);}
  });
  await check('Korean provider names follow Netflix while ordinary/CC preference stays separate',async()=>{
   await page.selectOption('#ui-lang-select','ko');await page.waitForFunction(()=>document.documentElement.lang==='ko');await page.evaluate(()=>demoStatus.availableTracks=[{bcp47:'es-ES',label:'스페인어',isCC:false,urls:['spain']},{bcp47:'es-ES',label:'스페인어(CC)',isCC:true,urls:['spain-cc']},{bcp47:'es-419',label:'스페인어(라틴아메리카)',isCC:false,urls:['latam']}]);
   await page.waitForFunction(()=>document.querySelector('#secondary-lang-select option[value="es-419"]')?.textContent==='스페인어(라틴아메리카)');assert.equal(await page.locator('#secondary-lang-select option[value="es-es"]').textContent(),'스페인어');assert.equal(await page.locator('#primary-lang-select option[value="es-es"]').textContent(),'스페인어');assert.equal(await page.locator('#secondary-track-kind').inputValue(),'cc');await page.screenshot({path:path.join(artifacts,'spanish-loaded-ko.png'),fullPage:true});
  });
  await check('removed keyboard-layout note stays absent while translated shortcuts fit all supported 320px panels',async()=>{
   for(const locale of supportedUILocales()){
    await page.selectOption('#ui-lang-select',locale);await page.waitForFunction(l=>document.documentElement.lang===l,locale);
    if(await page.locator('#shortcuts-toggle-btn').getAttribute('aria-expanded')==='false')await page.click('#shortcuts-toggle-btn');
    assert.equal(await page.locator('[data-i18n="keyboard_layout_help"]').count(),0);
    assert(await page.locator('#shortcut-list .shortcut-item').count()>0);
    const data=await page.locator('[data-i18n="shortcut_01"]').evaluate(el=>({text:el.textContent,expected:OTTSubI18n.t('shortcut_01')}));
    assert.equal(data.text,data.expected);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   }
  });
  await check('Hebrew menu saves and restores RTL, translated controls and the existing support link',async()=>{
   await page.selectOption('#ui-lang-select','he');await page.waitForFunction(()=>savedSettings.ottsub_ui_lang==='he');
   setSaved(await page.evaluate(()=>({...savedSettings})));await page.reload();
   await page.waitForFunction(()=>document.documentElement.lang==='he'&&document.getElementById('status-badge').classList.contains('active'));
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'he');assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
   assert.equal(await page.locator('#ui-lang-select').getAttribute('aria-label'),'שפת הממשק');
   assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'שפה ראשית');
   assert.match(await page.locator('#sub-status').textContent(),/מקטעים/);
   assert.equal(await page.locator('#btn-ctee').getAttribute('href'),'https://buymeacoffee.com/k2bact');
   await page.selectOption('#ui-lang-select','en');await page.waitForFunction(()=>document.documentElement.lang==='en');
   assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
  });
  await check('Hebrew provider labels and normal/CC identity stay distinct across UI languages',async()=>{
   const result=await page.evaluate(async()=>{
    const {getLocalizedLanguageLabel:label}=await import('/popup/modules/ui-dual.js');
    return {he:label({bcp47:'he-IL',label:'עברית (ישראל)',labelLocale:'he'},'he'),en:label({bcp47:'he-IL',label:'עברית (ישראל)',labelLocale:'en'},'en'),cc:label({bcp47:'he-IL',label:'עברית',isCC:true},'he')};
   });
   assert.equal(result.he,'עברית (ישראל)');assert.match(result.en,/Hebrew/);assert.doesNotMatch(result.en,/[\u0590-\u05ff]/);assert.equal(result.cc,'עברית [CC]');
  });
  await check('Malay restores from storage, returns from RTL to LTR and preserves exact subtitle identity',async()=>{
   await page.selectOption('#ui-lang-select','he');
   await page.waitForFunction(()=>document.documentElement.dir==='rtl');
   await page.selectOption('#ui-lang-select','ms');
   await page.waitForFunction(()=>savedSettings.ottsub_ui_lang==='ms');
   setSaved(await page.evaluate(()=>({...savedSettings})));await page.reload();
   await page.waitForFunction(()=>document.documentElement.lang==='ms'&&document.getElementById('status-badge').classList.contains('active'));
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'ms');
   assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
   assert.equal(await page.locator('#ui-lang-select').getAttribute('aria-label'),'Bahasa antara muka');
   assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'Bahasa utama');
   assert.match(await page.locator('#sub-status').textContent(),/segmen/);
   assert.equal(await page.locator('#primary-track-kind option[value="cc"]').getAttribute('title'),'CC (penerangan bunyi)');
   assert.equal(await page.locator('#secondary-lang-select').inputValue(),'es-es');
   assert.equal(await page.locator('#btn-ctee').getAttribute('href'),'https://buymeacoffee.com/k2bact');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const labels=await page.evaluate(async()=>{
    const {getLocalizedLanguageLabel:label}=await import('/popup/modules/ui-dual.js');
    return {ms:label({bcp47:'ms-MY',label:'Bahasa Melayu (Malaysia)',labelLocale:'ms'},'ms'),
     en:label({bcp47:'ms-MY',label:'Bahasa Melayu (Malaysia)',labelLocale:'ms'},'en')};
   });
   assert.equal(labels.ms,'Bahasa Melayu (Malaysia)');assert.match(labels.en,/Malay/);
   await page.screenshot({path:path.join(artifacts,'malay-panel-320.png'),fullPage:true});
  });
  await check('Bengali restores from storage, leaves RTL and localizes exact provider names and CC',async()=>{
   await page.selectOption('#ui-lang-select','he');await page.waitForFunction(()=>document.documentElement.dir==='rtl');
   await page.selectOption('#ui-lang-select','bn');await page.waitForFunction(()=>savedSettings.ottsub_ui_lang==='bn');
   setSaved(await page.evaluate(()=>({...savedSettings})));await page.reload();
   await page.waitForFunction(()=>document.documentElement.lang==='bn'&&document.getElementById('status-badge').classList.contains('active'));
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'bn');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
   assert.equal(await page.locator('#ui-lang-select').getAttribute('aria-label'),'ইন্টারফেসের ভাষা');
   assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'প্রধান ভাষা');
   assert.match(await page.locator('#sub-status').textContent(),/অংশ/);
   assert.equal(await page.locator('#primary-track-kind option[value="cc"]').getAttribute('title'),'CC (শব্দের বিবরণ)');
   assert.equal(await page.locator('#secondary-lang-select').inputValue(),'es-es');
   assert.equal(await page.locator('#btn-ctee').getAttribute('href'),'https://buymeacoffee.com/k2bact');
   const labels=await page.evaluate(async()=>{
    const {getLocalizedLanguageLabel:label}=await import('/popup/modules/ui-dual.js');
    const track={bcp47:'bn-BD',label:'বাংলা (বাংলাদেশ)',labelLocale:'bn'};
    return{bn:label(track,'bn'),cc:label({...track,isCC:true},'bn'),en:label({...track,labelLocale:'en'},'en')};
   });
   assert.equal(labels.bn,'বাংলা (বাংলাদেশ)');assert.equal(labels.cc,'বাংলা (বাংলাদেশ) [CC]');
   assert.match(labels.en,/Bangla|Bengali/);assert.doesNotMatch(labels.en,/[\u0980-\u09ff]/);
   await page.screenshot({path:path.join(artifacts,'bengali-panel-320.png'),fullPage:true});
  });
  await check('bn-BD browser preference selects Bengali and an explicit saved choice wins',async()=>{
   const fresh=await browser.newPage({viewport:{width:320,height:900}});fresh.setDefaultTimeout(5000);
   try{
    await fresh.route('**/*',routeHandler);
    await fresh.addInitScript(()=>Object.defineProperty(navigator,'languages',{value:['bn-BD','en']}));
    setSaved({ottsub_ui_lang:undefined,ottsub_revision_ottsub_ui_lang:undefined});await fresh.goto('http://ottsub.test/popup/popup.html');
    await fresh.waitForFunction(()=>document.documentElement.lang==='bn'&&document.getElementById('status-badge').classList.contains('active'));
    assert.equal(await fresh.locator('#ui-lang-select').inputValue(),'bn');
    await fresh.selectOption('#ui-lang-select','en');await fresh.waitForFunction(()=>savedSettings.ottsub_ui_lang==='en');
    setSaved(await fresh.evaluate(()=>({...savedSettings})));await fresh.reload();
    await fresh.waitForFunction(()=>document.documentElement.lang==='en');
    assert.equal(await fresh.locator('#ui-lang-select').inputValue(),'en');
   }finally{await fresh.close();}
  });
  await check('Turkish restores LTR and its saved choice, provider names and exact regional labels',async()=>{
   await page.selectOption('#ui-lang-select','ar');await page.waitForFunction(()=>document.documentElement.dir==='rtl');
   await page.selectOption('#ui-lang-select','tr');await page.waitForFunction(()=>savedSettings.ottsub_ui_lang==='tr');
   setSaved(await page.evaluate(()=>({...savedSettings})));await page.reload();
   await page.waitForFunction(()=>document.documentElement.lang==='tr'&&document.getElementById('status-badge').classList.contains('active'));
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'tr');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
   assert.equal(await page.locator('#ui-lang-select').getAttribute('aria-label'),'Arayüz dili');
   assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'Ana alt yazı dili');
   assert.equal(await page.locator('[data-i18n="secondary_lang_label"]').textContent(),'İkinci alt yazı dili');
   assert.equal(await page.locator('#sub-status').textContent(),'Hazır (120 öğe)');
   assert.equal(await page.locator('#secondary-sub-status').textContent(),'Hazır (110 öğe)');
   assert.equal(await page.locator('#btn-ctee').getAttribute('href'),'https://buymeacoffee.com/k2bact');
   const labels=await page.evaluate(async()=>{
    const {getLocalizedLanguageLabel:label}=await import('/popup/modules/ui-dual.js');
    const track={bcp47:'tr-TR',label:'Türkçe (Türkiye)',labelLocale:'tr'};
    return{tr:label(track,'tr'),cc:label({...track,isCC:true},'tr'),en:label(track,'en')};
   });
   assert.equal(labels.tr,'Türkçe (Türkiye)');assert.equal(labels.cc,'Türkçe (Türkiye) [CC]');
   assert.match(labels.en,/Turkish/);assert.doesNotMatch(labels.en,/Türkçe/);
   const toggle=page.locator('#learning-toggle-btn');
   if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
   await page.waitForFunction(()=>document.getElementById('learning-toggle-btn').getAttribute('aria-expanded')==='true');
   assert(await page.locator('#learning-body').isVisible());
   await page.screenshot({path:path.join(artifacts,'turkish-panel-320.png'),fullPage:true});
  });
  await check('tr-TR browser preference selects Turkish while an explicit saved choice wins',async()=>{
   const fresh=await browser.newPage({viewport:{width:320,height:900}});fresh.setDefaultTimeout(5000);
   try{
    await fresh.route('**/*',routeHandler);
    await fresh.addInitScript(()=>Object.defineProperty(navigator,'languages',{value:['tr-TR','en']}));
    setSaved({ottsub_ui_lang:undefined,ottsub_revision_ottsub_ui_lang:undefined});await fresh.goto('http://ottsub.test/popup/popup.html');
    await fresh.waitForFunction(()=>document.documentElement.lang==='tr'&&document.getElementById('status-badge').classList.contains('active'));
    assert.equal(await fresh.locator('#ui-lang-select').inputValue(),'tr');
    await fresh.selectOption('#ui-lang-select','en');await fresh.waitForFunction(()=>savedSettings.ottsub_ui_lang==='en');
    setSaved(await fresh.evaluate(()=>({...savedSettings})));await fresh.reload();
    await fresh.waitForFunction(()=>document.documentElement.lang==='en');
    assert.equal(await fresh.locator('#ui-lang-select').inputValue(),'en');
   }finally{await fresh.close();}
  });
  await check('Traditional Chinese restores canonical UI locale and preserves provider script and CC labels',async()=>{
   await page.selectOption('#ui-lang-select','he');await page.waitForFunction(()=>document.documentElement.dir==='rtl');
   await page.selectOption('#ui-lang-select','zh-TW');await page.waitForFunction(()=>document.documentElement.lang==='zh-TW');
   setSaved(await page.evaluate(()=>({...savedSettings})));await page.reload();
   await page.waitForFunction(()=>document.documentElement.lang==='zh-TW'&&document.getElementById('status-badge').classList.contains('active'));
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'zh-TW');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
   assert.equal(await page.locator('#ui-lang-select').getAttribute('aria-label'),'介面語言');
   assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'主要字幕語言');
   assert.equal(await page.locator('#sub-status').textContent(),'就緒（120 個片段）');
   assert.equal(await page.locator('#secondary-sub-status').textContent(),'就緒（110 個片段）');
   const labels=await page.evaluate(async()=>{
    const {getLocalizedLanguageLabel:label}=await import('/popup/modules/ui-dual.js');
    const track={bcp47:'zh-Hant',label:'繁體中文（台灣）',labelLocale:'zh-TW'};
    return{tw:label(track,'zh-TW'),cc:label({...track,isCC:true},'zh-TW'),en:label(track,'en'),wrongScript:label({...track,label:'简体中文（错误来源）',labelLocale:'zh-Hans'},'zh-TW')};
   });
   assert.equal(labels.tw,'繁體中文（台灣）');assert.equal(labels.cc,'繁體中文（台灣） [CC]');
   assert.match(labels.en,/Chinese/);assert.doesNotMatch(labels.en,/[\u3400-\u9fff]/);
   assert.doesNotMatch(labels.wrongScript,/简体|错误来源/);
   const toggle=page.locator('#learning-toggle-btn');if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
   assert(await page.locator('#learning-body').isVisible());
   await page.screenshot({path:path.join(artifacts,'taiwan-panel-320.png'),fullPage:true});
  });
  await check('Portugal menu restores after RTL and binds translated text, titles and accessible labels',async()=>{
   await page.selectOption('#ui-lang-select','he');await page.waitForFunction(()=>document.documentElement.dir==='rtl');
   await page.selectOption('#ui-lang-select','pt-PT');await page.waitForFunction(()=>savedSettings.ottsub_ui_lang==='pt-pt');
   setSaved(await page.evaluate(()=>({...savedSettings})));await page.reload();
   await page.waitForFunction(()=>document.documentElement.lang==='pt-PT'&&document.getElementById('status-badge').classList.contains('active'));
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'pt-PT');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
   assert.equal(await page.locator('#ui-lang-select').getAttribute('aria-label'),'Idioma da interface');
   assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'Idioma das legendas principais');
   assert.equal(await page.locator('#btn-ctee').getAttribute('href'),'https://buymeacoffee.com/k2bact');
   const bindings=await page.evaluate(()=>{
    const mismatches=[];let count=0;
    for(const [data,attribute] of [['data-i18n',null],['data-i18n-title','title'],['data-i18n-aria-label','aria-label']])for(const el of document.querySelectorAll(`[${data}]`)){
     const key=el.getAttribute(data);
     const dynamic={sub_status_checking:['sub_status_ready',{count:120}],secondary_status_waiting:['secondary_status_ready',{count:110}],status_waiting:['status_connected',{}]};
     const [message,params]=!attribute&&dynamic[key]?dynamic[key]:[key,{}];
     count++;const actual=attribute?el.getAttribute(attribute):el.textContent;const expected=OTTSubI18n.t(message,params);if(actual!==expected)mismatches.push({key,actual,expected});
    }
    return{count,mismatches};
   });
   assert(bindings.count>100);assert.deepEqual(bindings.mismatches,[]);
   const toggle=page.locator('#learning-toggle-btn');if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
   assert(await page.locator('#learning-body').isVisible());
   await page.screenshot({path:path.join(artifacts,'portuguese-panel-320.png'),fullPage:true});
  });
  await check('Portugal provider locale and CC labels preserve Portugal and Brazil track identities',async()=>{
   const result=await page.evaluate(async()=>{
    const {getLocalizedLanguageLabel:label}=await import('/popup/modules/ui-dual.js');
    const pt={bcp47:'pt-PT',label:'Português (Portugal)',labelLocale:'pt_PT',urls:['portugal']};
    const br={bcp47:'pt-BR',label:'Português (Brasil)',labelLocale:'pt-PT',urls:['brazil']};const before=JSON.stringify([pt,br]);
    return{pt:label(pt,'pt-PT'),br:label(br,'pt-PT'),cc:label({...pt,isCC:true},'pt-PT'),
     wrongLocale:label({...pt,label:'RÓTULO DO BRASIL',labelLocale:'pt-BR'},'pt-PT'),en:label(pt,'en'),unchanged:before===JSON.stringify([pt,br])};
   });
   assert.equal(result.pt,'Português (Portugal)');assert.equal(result.br,'Português (Brasil)');assert.equal(result.cc,'Português (Portugal) [CC]');
   assert.notEqual(result.wrongLocale,'RÓTULO DO BRASIL');assert.match(result.en,/Portuguese/);assert(result.unchanged);
  });
  await check('Thai menu restores after RTL and binds translated copy, titles and accessible labels',async()=>{
   await page.selectOption('#ui-lang-select','he');await page.waitForFunction(()=>document.documentElement.dir==='rtl');
   await page.selectOption('#ui-lang-select','th');await page.waitForFunction(()=>savedSettings.ottsub_ui_lang==='th');
   setSaved(await page.evaluate(()=>({...savedSettings})));await page.reload();
   await page.waitForFunction(()=>document.documentElement.lang==='th'&&document.getElementById('status-badge').classList.contains('active'));
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'th');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
   assert.equal(await page.locator('#ui-lang-select').getAttribute('aria-label'),'ภาษาเมนู');
   assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'ภาษาหลัก');
   assert.equal(await page.locator('#primary-track-kind option[value="cc"]').getAttribute('title'),'CC (คำอธิบายเสียง)');
   assert.equal(await page.locator('#btn-ctee').getAttribute('href'),'https://buymeacoffee.com/k2bact');
   assert.equal(await page.locator('#secondary-lang-select').inputValue(),'es-es');
   const bindings=await page.evaluate(()=>{
    const mismatches=[];let count=0;
    for(const [data,attribute] of [['data-i18n',null],['data-i18n-title','title'],['data-i18n-aria-label','aria-label']])for(const el of document.querySelectorAll(`[${data}]`)){
     const key=el.getAttribute(data),dynamic={sub_status_checking:['sub_status_ready',{count:120}],secondary_status_waiting:['secondary_status_ready',{count:110}],status_waiting:['status_connected',{}]};
     const [message,params]=!attribute&&dynamic[key]?dynamic[key]:[key,{}];count++;
     const actual=attribute?el.getAttribute(attribute):el.textContent,expected=OTTSubI18n.t(message,params);if(actual!==expected)mismatches.push({key,actual,expected});
    }
    return{count,mismatches,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert(bindings.count>100);assert.deepEqual(bindings.mismatches,[]);assert.equal(bindings.overflow,false);
   const toggle=page.locator('#learning-toggle-btn');if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
   assert(await page.locator('#learning-body').isVisible());
   await page.screenshot({path:path.join(artifacts,'thai-panel-320.png'),fullPage:true});
  });
  await check('Russian menu restores after RTL and binds translated copy, titles and accessible labels',async()=>{
   await page.selectOption('#ui-lang-select','he');await page.waitForFunction(()=>document.documentElement.dir==='rtl');
   await page.selectOption('#ui-lang-select','ru');await page.waitForFunction(()=>savedSettings.ottsub_ui_lang==='ru');
   setSaved(await page.evaluate(()=>({...savedSettings})));await page.reload();
   await page.waitForFunction(()=>document.documentElement.lang==='ru'&&document.getElementById('status-badge').classList.contains('active'));
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'ru');assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
   assert.equal(await page.locator('#ui-lang-select').getAttribute('aria-label'),'Язык интерфейса');
   assert.equal(await page.locator('[data-i18n="primary_lang_label"]').textContent(),'Основной язык');
   assert.equal(await page.locator('#primary-track-kind option[value="cc"]').getAttribute('title'),'CC (описания звуков)');
   assert.equal(await page.locator('#btn-ctee').getAttribute('href'),'https://buymeacoffee.com/k2bact');
   assert.equal(await page.locator('#secondary-lang-select').inputValue(),'es-es');
   const bindings=await page.evaluate(()=>{
    const mismatches=[];let count=0;
    for(const [data,attribute] of [['data-i18n',null],['data-i18n-title','title'],['data-i18n-aria-label','aria-label']])for(const el of document.querySelectorAll(`[${data}]`)){
     const key=el.getAttribute(data),dynamic={sub_status_checking:['sub_status_ready',{count:120}],secondary_status_waiting:['secondary_status_ready',{count:110}],status_waiting:['status_connected',{}]};
     const [message,params]=!attribute&&dynamic[key]?dynamic[key]:[key,{}];count++;
     const actual=attribute?el.getAttribute(attribute):el.textContent,expected=OTTSubI18n.t(message,params);if(actual!==expected)mismatches.push({key,actual,expected});
    }
    return{count,mismatches,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert(bindings.count>100);assert.deepEqual(bindings.mismatches,[]);assert.equal(bindings.overflow,false);
   const toggle=page.locator('#learning-toggle-btn');if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
   assert(await page.locator('#learning-body').isVisible());
   await page.screenshot({path:path.join(artifacts,'russian-panel-320.png'),fullPage:true});
  });
  await check('Russian provider names require Russian locale, reject other scripts and retain exact track/CC identity',async()=>{
   const result=await page.evaluate(async()=>{
    const {getLocalizedLanguageLabel:label}=await import('/popup/modules/ui-dual.js');
    const track={bcp47:'ru-RU',label:'Русский (Россия)',labelLocale:'ru_RU',urls:['russian'],id:'russian-normal'};
    const before=JSON.stringify(track);
    return{ru:label(track,'ru'),cc:label({...track,isCC:true},'ru'),en:label(track,'en'),
     uk:label({...track,label:'Українська МІТКА',labelLocale:'uk-UA'},'ru'),
     unknown:label({...track,label:'ЧУЖАЯ МЕТКА',labelLocale:undefined},'ru'),
     mixed:label({...track,label:'Русский 가'},'ru'),
     falseEnglish:label({...track,labelLocale:'en'},'en'),
     falsePortugal:label({...track,labelLocale:'pt-PT'},'pt-PT'),unchanged:before===JSON.stringify(track)};
   });
   assert.equal(result.ru,'Русский (Россия)');assert.equal(result.cc,'Русский (Россия) [CC]');assert.match(result.en,/Russian/);
   assert.notEqual(result.uk,'Українська МІТКА');assert.notEqual(result.unknown,'ЧУЖАЯ МЕТКА');assert.doesNotMatch(result.mixed,/가/);
   assert.doesNotMatch(result.falseEnglish,/\p{Script=Cyrillic}/u);assert.doesNotMatch(result.falsePortugal,/\p{Script=Cyrillic}/u);assert(result.unchanged);
  });
  await check('Thai provider labels require Thai locale and preserve track identity across scripts and CC',async()=>{
   const result=await page.evaluate(async()=>{
    const {getLocalizedLanguageLabel:label}=await import('/popup/modules/ui-dual.js');
    const track={bcp47:'th-TH',label:'ไทย (ประเทศไทย)',labelLocale:'th_TH',urls:['thai'],id:'thai-normal'};
    const before=JSON.stringify(track);
    return{thai:label(track,'th'),cc:label({...track,isCC:true},'th'),
     missing:label({...track,label:'ป้ายทดสอบ',labelLocale:undefined},'th'),
     lao:label({...track,label:'ป้ายทดสอบ',labelLocale:'lo-LA'},'th'),
     mixed:label({...track,label:'ไทย 가 Я'},'th'),
     foreign:['en','pt-PT','ru'].map(ui=>label({...track,labelLocale:ui},ui)),unchanged:before===JSON.stringify(track)};
   });
   assert.equal(result.thai,'ไทย (ประเทศไทย)');assert.equal(result.cc,'ไทย (ประเทศไทย) [CC]');
   assert.notEqual(result.missing,'ป้ายทดสอบ');assert.notEqual(result.lao,'ป้ายทดสอบ');
   assert.doesNotMatch(result.mixed,/가|Я/);for(const name of result.foreign)assert.doesNotMatch(name,/\p{Script=Thai}/u);
   assert(result.unchanged);
  });
  await check('all supported system UI languages initialize, sort and retain manual choice after reload',async()=>{
   const alphabetical=supportedUILocales();
   for(const system of alphabetical){
    const fresh=await browser.newPage({viewport:{width:320,height:900}});fresh.setDefaultTimeout(5000);
    try{
     const apiLocale=system==='ru'?'ru_RU':system;
     await fresh.route('**/*',route=>new URL(route.request().url()).pathname==='/fixture.js'?route.fulfill({contentType:'application/javascript',body:fixture()+`;chrome.i18n.getUILanguage=()=> ${JSON.stringify(apiLocale)};`}):routeHandler(route));
     await fresh.addInitScript(()=>Object.defineProperty(navigator,'languages',{value:['en-US']}));
     setSaved({ottsub_ui_lang:undefined,ottsub_revision_ottsub_ui_lang:undefined});await fresh.goto('http://ottsub.test/popup/popup.html');
     await fresh.waitForFunction(lang=>document.documentElement.lang===lang&&document.getElementById('status-badge').classList.contains('active'),system);
     const expected=[system,...alphabetical.filter(locale=>locale!==system)];
     assert.deepEqual(await fresh.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),expected,system);
     const manual=system==='ru'?'en':'ru';await fresh.selectOption('#ui-lang-select',manual);await fresh.waitForFunction(lang=>savedSettings.ottsub_ui_lang===lang,manual);
     setSaved(await fresh.evaluate(()=>({...savedSettings})));await fresh.reload();
     await fresh.waitForFunction(lang=>document.documentElement.lang===lang,manual);
     assert.equal(await fresh.locator('#ui-lang-select').inputValue(),manual);
     assert.deepEqual(await fresh.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),expected,`${system}: reload`);
    }finally{await fresh.close();}
   }
  });
  await check('Portugal browser UI is first while an explicit saved English choice survives reload',async()=>{
   const fresh=await browser.newPage({viewport:{width:320,height:900}});fresh.setDefaultTimeout(5000);
   try{
    await fresh.route('**/*',route=>new URL(route.request().url()).pathname==='/fixture.js'?route.fulfill({contentType:'application/javascript',body:fixture()+";chrome.i18n.getUILanguage=()=> 'pt_PT';"}):routeHandler(route));
    await fresh.addInitScript(()=>Object.defineProperty(navigator,'languages',{value:['en-US']}));
    setSaved({ottsub_ui_lang:undefined,ottsub_revision_ottsub_ui_lang:undefined});await fresh.goto('http://ottsub.test/popup/popup.html');
    await fresh.waitForFunction(()=>document.documentElement.lang==='pt-PT'&&document.getElementById('status-badge').classList.contains('active'));
    const order=['pt-PT','ar','bn','zh-TW','en','fi','fr','de','he','hi','ja','ko','ms','ru','es','th','tr'];
    assert.deepEqual(await fresh.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),order);
    await fresh.selectOption('#ui-lang-select','en');await fresh.waitForFunction(()=>savedSettings.ottsub_ui_lang==='en');
    setSaved(await fresh.evaluate(()=>({...savedSettings})));await fresh.reload();await fresh.waitForFunction(()=>document.documentElement.lang==='en');
    assert.deepEqual(await fresh.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),order);
   }finally{await fresh.close();}
  });
  await check('System UI locale stays first, remaining English names sort alphabetically, saved choice wins',async()=>{
   const fresh=await browser.newPage({viewport:{width:320,height:900}});fresh.setDefaultTimeout(5000);
   const order=['ko','ar','bn','zh-TW','en','fi','fr','de','he','hi','ja','ms','pt-PT','ru','es','th','tr'];
   try{
    await fresh.route('**/*',route=>new URL(route.request().url()).pathname==='/fixture.js'?route.fulfill({contentType:'application/javascript',body:fixture()+";chrome.i18n.getUILanguage=()=> 'ko-KR';"}):routeHandler(route));
    await fresh.addInitScript(()=>Object.defineProperty(navigator,'languages',{value:['en-US','ja-JP']}));
    setSaved({ottsub_ui_lang:undefined,ottsub_revision_ottsub_ui_lang:undefined});await fresh.goto('http://ottsub.test/popup/popup.html');
    await fresh.waitForFunction(()=>document.documentElement.lang==='ko'&&document.getElementById('status-badge').classList.contains('active'));
    assert.deepEqual(await fresh.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),order);
    await fresh.selectOption('#ui-lang-select','zh-TW');await fresh.waitForFunction(()=>document.documentElement.lang==='zh-TW');
    assert.deepEqual(await fresh.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),order);
    setSaved(await fresh.evaluate(()=>({...savedSettings})));await fresh.reload();
    await fresh.waitForFunction(()=>document.documentElement.lang==='zh-TW');
    assert.equal(await fresh.locator('#ui-lang-select').inputValue(),'zh-TW');
    assert.deepEqual(await fresh.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),order);
   }finally{await fresh.close();}
  });
  await check('Taiwan system language is selected automatically without a generic or Simplified Chinese fallback',async()=>{
   const fresh=await browser.newPage({viewport:{width:320,height:900}});fresh.setDefaultTimeout(5000);
   try{
    await fresh.route('**/*',route=>new URL(route.request().url()).pathname==='/fixture.js'?route.fulfill({contentType:'application/javascript',body:fixture()+";chrome.i18n.getUILanguage=()=> 'zh_TW';"}):routeHandler(route));
    await fresh.addInitScript(()=>Object.defineProperty(navigator,'languages',{value:['en-US']}));
    setSaved({ottsub_ui_lang:undefined,ottsub_revision_ottsub_ui_lang:undefined});await fresh.goto('http://ottsub.test/popup/popup.html');
    await fresh.waitForFunction(()=>document.documentElement.lang==='zh-TW'&&document.getElementById('status-badge').classList.contains('active'));
    assert.equal(await fresh.locator('#ui-lang-select').inputValue(),'zh-TW');
    assert.deepEqual(await fresh.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),['zh-TW','ar','bn','en','fi','fr','de','he','hi','ja','ko','ms','pt-PT','ru','es','th','tr']);
   }finally{await fresh.close();}
  });
  await check('Unsupported system locale uses the first supported browser preference without duplicating options',async()=>{
   const fresh=await browser.newPage({viewport:{width:320,height:900}});fresh.setDefaultTimeout(5000);
   try{
    await fresh.route('**/*',route=>new URL(route.request().url()).pathname==='/fixture.js'?route.fulfill({contentType:'application/javascript',body:fixture()+";chrome.i18n.getUILanguage=()=> 'it-IT';"}):routeHandler(route));
    await fresh.addInitScript(()=>Object.defineProperty(navigator,'languages',{value:['zh-CN','zh-Hans','tr-TR','en']}));
    setSaved({ottsub_ui_lang:undefined,ottsub_revision_ottsub_ui_lang:undefined});await fresh.goto('http://ottsub.test/popup/popup.html');
    await fresh.waitForFunction(()=>document.documentElement.lang==='tr'&&document.getElementById('status-badge').classList.contains('active'));
    assert.deepEqual(await fresh.locator('#ui-lang-select option').evaluateAll(els=>els.map(e=>e.value)),['tr','ar','bn','zh-TW','en','fi','fr','de','he','hi','ja','ko','ms','pt-PT','ru','es','th']);
   }finally{await fresh.close();}
  });
  await check('ms-MY browser preference selects Malay while an explicit saved language still wins',async()=>{
   await page.addInitScript(()=>Object.defineProperty(navigator,'languages',{value:['ms-MY','en']}));
   setSaved({ottsub_ui_lang:undefined,ottsub_revision_ottsub_ui_lang:undefined,ottsub_primary_lang:'en',ottsub_secondary_lang:'es-es',ottsub_sub_settings_collapsed:false});
   await page.reload();await page.waitForFunction(()=>document.documentElement.lang==='ms');
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'ms');
   await page.selectOption('#ui-lang-select','en');await page.waitForFunction(()=>savedSettings.ottsub_ui_lang==='en');
   setSaved(await page.evaluate(()=>({...savedSettings})));await page.reload();
   await page.waitForFunction(()=>document.documentElement.lang==='en');
   assert.equal(await page.locator('#ui-lang-select').inputValue(),'en');
  });
  await check('Hebrew HUD and recovery notice use RTL on creation and update; English restores LTR',async()=>{
   await page.addScriptTag({url:'http://ottsub.test/src/hud.js'});
   const result=await page.evaluate(()=>{
    const hud=OTTSubHUD;hud.show('סנכרון ראשי: 0.1s',1500,'he');
    hud.setRecoveryNotice('בודק תזמון','הצגה זמנית',()=>{},'he');
    const created=[hud.hudElem.dir,hud.recoveryElem.dir];
    hud.setRecoveryNotice('בדיקת התזמון מתעכבת','הצגה זמנית',()=>{},'en');const english=hud.recoveryElem.dir;
    hud.setRecoveryNotice('בודק תזמון','הצגה זמנית',()=>{},'he-IL');const updated=hud.recoveryElem.dir;
    hud.show('Sync: 0.1s',1500,'en');const englishHud=hud.hudElem.dir;hud.destroy();
    return {created,english,updated,englishHud};
   });
   assert.deepEqual(result,{created:['rtl','rtl'],english:'ltr',updated:'rtl',englishHud:'ltr'});
  });
  await check('RTL HUD signs stay before numeric tokens with safe text, repeated messages and language changes',async()=>{
   for(const lang of ['he','ar','en'])for(const value of ['-0.5s','+0.5s','0.0s']){
    const result=await page.evaluate(async({lang,value})=>{
     const message=`${OTTSubI18n.t('hud_sync_prefix_primary',{},lang)}: ${value}`;
     const hud=OTTSubHUD;hud.show(message,30000,lang);hud.show(message,30000,lang);
     await new Promise(resolve=>requestAnimationFrame(resolve));
     const node=hud.hudElem,walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),chars=[];
     while(walker.nextNode()){const text=walker.currentNode;for(let i=0;i<text.length;i++){const range=document.createRange();range.setStart(text,i);range.setEnd(text,i+1);chars.push({char:text.data[i],x:range.getBoundingClientRect().x});}}
     const token=chars.slice(message.indexOf(value),message.indexOf(value)+value.length);
     const data={text:node.textContent,message,ordered:token.every((c,i)=>i===0||c.x>token[i-1].x),isolates:[...node.querySelectorAll('bdi')].map(el=>({text:el.textContent,dir:el.dir}))};
     hud.destroy();return data;
    },{lang,value});
    assert.equal(result.text,result.message);assert.equal(result.ordered,true,`${lang}: ${value} glyph order`);
    assert.deepEqual(result.isolates,lang==='en'?[]:[{text:value,dir:'ltr'}]);
   }
   const safe=await page.evaluate(async()=>{
    OTTSubHUD.show('<img src=x onerror="window.attacked=true"> -0.5s',30000,'he');
    const text=OTTSubHUD.hudElem.textContent,active=!!OTTSubHUD.hudElem.querySelector('img,[onerror]');
    OTTSubHUD.show('old: -0.5s',30000,'he');OTTSubHUD.show('old: -0.5s',30000,'he');OTTSubHUD.show('Latest: +0.5s',30000,'en');
    await new Promise(resolve=>requestAnimationFrame(resolve));
    const latest=OTTSubHUD.hudElem.textContent,dir=OTTSubHUD.hudElem.dir;OTTSubHUD.destroy();return{text,active,latest,dir};
   });
   assert.equal(safe.text,'<img src=x onerror="window.attacked=true"> -0.5s');assert.equal(safe.active,false);
   assert.equal(safe.latest,'Latest: +0.5s');assert.equal(safe.dir,'ltr');
  });
  await check('active sync target saves through production schema and restores the secondary slider after reopening',async()=>{
   const schema=await page.evaluate(()=>({valid:OTTSubStorageGuard.validateStorageSchema({ottsub_active_sync_target:'secondary'}),invalid:OTTSubStorageGuard.validateStorageSchema({ottsub_active_sync_target:'both'})}));
   assert.deepEqual(schema.valid,{ottsub_active_sync_target:'secondary'});assert.deepEqual(schema.invalid,{});
   await page.locator('#sync-card-secondary').click();
   await page.locator('#sync-slider').evaluate(el=>{el.value='-200';el.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.waitForFunction(()=>savedSettings.ottsub_active_sync_target==='secondary'&&savedSettings.ottsub_secondary_offset===-200);
   setSaved(await page.evaluate(()=>({...savedSettings})));await page.reload();
   await page.waitForFunction(()=>document.getElementById('sync-card-secondary').getAttribute('aria-selected')==='true');
   assert.equal(await page.locator('#sync-slider').inputValue(),'-200');
   await page.evaluate(()=>{
    const values={ottsub_ui_lang:'he',ottsub_active_sync_target:'primary',ottsub_offset:300},payload={...values};
    for(const [key,value]of Object.entries(values))payload['ottsub_revision_'+key]={n:(savedSettings['ottsub_revision_'+key]?.n||0)+1,origin:'remote-fixture',value};
    return chrome.storage.local.set(payload);
   });
   await page.waitForFunction(()=>document.documentElement.lang==='he'&&document.getElementById('sync-card-primary').getAttribute('aria-selected')==='true');
   assert.equal(await page.locator('#sync-slider').inputValue(),'300');
  });
 }finally{await browser.close();console.log(JSON.stringify({passed:!errors.length,total:cases.length,cases,errors},null,2));if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
