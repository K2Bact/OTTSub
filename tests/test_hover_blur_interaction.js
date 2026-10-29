// T03: actual storage events and initial restore; CSS/real hover are covered in Chromium.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {harness,settle}=require('./helpers/content-harness.cjs');
for(const target of ['none','primary','secondary','both'])for(const mode of ['blur_4','blur_8','blur_14'])test(`restore ${target}/${mode} without writes`,async()=>{
 const h=harness({local:{ottsub_blur_target:target,ottsub_blur_mode:mode,ottsub_hover_pause:false}});await settle();
 assert.equal(h.send('getStatus').blurTarget,target);assert.deepEqual(h.renderer.setBlurModeValue,[mode]);assert.deepEqual(h.renderer.setHoverPauseValue,[false]);assert.equal(h.writes.length,0);
});
test('valid storage changes apply; malformed values and unrelated areas cannot change them',async()=>{
 const h=harness();await settle();h.emitStorage({ottsub_blur_target:{newValue:'both'},ottsub_blur_mode:{newValue:'blur_14'}});
 for(const value of ['hide','blur_999',null,{},42])h.emitStorage({ottsub_blur_target:{newValue:value},ottsub_blur_mode:{newValue:value},ottsub_hover_pause:{newValue:'false'}});
 h.emitStorage({ottsub_blur_target:{newValue:'none'}},'session');
 assert.equal(h.send('getStatus').blurTarget,'both');assert.equal(h.send('getStatus').blurMode,'blur_14');assert.equal(h.send('getStatus').hoverPause,true);assert.equal(h.writes.length,0);
});
test('late initial reads and sync echoes cannot undo a newer local choice',async()=>{
 const h=harness({local:{ottsub_blur_target:'primary',ottsub_blur_mode:'blur_4'},deferSettings:true});
 h.emitStorage({ottsub_blur_target:{newValue:'secondary'},ottsub_blur_mode:{newValue:'blur_14'}});
 for(const read of h.reads)read.cb(read.data);await settle();h.emitStorage({ottsub_blur_target:{newValue:'primary'}},'sync');
 assert.equal(h.send('getStatus').blurTarget,'secondary');assert.equal(h.send('getStatus').blurMode,'blur_14');
});
test('invalid initial values fall back, and disabling blur does not disable hover pause',async()=>{
 const h=harness({local:{ottsub_blur_target:'invalid',ottsub_blur_mode:'hide',ottsub_hover_pause:'false'}});await settle();
 assert.equal(h.send('getStatus').blurTarget,'none');assert.equal(h.send('getStatus').blurMode,'blur_8');assert.equal(h.send('getStatus').hoverPause,true);
});
