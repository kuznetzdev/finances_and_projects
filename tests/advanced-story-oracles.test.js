import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {ADVANCED_STORY_ORACLE_IDS,validateAdvancedStoryMath} from '../scripts/lib/advanced-story-oracles.js';
const mutate=(exercise,at,change)=>({...exercise,questions:exercise.questions.map((q,i)=>i===at?change(q):q)});
const levels=[1,2,3,4],seeds=[1,3,7,19,42,101,777];
test('all advanced templates except already independently verified DCF have source-derived audits',()=>{
 const advanced=TEMPLATE_CATALOG.filter(t=>t.id.startsWith('a-')&&t.id!=='a-dcf-ev').map(x=>x.id);
 assert.equal(advanced.length,25);
 assert.deepEqual([...ADVANCED_STORY_ORACLE_IDS].sort(),advanced.sort());
});
test('every advanced generator answer is independently recalculated at its levels and multiple seeds',()=>{
 for(const id of ADVANCED_STORY_ORACLE_IDS){
  const min=TEMPLATE_CATALOG.find(t=>t.id===id).min;
  for(const level of levels.filter(l=>l>=min)){
   for(const seed of seeds){
    const ex=generateExercise({templateId:id,topic:TEMPLATE_CATALOG.find(t=>t.id===id).topic,level,seed});
    assert.deepEqual(validateAdvancedStoryMath(ex),[],id+' '+level+' '+seed);
    for(let i=0;i<ex.questions.length;i++){
     const q=ex.questions[i];
     const fake=mutate(ex,i,x=>({...x,answer:x.type==='number'?x.answer+1:x.answer==='Да'?'Нет':'Да'}));
     assert.ok(validateAdvancedStoryMath(fake).some(e=>e.code.includes('MISMATCH')),id+'/'+q.key+' changed answer must fail');
     if(q.type==='number'){
      const unit=mutate(ex,i,x=>({...x,unit:'bad-unit'}));
      assert.ok(validateAdvancedStoryMath(unit).some(e=>e.code.includes('UNIT')),id+'/'+q.key+' changed unit must fail');
     }
    }
   }
  }
 }
});
test('a hidden extra advanced question is never accepted without a formula',()=>{
 const ex=generateExercise({templateId:'a-lbo',topic:'valuation',level:4,seed:123});
 const extra={...ex,questions:[...ex.questions,{key:'secret',label:'additional',type:'number',answer:7,unit:'млн ₽'}]};
 assert.ok(validateAdvancedStoryMath(extra).some(e=>e.code.includes('COVERAGE')));
});
