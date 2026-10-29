const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {injectHarness}=require('./helpers/inject-harness.cjs');
const root=path.resolve(__dirname,'..');
test('MAIN-world generated policy equals canonical policy; world URLs are distinct',()=>{
 const source=fs.readFileSync(path.join(root,'src/core/track-languages.js'),'utf8');
 assert.equal(fs.readFileSync(path.join(root,'src/track-languages-main.js'),'utf8').split('\n').slice(1).join('\n'),source);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 const main=manifest.content_scripts.find(g=>g.world==='MAIN').js,isolated=manifest.content_scripts.find(g=>g.world==='ISOLATED').js;
 assert.equal(main.some(p=>isolated.includes(p)),false);
});
function fixture(){const h=injectHarness();return {...h,policy:h.ctx.window.OTTSubTrackLanguages};}
const track=(bcp47,tag=bcp47)=>({bcp47,trackId:tag,ttDownloadables:{webvtt:{downloadUrls:{a:`https://cdn.nflxvideo.net/${tag}`}}}});
function manifest(h,movieId,tracks){h.parse(JSON.stringify({movieId,timedtexttracks:tracks}));return h.ctx.window.__OTT_SUB_MANIFEST_STORE__[movieId];}
test('exact Hans/Hant downloads stay separate in either manifest order, in generic and regional Chinese',()=>{
 for(const codes of [['zh-Hans','zh-Hant'],['zh-Hant','zh-Hans'],['zh-CN','zh-TW']]){
  const h=fixture(),m=manifest(h,100,codes.map(c=>track(c)));
  for(const [requested,expected] of [['zh-Hans',codes.find(c=>/Hans|CN/.test(c))],['zh-Hant',codes.find(c=>/Hant|TW/.test(c))]]){
   assert.deepEqual([...h.policy.urls(m,requested)],[`https://cdn.nflxvideo.net/${expected}`]);
  }
  assert.equal(m.tracksByLang.zh,undefined);
 }
});
test('unavailable traditional Chinese never falls back to simplified or ambiguous Chinese',()=>{
 const h=fixture();for(const code of ['zh-Hans','zh-CN','zh']){
  const m=manifest(h,100,[track(code)]);assert.deepEqual([...h.policy.urls(m,'zh-Hant')],[]);
 }
 const m=manifest(h,100,[track('zh-Hans'),{bcp47:'zh-Hant'}]);
 assert.deepEqual([...h.policy.urls(m,'zh-Hant')],[]);
});
test('a requested regional language does not silently load a different region',()=>{
 const h=fixture(),m=manifest(h,100,[track('es-ES')]);
 assert.deepEqual([...h.policy.urls(m,'es-419')],[]);assert.equal(h.policy.urls(m,'es').length,1);
});
test('invalid metadata is ignored; language-looking track IDs cannot invent supported languages',()=>{
 const h=fixture(),m=manifest(h,100,[track('zh-Hans','zh-Hant')]);
 assert.deepEqual([...h.policy.urls(m,'zh-Hant')],[]);
 assert.deepEqual([...h.policy.urls({availableTracks:[null,{},false],tracksByLang:{ko:['ko']}},'ko')],['ko']);
 for(const lang of ['__proto__','constructor','zh-Hant<script>',null])assert.deepEqual([...h.policy.urls(m,lang)],[]);
});
test('automatic chooses available English, otherwise first downloadable language; never infers original audio',()=>{
 const h=fixture();let m=manifest(h,100,[track('ja'),track('en-US')]);assert.match(m.urls[0],/en-US$/);
 m=manifest(h,100,[{bcp47:'en'},track('ko'),track('ja')]);assert.match(m.urls[0],/ko$/);
});
test('player enrichment joins the matching movie, not the first or ambiguous session',()=>{
 const h=fixture();let ids=['old','current'];
 const old={getMovieId:()=>99,getTimedTextTrackList:()=>[track('ja')]};
 const current={getMovieId:()=>100,getTimedTextTrackList:()=>[track('zh-Hant'),{...track('fr'),isForcedNarrative:true}]};
 h.ctx.window.netflix={appContext:{state:{playerApp:{getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>ids,getVideoPlayerBySessionId:id=>id==='old'?old:current}})}}}};
 let m=manifest(h,100,[track('en')]);assert.deepEqual(Array.from(m.availableTracks,t=>t.bcp47),['en','zh-Hant']);assert.match(h.policy.urls(m,'zh-Hant')[0],/Hant$/);
 m=manifest(h,200,[track('ko')]);assert.deepEqual(Array.from(m.availableTracks,t=>t.bcp47),['ko']);
 ids=['current','duplicate'];m=manifest(h,100,[track('en')]);assert.deepEqual(Array.from(m.availableTracks,t=>t.bcp47),['en']);
});
test('on-demand discovery cannot hydrate Hant from Hans and never switches Netflix selection',()=>{
 const h=fixture();let switches=0,tracks=[track('zh-Hans')];
 const player={getMovieId:()=>100,getTimedTextTrackList:()=>tracks,setTimedTextTrack:()=>switches++};
 h.ctx.window.netflix={appContext:{state:{playerApp:{getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['s'],getVideoPlayerBySessionId:()=>player}})}}}};
 manifest(h,100,[track('en')]);
 const request=()=>h.ctx.window.dispatchEvent(new CustomEvent('ottsub_request_load_track',{detail:{lang:'zh-Hant',movieId:'100'}}));
 request();assert.deepEqual([...h.policy.urls(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'],'zh-Hant')],[]);
 tracks.push(track('zh-Hant'));request();const m=h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'];assert.match(h.policy.urls(m,'zh-Hant')[0],/Hant$/);assert(m.availableTracks.some(t=>t.bcp47==='zh-Hant'));assert.equal(switches,0);
});
test('same language CC and ordinary tracks retain distinct identities and download URLs',()=>{
 const h=fixture();const cc={...track('en','cc'),rawTrackType:'closedcaptions'};
 const player={getMovieId:()=>100,getTimedTextTrackList:()=>[cc]};
 h.ctx.window.netflix={appContext:{state:{playerApp:{getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['s'],getVideoPlayerBySessionId:()=>player}})}}}};
 const m=manifest(h,100,[track('en','normal')]);assert.equal(m.availableTracks.length,2);
 assert.match(m.availableTracks[0].urls[0],/normal$/);assert.match(m.availableTracks[1].urls[0],/cc$/);
 assert.notEqual(m.availableTracks[0].identityTokens[0],m.availableTracks[1].identityTokens[0]);
});
function i18n(languages,uiLanguage){const ctx={window:{},navigator:{languages}};if(uiLanguage!==undefined)ctx.window.chrome={i18n:{getUILanguage:typeof uiLanguage==='function'?uiLanguage:()=>uiLanguage}};vm.runInNewContext(fs.readFileSync(path.join(root,'src/i18n.js'),'utf8').replace('const TRANSLATIONS =','const TRANSLATIONS = window.testTranslations ='),ctx);return ctx.window;}
test('all supported dictionaries have matching keys and interpolation parameters',()=>{
 const w=i18n(['ja-JP']),dicts=w.testTranslations,keys=Object.keys(dicts.en).sort();
 for(const [lang,dict] of Object.entries(dicts)){
  assert.deepEqual(Object.keys(dict).sort(),keys,lang);
  for(const key of keys)assert.deepEqual((dict[key].match(/\{\w+\}/g)||[]).sort(),(dicts.en[key].match(/\{\w+\}/g)||[]).sort(),`${lang}:${key}`);
 }
 assert.equal(w.OTTSubI18n.getLanguage(),'ja');assert.equal(w.OTTSubI18n.t('primary_lang_label'),'主字幕の言語');
 w.OTTSubI18n.setLanguage('ja-JP');assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'準備完了（23項目）');
});
test('Traditional Chinese UI retains its script and regional locale instead of stripping to zh',()=>{
 for(const code of ['zh-TW','zh-tw','ZH-tw','zh_TW','zh-Hant','zh-Hant-TW']){
  const w=i18n([code,'en']);assert.equal(w.OTTSubI18n.getLanguage(),'zh-TW',code);
  assert.equal(w.OTTSubI18n.t('primary_lang_label'),'主要字幕語言');
  assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'就緒（23 個片段）');
  assert.equal(w.OTTSubI18n.t('primary_lang_auto_resolved',{language:'繁體中文'},code),'自動（繁體中文）');
  w.OTTSubI18n.setLanguage('he');w.OTTSubI18n.setLanguage(code);assert.equal(w.OTTSubI18n.getLanguage(),'zh-TW');
  w.OTTSubPlatform={getOS:()=> 'mac'};assert.match(w.OTTSubI18n.t('shortcut_alt_sync'),/^Option \+/);
 }
 for(const unsupported of ['zh','zh-CN','zh-Hans','zh-Hans-TW'])assert.equal(i18n([unsupported,'en']).OTTSubI18n.getLanguage(),'en',unsupported);
 const w=i18n(['en']);w.OTTSubI18n.setLanguage('zh-Hans');assert.equal(w.OTTSubI18n.getLanguage(),'en');
 assert.equal(w.OTTSubI18n.t('primary_lang_label',{},'zh-tw'),'主要字幕語言');
 const h=fixture(),m=manifest(h,100,[track('zh-Hans'),track('zh-Hant')]);
 assert.deepEqual([...h.policy.urls(m,'zh-Hant')],['https://cdn.nflxvideo.net/zh-Hant']);
 assert.deepEqual([...h.policy.urls(manifest(h,100,[track('zh-Hans')]),'zh-Hant')],[]);
});
test('Portugal UI locale normalizes case and storage spelling without merging Brazilian subtitle identities',()=>{
 for(const code of ['pt-PT','pt-pt','PT-pt','pt_PT','pt-PT-u-nu-latn']){
  const w=i18n(['en'],code);assert.equal(w.OTTSubI18n.getLanguage(),'pt-PT',code);
  assert.equal(w.OTTSubI18n.t('primary_lang_label'),'Idioma das legendas principais');
  assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'Pronto (23 segmentos)');
  assert.equal(w.OTTSubI18n.t('primary_lang_auto_resolved',{language:'Português'}),'Automático (Português)');
  w.OTTSubI18n.setLanguage('he');w.OTTSubI18n.setLanguage(code);assert.equal(w.OTTSubI18n.getLanguage(),'pt-PT');
  w.OTTSubPlatform={getOS:()=> 'mac'};assert.match(w.OTTSubI18n.t('shortcut_alt_sync'),/^Option \+/);
 }
 for(const code of ['pt','pt-BR','pt_AO'])assert.equal(i18n(['en'],code).OTTSubI18n.resolveLanguage(code),null,code);
 assert.equal(i18n(['pt-PT','en'],'pt-BR').OTTSubI18n.getLanguage(),'pt-PT');
 assert.equal(i18n(['de-DE','en'],'pt-BR').OTTSubI18n.getLanguage(),'de');
 const h=fixture(),m=manifest(h,100,[track('pt-PT','portugal'),track('pt-BR','brazil')]);
 assert.match(h.policy.urls(m,'pt-pt')[0],/\/portugal$/);assert.match(h.policy.urls(m,'pt-br')[0],/\/brazil$/);
 assert.deepEqual([...h.policy.urls(manifest(h,100,[track('pt-BR','brazil')]),'pt-pt')],[]);
});

test('Browser UI language precedes content preferences, with safe unavailable API fallbacks',()=>{
 assert.equal(i18n(['en','de'],'ko-KR').OTTSubI18n.getLanguage(),'ko');
 assert.equal(i18n(['en'],'zh_TW').OTTSubI18n.getLanguage(),'zh-TW');
 assert.equal(i18n(['tr-TR','en'],'it-IT').OTTSubI18n.getLanguage(),'tr');
 assert.equal(i18n(['zh-Hans','en'],'zh-CN').OTTSubI18n.getLanguage(),'en');
 assert.equal(i18n(['bn-BD'],()=>{throw Error('API unavailable');}).OTTSubI18n.getLanguage(),'bn');
 assert.equal(i18n(['it-IT'],'it-IT').OTTSubI18n.getLanguage(),'en');
});
test('Thai UI normalizes browser and saved locales while exact subtitle identities stay separate',()=>{
 for(const code of ['th','th-TH','TH-th','th_TH']){
  const w=i18n(['en'],code);assert.equal(w.OTTSubI18n.getLanguage(),'th');
  assert.equal(w.OTTSubI18n.t('primary_lang_label'),'ภาษาหลัก');
  assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'พร้อม (23 ช่วง)');
  assert.equal(w.OTTSubI18n.t('primary_lang_auto_resolved',{language:'ไทย'}),'อัตโนมัติ (ไทย)');
  w.OTTSubI18n.setLanguage('he');w.OTTSubI18n.setLanguage(code);assert.equal(w.OTTSubI18n.getLanguage(),'th');
  w.OTTSubPlatform={getOS:()=> 'mac'};assert.match(w.OTTSubI18n.t('shortcut_alt_sync'),/^Option \+/);
 }
 assert.equal(i18n(['th-TH','en']).OTTSubI18n.getLanguage(),'th');
 assert.equal(i18n(['th-TH','en'],'de-DE').OTTSubI18n.getLanguage(),'de');
 for(const code of ['lo','km','my'])assert.equal(i18n([code,'en']).OTTSubI18n.getLanguage(),'en');
 const h=fixture(),m=manifest(h,100,[track('th','generic'),track('th-TH','thailand'),track('th-Latn','latin')]);
 assert.match(h.policy.urls(m,'th-th')[0],/\/thailand$/);assert.match(h.policy.urls(m,'th-latn')[0],/\/latin$/);
 assert.deepEqual([...h.policy.urls(manifest(h,100,[track('th','generic')]),'th-th')],[]);
});

test('Russian UI detects regional and stored spellings without changing subtitle track identity',()=>{
 for(const code of ['ru','ru-RU','RU-ru','ru_RU','ru-UA','ru-KZ']){
  const w=i18n(['en'],code);assert.equal(w.OTTSubI18n.getLanguage(),'ru',code);
  assert.equal(w.OTTSubI18n.t('primary_lang_label'),'Основной язык');
  assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'Готово (23 фрагм.)');
  assert.equal(w.OTTSubI18n.t('primary_lang_auto_resolved',{language:'Русский'}),'Авто (Русский)');
  w.OTTSubI18n.setLanguage('he');w.OTTSubI18n.setLanguage(code);assert.equal(w.OTTSubI18n.getLanguage(),'ru');
  w.OTTSubPlatform={getOS:()=> 'mac'};assert.match(w.OTTSubI18n.t('shortcut_alt_sync'),/^Option \+/);
 }
 assert.equal(i18n(['ru-RU','en']).OTTSubI18n.getLanguage(),'ru');
 assert.equal(i18n(['ru-RU','en'],'de-DE').OTTSubI18n.getLanguage(),'de');
 assert.equal(i18n(['uk-UA','en']).OTTSubI18n.getLanguage(),'en');
 const h=fixture(),m=manifest(h,100,[track('ru','generic'),track('ru-RU','russia'),track('ru-UA','ukraine')]);
 assert.match(h.policy.urls(m,'ru-ru')[0],/\/russia$/);assert.match(h.policy.urls(m,'ru-ua')[0],/\/ukraine$/);
 assert.deepEqual([...h.policy.urls(manifest(h,100,[track('ru-UA','ukraine')]),'ru-ru')],[]);
});
test('Turkish browser preferences preserve dotted letters and exact subtitle identities',()=>{
 for(const languages of [['tr-TR','en'],['tr'],['TR-tr'],['xx','tr-CY','en']]){
  const w=i18n(languages);assert.equal(w.OTTSubI18n.getLanguage(),'tr');
  assert.equal(w.OTTSubI18n.t('primary_lang_label'),'Ana alt yazı dili');
  assert.equal(w.OTTSubI18n.t('secondary_lang_label'),'İkinci alt yazı dili');
  assert.equal(w.OTTSubI18n.t('color_yellow'),'Sarı');
  assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'Hazır (23 öğe)');
  assert.equal(w.OTTSubI18n.t('primary_lang_auto_resolved',{language:'Türkçe'}),'Otomatik (Türkçe)');
  w.OTTSubPlatform={getOS:()=> 'mac'};assert.match(w.OTTSubI18n.t('shortcut_alt_sync'),/^Option \+/);
  w.OTTSubI18n.setLanguage('ar');w.OTTSubI18n.setLanguage('tr-TR');assert.equal(w.OTTSubI18n.getLanguage(),'tr');
 }
 assert.equal(i18n(['en','tr-TR']).OTTSubI18n.getLanguage(),'en');
 assert.equal(i18n(['az','en']).OTTSubI18n.getLanguage(),'en');
 const h=fixture(),m=manifest(h,100,[track('tr','turkish'),track('tr-TR','turkiye')]);
 assert.match(h.policy.urls(m,'tr')[0],/\/turkish$/);assert.match(h.policy.urls(m,'tr-tr')[0],/\/turkiye$/);
 assert.deepEqual([...h.policy.urls(manifest(h,100,[track('tr','turkish')]),'tr-tr')],[]);
});
test('Bengali preferences detect Bangladesh and India without merging subtitle identities',()=>{
 for(const languages of [['bn-BD','en'],['bn'],['BN-bd'],['xx','bn-IN','en']]){
  const w=i18n(languages);assert.equal(w.OTTSubI18n.getLanguage(),'bn');
  assert.equal(w.OTTSubI18n.t('primary_lang_label'),'প্রধান ভাষা');
  assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'প্রস্তুত (23 অংশ)');
  assert.equal(w.OTTSubI18n.t('primary_lang_auto_resolved',{language:'বাংলা'}),'স্বয়ংক্রিয় (বাংলা)');
  w.OTTSubPlatform={getOS:()=> 'mac'};assert.match(w.OTTSubI18n.t('shortcut_alt_sync'),/^Option \+/);
  w.OTTSubI18n.setLanguage('he');w.OTTSubI18n.setLanguage('bn-BD');assert.equal(w.OTTSubI18n.getLanguage(),'bn');
 }
 assert.equal(i18n(['en','bn-BD']).OTTSubI18n.getLanguage(),'en');
 const h=fixture(),m=manifest(h,100,[track('bn','bengali'),track('bn-BD','bangladesh')]);
 assert.match(h.policy.urls(m,'bn')[0],/\/bengali$/);assert.match(h.policy.urls(m,'bn-bd')[0],/\/bangladesh$/);
 assert.deepEqual([...h.policy.urls(manifest(h,100,[track('bn','bengali')]),'bn-bd')],[]);
});

test('Malay browser preferences detect ms-MY, retain preference order and translate dynamic UI',()=>{
 for(const languages of [['ms-MY','en'],['ms'],['MS-my'],['xx','ms-MY','en']]){
  const w=i18n(languages);assert.equal(w.OTTSubI18n.getLanguage(),'ms');
  assert.equal(w.OTTSubI18n.t('primary_lang_label'),'Bahasa utama');
  assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'Sedia (23 segmen)');
  assert.equal(w.OTTSubI18n.t('primary_lang_auto_resolved',{language:'Melayu'}),'Automatik (Melayu)');
  w.OTTSubPlatform={getOS:()=> 'mac'};assert.match(w.OTTSubI18n.t('shortcut_alt_sync'),/^Option \+/);
  w.OTTSubI18n.setLanguage('he');w.OTTSubI18n.setLanguage('ms-MY');assert.equal(w.OTTSubI18n.getLanguage(),'ms');
 }
 assert.equal(i18n(['en','ms-MY']).OTTSubI18n.getLanguage(),'en');
});

test('Israeli browser preference detects Hebrew and translates status, types and shortcuts',()=>{
 const w=i18n(['he-IL','en']);assert.equal(w.OTTSubI18n.getLanguage(),'he');
 assert.equal(w.OTTSubI18n.t('primary_lang_label'),'שפה ראשית');
 assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'מוכן (23 מקטעים)');
 assert.equal(w.OTTSubI18n.t('primary_lang_auto_resolved',{language:'עברית'}),'אוטומטי (עברית)');
 assert.equal(w.OTTSubI18n.t('track_kind_cc'),'CC (תיאורי צלילים)');
 w.OTTSubPlatform={getOS:()=> 'mac'};
 assert.match(w.OTTSubI18n.t('shortcut_alt_sync'),/^Option \+/);
 w.OTTSubI18n.setLanguage('he-IL');assert.equal(w.OTTSubI18n.getLanguage(),'he');
});

test('Jordan browser locale selects standard Arabic and interpolates counts',()=>{
 const w=i18n(['ar-JO','en']);assert.equal(w.OTTSubI18n.getLanguage(),'ar');
 assert.equal(w.OTTSubI18n.t('primary_lang_label'),'اللغة الأساسية');
 assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'جاهزة (23 مقطع ترجمة)');
 w.OTTSubI18n.setLanguage('en');assert.equal(w.OTTSubI18n.getLanguage(),'en');
});

test('Indian Hindi locale selects Hindi menus and keeps exact Hindi subtitle codes',()=>{
 const w=i18n(['hi-IN','en']);assert.equal(w.OTTSubI18n.getLanguage(),'hi');
 assert.equal(w.OTTSubI18n.t('primary_lang_label'),'मुख्य भाषा');
 assert.equal(w.OTTSubI18n.t('lang_hi'),'हिन्दी');
 assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'तैयार (23 प्रविष्टियाँ)');
 const h=fixture(),m=manifest(h,100,[track('hi','hindi'),track('hi-IN','indian-hindi')]);
 assert.match(h.policy.urls(m,'hi')[0],/\/hindi$/);
 assert.match(h.policy.urls(m,'hi-in')[0],/\/indian-hindi$/);
 assert.deepEqual([...h.policy.urls(manifest(h,100,[track('hi','hindi')]),'hi-in')],[]);
});
test('player regional code reuses manifest download only for the same exact track identity',()=>{
 for(const sameIdentity of [true,false]){
  const h=fixture(),apiTrack={bcp47:'es-ES',trackId:sameIdentity?'spanish':'different'};
  const player={getMovieId:()=>100,getTimedTextTrackList:()=>[apiTrack]};
  h.ctx.window.netflix={appContext:{state:{playerApp:{getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['s'],getVideoPlayerBySessionId:()=>player}})}}}};
  const m=manifest(h,100,[track('es','spanish')]);
  const urls=[...h.policy.urls(m,'es-es')];
  assert.deepEqual(urls,sameIdentity?['https://cdn.nflxvideo.net/spanish']:[]);
  if(sameIdentity)assert.equal(m.availableTracks.length,1,'identity join must not create ambiguous native references');
 }
});
test('read-only discovery joins late player metadata to cached manifest URLs',()=>{
 const h=fixture();manifest(h,100,[track('es','spanish')]);
 const player={getMovieId:()=>100,getTimedTextTrackList:()=>[{bcp47:'es-ES',trackId:'spanish'}]};
 h.ctx.window.netflix={appContext:{state:{playerApp:{getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>['s'],getVideoPlayerBySessionId:()=>player}})}}}};
 h.ctx.window.dispatchEvent(new CustomEvent('ottsub_request_load_track',{detail:{lang:'es-es',movieId:'100'}}));
 assert.deepEqual([...h.policy.urls(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'],'es-es')],['https://cdn.nflxvideo.net/spanish']);
});

test('alternate player app path discovers exact regional metadata without changing requests or selection',()=>{
 for(const mode of ['absent','throwing','empty']){
  const h=fixture(),raw=JSON.stringify({movieId:100,timedtexttracks:[track('es','spanish')]});h.parse(raw);
  let setters=0,otherReads=0;
  const current={getMovieId:()=>100,getTimedTextTrackList:()=>[{bcp47:'es-ES',trackId:'spanish'}],setTimedTextTrack:()=>setters++};
  const old={getMovieId:()=>99,getTimedTextTrackList:()=>{otherReads++;return[track('ja')];}};
  const videoPlayer={getAllPlayerSessionIds:()=>['old','current'],getVideoPlayerBySessionId:id=>id==='old'?old:current};
  const state=mode==='absent'?undefined:{playerApp:{getAPI:()=>{if(mode==='throwing')throw Error('state unavailable');return{};}}};
  h.ctx.window.netflix={appContext:{state,getPlayerApp:()=>({getAPI:()=>({videoPlayer})})}};
  h.ctx.window.dispatchEvent(new CustomEvent('ottsub_request_load_track',{detail:{lang:'es-es',movieId:'100'}}));
  assert.deepEqual([...h.policy.urls(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'],'es-es')],['https://cdn.nflxvideo.net/spanish'],mode);
  assert.equal(setters,0);assert.equal(otherReads,0);assert.equal(h.calls.length,0);
  const parsed=h.parse(raw);assert.equal(JSON.stringify(parsed),raw);
  assert.deepEqual([...h.policy.urls(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'],'es-es')],['https://cdn.nflxvideo.net/spanish']);
 }
});

test('alternate app discovery rejects ambiguous, mismatched, forced and URL-less regional tracks',()=>{
 for(const mode of ['ambiguous','wrong-movie','wrong-region','no-url','forced']){
  const h=fixture();manifest(h,100,[track('en')]);const before=JSON.stringify(h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100']);
  const pt=mode==='no-url'?{bcp47:'es-ES'}:track(mode==='wrong-region'?'es-419':'es-ES');
  if(mode==='forced')pt.isForcedNarrative=true;
  const player={getMovieId:()=>mode==='wrong-movie'?200:100,getTimedTextTrackList:()=>[pt]};
  h.ctx.window.netflix={appContext:{getPlayerApp:()=>({getAPI:()=>({videoPlayer:{getAllPlayerSessionIds:()=>mode==='ambiguous'?['a','b']:['a'],getVideoPlayerBySessionId:()=>player}})})}};
  h.ctx.window.dispatchEvent(new CustomEvent('ottsub_request_load_track',{detail:{lang:'es-es',movieId:'100'}}));
  const cached=h.ctx.window.__OTT_SUB_MANIFEST_STORE__['100'];assert.deepEqual([...h.policy.urls(cached,'es-es')],[],mode);
  if(['ambiguous','wrong-movie','forced'].includes(mode))assert.equal(JSON.stringify(cached),before);
 }
});
test('readiness uses timed-entry units in all seven languages',()=>{
 const w=i18n(['en']);for(const [lang,unit] of [['ko','묶음'],['en','cues'],['es','segmentos'],['de','Einträge'],['ja','項目'],['ar','مقطع ترجمة'],['hi','प्रविष्टियाँ']]){
  for(const key of ['sub_status_ready','secondary_status_ready','sub_status_ready_desc','secondary_status_ready_desc','hud_primary_ready'])assert(w.OTTSubI18n.t(key,{count:123},lang).includes(unit),`${lang}:${key}`);
 }
});
test('browser language honors priority including English before Japanese/Korean',()=>{
 for(const [languages,expected] of [[['en-US','ja-JP'],'en'],[['ja-JP','en-US'],'ja'],[['it','de-DE'],'de'],[['x-ko','en'],'en']])assert.equal(i18n(languages).OTTSubI18n.getLanguage(),expected);
});

test('Finnish UI normalizes regional spellings without merging subtitle track identities',()=>{
 for(const code of ['fi','fi-FI','FI-fi','fi_FI','fi-SE']){
  const w=i18n(['en'],code);assert.equal(w.OTTSubI18n.getLanguage(),'fi',code);
  assert.equal(w.OTTSubI18n.t('primary_lang_label'),'Ensisijainen kieli');
  assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'Valmis (osioita: 23)');
  assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:1}),'Valmis (osioita: 1)');
  w.OTTSubI18n.setLanguage('he');w.OTTSubI18n.setLanguage(code);assert.equal(w.OTTSubI18n.getLanguage(),'fi');
  w.OTTSubPlatform={getOS:()=> 'mac'};assert.match(w.OTTSubI18n.t('shortcut_alt_sync'),/^Option \+/);
 }
 assert.equal(i18n(['fi-FI','en']).OTTSubI18n.getLanguage(),'fi');
 assert.equal(i18n(['fi-FI','en'],'de-DE').OTTSubI18n.getLanguage(),'de');
 for(const other of ['sv','et','se','smn'])assert.equal(i18n(['en'],other).OTTSubI18n.getLanguage(),'en',other);
 const h=fixture(),m=manifest(h,100,[track('fi','generic'),track('fi-FI','finland'),track('fi-SE','sweden')]);
 assert.match(h.policy.urls(m,'fi-fi')[0],/\/finland$/);assert.match(h.policy.urls(m,'fi-se')[0],/\/sweden$/);
 assert.deepEqual([...h.policy.urls(manifest(h,100,[track('fi-SE','sweden')]),'fi-fi')],[]);
});


test('French regional UI detection never merges France/Canada subtitle identities',()=>{
 for(const code of ['fr','fr-FR','fr_CA','FR-be','fr-CH']){
  const w=i18n(['en'],code);assert.equal(w.OTTSubI18n.getLanguage(),'fr',code);
  assert.equal(w.OTTSubI18n.t('primary_lang_label'),'Langue principale');
  assert.equal(w.OTTSubI18n.t('sub_status_ready',{count:23}),'Prêts (23 segments)');
  w.OTTSubI18n.setLanguage('he');w.OTTSubI18n.setLanguage(code);assert.equal(w.OTTSubI18n.getLanguage(),'fr');
  w.OTTSubPlatform={getOS:()=> 'mac'};assert.match(w.OTTSubI18n.t('shortcut_alt_sync'),/^Option \+/);
 }
 assert.equal(i18n(['en'],'fr-FR').OTTSubI18n.getLanguage(),'fr');
 assert.equal(i18n(['fr-CA','en'],'de-DE').OTTSubI18n.getLanguage(),'de');
 for(const code of ['it-IT','nl-NL','ca-ES'])assert.equal(i18n([code,'en']).OTTSubI18n.getLanguage(),'en');
 const h=fixture(),m=manifest(h,100,[track('fr-FR','france'),track('fr-CA','canada')]);
 assert.match(h.policy.urls(m,'fr-fr')[0],/\/france$/);assert.match(h.policy.urls(m,'fr-ca')[0],/\/canada$/);
 assert.deepEqual([...h.policy.urls(manifest(h,100,[track('fr-CA','canada')]),'fr-fr')],[]);
});
