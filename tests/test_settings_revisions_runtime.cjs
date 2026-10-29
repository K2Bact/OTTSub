const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/core/settings-revisions.js'),'utf8');
const key='ottsub_secondary_lang',meta='ottsub_revision_'+key;
const settle=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
function device(origin,initial={},synced={}){
 const local=structuredClone(initial),sync=structuredClone(synced),listeners=[],sent=[],timers=new Map();let serial=0;
 const emit=(values,area)=>{const data=area==='local'?local:sync,changes={};for(const [k,v]of Object.entries(values)){if(JSON.stringify(data[k])!==JSON.stringify(v)){changes[k]={oldValue:data[k],newValue:structuredClone(v)};data[k]=structuredClone(v);}}
  if(Object.keys(changes).length)queueMicrotask(()=>listeners.forEach(f=>f(changes,area)));};
 const ctx={window:{},crypto:{randomUUID:()=>origin},setTimeout:f=>{timers.set(++serial,f);return serial;},clearTimeout:id=>timers.delete(id),chrome:{runtime:{},storage:{onChanged:{addListener:f=>listeners.push(f)}}}};
 for(const area of ['local','sync'])ctx.chrome.storage[area]={get:(_,cb)=>queueMicrotask(()=>cb(structuredClone(area==='local'?local:sync))),set:(v,cb)=>{if(area==='sync')sent.push(structuredClone(v));emit(v,area);cb?.();}};
 vm.runInNewContext(source,ctx);const api=ctx.window.OTTSubSettingsRevisions(obj=>Object.fromEntries(Object.entries(obj).filter(([k,v])=>k===key&&typeof v==='string'&&/^[a-z]{2}$/.test(v))));
 return {api,local,sync,sent,receive:v=>emit(v,'sync')};
}
test('remote edit of a locally saved key is accepted; older echo cannot roll it back',async()=>{
 const a=device('a',{[key]:'ko'}),b=device('b',{[key]:'ko'});await Promise.all([a.api.ready,b.api.ready]);
 a.api.save(key,'es');a.api.flush();await settle();const old=a.sent.at(-1);b.receive(old);await settle();assert.equal(b.local[key],'es');
 b.api.save(key,'fr');b.api.flush();await settle();const newer=b.sent.at(-1);a.receive(newer);await settle();assert.equal(a.local[key],'fr');
 b.receive(old);await settle();assert.equal(b.local[key],'fr');b.api.flush();assert.equal(b.sent.at(-1)[meta].value,'fr');
});
test('concurrent edits converge by revision and origin without relying on computer clocks',async()=>{
 const a=device('a'),b=device('b');await Promise.all([a.api.ready,b.api.ready]);a.api.save(key,'ja');b.api.save(key,'de');a.api.flush();b.api.flush();
 const av=a.sent.at(-1),bv=b.sent.at(-1);a.receive(bv);b.receive(av);await settle();assert.equal(a.local[key],'de');assert.equal(b.local[key],'de');
});
test('startup chooses latest persisted record and the next local edit increments it',async()=>{
 const d=device('c',{[key]:'ja',[meta]:{n:1,origin:'a',value:'ja'}},{[key]:'es',[meta]:{n:3,origin:'b',value:'es'}});
 await d.api.ready;await settle();assert.equal(d.local[key],'es');d.api.save(key,'ko');assert.equal(d.local[meta].n,4);
});
test('unversioned legacy sync does not overwrite local values; malformed records are ignored',async()=>{
 const d=device('a',{[key]:'ko'});await d.api.ready;d.receive({[key]:'ja'});await settle();assert.equal(d.local[key],'ko');
 for(const r of [{n:NaN,origin:'b',value:'es'},{n:9,origin:'b',value:{}},{n:-1,origin:'b',value:'es'}]){d.receive({[meta]:r});await settle();}assert.equal(d.local[key],'ko');
});
test('a remote revision cancels an older pending sync write; local save before startup is retained',async()=>{
 const d=device('a');d.api.save(key,'ja');await d.api.ready;await settle();assert.equal(d.local[key],'ja');
 d.receive({[meta]:{n:2,origin:'b',value:'es'},[key]:'es'});await settle();d.api.flush();assert.equal(d.local[key],'es');assert.equal(d.sent.length,0);
});
