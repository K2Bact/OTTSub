const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function dpiHarness(){
 const queries=[],calls=[];const ctx=vm.createContext({document:{body:{classList:{remove(){}}}},performance:{now:()=>0}});ctx.window=ctx;ctx.devicePixelRatio=1;
 ctx.matchMedia=media=>{const listeners=new Set();const q={media,listeners,addEventListener(_type,fn){listeners.add(fn);},removeEventListener(_type,fn){listeners.delete(fn);},emit(){const current=[...listeners];listeners.clear();for(const fn of current)fn();}};queries.push(q);return q;};
 vm.runInContext(fs.readFileSync(path.join(root,'src/renderer.js'),'utf8'),ctx);const renderer=ctx.OTTSubRenderer;renderer.videoElem={isConnected:true};renderer.syncNativeStyles=(_v,force)=>calls.push(force);
 return {ctx,queries,calls,renderer,active:()=>queries.reduce((n,q)=>n+q.listeners.size,0)};
}
test('20 renderer lifetimes leave exactly one current DPI listener, then zero on destroy',()=>{
 const h=dpiHarness();for(let i=0;i<20;i++){h.renderer._initDpiWatchdog();assert.equal(h.active(),1);h.renderer.destroy();assert.equal(h.active(),0);}h.renderer._initDpiWatchdog();assert.equal(h.active(),1);
});
test('DPI change refreshes connected video and re-arms one query for the new DPR',()=>{
 const h=dpiHarness();h.renderer._initDpiWatchdog();const old=h.queries[0];h.ctx.devicePixelRatio=2;old.emit();assert.equal(h.active(),1);assert.equal(h.queries.at(-1).media,'(resolution: 2dppx)');assert.deepEqual(h.calls,[true]);
 old.emit();assert.equal(h.active(),1);assert.equal(h.calls.length,1);
});
test('queued old callback cannot re-arm after destroy or a later renderer lifetime',()=>{
 const h=dpiHarness();h.renderer._initDpiWatchdog();const old=[...h.queries[0].listeners][0];h.renderer.destroy();old();assert.equal(h.active(),0);assert.equal(h.calls.length,0);
 h.renderer._initDpiWatchdog();const current=h.renderer._dpiMql;old();assert.equal(h.active(),1);assert.equal(h.renderer._dpiMql,current);assert.equal(h.calls.length,0);
});
test('previous callback in the same lifetime cannot duplicate the newly armed query',()=>{
 const h=dpiHarness();h.renderer._initDpiWatchdog();const old=[...h.queries[0].listeners][0];h.queries[0].emit();old();assert.equal(h.active(),1);assert.equal(h.calls.length,1);
});
test('absent matchMedia and invalidated query removal do not break renderer teardown',()=>{
 const h=dpiHarness();delete h.ctx.matchMedia;h.renderer._initDpiWatchdog();h.renderer.destroy();assert.equal(h.active(),0);
 const b=dpiHarness();b.renderer._initDpiWatchdog();b.renderer._dpiMql.removeEventListener=()=>{throw Error('invalidated');};assert.doesNotThrow(()=>b.renderer.destroy());assert.equal(b.renderer._dpiMql,null);
});
function labels(source,count=false){
 let created=0;const Real=Intl.DisplayNames;const ctx=vm.createContext({window:{OTTSubI18n:{t:k=>k}},queuePopupStorageSave(){},Intl:{DisplayNames:count?class extends Real{constructor(...args){super(...args);created++;}}:Real}});
 vm.runInContext(source.replace(/^import .*;\r?$/gm,'').replace(/^export /gm,''),ctx);return {label:(t,l)=>ctx.getLocalizedLanguageLabel(t,l),created:()=>created};
}
const changed=fs.readFileSync(path.join(root,'popup/modules/ui-dual.js'),'utf8');
const before=fs.readFileSync(path.join(root,'tests/fixtures/ui-dual-before-performance.js'),'utf8');
test('all supported UI languages preserve regional/CC/forced/provider label behavior',()=>{
 const old=labels(before),now=labels(changed);const tracks=[{bcp47:'es'},{bcp47:'es-419'},{bcp47:'zh-Hans'},{bcp47:'zh-Hant'},{bcp47:'hi'},{bcp47:'ko',label:'제공자 한국어'},{bcp47:'en',isCC:true},{bcp47:'en',trackType:'assistive'},{bcp47:'en',label:'English [SDH]'},{bcp47:'en',trackType:'forced_narrative'},{bcp47:'invalid_!',label:'Provider fallback'}];
 for(const locale of ['ko','en','es','de','ja','ar','hi'])for(const track of tracks)assert.equal(now.label(track,locale),old.label(track,locale));
});
test('100 repeated English labels create one formatter rather than two per call',()=>{
 const old=labels(before,true),now=labels(changed,true);for(let i=0;i<100;i++){const track={bcp47:i%2?'es':'es-419'};assert.equal(now.label(track,'en'),old.label(track,'en'));}assert.equal(old.created(),200);assert.equal(now.created(),1);
});
test('UI language changes reuse seven formatters without caching stale provider markers',()=>{
 const now=labels(changed,true);for(let i=0;i<10;i++)for(const lang of ['ko','en','es','de','ja','ar','hi'])now.label({bcp47:'es-ES'},lang);assert.equal(now.created(),7);
 assert.equal(now.label({bcp47:'ko',label:'변경된 원본 이름'},'ko'),'변경된 원본 이름');assert.match(now.label({bcp47:'en',isCC:true},'en'),/\[CC\]$/);assert.doesNotMatch(now.label({bcp47:'en',isCC:false},'en'),/\[CC\]/);
});
test('invalid UI locale keeps the original English fallback',()=>{
 const old=labels(before),now=labels(changed);assert.equal(now.label({bcp47:'es'},'invalid_locale'),old.label({bcp47:'es'},'invalid_locale'));
});
test('Spain Spanish uses Netflix-style plain name in seven UI languages without changing identity',()=>{
 const now=labels(changed);
 for(const locale of ['ko','en','es','de','ja','ar','hi']){
  const track=Object.freeze({bcp47:'es-ES',language:'es',id:'spain-exact'});
  assert.equal(now.label(track,locale),now.label({bcp47:'es'},locale));
  assert.notEqual(now.label(track,locale),now.label({bcp47:'es-419'},locale));
  assert.equal(track.bcp47,'es-ES');assert.equal(track.id,'spain-exact');
 }
 assert.equal(now.label({bcp47:'es-ES'},'en'),'Spanish');assert.equal(now.label({bcp47:'es-ES'},'ko'),'스페인어');
});
test('provider names and CC/forced markers survive the Spain display-name change',()=>{
 const now=labels(changed);
 assert.equal(now.label({bcp47:'es-ES',label:'스페인어'},'ko'),'스페인어');
 assert.equal(now.label({bcp47:'es-ES',label:'스페인어(스페인)'},'ko'),'스페인어(스페인)');
 assert.equal(now.label({bcp47:'es-419',label:'스페인어(라틴아메리카)'},'ko'),'스페인어(라틴아메리카)');
 assert.equal(now.label({bcp47:'es-ES',isCC:true},'en'),'Spanish [CC]');
 assert.equal(now.label({bcp47:'es-ES',isForcedNarrative:true},'en'),'Spanish [Forced]');
});
