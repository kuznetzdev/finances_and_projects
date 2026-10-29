import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {BASIC_ORACLE_TEMPLATES,validateBasicOracle} from '../scripts/lib/basic-finance-oracles.js';

const template=id=>{
 const t=TEMPLATE_CATALOG.find(t=>t.id===id);
 assert.ok(t,'unregistered template: '+id);return t;
};
const generate=(id,level,seed,policy)=>{
 const t=template(id);
 return generateExercise({templateId:id,topic:t.topic,level,seed,...(policy?{policy}:{})});
};

test('14 valuation and ratio templates have independently checked answers at every difficulty',()=>{
 assert.equal(BASIC_ORACLE_TEMPLATES.length,14);
 for(const id of BASIC_ORACLE_TEMPLATES){
  const t=template(id);
  for(let level=t.min;level<=4;level++){
   for(let seed=1;seed<=120;seed++){
    const ex=generate(id,level,seed);
    assert.deepEqual(validateBasicOracle(ex),[],id+' level='+level+' seed='+seed);
    assert.ok(ex.inputs&&typeof ex.inputs==='object',id);
    for(const q of ex.questions){
     const bad={...ex,questions:ex.questions.map(item=>item.key===q.key?{
      ...item,answer:item.type==='number'?item.answer+1:
        item.answer==='Да'?'Нет':'Да'
     }:item)};
     assert.ok(validateBasicOracle(bad).some(e=>e.code==='BASIC_ORACLE_MISMATCH'),
      'missed mutated '+id+' / '+q.key+' seed='+seed);
    }
   }
  }
 }
});

test('oracle fails closed for missing inputs, new numeric/choice keys and modified story',()=>{
 for(const id of BASIC_ORACLE_TEMPLATES){
  const ex=generate(id,4,17);
  assert.ok(validateBasicOracle({...ex,inputs:{}}).some(e=>e.code==='BASIC_ORACLE_INPUTS'),id);
  const modified={...ex,questions:[...ex.questions,{
   key:'new-financial-answer',label:'Новый расчёт',type:'number',unit:'млн ₽',
   answer:17,tolerance:.02
  }]};
  assert.ok(validateBasicOracle(modified).some(e=>e.code==='BASIC_ORACLE_UNMAPPED'),id);
  const missing={...ex,questions:ex.questions.slice(1)};
  assert.ok(validateBasicOracle(missing).some(e=>e.code==='BASIC_ORACLE_MISSING'),id);
  assert.ok(validateBasicOracle({...ex,story:'В условии не приведены исходные данные.'})
   .some(e=>e.code==='BASIC_ORACLE_STORY'),id);
 }
});

test('input/source consistency detects tampered input independently of displayed answer',()=>{
 for(const id of ['v-pv','v-fv','v-wacc','v-tax-shield','r-current','r-dso']){
  const ex=generate(id,4,53);
  const key=Object.keys(ex.inputs).find(k=>typeof ex.inputs[k]==='number'&&ex.inputs[k]>0);
  assert.ok(key,id);
  const damaged={...ex,inputs:{...ex.inputs,[key]:ex.inputs[key]*2}};
  assert.ok(validateBasicOracle(damaged).some(e=>e.code==='BASIC_ORACLE_STORY'),
   id+' should expose mismatch between primitive inputs and visible story');
 }
});

test('tax policy is passed as a source parameter and not hardcoded as 25 percent',()=>{
 const ex=generate('v-tax-shield',4,23);
 assert.ok(ex.inputs.taxRate>0&&ex.inputs.taxRate<=1);
 assert.deepEqual(validateBasicOracle(ex),[]);
});

test('economic scenario with a negative NPV remains legitimate',()=>{
 const t=template('v-npv-irregular');
 let found=false;
 for(let seed=1;seed<=100;seed++){
  const ex=generate(t.id,4,seed);
  if(ex.questions.find(q=>q.key==='npv')?.answer<0){
   found=true;
   assert.deepEqual(validateBasicOracle(ex),[]);
   assert.equal(ex.questions.find(q=>q.key==='accept').answer,'Нет');
   break;
  }
 }
 assert.ok(found,'expected some valid negative-NPV scenarios');
});
