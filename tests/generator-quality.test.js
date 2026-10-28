import test from 'node:test';import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise,checkAnswer} from '../site/engine/index.js';
import {validateExercise,validateDcfAudit,validateBusinessAudit} from '../scripts/lib/preflight.js';
import {rng,randomInt} from '../site/engine/helpers.js';
import {chooseFresh} from '../site/engine/scheduler.js';
test('the full generator catalog produces deterministic, verifiable and coherent randomized exercises',()=>{
 let checked=0,variable=0;
 for(const template of TEMPLATE_CATALOG){
  const signatures=new Set();
  for(let seed=1;seed<=36;seed++){
   const level=seed%2?Math.max(1,template.min):4;
   const args={templateId:template.id,topic:template.topic,area:template.area,seed,level};
   const ex=generateExercise(args);
   assert.equal(ex.templateId,template.id);
   assert.equal(ex.level,level);
   assert.deepEqual(ex,generateExercise(args),'different result for identical seed: '+template.id);
   const errs=[...validateExercise(ex),...validateDcfAudit(ex),...validateBusinessAudit(ex)];
   assert.deepEqual(errs,[],template.id+' seed='+seed);
   assert.ok(ex.questions.every(q=>checkAnswer(q,q.answer)),template.id+' answer did not validate itself');
   const signature=JSON.stringify([ex.story,ex.questions.map(q=>q.answer)]);
   signatures.add(signature);checked++;
  }
  if(signatures.size>1)variable++;
 }
 assert.equal(checked,TEMPLATE_CATALOG.length*36);
 // Some lecture-derived bank cases are intentionally fixed, but most templates must vary.
 assert.ok(variable>=Math.floor(TEMPLATE_CATALOG.length*.7),'too many static generators: '+variable);
});
test('seeded PRNG and integer picker cover endpoints without skew or off-by-one',()=>{
 assert.deepEqual(Array.from({length:20},(_,i)=>rng(7)()),Array.from({length:20},(_,i)=>rng(7)()));
 const r=rng(987654321),counts=Array(6).fill(0);
 for(let i=0;i<12000;i++){const x=randomInt(r,1,6);assert.ok(x>=1&&x<=6);counts[x-1]++;}
 assert.ok(counts.every(x=>x>1750&&x<2250),JSON.stringify(counts));
});
test('scheduler avoids recent tasks while retaining the full eligible catalog',()=>{
 const items=['a','b','c','d'].map(id=>({id}));
 const selected=chooseFresh(items,['a','b'],()=>0.2);
 assert.ok(['c','d'].includes(selected.id));
});
