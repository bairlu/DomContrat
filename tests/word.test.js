import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import PizZip from 'pizzip';
import {JSDOM} from 'jsdom';
import {generateWordDocument} from '../src/word.js';
import {contractBlocks} from '../src/pdf.js';
import {pdfData} from './pdf-fixtures.js';
const text=bytes=>{const zip=new PizZip(bytes),xml=zip.file('word/document.xml').asText();const document=new JSDOM(xml,{contentType:'application/xml'}).window.document;return {xml,document,text:Array.from(document.getElementsByTagName('w:t'),n=>n.textContent).join('')};};
for(const lang of ['ar','fr'])for(const type of ['CDI','CDD'])test(`${lang}/${type}: real editable DOCX matches the current complete contract, including sex, trial and free tasks`,()=>{
 for(const gender of ['male','female']){
  const data=pdfData(lang,{gender,contractType:type,end:type==='CDD'?'2026-12-23':'',probationDays:type==='CDI'?'7':'',tasks:['home','other'],otherTask:lang==='ar'?'تنظيم مكتبة البيت':'Organiser la bibliothèque'});
  const bytes=generateWordDocument(data);assert.equal(bytes[0],0x50);assert.equal(bytes[1],0x4b);
  const parsed=text(bytes),expected=contractBlocks(data).map(b=>(b.checked===undefined?'':b.checked?'☒ ':'☐ ')+b.text).join('');
  assert.equal(parsed.text,expected);assert.ok(!/[{}]/.test(parsed.text));assert.ok(parsed.xml.includes('w:pgSz w:w="11906" w:h="16838"'));assert.ok(parsed.xml.includes('w:cantSplit'));assert.equal(parsed.document.getElementsByTagName('w:tbl').length,1);assert.ok(!parsed.text.includes('DomContrat'));
  if(lang==='ar')assert.ok(parsed.xml.includes('w:bidi'));
  if(process.env.WORD_QA_DIR){fs.mkdirSync(process.env.WORD_QA_DIR,{recursive:true});fs.writeFileSync(`${process.env.WORD_QA_DIR}/${lang}-${type}-${gender}.docx`,bytes);}
 }
});
test('DOCX safely escapes long names, XML-like data and updates without losing fields',()=>{
 const d=pdfData('ar',{employerFirst:'اختبار <خاص> & آمن',employerAddress:'عنوان طويل '.repeat(40),workerLast:'A'.repeat(150),benefits:'both'});
 const a=text(generateWordDocument(d)),b=text(generateWordDocument({...d,workerFirst:'اسم معدل'}));assert.ok(a.text.includes(d.employerFirst));assert.ok(a.text.includes(d.employerAddress.trim()));assert.ok(b.text.includes('اسم معدل'));assert.ok(b.text.includes(d.workerLast));assert.ok(b.text.includes('2236.42'));assert.ok(b.text.includes('ملحق اتفاق'));assert.equal(b.document.getElementsByTagName('w:tbl').length,2);
});
test('DOCX export rejects incomplete, underage and unlawful wage data',()=>{
 for(const patch of [{salary:'2000'},{workerFirst:''},{hours:'49'},{birth:'2010-01-01'},{probationDays:'16'}])assert.throws(()=>generateWordDocument(pdfData('ar',patch)),/VALIDATION/);
});
