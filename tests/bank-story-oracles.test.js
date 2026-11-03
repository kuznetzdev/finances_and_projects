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

test('lagged covenant: year 3 interest must reflect year 2 breach, not year 1 breach',()=>{
 const x=generateExercise({templateId:'bank-covenant-penalty',topic:'ratios',level:4,seed:7});
 const year3=x.questions.find(q=>q.key==='year3').answer;
 const base=Number(x.story.match(/остаток по ставке (\d+)% годовых/)[1]);
 const eb2=Number(x.story.match(/EBITDA в годах 1–4:\s*[\d\s,.]+;\s*([\d\s,.]+);/)[1].trim().replace(',','.'));
 const loan=Number(x.story.match(/Долг компании (\d+) млн/)[1]);
 const limit=Number(x.story.match(/превышает ([\d,]+)/)[1].replace(',','.'));
 assert.ok(loan/eb2<=limit,'second year is not in breach');
 assert.equal(year3,base,'year 3 must return to base interest after a compliant year 2');
});
