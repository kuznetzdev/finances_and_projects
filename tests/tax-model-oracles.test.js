import test from 'node:test';
import assert from 'node:assert/strict';
import {generateExercise,TEMPLATE_CATALOG} from '../site/engine/index.js';
import {TAX_MODEL_ORACLE_TEMPLATES,validateTaxModelOracle} from '../scripts/lib/tax-model-oracles.js';

function exercise(id,level,seed,policy){
 const t=TEMPLATE_CATALOG.find(x=>x.id===id);
 assert.ok(t,'unregistered '+id);
 return generateExercise({templateId:id,topic:t.topic,level,seed,...(policy?{policy}:{})});
}
function mutateAnswer(ex,key){
 return {...ex,questions:ex.questions.map(q=>q.key===key?{
  ...q,answer:q.type==='number'?q.answer+1:q.answer==='Да'?'Нет':'Да'
 }:q)};
}
test('all 15 tax and financial-modeling templates have independent checks at each supported level',()=>{
 assert.equal(TAX_MODEL_ORACLE_TEMPLATES.length,15);
 for(const id of TAX_MODEL_ORACLE_TEMPLATES){
  const t=TEMPLATE_CATALOG.find(x=>x.id===id);
  for(let level=t.min;level<=4;level++){
   for(let seed=1;seed<=120;seed++){
    const ex=exercise(id,level,seed);
    assert.deepEqual(validateTaxModelOracle(ex),[],id+' level='+level+' seed='+seed);
    assert.ok(ex.inputs&&typeof ex.inputs==='object',id);
    for(const q of ex.questions){
     const changed=mutateAnswer(ex,q.key);
     assert.ok(validateTaxModelOracle(changed).some(e=>e.code==='TAX_MODEL_MISMATCH'),
      id+'/'+q.key+' failed to detect corrupted answer seed='+seed);
    }
   }
  }
 }
});

test('fails closed for missing primitive inputs, unexpected or removed questions, damaged story',()=>{
 for(const id of TAX_MODEL_ORACLE_TEMPLATES){
  const ex=exercise(id,4,33);
  assert.ok(validateTaxModelOracle({...ex,inputs:{}})
   .some(e=>e.code==='TAX_MODEL_INPUTS'),id);
  assert.ok(validateTaxModelOracle({...ex,story:'Нет исходных чисел.'})
   .some(e=>e.code==='TAX_MODEL_STORY'),id);
  assert.ok(validateTaxModelOracle({...ex,questions:[...ex.questions,{
   key:'new-unknown-step',label:'Новый показатель',type:'number',answer:0,
   unit:'млн ₽',tolerance:.02
  }]}).some(e=>e.code==='TAX_MODEL_UNMAPPED'),id);
  assert.ok(validateTaxModelOracle({...ex,questions:ex.questions.slice(1)})
   .some(e=>e.code==='TAX_MODEL_MISSING'),id);
 }
});

test('mutating original inputs cannot silently pass against unchanged story and answers',()=>{
 for(const id of TAX_MODEL_ORACLE_TEMPLATES){
  const ex=exercise(id,4,11);
  const key=Object.keys(ex.inputs).find(k=>typeof ex.inputs[k]==='number'&&ex.inputs[k]>0);
  assert.ok(key,id+' lacks numeric primitive');
  const corrupted={...ex,inputs:{...ex.inputs,[key]:ex.inputs[key]+1000000}};
  assert.ok(validateTaxModelOracle(corrupted).some(e=>e.code==='TAX_MODEL_STORY'),
    id+' omitted source consistency check');
 }
});

test('2025 historical VAT policies are handled without embedding 2026 VAT rates',()=>{
 for(const id of ['t-vat-difference','t-vat-inclusive']){
  for(let seed=1;seed<=20;seed++){
   const ex=exercise(id,4,seed,'RU-2025');
   assert.deepEqual(validateTaxModelOracle(ex),[],id+' 2025 seed='+seed);
   const wrong={...ex,taxPolicy:'RU-2026'};
   assert.ok(validateTaxModelOracle(wrong).some(e=>e.code==='TAX_MODEL_POLICY'),id);
  }
 }
});

test('progressive tax and insurance reference brackets agree with declared policy',()=>{
 for(const id of ['t-ndfl','t-insurance']){
  const ex=exercise(id,4,97);
  assert.deepEqual(validateTaxModelOracle(ex),[]);
  const tampered=id==='t-ndfl'?
   {...ex,inputs:{...ex.inputs,salaryBands:ex.inputs.salaryBands.map((x,i)=>
     i===0?{...x,rate:.99}:x)}}:
   {...ex,inputs:{...ex.inputs,threshold:ex.inputs.threshold+12345}};
  assert.ok(validateTaxModelOracle(tampered).some(e=>e.code==='TAX_MODEL_POLICY'),id);
 }
});
