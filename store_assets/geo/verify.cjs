const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.OTTSUB_GEO_QA_DIR||path.join(root,'artifacts/qa/geo-20261020'));
fs.mkdirSync(out,{recursive:true});
const content=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf8'));
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const report={checkedAt:new Date().toISOString(),passed:false,cases:[],errors:[],scope:'Local content, metadata, rendered layout, source-backed timing example and file boundaries. No AI/API calls or search ranking/citation success assertions.'};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const initialZips=Object.fromEntries(fs.readdirSync(path.join(root,'dist')).filter(f=>f.endsWith('.zip')).map(f=>[f,sha(fs.readFileSync(path.join(root,'dist',f)))]));
async function check(name,fn){try{await fn();report.cases.push({name,passed:true});}catch(e){report.cases.push({name,passed:false});report.errors.push(e.stack);}}
function build(args,ok=true){const r=spawnSync(process.execPath,[path.join(__dirname,'build.cjs'),...args],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,ok?0:1,r.stderr);return r;}
(async()=>{
  const publicFixture=path.join(out,'public-fixture');
  await check('Local preview build is not indexable and has no guessed canonical',()=>{
    build([]);const s=fs.readFileSync(path.join(__dirname,'site/index.html'),'utf8');
    assert(s.includes('noindex,nofollow'));assert(!s.includes('rel="canonical"'));assert(!s.includes('hreflang="x-default"'));
    assert(!fs.existsSync(path.join(__dirname,'site/sitemap.xml')));
  });
  await check('GitHub Pages subpath: canonical, reciprocal languages and sitemap use configured base',()=>{
    // A reserved test fixture on a real primary-source origin; never deployed.
    const base='https://chromewebstore.google.com/geo-local-fixture/';
    build(['--base-url',base,'--out',publicFixture]);
    for(const [lang,p]of Object.entries(content.pages)){
      const s=fs.readFileSync(path.join(publicFixture,p.path),'utf8'),url=new URL(p.path.replace(/index\.html$/,''),base).href;
      assert(s.includes(`rel="canonical" href="${url}"`));assert(s.includes('content="index,follow"'));
      for(const [locale,page]of Object.entries(content.pages))assert(s.includes(`hreflang="${locale}" href="${new URL(page.path.replace(/index\.html$/,''),base).href}"`));
      assert(s.includes(`property="og:url" content="${url}"`));assert(!s.includes(content.pages[lang].preview));
      const schema=JSON.parse(s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema.url,url);
    }
    const sm=fs.readFileSync(path.join(publicFixture,'sitemap.xml'),'utf8');assert(sm.includes(base+'ko/'));assert(!sm.includes('index.html'));
    assert(!fs.existsSync(path.join(publicFixture,'robots.txt')),'Subpath file cannot change origin-root crawler policy');
    report.publicBuildFixture={base,neverDeployed:true};
  });
  await check('Resetting a public build to preview removes stale sitemap and canonical',()=>{
    const dir=path.join(out,'reset-fixture');build(['--base-url','https://chromewebstore.google.com/geo-reset-fixture/','--out',dir]);
    build(['--out',dir]);assert(!fs.existsSync(path.join(dir,'sitemap.xml')));assert(fs.readFileSync(path.join(dir,'index.html'),'utf8').includes('noindex,nofollow'));
  });
  await check('Reject insecure/credential/query/placeholder URLs and external output folders',()=>{
    for(const url of ['http://test.site/','https://u:p@host.site/','https://host.site/?secret=1','https://example.com/','https://localhost/'])build(['--base-url',url,'--out',path.join(out,'rejected-fixture')],false);
    build(['--out',path.dirname(root)],false);
  });
  await check('Timing example agrees with the real synchronization engine',()=>{
    const window={};vm.runInNewContext(fs.readFileSync(path.join(root,'src/sync-engine.js'),'utf8'),{window,console});
    const e=window.OTTSubSyncEngine;e.setCues('geo-example',[{id:'one',begin:10,end:11,text:'example'}]);
    e.setOffset(0);assert.equal(e.getActiveCues(9.8).bottom.length,0);
    e.setOffset(300);assert.equal(e.getActiveCues(9.8).bottom.length,1,'Positive clock offset displays a cue earlier');
    e.setOffset(-300);assert.equal(e.getActiveCues(10.1).bottom.length,0,'Negative clock offset delays a cue');
    assert.equal(e.getActiveCues(10.4).bottom.length,1);
  });
  await check('Latest full QA inputs and existing release ZIPs are unchanged',()=>{
    const latest=JSON.parse(fs.readFileSync(path.join(root,'artifacts/qa/latest.json')));
    const old=JSON.parse(fs.readFileSync(path.join(root,'artifacts/qa',latest.summary)));
    assert(old.passed&&old.mode==='full'&&!old.sourceChangedDuringRun.length);
    for(const [f,h]of Object.entries(old.sourceHashes))assert.equal(sha(fs.readFileSync(path.join(root,f))),h,f);
    assert.deepEqual(fs.readdirSync(path.join(root,'dist')).filter(f=>f.endsWith('.zip')).sort(),Object.keys(initialZips).sort());
    for(const [f,h]of Object.entries(initialZips))assert.equal(sha(fs.readFileSync(path.join(root,'dist',f))),h,f);
    report.preservedInputs=Object.keys(old.sourceHashes).length;report.preservedZips=Object.keys(initialZips).length;
  });
  await check('Pre-change text backups preserve size and SHA-256',()=>{
    const saved=JSON.parse(fs.readFileSync(path.join(root,'archive/docs/geo-20261020/before-hashes.json')));
    for(const [f,h]of Object.entries(saved)){const b=fs.readFileSync(path.join(root,'archive/docs/geo-20261020/before',f));assert.equal(b.length,h.bytes);assert.equal(sha(b),h.sha256);}
    report.textBackups=Object.keys(saved).length;
  });
  for(const locale of ['ar','bn','de','en-us','es','he','hi','ja','ko-kr','ms','pt-pt','ru','tr','zh-tw'])await check(`Listing ${locale}: definition, instructions, five FAQ answers and original feature body`,()=>{
    const f=`store_assets/${locale}/listing.txt`,b=fs.readFileSync(path.join(root,f));const s=new TextDecoder('utf-8',{fatal:true}).decode(b).replace(/\r\n/g,'\n');
    assert(s.startsWith(locale==='pt-pt'?'O OTTSub':'OTTSub'),locale);assert(s.length<16000);assert(!/[✨⭐🌟★☆`\uFFFD]/u.test(s));
    const before=fs.readFileSync(path.join(root,'archive/docs/geo-20261020/before',f),'utf8').replace(/\r\n/g,'\n');
    const publicUrl=content.product.publicBaseUrl+(locale==='ko-kr'?'ko/':'');
    assert(s.trimEnd().endsWith(publicUrl),'Link to the verified product website');
    const paragraphs=s.split('\n\n');assert(paragraphs[1].includes('OTTSub')&&paragraphs[1].includes('Netflix'));
    const lines=s.split('\n'),i=lines.findIndex(l=>l.includes('FAQ'));
    assert(lines.slice(i+1).join('\n').split('\n\n').slice(0,5).every(b=>b.split('\n').length===2));
    const oldCore=before.slice(before.indexOf('\n\n')+2,before.indexOf('FAQ')).trim();
    for(const paragraph of oldCore.split('\n\n')){
      const lines=paragraph.split('\n'),inventory=/(?:^|\D)14(?:\D|$)|১৪/.test(lines[0])&&(lines[1]?.match(/[,،、]/g)||[]).length>=8;
      if(!inventory){assert(s.includes(paragraph),'Existing feature and shortcut paragraphs must survive');continue;}
      const heading=lines[0].replace('14','16').replace('১৪','১৬'),current=s.split('\n\n').find(p=>p.startsWith(heading+'\n'));
      assert(current,'Current sixteen-language listing section must exist');
      const language=locale==='zh-tw'?'zh-Hant':locale==='en-us'?'en':locale==='ko-kr'?'ko':locale;
      const names=new Intl.DisplayNames(language,{type:'language'});
      assert(current.includes(names.of('fi'))&&current.includes(names.of('th')),'Finnish and Thai must be disclosed in the current inventory');
    }
  });
  await check('Public files are an allowlisted static surface, with no private source or fabricated proof',()=>{
    const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{assert(!e.isSymbolicLink(),'No external asset links');const p=path.join(d,e.name);return e.isDirectory()?walk(p):[p];});
    const rel=walk(path.join(__dirname,'site')).map(f=>path.relative(path.join(__dirname,'site'),f).replaceAll('\\','/')).sort();
    assert.deepEqual(rel,['.nojekyll','assets/icon.png','assets/site.css','index.html','ko/index.html','es/index.html','robots.txt'].sort());
    for(const f of Object.values(content.pages).map(p=>p.path)){
      const s=fs.readFileSync(path.join(__dirname,'site',f),'utf8');
      assert(!/aggregateRating|reviewCount|softwareVersion|sourceCode|github\.com\/K2Bact\/OTTSub|D:\\|C:\\|artifacts\/qa|__ottsub/i.test(s));
      assert(!/<script(?! type="application\/ld\+json")|<iframe|<form|<input|<video|<link[^>]+(?:fonts\.google|http)/i.test(s));
    }
    report.previewFiles=rel;
  });
  const browser=await chromium.launch({headless:true});report.browser=browser.version();
  try{
    const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
    const unexpected=[];page.on('request',r=>{if(new URL(r.url()).host!=='ottsub-geo.test')unexpected.push(r.url());});
    await page.route('**/*',async route=>{
      const u=new URL(route.request().url());assert.equal(u.host,'ottsub-geo.test');
      const name=decodeURIComponent(u.pathname).replace(/^\//,'');const relative=name.endsWith('/')?name+'index.html':name||'index.html';
      const abs=path.resolve(__dirname,'site',relative);assert(abs.startsWith(path.join(__dirname,'site')+path.sep));
      assert(fs.existsSync(abs),'Missing asset '+relative);
      return route.fulfill({contentType:({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'})[path.extname(abs)]||'text/plain',body:fs.readFileSync(abs)});
    });
    for(const [lang,c]of Object.entries(content.pages)){
      const url=new URL(c.path.replace(/index\.html$/,''),'http://ottsub-geo.test/').href;
      await check(`${lang}: semantic content and structured facts agree with JavaScript disabled`,async()=>{
        await page.goto(url);assert.equal(await page.title(),c.title);assert.equal(await page.locator('html').getAttribute('lang'),lang);
        assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.intro').textContent(),c.intro);
        const schema=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());assert.equal(schema.description,c.intro);assert.equal(schema.identifier,content.product.storeId);assert.equal(schema.offers.price,'0');
        assert.equal(await page.locator('#questions article').count(),c.faqs.length);for(const [q,a]of c.faqs){assert.equal(await page.getByRole('heading',{name:q,exact:true}).count(),1);assert(await page.getByText(a,{exact:true}).isVisible());}
        const store=new URL(await page.locator('a.button').first().getAttribute('href'));
        assert.equal(store.origin+store.pathname,content.product.storeUrl);
        assert.equal(store.searchParams.get('utm_source'),'ottsub_site');
        assert.equal(store.searchParams.get('utm_content'),lang+'_hero');
        assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
        assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),c.description);
      });
      for(const width of [320,360,430,768,1280])await check(`${lang}: ${width}px visible layout without horizontal overflow`,async()=>{
        await page.setViewportSize({width,height:950});await page.goto(url);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        const clipped=await page.locator('h1,h2,h3,p,a.button').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().width>0&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent));assert.deepEqual(clipped,[]);
        for(const img of await page.locator('img').all())assert(await img.evaluate(i=>i.complete&&i.naturalWidth>0));
        if(width===320||width===1280)await page.screenshot({path:path.join(out,`${lang}-${width}.png`),fullPage:true});
      });
    }
    await check('Language links and all section anchors work without client-side code',async()=>{
      await page.goto('http://ottsub-geo.test/');await page.locator('a.language[hreflang="ko"]').click();assert.equal(await page.locator('html').getAttribute('lang'),'ko');
      await page.locator('a.language[hreflang="en"]').click();assert.equal(await page.locator('html').getAttribute('lang'),'en');
      for(const id of ['start','timing','questions']){await page.locator(`nav a[href="#${id}"]`).click();assert(new URL(page.url()).hash==='#'+id);}
      assert.deepEqual(unexpected,[]);report.externalResourceRequests=unexpected;
    });
  }finally{await browser.close();}
  report.passed=report.errors.length===0;fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,failed:report.cases.filter(c=>!c.passed),preservedInputs:report.preservedInputs,preservedZips:report.preservedZips,errors:report.errors},null,2));
  if(!report.passed)process.exitCode=1;
})().catch(e=>{report.errors.push(e.stack);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');console.error(e);process.exitCode=1;});
