import test from 'node:test';
import assert from 'node:assert/strict';
import {LECTURE_CASES} from '../site/data/lecture-cases.js';
import {LECTURE_CHECKPOINTS} from '../site/data/lecture-checkpoints.js';
import {CASE_BANK,CASE_BY_ID,CASE_GROUPS,availableCases,verifyCheckpoint} from '../site/engine/casebook.js';
import {CONCEPTS} from '../site/data/knowledge.js';
const close=(a,b,tolerance=.03)=>assert.ok(Math.abs(a-b)<=tolerance, a+' != '+b);
const checkpoint=(id,index)=>LECTURE_CHECKPOINTS[id][index].answer;

test('Ten new lecture-specific assignments supplement but never mutate the 57-case source bank',()=>{
 assert.equal(LECTURE_CASES.length,10);
 assert.equal(CASE_BANK.length,97);
 assert.equal(new Set(CASE_BANK.map(x=>x.id)).size,97);
 assert.deepEqual(LECTURE_CASES.map(x=>x.id),[
  'LC01','LC02','LC03','VC01','VC02','VC03','VC04','RO01','RO02','RO03'
 ]);
 assert.equal(availableCases('LBO · видеолекция').length,3);
 assert.equal(availableCases('Венчур · видеолекция').length,4);
 assert.equal(availableCases('Реальные опционы · видеолекция').length,3);
 for(const item of LECTURE_CASES){
  assert.ok(CASE_BY_ID.has(item.id),item.id);
  assert.ok(CASE_GROUPS.includes(item.group),item.id);
  assert.ok(item.conditionHtml.length>=280,item.id);
  assert.ok(item.steps.length>=3,item.id);
  assert.ok(item.source.length>15,item.id);
  assert.ok(item.solutionHtml.length>=200,item.id);
 }
 assert.ok(CASE_BY_ID.get('V13'),'Original option case unexpectedly lost');
 assert.ok(CASE_BY_ID.get('T04'),'Original WACC case unexpectedly lost');
});
test('Original six seminar exercises are represented with exact figures and all questions',()=>{
 for(const [id,figures] of [
  ['LC01',['500','350','150','50','4']],
  ['LC02',['100','900','70%']],
  ['LC03',['200%']],
  ['VC01',['1 000','9 000']],
  ['VC02',['10 млн','4 000','1 000']],
  ['VC03',['500','4 000','4 года']]
 ]) {
  const item=CASE_BY_ID.get(id);
  for(const text of figures)assert.ok(item.conditionHtml.includes(text),id+': '+text);
 }
});
test('LBO and venture numeric results match independent calculations and are graded',()=>{
 close(checkpoint('LC01',0),350-4*50);
 close(checkpoint('LC01',1),500-(350-4*50));
 close(checkpoint('LC01',2),(500-(350-4*50))/150,.001);
 close(checkpoint('VC01',0),9000+1000);
 close(checkpoint('VC01',1),1000/(9000+1000)*100);
 close(checkpoint('VC01',2),9000/(9000+1000)*100);
 close(checkpoint('VC02',0),4000/10);
 close(checkpoint('VC02',1),1000/(4000/10));
 close(checkpoint('VC02',2),10+1000/(4000/10));
 close(checkpoint('VC03',0),4000/500);
 close(checkpoint('VC03',1),((4000/500)**(1/4)-1)*100);
 close(checkpoint('VC04',1),8/(10+2.5)*100);
 close(checkpoint('VC04',2),2/(10+2.5)*100);
 close(checkpoint('VC04',3),2.5/(10+2.5)*100);
 close(checkpoint('VC04',4),80-64);
 for(const [id,steps] of Object.entries(LECTURE_CHECKPOINTS)){
  assert.ok(CASE_BY_ID.has(id));
  for(const step of steps){
   assert.equal(verifyCheckpoint(step,String(step.answer)),true,id+' '+step.label);
   assert.equal(verifyCheckpoint(step,'не число'),false,id);
  }
 }
});
test('Real-option switching is calculated after discounting, and ambiguous lecture formula is never auto-graded',()=>{
 close(checkpoint('RO02',0),.5*120+.5*(-40));
 close(checkpoint('RO02',1),.5*120+.5*70);
 close(checkpoint('RO02',2),((.5*120+.5*70)-(.5*120+.5*(-40)))/1.1);
 close(checkpoint('RO02',3),50-30);
 assert.equal(CASE_BY_ID.get('RO01').caveat,true);
 assert.equal(LECTURE_CHECKPOINTS.RO01,undefined,'Underdetermined slide must not be graded as a single numerical answer');
 const explanation=CASE_BY_ID.get('RO01').solutionHtml;
 assert.match(explanation,/378,07/);
 assert.match(explanation,/756,14/);
 assert.match(explanation,/безусловн|обязательн/);
 assert.match(CASE_BY_ID.get('RO03').solutionHtml,/переключение/);
});
test('New lecture concepts are unique and searchable in glossary',()=>{
 for(const id of ['primary-round','pro-rata-right','switch-real-option']){
  const terms=CONCEPTS.filter(x=>x.id===id);
  assert.equal(terms.length,1,id);
  assert.ok(terms[0].definition.length>40,id);
 }
});
