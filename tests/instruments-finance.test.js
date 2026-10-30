import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {CASE_BANK,CASE_BY_ID,CASE_CHECKPOINTS,verifyCheckpoint} from '../site/engine/casebook.js';
import {INSTRUMENT_ORACLE_TEMPLATES,validateInstrumentOracle} from '../scripts/lib/instrument-oracles.js';
import {INSTRUMENT_CASES,INSTRUMENT_REFERENCE} from '../site/data/instrument-cases.js';
import {INSTRUMENT_CHECKPOINTS} from '../site/data/instrument-checkpoints.js';
import {INSTRUMENT_PATH} from '../site/data/instrument-path.js';
import {validateExercise} from '../scripts/lib/preflight.js';

const near=(actual,expected,label,tol=1e-4)=>{
 assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol,
  label+' actual '+actual+' expected '+expected);
};
const ans=(id,i)=>INSTRUMENT_CHECKPOINTS[id][i].answer;
const independentPrice=(face,coupon,years,yieldRate)=>{
 let price=0;
 for(let t=1;t<=years;t++)price+=face*coupon/(1+yieldRate)**t+(t===years?face/(1+yieldRate)**t:0);
 return price;
};
const originalCount=107;
test('four instrument generators and four source-separated worked cases integrate without duplicate IDs',()=>{
 assert.equal(TEMPLATE_CATALOG.length,126);
 assert.equal(new Set(TEMPLATE_CATALOG.map(x=>x.id)).size,126);
 assert.equal(INSTRUMENT_ORACLE_TEMPLATES.length,4);
 assert.equal(CASE_BANK.length,originalCount+4);
 assert.equal(new Set(CASE_BANK.map(c=>c.id)).size,originalCount+4);
 assert.deepEqual(INSTRUMENT_CASES.map(x=>x.id),['I01','I02','I03','I04']);
 assert.equal(INSTRUMENT_PATH.length,5);
 for(const x of INSTRUMENT_PATH){
  const gen=TEMPLATE_CATALOG.find(t=>t.id===x.generator);
  assert.ok(gen,x.id+' missing generator '+x.generator);
  assert.ok(x.reason.length>=70,x.id);
  assert.ok(x.source.length>=15,x.id);
  for(const id of x.cases)assert.ok(CASE_BY_ID.has(id),x.id+': missing '+id);
 }
 for(const id of ['T10','T11','T12','LC01','S4-01','CS01','RO01']){
  assert.ok(CASE_BY_ID.has(id),'regression: '+id);
 }
 for(const x of INSTRUMENT_CASES){
  assert.match(x.source,/Облигации\.pdf|Авторская/);
  assert.ok(x.steps.length>=5,x.id);
  assert.ok(x.solutionHtml.length>=1000,x.id);
  assert.ok(CASE_CHECKPOINTS[x.id]?.length>=3,x.id);
 }
});

test('bond lecture examples: independent exact PV, Macaulay, modified and convexity check',()=>{
 const face=1000,c=80,years=3,y=.1;
 const flows=[80,80,1080];
 const pv=flows.map((cf,i)=>cf/(1+y)**(i+1));
 const price=pv.reduce((s,x)=>s+x,0);
 const mac=pv.reduce((s,x,i)=>s+(i+1)*x,0)/price;
 const mod=mac/(1+y);
 const at11=independentPrice(face,.08,years,.11);
 near(ans('I01',0),price,'lecture price',1e-9);
 near(ans('I01',1),mac,'lecture Macaulay',1e-9);
 near(ans('I01',2),mod,'modified',1e-9);
 near(ans('I01',3),-mod,'linear -1pp',1e-9);
 near(ans('I01',4),(at11/price-1)*100,'exact -1pp',1e-9);
 assert.ok(Math.abs((at11/price-1)*100+mod)>.001,'convexity ignored');
 assert.match(CASE_BY_ID.get('I01').solutionHtml,/модифицированную дюрацию/);
 assert.match(CASE_BY_ID.get('I01').solutionHtml,/выпуклост/i);
 near(INSTRUMENT_REFERENCE.duration.price,price,'independent vs reference',1e-9);
});

test('exact YTM is checked against known source coupon stream, not current yield',()=>{
 const flows=[120,120,1120],price=flows.reduce((s,cf,i)=>s+cf/1.15**(i+1),0);
 near(ans('I02',0),price,'source price',1e-9);
 near(ans('I02',1),120/price*100,'current yield',1e-9);
 near(ans('I02',2),15,'true IRR of coupon payments',1e-9);
 assert.ok(Math.abs(120/price*100-15)>2,'YTM silently treated as current yield');
 assert.match(CASE_BY_ID.get('I02').solutionHtml,/реинвестир/);
});

test('call/put short and long payoffs and insured share loss independently reconcile',()=>{
 near(ans('I03',0),20,'call payoff');near(ans('I03',1),12,'call profit');
 near(ans('I03',2),108,'call breakeven');near(ans('I03',3),20,'put payoff');
 near(ans('I03',4),14,'put profit');near(ans('I03',5),94,'put breakeven');
 near(ans('I04',0),-25,'stock loss');near(ans('I04',1),20,'put insurance payout');
 near(ans('I04',2),-13,'portfolio P&L');
 near(ans('I04',3),13,'max loss is a positive amount, not signed P&L');
 near(ans('I04',4),108,'protective put BE');
 assert.match(CASE_BY_ID.get('I03').solutionHtml,/неограниченн/);
 assert.match(CASE_BY_ID.get('I04').solutionHtml,/преми/i);
});

test('four generator oracle implementations reject every numeric answer corruption over 200 seeds',()=>{
 for(const id of INSTRUMENT_ORACLE_TEMPLATES){
  const template=TEMPLATE_CATALOG.find(x=>x.id===id);assert.ok(template,id);
  for(const level of new Set([template.min,4])){
   for(let seed=1;seed<=200;seed++){
    const opts={templateId:id,topic:template.topic,level,seed};
    const e=generateExercise(opts);
    assert.deepEqual(e,generateExercise(opts),id+': non-deterministic '+seed);
    assert.deepEqual(validateExercise(e),[],id+': structurally invalid');
    assert.deepEqual(validateInstrumentOracle(e),[],id+' seed '+seed+': bad arithmetic');
    assert.ok(e.audit?.instrument?.kind,id+' missing primitive audit');
    for(let i=0;i<e.questions.length;i++){
     const q=e.questions[i],wrong=q.type==='number'?{...q,answer:q.answer+7}:{...q,answer:q.answer==='Да'?'Нет':'Да'};
     const altered={...e,questions:e.questions.map((item,index)=>index===i?wrong:item)};
     assert.ok(validateInstrumentOracle(altered).some(x=>x.code==='INSTRUMENT_MISMATCH'),
      id+' corruption not detected: '+q.key);
    }
    const missing={...e,audit:{instrument:null}};
    assert.equal(validateInstrumentOracle(missing)[0]?.code,'INSTRUMENT_INPUTS',id);
    const unknown={...e,questions:[...e.questions,{key:'unknown',type:'number',answer:1}]};
    assert.ok(validateInstrumentOracle(unknown).some(x=>x.code==='INSTRUMENT_UNMAPPED'),id);
   }
  }
 }
});

test('all fixed instrument case checkpoints are independently graded and progressive',()=>{
 for(const c of INSTRUMENT_CASES){
  const qs=CASE_CHECKPOINTS[c.id];
  assert.equal(qs,INSTRUMENT_CHECKPOINTS[c.id]);
  for(const q of qs){
   assert.equal(verifyCheckpoint(q,String(q.answer)),true,c.id+': '+q.label);
   assert.equal(verifyCheckpoint(q,String(q.answer+5)),false,c.id+': '+q.label);
   assert.equal(q.hint.levels.length,3);
   assert.ok(q.hint.levels[0].length>30);
   assert.ok(q.hint.levels[1].includes('='));
   assert.ok(q.hint.levels[2].length>20);
  }
 }
});
