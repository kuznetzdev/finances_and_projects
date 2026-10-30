import test from 'node:test';
import assert from 'node:assert/strict';
import {SECTION4_SOURCE_CASES,SECTION4_SOURCE_CALCULATIONS} from '../site/data/section4-source-cases.js';
import {SECTION4_SOURCE_CHECKPOINTS} from '../site/data/section4-source-checkpoints.js';
import {SECTION4_PATH} from '../site/data/section4-path.js';
import {PARADOXES} from '../site/data/paradoxes.js';
import {CASE_BANK,CASE_CHECKPOINTS,CASE_BY_ID,availableCases,verifyCheckpoint} from '../site/engine/casebook.js';

const check=(a,b,label,tol=1e-8)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol,
 label+': actual '+a+' expected '+b);
const answer=(id,index)=>SECTION4_SOURCE_CHECKPOINTS[id][index].answer;
function loanSchedule(principal,annualRate,fcf,years,mezz=0,mezzRate=0){
 const result=[];
 let debt=principal;
 for(let year=1;year<=years;year++){
  const interest=debt*annualRate+mezz*mezzRate;
  const principalPayment=fcf-interest;
  assert.ok(principalPayment>=0,'Inconsistent positive schedule');
  debt-=principalPayment;
  result.push({year,debt,interest,principalPayment});
 }
 return result;
}

test('eight PDF cases are unique, sourced and linked through section 4 route',()=>{
 assert.equal(SECTION4_SOURCE_CASES.length,8);
 assert.equal(CASE_BANK.length,107);
 assert.equal(new Set(CASE_BANK.map(x=>x.id)).size,107);
 assert.deepEqual(SECTION4_SOURCE_CASES.map(x=>x.id),
  Array.from({length:8},(_,i)=>'S4-0'+(i+1)));
 assert.equal(availableCases('Семинар 4 · дополнительные задачи').length,8);
 for(const c of SECTION4_SOURCE_CASES){
  assert.equal(CASE_BY_ID.get(c.id),c);
  assert.ok(c.conditionHtml.length>190,c.id);
  assert.ok(c.solutionHtml.length>1000,c.id);
  assert.ok(c.steps.length>=4,c.id);
  assert.match(c.source,/стр\. [1234]/);
  assert.ok(SECTION4_PATH.some(x=>x.cases.includes(c.id)),c.id+' not in route');
 }
 assert.ok(CASE_BY_ID.has('LC01')&&CASE_BY_ID.has('LC02')&&CASE_BY_ID.has('LC03'),
  'previous LBO IDs changed');
 assert.ok(CASE_BY_ID.has('CS01')&&CASE_BY_ID.has('CS02'),
  'previous capital cases changed');
});

test('all twelve curriculum destinations have valid cases and paradoxes',()=>{
 assert.equal(SECTION4_PATH.length,12);
 assert.deepEqual(SECTION4_PATH.map(x=>x.id),[
  '4.1.1','4.1.2','4.1.3','4.1.4','4.2.1','4.2.2','4.2.3',
  '4.3.1','4.3.2','4.3.3','4.3.4','4.3.5'
 ]);
 const paradoxIds=new Set(PARADOXES.map(p=>p.id));
 for(const x of SECTION4_PATH){
  assert.ok(x.concept.length>100,x.id+' shallow concept');
  assert.ok(x.reason.length>95,x.id+' lacks reasoning');
  assert.ok(x.source.length>=10,x.id);
  assert.ok(x.cases.length>=1,x.id);
  assert.ok(x.paradoxes.length>=1,x.id);
  for(const c of x.cases)assert.ok(CASE_BY_ID.has(c),x.id+' broken case '+c);
  for(const p of x.paradoxes)assert.ok(paradoxIds.has(p),x.id+' broken paradox '+p);
 }
});

test('LBO1: separately recomputed senior and mezzanine schedules reconcile with visible answers',()=>{
 const initialEv=7500;
 const senior=initialEv*.6,mezz=initialEv*.15,sponsor=initialEv*.25,fcf=700;
 const schedule=loanSchedule(senior,.09,fcf,4,mezz,.13);
 check(answer('S4-01',0),senior,'initial senior');
 check(answer('S4-01',1),mezz,'initial mezz');
 check(answer('S4-01',2),schedule[0].debt,'senior after year1');
 check(answer('S4-01',3),schedule.at(-1).debt,'senior after year4');
 check(answer('S4-01',4),schedule.at(-1).debt+mezz,'total exit debt');
 const evExit=initialEv*1.025**4,equityExit=evExit-schedule.at(-1).debt-mezz;
 check(answer('S4-01',5),equityExit,'sponsor payout');
 check(answer('S4-01',6),(Math.pow(equityExit/sponsor,.25)-1)*100,'IRR');
 check(schedule[0].principalPayment,148.75,'year 1 principal repayment');
 check(SECTION4_SOURCE_CALCULATIONS.lbo1.seniorExit,schedule.at(-1).debt,'generator schedule');
 assert.match(CASE_BY_ID.get('S4-01').conditionHtml,/bullet/);
 assert.match(CASE_BY_ID.get('S4-01').solutionHtml,/проценты.*года|9%.*остаток/i);
});

test('LBO2: independently recomputed interest amortization and annualized equity IRR',()=>{
 const ev=15000,principal=ev*.70,sponsor=ev*.30;
 const schedule=loanSchedule(principal,.08,1200,6);
 check(answer('S4-02',0),principal,'initial debt');
 check(answer('S4-02',1),schedule[0].debt,'year1 debt');
 check(answer('S4-02',2),schedule.at(-1).debt,'year6 debt');
 const equity=ev*1.04**6-schedule.at(-1).debt;
 check(answer('S4-02',3),equity,'equity at exit');
 check(answer('S4-02',4),((equity/sponsor)**(1/6)-1)*100,'IRR');
 assert.ok(CASE_BY_ID.get('S4-02').solutionHtml.includes('CFADS'));
});

test('VC valuation and cap table are independent of case-module cached results',()=>{
 const pre=3000,primary=800;
 check(answer('S4-03',0),primary/(pre+primary)*100,'pre-money share');
 check(answer('S4-03',1),primary/pre*100,'post-money share');
 check(answer('S4-03',2),primary/pre*100-primary/(pre+primary)*100,'percentage point difference');
 const oldShares=20,founders=15,pool=5,price=9000/oldShares;
 const newShares=1800/price,total=oldShares+newShares;
 check(answer('S4-04',0),price,'share price');
 check(answer('S4-04',1),newShares,'issued shares');
 check(answer('S4-04',2),founders/total*100,'founder share');
 check(answer('S4-04',3),pool/total*100,'pool share');
 check(answer('S4-04',4),newShares/total*100,'new investor share');
 check((founders+pool+newShares)/total*100,100,'cap table reconciliation');
 assert.match(CASE_BY_ID.get('S4-04').solutionHtml,/50–70%/);
});

test('ROE and perpetual tax shield are recomputed under original tax assumptions',()=>{
 const assets=12000,ebit=2400,kd=.12,t=.25,d=assets*.4;
 check(answer('S4-05',0),ebit*(1-t),'NI without debt');
 check(answer('S4-05',1),ebit*(1-t)/assets*100,'ROE without debt');
 check(answer('S4-05',2),d*kd,'interest expense');
 check(answer('S4-05',3),(ebit-d*kd)*(1-t),'levered NI');
 check(answer('S4-05',4),(ebit-d*kd)*(1-t)/(assets-d)*100,'levered ROE');
 const debt=5000,interest=debt*.1,savings=interest*.25;
 check(answer('S4-06',0),interest,'perpetual interest');
 check(answer('S4-06',1),savings,'annual tax saving');
 check(answer('S4-06',2),savings/.1,'perpetual shield PV');
});

test('WACC scenario minima agree with independently calculated weighted rates',()=>{
 const pairs=[[.2,.06,.12],[.4,.07,.13],[.6,.09,.16],[.8,.13,.22]];
 const results=pairs.map(([debt,kd,ke])=>((1-debt)*ke+debt*kd*(1-.25))*100);
 for(let i=0;i<4;i++)check(answer('S4-07',i),results[i],'WACC '+i);
 check(answer('S4-07',4),Math.min(...results),'optimal among four WACC');
 assert.equal(results.indexOf(Math.min(...results)),1);
 assert.match(CASE_BY_ID.get('S4-07').solutionHtml,/не доказательство глобального оптимума/);
});

test('NovaTech buyback and WACC need explicit perpetual cashflow and shield assumptions',()=>{
 const evU=15,n=750000,ebit=2.5,debt=4,rate=.08,t=.35;
 const kU=(ebit*(1-t)/evU)*100;
 const evL=evU+t*debt,p=evL*1e6/n;
 const repurchased=debt*1e6/p;
 const sharesAfter=n-repurchased;
 const e=evL-debt;
 const ke=((ebit-debt*rate)*(1-t)/e)*100;
 const w=(e/evL)*ke+(debt/evL)*rate*(1-t)*100;
 check(answer('S4-08',0),kU,'old WACC');
 check(answer('S4-08',1),evL,'announced value');
 check(answer('S4-08',2),p,'price',1e-8);
 check(answer('S4-08',3),repurchased/1000,'retired thousands');
 check(answer('S4-08',4),e,'equity after repurchase');
 check(answer('S4-08',5),ke,'levered cost of equity');
 check(answer('S4-08',6),w,'levered WACC');
 check(evL*1e6/sharesAfter,p*evL/e,'share count valuation identity'); // algebraically: price after = E / remaining shares
 check(e*1e6/sharesAfter,p,'price after',1e-8);
 const caseText=CASE_BY_ID.get('S4-08').conditionHtml;
 assert.match(caseText,/Дополнительное условие/);
 assert.match(caseText,/Без этих допущений/);
});

test('each new numeric checkpoint is full coverage, graded, and teaches without premature answers',()=>{
 for(const c of SECTION4_SOURCE_CASES){
  const qs=SECTION4_SOURCE_CHECKPOINTS[c.id];
  assert.ok(Array.isArray(qs)&&qs.length>=3,c.id);
  assert.equal(CASE_CHECKPOINTS[c.id],qs,c.id);
  const keys=new Set();
  for(const q of qs){
   assert.ok(Number.isFinite(q.answer),c.id);
   assert.ok(!keys.has(q.label),c.id+': duplicate '+q.label);
   keys.add(q.label);
   assert.equal(verifyCheckpoint(q,String(q.answer)),true,c.id+': '+q.label);
   assert.equal(verifyCheckpoint(q,String(q.answer+1)),false,c.id+': '+q.label);
   assert.equal(q.hint.levels.length,3);
   assert.ok(q.hint.levels[0].length>=35,c.id+': short conceptual hint');
   assert.ok(q.hint.levels[1].includes('='),c.id+': formula hint without equals');
   assert.ok(q.hint.levels[2].length>=24,c.id+': missing substitution hint');
  }
 }
});
