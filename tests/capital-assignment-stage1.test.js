import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE_BANK,CASE_BY_ID,CASE_CHECKPOINTS,availableCases,verifyCheckpoint} from '../site/engine/casebook.js';
import {LECTURE_CASES} from '../site/data/lecture-cases.js';
import {LECTURE_CHECKPOINTS} from '../site/data/lecture-checkpoints.js';
import {CAPITAL_ASSIGNMENT_CASES} from '../site/data/capital-assignment-cases.js';
import {CAPITAL_ASSIGNMENT_CHECKPOINTS} from '../site/data/capital-assignment-checkpoints.js';

const eq=(actual,expected,context)=>assert.ok(Math.abs(actual-expected)<1e-9,
 context+': '+actual+' vs '+expected);

test('two fixed Oct 30 tasks are added once without duplicating three earlier LBO assignments',()=>{
 assert.equal(CAPITAL_ASSIGNMENT_CASES.length,2);
 assert.deepEqual(CAPITAL_ASSIGNMENT_CASES.map(c=>c.id),['CS01','CS02']);
 assert.equal(LECTURE_CASES.length,10);
 assert.equal(CASE_BANK.length,107);
 assert.equal(new Set(CASE_BANK.map(c=>c.id)).size,107);
 assert.equal(availableCases('LBO · видеолекция').length,3);
 assert.equal(availableCases('Структура капитала · комплексные кейсы').length,6);
 for(const id of ['LC01','LC02','LC03','CS01','CS02']){
  const record=CASE_BY_ID.get(id);
  assert.ok(record,'Missing original problem '+id);
  assert.equal(CASE_BANK.filter(c=>c.id===id).length,1,id+' duplicated');
  assert.ok(record.source.length>=35,id);
  assert.ok(record.solutionHtml.length>=1400,id+' shallow solution');
  assert.ok(record.steps.length>=5,id+' insufficient alternatives');
  assert.match(record.solutionHtml,/Альтернатив|сценари|кредитор|договор/i,id+' insufficient scenario discussion');
 }
 assert.match(CASE_BY_ID.get('CS01').topic,/4\.1\.3/);
 assert.match(CASE_BY_ID.get('CS02').topic,/4\.1\.4/);
 assert.ok(availableCases('Все направления','20 000').some(c=>c.id==='CS01'));
 assert.ok(availableCases('Все направления','2 000').some(c=>c.id==='CS02'));
});

test('original LBO numbers and the extended IRR and stress outcomes agree with independent formula',()=>{
 const lbo=LECTURE_CHECKPOINTS.LC01;
 const ev=500,d0=350,sponsor=ev-d0,annual=50,years=4;
 const debt=d0-years*annual,equity=ev-debt;
 assert.equal(lbo.length,5);
 eq(lbo[0].answer,debt,'debt');
 eq(lbo[1].answer,equity,'exit equity');
 eq(lbo[2].answer,equity/sponsor,'MOIC');
 eq(lbo[3].answer,((equity/sponsor)**(1/years)-1)*100,'IRR');
 eq(lbo[4].answer,ev*.8-debt,'stress equity');
 assert.match(CASE_BY_ID.get('LC01').solutionHtml,/23,59%/);
 assert.match(CASE_BY_ID.get('LC01').conditionHtml,/после процентов/);
 assert.match(CASE_BY_ID.get('LC01').solutionHtml,/FCFF\/FCF до уплаты процентов/);
});

test('strict 6x leverage case is an extra assumption, not a universal bank rule',()=>{
 const q=LECTURE_CHECKPOINTS.LC02;
 const ev=900,ebitda=100;
 const requested=ev*.7,leverage=requested/ebitda,limit=6*ebitda;
 assert.equal(q.length,4);
 eq(q[0].answer,requested,'requested debt');
 eq(q[1].answer,leverage,'debt / EBITDA');
 eq(q[2].answer,limit,'strict loan ceiling');
 eq(q[3].answer,requested-limit,'additional equity');
 assert.match(CASE_BY_ID.get('LC02').conditionHtml,/дополнительн|Дополнительно/);
 assert.match(CASE_BY_ID.get('LC02').solutionHtml,/не логическая гарантия отказа/);
 assert.match(CASE_BY_ID.get('LC02').solutionHtml,/CapEx/);
});

test('LBO versus venture retains original companies and does not claim instant sponsor wipeout',()=>{
 const item=CASE_BY_ID.get('LC03');
 assert.match(item.conditionHtml,/мебель/);
 assert.match(item.conditionHtml,/200%/);
 assert.match(item.conditionHtml,/проценты/);
 assert.equal(CASE_CHECKPOINTS.LC03,undefined,'qualitative task must remain independently assessed');
 assert.match(item.solutionHtml,/не гарантированный итог/);
 assert.match(item.solutionHtml,/рефинансировать/);
 assert.match(item.solutionHtml,/Венчур|венчур/);
});

test('MM fixed-source 20 000/4 000 and supplementary 1 500 distress calculation',()=>{
 const item=CASE_BY_ID.get('CS01'),q=CAPITAL_ASSIGNMENT_CHECKPOINTS.CS01;
 const vu=20000,debt=4000,tax=.25,distress=1500;
 assert.match(item.conditionHtml,/20 000/);
 assert.match(item.conditionHtml,/4 000/);
 assert.match(item.conditionHtml,/25%/);
 assert.match(item.conditionHtml,/Ставка долга.*не задана/);
 assert.equal(q.length,3);
 eq(q[0].answer,tax*debt,'shield');
 eq(q[1].answer,vu+tax*debt,'levered EV');
 eq(q[2].answer,vu+tax*debt-distress,'tradeoff');
 assert.match(item.solutionHtml,/Годовую экономию без ставки долга/);
 assert.match(item.solutionHtml,/альтернатив/i);
});

test('pecking-order waterfall, reserve and interest amounts reconcile',()=>{
 const item=CASE_BY_ID.get('CS02'),q=CAPITAL_ASSIGNMENT_CHECKPOINTS.CS02;
 const need=2000,internal=800,bankMax=1500,bondMax=1000,bankRate=.10,bondRate=.12;
 const bank=Math.min(need-internal,bankMax),bonds=Math.min(bondMax,Math.max(0,need-internal-bank));
 eq(q[0].answer,internal,'cash');
 eq(q[1].answer,bank,'bank');
 eq(q[2].answer,bonds,'bonds');
 eq(q[3].answer,need-internal-bank-bonds,'shares');
 eq(q[4].answer,bank*bankRate,'interest');
 const reserve=500,free=internal-reserve,bank2=Math.min(bankMax,need-free),bonds2=need-free-bank2;
 eq(q[5].answer,free,'reserved cash');
 eq(q[6].answer,bonds2,'alternative bonds');
 eq(q[7].answer,bank2*bankRate+bonds2*bondRate,'alternative interest');
 assert.equal(q.length,8);
 assert.match(item.solutionHtml,/НЕ гарантирует наличия 800 млн денег/);
 assert.match(item.solutionHtml,/альтернативную стоимость/);
 assert.match(item.solutionHtml,/ковенанты/);
 assert.match(item.conditionHtml,/предварительно подтвердил лимит/);
});

test('each new numeric answer is graded, has three progressive hints and detects changed values',()=>{
 for(const id of ['LC01','LC02','CS01','CS02']){
  for(const q of CASE_CHECKPOINTS[id]){
   assert.ok(Number.isFinite(q.answer),id+':'+q.label);
   assert.equal(verifyCheckpoint(q,String(q.answer)),true,id+':'+q.label);
   assert.equal(verifyCheckpoint(q,String(q.answer+1)),false,id+':'+q.label);
   assert.equal(q.hint.levels.length,3,id+':'+q.label);
   assert.ok(q.hint.levels.every((s,i)=>s&&s.length>=(i===1?8:18)),id+': short hint');
   assert.ok(q.hint.levels[0]!==q.hint.levels[1],id+': duplicate hint level');
  }
 }
});
