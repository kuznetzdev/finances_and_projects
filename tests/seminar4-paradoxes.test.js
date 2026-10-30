import test from 'node:test';
import assert from 'node:assert/strict';
import {SEMINARS,PARADOXES,ORIGINAL_PROMPTS} from '../site/data/paradoxes.js';
import {PARADOX_CAVEATS} from '../site/data/paradox-audit.js';
import {SEMINAR4_REFERENCES} from '../site/data/paradoxes-seminar4-sources.js';
import {filterParadoxes,promptFor} from '../site/engine/paradoxes.js';

const close=(a,b,name)=>assert.ok(Math.abs(a-b)<1e-6,name+': '+a+' vs '+b);
const cases=PARADOXES.filter(x=>x.seminar===4);
test('seminar four has ten original PDF prompts, discussion directions and in-depth multi-factor solutions',()=>{
 assert.equal(SEMINARS.length,4);
 assert.equal(PARADOXES.length,40);
 assert.equal(cases.length,10);
 assert.equal(filterParadoxes(4).length,10);
 assert.deepEqual(cases.map(x=>x.id),Array.from({length:10},(_,i)=>'s4-p'+(i+1)));
 assert.deepEqual(cases.map(x=>x.number),[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(new Set(PARADOXES.map(x=>x.id)).size,40);
 for(const item of cases){
  assert.equal(item.checks.length,3,item.id);
  assert.equal(new Set(item.checks).size,3,item.id);
  assert.ok(item.focus.length>=45,item.id+' missing focus from seminar');
  assert.ok(item.thesis.length>=80,item.id+' missing main argument');
  assert.ok(item.analysis.length>=1000,item.id+' insufficient depth');
  assert.ok(item.analysis.split('\n\n').length>=5,item.id+' not broken into clear paragraphs');
  assert.ok(item.analysis.includes('Альтернатив')||item.analysis.includes('альтернатив'),
   item.id+' no competing scenarios');
  assert.ok(item.trap.length>=60,item.id);
  assert.ok(promptFor(item).length>=140,item.id);
  assert.equal(promptFor(item),ORIGINAL_PROMPTS[item.id]);
  assert.ok(PARADOX_CAVEATS[item.id].length>130,item.id+' caveat missing');
 }
 assert.ok(filterParadoxes('4','взносы').length===0);
 assert.ok(filterParadoxes('4','LBO').some(x=>x.id==='s4-p5'));
 assert.ok(filterParadoxes('4','IRR').some(x=>x.id==='s4-p6'));
 assert.ok(filterParadoxes('4','венчур').some(x=>x.id==='s4-p10'));
 assert.equal(PARADOXES.filter(x=>x.seminar<=3).length,30,'original seminars changed');
});

test('financial leverage example actually disproves inevitable default at EBIT −20%',()=>{
 const assets=100,roa=.20,cost=.12,targetRoe=.40;
 const de=(targetRoe-roa)/(roa-cost);
 close(de,2.5,'D/E');
 const debt=assets*de/(1+de),equity=assets-debt;
 const interests=debt*cost,baseEbit=assets*roa;
 close((baseEbit-interests)/equity,.4,'ROE');
 const lowerEbit=baseEbit*.8;
 assert.ok(lowerEbit-interests>0,'EBIT after decline must cover interest');
 close(lowerEbit/interests,1.8666666666666667,'ICR');
 close(1-interests/baseEbit,.5714285714285714,'critical EBIT drop');
 assert.match(cases[1].analysis,/57,1%/);
});

test('term-sheet preference requires an investment size and waterfall assumptions',()=>{
 const exit=15000,investment=4000,post=10000,share=investment/post;
 const pref=2*investment;
 const nonparticipating=Math.max(pref,share*exit);
 close(nonparticipating,8000,'nonparticipating preference');
 close(exit-nonparticipating,7000,'common proceeds');
 const participating=pref+share*(exit-pref);
 close(participating,10800,'participating payout');
 close(exit-participating,4200,'participating common');
 assert.ok(2*8000>=exit,'higher size of same preference can exhaust exit');
 assert.match(cases[3].analysis,/7 000/);
 assert.match(cases[3].analysis,/4 200/);
});

test('LBO equity IRR is consistent with debt paid down, not EV expansion',()=>{
 const ev=10000,e0=2000,d0=8000,years=5;
 const e5=e0*1.25**years,d5=ev-e5,paid=d0-d5;
 close(e5,6103.515625,'equity at exit');
 close(paid,4103.515625,'principal repaid');
 close((e5/e0)**(1/years)-1,.25,'IRR');
 assert.ok(cases[4].analysis.includes('4 103,5'));
});

test('MOIC/IRR time scenarios are reproducible and do not assert universal preference',()=>{
 const irrA=8**(1/5)-1,irrB=10**(1/10)-1;
 close(irrA,.515716566510398,'A IRR');
 close(irrB,.2589254117941673,'B IRR');
 close((10/8)**(1/5)-1,.0456395525912732,'minimum reinvestment rate');
 assert.match(cases[5].analysis,/net IRR/);
 assert.match(cases[5].analysis,/DPI/);
 assert.match(cases[5].analysis,/неверна/);
});

test('founder voting and runway arithmetic are explicit and scenario-dependent',()=>{
 close(.15*10/(.15*10+.85),.6382978723404256,'founder votes');
 close(12/1,12,'runway base');
 close((12+3)/1,15,'runway with debt but without repayments');
 for(const n of [3,9,10]){
  assert.match(cases[n-1].analysis,/Альтернативы|Альтернативные/);
 }
});

test('references for historic deal and venture debt use stable primary/public sources',()=>{
 for(const id of ['s4-p8','s4-p10']){
  assert.ok(SEMINAR4_REFERENCES[id].length>=2,id);
  for(const ref of SEMINAR4_REFERENCES[id]){
   assert.match(ref.url,/^https:\/\//);
   assert.ok(ref.label.length>=15);
  }
 }
 assert.match(cases[7].analysis,/не подтверждают|не доказывают/);
 assert.match(cases[6].analysis,/6%.*10%|10%.*6%/);
 assert.match(cases[8].analysis,/универсаль|Порог/);
});
