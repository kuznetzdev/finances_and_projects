import test from 'node:test';
import assert from 'node:assert/strict';
import { SEMINARS, PARADOXES } from '../site/data/paradoxes.js';

test('30 paradoxes belong to the original three seminars', () => {
 assert.equal(SEMINARS.length, 3);
 assert.equal(PARADOXES.length, 30);
 for (const seminar of SEMINARS) {
  const subset=PARADOXES.filter(p=>p.seminar===seminar.id);
  assert.equal(subset.length,10);
  assert.deepEqual(subset.map(p=>p.number),[1,2,3,4,5,6,7,8,9,10]);
 }
});
test('Every paradox contains an answer and an actionable logic rubric', () => {
 const ids=PARADOXES.map(p=>p.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const p of PARADOXES){
  assert.ok(p.title.length>8,p.id);
  assert.ok(p.question.length>30,p.id);
  assert.ok(p.thesis.length>30,p.id);
  assert.ok(p.analysis.length>200,p.id);
  assert.ok(p.checks.length>=3,p.id);
  assert.ok(p.trap.length>35,p.id);
 }
});
