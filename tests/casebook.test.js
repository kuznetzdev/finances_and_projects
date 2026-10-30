import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE_BANK,CASE_BY_ID,CASE_CHECKPOINTS,availableCases,nextCase,verifyCheckpoint} from '../site/engine/casebook.js';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
const ans=(e,key)=>e.questions.find(x=>x.key===key).answer;
test('Original source bank and ten lecture tasks have unique identifiers, conditions, solutions and staged breakdown',()=>{
 assert.equal(CASE_BANK.length,111);
 assert.equal(new Set(CASE_BANK.map(x=>x.id)).size,111);
 assert.equal(CASE_BANK.filter(x=>x.id.startsWith('F')).length,19);
 assert.equal(CASE_BANK.filter(x=>x.id.startsWith('T')).length,17);
 assert.equal(CASE_BANK.filter(x=>x.id.startsWith('V')&&!x.id.startsWith('VC')).length,21);
 for(const item of CASE_BANK){assert.ok(item.conditionHtml.length>70,item.id);assert.ok(item.solutionHtml.length>25,item.id);assert.ok(item.steps.length>=1,item.id);assert.ok(item.topic,item.id);}
 assert.ok(CASE_BY_ID.get('F05').caveat);
 assert.ok(CASE_BY_ID.get('T15').caveat);
 assert.ok(CASE_BY_ID.get('V15').caveat);
 assert.match(CASE_BY_ID.get('F05').solutionHtml,/235,606/);
 assert.match(CASE_BY_ID.get('T15').solutionHtml,/не определяется/);
});
test('Case bank filters and anti-repeat scheduler work for shared cases',()=>{
 const first=availableCases('Отчётность и анализ');assert.equal(first.length,19);
 assert.ok(first.every(x=>x.id.startsWith('F')));
 assert.equal(availableCases('Все направления','дюпона').length>=1,true);
 const chosen=nextCase(['F01','F02','F03'], 'Отчётность и анализ',()=>0);
 assert.ok(!['F01','F02','F03'].includes(chosen.id));
});
test('Numerical answer checks explicitly reject empty and invalid values',()=>{
 assert.ok(Object.keys(CASE_CHECKPOINTS).length>=20);
 for(const [id,questions] of Object.entries(CASE_CHECKPOINTS)){
  assert.ok(CASE_BY_ID.has(id),id);
  for(const q of questions){assert.ok(Number.isFinite(q.answer),id);assert.equal(verifyCheckpoint(q,`${q.answer}`),true,id);assert.equal(verifyCheckpoint(q,' '),null);assert.equal(verifyCheckpoint(q,'привет'),false);}
 }
 assert.equal(CASE_CHECKPOINTS.T15,undefined,'Ambiguous bond date must not be auto-graded');
 assert.equal(CASE_CHECKPOINTS.F05,undefined,'Incomplete AR aging profile must not be auto-graded');
});
test('Nine additional bank-inspired generators support coherent numbers at each difficulty',()=>{
 const ids=TEMPLATE_CATALOG.filter(x=>x.id.startsWith('bank-')).map(x=>x.id);
 assert.equal(ids.length,9);
 for(const id of ids){
  const spec=TEMPLATE_CATALOG.find(t=>t.id===id);
  for(let level=spec.min;level<=4;level++)for(let seed=1;seed<=150;seed++){
   const e=generateExercise({templateId:id,level,seed});
   assert.equal(e.templateId,id);assert.ok(e.story.length>150,id);
   assert.ok(e.questions.length>=1,id);assert.ok(e.explanation.length>=2,id);
   for(const q of e.questions)if(q.type==='number')assert.ok(Number.isFinite(q.answer),id+':'+q.key);
   if(id==='bank-ledger-day'&&level===4){const liabilitiesMatch=e.explanation.at(-1).match(/обязательства (\d+)/);assert.ok(liabilitiesMatch);assert.ok(Math.abs(ans(e,'total')-ans(e,'equity')-Number(liabilitiesMatch[1]))<.021);}
   if(id==='bank-three-cashflows'&&level===4){assert.ok(Math.abs(ans(e,'delta')-ans(e,'cfo')-ans(e,'cfi')-ans(e,'cff'))<.02);assert.ok(ans(e,'closing')>0);}
   if(id==='bank-dcf-multiples-bridge'&&level===4){assert.ok(ans(e,'equity')>0);assert.ok(ans(e,'ev')>ans(e,'equity'));}
  }
 }
});