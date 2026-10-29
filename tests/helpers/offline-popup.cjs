const fs=require('node:fs'),path=require('node:path');
const {fixture,setSaved}=require('../test_hindi_track_kind_browser.cjs');
const root=path.resolve(__dirname,'../..');
let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require(path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));}
// Each caller owns/tears down its browser/context. All URLs are fulfilled locally.
async function popup(browser,{locale='en',width=430,extra='',contextOptions={}}={}){
 setSaved({ottsub_ui_lang:locale,ottsub_learning_collapsed:false});
 const context=await browser.newContext({viewport:{width,height:1000},...contextOptions});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.hostname!=='ottsub.test')return route.abort();
  if(url.pathname==='/fixture.js')return route.fulfill({contentType:'application/javascript',body:fixture()+extra});
  const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'missing'});
  let body=fs.readFileSync(file);if(url.pathname==='/popup/popup.html')body=body.toString().replace('<head>','<head><script src="/fixture.js"></script>');
  return route.fulfill({contentType:({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8'})[path.extname(file)]||'application/octet-stream',body});
 });
 const page=await context.newPage();await page.goto('http://ottsub.test/popup/popup.html');
 await page.waitForFunction(l=>OTTSubI18n.getLanguage()===l,locale);
 return {context,page};
}
module.exports={chromium,popup,root};
