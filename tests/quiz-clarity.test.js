import test from 'node:test';
import assert from 'node:assert/strict';
import { CONCEPTS, OPERATIONS } from '../site/data/knowledge.js';
import { ABBREVIATIONS, abbreviationFor, abbreviationsIn } from '../site/data/abbreviations.js';
import { buildOperationQuiz, buildConceptQuiz, describeQuizAnswer, explainAlternative, OPERATION_FAMILIES, CLASSIFICATION_NOTES } from '../site/engine/quiz-learning.js';
import { readFileSync } from 'node:fs';

test('Every classification quiz states explicitly what should be classified', () => {
 for(const op of OPERATIONS){
  assert.ok(CLASSIFICATION_NOTES[op.answer],`${op.id} lacks a concrete explanation for ${op.answer}`);
  const q=buildOperationQuiz(op,OPERATIONS,123);
  assert.equal(q.kind,'operations');
  assert.equal(q.scenario,op.event);
  assert.ok(q.question.endsWith('?'));
  assert.ok(q.question.length>35);
  assert.ok(q.hint.length>85,op.id);
  assert.equal(q.options.length,4,op.id);
  assert.equal(new Set(q.options).size,4,op.id);
  assert.equal(q.options.filter(x=>x===q.answer).length,1,op.id);
  const d=describeQuizAnswer(q,q.options.find(x=>x!==q.answer),CONCEPTS);
  assert.ok(d.reason.length>=30,op.id);
  assert.ok(d.rule.length>=45,op.id);
  assert.ok(d.wrong.length>=35,op.id);
  for(const opt of q.options){assert.ok(explainAlternative(opt,q,CONCEPTS).length>=30,`${op.id} ${opt}`);}
 }
});

test('Concept quiz does not reveal the name in its question and distinguishes distractors',()=>{
 for(const c of CONCEPTS){
  const q=buildConceptQuiz(c,CONCEPTS,158);
  assert.equal(q.scenario,c.definition);
  assert.equal(q.question,'Как называется описанное финансовое понятие?');
  assert.equal(q.options.length,4,c.id);
  assert.equal(new Set(q.options).size,4,c.id);
  assert.ok(q.options.includes(c.term));
  assert.ok(q.hint.length>40,c.id);
  const wrong=q.options.find(x=>x!==c.term);
  const d=describeQuizAnswer(q,wrong,CONCEPTS);
  assert.ok(d.wrong.includes('означает:'),c.id);
  assert.ok(explainAlternative(wrong,q,CONCEPTS).length>30,c.id);
 }
});

test('EAC and similar acronyms have explanatory expansions that do not require guessing English',()=>{
 for(const id of ['EAC','EAA','NPV','IRR','WACC','CAPM','FCFF','CFO','CFADS','DSCR','ICR','LLCR','YTM','MOIC','LBO','EBITDA']){
  const x=abbreviationFor(id);
  assert.ok(x?.english && x?.russian && x?.meaning,`${id} incomplete`);
  assert.ok(x.english.length>9 && x.russian.length>8,`${id} too short`);
 }
 assert.match(abbreviationFor('EAC').english,/Equivalent Annual Cost/);
 assert.match(abbreviationFor('EAC').russian,/годовые затраты/);
 assert.ok(abbreviationsIn('EAC, WACC, EBIT и EBITDA').some(x=>x.key==='EAC'));
 assert.deepEqual(abbreviationsIn('Без аббревиатур'),[]);
 assert.equal(abbreviationFor('unknown'),null);
 const quiz=buildConceptQuiz(CONCEPTS.find(c=>c.id==='eac'),CONCEPTS,17);
 assert.equal(describeQuizAnswer(quiz,quiz.answer,CONCEPTS).expansion?.key,'EAC');
});

test('Hints are hidden before checking and explicit feedback is displayed after answering',()=>{
 const s=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../site/interaction.css',import.meta.url),'utf8');
 assert.match(s,/quizHint: false/);
 assert.match(s,/app\.quizHint=false/);
 assert.match(s,/item\.scenario/);
 assert.match(s,/item\.question/);
 assert.match(s,/quiz-hint-details/);
 assert.match(s,/describeQuizAnswer\(item,app\.quizResult,CONCEPTS\)/);
 assert.match(s,/quiz-alternatives/);
 assert.match(s,/abbreviationFor\(card\.term\)/);
 assert.match(s,/exerciseHintHtml\(e\)/);
 assert.match(css,/\.quiz-scenario/);
 assert.match(css,/\.quiz-term-expansion/);
});