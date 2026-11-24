import embeddedFonts from './pdf-fonts.js';
import { jsPDF } from 'jspdf';
import { normalizeArabicTextMap } from './pdf-unicode.js';
import { str, validate, duration } from './legal.js';
import { choices } from './i18n.js';
const clean = (value) => value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\s+/g, ' ').trim();
export function contractBlocks(d) {
    const ar = str(d, 'language') !== 'fr', c = choices[ar ? 'ar' : 'fr'];
    const v = (key) => clean(str(d, key));
    const label = (list, key) => list.find(row => row[0] === v(key))?.[1] ?? '';
    const date = (key) => v(key).split('-').reverse().join('/');
    const employer = clean(`${v('employerFirst')} ${v('employerLast')}`), worker = clean(`${v('workerFirst')} ${v('workerLast')}`);
    const female=v('gender')==='female';
    const title=ar?(female?'السيدة':'السيد'):(female?'Madame':'Monsieur');
    const marital=ar?({single:female?'عزباء':'أعزب',married:female?'متزوجة':'متزوج',divorced:female?'مطلقة':'مطلق',widowed:female?'أرملة':'أرمل'}[v('marital')]??''):({single:'Célibataire',married:female?'Mariée':'Marié',divorced:female?'Divorcée':'Divorcé',widowed:female?'Veuve':'Veuf'}[v('marital')]??'');
    const workerParty=ar?(female?'والعاملة المنزلية:':'والعامل المنزلي:'):(female?'La travailleuse domestique :':'Le travailleur domestique :');
    const workerSignature=ar?(female?'توقيع العاملة المنزلية':'توقيع العامل المنزلي'):(female?'Signature de la travailleuse domestique':'Signature du travailleur domestique');
    const b = (text, kind = 'body') => ({ text, kind });
    const blocks = ar ? [
        b('عقد العمل الخاص بالعاملة أو العامل المنزلي', 'title'),
        b('المادة 3 من القانون رقم 19.12 بتحديد شروط الشغل والتشغيل المتعلقة بالعاملات والعمال المنزليين', 'subtitle'),
        b('بين الموقعين:'), b('المشغلة أو المشغل:', 'party'),
        b(`الاسم الشخصي والعائلي: ${employer}`), b(`العنوان: ${v('employerAddress')}`),
        b(`رقم البطاقة الوطنية للتعريف: ${v('employerId')}، المسلمة ب${v('employerIssuePlace')} بتاريخ ${date('employerIssueDate')}.`),
        b(workerParty, 'party'), b(`الاسم الشخصي والعائلي: ${worker}`),
        b(`رقم البطاقة الوطنية للتعريف: ${v('workerId')}، المسلمة ب${v('workerIssuePlace')} بتاريخ ${date('workerIssueDate')}.`),
        b(`تاريخ الازدياد: ${date('birth')}`), b(`الحالة العائلية: ${marital}`), b('وقع الاتفاق على ما يلي:'),
        b('المادة الأولى: مدة العمل', 'heading'), b(`يتم تشغيل ${title}: ${worker}`),
        b(v('contractType') === 'CDI' ? `لمدة غير محددة تبتدىء من ${date('start')}.` : `لمدة محددة في ${duration(v('start'), v('end'))} يوما تبتدىء من ${date('start')} إلى ${date('end')}.`),
        b('المادة 2: نوع الشغل أو الخدمة', 'heading'), b(`يتم تشغيل ${title} ${worker} ${female?'بصفتها':'بصفته'} ${v('role')}.`), b(female?'وتتمثل مهمتها في:':'وتتمثل مهمته في:'),
        ...[
            ['home', 'الاعتناء بشؤون البيت؛'], ['children', 'الاعتناء بالأطفال؛'], ['care', 'الاعتناء بفرد من أفراد البيت بسبب سنه أو عجزه، أو مرضه، أو كونه من الأشخاص في وضعية إعاقة؛'], ['driving', 'السياقة؛'], ['garden', 'أعمال البستنة؛'], ['guard', 'حراسة البيت.'],
        ].map(([key, text]) => ({ ...b(text), checked: d.tasks.includes(key) })),
        b('يمكن الإشارة إلى أي عمل آخر مسموح به قانونا.'),
        ...(d.tasks.includes('other') ? [{...b(v('otherTask')),checked:true}] : []),
        b('المادة 3: فترة الاختبار', 'heading'), b(v('contractType')==='CDD'?'لا يتضمن هذا العقد المحدد المدة فترة اختبار.':`${female?'تخضع':'يخضع'} ${title} ${worker} لفترة اختبار مدتها ${v('probationDays')} يوما، ويمكن خلالها لأحد الطرفين إنهاء عقد الشغل بإرادته ودون تعويض.`),
        b('المادة 4: مدة العمل الأسبوعية', 'heading'), b(`تحدد مدة العمل الأسبوعية ${female?'للسيدة':'للسيد'}: ${worker} في ${v('hours')} ساعة.`),
        b('المادة 5: الأجر', 'heading'), b(`${female?'تتقاضى':'يتقاضى'} ${title}: ${worker} أجرا نقديا قدره ${v('salary')} درهما.`),
        b('المادة 6: الراحة الأسبوعية والعطلة السنوية وأيام العطل', 'heading'), b(`${female?'تستفيد':'يستفيد'} ${title} ${worker} من:`),
        b(`- راحة أسبوعية كل يوم ${label(c.rest, 'rest')} من الأسبوع لا تقل مدتها عن 24 ساعة متصلة.`),
        b('- عطلة سنوية مدفوعة الأجر على ألا تقل مدتها عن يوم ونصف يوم عمل عن كل شهر؛'),
        b('- راحة خلال أيام الأعياد الدينية والوطنية ويمكن تأجيل الاستفادة منها إلى تاريخ لاحق يحدد باتفاق الطرفين؛'), b('- رخص عن التغيب لأسباب عائلية.'),
        b('المادة 7:', 'heading'),
        b('تطبق أحكام القانون رقم 19.12 بتحديد شروط الشغل والتشغيل المتعلقة بالعاملات والعمال المنزليين في كل ما لم يتم التنصيص عليه في هذا العقد النموذجي.'),
        b('يمكن للطرفين أن يتفقا على تضمين هذا العقد بنودا أخرى تكون أكثر فائدة للعاملة أو العامل المنزلي فضلا عن ما هو منصوص عليه في القانون رقم 19.12 السالف الذكر، لاسيما ما يتعلق بتوفير الغذاء والمأوى.'),
    ] : [
        b('Contrat de travail de la travailleuse ou du travailleur domestique', 'title'),
        b('(Article 3 de la loi n° 19.12 fixant les conditions de travail et d’emploi des travailleuses et travailleurs domestiques)', 'subtitle'),
        b('ENTRE LES SOUSSIGNES:'), b('L’employeuse ou employeur :', 'party'), b(`Prénom et nom : ${employer}`), b(`Adresse : ${v('employerAddress')}`),
        b(`N° de la carte nationale d’identité : ${v('employerId')}, délivrée à ${v('employerIssuePlace')} le ${date('employerIssueDate')}.`),
        b(workerParty, 'party'), b(`Prénom et nom : ${worker}`), b(`N° de la carte nationale d’identité : ${v('workerId')}, délivrée à ${v('workerIssuePlace')} le ${date('workerIssueDate')}.`),
        b(`Date de naissance : ${date('birth')}`), b(`Situation familiale : ${marital}`), b('A été convenu ce qui suit :'),
        b('Article Premier : Durée de travail', 'heading'), b(`${title} est ${female?'engagée':'engagé'} : ${worker}`),
        b(v('contractType') === 'CDI' ? `Pour une durée indéterminée à compter du ${date('start')}.` : `Pour une durée déterminée de ${duration(v('start'), v('end'))} jours allant du ${date('start')} au ${date('end')}.`),
        b('Article 2 : Nature du travail ou du service', 'heading'), b(`${title} ${worker} est ${female?'engagée':'engagé'} en sa qualité de ${v('role')}.`), b('Ses tâches sont les suivantes :'),
        ...[
            ['home', 'effectuer les tâches ménagères;'], ['children', 'prendre soin des enfants;'], ['care', 'prendre soin d’un membre de la famille en raison de son âge, son incapacité, sa maladie ou de sa situation d’handicape;'], ['driving', 'la conduite;'], ['garden', 'les travaux de jardinage;'], ['guard', 'le gardiennage de la maison.'],
        ].map(([key, text]) => ({ ...b(text), checked: d.tasks.includes(key) })),
        b('Tout autre travail légalement autorisé peut être cité.'), ...(d.tasks.includes('other') ? [{...b(v('otherTask')),checked:true}] : []),
        b('Article 3 : Période d’essai', 'heading'), b(v('contractType')==='CDD'?'Le présent contrat à durée déterminée ne prévoit pas de période d’essai.':`${title} ${worker} est ${female?'soumise':'soumis'} à une période d’essai de ${v('probationDays')} Jours durant laquelle chacune des parties peut rompre volontairement le contrat de travail, sans indemnités.`),
        b('Article 4 : Durée de travail hebdomadaire', 'heading'), b(`La durée de travail hebdomadaire de ${title} ${worker} est fixée à ${v('hours')} heures.`),
        b('Article 5 : Salaire', 'heading'), b(`${title} ${worker} perçoit un salaire en espèces d’un montant de ${v('salary')} dirhams.`),
        b('Article 6 : Repos hebdomadaire, congé annuel et jours fériés', 'heading'), b(`${title} ${worker} bénéficie :`),
        b(`- d’un repos hebdomadaire le ${label(c.rest, 'rest')} de chaque semaine dont la durée ne peut être inférieur à vingt quatre (24) heures continues ;`),
        b('- d’un congé annuel payé dont la durée ne peut être inférieure à un jour et demi de travail pour chaque mois ;'), b('- d’un repos pendant les jours de fêtes religieuses et nationales qui peut être reporté à une date ultérieure fixée par commun accord des parties ;'), b('- de permissions d’absence pour des évènements familiaux.'),
        b('Article 7 :', 'heading'), b('Les dispositions de la loi n° 19.12 fixant les conditions de travail et d’emploi des travailleuses et travailleurs domestiques s’appliquent dans tous ce qui n’a pas été prévus par ce contrat type.'),
        b('Les parties peuvent prévoir, dans le présent contrat, d’autres clauses plus avantageuses à la travailleuse ou au travailleur domestique, en plus de celles prévues par la loi n° 19.12 précitée, notamment en ce qui concerne la nourriture et l’hébergement.'),
    ];
    blocks.push(b(ar ? 'توقيع المشغلة أو المشغل' : 'Signature de l’employeuse ou l’employeur', 'signature'), b(workerSignature, 'signature'));
    if (v('benefits'))
        blocks.push({ ...b(ar ? 'ملحق اتفاق إضافي أكثر فائدة للعامل' : 'Annexe — avantages supplémentaires plus favorables', 'title'), pageBefore: true }, b(ar ? `بين المشغلة أو المشغل: ${employer} ${female?'والعاملة':'والعامل'}: ${worker}` : `Entre l’employeur : ${employer} et ${female?'la travailleuse':'le travailleur'} : ${worker}`), b(ar ? `المزايا العينية المتفق عليها: ${label(c.benefits, 'benefits')}` : `Avantages en nature convenus : ${label(c.benefits, 'benefits')}`), b(ar ? 'هذه المزايا إضافية ولا تُخصم من الأجر النقدي ولا تقلص الحقوق المنصوص عليها في العقد.' : 'Ces avantages s’ajoutent au salaire en espèces, sans déduction et sans réduction des droits prévus au contrat.'), b(ar ? 'توقيع المشغلة أو المشغل' : 'Signature de l’employeuse ou l’employeur', 'signature'), b(workerSignature, 'signature'));
    return blocks;
}
const base64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 16384)
    s += String.fromCharCode(...bytes.subarray(i, i + 16384)); return btoa(s); };
export async function createContractPdf(d, fonts) {
    if (Object.keys(validate(d)).length)
        throw Error('VALIDATION');
    const ar = str(d, 'language') !== 'fr';
    const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true, putOnlyUsedFonts: true });
    for (const [style, bytes] of [['normal', fonts.regular], ['bold', fonts.bold]]) {
        const file = `Amiri-${style}.ttf`;
        doc.addFileToVFS(file, base64(bytes));
        doc.addFont(file, style === 'bold' ? 'Amiri-Bold' : 'Amiri-Regular', 'normal');
    }
    doc.setR2L(false);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setProperties({ title: ar ? 'عقد العمل الخاص بالعاملة أو العامل المنزلي' : 'Contrat de travail domestique', author: '', creator: '', subject: '', keywords: '' });
    const width = doc.internal.pageSize.getWidth(), height = doc.internal.pageSize.getHeight(), margin = 54, usable = width - 2 * margin, bottom = height - margin - 7;
    let y = margin + 19;
    const placements = [];
    const blocks = contractBlocks(d);
    const metrics = (b) => ({ size: b.kind === 'title' ? 19 : b.kind === 'subtitle' ? 11.5 : b.kind === 'heading' ? 14.5 : ar ? 14 : 12.5, line: b.kind === 'title' ? 28 : b.kind === 'subtitle' ? 18 : ar ? 22 : 20, gap: b.kind === 'heading' ? 4 : b.kind === 'party' ? 4 : 5, bold: ['title', 'heading', 'party', 'signature'].includes(b.kind) });
    const font = (b) => { const m = metrics(b); doc.setFont(m.bold ? 'Amiri-Bold' : 'Amiri-Regular', 'normal'); doc.setFontSize(m.size); return m; };
    // A missing glyph must stop the export rather than silently truncate a legal
    // paragraph. Check the shaped forms that the PDF writer will actually paint.
    for (const block of blocks) {
        font(block);
        const current = doc.getFont();
        for (const character of String(doc.processArabic(block.text))) {
            if (current.metadata.characterToGlyph(character.codePointAt(0)) === 0)
                throw Error('UNSUPPORTED_CHARACTERS');
        }
    }
    const wrap = (text, max) => {
        const lines = [];
        let line = '';
        for (const word of clean(text).split(' ')) {
            const candidate = line ? line + ' ' + word : word;
            if (doc.getTextWidth(candidate) <= max) {
                line = candidate;
                continue;
            }
            if (line) {
                lines.push(line);
                line = '';
            }
            if (doc.getTextWidth(word) <= max) {
                line = word;
                continue;
            }
            const pieces = Array.from(new Intl.Segmenter(ar ? 'ar' : 'fr', { granularity: 'grapheme' }).segment(word), s => s.segment);
            for (const piece of pieces) {
                if (line && doc.getTextWidth(line + piece) > max) {
                    lines.push(line);
                    line = '';
                }
                line += piece;
            }
        }
        if (line)
            lines.push(line);
        return lines;
    };
    const nextPage = () => { doc.addPage(); y = margin + 19; };
    const drawLine = (text, b, lineY, max) => {
        const center = ['title', 'subtitle'].includes(b.kind);
        const right = width - margin - (b.checked !== undefined ? 17 : 0);
        const x = center ? width / 2 : ar ? right : margin + (b.checked !== undefined ? 17 : 0);
        const options = { align: center ? 'center' : ar ? 'right' : 'left', isInputVisual: false, isOutputVisual: true, isInputRtl: ar, isOutputRtl: false };
        doc.text(text, x, lineY, options);
        placements.push({ page: doc.getNumberOfPages(), text, y: lineY, x: center ? width / 2 - doc.getTextWidth(text) / 2 : ar ? right - doc.getTextWidth(text) : x, width: doc.getTextWidth(text), kind: b.kind });
        if (doc.getTextWidth(text) > max + .1)
            throw Error('PDF_LINE_OVERFLOW');
    };
    for (let index = 0; index < blocks.length; index++) {
        const block = blocks[index];
        if (block.pageBefore)
            nextPage();
        if (block.kind === 'heading' && /^(المادة 7:|Article 7 :)/.test(block.text)) {
            let required = 0;
            let tail = index;
            while (tail < blocks.length && blocks[tail].kind !== 'signature') {
                const item = blocks[tail], m = font(item);
                required += wrap(item.text, usable).length * m.line + m.gap + (item.kind === 'heading' ? 6 : 0);
                tail++;
            }
            const signatures = blocks.slice(tail, tail + 2);
            if (signatures.length === 2) {
                font(signatures[0]);
                required += Math.max(...signatures.map(item => wrap(item.text, (usable - 32) / 2).length)) * 20 + 56;
            }
            if (y + required > bottom)
                nextPage();
        }
        if (block.kind === 'signature') {
            // Both labels and their blank writing spaces are an indivisible group.
            const labels = blocks.slice(index, index + 2);
            font(block);
            const available = (usable - 32) / 2;
            const signatureHeight = Math.max(...labels.map(label => wrap(label.text, available).length)) * 20 + 56;
            if (y + signatureHeight > bottom)
                nextPage();
            for (let side = 0; side < 2; side++) {
                const label = labels[side];
                const lines = wrap(label.text, available);
                const right = width - margin - side * (available + 32);
                const left = margin + side * (available + 32);
                lines.forEach((text, row) => {
                    const options = { align: ar ? 'right' : 'left', isInputVisual: false, isOutputVisual: true, isInputRtl: ar, isOutputRtl: false };
                    doc.text(text, ar ? right : left, y + row * 20, options);
                    placements.push({ page: doc.getNumberOfPages(), text, y: y + row * 20, x: ar ? right - doc.getTextWidth(text) : left, width: doc.getTextWidth(text), kind: 'signature' });
                });
            }
            y += signatureHeight;
            index++;
            continue;
        }
        const m = font(block);
        const max = usable - (block.checked !== undefined ? 17 : 0);
        const lines = wrap(block.text, max);
        if (['heading', 'party'].includes(block.kind)) {
            const following = blocks[index + 1];
            let followingHeight = 22;
            if (following) {
                font(following);
                followingHeight = Math.min(2, wrap(following.text, usable).length) * metrics(following).line;
            }
            font(block);
            if (y + 6 + lines.length * m.line + followingHeight + m.gap > bottom)
                nextPage();
            y += 6;
        }
        if (lines.length > 1 && Math.floor((bottom - y) / m.line) + 1 < 2)
            nextPage();
        let offset = 0;
        while (offset < lines.length) {
            let fit = Math.floor((bottom - y) / m.line) + 1;
            if (fit < 1) {
                nextPage();
                continue;
            }
            if (lines.length - offset > fit && lines.length - offset - fit === 1 && fit > 1)
                fit--;
            const count = Math.min(fit, lines.length - offset);
            for (let row = 0; row < count; row++) {
                if (block.checked !== undefined && offset + row === 0) {
                    const x = ar ? width - margin - 8 : margin;
                    doc.setLineWidth(.65);
                    doc.rect(x, y - 8, 8, 8);
                    if (block.checked) {
                        doc.setLineWidth(1);
                        doc.line(x + 1.5, y - 4, x + 3.2, y - 1.5);
                        doc.line(x + 3.2, y - 1.5, x + 6.7, y - 6.5);
                    }
                }
                drawLine(lines[offset + row], block, y, max);
                y += m.line;
            }
            offset += count;
            if (offset < lines.length)
                nextPage();
        }
        y += m.gap;
    }
    const pageCount = doc.getNumberOfPages();
    const bytes = await normalizeArabicTextMap(new Uint8Array(doc.output('arraybuffer')));
    return { bytes, pageCount, placements };
}
let loadedFonts;
export async function generatePdfDocument(d){
 if(Object.keys(validate(d)).length)throw Error('VALIDATION');

 if(!loadedFonts){const decode=base64=>Uint8Array.from(atob(base64),c=>c.charCodeAt(0));loadedFonts={regular:decode(embeddedFonts.regular),bold:decode(embeddedFonts.bold)};}
 return createContractPdf(d,loadedFonts);
}
