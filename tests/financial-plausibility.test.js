import test from 'node:test';
import assert from 'node:assert/strict';
import {generateExercise,TEMPLATE_CATALOG} from '../site/engine/index.js';
import {validatePlausibility} from '../scripts/lib/financial-plausibility.js';

const exercise=(id,seed=13)=> {
 const t=TEMPLATE_CATALOG.find(x=>x.id===id);
 assert.ok(t,id);
 return generateExercise({templateId:id,topic:t.topic,level:4,seed});
};
const mutate=(ex,key,value)=>({...ex,questions:ex.questions.map(q=>
 q.key===key?{...q,answer:value}:q
)});

test('conservative finance ranges permit normal generated scenarios at two difficulties',()=>{
 for(const t of TEMPLATE_CATALOG){
  for(const level of new Set([t.min,4])){
   for(let seed=1;seed<=64;seed++){
    const e=generateExercise({templateId:t.id,topic:t.topic,level,seed});
    const result=validatePlausibility(e);
    assert.deepEqual(result.errors,[],t.id+' seed='+seed+' level='+level);
   }
  }
 }
});

test('liquidity checks catch impossible ratios without rejecting negative working capital',()=>{
 const ex=exercise('r-current');
 assert.deepEqual(validatePlausibility(ex).errors,[]);
 assert.ok(validatePlausibility(mutate(ex,'quick',ex.questions.find(q=>q.key==='current').answer+1))
   .errors.some(x=>x.code==='FINANCIAL_PLAUSIBILITY'));
 assert.deepEqual(validatePlausibility(mutate(ex,'nwc',-10000)).errors,[]);
});

test('margin identity detects corrupted answer but negative margin is not an error',()=>{
 const ex=exercise('r-margins');
 const gross=ex.questions.find(q=>q.key==='gross').answer;
 const oper=ex.questions.find(q=>q.key==='oper').answer;
 assert.ok(validatePlausibility(mutate(ex,'oper',gross+1)).errors.length>0);
 assert.deepEqual(validatePlausibility(mutate(ex,'net',-200)).errors,[]);
 assert.ok(oper<=gross);
});

test('capital structure and discounting domain checks detect impossible computed values',()=>{
 for(const [id,key,wrong] of [
  ['r-leverage','debtshare',110],['v-wacc','wacc',-3],
  ['v-pi','pi',-2],['v-irr-zero','irr',-120],['r-roe-roa','roa',-1]
 ]){
  const ex=exercise(id);
  assert.ok(validatePlausibility(mutate(ex,key,wrong)).errors.length,id);
 }
});

test('negative NPV, CFO and cash cycles are legitimate; unusual ratios are warnings',()=>{
 for(const id of ['v-npv-irregular','r-cash-cycle']){
  const ex=exercise(id);
  const key=id==='v-npv-irregular'?'npv':'ccc';
  assert.deepEqual(validatePlausibility(mutate(ex,key,-9000)).errors,[],id);
 }
 const e=exercise('v-irr-zero');
 const unusual=mutate(e,'irr',1100);
 const report=validatePlausibility(unusual);
 assert.deepEqual(report.errors,[]);
 assert.ok(report.warnings.some(w=>w.code==='IMPLAUSIBLE_RATE'));
});


test('a terminal monetary valuation is not mistaken for the exit multiple itself',()=>{
 const ex=exercise('dcf-terminal-exit');
 const tv=ex.questions.find(q=>q.key==='tv');
 assert.ok(tv&&/млн/.test(tv.unit));
 const altered=mutate(ex,'tv',1000000);
 assert.ok(!validatePlausibility(altered).warnings.some(x=>x.code==='UNUSUAL_MULTIPLE'));
 const fake={
  templateId:'test-comparable-multiple',
  questions:[{key:'pe',type:'number',label:'Мультипликатор P/E',answer:150,unit:'раз'}]
 };
 assert.ok(validatePlausibility(fake).warnings.some(x=>x.code==='UNUSUAL_MULTIPLE'));
});
