import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {CAPITAL_ORACLE_TEMPLATES,validateCapitalOracle} from '../scripts/lib/capital-answer-oracles.js';
import {TAX_ADVANCED_ORACLE_TEMPLATES,validateTaxAdvancedOracle} from '../scripts/lib/tax-advanced-answer-oracles.js';
import {validateExercise} from '../scripts/lib/preflight.js';
import {validateInstrumentOracle} from '../scripts/lib/instrument-oracles.js';

test('eleven formerly domain-identity-only generators have independent full-answer coverage',()=>{
 const all=[...CAPITAL_ORACLE_TEMPLATES,...TAX_ADVANCED_ORACLE_TEMPLATES];
 assert.equal(all.length,11);
 assert.equal(new Set(all).size,11);
 for(const id of all)assert.ok(TEMPLATE_CATALOG.find(t=>t.id===id),id+' missing');
});

test('7 capital oracles: every answer checked and corrupted, including choices and all levels',()=>{
 let total=0;
 for(const id of CAPITAL_ORACLE_TEMPLATES){
  const t=TEMPLATE_CATALOG.find(x=>x.id===id);
  for(const level of new Set([t.min,3,4].filter(x=>x>=t.min))){
   for(let seed=1;seed<=180;seed++){
    const ex=generateExercise({templateId:id,topic:t.topic,level,seed});
    assert.deepEqual(validateExercise(ex),[]);
    assert.deepEqual(validateCapitalOracle(ex),[],id+' seed '+seed+' level '+level);
    total+=ex.questions.length;
    for(let i=0;i<ex.questions.length;i++){
     const question=ex.questions[i];
     const broken={...question,answer:question.type==='choice'?'Повреждённый вариант':question.answer+1};
     const mutated={...ex,questions:ex.questions.map((q,k)=>i===k?broken:q)};
     assert.ok(validateCapitalOracle(mutated).some(e=>e.code==='CAPITAL_MISMATCH'),
      id+' corrupted '+question.key+' not detected');
    }
   }
  }
 }
 assert.ok(total>6000,'too few independently verified numeric/choice answers');
});

test('4 advanced tax oracles: every input, cash-flow schedule and answer independently recalculated',()=>{
 let count=0;
 for(const id of TAX_ADVANCED_ORACLE_TEMPLATES){
  const t=TEMPLATE_CATALOG.find(x=>x.id===id);
  for(const level of new Set([t.min,3,4].filter(x=>x>=t.min))){
   for(let seed=1;seed<=180;seed++){
    const ex=generateExercise({templateId:id,topic:t.topic,level,seed});
    assert.deepEqual(validateTaxAdvancedOracle(ex),[],id+' seed '+seed+' level '+level);
    for(let i=0;i<ex.questions.length;i++){
     const old=ex.questions[i];
     const mutation={...ex,questions:ex.questions.map((q,k)=>
      i===k?{...q,answer:q.answer+2}:q)};
     assert.ok(validateTaxAdvancedOracle(mutation).some(e=>e.code==='TAX_ADV_MISMATCH'),
      id+'/'+old.key+' faulty answer not caught');
     count++;
    }
   }
  }
 }
 assert.ok(count>2500);
});

test('answer oracles fail closed on removed, inserted, corrupted inputs and falsified narratives',()=>{
 const pairs=[
  ...CAPITAL_ORACLE_TEMPLATES.map(id=>({id,check:validateCapitalOracle,prefix:'CAPITAL'})),
  ...TAX_ADVANCED_ORACLE_TEMPLATES.map(id=>({id,check:validateTaxAdvancedOracle,prefix:'TAX_ADV'}))
 ];
 for(const {id,check,prefix} of pairs){
  const t=TEMPLATE_CATALOG.find(x=>x.id===id);
  const ex=generateExercise({templateId:id,topic:t.topic,level:4,seed:23});
  assert.deepEqual(check(ex),[],id);
  const without={...ex,audit:null};
  assert.ok(check(without).some(x=>x.code===prefix+'_INPUTS'),id+' missing primitive accepted');
  const trimmed={...ex,questions:ex.questions.slice(1)};
  assert.ok(check(trimmed).some(x=>x.code===prefix+'_OMITTED'),id+' removed question accepted');
  const injected={...ex,questions:[...ex.questions,{key:'unexpected',type:'number',answer:777}]};
  assert.ok(check(injected).some(x=>x.code===prefix+'_UNMAPPED'),id+' unexpected question accepted');
  const corrupted={...ex,story:'Случайно повреждённое условие без исходных чисел.'};
  assert.ok(check(corrupted).some(x=>x.code===prefix+'_STORY'),id+' raw/story drift accepted');
  const duplicated={...ex,questions:[...ex.questions,ex.questions[0]]};
  assert.ok(check(duplicated).some(x=>x.code===prefix+'_DUPLICATE'),id+' duplicate answer accepted');
 }
});

test('preflight instrument oracle still rejects tampering and does not hide missing data',()=>{
 const ex=generateExercise({templateId:'bond-coupon-duration',topic:'valuation',level:4,seed:11});
 assert.deepEqual(validateInstrumentOracle(ex),[]);
 const wrong={...ex,questions:ex.questions.map((q,i)=>i? q : {...q,answer:q.answer+.5})};
 assert.ok(validateInstrumentOracle(wrong).some(e=>e.code==='INSTRUMENT_MISMATCH'));
});
