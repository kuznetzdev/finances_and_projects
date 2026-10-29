import test from 'node:test';
import assert from 'node:assert/strict';
import {DIVERSITY_CONTRACTS,analyzeDistribution,runAudit} from '../scripts/generator-distributions.mjs';
import {TEMPLATE_CATALOG} from '../site/engine/index.js';
const mock=(seed,story,answer)=>({seed,exercise:{
 story,questions:[{key:'x',type:'number',answer,unit:'млн ₽'}]
}});
test('diversity audit detects collapsed stochastic generators and pinpoints seed',()=>{
 const repeated=Array.from({length:80},(_,i)=>mock(i+1,'all identical',1));
 const result=analyzeDistribution(repeated,{templateId:'v-pv',level:1});
 assert.equal(result.unique,1);
 assert.ok(result.errors.some(e=>e.code==='DIVERSITY_COLLAPSE'));
 assert.ok(result.errors.some(e=>e.code==='REPEAT_CONCENTRATION'));
 assert.equal(result.mostCommon[0].seed,1);
});
test('discrete templates are not blocked by arbitrary uniqueness thresholds',()=>{
 const repeated=Array.from({length:80},(_,i)=>mock(i+1,'fixed pedagogical scenario',1));
 const result=analyzeDistribution(repeated,{templateId:'fixed-teaching',level:1});
 assert.deepEqual(result.errors,[]);
 assert.ok(result.warnings.some(e=>e.code==='LOW_DIVERSITY'));
});
test('quantiles and IQR outliers are diagnostic rather than incorrect finance',()=>{
 const samples=Array.from({length:99},(_,i)=>mock(i+1,'story '+i,(i%7)+10));
 samples.push(mock(100,'extreme',100000));
 const a=analyzeDistribution(samples,{templateId:'test-case',level:2});
 assert.equal(a.samples,100);
 assert.equal(a.metrics.x.max,100000);
 assert.equal(a.metrics.x.outlierCount,1);
 assert.deepEqual(a.errors,[]);
 assert.equal(a.metrics.x.outlierExamples[0].seed,100);
});
test('runAudit checks both earliest and maximum difficulty for known high-cardinality templates',()=>{
 const catalog=['v-pv','v-fv','r-current','a-horizontal','dcf-two-stage']
  .map(id=>TEMPLATE_CATALOG.find(t=>t.id===id));
 assert.ok(catalog.every(Boolean));
 assert.equal(Object.keys(DIVERSITY_CONTRACTS).length,5);
 const report=runAudit({samples:64,catalog});
 assert.equal(report.sampledTemplates,5);
 assert.equal(report.checkedExercises,64*catalog.reduce((sum,t)=>sum+(t.min===4?1:2),0));
 assert.deepEqual(report.errors,[]);
 for(const r of report.rows)assert.ok(r.unique>=12,r.templateId);
});
