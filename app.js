
/* ================= CONFIG (per-quarter) ================= */
const CONFIG = {
  sfy: "2026-27", quarter: "Q1",
  email: "pnpptimestudies@alamedahealthsystem.org",
  tsDates: "September 24 - 30, 2026",
  days: daysFromStart("2026-09-24"),
  rows: [
    {r:"1",  code:"00001", name:"Direct Patient Care Services"},
    {r:"2",  code:"00002", name:"Supervision & Training of Nurses, Techs"},
    {r:"3",  code:"00003", name:"Utilization Review & Committee Meetings"},
    {r:"4",  code:"00004", name:"Quality Control, Medical Review, Autopsies"},
    {r:"8",  code:"00008", name:"Other Admin/Teaching; Hosp. Patient Care", specify:true},
    {r:"9",  code:"00009", name:"Conferences and Lectures"},
    {r:"10", code:"00010", name:"Non-Productive (paid sick/vacation)"},
    {r:"11", code:"00011", name:"Research"},
    {r:"12", code:"00012", name:"Other Non-Billable Activities", specify:true}
  ]
};

/* ================= STATE ================= */
const blank = () => { const h={}; CONFIG.days.forEach(D=>{h[D.d]={}; CONFIG.rows.forEach(R=>{h[D.d][R.r]=[{h:"",c:""}];});}); return h; };
let S = { step:0, day:1, shifts:[], hours:blank(), specify:{}, reviewed:{}, paid:{}, off:{}, expanded:{}, appliedSig:null };
const $ = id => document.getElementById(id);
const PFIELDS = ["p_last","p_first","p_mi","p_emp","p_fac","p_dept","p_job","p_hpw","p_phone","cc_ip","cc_op","cc_er","cc_oth_name","cc_oth","cc_default","variance"];
function qKey(){ return CONFIG.sfy+"|"+CONFIG.quarter+"|"+CONFIG.days[0].date; }
function saveState(){
  syncGeneratedVariance();
  const o={qkey:qKey(),p:{},hours:S.hours,specify:S.specify,shifts:S.shifts,reviewed:S.reviewed,paid:S.paid,off:S.off,locationChoice:S.locationChoice,usedPriorLocation:S.usedPriorLocation,varianceSuggestion:S.varianceSuggestion};
  PFIELDS.forEach(k=>o.p[k]=$(k).value);
  try{localStorage.setItem("pnpp_ts_v2:"+qKey(),JSON.stringify(o));$("savestatus").textContent="Draft saved on this browser only.";}
  catch(e){$("savestatus").textContent="Draft could not be saved. Keep this page open until you download your form.";}
  $("genok").classList.add("hidden");
  $("generr").classList.add("hidden");
}
function loadState(){
  try{
    const o=JSON.parse(localStorage.getItem("pnpp_ts_v2:"+qKey())||"null");
    if(!o || o.qkey!==qKey())return;
    PFIELDS.forEach(k=>{if(o.p&&typeof o.p[k]==="string")$(k).value=o.p[k];});
    if(o.hours && CONFIG.days.every(D=>CONFIG.rows.every(R=>Array.isArray(o.hours[D.d]?.[R.r]))))S.hours=o.hours;
    S.specify=o.specify||{};S.shifts=Array.isArray(o.shifts)?o.shifts:[];S.reviewed=o.reviewed||{};S.paid=o.paid||{};S.off=o.off||{};S.locationChoice=o.locationChoice||'';S.usedPriorLocation=!!o.usedPriorLocation;S.varianceSuggestion=o.varianceSuggestion||null;
  }catch(e){$("savestatus").textContent="Saved draft could not be read. Check your entries before continuing.";}
}
function clearDraft(){
 if(!confirm("Clear this app's saved provider details, hours and old signatures from this browser? Download your work first if you need it."))return;
 try{for(const k of Object.keys(localStorage)){if(k.startsWith("pnpp_"))localStorage.removeItem(k);}}catch(e){}
 location.reload();
}
function winStart(){ const [Y,M,D]=CONFIG.days[0].date.split("-").map(Number); return new Date(Y,M-1,D); }
function winEnd(){ const [Y,M,D]=CONFIG.days[CONFIG.days.length-1].date.split("-").map(Number); return new Date(Y,M-1,D+1); }

/* ============ QUARTER CONFIG (hosted: quarters.json) ============ */
function daysFromStart(startISO){
  const [Y,M,D]=startISO.split("-").map(Number);
  const wn=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], mn=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const out=[];
  for(let i=0;i<7;i++){ const dt=new Date(Y,M-1,D+i);
    out.push({d:i+1, date:dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0"),
      label:wn[dt.getDay()], tt:mn[dt.getMonth()]+" "+dt.getDate()}); }
  return out; }
function applyPeriod(startISO){
 if(startISO!=="2026-09-24")throw new Error("This version uses the September 24–30, 2026 official form only.");
 CONFIG.days=daysFromStart(startISO);CONFIG.sfy="2026-27";CONFIG.quarter="Q1";CONFIG.tsDates="September 24 - 30, 2026";
}
const STEPNAMES=["Your details","QGenda link","Edit exceptions","Review & DocuSign"];
function renderSteps(){ $("steps").innerHTML=[1,3,0,2].map(i=>`<button type="button" class="step ${i===S.step?'active':''}" ${i===S.step?'aria-current="step"':''} onclick="go(${i})">${STEPNAMES[i]}</button>`).join(""); }
function go(i){if(i===3&&typeof fillMissingCostCenters==='function')fillMissingCostCenters();saveState();S.step=i;for(let k=0;k<4;k++)$("panel"+k).classList.toggle("hidden",k!==i);renderSteps();if(i===1)renderShifts();if(i===2)renderGrid();if(i===3)renderChecks();window.scrollTo(0,0);}
function copyLink(){
 const url="https://mikedmote52.github.io/timestudy/?study=2026-09-24";
 const done=()=>{$("savestatus").textContent="Colleague link copied. It contains no personal details.";};
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(done,()=>prompt("Copy the colleague link:",url));
 else prompt("Copy the colleague link:",url);
}
function cvAP(h,m,ap){ h=+h; m=+(m||0); ap=(ap||"").toLowerCase();
  if(ap.startsWith("p")&&h<12)h+=12; if(ap.startsWith("a")&&h===12)h=0; return [h,m]; }
function rangeFrom(m){
  if(m[1]&&m[2]){ const h1=Math.floor(+m[1]/100),m1=+m[1]%100,h2=Math.floor(+m[2]/100),m2=+m[2]%100;
    if(h1<24&&h2<24&&m1<60&&m2<60) return [h1,m1,h2,m2]; return null; }
  let ap1=m[5],ap2=m[8];
  if(+m[3]>23||+m[6]>23||+(m[4]||0)>59||+(m[7]||0)>59||(ap1&&(+m[3]<1||+m[3]>12))||(ap2&&(+m[6]<1||+m[6]>12)))return null;
  if(!ap1&&!ap2){ if(m[4]&&m[7]) return [+m[3],+m[4],+m[6],+m[7]]; return null; }
  const dur=(a,z)=>{ let d=(z[0]*60+z[1])-(a[0]*60+a[1]); if(d<=0)d+=1440; return d/60; };
  if(!ap1){ const A=cvAP(m[3],m[4],"am"),P=cvAP(m[3],m[4],"pm"),E=cvAP(m[6],m[7],ap2); ap1=dur(A,E)<=dur(P,E)?"am":"pm"; }
  if(!ap2){ const S=cvAP(m[3],m[4],ap1),A=cvAP(m[6],m[7],"am"),P=cvAP(m[6],m[7],"pm"); ap2=dur(S,A)<=dur(S,P)?"am":"pm"; }
  const s=cvAP(m[3],m[4],ap1), e=cvAP(m[6],m[7],ap2);
  return [s[0],s[1],e[0],e[1]]; }
function parseTxt(){const raw=$("txtshifts").value;if(raw.trim())parseTxtRegex(raw);}
function parseTxtRegex(raw){
  const t=raw.toLowerCase().replace(/[\u2013\u2014]/g,"-")
    .replace(/\bnoon\b/g,"12pm").replace(/\bmidnight\b/g,"12am").replace(/\bfrom\s+/g,"")
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(am|pm|a\.m\.?|p\.m\.?)/g,
      function(m,w,ap){ return {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12}[w]+ap.replace(/\./g,""); })
    .replace(/\b(to|until|till|through|thru)\b/g,"-");
  const wd={sunday:0,sun:0,monday:1,mon:1,tuesday:2,tues:2,tue:2,wednesday:3,wed:3,thursday:4,thurs:4,thur:4,thu:4,friday:5,fri:5,saturday:6,sat:6};
  const mo={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  const days=CONFIG.days.map(D=>{ const [Y,M,Dd]=D.date.split("-").map(Number); return {Y,M,Dd,dow:new Date(Y,M-1,Dd).getDay()}; });
  const dayToks=[]; let m;
  const dayRe=/\b(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat)\b|(\d{1,2})\s*\/\s*(\d{1,2})|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s{1,3}(\d{1,2})\b|\bthe\s+(\d{1,2})(?:st|nd|rd|th)?\b/g;
  while((m=dayRe.exec(t))){
    let day=null;
    if(m[1]) day=days.find(D=>D.dow===wd[m[1]]);
    else if(m[2]) day=days.find(D=>D.M===+m[2]&&D.Dd===+m[3]) || (+m[2]===9&&+m[3]===23?{Y:2026,M:9,Dd:23}:null);
    else if(m[4]) day=days.find(D=>D.M===mo[m[4]]&&D.Dd===+m[5]);
    else if(m[6]) day=days.find(D=>D.Dd===+m[6]);
    dayToks.push({i:m.index, txt:m[0].trim(), day, used:false});
  }
  const ranges=[];
  const rangeRe=/\b(\d{3,4})\s*-\s*(\d{3,4})\b|(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?(?![a-z])/g;
  while((m=rangeRe.exec(t))){ const r=rangeFrom(m); if(r) ranges.push({i:m.index, txt:m[0].trim(), r}); }
  const evs=[], misses=[];
  for(const R of ranges){
    let best=null;
    for(const D of dayToks){ if(D.i<R.i && (!best||D.i>best.i)) best=D; }
    if(!best||!best.day){ misses.push('"'+R.txt+'" - no day mentioned before it'); continue; }
    best.used=true;
    let a=new Date(best.day.Y,best.day.M-1,best.day.Dd,R.r[0],R.r[1]);
    let z=new Date(best.day.Y,best.day.M-1,best.day.Dd,R.r[2],R.r[3]);
    if(z<=a) z=new Date(z.getTime()+864e5);
    evs.push({start:a,end:z,name:best.txt+" "+R.txt});
  }
  for(const D of dayToks){
    if(D.day&&!D.used) misses.push('"'+D.txt+'" - needs a start AND end time (e.g. 3pm to 1am)');
    else if(!D.day) misses.push('"'+D.txt+'" - not a date inside the study week'); }
  if(!evs.length){ alert("Couldn't find any complete shifts. Say a day plus start and end times, e.g.: Monday 3pm to 1am"); return; }
  if(misses.length) alert("Added "+evs.length+" shift(s). Skipped:\n\u2022 "+misses.join("\n\u2022 "));
  ingestShifts(evs);
}
function wallISO(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0');}
function ingestShifts(evs){
  S.locationChoice='';S.usedPriorLocation=false;
  const t0=winStart(), t1=winEnd();
  const kept=evs.filter(e=>e.end>t0 && e.start<t1).sort((a,b)=>a.start-b.start);
  S.shifts=kept.map(e=>({start:wallISO(e.start),end:wallISO(e.end),name:e.name,costCenter:e.costCenter||"",activity:e.activity||"1",use:true}));
  saveState();renderShifts();
  if(!kept.length) alert("Import worked, but found no events inside the study week.");
}
function renderShifts(){
  const el=$("shiftlist"); $("applyshifts").disabled=!S.shifts.some(s=>s.use);
  if(!S.shifts.length){ el.innerHTML="<p class='muted'>No shifts imported yet.</p>"; return; }
  el.innerHTML="<div style='display:flex;justify-content:space-between'><label style='margin-bottom:6px'>Shifts found in the study window</label><span class='splitlink' onclick=\"S.shifts=[];saveState();renderShifts()\">clear list</span></div>"+S.shifts.map((s,i)=>{
    const a=new Date(s.start),z=new Date(s.end);
    const fmt=d=>d.toLocaleString("en-US",{weekday:"short",month:"numeric",day:"numeric",hour:"numeric",minute:"2-digit"});
    const hrs=((z-a)/3600000).toFixed(2);
    return `<div class="shift"><input type="checkbox" ${s.use?"checked":""} aria-label="Use ${esc(s.name)}" onchange="S.shifts[${i}].use=this.checked;saveState();renderShifts()" style="width:auto">
      <div style="flex:1"><b>${esc(s.name)}</b><br><span class="muted">${fmt(a)} → ${fmt(z)} · ${hrs} h</span></div></div>`;
  }).join("");
}
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function round25(x){ return Math.round(x*4)/4; }
function applyShifts(){
 if(!S.shifts.some(s=>s.use))return;
 const selected=S.shifts.filter(s=>s.use).sort((a,b)=>new Date(a.start)-new Date(b.start));
 for(let i=1;i<selected.length;i++)if(new Date(selected[i].start)<new Date(selected[i-1].end)){alert("Selected shifts overlap. Uncheck the duplicate or correct your shifts first.");return;}
 if(CONFIG.days.some(D=>dayTotal(D.d)>0)&&!confirm("Replace all current activity hours with these selected shifts as draft direct patient-care hours?"))return;
 if(selected.some(s=>{const a=new Date(s.start),z=new Date(s.end);return a.getMinutes()%15||z.getMinutes()%15||a.getSeconds()||z.getSeconds();})){alert("These shift times are not quarter-hour boundaries. Enter actual activity hours directly in .25 increments; the app will not round your time automatically.");return;}
 const ccKey=$("cc_default").value, ccVal={ip:$("cc_ip").value,op:$("cc_op").value,er:$("cc_er").value,oth:$("cc_oth").value}[ccKey]||"";
 const perDay={};CONFIG.days.forEach(D=>perDay[D.d]={});
 for(const s of selected){
  const a=new Date(s.start),z=new Date(s.end),r=CONFIG.rows.some(R=>R.r===s.activity)?s.activity:'1',cc=s.costCenter||ccVal;
  for(const D of CONFIG.days){
   const [Y,M,Dd]=D.date.split("-").map(Number);const lo=Math.max(a,new Date(Y,M-1,Dd)),hi=Math.min(z,new Date(Y,M-1,Dd+1));
   if(hi>lo){const key=JSON.stringify([r,cc]);perDay[D.d][key]=(perDay[D.d][key]||0)+(hi-lo)/3600000;}
  }
 }
 for(const D of CONFIG.days)for(const R of CONFIG.rows)if(Object.keys(perDay[D.d]).filter(k=>JSON.parse(k)[0]===R.r).length>3){alert('More than three cost centers for one activity on '+D.tt+'. Review the allocations before importing.');return;}
 S.hours=blank();S.specify={};S.reviewed={};S.off={};S.paid={};
 for(const D of CONFIG.days){for(const [key,h] of Object.entries(perDay[D.d])){const [r,c]=JSON.parse(key);if(S.hours[D.d][r][0].h==='')S.hours[D.d][r]=[];S.hours[D.d][r].push({h:h.toFixed(2),c});}const total=dayTotal(D.d);if(total>0)S.paid[D.d]=total.toFixed(2);}
 saveState();$("importmessage").textContent="Draft hours added. Review the whole week together, and edit any unpaid breaks or different activities.";return true;
}
/* ================= HOURS GRID ================= */
function dayTotal(d){ let t=0; CONFIG.rows.forEach(R=>S.hours[d][R.r].forEach(e=>t+=parseFloat(e.h)||0)); return t; }
function renderDayTabs(){
  $("daytabs").innerHTML=CONFIG.days.map(D=>{ const t=dayTotal(D.d);
    return `<button type="button" class="daytab ${S.day===D.d?'active':''}" onclick="S.day=${D.d};renderDayTabs();renderGrid()">${D.label} <span class="tt">${D.tt} · ${t?t.toFixed(2)+"h":"0h"} ${S.reviewed[D.d]?"✓":""}</span></button>`;}).join("");
}
function renderGrid(){
  const d=S.day, D=CONFIG.days.find(x=>x.d===d);
  let html=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
    <b>${D.label}, ${D.tt} ${D.date.slice(0,4)}</b>
    <span>Quick fill 00001: <button class="btn sm sec" onclick="qf(${d},8)">8h</button> <button class="btn sm sec" onclick="qf(${d},10)">10h</button> <button class="btn sm sec" onclick="qf(${d},12)">12h</button> <button class="btn sm sec" onclick="qf(${d},0)">Not worked / unpaid</button></span></div>
  <table><tr><th style="width:60px">Code</th><th>Activity</th><th style="width:110px">Hours</th><th style="width:120px">Cost center</th><th></th></tr>`;
  for(const R of CONFIG.rows){
    if(R.r!=="1"&&!S.expanded[d]&&!S.hours[d][R.r].some(e=>e.h!==""&&Number(e.h)!==0)&&!S.specify[R.r+"_"+d])continue;
    const entries=S.hours[d][R.r];
    entries.forEach((e,ei)=>{
      html+=`<tr>${ei===0?`<td class="code" rowspan="${entries.length}">${R.code}</td><td class="rowname" rowspan="${entries.length}">${R.name}${R.specify?`<br><input placeholder="specify…" value="${esc(S.specify[R.r+"_"+d]||"")}" oninput="S.specify['${R.r}_${d}']=this.value;S.reviewed[${d}]=false;saveState();renderDayTabs()" style="margin-top:4px;font-size:12px">`:""}</td>`:""}
      <td class="entrycell"><span class="mobile-label">Hours</span><input type="number" step="0.25" min="0" aria-label="${R.code} hours entry ${ei+1}" value="${esc(e.h)}" oninput="setH(${d},'${R.r}',${ei},this.value,false)" onchange="setH(${d},'${R.r}',${ei},this.value)"></td>
      <td class="entrycell"><span class="mobile-label">Cost center</span><input aria-label="${R.code} cost center entry ${ei+1}" list="ccl" value="${esc(e.c)}" oninput="S.hours[${d}]['${R.r}'][${ei}].c=this.value;S.reviewed[${d}]=false;saveState();renderDayTabs()"></td>
      <td class="actions">${ei===0&&entries.length<3?`<button type="button" class="splitlink" onclick="addSplit(${d},'${R.r}')">+ split cost center</button>`:ei>0?`<button type="button" class="splitlink" onclick="rmSplit(${d},'${R.r}',${ei})">remove</button>`:""}</td></tr>`;
    });
  }
  const t=dayTotal(d), frac=Math.abs(t*4-Math.round(t*4))>1e-9;
  html+=`<tr class="daytotal"><td></td><td class="tot">DAY TOTAL</td><td class="tot">${t.toFixed(2)}</td><td colspan="2">${t===0?('<span class="pill warn">'+(S.off[d]?'unpaid day':'needs review')+'</span>'):frac?'<span class="pill err">not a .25 increment</span>':'<span class="pill ok">ok</span>'}</td></tr></table>
  <datalist id="ccl">${[$("cc_ip").value,$("cc_op").value,$("cc_er").value,$("cc_oth").value].filter(Boolean).map(c=>`<option value="${esc(c)}">`).join("")}</datalist>`;
  html+=`<button class="btn sec" style="margin-top:12px;width:100%;white-space:normal" onclick="S.expanded[${d}]=!S.expanded[${d}];renderGrid()">${S.expanded[d]?"Hide unused activity codes":"Other activities: teaching, meetings, paid leave…"}</button><div class="dayreview"><label for="paidday">Actual paid hours on ${D.label} ${D.tt}</label><input id="paidday" type="number" min="0" max="24" step="0.25" value="${esc(S.paid[d]??'')}" oninput="S.paid[${d}]=this.value;S.reviewed[${d}]=false;saveState();renderDayTabs()"><p class="muted">Exclude unpaid breaks. Include paid sick/vacation hours under 00010. Activity hours above must match this number.</p><button class="btn" style="margin-top:10px" onclick="reviewDay(${d})">${S.reviewed[d]?'Day checked ✓':'Check this day'}</button><p class="muted">${S.reviewed[d]?'Checked against paid time.':'Not yet checked.'}</p></div>`;
  $("daygrid").innerHTML=html;
  renderDayTabs();
}
function setH(d,r,ei,v,render=true){S.hours[d][r][ei].h=v;S.reviewed[d]=false;S.off[d]=false;saveState();if(render)renderGrid();else renderDayTabs();}
function addSplit(d,r){S.hours[d][r].push({h:"",c:""});S.reviewed[d]=false;saveState();renderGrid();}
function rmSplit(d,r,ei){S.hours[d][r].splice(ei,1);S.reviewed[d]=false;saveState();renderGrid();}
function qf(d,h){
 const cc={ip:$("cc_ip").value,op:$("cc_op").value,er:$("cc_er").value,oth:$("cc_oth").value}[$("cc_default").value]||"";
 if(h===0){if(dayTotal(d)>0&&!confirm("Clear these hours and mark this day as not worked and unpaid?"))return;CONFIG.rows.forEach(R=>S.hours[d][R.r]=[{h:"",c:""}]);S.paid[d]="0";S.off[d]=true;S.reviewed[d]=true;}
 else{S.hours[d]["1"]=[{h:h.toFixed(2),c:cc}];S.paid[d]=String(h);S.off[d]=false;S.reviewed[d]=false;}
 saveState();renderGrid();
}
function validHours(v){return v!==""&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=24&&Math.abs(Number(v)*4-Math.round(Number(v)*4))<1e-9;}
function dayErrors(d,{allowMissingCostCenters=false}={}){
 const errors=[];const total=dayTotal(d);
 if(!validHours(S.paid[d])||total>24||Math.abs(total-Number(S.paid[d]))>1e-9)errors.push("Activity hours must equal actual paid hours (0–24 in quarter-hours).");
 for(const R of CONFIG.rows){for(const e of S.hours[d][R.r]){
  if(e.h!==""&&!validHours(e.h))errors.push("Use non-negative hours in .25 increments; do not round away an error.");
  if(!allowMissingCostCenters&&Number(e.h)>0&&!String(e.c).trim())errors.push("Each activity with hours needs its cost center.");
 }
 if(R.specify&&S.hours[d][R.r].some(e=>Number(e.h)>0)&&!String(S.specify[R.r+"_"+d]||"").trim())errors.push("Codes 00008 and 00012 need a description.");}
 if(total===0&&!S.off[d])errors.push("Confirm zero days using Not worked / unpaid.");
 if(total>0&&S.off[d])errors.push("A paid day cannot be marked unpaid.");
 return [...new Set(errors)];
}
function reviewDay(d){const errors=dayErrors(d,{allowMissingCostCenters:true});if(errors.length){alert(errors.join("\n"));return;}S.reviewed[d]=true;saveState();renderGrid();}
/* ================= HOURS EXPLANATION ================= */
function varianceValues(){
 const total=CONFIG.days.reduce((v,D)=>v+dayTotal(D.d),0),normal=Number($("p_hpw").value);
 return {total,normal,basis:total+'|'+normal,valid:$("p_hpw").value!==''&&Number.isFinite(normal)&&normal>0&&normal<=168&&Number.isFinite(total)&&total>=0};
}
function scheduleExplanation(){
 const {total,normal,valid}=varianceValues();if(!valid||total===normal)return '';
 return `My shifts vary week to week. This study reports ${total.toFixed(2)} hours, ${Math.abs(total-normal).toFixed(2)} ${total>normal?'more':'fewer'} than my normal ${normal.toFixed(2)} weekly hours.`;
}
function syncGeneratedVariance(){
 const previous=S.varianceSuggestion;if(!previous)return;
 if($("variance").value!==previous.text){S.varianceSuggestion=null;return;}
 if(previous.basis!==varianceValues().basis){$("variance").value='';S.varianceSuggestion=null;}
}
function useScheduleExplanation(){
 const text=scheduleExplanation();if(!text)return;
 $("variance").value=text;S.varianceSuggestion={text,basis:varianceValues().basis};saveState();renderChecks();
 $("variance").focus();
}
function renderVariance(){
 const {total,normal,valid}=varianceValues();
 $("variancewrap").classList.toggle("hidden",!valid||total===normal);
 $("variancecomparison").textContent=valid?`${total.toFixed(2)} reported hours compared with ${normal.toFixed(2)} normal weekly hours. AHS asks for the reason for this difference.`:'';
 $("variancepreview").textContent=scheduleExplanation();
 $("varianceSchedule").disabled=!scheduleExplanation()||$("variance").value===scheduleExplanation();
}

/* ================= CHECKS ================= */
function checks({allowMissingCostCenters=false}={}){
 syncGeneratedVariance();
 const out=[];
 for(const [keys,label] of [[['p_first','p_last'],'Provider name'],[['p_emp'],'Employee number'],[['p_fac','p_dept','p_job'],'Facility, department and position'],[['p_phone'],'Telephone number']])out.push({ok:keys.every(k=>$(k).value.trim()),t:label+" entered"});
 const normal=Number($("p_hpw").value);out.push({ok:$("p_hpw").value!==""&&Number.isFinite(normal)&&normal>0&&normal<=168&&normal*4===Math.round(normal*4),t:"Normal weekly paid hours entered in .25 increments"});
 const total=CONFIG.days.reduce((v,D)=>v+dayTotal(D.d),0);
 out.push({ok:CONFIG.days.every(D=>S.reviewed[D.d]&&dayErrors(D.d,{allowMissingCostCenters:true}).length===0),t:"All 7 days checked; activity hours match paid hours, with unpaid days confirmed"});
 out.push({ok:allowMissingCostCenters||!hasMissingCostCenters(),t:"Workplace coding filled; otherwise download a draft for coordinator review"});
 out.push({ok:total===normal||$("variance").value.trim().length>0,t:"Explanation entered if reported hours differ from normal weekly hours"});
 return out;
}
function renderChecks(refreshMissing=true){
 if(refreshMissing&&typeof renderMissingDetails==='function')renderMissingDetails();
 if($('preparedfor'))$('preparedfor').textContent=[$('p_first').value,$('p_last').value].filter(Boolean).join(' ')||'Your time study';
 if($("reviewshifts"))$("reviewshifts").innerHTML=S.shifts.filter(s=>s.use).map(s=>`<p>${esc(s.name)} · ${esc(new Date(s.start).toLocaleString())} → ${esc(new Date(s.end).toLocaleString())} (Pacific)</p>`).join("")||"<p>No calendar imported.</p>";
 $("checks").innerHTML=checks().map(c=>`<li class="${c.ok?'pass':'fail'}">${c.t}</li>`).join("");
 const total=CONFIG.days.reduce((v,D)=>v+dayTotal(D.d),0),normal=Number($("p_hpw").value)||0;
 $("weeksummary").innerHTML=`<b>${total.toFixed(2)} hours prepared</b> · ${normal.toFixed(2)} normal weekly hours<table><tr><th>Date</th><th>Hours / activity</th><th></th></tr>${CONFIG.days.map(D=>`<tr><td>${D.label} ${D.tt}</td><td>${dayTotal(D.d).toFixed(2)} h<br><span class="muted">${CONFIG.rows.filter(R=>S.hours[D.d][R.r].some(e=>Number(e.h)>0)).map(R=>esc(R.name)+' · '+S.hours[D.d][R.r].filter(e=>Number(e.h)>0).map(e=>esc(e.h)+'h / '+esc(e.c||'code pending coordinator review')).join(', ')).join('<br>')||(S.reviewed[D.d]&&S.off[D.d]?'Not worked / unpaid':'No hours entered — confirm unpaid or edit')}${S.reviewed[D.d]&&!dayErrors(D.d).length?' ✓':''}</span></td><td><button class="btn sec sm" onclick="S.day=${D.d};go(2)">Edit</button></td></tr>`).join('')}</table>`;
 if($('profilegap')){const missing=checks().slice(0,5).filter(c=>!c.ok);$('profilegap').classList.toggle('hidden',!missing.length);$('profilegaptext').textContent=missing.map(c=>c.t.replace(' entered','')).join('; ');}
 renderVariance();
}
function mailParts(){
 if(hasMissingCostCenters())return {to:CONFIG.email,sub:'Cost-center review needed: PNPP '+CONFIG.sfy+' '+CONFIG.quarter,body:'Hello,\n\nPlease help confirm the cost-center codes for my prepared '+CONFIG.tsDates+' time-study draft. The draft cover identifies the affected dates. This is a request for coding review, not a final signed submission.\n\nThank you'};
 const last=$("p_last").value||"", first=$("p_first").value||"";
  return { to: CONFIG.email,
    sub: "PNPP Time Study SFY "+CONFIG.sfy+" "+CONFIG.quarter+" - "+last+", "+first,
    body: "Hello,\n\nAttached is my completed Non-Physician Practitioner time study form for SFY "+CONFIG.sfy+" "+CONFIG.quarter+" ("+CONFIG.tsDates+").\n\nName: "+first+" "+last+"\nEmployee #: "+$("p_emp").value+"\nDepartment: "+$("p_dept").value+"\n\nThank you,\n"+first+" "+last+"\n"+$("p_phone").value }; }
function openMail(how){ const m=mailParts();
  if(how==="copy"){ const txt="To: "+m.to+"\nSubject: "+m.sub+"\n\n"+m.body;
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(()=>alert("Email text copied. Paste into any email and attach the downloaded PDF."),()=>prompt("Copy this:",txt));
    else prompt("Copy this:",txt); return; }
  if(how==="outlook"){ window.open("https://outlook.office.com/mail/deeplink/compose?to="+encodeURIComponent(m.to)+"&subject="+encodeURIComponent(m.sub)+"&body="+encodeURIComponent(m.body),"_blank"); return; }
  if(how==="gmail"){ window.open("https://mail.google.com/mail/?view=cm&fs=1&to="+encodeURIComponent(m.to)+"&su="+encodeURIComponent(m.sub)+"&body="+encodeURIComponent(m.body),"_blank"); return; }
  location.href="mailto:"+m.to+"?subject="+encodeURIComponent(m.sub)+"&body="+encodeURIComponent(m.body); }

/* ================= PDF GENERATION ================= */
const TEMPLATE = "assets/ahs-2026-27-q1.pdf";
async function buildPDF({allowMissingCostCenters=false}={}){
  const draft=allowMissingCostCenters&&hasMissingCostCenters();
  const failures=checks({allowMissingCostCenters}).filter(c=>!c.ok);if(failures.length)throw new Error("Complete the review checks: "+failures.map(c=>c.t).join("; "));
  const {PDFDocument, StandardFonts} = PDFLib;
  const response=await fetch(TEMPLATE);if(!response.ok)throw new Error("Current AHS form could not be loaded. Your draft is still here; try again.");
  const doc=await PDFDocument.load(await response.arrayBuffer());
    const form = doc.getForm();
    const set = (name,val)=>{ try{ const f=form.getTextField(name); const ro=f.isReadOnly(); if(ro)f.disableReadOnly(); f.setText(String(val??"")); if(ro)f.enableReadOnly(); }catch(e){throw new Error("Could not fill required PDF field: "+name+". "+e.message);} };

    const P={last:$("p_last").value,first:$("p_first").value,mi:$("p_mi").value,emp:$("p_emp").value,fac:$("p_fac").value,dept:$("p_dept").value,hpw:$("p_hpw").value,phone:$("p_phone").value,job:$("p_job").value};

    // headers + cost-center legend on each daily page
    for(const D of CONFIG.days){ const d=D.d;
      set(`State Fiscal Year D${d}`,CONFIG.sfy); set(`Quarter D${d}`,CONFIG.quarter);
      set(`Last Name D${d}`,P.last); set(`First Name D${d}`,P.first); set(`Middle Initial D${d}`,P.mi);
      set("Employee Number",P.emp); set("Facility/Hospital",P.fac); set("Department",P.dept);
      set(`Normal Paid Work Hours Per Week D${d}`,P.hpw);
      set(`IP Dept Code D${d}`,$("cc_ip").value); set(`OP Dept Code D${d}`,$("cc_op").value); set(`ER Dept Code D${d}`,$("cc_er").value);
      if($("cc_oth_name").value||$("cc_oth").value){ set(`Optional Cost Center E1 D${d}`,$("cc_oth_name").value); set(`Optional Cost Center Code E1 D${d}`,$("cc_oth").value); }
    }
    // Date fields for the verified September template.
    { const WN=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const MN=["January","February","March","April","May","June","July","August","September","October","November","December"];
      CONFIG.days.forEach((D,ix)=>{ const [Y,M,Dd]=D.date.split("-").map(Number); const dt=new Date(Y,M-1,Dd);
        const s=WN[dt.getDay()]+" "+MN[M-1]+" "+Dd+", "+Y;
        set("Day "+(ix+1)+" Date", s); set("Day "+(ix+1)+" Date pg"+(2*(ix+1)+3), s); }); }
    // hours grid + computed totals
    for(const D of CONFIG.days){ const d=D.d; let dayT=0; const colT={1:0,2:0,3:0};
      for(const R of CONFIG.rows){ let rowT=0;
        S.hours[d][R.r].forEach((e,i)=>{ const h=parseFloat(e.h)||0; if(h>0){
          set(`${R.r} Hours D${d}E${i+1}`,h.toFixed(2)); set(`${R.r} CCC D${d}E${i+1}`,e.c);
          rowT+=h; colT[i+1]+=h; } });
        if(rowT>0) set(`${R.r} Total Hours D${d}`,rowT.toFixed(2));
        if(R.specify && S.specify[R.r+"_"+d]) set(`${R.r} Specify D${d}`,S.specify[R.r+"_"+d]);
        dayT+=rowT; }
      for(let e=1;e<=3;e++) if(colT[e]>0) set(`D${d}E${e} Total Hours`,colT[e].toFixed(2));
      if(dayT>0) set(`Total Hours Day ${d}`,dayT.toFixed(2));
    }
    // signature block (page with Day 7)
    set("Telephone Number D7",P.phone);
    set('Justification for "Normal Hours Per Week not matching Total Hours', $("variance").value.trim());
    // activity examples page (pg 18)
    set("Last Name pg18",P.last); set("First Name pg18",P.first); set("Middle Initial pg18",P.mi);
    set("Employee Number pg18",P.emp); set("Facility/Hospital pg18",P.fac);
    set("Job Classification/Position",P.job); set("TS Dates",CONFIG.tsDates);

    // Explicitly unpaid days are crossed out on both daily grids, leaving headers and signature areas intact.
    for(const D of CONFIG.days){if(!S.off[D.d])continue;for(const ix of [3+2*(D.d-1),4+2*(D.d-1)]){
      const pg=doc.getPage(ix);const first=ix%2===1;const bounds=first?{x1:40,y1:40,x2:975,y2:355}:{x1:40,y1:365,x2:975,y2:510};
      pg.drawLine({start:{x:bounds.x1,y:bounds.y1},end:{x:bounds.x2,y:bounds.y2},thickness:1,color:PDFLib.rgb(.45,.45,.45)});
      pg.drawText("NOT WORKED / UNPAID",{x:430,y:first?285:460,size:13,color:PDFLib.rgb(.25,.25,.25)});
    }}
    const helv = await doc.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(helv);
    if(draft){
      const cover=doc.insertPage(0,[612,792]);
      cover.drawText('DRAFT - COST CENTER REVIEW REQUIRED',{x:36,y:730,size:18,font:helv,color:PDFLib.rgb(.65,.15,.05)});
      cover.drawText('Do not sign or submit until the missing codes are completed.',{x:36,y:690,size:12,font:helv});
      cover.drawText('Prepared hours and provider details follow on the official form.',{x:36,y:665,size:12,font:helv});
      const dates=CONFIG.days.filter(D=>CONFIG.rows.some(R=>S.hours[D.d][R.r].some(e=>Number(e.h)>0&&!e.c.trim()))).map(D=>D.tt).join(', ');
      cover.drawText('Dates needing coding: '+dates,{x:36,y:625,size:11,font:helv});
      cover.drawText('Coordinator: confirm the work locations and insert the correct codes.',{x:36,y:600,size:11,font:helv});
    }
    const bytes = await doc.save();
  const P2={last:$("p_last").value};
  const fname="PNPP_TimeStudy_"+CONFIG.quarter+"_SFY"+CONFIG.sfy.replace("/","-")+"_"+((P2.last||"Form").replace(/\W+/g,""))+".pdf";
  return {bytes,fname:draft?fname.replace(/\.pdf$/,'_DRAFT_COST_CENTER_REVIEW.pdf'):fname,signed:false,draft};
}
async function generatePDF(){
 const err=$("generr");err.classList.add("hidden");const btn=$("genbtn");
 try{btn.disabled=true;btn.textContent="Preparing PDF…";const {bytes,fname,draft}=await buildPDF({allowMissingCostCenters:hasMissingCostCenters()});const url=URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));const a=document.createElement("a");a.href=url;a.download=fname;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);$("genok").textContent=draft?"Draft download requested. Missing codes are flagged on its cover. Have the coordinator complete the codes before signing or submitting.":"PDF download requested. Check your browser downloads, review the form, then sign and arrange supervisor/reviewer signature. Nothing has been submitted.";$("genok").classList.remove("hidden");}
 catch(e){err.textContent=e.message;err.classList.remove("hidden");renderChecks();}
 finally{btn.disabled=false;btn.textContent=hasMissingCostCenters()?"Download draft for coordinator review":"Download PDF to review and sign";}
}
applyPeriod("2026-09-24");loadState();renderSteps();
PFIELDS.forEach(k=>$(k).addEventListener("input",()=>{saveState();if(S.step===3)renderChecks();}));
const requested=new URLSearchParams(location.search).get("study");if(requested&&requested!=="2026-09-24")$("savestatus").textContent="That link is for another study. This version only supports September 24–30, 2026.";
