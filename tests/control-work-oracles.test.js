import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE_BANK,CASE_CHECKPOINTS} from '../site/engine/casebook.js';
import {CONTROL_WORK_CASE_IDS,CONTROL_WORK_REFERENCES,validateControlWorkReferences} from '../scripts/lib/control-work-oracles.js';

test('reference formulas independently cover all 23 control cases and every approved numeric step',()=>{
 assert.equal(CONTROL_WORK_CASE_IDS.length,23);
 assert.equal(Object.keys(CONTROL_WORK_REFERENCES).length,15);
 const total=Object.values(CONTROL_WORK_REFERENCES).reduce((count,steps)=>count+Object.keys(steps).length,0);
 assert.equal(total,57);
 assert.deepEqual(validateControlWorkReferences(CASE_BANK,CASE_CHECKPOINTS),[]);
});

test('corrupted financial answers and wrong units are blocked regardless of student grading tolerance',()=>{
 for(const [id,references] of Object.entries(CONTROL_WORK_REFERENCES)){
  const original=CASE_CHECKPOINTS[id];
  for(let i=0;i<original.length;i++){
   const broken=original.map((step,j)=>i===j?{...step,answer:step.answer+1}:step);
   assert.ok(validateControlWorkReferences(CASE_BANK,{...CASE_CHECKPOINTS,[id]:broken})
     .some(e=>e.code==='CW_MISMATCH'),id+' / '+original[i].label);
   const wrongUnit=original.map((step,j)=>i===j?{...step,unit:'неверные единицы'}:step);
   assert.ok(validateControlWorkReferences(CASE_BANK,{...CASE_CHECKPOINTS,[id]:wrongUnit})
     .some(e=>e.code==='CW_UNIT'),id+' / '+original[i].label);
   assert.ok(Object.hasOwn(references,original[i].label));
  }
 }
});

test('new numeric step, removed case and unapproved grading fail closed',()=>{
 const id='CW-F03';
 const extra={...CASE_CHECKPOINTS,[id]:[
  ...CASE_CHECKPOINTS[id],{label:'Секретное поле',answer:9,unit:'тыс. ₽',tolerance:100}
 ]};
 const messages=validateControlWorkReferences(CASE_BANK,extra).map(e=>e.code);
 assert.ok(messages.includes('CW_UNMAPPED'));
 assert.ok(messages.includes('CW_COVERAGE'));
 const missing=validateControlWorkReferences(CASE_BANK.filter(c=>c.id!==id),CASE_CHECKPOINTS);
 assert.ok(missing.some(e=>e.code==='CW_MISSING'));
 const theory={...CASE_CHECKPOINTS,'CW-V01':[{label:'Синергия',answer:10,unit:'ден. ед.',tolerance:.1}]};
 assert.ok(validateControlWorkReferences(CASE_BANK,theory).some(e=>e.code==='CW_UNAPPROVED_GRADING'));
 const unknown=[...CASE_BANK,{...CASE_BANK.find(c=>c.id==='CW-F03'),id:'CW-X99'}];
 assert.ok(validateControlWorkReferences(unknown,CASE_CHECKPOINTS).some(e=>e.code==='CW_UNREGISTERED'));
});

test('no input assumptions are silently replaced: conditional cases remain caveated',()=>{
 for(const id of ['CW-F04','CW-F07','CW-F08','CW-F11','CW-F13','CW-V05','CW-V08','CW-V10']){
  const item=CASE_BANK.find(c=>c.id===id);
  assert.equal(item?.caveat,true,id+' needs an explicit caveat');
 }
 assert.match(CASE_BANK.find(c=>c.id==='CW-F07').solutionHtml,/авансы выданные/);
 assert.match(CASE_BANK.find(c=>c.id==='CW-V08').solutionHtml,/Сценарий B/);
 assert.match(CASE_BANK.find(c=>c.id==='CW-V10').solutionHtml,/не позволяют определить причину/);
});
