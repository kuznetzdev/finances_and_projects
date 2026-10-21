import test from 'node:test';
import assert from 'node:assert/strict';
import { generateExercise, TEMPLATE_CATALOG, TOPICS, checkAnswer, formatAnswer } from '../site/engine/index.js';

function answer(ex, key){const q=ex.questions.find(x=>x.key===key);assert.ok(q,`${ex.templateId} missing ${key}`);return q.answer;}

test('All topic/level combinations generate valid exercises',()=>{
  for(let level=1;level<=4;level++)for(const {id:topic} of TOPICS)for(let seed=1;seed<80;seed++){
    const ex=generateExercise({topic,level,seed});
    assert.ok(ex.story.length>60,ex.templateId);
    assert.ok(ex.explanation.length>0,ex.templateId);
    assert.ok(ex.hint,ex.templateId);
    assert.ok(ex.questions.length>=1,ex.templateId);
    assert.equal(ex.level,level);
    assert.equal(topic==='all'||ex.topic===topic,true);
    assert.equal(new Set(ex.questions.map(x=>x.key)).size,ex.questions.length);
    for(const q of ex.questions){
      assert.ok(q.label.length>=2);
      if(q.type==='number'){
        assert.ok(Number.isFinite(q.answer),`${ex.templateId}: nonfinite ${q.key}`);
        assert.ok(checkAnswer(q,String(q.answer).replace('.',',')),`${ex.templateId}: correct number rejected`);
        assert.ok(!checkAnswer(q,'zzz'));
        assert.ok(formatAnswer(q).length>2);
      }else if(q.type==='multi'){
        assert.ok(q.answer.every(x=>q.choices.includes(x)));
        assert.ok(checkAnswer(q,q.answer));
      }else{
        assert.ok(q.choices.includes(q.answer));
        assert.ok(checkAnswer(q,q.answer));
        assert.ok(!checkAnswer(q,'НЕПРАВИЛЬНО'));
      }
    }
  }
});

test('Deterministic regeneration from seed and template ID',()=>{
  for(const c of TEMPLATE_CATALOG)for(let level=c.min;level<=4;level++){
    for(let seed=1;seed<=10;seed++){
      const a=generateExercise({topic:c.topic,level,seed,templateId:c.id});
      const b=generateExercise({topic:c.topic,level,seed,templateId:c.id});
      assert.deepEqual(a,b);
      assert.equal(a.templateId,c.id);
    }
  }
});

test('Balance identities, cash flow classification and valuation invariants',()=>{
  for(let level=1;level<=4;level++)for(let seed=1;seed<120;seed++){
    for(const c of TEMPLATE_CATALOG.filter(c=>c.min<=level)){
      const ex=generateExercise({topic:c.topic,level,seed,templateId:c.id});
      const near=(x,y)=>assert.ok(Math.abs(x-y)<.03,`${c.id} : ${x} != ${y}`);
      if(c.id==='links-contract') near(answer(ex,'cash')+answer(ex,'ar'),answer(ex,'profit')+answer(ex,'ap'));
      if(c.id==='cash-direct')near(answer(ex,'total'),answer(ex,'cfo')+answer(ex,'cfi')+answer(ex,'cff'));
      if(c.id==='links-error'){
        near(answer(ex,'cfo')+answer(ex,'cfi'),0);
        near(answer(ex,'profit'),answer(ex,'ppe'));
        near(answer(ex,'total'),0);
      }
      if(c.id==='links-audit') near(answer(ex,'mismatch'),answer(ex,'realasset'));
      if(c.id==='balance-advance')near(answer(ex,'assets'),answer(ex,'liabilities')+answer(ex,'equity'));
      if(c.id==='valuation-multiples') near(answer(ex,'ev')-answer(ex,'nd'),answer(ex,'eq'));
      if(c.id==='valuation-payback')assert.ok(answer(ex,'payback')>0);
      if(c.id==='balance-depreciation'){
        assert.ok(answer(ex,'annual')>0);
        assert.ok(answer(ex,'balance')>=0);
      }
    }
  }
});

test('No cash balance invented when working capital information is missing',()=>{
  let missing=0;
  for(let seed=1;seed<100;seed++){
    const ex=generateExercise({topic:'cash',level:4,seed,templateId:'cash-missing'});
    if(ex.questions[0].key==='enough'){
      missing++;
      assert.equal(answer(ex,'enough'),'Недостаточно данных');
      assert.equal(answer(ex,'missing'),'Изменения оборотного капитала');
    }
  }
  assert.ok(missing>10);
});

test('Numeric answer matching is tolerant but not loose',()=>{
  const question={type:'number',answer:-1.25,tolerance:.011};
  assert.ok(checkAnswer(question,' -1,25 '));
  assert.ok(checkAnswer(question,'-1.24'));
  assert.ok(!checkAnswer(question,'-1'));
  assert.ok(!checkAnswer(question,''));
});
