import test from 'node:test';
import assert from 'node:assert/strict';
import {REPORTING_CONTROL_CASES} from '../site/data/control-work-reporting.js';
import {REPORTING_CONTROL_CHECKPOINTS} from '../site/data/control-work-reporting-checkpoints.js';
import {CASE_BANK,CASE_BY_ID,CASE_CHECKPOINTS,availableCases,verifyCheckpoint} from '../site/engine/casebook.js';
const answer=(id,label)=>REPORTING_CONTROL_CHECKPOINTS[id].find(q=>q.label===label)?.answer;
const close=(a,b,where)=>assert.ok(Math.abs(a-b)<=1e-8,where+': '+a+' != '+b);

test('13 reporting control tasks are distinct, searchable, sourced and have worked solutions',()=>{
 assert.equal(REPORTING_CONTROL_CASES.length,13);
 assert.equal(CASE_BANK.length,97);
 assert.equal(availableCases('Контрольные · Финансовая отчётность').length,13);
 assert.equal(new Set(CASE_BANK.map(c=>c.id)).size,CASE_BANK.length);
 for(const item of REPORTING_CONTROL_CASES){
  assert.ok(CASE_BY_ID.has(item.id),item.id);
  assert.ok(item.conditionHtml.length>110,item.id);
  assert.ok(item.steps.length>=3,item.id);
  assert.ok(item.solutionHtml.length>200,item.id);
  assert.ok(item.source?.length>=15,item.id);
  assert.ok(availableCases('Все направления',item.id).some(c=>c.id===item.id),item.id);
 }
 for(const id of ['F01','F19','V01','B09','LC01']){
  assert.ok(CASE_BY_ID.has(id),'preexisting case removed: '+id);
 }
});

test('numeric controls are finite, have plausible tolerances and reject malformed submissions',()=>{
 for(const [id,checks] of Object.entries(REPORTING_CONTROL_CHECKPOINTS)){
  assert.ok(CASE_BY_ID.has(id),id);
  assert.equal(CASE_CHECKPOINTS[id],checks);
  assert.ok(checks.length>=2,id);
  for(const q of checks){
   assert.ok(Number.isFinite(q.answer),id+'/'+q.label);
   assert.ok(q.tolerance>=0&&q.tolerance<0.1,id);
   assert.equal(verifyCheckpoint(q,String(q.answer)),true,id+'/'+q.label);
   assert.equal(verifyCheckpoint(q,'NaN'),false,id);
   assert.equal(verifyCheckpoint(q,''),null,id);
  }
 }
 for(const id of ['CW-F01','CW-F02','CW-F05','CW-F09']){
  assert.equal(REPORTING_CONTROL_CHECKPOINTS[id],undefined,'free reasoning must not be auto-graded: '+id);
 }
});

test('three-statement Alpha case reconciles profit, cash and balance',()=>{
 const A=id=>REPORTING_CONTROL_CHECKPOINTS['CW-F03'].find(x=>x.label===id).answer;
 close(A('Прибыль за январь'),800-300-50,'P&L');
 close(A('CFO января'),600-250,'CFO');
 close(A('CFI января'),-600,'CFI');
 close(A('CFF января'),1000+500-100,'CFF');
 close(A('Деньги на конец января'),350-600+1400,'net cash');
 close(A('Балансовая стоимость активов'),1150+200+600-50,'assets');
 close(A('Обязательства на конец января'),500-100+300-250,'liabilities');
 close(A('Собственный капитал на конец января'),1000+450,'equity');
 close(A('Балансовая стоимость активов'),A('Обязательства на конец января')+A('Собственный капитал на конец января'),'identity');
});

test('other original numeric reporting answers reconcile from independent identities',()=>{
 close(answer('CW-F04','Темп роста выручки'),(6500/5000-1)*100,'sales');
 close(answer('CW-F04','Темп роста чистой прибыли'),(700/400-1)*100,'profit growth');
 close(answer('CW-F04','Изменение NWC по ДЗ, запасам и КЗ'),(1300-600)+(900-500)-(1000-700),'NWC');
 close(answer('CW-F04','Изменение денежных средств'),450-800,'delta cash');
 close(answer('CW-F06','Чистая прибыль'),(20-9-2-1.5-1-.5)*.75,'Technolux');
 close(answer('CW-F07','Чистая прибыль при неизменных процентах'),(40-18-2-1.5-1-.5)*.75,'double output');
 close(answer('CW-F10','Прибыль от продажи оборудования'),9-(10-2),'sale equipment');
 close(answer('CW-F10','Суммарный эффект в P&L'),-2+(9-(10-2)),'sale p&l');
 close(answer('CW-F11','Изменение денежных средств'),20-5-1,'loan cash');
 close(answer('CW-F12','CFO'),3-11-4,'inventory');
 close(answer('CW-F13','CFO до изменений WC и прочих корректировок'),-8+15+5,'noncash adjustments');
 assert.match(CASE_BY_ID.get('CW-F04').solutionHtml,/не установлена/);
 assert.match(CASE_BY_ID.get('CW-F08').answerHtml,/не определяется/);
 assert.match(CASE_BY_ID.get('CW-F13').answerHtml,/не определяется/);
});
