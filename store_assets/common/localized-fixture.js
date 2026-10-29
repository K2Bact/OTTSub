// Screenshot-only simulated state. Served separately; excluded from the ZIP.
const {locale,languageName,manifest}=window.storePreview;
const slide=Number(new URLSearchParams(location.search).get('slide')||1);
const settings={ottsub_ui_lang:locale,ottsub_primary_lang:'en',ottsub_secondary_lang:locale,ottsub_dual_mode:true,
 ottsub_lock_pos:true,ottsub_lock_position:true,ottsub_offset:slide===2?-100:0,ottsub_secondary_offset:0,
 ottsub_sub_settings_collapsed:slide!==1,ottsub_lang_adjust_collapsed:true,ottsub_learning_collapsed:slide!==3,
 ottsub_shortcuts_collapsed:true,ottsub_blur_target:slide===3?'secondary':'none',ottsub_blur_mode:'blur_8',ottsub_hover_pause:true};
const tracks=[{bcp47:'en',language:'en',displayName:'English'},{bcp47:locale,language:locale,displayName:languageName}];
const status={ready:true,build:manifest.version,movieId:'100',blurTarget:settings.ottsub_blur_target,blurMode:'blur_8',hoverPause:true,
 offset:settings.ottsub_offset,secondaryOffset:0,hasCues:true,cueCount:120,hasSecondaryCues:true,secondaryCueCount:120,
 isDualMode:true,isPositionLocked:true,primaryLang:'en',primaryResolvedLang:'en',secondaryLang:locale,availableTracks:tracks,
 playbackState:'CONTENT',displaySuppressed:false};
const listeners=new Set();
const storage={get(_keys,callback){const result={...settings};if(callback)queueMicrotask(()=>callback(result));return Promise.resolve(result);},
 set(values,callback){const changes={};for(const [key,value]of Object.entries(values)){changes[key]={oldValue:settings[key],newValue:value};settings[key]=value;}
  if(callback)queueMicrotask(callback);queueMicrotask(()=>listeners.forEach(fn=>fn(changes,'local')));return Promise.resolve();}};
window.chrome={runtime:{id:'store-preview',getManifest:()=>manifest},storage:{local:storage,sync:storage,onChanged:{addListener:fn=>listeners.add(fn),removeListener:fn=>listeners.delete(fn)}},
 tabs:{query(_options,callback){queueMicrotask(()=>callback([{id:1,url:'https://www.netflix.com/watch/100'}]));},
  sendMessage(_id,message,callback){
   if(message.action==='set_offset')status.offset=message.value?.offsetMs??message.value;
   if(message.action==='set_secondary_offset')status.secondaryOffset=message.value?.offsetMs??message.value;
   if(callback)queueMicrotask(()=>callback({...status}));return Promise.resolve({...status});}},i18n:{getUILanguage:()=>locale}};
