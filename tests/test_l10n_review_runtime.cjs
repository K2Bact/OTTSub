const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {loadInput,audit}=require('../scripts/audit-l10n.cjs');
const engine=process.env.OTTSUB_L10N_ENGINE||path.resolve(__dirname,'fixtures/l10n');
test('current UI and metadata pass the applicable shared gates and adopted OTTSub copy rules',async()=>{
 const result=await audit(loadInput(),engine);assert.equal(result.passed,true,JSON.stringify(result.results));
 assert.equal(result.locales.length,loadInput().requiredLocales.length);
});
const mutations=[
 ['French straight apostrophe','frenchTypography',input=>{input.dictionaries.fr.ui_language="Langue de l'interface";}],
 ['French breaking punctuation space','frenchTypography',input=>{input.dictionaries.fr.hud_sync_prefix='Synchro : valeur';}],
 ['French three-dot ellipsis','frenchTypography',input=>{input.dictionaries.fr.sub_status_loading='Chargement...';}],
 ['orphan dictionary','inventory',input=>{input.dictionaries.it={...input.dictionaries.en};}],
 ['orphan metadata','inventory',input=>{input.metadata.it=structuredClone(input.metadata.en);}],
 ['duplicate UI locale','inventory',input=>{input.requiredLocales.push('en');}],
 ['foreign script in actual UI','scripts',input=>{input.dictionaries.en.primary_lang_label+=' Я';}],
 ['foreign script in store metadata','metadataScripts',input=>{input.metadata.th.extName.message+=' Я';}],
 ['metadata-only false audit','ottSub',input=>{for(const locale of Object.keys(input.dictionaries))input.dictionaries[locale]={'messages.extName.message':'OTTSub'};}],
 ['missing Hindi locale','ottSub',input=>{delete input.dictionaries.hi;}],
 ['missing Hebrew locale','ottSub',input=>{delete input.dictionaries.he;}],
 ['missing Malay locale','ottSub',input=>{delete input.dictionaries.ms;}],
 ['missing Bengali locale','ottSub',input=>{delete input.dictionaries.bn;}],
 ['missing Turkish locale','ottSub',input=>{delete input.dictionaries.tr;}],
 ['missing Finnish locale','ottSub',input=>{delete input.dictionaries.fi;}],
 ['missing Thai locale','ottSub',input=>{delete input.dictionaries.th;}],
 ['missing Russian locale','ottSub',input=>{delete input.dictionaries.ru;}],
 ['missing Portuguese locale','ottSub',input=>{delete input.dictionaries['pt-PT'];}],
 ['missing Traditional Chinese locale','ottSub',input=>{delete input.dictionaries['zh-TW'];}],
 ['missing translation','completeness',input=>{delete input.dictionaries.hi.primary_lang_label;}],
 ['changed dynamic token','tokens',input=>{input.dictionaries.hi.sub_status_ready=input.dictionaries.hi.sub_status_ready.replace('{count}','{number}');}],
 ['Waiting Video','ottSub',input=>{input.dictionaries.en.status_waiting_video='Waiting Video';}],
 ['title case residue','ottSub',input=>{input.dictionaries.en.primary_status_label='Primary Subtitle Status';}],
 ['perfect subtitle claim','ottSub',input=>{input.dictionaries.ko.sub_status_ready_desc+=' 완벽';}],
 ['mixed Korean reset term','ottSub',input=>{input.dictionaries.ko.btn_reset='리셋';}],
 ['mixed technical decimal','ottSub',input=>{input.dictionaries.es.sync_slider_help='0,0 s';}],
 ['metadata over limit','ottSub',input=>{input.metadata.es.extDescription.message='x'.repeat(133);}],
 ['missing Hindi metadata','ottSub',input=>{delete input.metadata.hi;}],
 ['missing Hebrew metadata','ottSub',input=>{delete input.metadata.he;}],
 ['missing Malay metadata','ottSub',input=>{delete input.metadata.ms;}],
 ['missing Bengali metadata','ottSub',input=>{delete input.metadata.bn;}],
 ['missing Turkish metadata','ottSub',input=>{delete input.metadata.tr;}],
 ['missing Finnish metadata','ottSub',input=>{delete input.metadata.fi;}],
 ['missing Thai metadata','ottSub',input=>{delete input.metadata.th;}],
 ['missing Russian metadata','ottSub',input=>{delete input.metadata.ru;}],
 ['missing Portuguese metadata','ottSub',input=>{delete input.metadata['pt-PT'];}],
 ['missing Traditional Chinese metadata','ottSub',input=>{delete input.metadata['zh-TW'];}]
];
for(const [name,gate,mutate]of mutations)test(`mutation caught by intended gate: ${name}`,async()=>{
 const input=loadInput();mutate(input);const result=await audit(input,engine);assert.equal(result.passed,false);assert(result.results[gate].length>0,`${name}: intended ${gate} did not reject`);
});
test('script gate rejects foreign letters for every supported locale and keeps legitimate script extensions',async()=>{
 for(const locale of loadInput().requiredLocales){
  const input=loadInput();input.dictionaries[locale].status_waiting+=' Α';
  const result=await audit(input,engine);assert(result.results.scripts.some(v=>v.locale===locale));
 }
 const input=loadInput();input.dictionaries.ja.status_waiting+=' ー';input.dictionaries.ar.status_waiting+=' ـ';
 assert.equal((await audit(input,engine)).passed,true);
});
