// Local comparison of explicitly aligned weekly exports. Never sums unique users across rows.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const headers=fs.readFileSync(path.join(__dirname,'weekly-template.csv'),'utf8').trim().split(',');
const metrics=['visitors','install_users','install_events','sessions','engaged_sessions','page_views'];
function parseCsv(text){
 const rows=[];let row=[],cell='',quoted=false,closed=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=false;closed=true;}else cell+=c;continue;}
  if(c===','||c==='\n'||c==='\r'){
   row.push(cell);cell='';closed=false;
   if(c!==','){if(row.some(x=>x!==''))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}continue;
  }
  assert(!closed,'Characters after closing CSV quote');
  if(c==='"'){assert(cell==='','Quote inside unquoted CSV field');quoted=true;}else cell+=c;
 }
 assert(!quoted,'Unclosed CSV quote');
 if(cell!==''||row.length){row.push(cell);if(row.some(x=>x!==''))rows.push(row);}
 assert.deepEqual(rows.shift(),headers,'Use weekly-template.csv columns; raw GA4 multi-table exports must be mapped explicitly');
 return rows.map((cells,i)=>{assert.equal(cells.length,headers.length,`CSV row ${i+2}: column count`);return Object.fromEntries(headers.map((h,j)=>[h,cells[j].trim()]));});
}
function day(value){const n=Date.parse(value+'T00:00:00Z');assert(/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value,'Invalid calendar date');return n;}
function key(row){return JSON.stringify(['property_id','timezone','filters','scope','source','medium','campaign','content','audience','same_population'].map(h=>row[h]));}
function analyze(input){
 const seen=new Set(),rows=input.map(raw=>{
  const r={...raw};for(const h of ['property_id','timezone','filters'])assert(r[h],`Missing ${h}`);
  assert(['total','session_campaign'].includes(r.scope),'Invalid scope');
  assert(['production','test','unknown'].includes(r.audience),'Audience must be production, test or unknown');
  assert(['true','false'].includes(r.same_population),'same_population must be explicitly true or false');
  assert.equal(day(r.period_end)-day(r.period_start),6*86400000,'Each period must contain exactly seven calendar days');
  if(r.scope==='total')assert(['source','medium','campaign','content'].every(h=>!r[h]),'A total row cannot also filter by campaign');
  else assert(r.source,'Campaign row needs its source');
  if(r.source==='ottsub_devtest')assert.equal(r.audience,'test','Developer-test source must be marked test');
  for(const h of metrics){assert(r[h]===''||/^\d+$/.test(String(r[h])),`Invalid ${h}`);r[h]=r[h]===''?null:Number(r[h]);assert(r[h]===null||Number.isSafeInteger(r[h]),`Unsafe ${h}`);}
  if(r.install_users!==null&&r.install_events!==null)assert(r.install_users<=r.install_events,'Installing users exceed install events');
  if(r.same_population==='true'&&r.visitors!==null&&r.install_users!==null)assert(r.install_users<=r.visitors,'Installing users exceed the confirmed visitor population');
  if(r.engaged_sessions!==null&&r.sessions!==null)assert(r.engaged_sessions<=r.sessions,'Engaged sessions exceed sessions');
  const unique=key(r)+'|'+r.period_start;assert(!seen.has(unique),'Duplicate period/filter row');seen.add(unique);
  return r;
 });
 for(const r of rows)for(const other of rows){if(r===other||key(r)!==key(other))continue;
  assert(day(r.period_end)<day(other.period_start)||day(other.period_end)<day(r.period_start),'Overlapping periods with identical filters');}
 const derived=rows.map(r=>{
  const prior=rows.find(p=>key(p)===key(r)&&day(p.period_end)+86400000===day(r.period_start));
  const ratio=x=>x.same_population==='true'&&x.visitors>0&&x.install_users!==null?x.install_users/x.visitors:null;
  const installRate=ratio(r),previousRate=prior?ratio(prior):null;
  return {...r,installRate,engagementRate:r.sessions>0&&r.engaged_sessions!==null?r.engaged_sessions/r.sessions:null,
   previousPeriod:prior?prior.period_start:null,visitorChange:prior&&r.visitors!==null&&prior.visitors!==null?r.visitors-prior.visitors:null,
   installChange:prior&&r.install_users!==null&&prior.install_users!==null?r.install_users-prior.install_users:null,
   installRateChangePoints:installRate!==null&&previousRate!==null?(installRate-previousRate)*100:null};
 });
 return {status:rows.length?'data_loaded':'not_measured',rows:derived.filter(r=>r.audience!=='test'),excludedTestRows:derived.filter(r=>r.audience==='test'),
  note:'No unique-user totals are inferred from channel rows. Referral traffic is not proof of an AI recommendation. Changes are observations, not causal estimates.'};
}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(report){
 const number=x=>x===null?'미측정':x.toLocaleString('ko-KR');
 const rate=x=>x===null?'계산 불가':(x*100).toFixed(1)+'%';
 const cell=x=>`<td>${esc(x)}</td>`;
 const body=report.rows.map(r=>'<tr>'+[
  r.period_start+' ~ '+r.period_end,r.scope==='total'?'전체(원본 집계)':[r.source,r.medium,r.campaign,r.content].filter(Boolean).join(' / '),
  r.audience==='unknown'?'테스트 여부 미확인':r.audience,r.property_id+' · '+r.timezone+' · '+r.filters,
  number(r.visitors),number(r.install_users),number(r.install_events),rate(r.installRate),rate(r.engagementRate),
  r.previousPeriod?`${r.previousPeriod} 대비 방문 ${number(r.visitorChange)}, 설치자 ${number(r.installChange)}, 전환율 ${r.installRateChangePoints===null?'계산 불가':r.installRateChangePoints.toFixed(1)+'%p'}`:'비교 가능한 전주 없음'
 ].map(cell).join('')+'</tr>').join('');
 return `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OTTSub 주간 유입·설치 비교</title><style>body{font:16px/1.6 system-ui;background:#f4f6f9;color:#17202a;margin:0}main{max-width:1500px;margin:40px auto;padding:24px}h1{font-size:30px}p{max-width:900px}.table{overflow:auto;background:white;border:1px solid #cbd5e1;border-radius:12px}table{border-collapse:collapse;min-width:1100px;width:100%}th,td{padding:14px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}th{background:#e5edf4}small{color:#49576a}.empty{padding:24px;background:white;border-left:4px solid #087b72}</style><main><p>OTTSub · 로컬 측정</p><h1>주간 유입과 설치를 나눠 보기</h1><p>같은 속성·시간대·필터·유입 기준의 연속된 7일만 비교해. 방문·설치자는 고유 사용자 수, 설치 이벤트는 발생 횟수야. 설치자 비율은 같은 방문자 모집단임을 확인한 행에서만 계산해.</p><p>확인된 개발 테스트 ${report.excludedTestRows.length}행 제외. 테스트 여부 미확인 행은 별도로 유지해. 채널별 고유 사용자 수를 더해서 전체 사용자를 만들지 않아. AI 출처 유입과 실제 답변의 추천·인용은 별개야.</p>${report.rows.length?`<div class="table"><table><thead><tr>${['기간','출처 / 캠페인','구분','속성 / 시간대 / 필터','방문자','설치자','설치 이벤트','설치자 비율','참여율','전주 변화'].map(h=>'<th>'+h+'</th>').join('')}</tr></thead><tbody>${body}</tbody></table></div>`:'<p class="empty">아직 비교할 원본 통계가 없어. 주간 CSV를 넣으면 여기에 실제 값이 표시돼. 데이터가 없는 값을 0이나 성과 달성으로 처리하지 않아.</p>'}<p><small>집계값은 소표본·개발 테스트·집계 지연의 영향을 받을 수 있어. 표의 변화는 원인이나 미래 성과를 보장하지 않아. 데이터 입력·비교는 이 컴퓨터에서만 실행하며 계정·분석 API에 접속하지 않아.</small></p></main></html>`;
}
function main(args){
 assert.equal(args.length,4,'Usage: node measure.cjs --input weekly.csv --out <project-output-directory>');
 assert.equal(args[0],'--input');assert.equal(args[2],'--out');
 const root=path.resolve(__dirname,'../..'),out=path.resolve(args[3]),input=path.resolve(args[1]);
 const relative=path.relative(root,out);assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'Output must stay inside OTTSub');
 const report=analyze(parseCsv(fs.readFileSync(input,'utf8')));fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'weekly.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'weekly.html'),render(report));
 console.log(JSON.stringify({status:report.status,rows:report.rows.length,excludedTests:report.excludedTestRows.length,out}));
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={parseCsv,analyze,render,headers};
