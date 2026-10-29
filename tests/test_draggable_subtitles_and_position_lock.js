// T02: exercise the current content message/storage contract, not source syntax.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {harness,settle}=require('./helpers/content-harness.cjs');
const saved=h=>Object.assign({},...h.writes.filter(w=>w.area==='local').map(w=>w.value));
test('position command validates, clamps, applies and saves both coordinates',async()=>{
 const h=harness();await settle();h.send('set_custom_position',null,{x:90,y:-12.36});
 assert.deepEqual(h.renderer.setCustomPositionValue,[45,-12.36]);assert.equal(saved(h).ottsub_custom_pos_x,45);assert.equal(saved(h).ottsub_custom_pos_y,-12.36);
 const before=h.writes.length;h.send('set_custom_position',null,{x:'bad',y:2});assert.equal(h.writes.length,before);
});
test('drag/reset renderer callback is connected to durable settings; reset message reaches renderer',async()=>{
 const h=harness();await settle();assert.equal(typeof h.renderer.onPositionChangeCallback,'function');
 h.renderer.onPositionChangeCallback(12.3,-8);assert.equal(saved(h).ottsub_custom_pos_x,12.3);
 h.send('reset_custom_position');assert.deepEqual(h.renderer.resetCustomPositionValue,[true]);
 // I/O spy emits the real renderer callback; the Chromium suite checks the actual reset and drag.
 h.renderer.onPositionChangeCallback(0,0);assert.equal(saved(h).ottsub_custom_pos_x,0);assert.equal(saved(h).ottsub_custom_pos_y,0);
});
test('reload and one-axis storage updates retain the other coordinate without feedback writes',async()=>{
 const h=harness({local:{ottsub_custom_pos_x:12,ottsub_custom_pos_y:-8}});await settle();assert.deepEqual(h.renderer.setCustomPositionValue,[12,-8]);
 h.emitStorage({ottsub_custom_pos_x:{newValue:20}});assert.deepEqual(h.renderer.setCustomPositionValue,[20,-8]);assert.equal(h.writes.length,0);
 h.emitStorage({ottsub_custom_pos_x:{newValue:5}},'sync');assert.deepEqual(h.renderer.setCustomPositionValue,[20,-8]);
});
test('lock message, saved lock and storage updates agree',async()=>{
 const h=harness({local:{ottsub_lock_pos:true}});await settle();assert.equal(h.send('getStatus').isPositionLocked,true);
 h.send('set_lock_pos',false);assert.deepEqual(h.renderer.setLockPositionValue,[false]);assert.equal(saved(h).ottsub_lock_pos,false);
 h.emitStorage({ottsub_lock_pos:{newValue:true}});assert.deepEqual(h.renderer.setLockPositionValue,[true]);
});

test('legacy background settings restore both languages; explicit per-language values take priority',async()=>{
 const h=harness({local:{ottsub_bg_box_enabled:true}});await settle();
 assert.equal(h.send('getStatus').primaryBgBox,true);assert.equal(h.send('getStatus').secondaryBgBox,true);
 const newer=harness({local:{ottsub_bg_box_enabled:true,ottsub_primary_bg_box:false,ottsub_secondary_bg_box:true}});await settle();
 assert.equal(newer.send('getStatus').primaryBgBox,false);assert.equal(newer.send('getStatus').secondaryBgBox,true);
});

test('common and individual background changes persist the same state after reload and storage echoes',async()=>{
 const h=harness({local:{ottsub_primary_bg_box:false,ottsub_secondary_bg_box:false}});await settle();
 for(const [action,value,expected] of [['set_bg_box',true,[true,true]],['set_primary_bg_box',false,[false,true]],['set_bg_box',false,[false,false]]]){
  h.send(action,value);
  const state=saved(h);
  // Chrome delivers local/sync notifications after the original command.
  h.emitStorage(Object.fromEntries(Object.entries(state).map(([k,v])=>[k,{newValue:v}])));
  const reloaded=harness({local:state});await settle();
  for(const instance of [h,reloaded]) assert.deepEqual([instance.send('getStatus').primaryBgBox,instance.send('getStatus').secondaryBgBox],expected);
 }
 const before=h.writes.length;h.send('set_bg_box','false');assert.equal(h.writes.length,before);
});
