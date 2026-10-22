import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordSkip, totalSkipped} from '../site/engine/attempts.js';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');

test('a skip never changes scoring, streak, or retry queues', () => {
  const stats = {total:10,correct:7,solved:4,quizSolved:6,quizCorrect:4,
    streak:3,retry:[{id:'wrong-one'}],caseCompleted:{F01:'today'}};
  const scoringSnapshot = JSON.stringify(stats);
  assert.equal(recordSkip(stats,'quiz'),1);
  assert.equal(recordSkip(stats,'task'),1);
  assert.equal(recordSkip(stats,'case'),1);
  assert.equal(totalSkipped(stats),3);
  for (const [key,value] of Object.entries(JSON.parse(scoringSnapshot))) assert.deepEqual(stats[key],value,key);
});

test('skip counters handle old local-storage data and reject unknown categories', () => {
  const stats = {skippedTasks:'invalid',skippedQuizzes:2};
  assert.equal(recordSkip(stats,'task'),1);
  assert.equal(recordSkip(stats,'quiz'),3);
  assert.equal(totalSkipped(stats),4);
  assert.throws(()=>recordSkip(stats,'unknown'),TypeError);
});

test('task, quiz and case UIs expose distinct neutral skip controls', () => {
  const app=read('../site/app.js');
  const bank=read('../site/features/casebook-ui.js');
  assert.match(app,/id="skip-task"/);
  assert.match(app,/\?'next-quiz':'skip-quiz'/);
  assert.match(app,/function skipQuiz\(/);
  assert.match(app,/recordSkip\(stats,'quiz'\)/);
  assert.match(app,/recordSkip\(stats,'task'\)/);
  assert.match(bank,/id="bank-skip"/);
  assert.match(bank,/recordSkip\(deps\.stats,'case'\)/);
});

test('responsive action docks and logo theme override load after base CSS', () => {
  const html=read('../site/index.html');
  const css=read('../site/interaction.css');
  assert.ok(html.indexOf('./styles.css') < html.indexOf('./interaction.css'));
  assert.match(css,/\.brand-mark, \.mobile-mark\s*\{[^}]*background-color:/s);
  assert.match(css,/\.quiz-actions, \.task-actions, \.case-action-dock, \.flip-controls\s*\{[^}]*position:\s*sticky/s);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/@media \(max-width: 520px\)/);
});