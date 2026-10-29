const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function load(file,extra={}){const window={addEventListener(){}};vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window,console:{warn(){}},...extra});return window;}
test('WebVTT timing must begin on its own line, never inside a negative or prefixed header',()=>{
 const p=load('src/parser.js').OTTSubParser;
 for(const line of ['-00:00:01.000 --> 00:00:02.000','speaker 00:00:01.000 --> 00:00:02.000','x00:00:01.000 --> 00:00:02.000','00:00:01.000 --> 00:00:02.000junk'])assert.equal(p.parse('WEBVTT\n\n'+line+'\nspoken\n\n').length,0,line);
});
test('valid WebVTT cue IDs, CRLF, comma milliseconds and placement settings remain supported',()=>{
 const p=load('src/parser.js').OTTSubParser;
 const cues=p.parse('WEBVTT\r\n\r\ncue-id\r\n00:00:01,000 --> 00:00:02,500 line:20% align:start\r\nspoken\r\n');assert.equal(cues.length,1);assert.equal(cues[0].begin,1);assert.equal(cues[0].end,2.5);assert.equal(cues[0].isTop,true);assert.equal(cues[0].text,'spoken');
});
test('JSON-compatible malformed numeric command values never throw or move an adjustment',()=>{
 const Engine=load('src/sync-engine.js').OTTSubSyncEngineClass,e=new Engine();
 const inputs=[{toString:null},{toString:1,valueOf:0},[{toString:'bad'}]];
 for(const value of inputs){assert.doesNotThrow(()=>e.setOffset(value));assert.equal(e.offsetMs,0);e.setOffset(350);assert.doesNotThrow(()=>e.adjustOffset(value));assert.equal(e.offsetMs,350);}
 for(const [value,expected]of [['100.5',101],[-99.6,-100],[true,1],[null,0],[['12'],12]]){e.setOffset(value);assert.equal(e.offsetMs,expected);}
});
test('actual content-message boundary survives malformed numeric payloads and accepts the next valid action',async()=>{
 const {harness,settle}=require('./helpers/content-harness.cjs');const h=harness();await settle();
 for(const action of ['set_offset','adjust_offset','set_secondary_offset','adjust_secondary_offset'])assert.doesNotThrow(()=>h.send(action,{toString:null,valueOf:0}));
 h.send('set_offset',600);assert.equal(h.send('getStatus').offset,600);h.send('set_secondary_offset',-200);assert.equal(h.send('getStatus').secondaryOffset,-200);
});
test('storage schema discards corrupt objects while preserving independent valid values',()=>{
 const g=load('src/core/storage-guard.js').OTTSubStorageGuard;
 const clean=g.validateStorageSchema(JSON.parse('{"ottsub_offset":{"toString":null},"ottsub_primary_color":{},"ottsub_dual_mode":"false","ottsub_secondary_lang":"pt-PT","ottsub_secondary_offset":250,"__proto__":{"polluted":true}}'));
 assert.deepEqual(JSON.parse(JSON.stringify(clean)),{ottsub_secondary_lang:'pt-pt',ottsub_secondary_offset:250});assert.equal({}.polluted,undefined);
});
test('cancellation while a response body is pending prevents parsing and clears the deadline',async()=>{
 let release,parsed=0,calls=0,next=0;const timers=new Set();
 const w=load('src/network/track-fetcher.js',{URL,AbortController,setTimeout:()=>{timers.add(++next);return next;},clearTimeout:id=>timers.delete(id),fetch:async url=>{calls++;return {url,ok:true,status:200,text:()=>new Promise(resolve=>{release=resolve;})};}});
 w.OTTSubParser={parse:()=>{parsed++;return [{text:'stale'}];}};
 const c=new AbortController(),pending=w.OTTSubTrackFetcher.fetchTrackResult(['https://cdn.nflxvideo.net/test'],c.signal);
 for(let i=0;i<8;i++)await Promise.resolve();assert(release);c.abort();release('stale');const result=await pending;
 assert.equal(result.status,'cancelled');assert.equal(calls,1);assert.equal(parsed,0);assert.equal(timers.size,0);
});
test('cancellation during retry backoff stops further attempts and clears the retry timer',async()=>{
 let calls=0,next=0;const timers=new Map();
 const w=load('src/network/track-fetcher.js',{URL,AbortController,setTimeout:(fn,ms)=>{timers.set(++next,{fn,ms});return next;},clearTimeout:id=>timers.delete(id),fetch:async()=>{calls++;throw Error('offline');}});
 const c=new AbortController(),pending=w.OTTSubTrackFetcher.fetchTrackResult(['https://cdn.nflxvideo.net/test'],c.signal);
 for(let i=0;i<8;i++)await Promise.resolve();assert([...timers.values()].some(t=>t.ms<1000));c.abort();assert.equal((await pending).status,'cancelled');assert.equal(calls,1);assert.equal(timers.size,0);
});
