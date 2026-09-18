const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
async function app(stored = {}) {
  const html = fs.readFileSync('index.html','utf8');
  const dom = new JSDOM(html,{url:'https://timestudy.moteops.tech/',runScripts:'dangerously'});
  const w=dom.window; w.eval=code=>require('node:vm').runInContext(code,dom.getInternalVMContext());
  w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};
  Object.entries(stored).forEach(([k,v])=>w.localStorage.setItem(k,JSON.stringify(v)));
  w.fetch=async url=>{ const name=String(url).split('?')[0]; const data=fs.readFileSync(name); return {ok:true,json:async()=>JSON.parse(data),arrayBuffer:async()=>new w.Uint8Array(data).buffer}; };
  w.eval(fs.readFileSync(require.resolve('pdf-lib/dist/pdf-lib.min.js'),'utf8'));
  const code=fs.existsSync('app.js')?fs.readFileSync('app.js','utf8'):Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/g)).map(x=>x[1]).join('\n');
  w.eval(code);
  await new Promise(r=>setTimeout(r,20));
  return w;
}
function seed(w) {
  w.eval(`applyPeriod('2026-09-24'); S.hours=blank(); S.reviewed={}; S.paid={}; S.off={}; CONFIG.days.forEach(D=>{S.reviewed[D.d]=true;S.paid[D.d]=D.d===1?'10':'0';S.off[D.d]=D.d!==1;}); S.hours[1]['1']=[{h:'10',c:'12345'}];`);
  for(const [id,v] of Object.entries({p_last:'Example',p_first:'Test',p_emp:'TEST-ONLY',p_fac:'AHS',p_dept:'Emergency',p_job:'PA',p_hpw:'10',p_phone:'555-0100',cc_er:'12345'}))w.document.getElementById(id).value=v;
}
test('fresh colleague opens the September study, not an expired quarter',async()=>{const w=await app();assert.equal(w.eval('CONFIG.days[0].date'),'2026-09-24');w.close();});
test('colleague link never copies provider identity or calendar credentials',async()=>{const w=await app();seed(w);let copied='';w.navigator.clipboard={writeText:async s=>{copied=s;}};w.copyLink();await Promise.resolve();const u=new URL(copied);assert.equal(u.searchParams.get('first'),null);assert.equal(u.searchParams.get('emp'),null);assert.equal(u.searchParams.get('study'),'2026-09-24');w.close();});
test('a legacy saved signature is not automatically applied to another study',async()=>{const w=await app({pnpp_sig_applied:'old-signature'});assert.ok(!w.eval('S.appliedSig'));w.close();});
test('negative hours block export rather than disappear from the PDF',async()=>{const w=await app();seed(w);w.eval("S.hours[1]['2']=[{h:'-1',c:'12345'}]");await assert.rejects(()=>w.buildPDF(),/hours|quarter|negative|check/i);w.close();});
test('unreviewed zero days cannot silently become days off',async()=>{const w=await app();seed(w);w.eval('S.reviewed[7]=false');await assert.rejects(()=>w.buildPDF(),/review|day|check/i);w.close();});
test('weekly mismatch needs an explanation on the revised form',async()=>{const w=await app();seed(w);w.document.getElementById('p_hpw').value='40';await assert.rejects(()=>w.buildPDF(),/explanation|difference|check/i);w.close();});
test('completed export fills revised shared fields and leaves signature fields unsigned',async()=>{const w=await app();seed(w);const {bytes}=await w.buildPDF();const doc=await w.PDFLib.PDFDocument.load(bytes);const f=doc.getForm();assert.equal(f.getTextField('Employee Number').getText(),'TEST-ONLY');assert.equal(f.getTextField('Department').getText(),'Emergency');assert.equal(f.getTextField('Job Classification/Position').getText(),'PA');assert.equal(f.getTextField('Total Hours Day 1').getText(),'10.00');assert.equal(f.getTextField('Day 7 Date').getText(),'Wednesday September 30, 2026');assert.equal(f.getField('Employee Signature').acroField.dict.has(w.PDFLib.PDFName.of('V')),false);w.close();});
test('overnight shifts split into the two correct calendar days',async()=>{const w=await app();w.document.getElementById('cc_ip').value='12345';w.parseTxtRegex('9/24 3pm to 1am');w.applyShifts();assert.equal(w.eval('dayTotal(1)'),9);assert.equal(w.eval('dayTotal(2)'),1);assert.equal(w.eval('S.reviewed[1]'),undefined);w.close();});
test('out-of-period dates never borrow an earlier valid day',async()=>{const w=await app();w.parseTxtRegex('9/24 7am to 5pm\n10/1 7am to 5pm');assert.equal(w.eval('S.shifts.length'),1);w.close();});
test('invalid clock times never roll into a different date',async()=>{const w=await app();w.parseTxtRegex('9/24 25am to 26pm');assert.equal(w.eval('S.shifts.length'),0);w.close();});
test('each entry must be a quarter-hour even if the total is a quarter-hour',async()=>{const w=await app();seed(w);w.eval("S.hours[1]['1']=[{h:'9.875',c:'12345'}];S.hours[1]['2']=[{h:'.125',c:'12345'}]");await assert.rejects(()=>w.buildPDF(),/check/i);w.close();});
test('editing an already checked day invalidates its confirmation',async()=>{const w=await app();seed(w);w.setH(1,'1',0,'9');assert.equal(w.eval('S.reviewed[1]'),false);w.close();});
test('an explanation is exported into the revised justification field',async()=>{const w=await app();seed(w);w.document.getElementById('p_hpw').value='40';w.document.getElementById('variance').value='Scheduled for fewer shifts.';const {bytes}=await w.buildPDF();const doc=await w.PDFLib.PDFDocument.load(bytes);assert.equal(doc.getForm().getTextField('Justification for "Normal Hours Per Week not matching Total Hours').getText(),'Scheduled for fewer shifts.');if(process.env.QA_OUTPUT)fs.writeFileSync(process.env.QA_OUTPUT,bytes);w.close();});
test('draft survives reopening without restoring old-period data or a signature',async()=>{let w=await app();seed(w);w.saveState();const saved={};for(const k of Object.keys(w.localStorage))saved[k]=JSON.parse(w.localStorage.getItem(k));w.close();w=await app(saved);assert.equal(w.document.getElementById('p_emp').value,'TEST-ONLY');assert.equal(w.eval('dayTotal(1)'),10);assert.ok(!w.eval('S.appliedSig'));w.close();});
test('moving through the shifts step does not overwrite corrected activity hours',async()=>{const w=await app();seed(w);w.eval("S.shifts=[{start:'2026-09-24T07:00:00',end:'2026-09-24T19:00:00',name:'shift',use:true}]");w.go(1);const b=[...w.document.querySelectorAll('#panel1 button')].find(b=>b.textContent.includes('Continue to daily'));b.click();assert.equal(w.eval('dayTotal(1)'),10);w.close();});
test('non-quarter-hour shifts are not silently rounded into reported hours',async()=>{const w=await app();w.parseTxtRegex('9/24 7:10am to 5pm');w.applyShifts();assert.equal(w.eval('dayTotal(1)'),0);w.close();});
test('a partially typed hour is saved before the field loses focus',async()=>{const w=await app();seed(w);w.go(2);const input=w.document.querySelector('[aria-label="00001 hours entry 1"]');input.value='9.5';input.dispatchEvent(new w.Event('input',{bubbles:true}));const draft=JSON.parse(w.localStorage.getItem('pnpp_ts_v2:2026-27|Q1|2026-09-24'));assert.equal(draft.hours[1]['1'][0].h,'9.5');assert.equal(draft.reviewed[1],false);w.close();});
test('a shift beginning the night before the study contributes only in-window hours',async()=>{const w=await app();w.parseTxtRegex('9/23 11pm to 7am');w.applyShifts();assert.equal(w.eval('dayTotal(1)'),7);w.close();});
