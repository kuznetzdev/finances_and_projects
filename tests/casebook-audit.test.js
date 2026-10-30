import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CASE_BANK,CASE_CHECKPOINTS,availableCases,nextCase,verifyCheckpoint} from '../site/engine/casebook.js';
import {LECTURE_CHECKPOINTS} from '../site/data/lecture-checkpoints.js';

test('Search covers case statement details, categories, Russian ё and LBO-specific terms',()=>{
 assert.ok(availableCases('Все направления','мебель').some(c=>c.id==='LC03'));
 assert.ok(availableCases('Все направления','опционный пул').some(c=>c.id==='VC04'));
 assert.ok(availableCases('Все направления','уменьшение основного долга').some(c=>c.id==='LC01'));
 assert.deepEqual(availableCases('LBO · видеолекция','редкая_ошибка_поиска'),[]);
 assert.ok(availableCases('Все направления','развёрнутый').length===availableCases('Все направления','развернутый').length);
 assert.ok(availableCases('Все направления','СВОБОДНОГО    денежного потока').some(c=>c.id==='LC01'));
 assert.equal(availableCases('Все направления','').length,CASE_BANK.length);
});
test('Random choice respects both seminar group and live search results',()=>{
 const matched=availableCases('Венчур · видеолекция','опционный пул');
 assert.ok(matched.length>=1);
 for(let i=0;i<20;i++){
  const selected=nextCase([], 'Венчур · видеолекция',()=>i/20,'опционный пул');
  assert.ok(matched.some(x=>x.id===selected.id));
 }
 assert.throws(()=>nextCase([],'LBO · видеолекция',()=>0,'вряд_ли_найдём'),/Нечего выбирать/);
});
test('Every numerical lecture step has a meaningful safe guide and legible formula',()=>{
 assert.equal(Object.keys(LECTURE_CHECKPOINTS).length,7);
 for(const [id,steps] of Object.entries(LECTURE_CHECKPOINTS)){
  assert.ok(steps.length>=2,id);
  for(const q of steps){
   assert.equal(verifyCheckpoint(q,String(q.answer)),true);
   assert.ok(q.hint?.guide.length>=35,id+': '+q.label);
   assert.ok(q.hint?.formula.includes('='),id+': '+q.label);
   assert.ok(q.hint.formula.length<=125,id+': '+q.label);
  }
 }
});
test('Bank UI uses updated current-value verification and self-reviewed-text constraint',()=>{
 const ui=readFileSync(new URL('../site/features/casebook-ui.js',import.meta.url),'utf8');
 assert.match(ui,/verifyCheckpoint\(q,d\.answers\?\.\[i\]\)===true/);
 assert.match(ui,/MIN_REASONING_LENGTH/);
 assert.match(ui,/state\.revealedHint/);
 assert.match(ui,/aria-expanded="\$\{hintExpanded\}"/);
 assert.match(ui,/bank-match-count/);
 assert.match(ui,/formulaMarkup\(step\.hint\?\.formula\?\?'',deps\.escape\)/);
 assert.match(ui,/formulaMarkup\(hintLevels\[1\],deps\.escape\)/);
 assert.match(ui,/state\.hintLevel/);
});
