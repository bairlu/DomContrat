import Decimal from 'decimal.js';
import {legal,law} from './legal-config.js';
export {legal};
export const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
export const currentRate=(asOf=today())=>legal.rates.filter(r=>r.from<=asOf&&(!r.through||asOf<=r.through)).sort((a,b)=>b.from.localeCompare(a.from))[0]??null;
export const blank = () => ({ language: 'ar', employerFirst: '', employerLast: '', employerAddress: '', employerGender: '', employerIdType: '', employerId: '', employerIssuePlace: '', employerIssueDate: '', employerExpiryDate: '', workerFirst: '', workerLast: '', gender: '', workerIdType: '', workerId: '', workerIssuePlace: '', workerIssueDate: '', workerExpiryDate: '', birth: '', marital: '', contractType: '', start: '', end: '', role: '', probationDays: '', tasks: [], otherTask: '', hours: '', salary: '', rest: '', benefits: '', otherBenefits: '', signPlace: '', signDate: '', inspectorate: '' });
export const str = (d, k) => String(d[k] ?? '');
export function validDate(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
    return false; const t = new Date(s + 'T00:00:00Z'); return Number.isFinite(+t) && t.toISOString().slice(0, 10) === s; }
export function ageOn(birth, start) { if (!validDate(birth) || !validDate(start))
    return null; let age = +start.slice(0, 4) - +birth.slice(0, 4); if (start.slice(5) < birth.slice(5))
    age--; return age; }
export const duration = (start, end) => validDate(start) && validDate(end) ? Math.round((Date.parse(end) - Date.parse(start)) / 86400000) : 0;
export function wage(hours, start, asOf=today()) { const rate = currentRate(asOf); if (!rate || !validDate(start) || !/^\d+(\.\d{1,2})?$/.test(hours))
    return null; const h = new Decimal(hours); if (h.lte(0) || h.gt(legal.weeklyMaximum))
    return null; const monthly = h.times(52).div(12); const hourly = new Decimal(rate.hourly).times(rate.share); return { monthly: monthly.toFixed(2), hourly: hourly.toFixed(3), minimum: h.times(52).times(hourly).div(12).toDecimalPlaces(2, Decimal.ROUND_CEIL).toFixed(2), rate }; }
export const stepFields = { 2: ['employerFirst', 'employerLast', 'employerAddress', 'employerGender', 'employerIdType', 'employerId', 'employerIssuePlace', 'employerIssueDate'], 3: ['workerFirst', 'workerLast', 'gender', 'workerIdType', 'workerId', 'workerIssuePlace', 'workerIssueDate', 'birth', 'marital'], 4: ['contractType', 'start', 'tasks'], 5: ['hours', 'salary'], 6: ['rest'] };
export const messages = { ar: { required: 'هذا الحقل إجباري.', date: 'أدخل تاريخاً صحيحاً.', age: 'الحد الأدنى لسن التشغيل هو 18 سنة في تاريخ بداية العمل وفق المادة 6 من القانون رقم 19.12؛ انتهى الاستثناء الانتقالي السابق.', hours: 'يجب أن تكون مدة العمل أكبر من صفر ولا تتجاوز 48 ساعة أسبوعياً، بدقتين عشريتين كحد أقصى.', salary: 'الأجر المدخل يقل عن الحد الأدنى القانوني المحسوب وفق عدد ساعات العمل الأسبوعية. يرجى تعديل الأجر أو ساعات العمل بما يتوافق مع المقتضيات القانونية.', amount: 'أدخل مبلغاً موجباً بالدرهم لا يتجاوز منزلتين عشريتين.', rate: 'لم يُعتمد مرجع الأجر لهذه الفترة. يلزم تحديث الإعدادات القانونية إدارياً قبل إصدار العقد.', end: 'يجب أن يكون تاريخ النهاية لاحقاً لتاريخ البداية.', id: 'رقم الوثيقة غير صالح. البطاقة الوطنية: حرف أو حرفان لاتينيان متبوعان بـ 3 إلى 8 أرقام. باقي الوثائق: 3 إلى 30 حرفاً أو رقماً أو شرطة أو /.', issue: 'لا يجوز أن يكون تاريخ الإصدار لاحقاً لتاريخ التوقيع أو بداية العمل.', birth: 'تاريخ الازدياد غير منسجم مع تاريخ إصدار الوثيقة.', tasks: 'اختر مهمة منزلية واحدة على الأقل.', other: 'يرجى كتابة المهام المنزلية الأخرى المتفق عليها، في حدود 3000 حرف.', benefits: 'اختر ميزة إضافية من الخيارات المتاحة.' }, fr: { required: 'Ce champ est obligatoire.', date: 'Saisissez une date valide.', age: 'L’âge minimum à la date de début est de 18 ans (article 6 de la loi n° 19-12). La dérogation transitoire a expiré.', hours: 'La durée doit être supérieure à zéro et ne pas dépasser 48 heures par semaine, avec deux décimales au maximum.', salary: 'Le salaire saisi est inférieur au minimum calculé selon la durée hebdomadaire. Veuillez ajuster le salaire ou la durée conformément aux dispositions légales.', amount: 'Saisissez un montant positif en dirhams, avec deux décimales au maximum.', rate: 'Aucun taux vérifié pour cette période. Une mise à jour administrative des paramètres est nécessaire.', end: 'La date de fin doit être postérieure à la date de début.', id: 'Numéro invalide. CNIE : une ou deux lettres latines et 3 à 8 chiffres. Autres pièces : 3 à 30 lettres, chiffres, tirets ou /.', issue: 'La délivrance ne peut être postérieure à la signature ou au début du travail.', birth: 'La naissance est incohérente avec la délivrance de la pièce.', tasks: 'Sélectionnez au moins une tâche domestique.', other: 'Décrivez les autres tâches domestiques convenues, dans la limite de 3 000 caractères.', benefits: 'Sélectionnez un avantage parmi les options proposées.' } };
messages.ar.age=messages.ar.age.replace('القانون رقم 19.12',law.citationAr);
messages.fr.age=messages.fr.age.replace('loi n° 19-12',law.citationFr);
export function identityDateFields(d,prefix){
    const type=str(d,prefix+'IdType');
    return type==='cnie'?[prefix+'ExpiryDate']:['passport','residence'].includes(type)?[prefix+'IssueDate',prefix+'ExpiryDate']:type==='other'?[prefix+'IssueDate']:[];
}
export function validate(d, step) {
    const lang = str(d, 'language') === 'fr' ? 'fr' : 'ar', m = messages[lang], e = {};
    let relevant = (step ? stepFields[step] ?? [] : Object.values(stepFields).flat()).filter(key=>!key.endsWith('IssueDate'));
    for(const prefix of ['employer','worker'])if(!step||step===(prefix==='employer'?2:3))relevant.push(...identityDateFields(d,prefix));
    const check = (k) => !step || relevant.includes(k);
    const req = (k) => { if (!str(d, k).trim())
        e[k] = m.required; };
    for (const k of relevant) {
        if (k === 'tasks') {
            if (!d.tasks.length)
                e.tasks = m.tasks;
        }
        else
            req(k);
    }
    const enums = { employerIdType: ['cnie', 'passport', 'residence', 'other'], workerIdType: ['cnie', 'passport', 'residence', 'other'], employerGender: ['female', 'male'], gender: ['female', 'male'], marital: ['single', 'married', 'divorced', 'widowed'], contractType: ['CDI', 'CDD'], rest: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] };
    for (const [k, allowed] of Object.entries(enums))
        if (check(k) && !allowed.includes(str(d, k)))
            e[k] = m.required;
    for (const k of relevant) {
        if (k !== 'tasks' && str(d, k).length > 500)
            e[k] = m.required;
    }
    for (const p of ['employer', 'worker']) {
        if (check(p + 'Id')) {
            const id = str(d, p + 'Id'), type = str(d, p + 'IdType');
            if (id && !(type === 'cnie' ? /^[A-Za-z]{1,2}\d{3,8}$/ : /^[\p{L}\p{N}/-]{3,30}$/u).test(id))
                e[p + 'Id'] = m.id;
        }
        const active=identityDateFields(d,p);
        if(active.includes(p+'IssueDate') && check(p+'IssueDate')){
            const value=str(d,p+'IssueDate');
            if(value&&!validDate(value))e[p+'IssueDate']=m.date;
            else if(value&&value>(str(d,'signDate')||str(d,'start')||today()))e[p+'IssueDate']=m.issue;
        }
        if(active.includes(p+'ExpiryDate') && (!step||check(p+'Id')||step===4)){
            const key=p+'ExpiryDate',value=str(d,key),reference=str(d,'signDate')||str(d,'start')||today();
            if(!value)e[key]=m.required;
            else if(!validDate(value))e[key]=m.date;
            else if(value<reference)e[key]=lang==='ar'?'يجب أن تكون الوثيقة سارية الصلاحية في تاريخ بداية العمل أو التوقيع.':'La pièce doit être valable à la date de début du travail ou de signature.';
            else if(active.includes(p+'IssueDate')&&validDate(str(d,p+'IssueDate'))&&value<=str(d,p+'IssueDate'))e[key]=lang==='ar'?'يجب أن يكون تاريخ الانتهاء لاحقاً لتاريخ الإصدار.':'La date d’expiration doit être postérieure à la délivrance.';
        }
    }
    if (check('birth') && str(d, 'birth')) {
        if (!validDate(str(d, 'birth')))
            e.birth = m.date;
        else if (identityDateFields(d,'worker').includes('workerIssueDate') && str(d, 'workerIssueDate') && str(d, 'birth') > str(d, 'workerIssueDate'))
            e.birth = m.birth;
    }
    if (check('start')) {
        if (str(d, 'start') && !validDate(str(d, 'start')))
            e.start = m.date;
        else if (str(d, 'start') && !wage('1', str(d, 'start')))
            e.start = m.rate;
        const age = ageOn(str(d, 'birth'), str(d, 'start'));
        if (age !== null && age < 18)
            e.start = m.age;
        if (str(d, 'contractType') === 'CDD') {
            req('end');
            if (str(d, 'end') && (!validDate(str(d, 'end')) || duration(str(d, 'start'), str(d, 'end')) <= 0))
                e.end = m.end;
        }
    }
    if(check('contractType')&&str(d,'contractType')==='CDI'){
        const days=str(d,'probationDays');
        if(!/^([1-9]|1[0-5])$/.test(days)||Number(days)>legal.probationMaximum)e.probationDays=lang==='ar'?'اختر مدة فترة الاختبار من 1 إلى 15 يوماً.':'Choisissez une période d’essai de 1 à 15 jours.';
    }
    if (check('birth')) {
        const age = ageOn(str(d, 'birth'), str(d, 'start'));
        if (age !== null && age < 18)
            e.birth = m.age;
    }
    if (check('tasks')) {
        if (d.tasks.some(t => !['home', 'children', 'care', 'driving', 'garden', 'guard', 'other'].includes(t)))
            e.tasks = m.tasks;
        if (d.tasks.includes('other') && (!str(d,'otherTask').trim() || str(d,'otherTask').length>3000)) e.otherTask=m.other;
    }
    if (check('hours') && !wage(str(d, 'hours'), str(d, 'start')))
        e.hours = m.hours;
    if (check('salary')) {
        const s = str(d, 'salary'), w = wage(str(d, 'hours'), str(d, 'start'));
        if (!/^\d+(\.\d{1,2})?$/.test(s) || new Decimal(s || 0).lte(0) || new Decimal(s || 0).gt(10000000))
            e.salary = m.amount;
        else if (w && new Decimal(s).lt(w.minimum))
            e.salary = lang==='ar'?`الأجر المدخل يقل عن الحد الأدنى القانوني وفق عدد ساعات العمل المدخلة. يجب ألا يقل الأجر النقدي الشهري عن (${w.minimum} درهم). يرجى تعديل الأجر أو ساعات العمل.`:`Le salaire saisi est inférieur au minimum légal pour la durée hebdomadaire indiquée. Le salaire mensuel en espèces ne doit pas être inférieur à (${w.minimum} MAD). Ajustez le salaire ou la durée du travail.`;
    }
    if (check('signDate') && str(d, 'signDate') && !validDate(str(d, 'signDate')))
        e.signDate = m.date;
    if (!step || step === 6) {
        if(str(d,'otherBenefits').length>3000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ue000\ue001]/.test(str(d,'otherBenefits')))e.otherBenefits=lang==='ar'?'اكتب المزايا الإضافية في حدود 3000 حرف دون رموز تحكم.':'Décrivez les avantages dans la limite de 3 000 caractères, sans caractères de contrôle.';
        if (str(d, 'benefits') && !['food', 'housing', 'both'].includes(str(d, 'benefits')))
            e.benefits = m.benefits;
    }
    return e;
}
