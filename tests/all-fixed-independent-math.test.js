import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE_BANK,CASE_CHECKPOINTS} from '../site/engine/casebook.js';
import {validateAllFixedReferences,FIXED_REFERENCE_GROUPS} from '../scripts/lib/all-fixed-oracles.js';
test('every one of 312 fixed bank checkpoints is covered by independent source-derived arithmetic',()=>{
 const result=validateAllFixedReferences(CASE_BANK,CASE_CHECKPOINTS);
 assert.deepEqual(result.errors,[]);
 assert.equal(result.checkedCases,124);
 assert.equal(result.checkedAnswers,312);
 assert.deepEqual(Object.keys(FIXED_REFERENCE_GROUPS).sort(),[
  'capital-and-assignments','control-works','dcf-and-taxes','exam-prep',
  'instrument','lecture','original-bank','seminar4'].sort());
});
test('all 312 answers detect deliberate corruption of stored values',()=>{
 for(const item of CASE_BANK){
  const original=CASE_CHECKPOINTS[item.id]??[];
  for(let i=0;i<original.length;i++){
   const broken=original.map((q,j)=>i===j?{...q,answer:q.answer+1}:q);
   const result=validateAllFixedReferences(CASE_BANK,{...CASE_CHECKPOINTS,[item.id]:broken});
   assert.ok(result.errors.some(x=>x.message.includes(item.id+'/'+original[i].label)),item.id+'/'+original[i].label);
  }
 }
});
test('unmapped or unregistered case answers must not silently pass a generic integrity check',()=>{
 const id='V03';
 const changed={...CASE_CHECKPOINTS,[id]:[...CASE_CHECKPOINTS[id],{label:'Тайный ответ',answer:1,unit:'млн ₽',tolerance:1}]};
 assert.ok(validateAllFixedReferences(CASE_BANK,changed).errors.some(x=>x.code.includes('UNMAPPED')));
 const missing=CASE_BANK.filter(x=>x.id!==id);
 assert.ok(validateAllFixedReferences(missing,CASE_CHECKPOINTS).errors.some(x=>x.code.includes('MISSING')));
});

test('all 312 numeric checkpoints reject a tampered unit of measurement',()=>{
 for(const item of CASE_BANK){
  const original=CASE_CHECKPOINTS[item.id]??[];
  for(let i=0;i<original.length;i++){
   const changed=original.map((q,j)=>j===i?{...q,unit:'unit-tampered'}:q);
   const result=validateAllFixedReferences(CASE_BANK,{...CASE_CHECKPOINTS,[item.id]:changed});
   assert.ok(result.errors.some(x=>x.code.includes('UNIT')&&x.message.includes(item.id+'/'+original[i].label)),item.id+'/'+original[i].label);
  }
 }
});
test('source-bank rounding is accepted only at published precision and never hides major mistakes',()=>{
 const original=CASE_CHECKPOINTS.T10;
 const near=original.map(q=>({...q,answer:q.answer+.001}));
 assert.deepEqual(validateAllFixedReferences(CASE_BANK,{...CASE_CHECKPOINTS,T10:near}).errors,[]);
 const far=original.map(q=>({...q,answer:q.answer+.1}));
 assert.ok(validateAllFixedReferences(CASE_BANK,{...CASE_CHECKPOINTS,T10:far}).errors.some(x=>x.code.includes('MISMATCH')));
});
