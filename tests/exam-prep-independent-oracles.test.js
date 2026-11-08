import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE_BANK,CASE_CHECKPOINTS,CASE_BY_ID} from '../site/engine/casebook.js';
import {EXAM_PREP_CASE_IDS,EXAM_PREP_ORACLES,validateExamPrepReferences} from '../scripts/lib/exam-prep-oracles.js';

test('all thirteen user-supplied problems have independent finance oracles for every graded step',()=>{
 assert.deepEqual(EXAM_PREP_CASE_IDS,Array.from({length:13},(_,i)=>'PREP26-'+String(i+1).padStart(2,'0')));
 assert.deepEqual(validateExamPrepReferences(CASE_BANK,CASE_CHECKPOINTS),[]);
 for(const id of EXAM_PREP_CASE_IDS){
  const item=CASE_BY_ID.get(id);
  assert.ok(item,id);
  assert.ok(item.conditionHtml.length>120,id);
  assert.ok(item.solutionHtml.length>300,id);
  assert.ok(item.source?.length>20,id);
  assert.ok(item.steps.length>=4,id);
  const questions=CASE_CHECKPOINTS[id];
  assert.ok(questions?.length>=4,id);
  assert.equal(Object.keys(EXAM_PREP_ORACLES[id]).length,questions.length,id);
  for(const q of questions){
   assert.ok(q.hint?.levels?.length===3,id+'/'+q.label);
   assert.ok(q.hint.levels.every(s=>typeof s==='string'&&s.trim().length>3),id+'/'+q.label);
  }
 }
});

test('each falsified answer or unit fails independent verification rather than passing via matching stored values',()=>{
 for(const id of EXAM_PREP_CASE_IDS){
  const questions=CASE_CHECKPOINTS[id];
  for(let i=0;i<questions.length;i++){
   const changed=questions.map((q,j)=>j===i?{...q,answer:q.answer+(q.unit==='%'?0.25:q.unit==='раз'?0.2:Math.max(0.5,Math.abs(q.answer)*.002))}:q);
   const problems=validateExamPrepReferences(CASE_BANK,{...CASE_CHECKPOINTS,[id]:changed});
   assert.ok(problems.some(x=>x.code==='EXAM_MISMATCH'&&x.message.includes(id)),id+'/'+questions[i].label);
   const alteredUnit=questions.map((q,j)=>j===i?{...q,unit:'неверная единица'}:q);
   assert.ok(validateExamPrepReferences(CASE_BANK,{...CASE_CHECKPOINTS,[id]:alteredUnit})
     .some(x=>x.code==='EXAM_UNIT'&&x.message.includes(id)),id+'/'+questions[i].label);
  }
 }
});

test('new or removed checkpoints, missing cases, unapproved names and duplicates fail closed',()=>{
 const id='PREP26-06',qs=CASE_CHECKPOINTS[id];
 const added={...CASE_CHECKPOINTS,[id]:[...qs,{label:'Непроверенная формула',answer:999,unit:'ед.',tolerance:.01}]};
 assert.ok(validateExamPrepReferences(CASE_BANK,added).some(x=>x.code==='EXAM_UNMAPPED'));
 assert.ok(validateExamPrepReferences(CASE_BANK,added).some(x=>x.code==='EXAM_COVERAGE'));
 const missing={...CASE_CHECKPOINTS,[id]:qs.slice(1)};
 assert.ok(validateExamPrepReferences(CASE_BANK,missing).some(x=>x.code==='EXAM_COVERAGE'));
 const clone={...CASE_CHECKPOINTS,[id]:[qs[0],qs[0],...qs.slice(1)]};
 assert.ok(validateExamPrepReferences(CASE_BANK,clone).some(x=>x.code==='EXAM_DUPLICATE'));
 assert.ok(validateExamPrepReferences(CASE_BANK.filter(c=>c.id!==id),CASE_CHECKPOINTS).some(x=>x.code==='EXAM_MISSING'));
});

test('all 124 fixed cases have stable unique ids, usable stages and no orphan numeric checkpoints',()=>{
 assert.equal(CASE_BANK.length,174);
 assert.equal(new Set(CASE_BANK.map(x=>x.id)).size,174);
 const ids=new Set(CASE_BANK.map(x=>x.id));
 for(const [id,qs] of Object.entries(CASE_CHECKPOINTS)){
  assert.ok(ids.has(id),'orphan checkpoints '+id);
  const names=new Set();
  for(const q of qs){
   assert.ok(!names.has(q.label),id+' duplicated label '+q.label);
   names.add(q.label);
   assert.ok(Number.isFinite(q.answer)&&Number.isFinite(q.tolerance),id+'/'+q.label);
   assert.ok(q.tolerance>=0&&q.tolerance<=Math.max(1,Math.abs(q.answer)*.1),id+'/'+q.label);
  }
 }
 for(const c of CASE_BANK){
  assert.ok(c.group?.length>3&&c.topic?.length>3,c.id);
  assert.ok(c.conditionHtml?.length>70,c.id);
  assert.ok(c.solutionHtml?.length>25,c.id);
  assert.ok(c.steps?.length>=1,c.id);
  assert.ok(c.source?.length>4,c.id);
 }
});
