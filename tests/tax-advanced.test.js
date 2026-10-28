import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise,checkAnswer} from '../site/engine/index.js';
import {templates} from '../site/engine/templates/tax-advanced.js';
import {CASE_BANK,CASE_BY_ID} from '../site/engine/casebook.js';
import {CONCEPTS} from '../site/data/knowledge.js';

const near=(actual,expected,context)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<0.0001,`${context}: ${actual} != ${expected}`);
const answer=(exercise,key)=>{const q=exercise.questions.find(q=>q.key===key); assert.ok(q,`missing ${key}`); return q.answer;};
const present=(exercise,key,expected)=>{if(exercise.questions.some(q=>q.key===key))near(answer(exercise,key),expected,`${exercise.templateId}/${key}`);};
const pv=(items,r)=>items.reduce((a,v,i)=>a+v/(1+r)**(i+1),0);

test('Iteration 1 registers four distinct generators with course metadata',()=>{
 assert.equal(templates.length,4);
 assert.deepEqual(templates.map(x=>x.id),['tax-depreciation-method-comparison','tax-temporary-differences','tax-payments-schedule','tax-loss-carryforward']);
 assert.equal(TEMPLATE_CATALOG.length,115);
 for(const t of templates){
  const row=TEMPLATE_CATALOG.find(x=>x.id===t.id);
  assert.ok(row && row.area==='taxes' && row.skill && row.topic==='tax',t.id);
 }
});

test('Tax generator answers are deterministic and obey independent identities for 400 seeds',()=>{
 for(const template of templates){
  for(let seed=1;seed<=400;seed++){
   const args={templateId:template.id,topic:'tax',level:4,seed};
   const ex=generateExercise(args);
   assert.deepEqual(ex,generateExercise(args),template.id);
   assert.ok(ex.story.includes('учебн') || ex.story.includes('Учебн'),template.id);
   assert.ok(ex.questions.length>=4,template.id);
   assert.ok(ex.explanation.length>=3 && ex.hint.length>=65,template.id);
   assert.ok(!/NaN|Infinity|undefined/.test(ex.story+JSON.stringify(ex.questions)),template.id);
   assert.equal(new Set(ex.questions.map(x=>x.key)).size,ex.questions.length,template.id);
   for(const q of ex.questions){
    if(q.type==='number'){
     assert.ok(Number.isFinite(q.answer),template.id);
     assert.ok(checkAnswer(q,String(q.answer).replace('.',',')),template.id);
    }
   }
   const v=ex.audit;
   assert.ok(v && v.tax===0.25,template.id);
   if(template.id==='tax-depreciation-method-comparison'){
    assert.equal(v.linear.length,v.life);
    for(const kind of ['linear','declining','sumYears']){
     near(v[kind].reduce((s,n)=>s+n,0),v.cost,kind+' total');
     assert.ok(v[kind].every(n=>n>=0),kind+' negative');
    }
    near(v.linear[0],v.cost/v.life,'linear first');
    near(v.sumYears[0],v.cost*v.life/(v.life*(v.life+1)/2),'SYD first');
    near(v.declining[0],v.cost*2/v.life,'DDB first');
    present(ex,'linear-first',v.linear[0]);
    present(ex,'declining-first',v.declining[0]);
    present(ex,'syd-first',v.sumYears[0]);
    present(ex,'pv-linear',pv(v.linear,v.rate)*v.tax);
    present(ex,'pv-accelerated',pv(v.declining,v.rate)*v.tax);
    present(ex,'pv-difference',(pv(v.declining,v.rate)-pv(v.linear,v.rate))*v.tax);
   } else if(template.id==='tax-temporary-differences'){
    near(v.taxable,v.bookProfit+v.bookDep-v.taxDep,'taxable');
    near(v.currentTax,v.taxable*v.tax,'current tax');
    near(v.dtl,(v.taxDep-v.bookDep)*v.tax,'end DTL');
    near(v.deferredExpense,v.dtl,'deferred');
    near(v.currentTax+v.deferredExpense,v.bookProfit*v.tax,'total tax expense');
    present(ex,'taxable',v.taxable);
    present(ex,'current-tax',v.currentTax);
    present(ex,'dtl',v.dtl);
    present(ex,'total-tax',v.bookProfit*v.tax);
   } else if(template.id==='tax-payments-schedule'){
    assert.equal(v.accrued.length,4);
    assert.equal(v.paid.length,4);
    near(v.paid[0],0,'opening payment');
    for(let i=1;i<4;i++)near(v.paid[i],v.accrued[i-1],'payment lag');
    near(v.endPayable,v.accrued[3],'ending tax payable');
    near(v.accrued.reduce((a,b)=>a+b,0)-v.paid.reduce((a,b)=>a+b,0),v.endPayable,'tax bridge');
    present(ex,'accrued-total',v.accrued.reduce((a,b)=>a+b,0));
    present(ex,'cash-paid',v.paid.reduce((a,b)=>a+b,0));
    present(ex,'end-payable',v.endPayable);
   } else if(template.id==='tax-loss-carryforward'){
    let loss=v.initialLoss,used=0,taxes=0;
    for(let i=0;i<3;i++){
     const usedNow=Math.min(loss,v.profits[i]*v.capFraction);
     near(v.used[i],usedNow,'loss applied');
     loss-=usedNow;used+=usedNow;
     near(v.taxable[i],v.profits[i]-usedNow,'taxable after loss');
     taxes+=v.taxable[i]*v.tax;
    }
    near(v.endLoss,loss,'loss remaining');
    near(v.totalTax,taxes,'tax paid');
    present(ex,'used-total',used);
    present(ex,'tax-total',taxes);
    present(ex,'loss-end',loss);
    present(ex,'tax-saved',used*v.tax);
   }
  }
 }
});

test('B13 is a complete distinct solved case integrated into the case bank',()=>{
 assert.equal(CASE_BANK.length,73);
 const b=CASE_BY_ID.get('B13');
 assert.ok(b);
 assert.match(b.conditionHtml,/600|амортизац/i);
 assert.match(b.conditionHtml,/25%/);
 assert.match(b.solutionHtml,/налог|Налог/i);
 assert.ok(b.steps.length>=5);
 assert.ok(b.solutionHtml.length>1000);
 assert.ok(b.answerHtml.includes('NPV') || b.answerHtml.includes('PV'));
});

test('Iteration 1 adds canonical terms with complete educational formulas and no duplicates',()=>{
 const ids=['depr-straight-line','depr-declining-balance','depr-sum-years','tax-temporary-difference','tax-permanent-difference','tax-payable','tax-loss-utilization','deferred-tax-expense'];
 assert.equal(CONCEPTS.length,231);
 for(const id of ids){
  const matches=CONCEPTS.filter(x=>x.id===id);
  assert.equal(matches.length,1,id);
  assert.ok(matches[0].definition.length>50,id);
  assert.ok(matches[0].formulas.length>=1,id);
 }
});
