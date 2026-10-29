const {supportedUILocales}=require('./helpers/ui-locales.cjs');
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const platform=fs.readFileSync(path.join(root,'src/core/platform.js'),'utf8');
const router=fs.readFileSync(path.join(root,'src/input/keyboard-router.js'),'utf8');
const content=fs.readFileSync(path.join(root,'src/content.js'),'utf8');
const start=content.indexOf("  document.addEventListener('keydown', (event) => {");
const listener=content.slice(start,content.indexOf('  }, true);',start)+12);
function setup(nav,chrome={}){
 const labels=Array.from({length:6},()=>({textContent:''})),document={readyState:'complete',activeElement:null,querySelectorAll:selector=>selector==='[data-shortcut-modifier]'?labels:[],addEventListener(_name,fn){this.handler=fn;}};
 const ctx=vm.createContext({navigator:nav,chrome,document,isEditableElement:()=>false,getDeepActiveElement:()=>document.activeElement});ctx.window=ctx;
 vm.runInContext(platform,ctx);vm.runInContext(router,ctx);vm.runInContext(listener,ctx);
 const actions=[];ctx.OTTSubKeyboardRouter.registerActionHandler((action,delta)=>actions.push({action,delta}));
 return {ctx,labels,document,actions};
}
function press(state,code,extra={}){
 let prevented=0,stopped=0;
 const e={code,altKey:false,ctrlKey:false,metaKey:false,shiftKey:false,repeat:false,isComposing:false,keyCode:0,getModifierState:()=>false,preventDefault:()=>prevented++,stopImmediatePropagation:()=>stopped++,...extra};
 state.document.handler(e);return {prevented,stopped};
}
for(const [os,nav,label] of [['mac',{userAgentData:{platform:'macOS'}},'Option'],['win',{userAgentData:{platform:'Windows'}},'Alt'],['mac',{platform:'MacIntel'},'Option'],['other',{platform:'Linux x86_64'},'Alt'],['unknown',{platform:'iPad'},'Alt']])test(`local platform ${JSON.stringify(nav)} yields ${label}`,()=>{
 const s=setup(nav);assert.equal(s.ctx.OTTSubPlatform.getOS(),os);assert(s.labels.every(el=>el.textContent===label));
});
test('Chrome platform overrides navigator, updates labels asynchronously and is not stored',()=>{
 let complete;const s=setup({platform:'Win32'},{runtime:{getPlatformInfo:fn=>complete=fn}});
 assert.equal(s.labels[0].textContent,'Alt');complete({os:'mac'});assert.equal(s.ctx.OTTSubPlatform.getOS(),'mac');assert(s.labels.every(el=>el.textContent==='Option'));
});
test('unavailable, throwing and failed platform lookup keep fallback',()=>{
 for(const runtime of [{getPlatformInfo(){throw Error('invalidated');}},{lastError:{message:'failed'},getPlatformInfo:cb=>cb({os:'win'})}])assert.equal(setup({platform:'MacIntel'},{runtime}).ctx.OTTSubPlatform.getOS(),'mac');
});
for(const os of ['MacIntel','Win32'])test(`${os} routes primary and secondary sync/reset plus all toggles`,()=>{
 const s=setup({platform:os});
 const expected=[['BracketLeft',false,'adjust_primary_sync',-100],['BracketRight',false,'adjust_primary_sync',100],['Backslash',false,'reset_primary_sync',0],['BracketLeft',true,'adjust_secondary_sync',-100],['BracketRight',true,'adjust_secondary_sync',100],['Backslash',true,'reset_secondary_sync',0],['KeyD',true,'toggle_dual',0],['KeyB',true,'toggle_blur',0],['KeyL',true,'toggle_lock_pos',0],['KeyR',true,'reset_pos',0]];
 for(const [code,altKey,action,delta]of expected){assert.deepEqual(press(s,code,{altKey}),{prevented:1,stopped:1});assert.deepEqual(s.actions.at(-1),{action,delta});}
});
for(const os of ['MacIntel','Win32'])test(`${os} preserves Command/Ctrl/Shift/AltGr/IME including blur pre-handler`,()=>{
 const s=setup({platform:os});
 for(const code of ['BracketLeft','BracketRight','Backslash','KeyD','KeyB','KeyL','KeyR'])for(const modifier of [{metaKey:true},{ctrlKey:true},{shiftKey:true},{isComposing:true},{keyCode:229},{getModifierState:k=>k==='AltGraph'}]){
  assert.deepEqual(press(s,code,{altKey:true,...modifier}),{prevented:0,stopped:0});
 }
 assert.equal(s.actions.length,0);
 for(const code of ['KeyD','KeyS','KeyP','KeyQ','KeyL'])assert.deepEqual(press(s,code,{ctrlKey:true,altKey:true,shiftKey:true}),{prevented:0,stopped:0});
});
test('editable shadow inputs and repeat toggles remain protected; sync can repeat',()=>{
 const s=setup({platform:'MacIntel'});s.document.activeElement={shadowRoot:{activeElement:{tagName:'INPUT'}}};
 assert.deepEqual(press(s,'BracketLeft'),{prevented:0,stopped:0});s.document.activeElement=null;
 for(const code of ['KeyD','KeyB','KeyL','KeyR','Backslash'])assert.deepEqual(press(s,code,{altKey:true,repeat:true}),{prevented:0,stopped:0});
 assert.deepEqual(press(s,'BracketRight',{repeat:true}),{prevented:1,stopped:1});assert.equal(s.actions.length,1);
});


// Exercise the real content handler, engines and translations together.
const {harness,settle}=require('./helpers/content-harness.cjs');
for(const lang of supportedUILocales())test(`${lang} actual shortcut handlers announce offsets, reset, lock and blur without raw keys`,async()=>{
 const messages=[];
 const h=harness({local:{ottsub_ui_lang:lang},beforeContent({window,load}){
  load('src/i18n.js');load('src/input/keyboard-router.js');
  window.OTTSubHUD.show=message=>messages.push(message);
 }});
 await settle();
 const t=(key,params={})=>h.window.OTTSubI18n.t(key,params,lang);
 const key=(code,altKey=false)=>{
  const event=new Event('keydown',{cancelable:true});
  Object.assign(event,{code,altKey,ctrlKey:false,metaKey:false,shiftKey:false,repeat:false,isComposing:false,keyCode:0,getModifierState:()=>false});
  h.document.dispatchEvent(event);assert(event.defaultPrevented);
 };
 key('BracketRight');
 assert.equal(h.send('getStatus').offset,100);
 assert.equal(messages.at(-1),`${t('hud_sync_prefix_primary')}: 0.1s`);
 key('BracketRight',true);
 assert.equal(h.send('getStatus').secondaryOffset,100);
 assert.equal(messages.at(-1),`${t('hud_sync_prefix_secondary')}: 0.1s`);
 key('Backslash');key('Backslash',true);
 assert.equal(h.send('getStatus').offset,0);assert.equal(h.send('getStatus').secondaryOffset,0);
 assert.equal(messages.at(-1),`${t('hud_sync_prefix_secondary')}: 0.0s`);
 key('KeyL',true);assert.equal(messages.at(-1),t('hud_lock_pos_on'));
 key('KeyL',true);assert.equal(messages.at(-1),t('hud_lock_pos_off'));
 key('KeyB',true);assert.equal(messages.at(-1),t('hud_blur_on',{mode:t('blur_mode_blur_8')}));
 key('KeyB',true);assert.equal(messages.at(-1),t('hud_blur_off'));
 assert(messages.every(message=>!(/hud_[a-z_]+|\{mode\}/.test(message))));
});


test('popup offset objects and legacy numeric commands update independent real engines',async()=>{
 const h=harness();await settle();
 h.send('set_offset',{offsetMs:300});assert.equal(h.send('getStatus').offset,300);
 h.send('adjust_offset',{deltaMs:100});assert.equal(h.send('getStatus').offset,400);
 h.send('set_secondary_offset',{offsetMs:-200});assert.equal(h.send('getStatus').secondaryOffset,-200);
 h.send('adjust_secondary_offset',{deltaMs:-100});assert.equal(h.send('getStatus').secondaryOffset,-300);
 assert.equal(h.send('getStatus').offset,400);
 h.send('set_offset',-500);h.send('adjust_offset',100);assert.equal(h.send('getStatus').offset,-400);
 h.send('set_secondary_offset',600);h.send('adjust_secondary_offset',100);assert.equal(h.send('getStatus').secondaryOffset,700);
});
