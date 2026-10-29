const {test}=require('node:test'),assert=require('node:assert/strict');
const {harness,settle}=require('./helpers/content-harness.cjs');

async function fixture(){
 const h=harness();await settle();h.emitManifest(100);await settle();
 h.media={pauses:0,plays:0};
 h.video.pause=()=>{h.media.pauses++;h.video.paused=true;h.video.dispatchEvent(new Event('pause'));};
 h.video.play=()=>{h.media.plays++;h.video.paused=false;h.video.dispatchEvent(new Event('play'));return Promise.resolve();};
 h.video.paused=false;
 h.flushHover=()=>{for(const [id,t]of [...h.timers])if(t.ms===80){h.timers.delete(id);t.fn();}};
 return h;
}

test('disabling hover pause releases only a pause owned by the extension',async()=>{
 const h=await fixture();h.renderer.onSubtitleHoverChange(true,'primary');h.flushHover();assert.equal(h.media.pauses,1);
 h.emitStorage({ottsub_hover_pause:{newValue:false}});h.renderer.onSubtitleHoverChange(false,'primary');h.flushHover();
 assert.equal(h.media.plays,1);assert.equal(h.video.paused,false);assert.equal(h.send('getStatus').hoverPause,false);
});
test('disabling hover pause cancels a pending enter debounce',async()=>{
 const h=await fixture();h.renderer.onSubtitleHoverChange(true,'primary');
 h.emitStorage({ottsub_hover_pause:{newValue:false}});h.flushHover();assert.equal(h.media.pauses,0);assert.equal(h.media.plays,0);
});
test('disabling hover pause never starts a video that the user already paused',async()=>{
 const h=await fixture();h.video.paused=true;h.renderer.onSubtitleHoverChange(true,'secondary');h.flushHover();
 h.emitStorage({ottsub_hover_pause:{newValue:false}});h.flushHover();assert.equal(h.media.plays,0);assert.equal(h.video.paused,true);
});
test('disabling hover pause after leaving the episode never restarts the old video',async()=>{
 const h=await fixture();h.renderer.onSubtitleHoverChange(true,'primary');h.flushHover();assert.equal(h.media.pauses,1);
 h.navigate(null);h.tick();h.emitStorage({ottsub_hover_pause:{newValue:false}});h.flushHover();assert.equal(h.media.plays,0);
});
test('a stale enter callback cannot pause after hover pause was disabled',async()=>{
 const h=await fixture();h.renderer.onSubtitleHoverChange(true,'primary');
 const queued=[...h.timers.values()].find(t=>t.ms===80).fn;
 h.emitStorage({ottsub_hover_pause:{newValue:false}});queued();assert.equal(h.media.pauses,0);
});
test('disabling hover pause on a hidden page revokes ownership without autoplay',async()=>{
 const h=await fixture();h.renderer.onSubtitleHoverChange(true,'primary');h.flushHover();h.document.hidden=true;
 h.emitStorage({ottsub_hover_pause:{newValue:false}});h.flushHover();assert.equal(h.media.plays,0);
});
