import test from 'node:test';
import assert from 'node:assert/strict';
import {generateExercise} from '../site/engine/index.js';
import {validateAdvancedDcfOracle} from '../scripts/lib/advanced-dcf-oracle.js';

const close=(a,b,epsilon=1e-7)=>Math.abs(a-b)<=epsilon*Math.max(1,Math.abs(a),Math.abs(b));
test('DCFs never add undiscounted terminal value to PV of forecast cash flows',()=>{
 for(const seed of [1,2,3,4,7,17,42,77,199,1000]){
  const x=generateExercise({templateId:'a-dcf-ev',topic:'valuation',level:4,seed});
  const q=Object.fromEntries(x.questions.map(z=>[z.key,z.answer]));
  assert.ok(close(q.ev,q.pv+q.evt),seed+' EV must use discounted terminal value');
  assert.ok(close(q.eq,q.ev-Number(x.story.match(/Процентный долг на дату оценки ([0-9]+) млн/)[1])
                      +Number(x.story.match(/свободные деньги ([0-9]+) млн/)[1])),seed+' equity bridge');
  const wacc=Number(x.story.match(/WACC ([0-9.,]+)%/)[1].replace(',','.'))/100;
  assert.ok(close(q.evt,q.tv/(1+wacc)**3),seed+' terminal discount');
  assert.deepEqual(validateAdvancedDcfOracle(x),[],seed+' all source-derived checks');
 }
});
test('independent advanced DCF check rejects a forged EV and an arbitrary equity answer',()=>{
 const x=generateExercise({templateId:'a-dcf-ev',topic:'valuation',level:4,seed:17});
 const copy=(key)=>({...x,questions:x.questions.map(q=>q.key===key?{...q,answer:q.answer+50}:q)});
 assert.ok(validateAdvancedDcfOracle(copy('ev')).some(e=>e.code==='ADV_DCF_MISMATCH'));
 assert.ok(validateAdvancedDcfOracle(copy('eq')).some(e=>e.code==='ADV_DCF_MISMATCH'));
});
