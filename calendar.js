/* QGenda import. Feed keys stay out of saved drafts and colleague links. */
const QGENDA_RELAY='https://timestudy-relay.mikedmote5258.workers.dev/?url=';
function validateQGendaURL(raw){
 let u;try{u=new URL(raw.trim().replace(/^webcal:/i,'https:'));}catch{throw new Error('Paste your QGenda calendar subscription link.');}
 if(u.protocol!=='https:'||u.hostname!=='app.qgenda.com'||u.port||u.username||u.password||u.pathname.toLowerCase()!=='/ical'||!u.searchParams.get('key'))throw new Error('Use your personal QGenda calendar subscription link (app.qgenda.com/ical?key=…), not the schedule page address.');
 u.hash='';return u.href;
}
// Represent Pacific wall-clock time in the same local-date model used by the form.
// This keeps a colleague traveling outside California on the correct study dates.
function pacificWall(date){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).map(x=>[x.type,x.value]));
 return new Date(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
}
function calendarTime(t,property){
 if(!t)throw new Error('A calendar event is missing its time.');
 if(t.isDate)return new Date(t.year,t.month-1,t.day);
 const tz=property?.getParameter('tzid');
 if(t.zone.tzid==='floating'){
  if(tz && !['America/Los_Angeles','US/Pacific','Pacific Standard Time'].includes(tz))throw new Error('Calendar time zone could not be resolved. Export the calendar with its time zone included.');
  return new Date(t.year,t.month-1,t.day,t.hour,t.minute,t.second);
 }
 return pacificWall(t.toJSDate());
}
function parseQGendaICS(raw){
 if(typeof raw!=='string'||raw.length>5_000_000||!raw.includes('BEGIN:VCALENDAR'))throw new Error('QGenda did not return a calendar. Check your subscription link.');
 ICAL.TimezoneService.reset();
 const root=new ICAL.Component(ICAL.parse(raw));
 for(const tz of root.getAllSubcomponents('vtimezone'))ICAL.TimezoneService.register(new ICAL.Timezone(tz));
 // Prefer the newest revision of a UID/recurrence-id; cancelled revisions supersede old shifts.
 const versions=new Map();
 for(const c of root.getAllSubcomponents('vevent')){
  const uid=c.getFirstPropertyValue('uid');if(!uid)throw new Error('An event is missing its calendar identifier.');
  const key=uid+'|'+String(c.getFirstPropertyValue('recurrence-id')||'');
  const rank=Number(c.getFirstPropertyValue('sequence')||0);
  const prior=versions.get(key);if(!prior||rank>=Number(prior.getFirstPropertyValue('sequence')||0))versions.set(key,c);
 }
 const components=[...versions.values()];const events=[];
 const add=(item,start,end)=>{
  if(String(item.component.getFirstPropertyValue('status')).toUpperCase()==='CANCELLED')return;
  const a=calendarTime(start,item.component.getFirstProperty('dtstart')),z=calendarTime(end,item.component.getFirstProperty('dtend')||item.component.getFirstProperty('dtstart'));
  if(z<=winStart()||a>=winEnd())return;
  // Availability blocks are not assignments, including QGenda's all-day blocks.
  if(/\bunavailable\b/i.test(item.summary||''))return;
  if(start.isDate||end.isDate)throw new Error('Your QGenda calendar contains all-day events. In QGenda calendar sync, turn off “Sync as all-day events” and retry so shift hours can be filled accurately.');
  if(!Number.isFinite(+a)||!Number.isFinite(+z)||z<=a||z-a>864e5)throw new Error('A shift has missing or invalid start/end times. Correct the QGenda calendar before importing.');
  events.push({start:a,end:z,name:item.summary||'QGenda shift'});
 };
 for(const c of components){
  if(c.hasProperty('recurrence-id')){
   const uid=c.getFirstPropertyValue('uid');if(components.some(x=>x.getFirstPropertyValue('uid')===uid&&!x.hasProperty('recurrence-id')))continue;
  }
  const e=new ICAL.Event(c,{exceptions:components.filter(x=>x.hasProperty('recurrence-id')&&x.getFirstPropertyValue('uid')===c.getFirstPropertyValue('uid'))});
  if(String(c.getFirstPropertyValue('status')).toUpperCase()==='CANCELLED')continue;
  if(e.isRecurring()){
   const types=e.getRecurrenceTypes();if(types.SECONDLY||types.MINUTELY||types.HOURLY)throw new Error('This calendar repeats more often than a daily shift. Use a personal shift calendar.');
   const iterator=e.iterator();let n=0,t;
   while((t=iterator.next())){
    if(++n>20000)throw new Error('This calendar has too many recurring shifts. Use a current personal calendar export.');
    if(calendarTime(t,c.getFirstProperty('dtstart'))>=new Date(2026,9,3))break;
    const o=e.getOccurrenceDetails(t);add(o.item,o.startDate,o.endDate);
   }
  }else add(e,e.startDate,e.endDate);
 }
 return events.sort((a,b)=>a.start-b.start);
}
async function importQGenda(){
 const status=$('qgendastatus'),btn=$('qgendabtn');
 try{
  const url=validateQGendaURL($('qgendaurl').value);btn.disabled=true;status.textContent='Reading your September 24–30 shifts…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);let response;
  try{response=await fetch(QGENDA_RELAY+encodeURIComponent(url),{signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});}catch{throw new Error('The calendar could not be loaded. Try again or import a calendar file below.');}finally{clearTimeout(timer);}
  if(!response.ok)throw new Error('QGenda could not be reached. Check the link and try again, or import a calendar file below.');
  const events=parseQGendaICS(await response.text());
  if(!events.length)throw new Error('No shifts found for September 24–30. Check that this is your personal calendar and the schedule is published. Existing entries were kept.');
  ingestShifts(events);status.textContent=events.length+' shifts found. Times are shown in Pacific time.';
  $('qgendaurl').value='';
  if(applyShifts()){go(3);$('importnotice').textContent='QGenda filled the week below. Confirm actual paid hours and activity allocation; edit only exceptions.';}
 }catch(e){status.textContent=e instanceof TypeError?'The calendar could not be loaded. Try again or import a calendar file below.':e.name==='AbortError'?'QGenda is unavailable or slow. Try again or import a calendar file below.':e.message;}
 finally{btn.disabled=false;}
}
async function importCalendarFile(file){
 if(!file)return;
 try{if(file.size>5_000_000)throw new Error('Calendar file is too large.');const events=parseQGendaICS(await file.text());if(!events.length)throw new Error('No shifts in this study week. Existing entries were kept.');ingestShifts(events);if(applyShifts())go(3);}
 catch(e){$('qgendastatus').textContent=e.message;}
}
function confirmWeek(){
 fillMissingCostCenters();
 // One explicit confirmation covers zero days as unpaid; import alone never does.
 const zero=CONFIG.days.filter(D=>dayTotal(D.d)===0);
 const oldPaid={...S.paid},oldOff={...S.off};
 zero.forEach(D=>{S.paid[D.d]='0';S.off[D.d]=true;});
 const errors=CONFIG.days.flatMap(D=>dayErrors(D.d).map(e=>D.tt+': '+e));
 if(errors.length){S.paid=oldPaid;S.off=oldOff;alert(errors.join('\n'));return false;}
 CONFIG.days.forEach(D=>S.reviewed[D.d]=true);saveState();renderChecks();return true;
}
function fillMissingCostCenters(){
 const cc=$('cc_'+$('cc_default').value)?.value.trim();if(!cc)return;
 for(const D of CONFIG.days)for(const R of CONFIG.rows)for(const e of S.hours[D.d][R.r])if(Number(e.h)>0&&!e.c.trim()){e.c=cc;S.reviewed[D.d]=false;}
}
async function importProviderPDF(bytes){
 const doc=await PDFLib.PDFDocument.load(bytes),f=doc.getForm();
 const mapping={p_last:['Last Name D1'],p_first:['First Name D1'],p_mi:['Middle Initial D1'],p_emp:['Employee Number','Employee Number D1','Employee Number pg18'],p_fac:['Facility/Hospital','Facility/Hospital D1'],p_dept:['Department','Department D1'],p_job:['Job Classification/Position'],p_hpw:['Normal Paid Work Hours Per Week D1'],p_phone:['Telephone Number D7'],cc_ip:['IP Dept Code D1'],cc_op:['OP Dept Code D1'],cc_er:['ER Dept Code D1'],cc_oth_name:['Optional Cost Center E1 D1'],cc_oth:['Optional Cost Center Code E1 D1']};
 const values={};
 for(const [id,names] of Object.entries(mapping))for(const name of names){try{const v=f.getTextField(name).getText()?.trim();if(v){values[id]=v;break;}}catch{}}
 const count=Object.keys(values).length;if(!count)throw new Error('This PDF has no readable provider fields. Use a previous completed, fillable AHS form or enter only the missing details.');
 for(const [id,v] of Object.entries(values))$(id).value=v;
 const centers=['ip','op','er','oth'].filter(k=>$('cc_'+k).value.trim());if(centers.length===1)$('cc_default').value=centers[0];
 fillMissingCostCenters();
 S.reviewed={};saveState();return count;
}
async function readProviderFile(file){
 if(!file)return;
 try{if(file.size>10_000_000)throw new Error('Use a PDF under 10 MB.');const n=await importProviderPDF(await file.arrayBuffer());$('profilestatus').textContent=n+' provider fields filled. Check these details once; previous hours and signatures were not copied.';}
 catch(e){$('profilestatus').textContent=e.message;}
}
// Open at the colleague's first action, not a long provider questionnaire.
go(1);
