const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseCsv,analyze,render,headers}=require('./measure.cjs');
const row=(changes={})=>Object.fromEntries(headers.map(h=>[h,({property_id:'cws:test',timezone:'Asia/Seoul',filters:'all',scope:'session_campaign',period_start:'2026-10-05',period_end:'2026-10-11',source:'ottsub_site',medium:'referral',campaign:'site_help_20261022',content:'ko_hero',audience:'production',same_population:'true',visitors:'39',install_users:'13',install_events:'14',sessions:'45',engaged_sessions:'10',page_views:'88',...changes})[h]]));
test('BOM, quotes, escaped quotes, commas and CRLF preserve source values',()=>{
 const r=row({filters:'desktop, "not test"'}),csv='\uFEFF'+headers.join(',')+'\r\n'+headers.map(h=>'"'+r[h].replaceAll('"','""')+'"').join(',')+'\r\n';
 assert.deepEqual(parseCsv(csv),[r]);
});
test('Reject malformed CSV and ambiguous raw exports',()=>{
 for(const data of ['foo,bar\n1,2',headers.join(',')+'\n"unfinished',headers.join(',')+'\n"ok"bad'])assert.throws(()=>parseCsv(data));
});
test('Empty input stays not measured rather than successful or zero',()=>{const r=analyze(parseCsv(headers.join(',')+'\n'));assert.equal(r.status,'not_measured');assert.equal(r.rows.length,0);assert.match(render(r),/아직 비교할 원본 통계/);});
test('Installing users and install event counts remain distinct',()=>{const r=analyze([row()]).rows[0];assert.equal(r.installRate,13/39);assert.equal(r.install_events,14);});
test('Missing data and zero denominator do not become a rate',()=>{
 assert.equal(analyze([row({visitors:'0',install_users:'0',install_events:'0'})]).rows[0].installRate,null);
 assert.equal(analyze([row({install_users:''})]).rows[0].installRate,null);
 assert.equal(analyze([row({same_population:'false'})]).rows[0].installRate,null);
});
test('Only exactly adjacent aligned seven-day periods compare',()=>{
 const next=row({period_start:'2026-10-12',period_end:'2026-10-18',visitors:'40',install_users:'14',install_events:'15'});
 const r=analyze([row(),next]).rows[1];assert.equal(r.visitorChange,1);assert.equal(r.installChange,1);assert.equal(r.previousPeriod,'2026-10-05');
});
test('Different property, timezone, filters, audience and attribution scope never compare',()=>{
 for(const change of [{property_id:'other'},{timezone:'UTC'},{filters:'desktop'},{audience:'unknown'},{same_population:'false'},{scope:'total',source:'',medium:'',campaign:'',content:''}]){
  const r=analyze([row(),row({period_start:'2026-10-12',period_end:'2026-10-18',...change})]);assert.equal(r.rows[1].previousPeriod,null);
 }
});
test('Developer traffic is explicitly excluded; unknown traffic remains distinct',()=>{
 const r=analyze([row(),row({source:'ottsub_devtest',audience:'test'}),row({audience:'unknown'})]);
 assert.equal(r.rows.length,2);assert.equal(r.excludedTestRows.length,1);assert.throws(()=>analyze([row({source:'ottsub_devtest'})]));
});
test('No sums of campaign unique users or fabricated total rows',()=>{const r=analyze([row(),row({content:'ko_footer'})]);assert.equal(r.rows.length,2);assert(!('totals' in r));});
test('Reject overlapping, duplicate, invalid date and partial-week input',()=>{
 for(const data of [[row(),row()],[row(),row({period_start:'2026-10-06',period_end:'2026-10-12'})],[row({period_start:'2026-02-30'})],[row({period_end:'2026-10-10'})]])assert.throws(()=>analyze(data));
});
test('Reject invalid counts, impossible subsets and scope',()=>{
 for(const changes of [{visitors:'-1'},{install_users:'1.5'},{visitors:'2'},{install_events:'2'},{engaged_sessions:'50'},{same_population:''},{scope:'unknown'},{scope:'total'}])assert.throws(()=>analyze([row(changes)]));
});
test('HTML escapes input and has no external scripts, resources or API calls',()=>{const s=render(analyze([row({source:'<script>alert(1)</script>'})]));assert(s.includes('&lt;script&gt;'));assert(!/<script|https?:\/\/|<iframe/i.test(s));});
