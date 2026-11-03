#!/usr/bin/env node
/**
 * Source-specific independent mathematical verification of fixed cases.
 * Unlike UI self-grading, expected values are never read from checkpoints.
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {CASE_BANK,CASE_CHECKPOINTS} from '../site/engine/casebook.js';
import {FIXED_REFERENCE_GROUPS,validateAllFixedReferences} from './lib/all-fixed-oracles.js';
const result=validateAllFixedReferences(CASE_BANK,CASE_CHECKPOINTS);
const rows=Object.entries(FIXED_REFERENCE_GROUPS).map(([domain,references])=>{
 const ids=Object.keys(references),numbers=Object.values(references).reduce((n,steps)=>n+Object.keys(steps).length,0);
 return {domain,fixedCases:ids.length,independentAnswers:numbers,
  casesWithAssumptions:ids.filter(id=>CASE_BANK.find(x=>x.id===id)?.caveat).length};
});
const count=rows.reduce((n,row)=>n+row.independentAnswers,0);
const audit={generatedAt:new Date().toISOString(),status:result.errors.length?'FAILED':'PASS',
 checkedCases:result.checkedCases,checkedAnswers:result.checkedAnswers,
 independentlyVerifiedAnswers:result.coveredAnswers,domainTotals:rows,
 sourceLimitations:[
  'Each domain reference is independently calculated from explicitly transcribed task parameters, not imported from the answer bank.',
  'Financial arithmetic is verified; legal, regulatory and market assumptions are valid only as labelled in the task conditions.',
  'Calculated equality of all numeric answers does not certify the wording of every qualitative explanation.',
  'Generator-specific coverage is evaluated separately by scripts/finance-coverage.mjs; generic-only is not independent verification.'
 ],errors:result.errors};
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/fixed-math-audit.json',JSON.stringify(audit,null,2)+'\n');
for(const row of rows)console.log(row.domain+': '+row.fixedCases+' cases, '+row.independentAnswers+' independently calculated answers, '+row.casesWithAssumptions+' conditional cases');
console.log('FIXED MATH '+audit.status+': '+result.checkedCases+' cases, '+result.checkedAnswers+' graded steps, '+count+' independent references, '+result.errors.length+' errors');
for(const error of result.errors.slice(0,50))console.error(error.code+': '+error.message);
if(result.errors.length)process.exitCode=1;
