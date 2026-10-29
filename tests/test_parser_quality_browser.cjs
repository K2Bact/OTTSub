const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,root}=require('./helpers/offline-popup.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true}),cases=[],errors=[];
 const check=async(name,fn)=>{try{await fn();cases.push({name,passed:true});}catch(e){cases.push({name,passed:false});errors.push(e.stack);}};
 try{
  const page=await browser.newPage({viewport:{width:900,height:700}});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<div data-uia="player" style="position:relative;width:880px;height:650px"><video style="width:880px;height:650px"></video></div>'}));
  await page.goto('https://ottsub.test/watch/1');
  await page.addStyleTag({content:fs.readFileSync(path.join(root,'src/styles.css'),'utf8')});
  for(const file of ['src/parser.js','src/renderer.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});
  await page.evaluate(()=>{OTTSubRenderer.ensureMounted(document.querySelector('video'));OTTSubRenderer.setBlurTarget('none');});
  await check('TTML inherited styles, ruby base text, line breaks, mixed direction and overlapping rows survive real DOM parsing',async()=>{
   const r=await page.evaluate(()=>{
    const xml='<tt xmlns:tts="http://www.w3.org/ns/ttml#styling"><head><styling><style xml:id="em" tts:fontStyle="italic"/></styling></head><body><div><p begin="1s" end="5s" style="em"><span>ไทย العربية \u2066-0.1s\u2069 👩‍💻 é</span><br/><ruby>漢<rt>かん</rt>字<rt>じ</rt></ruby></p><p begin="1s" end="5s">SECOND ROW</p></div></body></tt>';
    const cues=OTTSubParser.parse(xml);OTTSubRenderer.renderDual({top:[],bottom:cues},{top:[],bottom:[]},{isDualMode:false,offsetMs:0});
    return {cues,text:OTTSubRenderer.bottomBox.textContent,html:OTTSubRenderer.bottomBox.innerHTML,visible:OTTSubRenderer.bottomBox.innerText,lines:OTTSubRenderer.bottomBox.querySelectorAll('.ottsub-line').length};
   });
   assert.equal(r.cues.length,2);assert(r.lines>=1);assert.match(r.visible,/SECOND ROW/);assert(r.visible.includes('\n')); assert.match(r.text,/ไทย العربية/);assert.match(r.text,/漢字/);assert.doesNotMatch(r.text,/かん|じ/);assert(r.text.includes('\u2066-0.1s\u2069'));assert.match(r.html,/<i>/);assert(r.cues[0].text.includes('\n'));
  });
  await check('encoded active markup is inert and valid emphasis remains styled',async()=>{
   const r=await page.evaluate(()=>{
    window.injected=0;const cues=OTTSubParser.parse('WEBVTT\n\n00:00:01.000 --> 00:00:05.000\n&lt;img src=x onerror=window.injected++&gt; <b>safe</b><script>window.injected++</script>\n');
    OTTSubRenderer.renderDual({top:[],bottom:cues},{top:[],bottom:[]},{isDualMode:false,offsetMs:0});
    return {count:document.querySelectorAll('#ottsub-container img,#ottsub-container script').length,text:OTTSubRenderer.bottomBox.textContent,injected,emphasis:!!OTTSubRenderer.bottomBox.querySelector('b')};
   });assert.equal(r.count,0);assert.equal(r.injected,0);assert.match(r.text,/<img/);assert(r.emphasis);
  });
  await check('long Thai and mixed-script lines wrap inside the real player bounds',async()=>{
   const r=await page.evaluate(()=>{
    const cues=OTTSubParser.parse('WEBVTT\n\n00:00:01.000 --> 00:00:05.000\n'+('ไทย漢字 العربية English 👩‍💻 ').repeat(18)+'\nLAST LINE\n');
    OTTSubRenderer.renderDual({top:[],bottom:cues},{top:[],bottom:[]},{isDualMode:false,offsetMs:0});
    const line=document.querySelector('.ottsub-line'),b=line.getBoundingClientRect(),v=document.querySelector('video').getBoundingClientRect();
    return {left:b.left,right:b.right,playerLeft:v.left,playerRight:v.right,text:line.innerText,height:b.height};
   });assert(r.left>=r.playerLeft-1&&r.right<=r.playerRight+1,JSON.stringify(r));assert(r.text.includes('LAST LINE'));assert(r.height>40);
  });
  await check('bounded malformed XML, cyclic styles and entity declarations fail safely',async()=>{
   const r=await page.evaluate(()=>[
    '<tt><body><div><p begin="1s" end="2s">unclosed',
    '<!DOCTYPE tt [<!ENTITY bad SYSTEM "https://blocked.invalid/">]><tt><body><div><p begin="1s" end="2s">&bad;</p></div></body></tt>',
    '<tt xmlns:tts="http://www.w3.org/ns/ttml#styling"><head><styling><style xml:id="a" style="b"/><style xml:id="b" style="a"/></styling></head><body><div><p style="a" begin="1s" end="2s">safe</p></div></body></tt>'
   ].map(input=>OTTSubParser.parse(input)));
   assert.equal(r[0].length,0);assert.equal(r[1].length,0);assert.equal(r[2][0].text,'safe');
  });
  const out=process.env.OTTSUB_QA_ARTIFACT_DIR||path.join(root,'artifacts/qa/manual/parser-quality');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'complex-subtitle-quality.png')});
 }finally{await browser.close();console.log(JSON.stringify({passed:cases.length>0&&!errors.length,total:cases.length,cases,errors},null,2));if(errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
