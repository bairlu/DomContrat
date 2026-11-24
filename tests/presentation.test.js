import {test} from 'node:test';
import assert from 'node:assert/strict';
import PizZip from 'pizzip';
import {JSDOM} from 'jsdom';
import {contractBlocks,generatePdfDocument} from '../src/pdf.js';
import {generateWordDocument} from '../src/word.js';
import {validate} from '../src/legal.js';
import {pdfData} from './pdf-fixtures.js';
import {pdfLogicalText} from './pdf-read.js';

for(const language of ['ar','fr'])test(`${language}: optional benefits form article 8 before the signatures, with editable bold data`,async()=>{
 const custom=language==='ar'?'توفير النقل — ميزة اختبارية':'Transport — avantage de test';
 for(const benefits of ['', 'food','housing','both']){
  for(const otherBenefits of ['',custom]){
   const data=pdfData(language,{benefits,otherBenefits}),blocks=contractBlocks(data),extra=!!(benefits||otherBenefits);
   const headings=blocks.filter(block=>block.kind==='heading');assert.equal(headings.length,extra?8:7);
   assert.ok(blocks.every(block=>!block.pageBefore&&!/Annexe|ملحق/.test(block.text)));
   assert.equal(blocks.at(-1).kind,'signature');assert.equal(blocks.at(-2).kind,'signature');
   if(otherBenefits)assert.ok(blocks.find(block=>block.runs.some(run=>run.text===custom&&run.bold)));
   const xml=new PizZip(generateWordDocument(data)).file('word/document.xml').asText();
   const doc=new JSDOM(xml,{contentType:'application/xml'}).window.document;
   assert.equal(doc.getElementsByTagName('parsererror').length,0);assert.equal(doc.getElementsByTagName('w:tbl').length,1);
   const runs=[...doc.getElementsByTagName('w:r')];
   const worker=`${data.workerFirst} ${data.workerLast}`;
   const boldRuns=runs.filter(run=>run.getElementsByTagName('w:b').length).map(run=>run.textContent);
   assert.ok(boldRuns.includes(worker));assert.ok(boldRuns.includes(data.salary));
   assert.ok(!boldRuns.some(text=>text.includes(language==='ar'?'أجرا نقديا':'salaire en espèces')));
   assert.ok(xml.includes('w:ascii="Arial"'));assert.ok(xml.includes('w:sz w:val="32"'));
   if(otherBenefits){assert.ok(boldRuns.includes(custom));const pdf=await generatePdfDocument(data);const text=(await pdfLogicalText(pdf.bytes)).text;assert.ok(text.includes(custom));assert.ok(text.includes(language==='ar'?'المادة 8':'Article 8'));}
  }
 }
 assert.ok(validate(pdfData(language,{otherBenefits:'x'.repeat(3001)}),6).otherBenefits);
});
