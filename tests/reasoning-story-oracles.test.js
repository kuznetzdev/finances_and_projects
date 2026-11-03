import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {REASONING_STORY_ORACLE_IDS,validateReasoningStoryMath} from '../scripts/lib/reasoning-story-oracles.js';
test('five reasoning generators verify choice and multiselect without trusting correct answers',()=>{
 const ids=TEMPLATE_CATALOG.filter(x=>x.id.startsWith('logic-')).map(x=>x.id);
 assert.equal(ids.length,5);
 assert.deepEqual([...REASONING_STORY_ORACLE_IDS].sort(),ids.sort());
 for(const id of ids){
  const t=TEMPLATE_CATALOG.find(x=>x.id===id);
  for(let level=t.min;level<=4;level++)for(const seed of [1,7,21,42,123,2026]){
   const exercise=generateExercise({templateId:id,topic:t.topic,level,seed});
   assert.deepEqual(validateReasoningStoryMath(exercise),[],id+'/'+level+'/'+seed);
   for(let i=0;i<exercise.questions.length;i++){
    const q=exercise.questions[i];
    const modified={...exercise,questions:exercise.questions.map((x,j)=>j!==i?x:{
     ...x,answer:x.type==='number'?x.answer+2:x.type==='multi'?x.answer.slice(0,-1):'INCORRECT'
    })};
    assert.ok(validateReasoningStoryMath(modified).some(x=>x.code.includes('MISMATCH')),id+'/'+q.key);
   }
  }
 }
});
