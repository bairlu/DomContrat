import {professionalRole} from './contract-data.js';
import {law} from './legal-config.js';
import embeddedFonts from './pdf-fonts.js';
import { jsPDF } from 'jspdf';
import { normalizeArabicTextMap } from './pdf-unicode.js';
import { str, validate, duration } from './legal.js';
import { choices } from './i18n.js';
const clean = (value) => value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/\s+/g, ' ').trim();
export function contractBlocks(d) {
    const ar = str(d, 'language') !== 'fr', c = choices[ar ? 'ar' : 'fr'];
    const v = (key) => key==='role'?professionalRole(d):clean(str(d, key));
    const label = (list, key) => list.find(row => row[0] === v(key))?.[1] ?? '';
    const date = (key) => v(key).split('-').reverse().join('/');
    const employer = clean(`${v('employerFirst')} ${v('employerLast')}`), worker = clean(`${v('workerFirst')} ${v('workerLast')}`);
    const female=v('gender')==='female',employerFemale=v('employerGender')==='female';
    const employerParty=ar?(employerFemale?'المشغلة':'المشغل'):(employerFemale?'L’employeuse':'L’employeur');
    const title=ar?(female?'السيدة':'السيد'):(female?'Madame':'Monsieur');
    const marital=ar?({single:female?'عزباء':'أعزب',married:female?'متزوجة':'متزوج',divorced:female?'مطلقة':'مطلق',widowed:female?'أرملة':'أرمل'}[v('marital')]??''):({single:'Célibataire',married:female?'Mariée':'Marié',divorced:female?'Divorcée':'Divorcé',widowed:female?'Veuve':'Veuf'}[v('marital')]??'');
    const workerParty=ar?(female?'والعاملة المنزلية:':'والعامل المنزلي:'):(female?'La travailleuse domestique :':'Le travailleur domestique :');
    const workerSignature=ar?(female?'توقيع العاملة المنزلية':'توقيع العامل المنزلي'):(female?'Signature de la travailleuse domestique':'Signature du travailleur domestique');
    const fill = value => '\ue000'+value+'\ue001';
    const b = (marked, kind = 'body') => {
        marked=String(marked).replace(/\s*([؛;،,])/g,' $1');
        const runs=[];let bold=false;
        for(const part of String(marked).split(/([\ue000\ue001])/)){
            if(part==='\ue000')bold=true;
            else if(part==='\ue001')bold=false;
            else if(part)runs.push({text:part,bold});
        }
        return {text:runs.map(run=>run.text).join(''),kind,runs};
    };
    const identity = prefix => {
        const type=v(prefix+'IdType'),name=label(c.id,prefix+'IdType');
        const number=fill(v(prefix+'Id')),place=fill(v(prefix+'IssuePlace'));
        let text=ar?`${name}: ${number}، ${type==='passport'?'المسلم':'المسلمة'} ب${place}`:`${name} : ${number}, ${type==='passport'?'délivré':'délivrée'} à ${place}`;
        if(type!=='cnie')text+=ar?` بتاريخ ${fill(date(prefix+'IssueDate'))}`:` le ${fill(date(prefix+'IssueDate'))}`;
        if(['cnie','passport','residence'].includes(type))text+=ar?`، تاريخ انتهاء الصلاحية: ${fill(date(prefix+'ExpiryDate'))}`:`, valable jusqu’au ${fill(date(prefix+'ExpiryDate'))}`;
        return b(text+'.');
    };
    const restDay={mon:'اثنين',tue:'ثلاثاء',wed:'أربعاء',thu:'خميس',fri:'جمعة',sat:'سبت',sun:'أحد'}[v('rest')];
    const blocks = ar ? [
        b('عقد العمل الخاص بالعاملة أو العامل المنزلي', 'title'),
        b(`المادة 3 من ${law.citationAr}`, 'subtitle'),
        b('بين الموقعين:'), b(employerParty+':', 'party'),
        b(`الاسم الشخصي والعائلي: ${fill(employer)}`), b(`العنوان: ${fill(v('employerAddress'))}`),
        identity('employer'),
        b(workerParty, 'party'), b(`الاسم الشخصي والعائلي: ${fill(worker)}`),
        identity('worker'),
        b(`تاريخ الازدياد: ${fill(date('birth'))}`), b(`الحالة العائلية: ${fill(marital)}`), b('وقع الاتفاق على ما يلي:'),
        b('المادة 1: مدة العمل', 'heading'), b(`يتم تشغيل ${title}: ${fill(worker)}`),
        b(v('contractType') === 'CDI' ? `لمدة غير محددة تبتدىء من ${fill(date('start'))}.` : `لمدة محددة في ${fill(duration(v('start'), v('end')))} يوما تبتدىء من ${fill(date('start'))} إلى ${fill(date('end'))}.`),
        b('المادة 2: نوع الشغل أو الخدمة', 'heading'), b(`يتم تشغيل ${title} ${fill(worker)} ${female?'بصفتها':'بصفته'} ${fill(v('role'))}.`), b(female?'وتتمثل مهمتها في:':'وتتمثل مهمته في:'),
        ...[
            ['home', 'الاعتناء بشؤون البيت؛'], ['children', 'الاعتناء بالأطفال؛'], ['care', 'الاعتناء بفرد من أفراد البيت بسبب سنه أو عجزه، أو مرضه، أو كونه من الأشخاص في وضعية إعاقة؛'], ['driving', 'السياقة؛'], ['garden', 'أعمال البستنة؛'], ['guard', 'حراسة البيت.'],
        ].map(([key, text]) => ({ ...b(text), checked: d.tasks.includes(key) })),
        b('يمكن الإشارة إلى أي عمل آخر مسموح به قانونا.'),
        ...(d.tasks.includes('other') ? [{...b(ar?`مهام أخرى مسموح بها قانونا: ${fill(v('otherTask'))}`:`Autres tâches légalement autorisées : ${fill(v('otherTask'))}`),checked:true}] : []),
        b('المادة 3: فترة الاختبار', 'heading'), b(v('contractType')==='CDD'?'لا يتضمن هذا العقد المحدد المدة فترة اختبار.':`${female?'تخضع':'يخضع'} ${title} ${fill(worker)} لفترة اختبار مدتها ${fill(v('probationDays'))} يوما، ويمكن خلالها لأحد الطرفين إنهاء عقد الشغل بإرادته ودون تعويض.`),
        b('المادة 4: مدة العمل الأسبوعية', 'heading'), b(`تحدد مدة العمل الأسبوعية ${female?'للسيدة':'للسيد'}: ${fill(worker)} في ${fill(v('hours'))} ساعة.`),
        b('المادة 5: الأجر', 'heading'), b(`${female?'تتقاضى':'يتقاضى'} ${title}: ${fill(worker)} أجرا نقديا قدره ${fill(v('salary'))} درهما شهريا.`),
        b('المادة 6: الراحة الأسبوعية والعطلة السنوية وأيام العطل', 'heading'), b(`${female?'تستفيد':'يستفيد'} ${title} ${fill(worker)} من:`),
        b(`- راحة أسبوعية كل يوم ${fill(restDay)} من الأسبوع لا تقل مدتها عن 24 ساعة متصلة.`),
        b('- عطلة سنوية مدفوعة الأجر على ألا تقل مدتها عن يوم ونصف يوم عمل عن كل شهر؛'),
        b('- راحة خلال أيام الأعياد الدينية والوطنية ويمكن تأجيل الاستفادة منها إلى تاريخ لاحق يحدد باتفاق الطرفين؛'), b('- رخص عن التغيب لأسباب عائلية.'),
        b('المادة 7:', 'heading'),
        b('تطبق أحكام القانون رقم 19.12 بتحديد شروط الشغل والتشغيل المتعلقة بالعاملات والعمال المنزليين في كل ما لم يتم التنصيص عليه في هذا العقد النموذجي.'),
        b(`يمكن للطرفين أن يتفقا على تضمين هذا العقد بنودا أخرى تكون أكثر فائدة للعاملة أو العامل المنزلي فضلا عن ما هو منصوص عليه في ${law.citationAr} السالف الذكر، لاسيما ما يتعلق بتوفير الغذاء والمأوى.`),
    ] : [
        b('Contrat de travail de la travailleuse ou du travailleur domestique', 'title'),
        b('(Article 3 de la loi n° 19.12 fixant les conditions de travail et d’emploi des travailleuses et travailleurs domestiques)', 'subtitle'),
        b('ENTRE LES SOUSSIGNES:'), b(employerParty+' :', 'party'), b(`Prénom et nom : ${fill(employer)}`), b(`Adresse : ${fill(v('employerAddress'))}`),
        identity('employer'),
        b(workerParty, 'party'), b(`Prénom et nom : ${fill(worker)}`), identity('worker'),
        b(`Date de naissance : ${fill(date('birth'))}`), b(`Situation familiale : ${fill(marital)}`), b('A été convenu ce qui suit :'),
        b('Article 1 : Durée de travail', 'heading'), b(`${title} est ${female?'engagée':'engagé'} : ${fill(worker)}`),
        b(v('contractType') === 'CDI' ? `Pour une durée indéterminée à compter du ${fill(date('start'))}.` : `Pour une durée déterminée de ${fill(duration(v('start'), v('end')))} jours allant du ${fill(date('start'))} au ${fill(date('end'))}.`),
        b('Article 2 : Nature du travail ou du service', 'heading'), b(`${title} ${fill(worker)} est ${female?'engagée':'engagé'} en sa qualité de ${fill(v('role'))}.`), b('Ses tâches sont les suivantes :'),
        ...[
            ['home', 'effectuer les tâches ménagères;'], ['children', 'prendre soin des enfants;'], ['care', 'prendre soin d’un membre de la famille en raison de son âge, son incapacité, sa maladie ou de sa situation d’handicape;'], ['driving', 'la conduite;'], ['garden', 'les travaux de jardinage;'], ['guard', 'le gardiennage de la maison.'],
        ].map(([key, text]) => ({ ...b(text), checked: d.tasks.includes(key) })),
        b('Tout autre travail légalement autorisé peut être cité.'), ...(d.tasks.includes('other') ? [{...b(ar?`مهام أخرى مسموح بها قانونا: ${fill(v('otherTask'))}`:`Autres tâches légalement autorisées : ${fill(v('otherTask'))}`),checked:true}] : []),
        b('Article 3 : Période d’essai', 'heading'), b(v('contractType')==='CDD'?'Le présent contrat à durée déterminée ne prévoit pas de période d’essai.':`${title} ${fill(worker)} est ${female?'soumise':'soumis'} à une période d’essai de ${fill(v('probationDays'))} Jours durant laquelle chacune des parties peut rompre volontairement le contrat de travail, sans indemnités.`),
        b('Article 4 : Durée de travail hebdomadaire', 'heading'), b(`La durée de travail hebdomadaire de ${title} ${fill(worker)} est fixée à ${fill(v('hours'))} heures.`),
        b('Article 5 : Salaire', 'heading'), b(`${title} ${fill(worker)} perçoit un salaire en espèces d’un montant de ${fill(v('salary'))} dirhams par mois.`),
        b('Article 6 : Repos hebdomadaire, congé annuel et jours fériés', 'heading'), b(`${title} ${fill(worker)} bénéficie :`),
        b(`- d’un repos hebdomadaire le ${fill(label(c.rest, 'rest'))} de chaque semaine dont la durée ne peut être inférieur à vingt quatre (24) heures continues ;`),
        b('- d’un congé annuel payé dont la durée ne peut être inférieure à un jour et demi de travail pour chaque mois ;'), b('- d’un repos pendant les jours de fêtes religieuses et nationales qui peut être reporté à une date ultérieure fixée par commun accord des parties ;'), b('- de permissions d’absence pour des évènements familiaux.'),
        b('Article 7 :', 'heading'), b('Les dispositions de la loi n° 19.12 fixant les conditions de travail et d’emploi des travailleuses et travailleurs domestiques s’appliquent dans tous ce qui n’a pas été prévus par ce contrat type.'),
        b(`Les parties peuvent prévoir, dans le présent contrat, d’autres clauses plus avantageuses à la travailleuse ou au travailleur domestique, en plus de celles prévues par la ${law.citationFr} précitée, notamment en ce qui concerne la nourriture et l’hébergement.`),
    ];
    if(v('benefits')||v('otherBenefits')){
        blocks.push(b(ar?'المادة 8: المزايا العينية الإضافية':'Article 8 : Avantages supplémentaires en nature','heading'));
        if(v('benefits')){
            const benefit=ar?({food:'الغذاء',housing:'المأوى',both:'الغذاء والمأوى'}[v('benefits')]):({food:'la nourriture',housing:'l’hébergement',both:'la nourriture et l’hébergement'}[v('benefits')]);
            blocks.push(b(ar?`${employerFemale?'اتفقت المشغلة':'اتفق المشغل'} على توفير ${fill(benefit)} لفائدة ${female?'العاملة':'العامل'} ${fill(worker)}.`:`${employerParty} s’engage à fournir ${fill(benefit)} au bénéfice de ${female?'la travailleuse':'le travailleur'} ${fill(worker)}.`));
        }
        if(v('otherBenefits'))blocks.push(b(ar?`مزايا إضافية أخرى متفق عليها: ${fill(v('otherBenefits'))}`:`Autres avantages supplémentaires convenus : ${fill(v('otherBenefits'))}`));
        blocks.push(b(ar?'هذه المزايا إضافية ولا تُخصم من الأجر النقدي ولا تقلص الحقوق المنصوص عليها في العقد.':'Ces avantages s’ajoutent au salaire en espèces, sans déduction et sans réduction des droits prévus au contrat.'));
    }
    blocks.push(b(ar ? `توقيع ${employerParty}` : `Signature de ${employerFemale?'l’employeuse':'l’employeur'}`, 'signature'), b(workerSignature, 'signature'));
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
    const metrics = (b) => ({ size: b.kind === 'title' ? 19 : b.kind === 'subtitle' ? 11.5 : b.kind === 'heading' ? 16 : ar ? 14 : 12.5, line: b.kind === 'title' ? 28 : b.kind === 'subtitle' ? 18 : b.kind === 'heading' ? 23 : ar ? 20 : 17, gap: b.kind === 'heading' ? 4 : ar ? 3 : 2, bold: ['title', 'heading', 'party', 'signature'].includes(b.kind) });
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
    const measuredWidth = text => {
        const name=doc.getFont().fontName,normal=doc.getTextWidth(text);
        doc.setFont('Amiri-Bold','normal');const bold=doc.getTextWidth(text);doc.setFont(name,'normal');return Math.max(normal,bold);
    };
    const wrap = (text, max) => {
        const lines = [];
        let line = '';
        const tokens=[];
        for(const word of clean(text).split(' ')){
            if(/^[؛;،,.!?؟]+$/.test(word)&&tokens.length)tokens[tokens.length-1]+=' '+word;
            else tokens.push(word);
        }
        for (const word of tokens) {
            const candidate = line ? line + ' ' + word : word;
            if (measuredWidth(candidate) <= max) {
                line = candidate;
                continue;
            }
            if (line) {
                lines.push(line);
                line = '';
            }
            if (measuredWidth(word) <= max) {
                line = word;
                continue;
            }
            const pieces = Array.from(new Intl.Segmenter(ar ? 'ar' : 'fr', { granularity: 'grapheme' }).segment(word), s => s.segment);
            for (const piece of pieces) {
                if (line && measuredWidth(line + piece) > max) {
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
    const drawLine = (text, b, lineY, max, sourceOffset=0) => {
        const center = ['title', 'subtitle'].includes(b.kind);
        const right = width - margin - (b.checked !== undefined ? 17 : 0);
        const x = center ? width / 2 : ar ? right : margin + (b.checked !== undefined ? 17 : 0);
        const options = { align: center ? 'center' : ar ? 'right' : 'left', isInputVisual: false, isOutputVisual: true, isInputRtl: ar, isOutputRtl: false };
        const mask=[];for(const run of b.runs??[])for(let n=0;n<run.text.length;n++)mask.push(run.bold);
        if(metrics(b).bold||!mask.slice(sourceOffset,sourceOffset+text.length).some(Boolean))doc.text(text,x,lineY,options);
        else {
            const pieces=[];
            for(let i=0;i<text.length;i++){
                const bold=!!mask[sourceOffset+i],last=pieces.at(-1);
                if(last&&last.bold===bold)last.text+=text[i];else pieces.push({text:text[i],bold});
            }
            let cursor=x;
            for(const piece of pieces){
                doc.setFont(piece.bold?'Amiri-Bold':'Amiri-Regular','normal');
                doc.text(piece.text,cursor,lineY,options);
                cursor+=(ar?-1:1)*doc.getTextWidth(piece.text);
            }
            font(b);
        }
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
        let offset = 0, sourceOffset=0;
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
                const line=lines[offset+row];sourceOffset=block.text.indexOf(line,sourceOffset);
                drawLine(line, block, y, max, sourceOffset);sourceOffset+=line.length;
                y += m.line;
            }
            offset += count;
            if (offset < lines.length)
                nextPage();
        }
        y += m.gap;
    }
    const pageCount = doc.getNumberOfPages();
    const pageNumbers=[];
    for(let page=1;page<=pageCount;page++){
        doc.setPage(page);doc.setFont('Amiri-Regular','normal');doc.setFontSize(10);
        const label=`${page}/${pageCount}`;doc.text(label,width/2,height-28,{align:'center',isInputRtl:false,isOutputRtl:false});
        pageNumbers.push({page,text:label,y:height-28});
    }
    const bytes = await normalizeArabicTextMap(new Uint8Array(doc.output('arraybuffer')));
    return { bytes, pageCount, placements, pageNumbers };
}
let loadedFonts;
export async function generatePdfDocument(d){
 if(Object.keys(validate(d)).length)throw Error('VALIDATION');

 if(!loadedFonts){const decode=base64=>Uint8Array.from(atob(base64),c=>c.charCodeAt(0));loadedFonts={regular:decode(embeddedFonts.regular),bold:decode(embeddedFonts.bold)};}
 return createContractPdf(d,loadedFonts);
}
