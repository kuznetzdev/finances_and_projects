import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {LEGACY_STORY_ORACLE_IDS,validateLegacyStoryMath} from '../scripts/lib/legacy-story-oracles.js';
test('all 21 original fixed-scenario generator families have independent mathematical recomputation',()=>{
 const ids=TEMPLATE_CATALOG.filter(x=>['pl-','cash-','balance-','links-','valuation-'].some(p=>x.id.startsWith(p))).map(x=>x.id);
 assert.equal(ids.length,21);
 assert.deepEqual([...LEGACY_STORY_ORACLE_IDS].sort(),ids.sort());
});
test('legacy answers and choice keys at every level and seed are not trusted without independent math',()=>{
 for(const id of LEGACY_STORY_ORACLE_IDS){
  const t=TEMPLATE_CATALOG.find(x=>x.id===id);
  for(let level=t.min;level<=4;level++)for(const seed of [1,3,6,17,42,202,1999]){
   const ex=generateExercise({templateId:id,topic:t.topic,level,seed});
   assert.deepEqual(validateLegacyStoryMath(ex),[],id+'/'+level+'/'+seed);
   for(let i=0;i<ex.questions.length;i++){
    const q=ex.questions[i];
    const forged={...ex,questions:ex.questions.map((v,j)=>j!==i?v:{...v,answer:v.type==='number'?v.answer+2:v.answer==='Нет'?'Да':'Нет'})};
    assert.ok(validateLegacyStoryMath(forged).some(x=>x.code.includes('MISMATCH')),id+'/'+q.key+' edited answer failed to detect');
    if(q.type==='number'){
     const badUnit={...ex,questions:ex.questions.map((v,j)=>j!==i?v:{...v,unit:'fake'})};
     assert.ok(validateLegacyStoryMath(badUnit).some(x=>x.code.includes('UNIT')),id+'/'+q.key+' edited unit');
    }
   }
  }
 }
});
