/** Independently derive answers for four nonstandard, explicitly hypothetical tax exercises.
 * Do not use cached audit totals, schedules or student-visible answers.
 */
export const TAX_ADVANCED_ORACLE_TEMPLATES=Object.freeze([
 'tax-depreciation-method-comparison','tax-temporary-differences',
 'tax-payments-schedule','tax-loss-carryforward'
]);
const ids=new Set(TAX_ADVANCED_ORACLE_TEMPLATES);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const valid=(v,...keys)=>keys.every(k=>finite(v[k]));
const values=(v,key,n)=>Array.isArray(v[key])&&v[key].length===n&&v[key].every(finite);
const add=xs=>xs.reduce((s,x)=>s+x,0);
const fmt=n=>Number(n.toFixed(2)).toLocaleString('ru-RU',{maximumFractionDigits:2});
const pct=n=>fmt(n*100)+'%';
const error=(code,message)=>({code,message});
function reference(id,a,level){
 switch(id){
  case 'tax-depreciation-method-comparison':{
   if(!valid(a,'cost','life','tax','rate')||!Number.isInteger(a.life)||a.life<2||a.life>30||
    a.cost<=0||a.rate<=0||a.tax<0||a.tax>=1)return null;
   const linear=a.cost/a.life,sy=a.cost*2/(a.life+1);
   let rem=a.cost,first=null,pvLinear=0,pvDeclining=0;
   for(let year=1;year<=a.life;year++){
    const yearsLeft=a.life-year+1;
    const dep=yearsLeft===1?rem:Math.max(rem*2/a.life,rem/yearsLeft);
    if(year===1)first=dep;
    rem-=dep;
    pvLinear+=linear*a.tax/(1+a.rate)**year;
    pvDeclining+=dep*a.tax/(1+a.rate)**year;
   }
   const answers={'linear-first':linear,'declining-first':first};
   if(level>=3)answers['syd-first']=sy;
   if(level>=4)Object.assign(answers,{'pv-linear':pvLinear,
    'pv-accelerated':pvDeclining,'pv-difference':pvDeclining-pvLinear});
   return {answers,story:[String(a.cost),'за '+a.life+' лет',pct(a.tax),pct(a.rate)]};
  }
  case 'tax-temporary-differences':{
   if(!valid(a,'cost','life','tax','bookProfit')||!Number.isInteger(a.life)||a.life<2||a.life>30||
    a.cost<=0||a.bookProfit<=0||a.tax<0||a.tax>=1)return null;
   const book=a.cost/a.life,taxDep=a.cost*2/(a.life+1);
   const taxable=a.bookProfit+book-taxDep,now=taxable*a.tax,deferred=(taxDep-book)*a.tax;
   const answers={'book-dep':book,'tax-dep':taxDep};
   if(level>=3)Object.assign(answers,{taxable,'current-tax':now});
   if(level>=4)Object.assign(answers,{dtl:deferred,'total-tax':now+deferred});
   return {answers,story:[String(a.cost),'срок '+a.life+' лет',fmt(a.bookProfit)+' млн ₽',pct(a.tax)]};
  }
  case 'tax-payments-schedule':{
   if(!valid(a,'tax')||!values(a,'quarterlyProfit',4)||a.tax<0||a.tax>=1||
    a.quarterlyProfit.some(x=>x<0))return null;
   const accrual=a.quarterlyProfit.map(x=>x*a.tax);
   const paid=[0,...accrual.slice(0,3)];
   const answers={'q1-accrued':accrual[0],'q2-paid':paid[1]};
   if(level>=3)Object.assign(answers,{'accrued-total':add(accrual),'cash-paid':add(paid)});
   if(level>=4)Object.assign(answers,{'end-payable':accrual[3],'q4-tax-cash':-paid[3]});
   return {answers,story:[pct(a.tax),...a.quarterlyProfit.map(x=>fmt(x)+' млн ₽')]};
  }
  case 'tax-loss-carryforward':{
   if(!valid(a,'tax','initialLoss','capFraction')||!values(a,'profits',3)||
    a.tax<0||a.tax>=1||a.initialLoss<=0||a.capFraction<=0||a.capFraction>1||
    a.profits.some(x=>x<=0))return null;
   let remaining=a.initialLoss;
   const deductions=a.profits.map(profit=>{
    const v=Math.min(remaining,profit*a.capFraction);
    remaining-=v;return v;
   });
   const taxable=a.profits.map((p,i)=>p-deductions[i]);
   const answers={'year1-used':deductions[0],'year1-tax':taxable[0]*a.tax,
     'used-total':add(deductions),'tax-total':add(taxable)*a.tax};
   if(level>=4)Object.assign(answers,{'loss-end':remaining,'tax-saved':add(deductions)*a.tax});
   return {answers,story:[String(a.initialLoss)+' млн ₽',pct(a.tax),pct(a.capFraction),
    ...a.profits.map(x=>String(x))]};
  }
  default:return null;
 }
}
export function validateTaxAdvancedOracle(ex){
 const id=ex?.templateId;if(!ids.has(id))return [];
 const ref=ex.audit&&reference(id,ex.audit,ex.level);
 if(!ref)return [error('TAX_ADV_INPUTS',id+': primitive inputs invalid')];
 const issues=[],seen=new Set();
 for(const q of ex.questions??[]){
  if(seen.has(q.key)){issues.push(error('TAX_ADV_DUPLICATE',id+'/'+q.key));continue;}
  seen.add(q.key);
  const expected=ref.answers[q.key];
  if(expected===undefined){issues.push(error('TAX_ADV_UNMAPPED',id+'/'+q.key));continue;}
  if(q.type!=='number'||!finite(q.answer)||
    Math.abs(q.answer-expected)>Math.max(.00003,Math.abs(expected)*1e-8))
   issues.push(error('TAX_ADV_MISMATCH',id+'/'+q.key));
 }
 for(const key of Object.keys(ref.answers))if(!seen.has(key))
  issues.push(error('TAX_ADV_OMITTED',id+'/'+key));
 for(const fragment of new Set(ref.story))if(!ex.story?.includes(fragment))
  issues.push(error('TAX_ADV_STORY',id+': source absent from question: '+fragment));
 return issues;
}
