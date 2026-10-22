import test from 'node:test';
import assert from 'node:assert/strict';
import {TOPICS,TEMPLATE_CATALOG,generateExercise,checkAnswer,formatAnswer} from '../site/engine/index.js';
import {TAX_POLICIES,policyFor,progressiveTax,insuranceContributions} from '../site/data/tax.js';
import {CONCEPTS,OPERATIONS} from '../site/data/knowledge.js';
const near=(a,b,t=.03)=>assert.ok(Math.abs(a-b)<=t,`Expected ${a} ≈ ${b}`);
const ans=(x,id)=>{const q=x.questions.find(y=>y.key===id);assert.ok(q,`Missing ${id} in ${x.templateId}`);return q.answer;};

test('All topics, templates and learning concepts have unique stable identifiers',()=>{
 assert.equal(TEMPLATE_CATALOG.length,104);
 assert.equal(new Set(TEMPLATE_CATALOG.map(x=>x.id)).size,TEMPLATE_CATALOG.length);
 assert.equal(new Set(CONCEPTS.map(x=>x.id)).size,CONCEPTS.length);
 assert.ok(CONCEPTS.length>=40);
 assert.ok(OPERATIONS.length>=20);
 for(const entry of TEMPLATE_CATALOG) assert.ok(TOPICS.some(t=>t.id===entry.topic));
});
test('Tax parameters are versioned, sourced and isolated',()=>{
 const p=policyFor();assert.equal(p.year,2026);assert.equal(p.profitRate,.25);assert.equal(p.vatRate,.22);
 assert.equal(p.insuranceThreshold,2979000);
 assert.equal(policyFor('RU-2025').vatRate,.20);
 assert.ok(p.sources.profit.startsWith('https://www.nalog.gov.ru'));
 near(progressiveTax(6000000,p.salaryBands),882000,.001); // 2.4*.13 + 2.6*.15 + 1*.18 = .882 mln
 near(insuranceContributions(4000000,p),2979000*.3+1021000*.151,.001);
});
test('All templates generate fully answerable deterministic exercises over many seeds',()=>{
 for(const t of TEMPLATE_CATALOG){for(let level=t.min;level<=4;level++){for(let seed=1;seed<=125;seed++){
  const opts={topic:t.topic,level,seed,templateId:t.id};const a=generateExercise(opts),b=generateExercise(opts);
  assert.deepEqual(a,b,`Non deterministic ${t.id}`);
  assert.ok(a.story.length>35,`Poor description ${t.id}`);
  assert.ok(a.explanation.length>0&&a.hint&&a.source,t.id);
  assert.ok(a.questions.length>0,t.id);
  assert.equal(a.templateId,t.id);
  assert.equal(new Set(a.questions.map(x=>x.key)).size,a.questions.length,t.id);
  for(const q of a.questions){assert.ok(q.label.length>0,t.id);if(q.type==='number'){
    assert.ok(Number.isFinite(q.answer),`${t.id} nonfinite answer`);
    assert.ok(checkAnswer(q,String(q.answer).replace('.',',')),`${t.id}: exact answer rejected`);
    assert.ok(!checkAnswer(q,'undefined'));
    assert.ok(!checkAnswer(q,''));
    assert.ok(formatAnswer(q).length>2);
  }else if(q.type==='multi'){assert.ok(Array.isArray(q.answer));assert.ok(q.answer.every(v=>q.choices.includes(v)));assert.ok(checkAnswer(q,q.answer));assert.ok(!checkAnswer(q,[]));assert.ok(!checkAnswer(q,[q.answer[0],q.answer[0]]));}else{assert.ok(q.choices.includes(q.answer),t.id);assert.ok(checkAnswer(q,q.answer));}}
 }}}
});
test('Financial invariants are preserved by the new families',()=>{
 for(let seed=1;seed<=500;seed++){
  let ex=generateExercise({topic:'valuation',level:4,seed,templateId:'v-npv-irregular'});
  assert.equal(ans(ex,'accept'),ans(ex,'npv')>0?'Да':'Нет');
  ex=generateExercise({topic:'valuation',level:4,seed,templateId:'v-wacc'});
  assert.ok(ans(ex,'wacc')>0&&ans(ex,'wacc')<30);
  ex=generateExercise({topic:'valuation',level:4,seed,templateId:'v-tax-shield'});
  near(ans(ex,'shield'),ans(ex,'dep')*.25);
  ex=generateExercise({topic:'tax',level:4,seed,templateId:'t-vat-difference'});
  near(ans(ex,'out')-ans(ex,'in'),ans(ex,'pay'));
  ex=generateExercise({topic:'tax',level:4,seed,templateId:'t-vat-inclusive'});
  near(ans(ex,'net')+ans(ex,'vat'),Number((ans(ex,'net')*1.22).toFixed(5)));
  ex=generateExercise({topic:'model',level:4,seed,templateId:'m-working-capital'});
  near(ans(ex,'wc')+ans(ex,'cfo'),0);
  ex=generateExercise({topic:'ratios',level:4,seed,templateId:'r-current'});
  assert.ok(ans(ex,'quick')<ans(ex,'current'));
 }
});
test('Known exam cases: PV, YTM, WACC, NPV, CFO, tax shield',()=>{
 near(1800/(1.09**4),1275.167,0.01);
 near(((2000/1600)**(1/4)-1)*100,5.737,0.01);
 near(.45*14*.75+.55*20,15.725,.001);
 near(-2000+900/1.1+800/1.1**2+900/1.1**3,155.52,.1);
 assert.equal(450+90+20-60-15,485);
 assert.equal(6000/6*.20,200); // The user-provided case explicitly uses a 20% rate
 assert.equal(6000/6*policyFor().profitRate,250); // Current general rate
});
test('Numeric validation rejects partial numbers and injection attempts',()=>{
 const q={type:'number',answer:25,tolerance:.021};
 for(const raw of ['25abc','25/1','Infinity','NaN','2e1','25<script>',''])assert.equal(checkAnswer(q,raw),false);
 assert.equal(checkAnswer(q,' 25,00 '),true);
});