/**
 * Reviewed statistical exception registry, keyed by exact generator and metric.
 * This is NOT an economic 'normal range' filter. Thresholds are regression
 * limits for the existing scenario design, reviewed against 96/1000-seed audits
 * on 2026-10-30. Unknown warnings, newly concentrated scenarios or increased
 * tails block CI; deliberately discrete problem sets remain permissible.
 */
export const REVIEWED_DISCRETE_SCENARIOS=Object.freeze({
 't-vat-inclusive':{minUnique:20,reason:'20 fixed VAT-inclusive prices and rate choices'},
 't-ndfl':{minUnique:8,reason:'Eight staged progressive-tax examples; multimodal tax outputs'},
 't-insurance':{minUnique:6,reason:'Six statutory contribution base examples'},
 't-deferred-judgement':{minUnique:13,reason:'Thirteen deliberately fixed conceptual cases'},
 'logic-advance':{minUnique:14,reason:'Fourteen qualitative advance-payment classifications'},
 'logic-dividends':{minUnique:11,reason:'Eleven qualitative dividend classifications'},
 'a-wacc-scenarios':{minUnique:9,reason:'Nine fixed WACC comparison scenarios'},
 'capital-wacc-dynamic':{minUnique:6,reason:'Three rate shifts times two risk shifts, six distinct cases'}
});
export const REVIEWED_TAILS=Object.freeze({
 'v-irr-zero/irr':{maxFraction:.11,reason:'IRR ratio becomes nonlinear at large terminal payments'},
 't-ndfl/tax':{maxFraction:.16,reason:'Progressive bracket steps produce distinct tax clusters'},
 't-ndfl/net':{maxFraction:.16,reason:'After-tax income inherits the progressive-bracket clusters'},
 'm-break-even/units':{maxFraction:.075,reason:'Small positive contribution margin raises break-even volume'},
 'a-icr-dscr/dscr':{maxFraction:.09,reason:'DSCR is a ratio with small positive debt-service denominators'},
 'option-protective-put/payoff':{maxFraction:.12,reason:'Payoff is zero below exercise threshold and positive in the tail'}
});
export const REVIEWED_HIGH_RATIOS=Object.freeze({
 'a-du-pont-three/roe':{maxFraction:.035,maxAbsolute:150,reason:'High equity multiplier can produce ROE above 100%'},
 'a-du-pont-five/roe':{maxFraction:.035,maxAbsolute:150,reason:'High equity multiplier can produce ROE above 100%'}
});
const problem=(code,message)=>({code,message});
/**
 * Returns every warning as reviewed or unreviewed. Dataset size is the real
 * audit sample count, not a fabricated baseline, and must be passed explicitly.
 */
export function reviewDistributionFlags(warnings,rows,{samples}){
 if(!Number.isInteger(samples)||samples<40)throw Error('Invalid review sample size');
 const reviewed=[],unreviewed=[],errors=[];
 const reject=(item,why)=>{unreviewed.push(item);errors.push(problem('UNREVIEWED_DISTRIBUTION',why));};
 for(const w of warnings){
  const s=w.message??'';
  if(w.code==='LOW_DIVERSITY'){
   const m=s.match(/^([\w-]+) level=(\d+) only (\d+)\/(\d+) distinct outputs/);
   const policy=m&&REVIEWED_DISCRETE_SCENARIOS[m[1]];
   if(!policy||Number(m[4])!==samples){reject(w,'Unknown low-diversity case: '+s);continue;}
   if(Number(m[3])<policy.minUnique){reject(w,'Diversity regression: '+s+'; minimum '+policy.minUnique);continue;}
   reviewed.push({...w,reason:policy.reason});continue;
  }
  if(w.code==='DISTRIBUTION_OUTLIERS'){
   const m=s.match(/^([\w-]+) level=(\d+) key=([\w-]+) (\d+)\/(\d+) beyond 3×IQR/);
   const policy=m&&REVIEWED_TAILS[m[1]+'/'+m[3]];
   if(!policy||Number(m[5])!==samples){reject(w,'Unknown outlier metric: '+s);continue;}
   if(Number(m[4])/samples>policy.maxFraction){
    reject(w,'Tail fraction increased: '+s+'; cap '+policy.maxFraction);continue;
   }
   reviewed.push({...w,reason:policy.reason});continue;
  }
  if(w.code==='UNUSUAL_FINANCIAL_RATIO'){
   const m=s.match(/level=\d+ ([\w-]+)\/([\w-]+): (-?[\d.]+) % \(occurrences: (\d+)\)/);
   const policy=m&&REVIEWED_HIGH_RATIOS[m[1]+'/'+m[2]];
   if(!policy){reject(w,'Unknown unusual financial ratio: '+s);continue;}
   if(Number(m[4])/samples>policy.maxFraction||Math.abs(Number(m[3]))>policy.maxAbsolute){
    reject(w,'High-ratio regression: '+s+'; cap '+policy.maxAbsolute+'/'+policy.maxFraction);continue;
   }
   reviewed.push({...w,reason:policy.reason});continue;
  }
  reject(w,'Unknown distribution warning ['+w.code+']: '+s);
 }
 // Detect genuine collapse in a previously reviewed finite scenario set even
 // when the warning heuristics change or stop emitting LOW_DIVERSITY.
 if(samples>=500){
  for(const row of rows){
   const policy=REVIEWED_DISCRETE_SCENARIOS[row.templateId];
   if(policy&&row.unique<policy.minUnique)
    errors.push(problem('DIVERSITY_BASELINE','Scenario set shrank: '+row.templateId+
     ' level='+row.level+' unique='+row.unique+' required='+policy.minUnique));
  }
 }
 return {reviewed,unreviewed,errors};
}
