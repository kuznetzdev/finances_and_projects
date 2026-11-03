import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE_BANK,CASE_CHECKPOINTS} from '../site/engine/casebook.js';
import {SOURCE_BANK_REFERENCES,validateSourceBankReferences} from '../scripts/lib/source-bank-oracles.js';

test('source bank: every 54 graded answers independently recomputes from original source inputs',()=>{
 assert.equal(Object.keys(SOURCE_BANK_REFERENCES).length,21);
 assert.equal(Object.values(SOURCE_BANK_REFERENCES).reduce((n,q)=>n+Object.keys(q).length,0),54);
 assert.deepEqual(validateSourceBankReferences(CASE_BANK,CASE_CHECKPOINTS),[]);
});

test('source bank: corruption of any answer or unit is caught and not excused by loose grading tolerance',()=>{
 for(const [id,refs] of Object.entries(SOURCE_BANK_REFERENCES)){
  const qs=CASE_CHECKPOINTS[id];
  assert.equal(Object.keys(refs).length,qs.length);
  for(let i=0;i<qs.length;i++){
   const modified=qs.map((q,j)=>i===j?{...q,answer:q.answer+1}:q);
   assert.ok(validateSourceBankReferences(CASE_BANK,{...CASE_CHECKPOINTS,[id]:modified})
     .some(x=>x.code==='SOURCE_MISMATCH'&&x.message.includes(id+'/'+qs[i].label)),id+'/'+qs[i].label);
   const unit=qs.map((q,j)=>i===j?{...q,unit:'wrong'}:q);
   assert.ok(validateSourceBankReferences(CASE_BANK,{...CASE_CHECKPOINTS,[id]:unit})
     .some(x=>x.code==='SOURCE_UNIT'&&x.message.includes(id+'/'+qs[i].label)),id+'/'+qs[i].label);
  }
 }
});

test('source bank: omitted, added and duplicated numeric steps fail closed',()=>{
 const id='F01',qs=CASE_CHECKPOINTS[id];
 assert.ok(validateSourceBankReferences(CASE_BANK,{...CASE_CHECKPOINTS,[id]:qs.slice(1)})
   .some(x=>x.code==='SOURCE_COVERAGE'));
 assert.ok(validateSourceBankReferences(CASE_BANK,{...CASE_CHECKPOINTS,[id]:[...qs,{label:'Unknown',answer:0,unit:'тыс. ₽',tolerance:1}]})
   .some(x=>x.code==='SOURCE_UNMAPPED'));
 assert.ok(validateSourceBankReferences(CASE_BANK,{...CASE_CHECKPOINTS,[id]:[...qs,qs[0]]})
   .some(x=>x.code==='SOURCE_DUPLICATE'));
});

test('T11 zero-coupon assumption is explicit in the exercise condition, independent of its title',()=>{
 const c=CASE_BANK.find(x=>x.id==='T11');
 assert.match(c.conditionHtml,/бескупон|без купон/i);
});
