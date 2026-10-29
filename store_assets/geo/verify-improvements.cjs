const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.OTTSUB_GEO_QA_DIR||path.join(root,'artifacts/qa/geo-improvements-20261022')),candidate=path.join(out,'public-candidate');
const {chromium}=require(path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const content=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'))),campaign=JSON.parse(fs.readFileSync(path.join(__dirname,'campaigns.json')));
const {render,analyze,headers}=require('./measure.cjs');
const result={passed:false,cases:[],errors:[],candidateHashes:{}};
const check=async(name,fn)=>{try{await fn();result.cases.push({name,passed:true});}catch(e){result.cases.push({name,passed:false});result.errors.push(e.stack);}};
const build=spawnSync(process.execPath,[path.join(__dirname,'build.cjs'),'--base-url',content.product.publicBaseUrl,'--out',candidate],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(build.status,0,build.stderr);
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{assert(!e.isSymbolicLink());return e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)];});
for(const f of walk(candidate))result.candidateHashes[path.relative(candidate,f).replaceAll('\\','/')]=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async()=>{
 await check('Only the allowlisted public assets are candidates; tracking tools and CSV stay local',()=>assert.deepEqual(Object.keys(result.candidateHashes).sort(),['.nojekyll','assets/icon.png','assets/site.css','index.html','ko/index.html','es/index.html','sitemap.xml'].sort()));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();const outside=[];
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());if(u.host!=='ottsub-geo.test'){outside.push(u.href);return route.abort();}
   let p=decodeURIComponent(u.pathname).replace(/^\//,'');if(!p||p.endsWith('/'))p+='index.html';
   const full=path.resolve(candidate,p);assert(full.startsWith(candidate+path.sep));
   return route.fulfill({body:fs.readFileSync(full),contentType:({'.html':'text/html; charset=utf-8','.css':'text/css','.png':'image/png'})[path.extname(full)]||'text/plain'});
  });
  for(const [lang,c]of Object.entries(content.pages)){
   const url=new URL(c.path.replace(/index\.html$/,''),'http://ottsub-geo.test/').href;
   await check(lang+': symptom FAQ, offset sign, gradual drift and privacy remain readable without JS',async()=>{
    await page.goto(url);assert.equal(await page.locator('#questions article').count(),11);
    for(const [q,a]of c.faqs.slice(0,2)){assert.equal(await page.getByRole('heading',{name:q,exact:true}).count(),1);assert.equal(await page.getByText(a,{exact:true}).count(),1);}
    assert(c.faqs[0][1].includes('+0.3s')&&c.faqs[0][1].includes('−0.3s'));
    assert.match(await page.locator('#privacy').textContent(),({en:/fixed campaign labels/,ko:/고정 캠페인 값/,es:/etiquetas de campaña fijas/})[lang]);
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'index,follow');
    const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');assert.equal(canonical,new URL(c.path.replace(/index\.html$/,''),content.product.publicBaseUrl).href);
    const schema=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());assert(!JSON.stringify(schema).includes('utm_'));
   });
   await check(lang+': all store links use fixed campaign values and a distinct content label',async()=>{
    const links=await page.locator('a[href^="https://chromewebstore.google.com/"]').evaluateAll(els=>els.map(e=>e.href));assert.equal(links.length,3);
    const positions=[];for(const href of links){const u=new URL(href);assert.equal(u.origin+u.pathname,content.product.storeUrl);assert.equal(u.searchParams.get('utm_source'),campaign.source);assert.equal(u.searchParams.get('utm_medium'),campaign.medium);assert.equal(u.searchParams.get('utm_campaign'),campaign.campaign+'_'+u.searchParams.get('utm_content'));positions.push(u.searchParams.get('utm_content'));assert.deepEqual([...u.searchParams.keys()].sort(),['utm_source','utm_medium','utm_campaign','utm_content'].sort());}
    assert.deepEqual(positions.sort(),['hero','footer','privacy'].map(x=>lang+'_'+x).sort());
    assert.equal(await page.locator('script:not([type="application/ld+json"]),iframe,form').count(),0);
   });
   await check(lang+': every language link works in both directions without JavaScript',async()=>{
    for(const [target,targetPage]of Object.entries(content.pages))if(target!==lang){await page.goto(url);const a=page.locator('a.language[hreflang="'+target+'"]');assert.equal(await a.textContent(),targetPage.nativeName);await a.click();assert.equal(await page.locator('html').getAttribute('lang'),target);assert.equal(new URL(page.url()).pathname,'/'+targetPage.path.replace(/index\.html$/,''));}
   });
   for(const width of [320,360,430,768,1280])await check(lang+': public '+width+'px has no horizontal overflow',async()=>{
    await page.setViewportSize({width,height:950});await page.goto(url);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(width===320||width===1280)await page.screenshot({path:path.join(out,`${lang}-${width}.png`),fullPage:true});
    if(width===320)await page.locator('#questions').screenshot({path:path.join(out,`${lang}-faq-320.png`)});
   });
  }
  await check('Public rendering performs no external requests',()=>assert.deepEqual(outside,[]));
  await context.close();
  const offline=await browser.newContext({javaScriptEnabled:false});const report=await offline.newPage();
  await report.route('**/*',r=>r.abort());
  await check('Empty weekly report is honestly unmeasured and readable at phone width',async()=>{
   await report.setViewportSize({width:375,height:900});await report.setContent(render(analyze([])));assert.equal(await report.locator('.empty').count(),1);assert.equal(await report.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await report.screenshot({path:path.join(out,'weekly-empty-375.png'),fullPage:true});
  });
  await check('Synthetic weekly table separates install events, unknown/test traffic and comparison',async()=>{
   const sample=Object.fromEntries(headers.map(h=>[h,({property_id:'synthetic fixture',timezone:'Asia/Seoul',filters:'offline test only',scope:'total',period_start:'2026-10-05',period_end:'2026-10-11',source:'',medium:'',campaign:'',content:'',audience:'unknown',same_population:'true',visitors:'20',install_users:'3',install_events:'4',sessions:'25',engaged_sessions:'10',page_views:'30'})[h]]));
   await report.setViewportSize({width:1280,height:800});await report.setContent(render(analyze([sample])));assert.equal(await report.locator('tbody tr').count(),1);assert.match(await report.locator('tbody').textContent(),/15.0%/);assert.equal(await report.locator('script,iframe').count(),0);
   await report.screenshot({path:path.join(out,'weekly-synthetic-1280.png'),fullPage:true});
  });
  await offline.close();
 }finally{await browser.close();}
 result.passed=!result.errors.length;fs.writeFileSync(path.join(out,'improvement-verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,cases:result.cases.length,errors:result.errors}));if(!result.passed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
