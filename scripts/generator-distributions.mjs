#!/usr/bin/env node
/**
 * Reproducible distribution audit for randomized finance exercises.
 *
 * Run: npm run audit:distributions           (96 seeds per level)
 *      npm run audit:distributions:deep      (1000 seeds per level)
 * A fixed seed sequence is used so reports can be compared across commits.
 * Only predeclared high-cardinality templates are release-blocked when
 * diversity collapses. Other repeats and IQR outliers are diagnostics, not
 * proof of an incorrect finance formula.
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {validatePlausibility} from './lib/financial-plausibility.js';

export const DIVERSITY_CONTRACTS=Object.freeze({
 'v-pv':{minUniqueRate:.20,maxDominantRate:.25},
 'v-fv':{minUniqueRate:.20,maxDominantRate:.25},
 'r-current':{minUniqueRate:.20,maxDominantRate:.25},
 'a-horizontal':{minUniqueRate:.20,maxDominantRate:.25},
 'dcf-two-stage':{minUniqueRate:.20,maxDominantRate:.25}
});
const percentile=(sorted,fraction)=>{
 if(!sorted.length)return null;
 const x=(sorted.length-1)*fraction,lo=Math.floor(x),hi=Math.ceil(x);
 return sorted[lo]+(sorted[hi]-sorted[lo])*(x-lo);
};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const canonical=ex=>JSON.stringify([
 ex.story,
 (ex.questions??[]).map(q=>[q.key,q.type,q.answer,q.choices??null])
]);
export function analyzeDistribution(samples,{templateId,level,contract=DIVERSITY_CONTRACTS[templateId]}={}){
 const count=samples.length;
 if(!count)throw Error('Distribution audit received no samples for '+templateId);
 const groups=new Map(),numeric=new Map();
 for(const item of samples){
  const signature=canonical(item.exercise??item);
  const key=item.seed??'?';
  const prev=groups.get(signature)??{count:0,seed:key};
  prev.count++;
  groups.set(signature,prev);
  for(const q of (item.exercise??item).questions??[]){
   if(q.type!=='number'||!finite(q.answer))continue;
   if(!numeric.has(q.key))numeric.set(q.key,[]);
   numeric.get(q.key).push({value:q.answer,seed:key});
  }
 }
 const unique=groups.size;
 const mostFrequent=Math.max(...[...groups.values()].map(x=>x.count));
 const ratio=mostFrequent/count;
 const issues=[],warnings=[];
 if(contract&&count>=40){
  const required=Math.max(12,Math.floor(count*contract.minUniqueRate));
  if(unique<required)issues.push({
   code:'DIVERSITY_COLLAPSE',message:templateId+' level='+level+
   ' only '+unique+'/'+count+' scenarios; at least '+required+' expected'
  });
  if(ratio>contract.maxDominantRate)issues.push({
   code:'REPEAT_CONCENTRATION',message:templateId+' level='+level+
   ' dominant share '+ratio.toFixed(3)+' exceeds '+contract.maxDominantRate
  });
 }else if(unique===1&&count>=40){
  warnings.push({code:'LOW_DIVERSITY',message:templateId+' level='+level+' identical output for '+count+' seeds; inspect whether intended'});
 }
 const metrics={};
 for(const [key,vals] of numeric){
  const ordered=vals.map(v=>v.value).sort((a,b)=>a-b);
  const q1=percentile(ordered,.25),median=percentile(ordered,.5),q3=percentile(ordered,.75);
  const iqr=q3-q1;
  const bounds=iqr>0?{lower:q1-3*iqr,upper:q3+3*iqr}:null;
  const extremes=bounds?vals.filter(x=>x.value<bounds.lower||x.value>bounds.upper):[];
  metrics[key]={
   n:vals.length,min:ordered[0],p05:percentile(ordered,.05),
   median,p95:percentile(ordered,.95),max:ordered.at(-1),
   q1,q3,outlierCount:extremes.length,
   outlierExamples:extremes.slice(0,4).map(({seed,value})=>({seed,value}))
  };
  // A statistical outlier is a prompt for review, not automatically an error.
  if(extremes.length>=Math.max(3,Math.ceil(vals.length*.02))){
   warnings.push({code:'DISTRIBUTION_OUTLIERS',message:templateId+' level='+level+
     ' key='+key+' '+extremes.length+'/'+vals.length+' beyond 3×IQR'});
  }
 }
 const mostCommon=[...groups.values()].sort((a,b)=>b.count-a.count).slice(0,3);
 return {
  templateId,level,samples:count,unique,uniqueRate:unique/count,
  dominantRate:ratio,mostCommon,metrics,errors:issues,warnings
 };
}

export function runAudit({samples=96,catalog=TEMPLATE_CATALOG}={}){
 if(!Number.isInteger(samples)||samples<40||samples>2000)throw Error('samples must be between 40 and 2000');
 const rows=[],errors=[],warnings=[];
 for(const t of catalog){
  for(const level of new Set([Math.max(t.min??1,1),4])){
   const generated=[];
   for(let seed=1;seed<=samples;seed++){
    const ex=generateExercise({templateId:t.id,topic:t.topic,level,seed});
    generated.push({seed,exercise:ex});
    // Apply mathematically certain domain checks at the same large sample
    // without confusing those checks with outlier-based warnings.
    const plausibility=validatePlausibility(ex);
    errors.push(...plausibility.errors.map(x=>({...x,message:'seed='+seed+' level='+level+' '+x.message})));
    if(seed<=4)warnings.push(...plausibility.warnings.map(x=>({...x,message:'seed='+seed+' level='+level+' '+x.message})));
   }
   const row=analyzeDistribution(generated,{templateId:t.id,level});
   rows.push(row);
   errors.push(...row.errors);
   warnings.push(...row.warnings);
  }
 }
 return {
  sampledTemplates:catalog.length,sampledLevels:rows.length,
  checkedExercises:rows.reduce((sum,row)=>sum+row.samples,0),
  contracts:Object.keys(DIVERSITY_CONTRACTS),rows,errors,warnings
 };
}

function execute(){
 const arg=process.argv.find(v=>v.startsWith('--samples='));
 const count=arg?Number(arg.split('=')[1]):96;
 const out=runAudit({samples:count});
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/generator-distributions.json',JSON.stringify({
  date:new Date().toISOString(),samplesPerLevel:count,...out
 },null,2)+'\n');
 const md=[
  '# Проверка распределений генераторов',
  '',
  'Количество запусков: '+out.checkedExercises+', шаблонов: '+out.sampledTemplates+
    ', уровней: '+out.sampledLevels+', seed на уровень: '+count+'.',
  '',
  'Блокирующие контракты разнообразия заданы для: '+out.contracts.join(', ')+'.',
  'Выбросы определяются правилом 3×IQR; сами по себе они не являются финансовой ошибкой.',
  'Финансовые тождества и некорректная арифметика проверяются отдельными модулями.',
  '',
  '| Шаблон | Уровень | Сценариев | Уникальных | Частота наиболее частого | Предупреждения |',
  '| --- | ---: | ---: | ---: | ---: | ---: |',
  ...out.rows.map(x=>'| '+x.templateId+' | '+x.level+' | '+x.samples+
    ' | '+x.unique+' | '+(x.dominantRate*100).toFixed(1)+'% | '+x.warnings.length+' |'),
  '',
  'Ошибок: '+out.errors.length+'; предупреждений: '+out.warnings.length+'.',
  ...out.errors.map(e=>'- ERROR ['+e.code+'] '+e.message),
  ...out.warnings.slice(0,75).map(e=>'- WARNING ['+e.code+'] '+e.message)
 ].join('\n');
 writeFileSync('artifacts/generator-distributions.md',md+'\n');
 console.log('Distribution audit: '+out.checkedExercises+' generated examples; '+out.sampledTemplates+
   ' templates; '+out.errors.length+' errors; '+out.warnings.length+' review flags');
 for(const e of out.errors.slice(0,25))console.error('ERROR ['+e.code+'] '+e.message);
 if(out.errors.length)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)execute();
