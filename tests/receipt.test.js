import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {directorates,depositOffice} from '../src/directorates.js';
import {receiptBlocks,generateReceiptPdf,receiptFilename} from '../src/receipt.js';
import {pdfData} from './pdf-fixtures.js';
import {pdfLogicalText} from './pdf-read.js';
import {validate} from '../src/legal.js';
import {PDFDocument,PDFDict,PDFName} from 'pdf-lib';

test('official directory contains 12 regions and exactly the 54 published offices; cross-region choices are rejected',()=>{
 assert.equal(directorates.length,12);assert.equal(directorates.reduce((sum,region)=>sum+region.provinces.length,0),54);
 const ids=new Set();for(const region of directorates){assert.ok(region.provinces.length);assert.ok(region.source.startsWith('https://www.emploi.gov.ma/'));for(const office of region.provinces){assert.ok(!ids.has(office.id));ids.add(office.id);assert.ok(depositOffice(region.id,office.id));assert.ok(validate(pdfData('ar',{depositRegion:region.id,depositOffice:office.id})).depositOffice===undefined);}}
 assert.equal(depositOffice('souss-massa','fes-meknes-p0'),null);
 assert.ok(validate(pdfData('ar',{depositRegion:'souss-massa',depositOffice:'fes-meknes-p0'}),7).depositOffice);
 assert.ok(validate(pdfData('ar',{depositRegion:'invalid',depositOffice:'invalid'}),7).depositRegion);
 const source=fs.readFileSync(new URL('../src/directorates.js',import.meta.url),'utf8');assert.ok(!source.includes('@emploi.gov.ma'));assert.ok(!source.includes('المسؤول'));
});

for(const language of ['ar','fr'])test(`${language}: real receipt PDF includes selected authority and party identities, with blank administration approval`,async()=>{
 const data=pdfData(language),office=depositOffice(data.depositRegion,data.depositOffice,language),result=await generateReceiptPdf(data),parsed=await pdfLogicalText(result.bytes);
 assert.equal(new TextDecoder().decode(result.bytes.slice(0,5)),'%PDF-');assert.equal(result.pageCount,1);
 for(const value of [data.workerFirst,data.workerLast,data.employerFirst,data.employerLast,data.workerId,data.employerId,'01/01/2035',office.regional,office.provincial])assert.ok(parsed.text.replace(/\s/g,'').includes(value.replace(/\s/g,'')),value);
 assert.ok(parsed.text.includes(language==='ar'?'توقيع وخاتم الإدارة':'Signature et cachet de l’administration'));
 assert.ok(parsed.text.includes('__________________'));assert.ok(!/[{}]|DomContrat/.test(parsed.text));
 for(const row of result.placements){assert.ok(row.y>=54&&row.y<790);assert.ok(row.x>=53&&row.x+row.width<543);}
 const pdf=await PDFDocument.load(result.bytes);const images=pdf.context.enumerateIndirectObjects().filter(([,o])=>o?.dict instanceof PDFDict&&o.dict.get(PDFName.of('Subtype'))===PDFName.of('Image'));assert.ok(images.length>=1,'original official logo is embedded');
 assert.ok(receiptFilename(data).startsWith('وصل إيداع عقد العمل المنزلي - ('));assert.ok(receiptFilename(data).includes(data.workerLast));
 if(process.env.RECEIPT_QA_DIR){fs.mkdirSync(process.env.RECEIPT_QA_DIR,{recursive:true});fs.writeFileSync(`${process.env.RECEIPT_QA_DIR}/${language}-receipt.pdf`,result.bytes);}
});

test('receipt changes its office and parties after editing, handles long data, and never bypasses legal validation',async()=>{
 const data=pdfData('ar',{employerFirst:'مشغل معدل للاختبار',depositRegion:'beni-casablanca-settat',depositOffice:'beni-casablanca-settat-p0',employerAddress:'عنوان اصطناعي طويل '.repeat(20)});
 const receipt=await generateReceiptPdf(data),parsed=await pdfLogicalText(receipt.bytes);
 assert.ok(parsed.text.includes('مشغل معدل للاختبار'));assert.ok(parsed.text.includes('عين السبع الحي المحمدي'));assert.ok(!parsed.text.includes('شتوكة آيت بها'));
 for(const patch of [{salary:'700'},{birth:'2012-01-01'},{hours:'49'},{workerFirst:''},{depositOffice:'bad'}])await assert.rejects(()=>generateReceiptPdf(pdfData('ar',patch)),/VALIDATION|INVALID_DEPOSIT_OFFICE/);
 assert.equal(receiptBlocks(data).filter(block=>block.kind==='administration').length,1);
});
