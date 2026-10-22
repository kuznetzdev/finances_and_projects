import test from 'node:test';
import assert from 'node:assert/strict';
import {shuffle, chooseFresh, recordRecent, newDeck} from '../site/engine/scheduler.js';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {STUDY_AREAS,curriculumFor} from '../site/data/curriculum.js';
import {CONCEPTS,OPERATIONS} from '../site/data/knowledge.js';
const near=(a,b,epsilon=.03)=>assert.ok(Math.abs(a-b)<=epsilon, `${a} != ${b}`);
const answer=(ex,key)=>ex.questions.find(q=>q.key===key).answer;
test('Shuffle is deterministic with a supplied source and preserves every identifier',()=>{
 const items=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}],r=()=>0;
 const deck=shuffle(items,r);
 assert.deepEqual(deck.map(x=>x.id).sort(),['a','b','c','d']);
 assert.deepEqual(deck,shuffle(items,r));
 assert.notDeepEqual(deck,items);
});
test('Fresh selection excludes recent templates when more are available',()=>{
 const ids=Array.from({length:14},(_,i)=>({id:`t${i}`}));
 const recent=['t7','t11','t5','t6','t9','t2'];
 for(let i=0;i<400;i++){const x=chooseFresh(ids,recent,()=>i/400);assert.ok(!recent.includes(x.id));}
 assert.notEqual(chooseFresh([{id:'one'},{id:'two'}],['one'],()=>0).id,'one');
 assert.equal(chooseFresh([{id:'solo'}],['solo'],()=>0).id,'solo');
 assert.deepEqual(recordRecent(['a','b','c'],'d',3),['b','c','d']);
});
test('New card deck avoids previous card across shuffle boundaries',()=>{
 const items=CONCEPTS.slice(0,12);
 for(let i=0;i<10;i++){
  const deck=newDeck(items,items[0].id,()=>i/11);
  assert.equal(new Set(deck).size,items.length);
  assert.notEqual(deck[0],items[0].id);
 }
});
test('Every template and new concept maps to thematic course content',()=>{
 assert.equal(TEMPLATE_CATALOG.length,104);
 const allowed=new Set(STUDY_AREAS.map(a=>a.id));
 for(const t of TEMPLATE_CATALOG){assert.ok(allowed.has(t.area),t.id);assert.ok(t.skill&&t.areaName,t.id);assert.deepEqual(curriculumFor(t.id,t.topic).skill,t.skill);}
 assert.ok(CONCEPTS.length>=100);
 assert.ok(OPERATIONS.length>=40);
 assert.equal(new Set(CONCEPTS.map(x=>x.id)).size,CONCEPTS.length);
 for(const c of CONCEPTS)assert.ok(c.term.length>1&&c.definition.length>20&&c.contrast.length>10);
});
test('Integrated three-statement case balances for hundreds of random seeds',()=>{
 for(let seed=1;seed<=300;seed++){
  const e=generateExercise({topic:'links',level:4,seed,templateId:'a-integrated-statements'});
  near(answer(e,'ebit')*.75,answer(e,'profit'));
  near(answer(e,'ebit')*.25,answer(e,'tax'));
  near(answer(e,'assets'),answer(e,'equity')+10+Number(e.story.match(/кредиторка поставщиков — на (\d+)/i)?.[1]||0)+Number(e.story.match(/кредит (\d+) млн/i)?.[1]||0),.02);
  assert.ok(answer(e,'cash')>0,seed);
 }
});
test('Market multiples never yield nonsensical negative equity value',()=>{
 for(let seed=1;seed<=2000;seed++){
   const e=generateExercise({topic:'valuation',level:4,seed,templateId:'a-multiples'});
   assert.ok(answer(e,'ev')>answer(e,'eq')&&answer(e,'eq')>0,seed);
 }
});
test('Course tasks include multi-stage workflows with realistic ranges',()=>{
 for(const id of ['a-du-pont-five','a-dcf-ev','a-lbo','a-stress-case','a-integrated-statements']){
  for(let seed=1;seed<=50;seed++){
   const ex=generateExercise({level:4,seed,templateId:id});
   assert.ok(ex.questions.length>=4,id);
   assert.ok(ex.story.length>=120,id);
  }
 }
});