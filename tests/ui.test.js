import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {pdfData} from './pdf-fixtures.js';
import {pdfLogicalText} from './pdf-read.js';
const environment=new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>',{url:'http://localhost:5180/'}),win=environment.window;
for(const key of ['window','document','navigator','HTMLElement','Element','Node','DOMParser','XMLSerializer','HTMLStyleElement','CSSStyleSheet'])Object.defineProperty(globalThis,key,{value:key==='window'?win:win[key],configurable:true});
for(const key of ['localStorage','sessionStorage','indexedDB'])Object.defineProperty(win,key,{get(){throw Error('Storage forbidden');}});
Object.defineProperty(document,'cookie',{get(){return ''},set(){throw Error('Cookies forbidden');}});
globalThis.fetch=()=>{throw Error('No network permitted');};
Object.defineProperty(globalThis,'getComputedStyle',{value:win.getComputedStyle.bind(win),configurable:true});
const {mountApp}=await import('../src/app.js');
const root=document.getElementById('app'),blobs=new Map(),downloads=[];
let sequence=0;URL.createObjectURL=blob=>{const url=`blob:http://localhost:5180/${++sequence}`;blobs.set(url,blob);return url;};URL.revokeObjectURL=()=>{};
win.HTMLAnchorElement.prototype.click=function(){downloads.push({href:this.href,name:this.download});};
const click=id=>{const e=document.getElementById(id);assert.ok(e,id);e.click();};
const change=(id,value)=>{const e=document.getElementById(id);assert.ok(e,id);e.value=value;e.dispatchEvent(new win.Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));};
const fill=(data,keys)=>keys.forEach(k=>change(k,data[k]));
const next=()=>click('next-button');
test('header language switch is removed; identity date fields follow the selected document',()=>{
 const app=mountApp(root);try{
  assert.equal(root.querySelector('header [data-language]'),null);
  assert.equal(root.querySelectorAll('.language-card').length,2);next();
  assert.ok(document.getElementById('employerGender').required);
  change('employerIdType','cnie');assert.equal(document.getElementById('employerIssueDate').disabled,true);assert.equal(document.getElementById('employerExpiryDate').disabled,false);
  change('employerExpiryDate','2035-01-01');
  for(const type of ['passport','residence']){change('employerIdType',type);assert.equal(document.getElementById('employerIssueDate').required,true);assert.equal(document.getElementById('employerIssueDate').disabled,false);assert.equal(document.getElementById('employerExpiryDate').required,true);}
  assert.ok(root.textContent.includes('بطاقة الإقامة'));assert.ok(!root.textContent.includes('سند الإقامة'));
  change('employerIdType','other');assert.equal(document.getElementById('employerExpiryDate').disabled,true);
  change('employerIdType','cnie');assert.equal(document.getElementById('employerExpiryDate').value,'2035-01-01');
 }finally{app.destroy();}
});
const wait=async()=>{for(let n=0;n<200;n++){if(document.getElementById('pdf-frame'))return;await new Promise(r=>setTimeout(r,20));}assert.fail(document.getElementById('status')?.textContent||'Preview timeout');};
function enter(data){
 if(data.language==='fr')root.querySelector('[data-language="fr"]').click();next();
 fill(data,['employerFirst','employerLast','employerAddress','employerGender','employerIdType','employerId','employerIssuePlace','employerExpiryDate']);next();
 fill(data,['workerFirst','workerLast','gender','workerIdType','workerId','workerIssuePlace','workerExpiryDate','birth','marital']);next();
 fill(data,['contractType','start','role']);if(data.contractType==='CDI')change('probationDays',data.probationDays);if(data.contractType==='CDD')change('end',data.end);for(const task of data.tasks){const e=root.querySelector(`input[name="task"][value="${task}"]`);e.checked=true;e.dispatchEvent(new win.Event('change',{bubbles:true}));}if(data.tasks.includes('other'))change('otherTask',data.otherTask);next();
 fill(data,['hours','salary']);
}
test('changing the start date routes an expired identity back to its editable stage without losing data',()=>{
 const app=mountApp(root);try{
  const data=pdfData('ar',{employerExpiryDate:'2026-12-31'});enter(data);click('back-button');
  change('start','2027-01-02');next();
  assert.equal(document.getElementById('employerExpiryDate').value,'2026-12-31');
  assert.ok(document.getElementById('employerExpiryDate-error').textContent);
  assert.equal(document.getElementById('employerFirst').value,data.employerFirst);
  change('employerExpiryDate','2035-01-01');next();assert.equal(document.getElementById('workerFirst').value,data.workerFirst);
 }finally{app.destroy();}
});
for(const lang of ['ar','fr'])test(`${lang}: staged form gates progress, previews real PDF, preserves edits and downloads exactly the displayed bytes`,async()=>{
 downloads.length=0;const app=mountApp(root);try{
  assert.equal(root.querySelectorAll('.progress li').length,7);assert.equal(root.querySelectorAll('input').length,0);next();next();assert.equal(document.getElementById('employerFirst').getAttribute('aria-invalid'),'true');click('back-button');
  const d=pdfData(lang,{probationDays:'7'});enter(d);change('salary','2000');next();assert.ok(document.getElementById('salary-error').textContent);assert.ok(root.textContent.includes('2236.42'));
  assert.equal(root.querySelector('.wage-panel'),null);assert.equal(root.querySelector('dl'),null);
  change('salary','700');assert.ok(document.getElementById('salary-error').textContent.includes(lang==='ar'?'(2236.42 درهم)':'(2236.42 MAD)'));change('salary','2000');
  change('hours','24');assert.ok(document.getElementById('salary-error').textContent==='');assert.equal(document.getElementById('salary').value,'2000');change('hours','48');change('salary','2236.42');next();change('rest','fri');click('preview-button');await wait();
  assert.equal(document.documentElement.dir,lang==='ar'?'rtl':'ltr');const source=document.getElementById('pdf-frame').src.split('#')[0];const before=new Uint8Array(await blobs.get(source).arrayBuffer());const parsed=await pdfLogicalText(before);assert.ok(parsed.text.includes(d.workerFirst));assert.ok(parsed.text.includes(lang==='ar'?'اختبار مدتها 7 يوما':'période d’essai de 7 Jours')); assert.ok(parsed.text.includes(lang==='ar'?'المادة 7':'Article 7'));assert.ok(!/[{}]|\.{3}/.test(parsed.text));
  change('pdf-page','2');change('pdf-zoom','125');assert.match(document.getElementById('pdf-frame').src,/page=2&zoom=125/);
  click('edit-button');assert.equal(document.getElementById('employerFirst').value,d.employerFirst);change('employerFirst',lang==='ar'?'مشغل معدل':'Edited employer');next();assert.equal(document.getElementById('workerFirst').value,d.workerFirst);change('workerFirst',lang==='ar'?'عاملة معدلة':'Edited worker');next();next();next();click('preview-button');await wait();
  const url=document.getElementById('pdf-frame').src.split('#')[0],bytes=new Uint8Array(await blobs.get(url).arrayBuffer());const updated=await pdfLogicalText(bytes);assert.ok(updated.text.includes(lang==='ar'?'مشغل معدل':'Edited employer'));assert.ok(updated.text.includes(lang==='ar'?'عاملة معدلة':'Edited worker'));click('download-button');assert.equal(downloads.length,1);assert.equal(downloads[0].href,url);assert.match(downloads[0].name,/\.pdf$/);assert.equal(blobs.get(url).type,'application/pdf');
  assert.equal(document.getElementById('word-download-button'),null);assert.equal(document.getElementById('preview-word'),null);assert.ok(root.querySelector('.duplex-note').textContent.includes(lang==='ar'?'Recto verso':'recto verso'));
  assert.equal(document.getElementById('pdf-frame').nextElementSibling.classList.contains('duplex-note'),true);
  assert.equal(downloads[0].name,`عقد العمل المنزلي - (${lang==='ar'?'عاملة معدلة':'Edited worker'} ${d.workerLast}).pdf`);
 }finally{app.destroy();}
});
test('DomContrat identity, flags, clear reset and CDD with free tasks work through the full form',async()=>{const app=mountApp(root);try{assert.equal(document.title,'DomContrat');assert.ok(root.querySelector('img[alt="DomContrat"]'));assert.equal(root.querySelector('.top-strip'),null);assert.equal(root.querySelectorAll('.country-flag').length,2);assert.ok(root.querySelector('#reset-button.new-contract-button'));const custom='تنظيم مكتبة البيت وترتيب الوثائق المنزلية';const d=pdfData('ar',{contractType:'CDD',end:'2026-12-23',tasks:['other'],otherTask:custom});enter(d);next();change('rest','fri');click('preview-button');await wait();const url=document.getElementById('pdf-frame').src.split('#')[0],bytes=new Uint8Array(await blobs.get(url).arrayBuffer()),parsed=await pdfLogicalText(bytes);assert.ok(parsed.text.includes(custom));assert.ok(parsed.text.includes('23/12/2026'));assert.ok(!parsed.text.includes('اختبار مدتها 15'));click('edit-button');next();next();assert.equal(document.getElementById('otherTask').tagName,'TEXTAREA');assert.equal(document.getElementById('otherTask').value,custom);assert.equal(document.getElementById('end').value,d.end);}finally{app.destroy();}});
for(const lang of ['ar','fr'])test(`${lang}: free additional benefits survive editing and appear inside the contract`,async()=>{
 const app=mountApp(root);try{
  const data=pdfData(lang);enter(data);next();change('rest','fri');change('benefits','both');
  const custom=lang==='ar'?'النقل إلى مكان العمل — اختبار':'Transport vers le lieu de travail — test';
  assert.equal(document.getElementById('otherBenefits').tagName,'TEXTAREA');change('otherBenefits',custom);
  click('preview-button');await wait();let source=document.getElementById('pdf-frame').src.split('#')[0];
  const text=(await pdfLogicalText(new Uint8Array(await blobs.get(source).arrayBuffer()))).text;
  assert.ok(text.includes(custom));assert.ok(text.includes(lang==='ar'?'المادة 8':'Article 8'));assert.ok(!/Annexe|ملحق/.test(text));
  click('edit-button');next();next();next();next();assert.equal(document.getElementById('otherBenefits').value,custom);assert.equal(document.getElementById('benefits').value,'both');
 }finally{app.destroy();}
});
test('failed PDF generation retains data and enables retry',async()=>{
 const app=mountApp(root,{generatePdf:async()=>{throw Error('Synthetic failure');}});try{enter(pdfData());next();change('rest','fri');click('preview-button');for(let n=0;n<20&&!document.getElementById('status').textContent.includes('تعذر');n++)await new Promise(r=>setTimeout(r,5));assert.equal(document.getElementById('rest').value,'fri');assert.equal(document.getElementById('preview-button').disabled,false);assert.ok(document.getElementById('status').textContent.includes('تعذر'));assert.equal(document.getElementById('pdf-frame'),null);}finally{app.destroy();}
});

test('automatic role is readonly, changes with sex, and official footer links are explicit external navigation',()=>{
 const app=mountApp(root);try{
  assert.ok(root.querySelector('.legal-basis').textContent.includes('بتحديد شروط الشغل والتشغيل المتعلقة بالعاملات والعمال المنزليين'));
  const links=[...root.querySelectorAll('footer .official-sources a')];assert.equal(links.length,3);for(const link of links){assert.equal(new URL(link.href).hostname,'www.sgg.gov.ma');assert.equal(link.target,'_blank');assert.ok(link.rel.includes('noreferrer'));}
  const data=pdfData();enter(data);click('back-button');assert.equal(document.getElementById('role').readOnly,true);assert.equal(document.getElementById('role').value,'عاملة منزلية');change('role','تعديل غير مسموح');assert.equal(document.getElementById('role').value,'عاملة منزلية');
  click('back-button');change('gender','male');next();assert.equal(document.getElementById('role').value,'عامل منزلي');
 }finally{app.destroy();}
});

test('header is logo-only and footer repeats the logo with complete preparation credit',()=>{const app=mountApp(root);try{assert.equal(root.querySelector('header .brand'),null);assert.ok(!root.querySelector('header').textContent.includes('اللجنة الجهوية'));assert.equal(root.querySelectorAll('header img[alt="DomContrat"]').length,1);assert.equal(root.querySelectorAll('footer img.footer-logo').length,1);assert.ok(root.querySelector('footer .footer-credit').textContent.startsWith('هذه المنصة من إعداد اللجنة الجهوية'));next();const d=pdfData();fill(d,['employerFirst','employerLast','employerAddress','employerGender','employerIdType','employerId','employerIssuePlace','employerExpiryDate']);next();fill(d,['workerFirst','workerLast','gender','workerIdType','workerId','workerIssuePlace','workerExpiryDate','birth','marital']);next();change('contractType','CDI');const trial=document.getElementById('probationDays');assert.equal(trial.options.length,16);assert.equal(trial.closest('.field').previousElementSibling.dataset.field,'role');change('probationDays','7');change('contractType','CDD');assert.equal(trial.disabled,true);assert.equal(trial.closest('.field').hidden,true);change('contractType','CDI');assert.equal(trial.value,'7');}finally{app.destroy();}});
