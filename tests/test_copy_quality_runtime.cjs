const test=require('node:test'),assert=require('node:assert/strict');
const {loadInput}=require('../scripts/audit-l10n.cjs');
const {dictionaries,requiredLocales}=loadInput();
// Shared technical notation and genuine cognates are intentional, not untranslated prose.
const common=['ext_title','btn_add_100','btn_add_500','btn_sub_100','btn_sub_500'];
const cognates={fr:['line_height_normal'],de:['color_mint','line_height_normal','lang_hi'],es:['line_height_normal','blur_mode_blur_8','lang_hi'],tr:['line_height_normal','blur_mode_blur_8'],ms:['lang_hi'],'pt-PT':['line_height_normal','blur_mode_blur_8','lang_hi']};
for(const locale of requiredLocales)test(locale+': complete copy has no corrupt text, unsafe direction overrides or unexplained English prose',()=>{
 const dict=dictionaries[locale];
 for(const [key,value]of Object.entries(dict)){
  assert.equal(typeof value,'string',key);assert(value.trim().length,key);
  assert(value.isWellFormed(),key);assert(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\ufffd\u202a-\u202e]/u.test(value),key);
  if(locale!=='en'&&value===dictionaries.en[key])assert([...common,...(cognates[locale]||[])].includes(key),locale+' unexplained shared copy '+key);
 }
 for(const [key,number]of [['btn_add_100','+0.1'],['btn_add_500','+0.5'],['btn_sub_100','-0.1'],['btn_sub_500','-0.5']]){
  const normalized=dict[key].replaceAll('−','-').replaceAll(',','.').replaceAll(' ','');assert(normalized.startsWith(number),key);
 }
});
