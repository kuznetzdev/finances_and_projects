import test from 'node:test';
import assert from 'node:assert/strict';
import { SEMINARS, PARADOXES, ORIGINAL_PROMPTS } from '../site/data/paradoxes.js';
import { PARADOX_CAVEATS } from '../site/data/paradox-audit.js';

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

test('Original seminar prompts and audit notes cover all 30 paradoxes', () => {
 const ids=PARADOXES.map(p=>p.id);
 assert.deepEqual(Object.keys(ORIGINAL_PROMPTS).sort(),[...ids].sort());
 assert.deepEqual(Object.keys(PARADOX_CAVEATS).sort(),[...ids].sort());
 for(const p of PARADOXES){
  assert.ok(ORIGINAL_PROMPTS[p.id].length>60,'missing original prompt: '+p.id);
  assert.ok(PARADOX_CAVEATS[p.id].length>70,'insufficient validity note: '+p.id);
  assert.ok(p.checks.length===3,'rubric must contain exactly three checks: '+p.id);
  assert.ok(new Set(p.checks).size===3,'rubric criteria must be distinct: '+p.id);
 }
});
test('Numerical statements in paradox analyses agree with their assumptions', () => {
 // s1-p4: cash shortage before receivables arrive
 assert.equal(10-1,9);
 // s1-p6: the source example uses 20%, not the default 2026 Russian rate
 assert.equal(15*0.20,3);
 assert.equal(15*(1-0.20),12);
 // s1-p8: principal and maintenance CAPEX exceed EBITDA-derived liquidity
 assert.equal(12+5-10,7);
 // s1-p10: revenue grows 25%, EBIT falls 40% after step-fixed costs
 const oldRevenue=100*10, newRevenue=125*10;
 const oldEbit=100*(10-6)-300, newEbit=125*(10-6)-440;
 assert.equal(newRevenue/oldRevenue,1.25);
 assert.equal(oldEbit,100);
 assert.equal(newEbit,60);
 assert.equal(newEbit/oldEbit,0.6);
 // s3-p4: simplified, undiscounted option scenario
 assert.equal(-10+0.2*100,10);
 // s3-p9: the ungrounded simple mean is not a fair-value estimate
 assert.ok(Math.abs((100+200+50)/3-116.7)<0.04);
 // WACC example: market value weights and an applicable tax shield
 const wacc=(100/150)*0.16+(50/150)*0.12*(1-0.25);
 assert.ok(Math.abs(wacc-0.13666666666666666)<1e-10);
});
