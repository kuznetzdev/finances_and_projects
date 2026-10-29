/** Read-only release gate: static integrity, reproducible exercises and finance identities. */
import {readdirSync,readFileSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {TEMPLATE_CATALOG,generateExercise,checkAnswer} from '../../site/engine/index.js';
import {ORACLE_TEMPLATES,validateFinanceOracle} from './finance-oracles.js';
import {validatePlausibility} from './financial-plausibility.js';
import {CONTROL_WORK_REFERENCES,validateControlWorkReferences} from './control-work-oracles.js';
import {CASE_BANK,CASE_CHECKPOINTS,verifyCheckpoint} from '../../site/engine/casebook.js';
import {CONCEPTS} from '../../site/data/knowledge.js';
import {glossaryIntegrity} from '../../site/data/glossary-engine.js';
import {formulaMarkup} from '../../site/features/math-ui.js';
const ROOT=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const issue=(code,message)=>({code,message});
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const close=(a,b)=>finite(a)&&finite(b)&&Math.abs(a-b)<=Math.max(.00015,1e-8*Math.abs(b));
const sum=a=>a.reduce((s,v)=>s+v,0);
const pv=(a,r,offset=1)=>sum(a.map((v,i)=>v/(1+r)**(i+offset)));
const has=(a,v)=>a.some(x=>x===v);

export function validateCatalog(catalog){
 const errors=[],seen=new Set();
 for(const x of catalog){
  if(!x?.id||!x.topic)errors.push(issue('INVALID_TEMPLATE','Отсутствует id/topic в шаблоне'));
  else if(seen.has(x.id))errors.push(issue('DUPLICATE_TEMPLATE','Дублируется шаблон '+x.id));
  seen.add(x?.id);
 }
 return errors;
}
export function validateExercise(ex){
 const errors=[];
 if(!ex||typeof ex!=='object')return [issue('BAD_EXERCISE','Генератор вернул не объект')];
 const id=ex.templateId??ex.id??'<unknown>';
 if(typeof ex.story!=='string'||!ex.story.trim())errors.push(issue('EMPTY_STORY',id+' не содержит условие'));
 if(typeof ex.title!=='string'||!ex.title.trim())errors.push(issue('EMPTY_TITLE',id+' не содержит заголовок'));
 if(!Array.isArray(ex.questions)||!ex.questions.length)return [...errors,issue('EMPTY_QUESTIONS',id+' без вопросов')];
 const keys=new Set();
 for(const q of ex.questions){
  if(!q?.key||keys.has(q.key))errors.push(issue('DUPLICATE_KEY',id+' повторный/пустой ключ '+q?.key));
  keys.add(q?.key);
  if(typeof q?.label!=='string'||!q.label.trim())errors.push(issue('EMPTY_LABEL',id+'/'+q?.key+' пустой вопрос'));
  if(q?.type==='number'){
   if(!finite(q.answer))errors.push(issue('ANSWER_NONFINITE',id+'/'+q.key+' ответ не является конечным числом'));
   if(!finite(q.tolerance)||q.tolerance<0||q.tolerance>1e6)errors.push(issue('BAD_TOLERANCE',id+'/'+q.key+' недопустимая погрешность'));
   if(finite(q.answer)&&Math.abs(q.answer)>1e12)errors.push(issue('ANSWER_MAGNITUDE',id+'/'+q.key+' чрезмерное число: проверить единицы'));
  } else if(q?.type==='choice'){
   if(!Array.isArray(q.choices)||new Set(q.choices).size!==q.choices.length||!q.choices.includes(q.answer))
    errors.push(issue('CHOICE_INVALID',id+'/'+q.key+' неверный набор вариантов'));
  } else if(q?.type==='multi'){
   if(!Array.isArray(q.choices)||!Array.isArray(q.answer)||new Set(q.choices).size!==q.choices.length||
     !q.answer.length||new Set(q.answer).size!==q.answer.length||!q.answer.every(x=>q.choices.includes(x)))
    errors.push(issue('MULTI_INVALID',id+'/'+q.key+' некорректный множественный ответ'));
  } else errors.push(issue('QUESTION_TYPE',id+'/'+q?.key+' неизвестный тип'));
 }
 return errors;
}
export function validateDcfAudit(ex){
 if(!ex?.templateId?.startsWith('dcf-'))return [];
 const v=ex.audit,id=ex.templateId,errors=[];
 if(!v||typeof v!=='object')return [issue('DCF_AUDIT',id+': отсутствуют проверяемые параметры')];
 const ensure=(yes,text)=>{if(!yes)errors.push(issue('DCF_IDENTITY',id+': '+text));};
 if(!finite(v.wacc)||!finite(v.g)||v.wacc<=0||v.wacc>=.5||v.g<0||v.g>=v.wacc)
  errors.push(issue('DCF_GROWTH',id+': некорректные WACC или g'));
 switch(id){
  case 'dcf-fcff-ebitda-tax':
   ensure(v.ebitda>v.da&&v.capex>=0&&v.nwc>=0&&v.fcff>0,'положительный EBIT/FCFF, CAPEX и оборотный капитал');
   ensure(close(v.ebit,v.ebitda-v.da)&&close(v.fcff,v.ebit*(1-v.tax)+v.da-v.capex-v.nwc),'EBIT/FCFF');
   break;
  case 'dcf-fcfe-equity':
   ensure(v.fcfe>0&&v.equity>0&&v.ke>0&&v.ke<.5,'положительная Equity/FCFE/Ke');
   ensure(v.debt>0&&v.kd>0&&close(v.netBorrowing,0)&&close(v.interest,v.debt*v.kd),'постоянный бессрочный долг, нулевое чистое привлечение и согласованные проценты');
   ensure(close(v.fcfe,v.fcff-v.interest*(1-v.tax)+v.netBorrowing)&&close(v.equity,v.fcfe/v.ke),'FCFE/Equity');
   ensure(close(v.ev,v.equity+v.debt)&&close(v.wacc,(v.equity*v.ke+v.debt*v.kd*(1-v.tax))/v.ev)&&close(v.ev,v.fcff/v.wacc),'EV и согласованный рыночный WACC');
   break;
  case 'dcf-two-stage':
   ensure(v.fcffs?.length===v.years&&v.fcffs.every(x=>finite(x)&&x>0),'потоки прогноза');
   if(v.fcffs?.length===v.years)ensure(close(v.tv,v.fcffs.at(-1)*(1+v.g)/(v.wacc-v.g))&&close(v.ev,pv(v.fcffs,v.wacc)+v.tv/(1+v.wacc)**v.years),'Gordon/EV');
   break;
  case 'dcf-terminal-exit':
   ensure(v.exitEbitda>0&&v.multiple>=2&&v.multiple<=20&&v.tv>0,'мультипликатор и EBITDA');
   ensure(close(v.tv,v.exitEbitda*v.multiple)&&close(v.ev,v.pvExplicit+v.tv/(1+v.wacc)**v.years),'терминал/EV');
   break;
  case 'dcf-midyear':
   ensure(Array.isArray(v.flows)&&v.flows.every(x=>x>0)&&close(v.midPv,pv(v.flows,v.wacc,.5))&&close(v.endPv,pv(v.flows,v.wacc))&&v.midPv>v.endPv,'конвенция середины года');
   break;
  case 'dcf-sensitivity':
   ensure(close(v.base,v.fcff*(1+v.g)/(v.wacc-v.g))&&v.upperWaccValue<v.base&&v.upperGrowthValue>v.base,'монотонность/базовая оценка');
   break;
  case 'dcf-income-capitalization':
   ensure(v.capRate>0&&close(v.capRate,v.wacc-v.g)&&close(v.value,v.income/v.capRate),'ставка капитализации');
   break;
 }
 return errors;
}
/** Domain invariants are intentionally explicit: negative NPV or CFO is not globally invalid. */
export function validateBusinessAudit(ex){
 const id=ex?.templateId??'',v=ex?.audit;
 if(!id.startsWith('capital-')&&!id.startsWith('tax-'))return [];
 if(!v||typeof v!=='object')return [issue('FINANCE_IDENTITY',id+' audit missing')];
 const errors=[];
 const verify=(condition,message)=>{if(!condition)errors.push(issue('FINANCE_IDENTITY',id+': '+message));};
 switch(id){
  case 'capital-financing-match':
   verify(close(v.lta+v.permanentWC+v.seasonalWC,v.totalAssets)&&close(v.longTerm+v.shortTerm,v.totalAssets),'sources ≠ assets');break;
  case 'capital-roa-debt-roe':
   verify(v.roes?.length===v.debtShares?.length&&v.debtShares.every((d,i)=>d>=0&&d<1&&close(v.roes[i],(v.roa*v.assets-v.kd*v.assets*d)*(1-v.tax)/(v.assets*(1-d))*100)),'ROE from operating profit');break;
  case 'capital-wacc-dynamic':
   verify(v.shares?.length===v.re?.length&&v.re.length===v.rd?.length&&v.rd.length===v.wacc?.length&&v.shares.every((d,i)=>d>=0&&d<=1&&close(v.wacc[i],((1-d)*v.re[i]+d*v.rd[i]*(1-v.tax))*100)),'WACC weights and tax');break;
  case 'capital-mm-tax':
   verify(close(v.unlevered,v.ebit*(1-v.tax)/v.ku)&&close(v.taxShield,v.debt*v.tax)&&close(v.levered,v.unlevered+v.taxShield),'MM with tax');break;
  case 'capital-tradeoff':
   verify(v.debts?.length===v.distressCosts?.length&&v.debts.length===v.values?.length&&v.debts.every((d,i)=>close(v.values[i],v.unlevered+v.tax*d-v.distressCosts[i])),'cost of distress');break;
  case 'capital-pecking-order':
   verify(close(v.internal+v.debt+v.equityIssue,v.need)&&v.internal<=v.cash&&v.debt<=v.debtCapacity&&v.equityIssue>=0,'financing identity');break;
  case 'capital-waterfall':{
   let remain=v.proceeds,ok=Array.isArray(v.claims)&&v.claims.length===v.paid?.length&&v.proceeds>=0;
   if(ok)for(let i=0;i<v.claims.length;i++){let amount=Math.min(v.claims[i],remain);ok=ok&&close(v.paid[i],amount);remain-=amount;}
   verify(ok&&close(remain,v.common)&&close(sum(v.paid)+v.common,v.proceeds),'capital waterfall payouts');break;
  }
  case 'tax-depreciation-method-comparison':
   verify(['linear','declining','sumYears'].every(k=>Array.isArray(v[k])&&v[k].length===v.life&&v[k].every(d=>d>=0)&&close(sum(v[k]),v.cost)),'depreciation schedules');break;
  case 'tax-temporary-differences':
   verify(close(v.taxable,v.bookProfit+v.bookDep-v.taxDep)&&close(v.currentTax,v.taxable*v.tax)&&close(v.dtl,(v.taxDep-v.bookDep)*v.tax),'tax bridge');break;
  case 'tax-payments-schedule':
   verify(v.accrued?.length===4&&v.paid?.length===4&&close(sum(v.accrued)-sum(v.paid),v.endPayable)&&v.paid.every((p,i)=>close(p,i?v.accrued[i-1]:0)),'tax calendar');break;
  case 'tax-loss-carryforward':
   verify(v.taxable?.length===3&&v.profits?.length===3&&v.used?.length===3&&
    v.used.every((a,i)=>a>=0&&close(a+v.taxable[i],v.profits[i]))&&
    close(v.totalTax,sum(v.taxable)*v.tax)&&close(v.initialLoss-sum(v.used),v.endLoss),'loss carryforward');break;
 }
 return errors;
}

function walk(folder){
 if(!existsSync(folder))return [];
 return readdirSync(folder,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(folder,x.name)):[path.join(folder,x.name)]);
}
function validateAssets(){
 const errors=[],site=path.join(ROOT,'site');
 const files=walk(site);
 for(const file of files){
  if(!/\.(html|css)$/.test(file))continue;
  const source=readFileSync(file,'utf8');
  const regex=/(?:src|href)=["']([^"'<>]+)["']/g;
  for(const match of source.matchAll(regex)){
   const ref=match[1].split(/[?#]/)[0];
   if(!ref||ref.startsWith('#')||/^(https?:|data:|mailto:|javascript:)/i.test(ref)||ref.includes('\${'))continue;
   if(ref.startsWith('//'))continue;
   const dest=ref.startsWith('/')?path.join(site,ref):path.resolve(path.dirname(file),ref);
   if(!existsSync(dest))errors.push(issue('MISSING_ASSET',path.relative(ROOT,file)+' -> '+ref));
  }
 }
 return {errors,checkedFiles:files.length};
}
export function preflight({seeds=24}={}){
 const errors=validateCatalog(TEMPLATE_CATALOG),warnings=[];
 const output={errors,warnings,checkedTemplates:TEMPLATE_CATALOG.length,checkedExercises:0,checkedOracleAnswers:0,checkedOracleTemplates:ORACLE_TEMPLATES.length,checkedPlausibilityExercises:0,checkedControlWorkAnswers:0,checkedCases:0,checkedConcepts:0,checkedFormulas:0,checkedFiles:0};
 const maxSeed=Number(seeds);
 if(!Number.isInteger(maxSeed)||maxSeed<1||maxSeed>500)throw Error('seeds must be 1..500');
 for(const t of TEMPLATE_CATALOG){
  for(let seed=1;seed<=maxSeed;seed++){
   // Run at maximal difficulty and also at earliest eligible level so both question sets are covered.
   for(const level of new Set([Math.max(t.min??1,1),4])){
    const args={templateId:t.id,topic:t.topic,level,seed};
    try{
     const ex=generateExercise(args);
     output.checkedExercises++;
     const plausibility=validatePlausibility(ex);
     output.checkedPlausibilityExercises++;
     const issues=[...validateExercise(ex),...validateDcfAudit(ex),...validateBusinessAudit(ex),...validateFinanceOracle(ex),...plausibility.errors];
     if(ORACLE_TEMPLATES.includes(t.id))output.checkedOracleAnswers+=ex.questions.filter(q=>q.type==='number').length;
     if(seed===1){
      const repeated=generateExercise(args);
      if(JSON.stringify(ex)!==JSON.stringify(repeated))errors.push(issue('NON_DETERMINISTIC',t.id+' does not reproduce seed=1'));
     }
     errors.push(...issues.map(x=>issue(x.code,t.id+' seed='+seed+' level='+level+': '+x.message)));
     for(const q of ex.questions||[]){
      if(q.type==='number'&&finite(q.answer)&&!checkAnswer(q,String(q.answer).replace('.',',')))
       errors.push(issue('GRADING',t.id+' seed='+seed+' '+q.key+' правильный ответ отвергнут'));
      if(q.type==='number'&&typeof q.unit==='string'&&q.unit.includes('%')&&Math.abs(q.answer)>1000)
       warnings.push(issue('SUSPICIOUS_PERCENT',t.id+' seed='+seed+' '+q.key+' = '+q.answer+'%'));
     }
     if(typeof ex.story==='string'&&ex.story.length<65)warnings.push(issue('SHORT_STORY',t.id+' seed='+seed+' подозрительно короткое условие'));
     if(typeof ex.hint==='string'&&ex.hint.length<35)warnings.push(issue('SHORT_HINT',t.id+' seed='+seed+' мало объяснений'));
    }catch(e){errors.push(issue('GENERATE_FAILED',t.id+' seed='+seed+' level='+level+': '+e.message));}
   }
  }
 }
 output.checkedCases=CASE_BANK.length;
 output.checkedControlWorkAnswers=Object.values(CONTROL_WORK_REFERENCES).reduce((total,steps)=>total+Object.keys(steps).length,0);
 errors.push(...validateControlWorkReferences(CASE_BANK,CASE_CHECKPOINTS));
 const ids=new Set();
 for(const c of CASE_BANK){
  if(!c.id||ids.has(c.id))errors.push(issue('CASE_ID','пустой или повторный id '+c.id));
  ids.add(c.id);
  if(!c.conditionHtml||!c.solutionHtml||!c.steps?.length||!c.source)errors.push(issue('CASE_INCOMPLETE',c.id+' неполный разобранный кейс'));
  for(const q of CASE_CHECKPOINTS[c.id]??[]){
   if(!finite(q.answer)||!finite(q.tolerance)||!verifyCheckpoint(q,String(q.answer)))
    errors.push(issue('CHECKPOINT',c.id+' некорректный числовой ответ'));
  }
 }
 output.checkedConcepts=CONCEPTS.length;
 for(const issueText of glossaryIntegrity(CONCEPTS))errors.push(issue('GLOSSARY',String(issueText)));
 for(const term of CONCEPTS){
  for(const f of term.formulas||[]){
   output.checkedFormulas++;
   if(!f.expression?.trim()||!f.explanation?.trim())errors.push(issue('FORMULA_INCOMPLETE',term.id+' пустая формула/пояснение'));
   else{
    const html=formulaMarkup(f.expression,esc);
    if(!html.includes('role="math"')||!html.includes('aria-label=')||html.includes('<script'))
     errors.push(issue('FORMULA_MARKUP',term.id+' формула не проходит безопасный рендеринг'));
   }
  }
 }
 const assets=validateAssets();
 errors.push(...assets.errors);output.checkedFiles=assets.checkedFiles;
 // Group repetitive seed warnings by template and code so the report stays actionable.
 const warningGroups=new Map();
 for(const w of warnings){
  const match=w.message.match(/^([a-z0-9-]+) seed=/);
  const key=w.code+'|'+(match?.[1]??w.message);
  if(!warningGroups.has(key))warningGroups.set(key,{...w,occurrences:0});
  warningGroups.get(key).occurrences++;
 }
 output.warnings=[...warningGroups.values()].map(w=>({...w,message:w.message+' (появлений: '+w.occurrences+')'}));
 return output;
}
