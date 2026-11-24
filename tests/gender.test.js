import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {contractBlocks,generatePdfDocument} from '../src/pdf.js';
import {pdfData} from './pdf-fixtures.js';
import {pdfLogicalText} from './pdf-read.js';
for(const lang of ['ar','fr'])for(const gender of ['male','female'])test(`${lang}/${gender}: inflects worker references and retains seven articles and general legal clauses`,async()=>{
 const data=pdfData(lang,{gender,marital:'married',workerFirst:lang==='ar'?(gender==='male'?'محمد الاختباري':'فاطمة الاختبارية'):'Test',workerLast:lang==='ar'?'للتجربة':'Personne',role:lang==='ar'?(gender==='male'?'عامل منزلي':'عاملة منزلية'):'Service domestique'});
 const blocks=contractBlocks(data),text=blocks.map(b=>b.text).join('\n');assert.equal(blocks.filter(b=>b.kind==='heading').length,7);assert.ok(!/السيد\s*\(ة\)|\(ا\)|مهمته\(ا\)|Monsieur \(Madame\)|engagé\(e\)|soumis \(e\)/.test(text));
 if(lang==='ar'){
  assert.equal(blocks[0].text,'عقد العمل الخاص بالعاملة أو العامل المنزلي');
  for(const expected of ['- عطلة سنوية مدفوعة الأجر على ألا تقل مدتها عن يوم ونصف يوم عمل عن كل شهر؛','تطبق أحكام القانون رقم 19.12 بتحديد شروط الشغل والتشغيل المتعلقة بالعاملات والعمال المنزليين في كل ما لم يتم التنصيص عليه في هذا العقد النموذجي.','يمكن للطرفين أن يتفقا على تضمين هذا العقد بنودا أخرى تكون أكثر فائدة للعاملة أو العامل المنزلي فضلا عن ما هو منصوص عليه في القانون رقم 19.12 السالف الذكر، لاسيما ما يتعلق بتوفير الغذاء والمأوى.'])assert.ok(text.includes(expected));
  if(gender==='female'){for(const term of ['بصفتها','مهمتها في','تخضع السيدة','للسيدة:','تتقاضى السيدة','تستفيد السيدة','توقيع العاملة المنزلية','متزوجة'])assert.ok(text.includes(term),term);}
  else{assert.ok(!text.includes('السيدة'));for(const term of ['بصفته','مهمته في','يخضع السيد','للسيد:','يتقاضى السيد','يستفيد السيد','توقيع العامل المنزلي'])assert.ok(text.includes(term),term);}
 }else{assert.ok(text.includes(gender==='female'?'Madame est engagée':'Monsieur est engagé'));assert.ok(text.includes(gender==='female'?'est soumise':'est soumis'));}
 const generated=await generatePdfDocument(data),parsed=await pdfLogicalText(generated.bytes);assert.ok(parsed.text.includes(data.workerFirst));assert.ok(!/[{}]|\.{3}/.test(parsed.text));
 if(process.env.PDF_QA_DIR)fs.writeFileSync(`${process.env.PDF_QA_DIR}/${lang}-${gender}.pdf`,generated.bytes);
});
