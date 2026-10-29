const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {Worker}=require('node:worker_threads');
const file=path.resolve(__dirname,'../src/parser.js'),source=fs.readFileSync(file,'utf8');
function parser(){const window={};vm.runInNewContext(source,{window,console:{warn(){}}});return window.OTTSubParser;}
const vtt=(text,start='00:00:01.000',end='00:00:02.000')=>`WEBVTT\n\n${start} --> ${end}\n${text}\n\n`;
test('invalid or reversed single cues never enter the timeline at a blank separator',()=>{
 const p=parser();for(const [start,end]of [['00:00:02.000','00:00:01.000'],['00:00:01.000','00:00:01.000']])assert.equal(p.parse(vtt('invalid',start,end)).length,0);
 assert.equal(p.parse(vtt('valid')).length,1);
});
test('timestamp conversion cannot leak Infinity or overflow rounding into a cue',()=>{
 const p=parser();for(const time of ['Infinity','1e999s','9'.repeat(400)+'t','1e308s'])assert.equal(p.parseTimestamp(time),0,time.slice(0,20));
 assert.equal(p.parseTimestamp('12.345s'),12.345);
});
test('NOTE/STYLE/REGION words in dialogue stay text; metadata blocks outside cues stay ignored',()=>{
 const p=parser();for(const word of ['NOTE','STYLE','REGION'])assert.match(p.parse(vtt(word+' this is dialogue'))[0]?.text||'',new RegExp(word));
 assert.equal(p.parse('WEBVTT\n\nNOTE metadata\nprivate note\n\n00:00:01.000 --> 00:00:02.000\nspoken\n')[0].text,'spoken');
});
test('seeded malformed cue corpus remains finite, ordered, inert and deterministic',()=>{
 const p=parser();let seed=0x0a77b;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 const pieces=['ไทย','العربية \u2066-0.1s\u2069','漢字','👩‍💻','e\u0301','&amp;#39;','&#x110000;','&#55296;','<b>x</b>','<script>alert(1)</script>','<img src=x onerror=alert(1)>','<ruby>漢<rt>かん</rt></ruby>'];
 for(let sample=0;sample<180;sample++){
  let input='WEBVTT\n\n';for(let n=0;n<12;n++){const s=next()%50,e=next()%55;input+=`00:00:${String(s).padStart(2,'0')}.000 --> 00:00:${String(e).padStart(2,'0')}.000\n${pieces[next()%pieces.length]}\n\n`;}
  const cues=p.parse(input);assert.equal(JSON.stringify(cues),JSON.stringify(p.parse(input)));
  for(let i=0;i<cues.length;i++){const c=cues[i];assert(Number.isFinite(c.begin)&&Number.isFinite(c.end)&&c.end>c.begin);assert(i===0||c.begin>=cues[i-1].begin);assert.doesNotMatch(c.text,/<(?:script|style|img)\b/i);}
 }
});
function boundedWorker(kind){return new Promise((resolve,reject)=>{
 const w=new Worker(`const {parentPort,workerData}=require('node:worker_threads');const fs=require('node:fs'),vm=require('node:vm');const window={};vm.runInNewContext(fs.readFileSync(workerData.file,'utf8'),{window,console:{warn(){}}});const text=workerData.kind==='oversize'?'x'.repeat(5*1024*1024+1):'<'.repeat(150000);const input='WEBVTT\\n\\n00:00:01.000 --> 00:00:02.000\\n'+text;const cues=window.OTTSubParser.parse(input);parentPort.postMessage({cues:cues.length,text:cues[0]?.text.length||0});`,{eval:true,workerData:{file,kind},resourceLimits:{maxOldGenerationSizeMb:128}});
 const timer=setTimeout(()=>{w.terminate();reject(Error(`Parser exceeded bounded worker deadline: ${kind}`));},4000);
 w.once('message',value=>{clearTimeout(timer);resolve(value);w.terminate();});w.once('error',e=>{clearTimeout(timer);reject(e);});
});}
test('WebVTT shares the existing 5MB rejection boundary with TTML',async()=>{assert.equal((await boundedWorker('oversize')).cues,0);});
test('unclosed markup cannot cause quadratic scanning in a bounded worker',async()=>{assert.equal((await boundedWorker('markup')).cues,1);});
