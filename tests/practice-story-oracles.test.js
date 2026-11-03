import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {PRACTICE_STORY_ORACLE_IDS,validatePracticeStoryMath} from '../scripts/lib/practice-story-oracles.js';
test('14 previously separate-only exercise templates now have complete source-derived checks',()=>{
 const ids=TEMPLATE_CATALOG.filter(x=>x.id.startsWith('x-')).map(x=>x.id);
 assert.equal(ids.length,14);assert.deepEqual([...PRACTICE_STORY_ORACLE_IDS].sort(),ids.sort());
});
test('practice generator formulas, risk choices and units fail if altered on any seed',()=>{
 for(const id of PRACTICE_STORY_ORACLE_IDS){
  const t=TEMPLATE_CATALOG.find(x=>x.id===id);
  for(let level=t.min;level<=4;level++)for(const seed of [1,3,7,14,21,77,2026]){
   const x=generateExercise({templateId:id,topic:t.topic,level,seed});
   assert.deepEqual(validatePracticeStoryMath(x),[],id+'/'+level+'/'+seed);
   for(let i=0;i<x.questions.length;i++){
    const original=x.questions[i];
    const forged={...x,questions:x.questions.map((q,j)=>i===j?{...q,answer:q.type==='number'?q.answer+2:'CORRUPTED'}:q)};
    assert.ok(validatePracticeStoryMath(forged).some(v=>v.code.includes('MISMATCH')),id+'/'+original.key);
    if(original.type==='number'){
     const wrongUnit={...x,questions:x.questions.map((q,j)=>i===j?{...q,unit:'WRONG'}:q)};
     assert.ok(validatePracticeStoryMath(wrongUnit).some(v=>v.code.includes('UNIT')),id+'/'+original.key);
    }
   }
  }
 }
});
