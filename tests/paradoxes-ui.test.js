import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SEMINARS, PARADOXES, ORIGINAL_PROMPTS} from '../site/data/paradoxes.js';
import {MIN_ANSWER_LENGTH,filterParadoxes,promptFor,normalizeRecord,canMarkReviewed,countReviewed} from '../site/engine/paradoxes.js';

const answer='Рост показателя сам по себе не доказывает создание стоимости. Нужно отделить денежные потоки от бухгалтерской прибыли, проверить модель финансирования, временные ограничения и риск. '.repeat(2);

test('Each original seminar question is preserved, uniquely mapped and nonempty',()=>{
 assert.equal(SEMINARS.length,4);
 assert.equal(PARADOXES.length,40);
 assert.equal(Object.keys(ORIGINAL_PROMPTS).length,40);
 assert.equal(new Set(PARADOXES.map(p=>p.id)).size,40);
 for(const s of SEMINARS){
  const arr=PARADOXES.filter(p=>p.seminar===s.id);
  assert.deepEqual(arr.map(p=>p.number),[1,2,3,4,5,6,7,8,9,10]);
  for(const p of arr){
   assert.ok(promptFor(p).length>=80,p.id);
   assert.ok(p.analysis.length>=200,p.id);
   assert.equal(p.checks.length,3,p.id);
   assert.ok(p.trap.length>30,p.id);
  }
 }
});
test('Keyword search is case independent and preserves the selected seminar',()=>{
 assert.equal(filterParadoxes().length,40);
 assert.equal(filterParadoxes(1).length,10);
 assert.equal(filterParadoxes('2').length,10);
 assert.equal(filterParadoxes('3').length,10);
 assert.equal(filterParadoxes('4').length,10);
 assert.ok(filterParadoxes('4','liquidation').length===0);
 assert.ok(filterParadoxes('4','LBO').some(p=>p.id==='s4-p5'));
 assert.ok(filterParadoxes('4','венчур').some(p=>p.id==='s4-p10'));
 assert.ok(filterParadoxes('all','WACC').length>=3);
 assert.ok(filterParadoxes('all','wacc').length>=3);
 assert.ok(filterParadoxes('all','  МСФО  ').some(p=>p.id==='s1-p4'));
 assert.deepEqual(filterParadoxes('2','МСФО'),[]);
 assert.equal(filterParadoxes('all','фантазийное_слово').length,0);
});
test('A paradox cannot be marked completed without a developed answer and all checks',()=>{
 const p=PARADOXES[0];
 assert.ok(MIN_ANSWER_LENGTH>=120);
 assert.equal(canMarkReviewed(p,{draft:'',checks:[0,1,2]}),false);
 assert.equal(canMarkReviewed(p,{draft:'только один тезис',checks:[0,1,2]}),false);
 assert.equal(canMarkReviewed(p,{draft:answer,checks:[0,1]}),false);
 assert.equal(canMarkReviewed(p,{draft:answer,checks:[0,1,2]}),true);
 assert.equal(canMarkReviewed(p,{draft:answer,checks:[0,1,9]}),false);
});
test('Corrupted local-storage records do not produce false completion',()=>{
 const p=PARADOXES[1];
 assert.equal(normalizeRecord({draft:42,checks:'abc',status:'done'}).status,'review');
 assert.deepEqual(normalizeRecord({draft:answer,checks:[0,0,2,'1',-2,9]}).checks,[0,2]);
 assert.equal(countReviewed({[p.id]:{draft:'',checks:[0,1,2],status:'done'}}),0);
 assert.equal(countReviewed({[p.id]:{draft:answer,checks:[0,1,2],status:'done'}}),1);
 assert.equal(countReviewed({[p.id]:{draft:answer,checks:[0,1,2],status:'done'}},3),0);
});
test('Navigation exposes the paradox section on desktop and mobile, with direct route support',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../site/features/paradoxes-ui.js',import.meta.url),'utf8');
 assert.equal((html.match(/data-page="paradoxes"/g)||[]).length,2);
 assert.match(app,/function syncPageNavigation/);
 assert.match(app,/syncPageNavigation\(app\.page\)/);
 assert.match(app,/renderParadoxes\(\$\('#content'\),pageIntro\)/);
 assert.match(ui,/const results=root\.querySelector\('#paradox-list-results'\)/);
 assert.match(ui,/results\.innerHTML=rows\(\)/);
 assert.match(ui,/setTimeout\(flush,350\)/);
 assert.match(ui,/window\.addEventListener\('pagehide',flush\)/);
});
