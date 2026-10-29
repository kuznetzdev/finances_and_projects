import test from 'node:test';
import assert from 'node:assert/strict';
import {VALUATION_CONTROL_CASES} from '../site/data/control-work-valuation.js';
import {VALUATION_CONTROL_CHECKPOINTS} from '../site/data/control-work-valuation-checkpoints.js';
import {REPORTING_CONTROL_CASES} from '../site/data/control-work-reporting.js';
import {CASE_BANK,CASE_BY_ID,CASE_CHECKPOINTS,availableCases,verifyCheckpoint} from '../site/engine/casebook.js';
const amount=(id,label)=>{
 const q=VALUATION_CONTROL_CHECKPOINTS[id]?.find(q=>q.label===label);
 assert.ok(q,id+'/'+label);return q.answer;
};
const close=(got,expected,name)=>assert.ok(Math.abs(got-expected)<1e-9,name+': '+got+' != '+expected);

test('ten distinct valuation control problems supplement 13 reporting cases, originals remain',()=>{
 assert.equal(VALUATION_CONTROL_CASES.length,10);
 assert.equal(REPORTING_CONTROL_CASES.length,13);
 assert.equal(CASE_BANK.length,97);
 assert.equal(new Set(CASE_BANK.map(c=>c.id)).size,97);
 assert.equal(availableCases('Контрольные · Оценка бизнеса').length,10);
 assert.equal(availableCases('Контрольные · Финансовая отчётность').length,13);
 for(const item of VALUATION_CONTROL_CASES){
  assert.ok(CASE_BY_ID.has(item.id),item.id);
  assert.ok(item.conditionHtml.length>200,item.id);
  assert.ok(item.steps.length>=3,item.id);
  assert.ok(item.solutionHtml.length>230,item.id);
  assert.ok(item.source.includes('Работа №3'),item.id);
  assert.ok(availableCases('Все направления',item.id).some(c=>c.id===item.id),item.id);
 }
 assert.equal(CASE_BY_ID.get('F01').title,'«Баланс за день»');
 assert.ok(CASE_BY_ID.has('B09'));
});

test('every graded value is finite and no ambiguous theoretical case gets automatic numeric credit',()=>{
 for(const [id,checks] of Object.entries(VALUATION_CONTROL_CHECKPOINTS)){
  assert.ok(CASE_BY_ID.has(id),id);
  assert.equal(CASE_CHECKPOINTS[id],checks,id);
  for(const q of checks){
   assert.ok(Number.isFinite(q.answer),id+'/'+q.label);
   assert.equal(verifyCheckpoint(q,String(q.answer)),true,id+'/'+q.label);
   assert.equal(verifyCheckpoint(q,'NaN'),false,id);
   assert.equal(verifyCheckpoint(q,''),null,id);
  }
 }
 for(const id of ['CW-V01','CW-V02','CW-V03','CW-V04']){
  assert.equal(CASE_CHECKPOINTS[id],undefined,id+': reasoning must not be graded numerically');
 }
});

test('independent WACC and DCF calculations distinguish tax and cashflow timing',()=>{
 const ke=11.05+1.2*6.10+11.19+1.50+2;
 const wacc=.55*ke+.45*15;
 const pv=[-200,90,200].reduce((acc,cf,i)=>acc+cf/Math.pow(1+wacc/100,i+1),0);
 close(amount('CW-V05','Стоимость собственного капитала Ke'),ke,'Ke');
 close(amount('CW-V05','WACC без налогового щита'),wacc,'WACC');
 close(amount('CW-V05','PV всех FCFF при WACC без щита'),pv,'PV');
 assert.ok(Math.abs((.55*ke+.45*15*(1-.25))-wacc)>.1,'tax-conditional WACC must differ');
 assert.match(CASE_BY_ID.get('CW-V05').answerHtml,/требует/);
});

test('independent FCFE computations do not double-count already deducted interest',()=>{
 const fcfe2022=320+150-1000-(850-950)+(6000-5000);
 const fcfe2024=280+300-850-(950-1100)+(5500-5000);
 close(amount('CW-V06','FCFE за 2022 год'),fcfe2022,'FCFE2022');
 close(amount('CW-V09','FCFE за 2024 год'),fcfe2024,'FCFE2024');
 close(amount('CW-V06','Изменение операционного оборотного капитала'),-100,'NWC2022');
 close(amount('CW-V09','Изменение операционного оборотного капитала'),-150,'NWC2024');
 close(amount('CW-V06','Чистое привлечение долга'),1000,'debt2022');
 close(amount('CW-V09','Чистое привлечение долга'),500,'debt2024');
});

test('perpetuity, capex and EV-to-equity reconciliation retain financial qualifications',()=>{
 close(amount('CW-V07','Enterprise Value'),100/(.12-.05),'EV');
 close(amount('CW-V07','Equity Value'),100/(.12-.05)-50,'Equity');
 close(amount('CW-V08','FCFF при ранее неучтённом CAPEX'),3500-1200,'conditional FCFF');
 close(amount('CW-V10','Equity Value через FCFF'),900-150+80,'operating equity bridge');
 close(amount('CW-V10','Расхождение двух оценок'),900-150+80-800,'reconciliation gap');
 assert.match(CASE_BY_ID.get('CW-V08').solutionHtml,/Сценарий B/);
 assert.match(CASE_BY_ID.get('CW-V10').solutionHtml,/не позволяют определить причину/);
 assert.ok(CASE_BY_ID.get('CW-V08').caveat);
 assert.ok(CASE_BY_ID.get('CW-V10').caveat);
});
