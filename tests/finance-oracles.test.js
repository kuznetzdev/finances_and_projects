import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {ORACLE_TEMPLATES,validateFinanceOracle} from '../scripts/lib/finance-oracles.js';

test('all seven DCF references check every displayed numerical answer at all supported levels',()=>{
  assert.equal(ORACLE_TEMPLATES.length,7);
  for(const id of ORACLE_TEMPLATES){
    const template=TEMPLATE_CATALOG.find(t=>t.id===id);
    assert.ok(template,'unregistered oracle: '+id);
    for(let level=template.min;level<=4;level++){
      for(let seed=1;seed<=120;seed++){
        const exercise=generateExercise({templateId:id,topic:template.topic,level,seed});
        assert.deepEqual(validateFinanceOracle(exercise),[],id+' level '+level+' seed '+seed);
        assert.ok(exercise.questions.every(q=>q.type==='number'),id);
        const first=exercise.questions[0];
        const corrupt={...exercise,questions:exercise.questions.map(q=>
          q.key===first.key?{...q,answer:q.answer+1}:q)};
        assert.ok(validateFinanceOracle(corrupt).some(e=>e.code==='ORACLE_MISMATCH'),
          'reference failed to detect corrupt answer: '+id+' seed '+seed);
      }
    }
  }
});

test('reference fails closed for unknown new questions and absent primitive inputs',()=>{
  const ex=generateExercise({templateId:'dcf-two-stage',topic:'valuation',level:4,seed:11});
  assert.ok(validateFinanceOracle({...ex,audit:{}}).some(e=>e.code==='ORACLE_INPUTS'));
  assert.ok(validateFinanceOracle({...ex,questions:[...ex.questions,{
    type:'number',key:'new-financial-result',answer:17,tolerance:0,unit:'млн ₽',label:'Новая метрика'
  }]}).some(e=>e.code==='ORACLE_UNMAPPED'));
  assert.deepEqual(validateFinanceOracle(generateExercise({
    templateId:'v-pv',topic:'valuation',level:4,seed:1
  })),[]);
});

test('oracle uses primitive inputs rather than cached audit results',()=>{
  const ex=generateExercise({templateId:'dcf-two-stage',topic:'valuation',level:4,seed:15});
  const modified={...ex,audit:{...ex.audit,ev:999999, tv:-1000,pvExplicit:0,pvTv:0}};
  assert.deepEqual(validateFinanceOracle(modified),[]);
  const brokenInputs={...ex,audit:{...ex.audit,first:ex.audit.first*1.2}};
  assert.ok(validateFinanceOracle(brokenInputs).some(e=>e.code==='ORACLE_MISMATCH'));
});
