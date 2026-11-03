import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {BANK_STORY_ORACLE_IDS,validateBankStoryMath} from '../scripts/lib/bank-story-oracles.js';
test('nine bank-derived generators have independent statement-based financial tests',()=>{
 const ids=TEMPLATE_CATALOG.filter(x=>x.id.startsWith('bank-')).map(x=>x.id);
 assert.equal(ids.length,9);assert.deepEqual([...BANK_STORY_ORACLE_IDS].sort(),ids.sort());
});
test('all bank-derived exercise steps fail on a wrong answer, with complete variable difficulty',()=>{
 for(const id of BANK_STORY_ORACLE_IDS){
  const template=TEMPLATE_CATALOG.find(x=>x.id===id);
  for(let level=template.min;level<=4;level++)for(const seed of [1,5,17,33,101,777,31415]){
   const exercise=generateExercise({templateId:id,topic:template.topic,level,seed});
   assert.deepEqual(validateBankStoryMath(exercise),[],id+'/'+level+'/'+seed);
   for(let i=0;i<exercise.questions.length;i++){
    const q=exercise.questions[i];
    const bad={...exercise,questions:exercise.questions.map((x,j)=>j!==i?x:{...x,answer:x.type==='number'?x.answer+1:'INCORRECT'})};
    assert.ok(validateBankStoryMath(bad).some(x=>x.code.includes('MISMATCH')),id+'/'+q.key+' tampered');
   }
  }
 }
});
