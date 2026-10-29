// Read the actual UI dictionary and metadata using pinned shared validation gates.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
function loadInput() {
 const context={window:{},navigator:{languages:['en']}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'src/i18n.js'),'utf8').replace('const TRANSLATIONS =','const TRANSLATIONS = window.dictionaries ='),context);
 const metadata=Object.fromEntries(fs.readdirSync(path.join(root,'_locales')).map(locale=>[locale.replaceAll('_','-'),JSON.parse(fs.readFileSync(path.join(root,'_locales',locale,'messages.json'),'utf8'))]));
 const html=fs.readFileSync(path.join(root,'popup/popup.html'),'utf8');
 const select=html.match(/<select id="ui-lang-select"[\s\S]*?<\/select>/)?.[0];
 if(!select)throw Error('Interface language dropdown was not found');
 const requiredLocales=[...select.matchAll(/<option value="([a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)"/g)].map(match=>match[1]);
 return {dictionaries:JSON.parse(JSON.stringify(context.window.dictionaries)),metadata,requiredLocales};
}
async function audit(input=loadInput(),engine=process.env.OTTSUB_L10N_ENGINE||path.join(root,'tests/fixtures/l10n')) {
 const load=file=>import(pathToFileURL(path.join(engine,file)).href);
 const [{auditGate1Completeness},{auditGate2Tokens},{auditGate12ScriptAllowlist},{auditOttsubProfile},{auditGate10FrenchTypography}]=await Promise.all([load('core/gate1_completeness.mjs'),load('core/gate2_tokens.mjs'),load('core/gate12_script_allowlist.mjs'),load('profiles/ottsub.mjs'),load('core/gate10_french_typography.mjs')]);
 const metadataText=Object.fromEntries(Object.entries(input.metadata).map(([locale,dict])=>[locale,Object.fromEntries(Object.entries(dict).map(([key,value])=>[key,value?.message]))]));
 const results={inventory:auditLocaleInventory(input),completeness:auditGate1Completeness(input.dictionaries,'ko'),tokens:auditGate2Tokens(input.dictionaries,'ko'),
  frenchTypography:auditGate10FrenchTypography(input.dictionaries),scripts:auditGate12ScriptAllowlist(input.dictionaries),metadataScripts:auditGate12ScriptAllowlist(metadataText),ottSub:auditOttsubProfile(input.dictionaries,input)};
 return {passed:Object.values(results).every(list=>!list.length),locales:Object.keys(input.dictionaries),keys:Object.fromEntries(Object.entries(input.dictionaries).map(([locale,dict])=>[locale,Object.keys(dict).length])),metadataLengths:Object.fromEntries(Object.entries(input.metadata).map(([locale,dict])=>[locale,{name:dict.extName?.message?.length,description:dict.extDescription?.message?.length}])),results,coverage:'Completeness, tokens, French typography, script families, exact locale inventory and adopted OTTSub rules; not native fluency, all universal gates, browser layout, policy approval or live playback'};
}
function auditLocaleInventory({dictionaries,metadata,requiredLocales}) {
 const violations=[],declared=new Set(requiredLocales);
 if(declared.size!==requiredLocales.length)violations.push({locale:'SYSTEM',key:'dropdown',message:'Duplicate UI locale'});
 for(const [name,values]of [['dictionary',Object.keys(dictionaries)],['metadata',Object.keys(metadata)]]){
  for(const locale of new Set([...requiredLocales,...values]))if(declared.has(locale)!==values.includes(locale))violations.push({locale,key:name,message:'UI, dictionary and metadata locale inventories must agree exactly'});
 }
 return violations;
}
module.exports={loadInput,audit,auditLocaleInventory};
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.length && !(args.length===2&&args[0]==='--engine'))throw Error('Usage: node scripts/audit-l10n.cjs [--engine <shared engine directory>]');
 audit(loadInput(),args.length?path.resolve(args[1]):undefined).then(result=>{console.log(JSON.stringify(result,null,2));process.exitCode=result.passed?0:1;}).catch(error=>{console.error(error);process.exitCode=1;});
}
