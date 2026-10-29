#!/usr/bin/env node
/** Fail-closed pre-deploy guard. Run: npm run preflight */
import {mkdirSync,writeFileSync} from 'node:fs';
import {preflight} from './lib/preflight.js';
const seeds=Number(process.env.PREFLIGHT_SEEDS??24);
let report;
try{
 report=preflight({seeds});
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/preflight-report.json',JSON.stringify({date:new Date().toISOString(),seeds,...report},null,2)+'\n');
 const checked=['checkedTemplates','checkedExercises','checkedOracleAnswers','checkedOracleTemplates','checkedControlWorkAnswers','checkedCases','checkedConcepts','checkedFormulas','checkedFiles'].map(k=>k+': '+report[k]).join('; ');
 console.log('PRE-FLIGHT '+checked);
 console.log('Warnings: '+report.warnings.length+'; errors: '+report.errors.length);
 for(const warning of report.warnings.slice(0,12))console.warn('WARNING ['+warning.code+'] '+warning.message);
 if(report.warnings.length>12)console.warn('Other warnings: '+(report.warnings.length-12)+' (see artifacts/preflight-report.json)');
 for(const error of report.errors.slice(0,50))console.error('ERROR ['+error.code+'] '+error.message);
 if(report.errors.length>50)console.error('Other errors: '+(report.errors.length-50)+' (see report)');
 if(report.errors.length)process.exitCode=1;
}catch(e){
 console.error('Preflight failed before report: '+(e?.stack??e));
 process.exitCode=1;
}
