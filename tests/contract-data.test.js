import {test} from 'node:test';
import assert from 'node:assert/strict';
import {professionalRole,contractFilename} from '../src/contract-data.js';
import {contractBlocks,generatePdfDocument} from '../src/pdf.js';
import {officialSources,law} from '../src/legal-config.js';
import {pdfData} from './pdf-fixtures.js';
import {pdfLogicalText} from './pdf-read.js';
test('download name includes the worker full name and safely handles filesystem punctuation',()=>{
 assert.equal(contractFilename({workerFirst:'أحمد',workerLast:'الاختباري'}),'عقد العمل المنزلي - (أحمد الاختباري).pdf');
 assert.equal(contractFilename({workerFirst:'  Test ',workerLast:'Nom'}),'عقد العمل المنزلي - (Test Nom).pdf');
 assert.ok(!/[<>:"/\\|?*]/.test(contractFilename({workerFirst:'Test:/',workerLast:'Name?'})));
 assert.throws(()=>contractFilename({}),/MISSING_WORKER_NAME/);
});
for(const language of ['ar','fr'])test(`${language}: professional role is derived and other tasks follow their explicit label`,async()=>{
 for(const gender of ['male','female']){
  const data=pdfData(language,{gender,role:'CUSTOM_ROLE_SHOULD_NOT_APPEAR',tasks:['other'],otherTask:language==='ar'?'تنظيم مكتبة البيت':'Organiser la bibliothèque'});
  const blocks=contractBlocks(data),text=blocks.map(block=>block.text).join(' ');
  assert.ok(!text.includes(data.role));assert.ok(text.includes(professionalRole(data)));
  assert.ok(text.includes(language==='ar'?'مهام أخرى مسموح بها قانونا: تنظيم مكتبة البيت':'Autres tâches légalement autorisées : Organiser la bibliothèque'));
  assert.ok(!/\S[؛;،,]/.test(text));
  const pdf=await generatePdfDocument(data),parsed=await pdfLogicalText(pdf.bytes);assert.ok(parsed.text.includes(data.otherTask));assert.ok(parsed.text.includes(professionalRole(data)));
 }
});
test('official references are HTTPS Gazette PDFs and keep the full law title',()=>{
 assert.equal(officialSources.length,3);
 for(const source of officialSources){const url=new URL(source.url);assert.equal(url.protocol,'https:');assert.equal(url.hostname,'www.sgg.gov.ma');assert.match(url.pathname,/\.pdf$/i);}
 assert.ok(officialSources[0].ar.includes(law.citationAr));assert.ok(officialSources[0].fr.includes(law.citationFr));
});
