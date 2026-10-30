import test from 'node:test';
import assert from 'node:assert/strict';
import {
 reviewDistributionFlags,REVIEWED_DISCRETE_SCENARIOS,REVIEWED_TAILS,
 REVIEWED_HIGH_RATIOS
} from '../scripts/lib/distribution-review.js';
import {runAudit} from '../scripts/generator-distributions.mjs';
import {TEMPLATE_CATALOG} from '../site/engine/index.js';

const low=(id,unique,n=1000)=>({code:'LOW_DIVERSITY',
 message:id+' level=4 only '+unique+'/'+n+' distinct outputs; verify whether small finite set intended'});
const tail=(id,key,num,n=1000)=>({code:'DISTRIBUTION_OUTLIERS',
 message:id+' level=4 key='+key+' '+num+'/'+n+' beyond 3×IQR'});
const high=(id,key,value,count)=>({code:'UNUSUAL_FINANCIAL_RATIO',
 message:'seed=36 level=4 '+id+'/'+key+': '+value+' % (occurrences: '+count+')'});

test('all 22 real deep-audit warning signatures are explained and reviewed, not suppressed',()=>{
 const warnings=[
  ...Object.entries(REVIEWED_DISCRETE_SCENARIOS).flatMap(([id,p])=>
   Array.from({length:id==='t-ndfl'?2:1},()=>low(id,p.minUnique))),
  tail('t-ndfl','tax',130),tail('t-ndfl','net',130),
  tail('m-break-even','units',41),high('a-du-pont-three','roe',111.6,11),
  high('a-du-pont-five','roe',107.1,9)
 ];
 const rows=Object.entries(REVIEWED_DISCRETE_SCENARIOS).map(([templateId,p])=>({
  templateId,level:4,unique:p.minUnique
 }));
 const review=reviewDistributionFlags(warnings,rows,{samples:1000});
 assert.deepEqual(review.errors,[]);
 assert.equal(review.reviewed.length,warnings.length);
 assert.equal(review.unreviewed.length,0);
 assert.ok(warnings.length>=13);
});

test('any new statistical warning or new metric is a release blocker',()=>{
 const unknown=[
  {code:'NEW_CODE',message:'Unrecognized extreme value'},
  tail('unknown-template','price',33),
  low('some-other-template',1),
  high('unknown-template','roe',110,5)
 ];
 const review=reviewDistributionFlags(unknown,[],{samples:1000});
 assert.equal(review.reviewed.length,0);
 assert.equal(review.unreviewed.length,unknown.length);
 assert.equal(review.errors.length,unknown.length);
});

test('recognized flags are rejected when approved diversity/tail bounds deteriorate',()=>{
 const warnings=[
  low('t-ndfl',7),tail('t-ndfl','tax',170),
  high('a-du-pont-three','roe',175,12),
  high('a-du-pont-five','roe',105,55)
 ];
 const report=reviewDistributionFlags(warnings,[{templateId:'t-ndfl',level:4,unique:7}],{samples:1000});
 assert.ok(report.errors.length>=5);
 assert.equal(report.reviewed.length,0);
 assert.ok(report.errors.some(x=>x.code==='DIVERSITY_BASELINE'));
 assert.ok(report.errors.some(x=>x.message.includes('Tail fraction increased')));
});

test('approved short-sample outliers retain the same financial meaning and rate limits',()=>{
 const warnings=[
  tail('v-irr-zero','irr',7,96),
  tail('a-icr-dscr','dscr',4,96),
  tail('option-protective-put','payoff',6,96),
  tail('m-break-even','units',4,96),
  high('a-du-pont-three','roe',111.6,1)
 ];
 const result=reviewDistributionFlags(warnings,[],{samples:96});
 assert.equal(result.unreviewed.length,0);
 assert.equal(result.errors.length,0);
 assert.ok(Object.keys(REVIEWED_TAILS).length>=6);
 assert.ok(Object.keys(REVIEWED_HIGH_RATIOS).length>=2);
});

test('real selected generators produce reviewed distribution signals without false arithmetic failures',()=>{
 const ids=new Set(['t-ndfl','m-break-even','a-du-pont-three','option-protective-put']);
 const chosen=TEMPLATE_CATALOG.filter(x=>ids.has(x.id));
 assert.equal(chosen.length,ids.size);
 const report=runAudit({samples:96,catalog:chosen});
 assert.deepEqual(report.errors,[],JSON.stringify(report.errors));
 assert.equal(report.unreviewedFlags.length,0);
 assert.ok(report.reviewedFlags>0);
});
