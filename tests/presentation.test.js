import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contractBlocks,generatePdfDocument} from '../src/pdf.js';
import {validate,identityDateFields} from '../src/legal.js';
import {pdfData} from './pdf-fixtures.js';
import {pdfLogicalText} from './pdf-read.js';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

for(const language of ['ar','fr'])test(`${language}: identity types print their expiry and only applicable issue dates`,async()=>{
 for(const type of ['cnie','passport','residence','other']){
  const data=pdfData(language,{employerIdType:type,workerIdType:type});assert.deepEqual(validate(data),{});
  const text=contractBlocks(data).map(block=>block.text).join(' ');
  assert.equal(text.includes('01/01/2020'),type!=='cnie');assert.equal(text.includes('01/01/2035'),type!=='other');
  if(type==='residence')assert.ok(text.includes(language==='ar'?'بطاقة الإقامة':'Carte de séjour'));
  const pdf=await generatePdfDocument(data),extracted=await pdfLogicalText(pdf.bytes);assert.equal(extracted.text.includes('01/01/2035'),type!=='other');
  for(const prefix of ['employer','worker']){
   assert.equal(!!validate({...data,[prefix+'ExpiryDate']:'2026-01-01'})[prefix+'ExpiryDate'],type!=='other');
   assert.equal(!!validate({...data,[prefix+'ExpiryDate']:''})[prefix+'ExpiryDate'],type!=='other');
   assert.equal(identityDateFields(data,prefix).includes(prefix+'IssueDate'),type!=='cnie');
  }
 }
});

for(const language of ['ar','fr'])test(`${language}: both sexes, optional article 8, filled bold data and monthly wage`,async()=>{
 for(const employerGender of ['male','female'])for(const gender of ['male','female']){
  const data=pdfData(language,{employerGender,gender,benefits:'both',otherBenefits:language==='ar'?'النقل — بيانات اختبارية':'Transport — données fictives'});
  const blocks=contractBlocks(data),text=blocks.map(block=>block.text).join(' ');
  assert.equal(blocks.filter(block=>block.kind==='heading').length,8);assert.ok(blocks.every(block=>!block.pageBefore&&!/Annexe|ملحق/.test(block.text)));
  assert.equal(blocks.at(-1).kind,'signature');assert.equal(blocks.at(-2).kind,'signature');
  assert.ok(blocks.find(block=>block.runs.some(run=>run.text===data.otherBenefits&&run.bold)));assert.ok(blocks.find(block=>block.runs.some(run=>run.text===data.salary&&run.bold)));
  if(language==='ar'){
   assert.ok(text.includes('المادة 1:'));assert.ok(!text.includes('المادة الأولى'));assert.ok(text.includes('درهما شهريا.'));assert.ok(!/\S؛/.test(text));
   assert.equal(blocks.at(-2).text,employerGender==='female'?'توقيع المشغلة':'توقيع المشغل');assert.ok(text.includes(employerGender==='female'?'اتفقت المشغلة':'اتفق المشغل'));assert.ok(text.includes('كل يوم جمعة من الأسبوع'));
  }else{assert.ok(text.includes('dirhams par mois.'));assert.equal(blocks.at(-2).text,employerGender==='female'?'Signature de l’employeuse':'Signature de l’employeur');}
  const pdf=await generatePdfDocument(data),extracted=await pdfLogicalText(pdf.bytes);assert.ok(extracted.text.includes(data.otherBenefits));
 }
 assert.ok(validate(pdfData(language,{otherBenefits:'x'.repeat(3001)}),6).otherBenefits);
});

test('PDF footers number all actual pages, including long documents',async()=>{
 for(const patch of [{},{otherBenefits:'مزايا اختبارية إضافية '.repeat(100),benefits:'both'}]){
  const result=await generatePdfDocument(pdfData('ar',patch));assert.deepEqual(result.pageNumbers.map(row=>row.text),Array.from({length:result.pageCount},(_,i)=>`${i+1}/${result.pageCount}`));
  const task=getDocument({data:result.bytes.slice(),useSystemFonts:false});
  try{const doc=await task.promise;for(let page=1;page<=doc.numPages;page++){
   const content=await(await doc.getPage(page)).getTextContent();assert.ok(content.items.some(item=>item.str===`${page}/${doc.numPages}`&&item.transform[5]<45));
  }}finally{await task.destroy();}
 }
});

test('rest days use plain Arabic names without definite articles or diacritics',()=>{
 for(const [rest,day]of Object.entries({mon:'اثنين',tue:'ثلاثاء',wed:'أربعاء',thu:'خميس',fri:'جمعة',sat:'سبت',sun:'أحد'}))assert.ok(contractBlocks(pdfData('ar',{rest})).some(block=>block.text.includes(`راحة أسبوعية كل يوم ${day} من الأسبوع`)));
});
