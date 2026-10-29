const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function injectHarness(options={}){
 const calls=[];
 class XHR {
  open(method,url){this.url=url;}
  send(body){calls.push({url:this.url,body});}
  addEventListener(){}
 }
 class Response {
  constructor(body,url){this.body=body;this.url=url;}
  async json(){return this.body;}
 }
 const ctx=vm.createContext({window:new EventTarget(),history:{pushState(){},replaceState(){}},XMLHttpRequest:XHR,CustomEvent,URL,console,
  document:{documentElement:{dataset:{}}},Response});
 ctx.window.location={pathname:'/watch/100'};
 ctx.window.fetch=options.fetch||async function(url,init){calls.push({url,body:init?.body});return{url,bodyUsed:true};};
 const root=path.resolve(__dirname,'../..'),old=process.env.OTTSub_TEST_SOURCE&&path.join(process.env.OTTSub_TEST_SOURCE,'src/inject.js');
 const languageFile=path.join(process.env.OTTSub_TEST_SOURCE||root,'src/core/track-languages.js');
 if(fs.existsSync(languageFile))vm.runInContext(fs.readFileSync(languageFile,'utf8'),ctx);
 vm.runInContext(fs.readFileSync(old&&fs.existsSync(old)?old:path.join(root,'src/inject.js'),'utf8'),ctx);
 return {calls,ctx,stringify:vm.runInContext('JSON.stringify',ctx),parse:vm.runInContext('JSON.parse',ctx),response:(body,url)=>new Response(body,url).json(),xhr:(url,body)=>{const x=new ctx.XMLHttpRequest();x.open('POST',url);x.send(body);return calls.at(-1);},fetch:(url,body)=>ctx.window.fetch(url,{method:'POST',body})};
}
module.exports={injectHarness};
