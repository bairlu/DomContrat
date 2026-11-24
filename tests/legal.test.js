import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blank, validate, wage, ageOn, validDate, duration, currentRate, legal } from '../src/legal.js';
test('CDI trial must be a chosen integer from 1 through 15; CDD does not require it',()=>{
 const d=good();for(let n=1;n<=15;n++){d.probationDays=String(n);assert.deepEqual(validate(d),{});}
 for(const value of ['','0','16','-1','1.5','1e1','015']){d.probationDays=value;assert.ok(validate(d).probationDays,value);}
 d.contractType='CDD';d.end='2026-12-23';d.probationDays='';assert.deepEqual(validate(d),{});
});
const good = () => ({ ...blank(), language: 'ar', employerFirst: 'اسم اختباري', employerLast: 'عائلي اختباري', employerAddress: 'عنوان اصطناعي للاختبار', employerIdType: 'cnie', employerId: 'AB123456', employerIssuePlace: 'أكادير', employerIssueDate: '2020-01-01', workerFirst: 'عاملة اختبار', workerLast: 'عائلي اختبار', gender: 'female', workerIdType: 'cnie', workerId: 'CD123456', workerIssuePlace: 'أكادير', workerIssueDate: '2020-01-01', birth: '1990-01-01', marital: 'single', contractType: 'CDI', probationDays: '15', start: '2026-11-23', role: 'عاملة منزلية', tasks: ['home'], hours: '48', salary: '2236.42', rest: 'sun', signPlace: 'أكادير', signDate: '2026-11-23', inspectorate: 'أكادير' });
test('2026 exact ceiling and mandatory wage examples', () => { assert.equal(wage('48', '2026-11-23')?.minimum, '2236.42'); assert.equal(wage('48', '2026-11-23')?.monthly, '208.00'); assert.equal(wage('48', '2026-11-23')?.hourly, '10.752'); const d = good(); d.salary = '2000'; assert.ok(validate(d).salary); d.salary = '2236.41'; assert.ok(validate(d).salary); d.salary = '2236.42'; assert.deepEqual(validate(d), {}); });
test('valid form in both languages', () => { for (const lang of ['ar', 'fr']) {
    const d = good();
    d.language = lang;
    assert.deepEqual(validate(d), {});
} });
test('reject under 18 on start date, including one day short', () => { const d = good(); d.birth = '2008-11-24'; assert.ok(validate(d).birth); d.birth = '2008-11-23'; assert.equal(ageOn(String(d.birth), String(d.start)), 18); assert.ok(!validate(d).birth); });
test('reject more than 48 hours and malformed numbers', () => { for (const hours of ['48.01', '49', '0', '-1', 'NaN', '1e2', 'Infinity', '24.111', '']) {
    const d = good();
    d.hours = hours;
    assert.ok(validate(d).hours, hours);
} });
test('recalculate when weekly hours change without changing agreed salary', () => { const d = good(); d.hours = '24'; assert.equal(wage('24', String(d.start))?.minimum, '1118.21'); assert.equal(d.salary, '2236.42'); assert.deepEqual(validate(d), {}); assert.equal(wage('1', '2026-01-01')?.minimum, '46.60'); });
test('current decree is used for every valid contract date without an invented year-end expiry',()=>{for(const start of ['2025-12-31','2027-01-01'])assert.equal(wage('48',start)?.minimum,'2236.42');assert.equal(wage('48','invalid'),null);const future={from:'2099-01-01',through:null,hourly:'20.00',share:'0.60',decree:'TEST',verified:'2099-01-01'};legal.rates.push(future);try{assert.equal(currentRate('2026-11-24').hourly,'17.92');assert.equal(wage('48','2026-01-01','2100-01-01').minimum,'2496.00');}finally{legal.rates.pop();}});
test('CDD requires coherent dates but no review checkbox',()=>{const d=good();d.contractType='CDD';assert.ok(validate(d).end);d.end=d.start;assert.ok(validate(d).end);d.end='2027-01-23';assert.deepEqual(validate(d),{});assert.equal(duration('2026-11-23','2026-12-23'),30);});
test('required fields and tasks cannot be bypassed', () => { for (const k of ['employerFirst', 'workerLast', 'workerId', 'birth', 'salary', 'rest']) {
    const d = good();
    d[k] = '';
    assert.ok(validate(d)[k], k);
} const d = good(); d.tasks = []; assert.ok(validate(d).tasks); });
test('identity validation and chronology', () => { const d = good(); d.workerId = 'abc!'; assert.ok(validate(d).workerId); d.workerId = 'AB123456'; d.workerIssueDate = '2027-01-01'; assert.ok(validate(d).workerIssueDate); d.workerIssueDate = '1980-01-01'; assert.ok(validate(d).birth); });
test('real Gregorian dates and leap year age', () => { assert.equal(validDate('2026-02-30'), false); assert.equal(validDate('2024-02-29'), true); assert.equal(ageOn('2008-02-29', '2026-02-28'), 17); assert.equal(ageOn('2008-02-29', '2026-03-01'), 18); });
test('other tasks are required free text only when selected',()=>{const d=good();d.tasks=['other'];assert.ok(validate(d).otherTask);d.otherTask='تنظيم مكتبة البيت وترتيب الوثائق';assert.deepEqual(validate(d),{});d.tasks=['home'];d.otherTask='';assert.deepEqual(validate(d),{});});
test('editing preserves unrelated memory and revalidates', () => { const d = good(); const changed = { ...d, employerFirst: 'اسم معدل', workerFirst: 'عاملة معدلة' }; assert.equal(changed.salary, d.salary); assert.equal(changed.employerId, d.employerId); assert.deepEqual(validate(changed), {}); changed.salary = '2000'; assert.ok(validate(changed).salary); });
test('invalid amount and non-cash benefits cannot evade floor', () => { for (const salary of ['0', '-3', '2236.419', 'NaN', '1e5']) {
    const d = good();
    d.salary = salary;
    assert.ok(validate(d).salary);
} const d = good(); d.salary = '2000'; d.benefits = 'both'; assert.ok(validate(d).salary); });
test('all 4800 permitted hundredth-hour values match an independent exact integer calculation', () => { for (let units = 1; units <= 4800; units++) {
    const cents = (BigInt(units) * 46592n + 999n) / 1000n;
    const expected = `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
    assert.equal(wage((units / 100).toFixed(2), '2026-11-23')?.minimum, expected);
} });
