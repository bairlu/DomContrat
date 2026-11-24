import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createContractPdf, contractBlocks } from '../src/pdf.js';
import { pdfData } from './pdf-fixtures.js';
import { PDFDocument, PDFDict, PDFName } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const fonts = { regular: new Uint8Array(fs.readFileSync(new URL('../public/fonts/Amiri-Regular.ttf', import.meta.url))), bold: new Uint8Array(fs.readFileSync(new URL('../public/fonts/Amiri-Bold.ttf', import.meta.url))) };
const compact = (s) => s.replace(/[\s\u200e\u200f\u202a-\u202e]/g, '');
for(const lang of ['ar','fr'])test(lang+': selected trial duration is printed in article 3',async()=>{
 for(const days of ['1','7','15']){
  const result=await createContractPdf(pdfData(lang,{probationDays:days}),fonts);
  const text=(await read(result)).join(' ');
  assert.ok(text.includes(lang==='ar'?`اختبار مدتها ${days} يوما`:`période d’essai de ${days} Jours`));
  if(days==='7'&&process.env.PDF_QA_DIR)fs.writeFileSync(`${process.env.PDF_QA_DIR}/${lang}-trial-7.pdf`,result.bytes);
 }
});
async function read(result) { const task = getDocument({ data: result.bytes.slice(), useSystemFonts: false }); try {
    const pdf = await task.promise;
    assert.equal(pdf.numPages, result.pageCount);
    const pages = [];
    for (let n = 1; n <= pdf.numPages; n++) {
        const content = await (await pdf.getPage(n)).getTextContent();
        pages.push(content.items.filter(i => 'str' in i).map(i => i.str).join(' ').replace(/\s+/g,' '));
    }
    return pages;
}
finally {
    await task.destroy();
} }
function checkLayout(result) { for (const p of result.placements) {
    assert.ok(p.y >= 54 && p.y <= 841.9 - 54, JSON.stringify(p));
    assert.ok(p.x >= 53 && p.x + p.width <= 595.3 - 53, JSON.stringify(p));
} for (let i = 0; i < result.placements.length; i++) {
    const p = result.placements[i];
    if (p.kind === 'heading' || p.kind === 'party')
        assert.equal(result.placements[i + 1]?.page, p.page, 'orphan heading');
} const signatures = result.placements.filter(p => p.kind === 'signature'); assert.ok(signatures.length >= 2); assert.equal(signatures[0].page, signatures[1].page); for (let page = 1; page <= result.pageCount; page++)
    assert.ok(result.placements.some(p => p.page === page && p.kind !== 'signature'), 'page contains only signatures'); }
for (const language of ['ar', 'fr']) {
    test(`${language}: real PDF preserves all contract text and logical Unicode, embeds fonts and has safe A4 placement`, async () => {
        const data = pdfData(language);
        const result = await createContractPdf(data, fonts);
        assert.equal(new TextDecoder().decode(result.bytes.slice(0, 5)), '%PDF-');
        checkLayout(result);
        const pages = await read(result);
        const full = pages.join(' ');
        {
            const actual = compact(full), expected = compact(contractBlocks(data).map(b => b.text).join(' '));
            let at = 0;
            while (at < actual.length && actual[at] === expected[at])
                at++;
            assert.ok(actual === expected, JSON.stringify({ at, actual: actual.slice(at - 30, at + 180), expected: expected.slice(at - 30, at + 180) }));
        }
        assert.ok(full.includes('2236.42'));
        assert.ok(full.includes('AB123456'));
        assert.ok(full.includes('23/11/2026'));
        assert.ok(!/[{}]|\.{3}|…|مساحة بيضاء|Lorem Ipsum/.test(full));
        assert.ok(!/[\ufb50-\ufefc]/.test(full));
        assert.equal(contractBlocks(data).filter(b => b.kind === 'heading').length, 7);
        assert.ok(!full.includes(language === 'ar' ? 'لمدة محددة في' : 'Pour une durée déterminée'));
        const parsed = await PDFDocument.load(result.bytes);
        for (const page of parsed.getPages()) {
            assert.ok(Math.abs(page.getWidth() - 595.28) < .1);
            assert.ok(Math.abs(page.getHeight() - 841.89) < .1);
        }
        const embedded = parsed.context.enumerateIndirectObjects().map(([, o]) => o).filter(o => o instanceof PDFDict && o.has(PDFName.of('FontFile2')));
        assert.equal(embedded.length, 2);
        assert.equal(new Set(embedded.map(font => String(font.get(PDFName.of('FontName'))))).size, 2, 'regular and bold fonts must have distinct PDF names to avoid reader cache collisions');
        if (process.env.PDF_QA_DIR) {
            fs.mkdirSync(process.env.PDF_QA_DIR, { recursive: true });
            fs.writeFileSync(`${process.env.PDF_QA_DIR}/${language}.pdf`, result.bytes);
        }
    });
    test(`${language}: long names, addresses and unbroken words wrap without clipping or orphan headings`, async () => {
        const data = pdfData(language, { employerFirst: ('عبد الرحمن '.repeat(13)).trim(), workerFirst: ('فاطمة الزهراء '.repeat(12)).trim(), employerAddress: ('عنوان طويل للاختبار A12، شارع المثال، '.repeat(13)).slice(0, 490), workerLast: 'A'.repeat(150), role: ('خدمة منزلية '.repeat(12)).trim() });
        const result = await createContractPdf(data, fonts);
        checkLayout(result);
        const full = (await read(result)).join(' ');
        const expected = contractBlocks(data).map(b => b.text).join(' ');
        assert.equal(compact(result.placements.map(p => p.text).join(' ')), compact(expected));
        assert.deepEqual(Array.from(compact(full)).sort(), Array.from(compact(expected)).sort());
        assert.ok(full.includes('2236.42'));
        assert.ok(compact(full).includes('A'.repeat(150)));
        if (process.env.PDF_QA_DIR)
            fs.writeFileSync(`${process.env.PDF_QA_DIR}/${language}-long.pdf`, result.bytes);
    });
    test(`${language}: changes update PDF and optional tasks/benefits remain conditional`, async () => {
        const data = pdfData(language, { employerFirst: 'اسم معدل', workerFirst: 'عاملة معدلة', tasks: ['other'], otherTask: language==='ar'?'تنظيم مكتبة البيت':'Organiser la bibliothèque de la maison', benefits: 'both' });
        const result = await createContractPdf(data, fonts);
        checkLayout(result);
        const text = (await read(result)).join(' ');
        assert.ok(text.includes('اسم معدل'));
        assert.ok(text.includes('عاملة معدلة'));
        assert.ok(text.includes(data.otherTask));
        assert.ok(text.includes(language === 'ar' ? 'المادة 8: المزايا' : 'Article 8 : Avantages'));
        assert.ok(text.includes('2236.42'));
        if (process.env.PDF_QA_DIR)
            fs.writeFileSync(`${process.env.PDF_QA_DIR}/${language}-benefits.pdf`, result.bytes);
    });
}
test('invalid input is blocked before PDF creation', async () => { await assert.rejects(() => createContractPdf(pdfData('ar', { salary: '2000' }), fonts), /VALIDATION/); await assert.rejects(() => createContractPdf(pdfData('ar', { workerFirst: '' }), fonts), /VALIDATION/);  });
test('unsupported glyphs cannot silently remove user data from a legal paragraph', async () => { await assert.rejects(() => createContractPdf(pdfData('ar', { employerAddress: 'عنوان اختبار 测试' }), fonts), /UNSUPPORTED_CHARACTERS/); });

for(const lang of ['ar','fr'])test(lang+': CDD generates with dates, days and no automatic trial; free tasks are printed literally',async()=>{const custom=lang==='ar'?'تنظيم مكتبة البيت وترتيب الوثائق المنزلية':'Organiser la bibliothèque et les documents du foyer';const data=pdfData(lang,{contractType:'CDD',end:'2026-12-23',tasks:['other'],otherTask:custom});const result=await createContractPdf(data,fonts);checkLayout(result);const text=(await read(result)).join(' ');assert.ok(text.includes(custom));assert.ok(text.includes('23/12/2026'));assert.ok(text.includes('30'));assert.ok(!text.includes(lang==='ar'?'لمدة غير محددة':'Pour une durée indéterminée'));assert.ok(!text.includes(lang==='ar'?'اختبار مدتها 15':'de 15 Jours'));const subtitle=contractBlocks(data).find(b=>b.kind==='subtitle').text;if(lang==='ar')assert.ok(!/[()]/.test(subtitle));if(process.env.PDF_QA_DIR)fs.writeFileSync(process.env.PDF_QA_DIR+'/'+lang+'-cdd.pdf',result.bytes);});
