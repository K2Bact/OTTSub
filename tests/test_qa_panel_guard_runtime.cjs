// Behavior regressions for the real QA runner and worker source, without starting child processes.
const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {EventEmitter}=require('node:events');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'scripts/run-qa.cjs'),'utf8');
const functions=source.slice(source.indexOf('function summarizeOutput('),source.indexOf('async function main()'));
async function runReport(output,{name='probe_browser.cjs',group='browser',code=0,timeout=false,launchError=false}={}){
 const timers=[],context=vm.createContext({Buffer,path,root,out:root,env:{},results:[],
  fs:{createWriteStream:()=>({write(){},end(fn){fn();}})},console:{log(){}},
  process:{execPath:process.execPath,platform:'qa-regression',env:{}},setTimeout:fn=>(timers.push(fn),timers.length),clearTimeout(){},
  spawn:()=>{const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>{};
   queueMicrotask(()=>{if(timeout)timers[0]();if(launchError)child.emit('error',new Error('injected launch failure'));child.stdout.emit('data',Buffer.from(typeof output==='string'?output:JSON.stringify(output)));child.emit('close',code,null);});return child;}
 });
 vm.runInContext(functions,context,{filename:'run-qa actual functions'});
 return JSON.parse(JSON.stringify(await context.run({name,group,args:[],timeout:10})));
}
const one={passed:true,total:1,cases:[{name:'one',passed:true}],errors:[]};
const episode={passed:true,browserVersion:'151.0.7922.34',errors:[],result:{initial:{ready:true},afterNavigation:{movieId:'200'},exited:{ready:false}}};
for(const [name,data,options] of [
 ['boolean report',one,{}],['numeric report',{passed:1,total:1,cases:one.cases},{}],
 ['report with planned count',{...one,plannedTotal:1},{}],['legacy episode report',episode,{name:'test_episode_browser.cjs'}],
 ['ANSI and whitespace','\u001b[32m'+JSON.stringify(one)+'\u001b[0m\n',{}]
])test('accepts '+name,async()=>{const r=await runReport(data,options);assert.equal(r.status,'PASS');assert.equal(r.reportPassed,true);assert.equal(r.reportValid,true);if(options.name)assert.equal(r.checks,null);});
test('exit 0 cannot hide failed browser JSON',async()=>{const r=await runReport({...one,passed:false});assert.equal(r.status,'FAIL');assert.equal(r.reportPassed,false);assert(r.failures.length);});
for(const [name,data,options] of [
 ['failed case',{...one,cases:[{name:'failed',passed:false}]},{}],['errors override success',{...one,errors:['failure']},{}],
 ['missing success',{total:1,cases:one.cases},{}],['string success',{...one,passed:'true'},{}],['missing cases',{passed:true,total:1},{}],
 ['empty output','',{}],['broken JSON','not JSON',{}],['null report','null',{}],['array report','[]',{}],
 ['zero execution',{passed:true,total:0,cases:[]},{}],['fractional count',{...one,total:1.5},{}],
 ['overflow count','{"passed":true,"total":1e400,"cases":[{"name":"one","passed":true}]}',{}],
 ['wrong declared count',{...one,total:2},{}],['wrong numeric successes',{...one,passed:0},{}],['fractional successes',{...one,passed:0.5},{}],
 ['wrong planned count',{...one,plannedTotal:2},{}],['string planned count',{...one,plannedTotal:'1'},{}],
 ['invalid errors array',{...one,errors:{}},{}],['invalid error entry',{...one,errors:[{}]},{}],
 ['invalid cases array',{...one,cases:{}},{}],['null case',{...one,cases:[null]},{}],
 ['string case success',{...one,cases:[{name:'bad',passed:'true'}]},{}],['missing case name',{...one,cases:[{passed:true}]},{}],
 ['explicit failed count',{...one,failed:1},{}],
 ['episode shape from wrong suite',episode,{}],['episode missing evidence',{...episode,result:{}},{name:'test_episode_browser.cjs'}],
 ['episode missing errors',{...episode,errors:undefined},{name:'test_episode_browser.cjs'}],['episode failed',{...episode,passed:false},{name:'test_episode_browser.cjs'}]
])test('rejects '+name+' even with exit 0',async()=>{const r=await runReport(data,options);assert.equal(r.status,'FAIL');assert(r.failures.length,name);});
for(const [name,options,status] of [['nonzero',{code:1},'FAIL'],['timeout',{timeout:true},'TIMEOUT'],['launch error',{launchError:true},'ERROR']]){
 test('preserves '+name+' precedence',async()=>{assert.equal((await runReport(one,options)).status,status);});
}
test('non-browser success does not need JSON and TAP failure cannot pass',async()=>{
 assert.equal((await runReport('',{group:'syntax'})).status,'PASS');
 assert.equal((await runReport('# tests 1\n# pass 0\n# fail 1\n',{group:'runtime'})).status,'FAIL');
});
const workerSource=fs.readFileSync(path.join(root,'src/side-panel.js'),'utf8');
async function worker(chrome){const warnings=[],sandbox={console:{warn:(...args)=>warnings.push(args)},...(chrome===undefined?{}:{chrome})};await vm.runInNewContext(workerSource,sandbox);return warnings;}
test('worker handles missing API with one diagnostic',async()=>{
 for(const chrome of [undefined,{}, {sidePanel:{}},{sidePanel:{setPanelBehavior:null}}])assert.equal((await worker(chrome)).length,1);
});
test('worker registers once per supported startup without warning',async()=>{
 let calls=0;const chrome={sidePanel:{setPanelBehavior:async options=>{assert.equal(options.openPanelOnActionClick,true);calls++;}}};
 assert.equal((await worker(chrome)).length,0);assert.equal((await worker(chrome)).length,0);assert.equal(calls,2);
});
test('worker handles synchronous API throw once without retry',async()=>{
 let calls=0;const warnings=await worker({sidePanel:{setPanelBehavior(){calls++;throw new TypeError('injected synchronous failure');}}});assert.equal(calls,1);assert.equal(warnings.length,1);
});
test('worker handles Promise rejection without unhandled rejection or retry',async()=>{
 const unhandled=[],handler=e=>unhandled.push(e);process.on('unhandledRejection',handler);
 try{let calls=0;const warnings=await worker({sidePanel:{setPanelBehavior:()=>{calls++;return Promise.reject(new Error('injected rejection'));}}});await new Promise(setImmediate);assert.equal(calls,1);assert.equal(warnings.length,1);assert.equal(unhandled.length,0);}
 finally{process.removeListener('unhandledRejection',handler);}
});