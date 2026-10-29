// Build a static, source-free product page; no account, API or network is used.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'content.json'),'utf8'));
const campaign=JSON.parse(fs.readFileSync(path.join(__dirname,'campaigns.json'),'utf8'));
const privacy=JSON.parse(fs.readFileSync(path.join(__dirname,'privacy.json'),'utf8'));
const args=process.argv.slice(2);let baseUrl=null,out=path.join(__dirname,'site');
for(let i=0;i<args.length;i++){
  if(args[i]==='--base-url')baseUrl=args[++i];
  else if(args[i]==='--out')out=path.resolve(args[++i]);
  else throw Error('Unknown argument: '+args[i]);
}
const projectRoot=path.resolve(__dirname,'../..');
assert(out.startsWith(projectRoot+path.sep),'Output must stay inside OTTSub');
if(baseUrl){
  const u=new URL(baseUrl);
  assert(u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash,'Use a clean HTTPS public base URL');
  assert(!/^(localhost|127\.|0\.|\[::1\])/.test(u.hostname)&&!/(?:^|\.)(?:example\.(?:com|org|net)|invalid|test)$/.test(u.hostname),'Do not publish guessed/placeholder/local URLs');
  if(!u.pathname.endsWith('/'))u.pathname+='/';baseUrl=u.href;
}
const {product:p,pages}=data;
function storeLink(lang,position){
 const url=new URL(p.storeUrl),allowed=['hero','footer','privacy'];
 assert(Object.hasOwn(pages,lang)&&/^[a-z]{2}$/.test(lang)&&allowed.includes(position));
 for(const key of ['source','medium','campaign']){assert(/^[a-z0-9_]+$/.test(campaign[key]));url.searchParams.set('utm_'+key,key==='campaign'?campaign[key]+'_'+lang+'_'+position:campaign[key]);}
 url.searchParams.set('utm_content',lang+'_'+position);return url.href;
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(locale)=>baseUrl?new URL(pages[locale].path==='index.html'?'':pages[locale].path.replace(/index\.html$/,''),baseUrl).href:null;
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
fs.copyFileSync(path.join(__dirname,'site.css'),path.join(out,'assets/site.css'));
fs.copyFileSync(path.join(projectRoot,'icons/icon128.png'),path.join(out,'assets/icon.png'));
fs.writeFileSync(path.join(out,'.nojekyll'),'');
for(const [lang,c] of Object.entries(pages)){
  const policy=privacy[lang];
  const prefix=lang==='en'?'':'../';
  const languages=Object.entries(pages).filter(([locale])=>locale!==lang).map(([locale,target])=>{
    const relative=path.posix.relative(path.posix.dirname(c.path),target.path).replace(/index\.html$/,'')||'./';
    return '<a class="language" href="'+esc(relative)+'" lang="'+esc(locale)+'" hreflang="'+esc(locale)+'">'+esc(target.nativeName)+'</a>';
  }).join('');
  const canonical=link(lang);
  const schema={'@context':'https://schema.org','@type':'SoftwareApplication','name':p.name,'alternateName':p.storeName,'identifier':p.storeId,'url':canonical||p.storeUrl,'sameAs':[p.storeUrl],'applicationCategory':'BrowserApplication','description':c.intro,'inLanguage':lang,'softwareRequirements':c.cost,'isAccessibleForFree':true,'offers':{'@type':'Offer','price':p.price,'priceCurrency':p.priceCurrency,'url':p.storeUrl},'featureList':c.features.map(x=>x[1])};
  const urls=canonical?`<link rel="canonical" href="${esc(canonical)}">\n${Object.keys(pages).map(l=>`<link rel="alternate" hreflang="${l}" href="${esc(link(l))}">`).join('\n')}\n<link rel="alternate" hreflang="x-default" href="${esc(link('en'))}">\n<meta property="og:url" content="${esc(canonical)}">`:'';
  const markup=`<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(c.title)}</title><meta name="description" content="${esc(c.description)}">
<meta name="robots" content="${baseUrl?'index,follow':'noindex,nofollow'}">
<meta property="og:type" content="website"><meta property="og:site_name" content="OTTSub"><meta property="og:title" content="${esc(c.title)}"><meta property="og:description" content="${esc(c.description)}">
${urls}
<link rel="icon" href="${prefix}assets/icon.png"><link rel="stylesheet" href="${prefix}assets/site.css">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>
</head>
<body>
<a class="skip" href="#main">${esc(c.skip)}</a>
${baseUrl?'':`<p class="preview">${esc(c.preview)}</p>`}
<header class="wrap nav"><a class="brand" href="${lang==='en'?'./':'./'}"><img src="${prefix}assets/icon.png" alt="" width="32" height="32">OTTSub</a><nav aria-label="${esc(c.navLabel)}" class="nav-links"><a href="#start">${esc(c.nav[0])}</a><a href="#timing">${esc(c.nav[1])}</a><a href="#questions">${esc(c.nav[2])}</a>${languages}</nav></header>
<main id="main" class="wrap">
<div class="hero"><div><p class="eyebrow">${esc(c.eyebrow)}</p><h1>${esc(c.headline)}</h1><p class="intro">${esc(c.intro)}</p><a class="button" href="${esc(storeLink(lang,'hero'))}">${esc(c.install)} ↗</a><p class="cost">${esc(c.cost)}</p></div>
<figure class="demo"><div class="screen"><span class="wordmark" aria-hidden="true">OTTSub</span><p class="subtitle" lang="${esc(c.demoPrimaryLang||'en')}">${esc(c.demoPrimary)}</p><p class="subtitle secondary" lang="${esc(c.demoSecondaryLang||'ko')}">${esc(c.demoSecondary)}</p><div class="timing-chips" aria-hidden="true"><span class="chip">−0.1s</span><span class="chip">0.0s</span><span class="chip">+0.1s</span></div></div><figcaption>${esc(c.demoLabel)}</figcaption><p class="demo-note">${esc(c.demoTiming)}</p></figure></div>
<section aria-labelledby="features"><h2 id="features">${esc(c.featuresTitle)}</h2><div class="features">${c.features.map(([h,t])=>`<article><h3>${esc(h)}</h3><p>${esc(t)}</p></article>`).join('')}</div></section>
<section id="start" aria-labelledby="steps-title"><h2 id="steps-title">${esc(c.stepsTitle)}</h2><ol class="steps">${c.steps.map(([h,t])=>`<li><h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol></section>
<section id="timing" class="example" aria-labelledby="timing-title"><div><h2 id="timing-title">${esc(c.exampleTitle)}</h2><p>${esc(c.exampleIntro)}</p></div><div><div class="offsets">${c.exampleRows.map(([h,n,t])=>`<div class="offset-row"><span>${esc(h)}</span><strong>${esc(n)}</strong><small>${esc(t)}</small></div>`).join('')}</div><p class="fine-print">${esc(c.exampleNote)}</p></div></section>
<section id="questions" aria-labelledby="faq-title"><h2 id="faq-title">${esc(c.faqTitle)}</h2><div class="faq">${c.faqs.map(([q,a])=>`<article><h3>${esc(q)}</h3><p>${esc(a)}</p></article>`).join('')}</div></section>
<section id="privacy" class="privacy" aria-labelledby="privacy-title"><h2 id="privacy-title">${esc(policy.title)}</h2><div class="policy-body"><p>${esc(policy.intro)}</p>${policy.sections.map(([h,t])=>`<article><h3>${esc(h)}</h3><p>${esc(t)}</p></article>`).join('')}<p><a href="${esc(storeLink(lang,'privacy'))}">${esc(policy.contact)}</a></p><ul>${policy.sources.map(([label,url])=>`<li><a href="${esc(url)}">${esc(label)}</a></li>`).join('')}</ul><p class="reviewed">${esc(policy.reviewed)} <time datetime="${privacy.reviewedDate}">${privacy.reviewedDate}</time></p></div></section>
</main><footer><div class="wrap closing"><div><p>${esc(c.footer)}</p><p><a href="#privacy">${esc(policy.title)}</a></p><span class="reviewed">${esc(c.reviewed)} <time datetime="${p.reviewedDate}">${p.reviewedDate}</time></span></div><a class="button" href="${esc(storeLink(lang,'footer'))}">${esc(c.install)} ↗</a></div></footer>
</body></html>\n`;
  const f=path.join(out,c.path);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,markup);
}
// A robots file is an origin-root file. For subpath hosting, merge the Sitemap
// line into the host's existing root robots.txt instead of replacing it.
const robots=path.join(out,'robots.txt');
if(!baseUrl)fs.writeFileSync(robots,'User-agent: *\nDisallow: /\n');
else if(new URL(baseUrl).pathname==='/')fs.writeFileSync(robots,`User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml',baseUrl).href}\n`);
else if(fs.existsSync(robots))fs.unlinkSync(robots);
const sitemap=path.join(out,'sitemap.xml');
if(baseUrl)fs.writeFileSync(sitemap,`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(pages).map(l=>`<url><loc>${esc(link(l))}</loc></url>`).join('')}</urlset>\n`);
else if(fs.existsSync(sitemap))fs.unlinkSync(sitemap);
console.log(JSON.stringify({mode:baseUrl?'public-source':'local-preview',out,baseUrl,pages:Object.keys(pages).length,published:false}));
