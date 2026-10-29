/**
 * Independent tax and operating-model reference calculations.
 * Every supported template exposes primitive inputs, not pre-calculated answers.
 * Reference computations intentionally do not import generator calculations,
 * progressiveTax, insuranceContributions, or student grading functions.
 */
import {policyFor} from '../../site/data/tax.js';

export const TAX_MODEL_ORACLE_TEMPLATES=Object.freeze([
 't-profit','t-vat-difference','t-vat-inclusive','t-ndfl','t-insurance',
 't-book-vs-tax','t-tax-payment','t-deferred-judgement',
 'm-bottomup','m-topdown','m-capacity','m-break-even',
 'm-working-capital','m-scenarios','m-funding-gap'
]);
const known=new Set(TAX_MODEL_ORACLE_TEMPLATES);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const valid=(v,...fields)=>fields.every(k=>finite(v[k]));
const fmt=(x,d=2)=>Number(x.toFixed(d)).toLocaleString('ru-RU',{maximumFractionDigits:d});
const numeric=(answer,unit='млн ₽')=>({type:'number',answer,unit});
const choice=answer=>({type:'choice',answer});
const issue=(code,message)=>({code,message});

function independentlyCalculate(id,v){
 switch(id){
  case 't-profit':{
   if(!valid(v,'base','profitRate')||v.base<0||v.profitRate<0||v.profitRate>1)return null;
   const levy=v.base*v.profitRate;
   return {tax:numeric(levy),net:numeric(v.base-levy)};
  }
  case 't-vat-difference':
   if(!valid(v,'sale','material','vatRate')||v.sale<0||v.material<0||v.vatRate<0||v.vatRate>1)return null;
   return {out:numeric(v.sale*v.vatRate),in:numeric(v.material*v.vatRate),
     pay:numeric((v.sale-v.material)*v.vatRate)};
  case 't-vat-inclusive':{
   if(!valid(v,'net','vatRate')||v.net<=0||v.vatRate<0||v.vatRate>1)return null;
   const gross=v.net*(1+v.vatRate);
   return {net:numeric(gross/(1+v.vatRate)),
     vat:numeric(gross*v.vatRate/(1+v.vatRate))};
  }
  case 't-ndfl':{
   if(!valid(v,'annual')||v.annual<0||!Array.isArray(v.salaryBands)||!v.salaryBands.length)return null;
   let prev=0,liability=0;
   for(const band of v.salaryBands){
    if(!finite(band.rate)||band.rate<0||band.rate>1||
       !(finite(band.limit)||band.limit===null))return null;
    const limit=band.limit===null?Infinity:band.limit;
    if(limit<=prev)return null;
    liability+=Math.max(0,Math.min(v.annual,limit)-prev)*band.rate;
    if(v.annual<=limit)break;
    prev=limit;
   }
   return {tax:numeric(liability/1e6),net:numeric((v.annual-liability)/1e6)};
  }
  case 't-insurance':{
   if(!valid(v,'salary','threshold','baseRate','overRate')||
      v.salary<0||v.threshold<=0||v.baseRate<0||v.overRate<0||
      v.baseRate>1||v.overRate>1)return null;
   const covered=Math.min(v.salary,v.threshold);
   const excess=Math.max(v.salary-v.threshold,0);
   return {insurance:numeric((covered*v.baseRate+excess*v.overRate)/1e6)};
  }
  case 't-book-vs-tax':
   if(!valid(v,'book','nondeductible','profitRate')||
      v.profitRate<0||v.profitRate>1)return null;
   return {base:numeric(v.book+v.nondeductible),
     tax:numeric((v.book+v.nondeductible)*v.profitRate)};
  case 't-tax-payment':
   if(!valid(v,'accrued','paid')||v.accrued<0||v.paid<0)return null;
   return {payable:numeric(v.accrued-v.paid),cfo:numeric(-v.paid)};
  case 't-deferred-judgement':
   if(!valid(v,'loss','profitRate')||v.loss<0||v.profitRate<0||v.profitRate>1)return null;
   return {recognize:choice('Нет'),potential:numeric(v.loss*v.profitRate)};
  case 'm-bottomup':{
   if(!valid(v,'visitors','conversionPct','ticket')||
      v.visitors<0||v.conversionPct<0||v.conversionPct>100||v.ticket<0)return null;
   const orders=v.visitors*(v.conversionPct/100);
   return {orders:numeric(orders,'шт.'),sales:numeric(orders*v.ticket/1e6)};
  }
  case 'm-topdown':
   if(!valid(v,'market','sharePct')||v.market<0||v.sharePct<0||v.sharePct>100)return null;
   return {sales:numeric(v.market*v.sharePct/100)};
  case 'm-capacity':{
   if(!valid(v,'staff','perDay','days','price')||
      [v.staff,v.perDay,v.days,v.price].some(x=>x<=0))return null;
   const volume=v.staff*v.perDay*v.days;
   return {volume:numeric(volume,'шт.'),sales:numeric(volume*v.price/1e6)};
  }
  case 'm-break-even':{
   if(!valid(v,'price','variable','fixed')||v.price<=v.variable||v.fixed<0)return null;
   const unitContribution=v.price-v.variable;
   return {units:numeric(Math.ceil(v.fixed/unitContribution),'шт.'),
     margin:numeric(unitContribution/1000,'тыс. ₽')};
  }
  case 'm-working-capital':{
   if(!valid(v,'dAR','dInv','dAP'))return null;
   const change=v.dAR+v.dInv-v.dAP;
   return {wc:numeric(change),cfo:numeric(-change)};
  }
  case 'm-scenarios':{
   if(!valid(v,'price','units','factor')||v.price<0||v.units<0||v.factor<0)return null;
   const base=v.price*v.units/1e6;
   const alternative=base*v.factor;
   return {base:numeric(base),scenario:numeric(alternative),delta:numeric(alternative-base)};
  }
  case 'm-funding-gap':
   if(!valid(v,'initial','burn','period','investment')||
      [v.initial,v.burn,v.period,v.investment].some(x=>x<0))return null;
   return {need:numeric(Math.max(0,v.burn*v.period+v.investment-v.initial))};
  default:return null;
 }
}

/** Fragments are generated independently from primitive inputs and compared
 * to the student's actual visible task, not the worked solution. */
function storyEvidence(id,v){
 switch(id){
  case 't-profit':return [fmt(v.base)+' млн ₽', 'ставка налога на прибыль '+v.profitRate*100+'%'];
  case 't-vat-difference':return [fmt(v.sale)+' млн ₽',fmt(v.material)+' млн ₽',
    'НДС '+v.vatRate*100+'%'];
  case 't-vat-inclusive':return [fmt(v.net*(1+v.vatRate))+' млн ₽',
    'НДС '+v.vatRate*100+'%'];
  case 't-ndfl':return [fmt(v.annual/1e6)+' млн ₽', 'пятиступенчатой базе зарплат'];
  case 't-insurance':return [fmt(v.salary/1e6)+' млн ₽',fmt(v.threshold/1e6,3)+' млн ₽',
    String(v.baseRate*100)+'%',String(v.overRate*100)+'%'];
  case 't-book-vs-tax':return [String(v.book)+' млн ₽',
    String(v.nondeductible)+' млн ₽','ставка '+v.profitRate*100+'%'];
  case 't-tax-payment':return [String(v.accrued)+' млн ₽',String(v.paid)+' млн ₽'];
  case 't-deferred-judgement':return [String(v.loss)+' млн ₽', 'Ставка налога на прибыль '+v.profitRate*100+'%'];
  case 'm-bottomup':return [fmt(v.visitors,0)+' уникальных',String(v.conversionPct)+'%',
    fmt(v.ticket,0)+' ₽'];
  case 'm-topdown':return [fmt(v.market)+' млн ₽',String(v.sharePct)+'% рынка'];
  case 'm-capacity':return [String(v.staff)+' специалист',
    String(v.perDay)+' клиентов в день',String(v.days)+' в месяц',fmt(v.price,0)+' ₽'];
  case 'm-break-even':return [fmt(v.price,0)+' ₽',fmt(v.variable,0)+' ₽',
    fmt(v.fixed/1e6)+' млн ₽'];
  case 'm-working-capital':return [String(v.dAR)+' млн ₽',String(v.dInv)+' млн ₽',
    String(v.dAP)+' млн ₽'];
  case 'm-scenarios':return [String(v.units)+' заказов',fmt(v.price,0)+' ₽',
    fmt((v.factor-1)*100,0)+'%'];
  case 'm-funding-gap':return [String(v.initial)+' млн ₽',String(v.period)+' мес.',
    String(v.burn)+' млн ₽',String(v.investment)+' млн ₽'];
  default:return [];
 }
}
function verifyPolicy(id,v,policyId){
 if(!id.startsWith('t-'))return [];
 let p;
 try{p=policyFor(policyId)}catch(e){return [issue('TAX_MODEL_POLICY',id+' unknown tax policy: '+policyId)];}
 const out=[];
 const eq=(a,b)=>a===b;
 const check=(field,actual,expected)=>{
  if(!eq(actual,expected))out.push(issue('TAX_MODEL_POLICY',id+
    ' '+field+' mismatch with selected policy '+policyId));
 };
 if(['t-profit','t-book-vs-tax','t-deferred-judgement'].includes(id))
  check('profitRate',v.profitRate,p.profitRate);
 if(['t-vat-difference','t-vat-inclusive'].includes(id))check('vatRate',v.vatRate,p.vatRate);
 if(id==='t-insurance'){
  for(const [key,field] of [['threshold','insuranceThreshold'],
    ['baseRate','insuranceBaseRate'],['overRate','insuranceOverRate']])
    check(key,v[key],p[field]);
 }
 if(id==='t-ndfl'){
  const actual=v.salaryBands??[],expected=p.salaryBands??[];
  if(actual.length!==expected.length||actual.some((b,i)=>{
   const original=expected[i];
   return !original||b.rate!==original.rate||
    b.limit!==(Number.isFinite(original.limit)?original.limit:null);
  }))out.push(issue('TAX_MODEL_POLICY',id+' progressive brackets differ from selected policy'));
 }
 return out;
}
export function validateTaxModelOracle(ex){
 const id=ex?.templateId;
 if(!known.has(id))return [];
 const v=ex.inputs;
 if(!v||typeof v!=='object'||Array.isArray(v))
  return [issue('TAX_MODEL_INPUTS',id+' missing primitive inputs')];
 const reference=independentlyCalculate(id,v);
 if(!reference)return [issue('TAX_MODEL_INPUTS',id+' incomplete or invalid primitive inputs')];
 const errors=verifyPolicy(id,v,ex.taxPolicy);
 for(const fragment of storyEvidence(id,v)){
  if(!ex.story?.includes(fragment))
   errors.push(issue('TAX_MODEL_STORY',id+' story does not match primitive input '+fragment));
 }
 const seen=new Set();
 for(const q of ex.questions??[]){
  if(seen.has(q.key))errors.push(issue('TAX_MODEL_DUPLICATE',id+'/'+q.key));
  seen.add(q.key);
  const expected=reference[q.key];
  if(!Object.hasOwn(reference,q.key)){
   errors.push(issue('TAX_MODEL_UNMAPPED',id+'/'+q.key+' has no independent formula'));
   continue;
  }
  if(q.type!==expected.type||expected.unit!==undefined&&q.unit!==expected.unit){
   errors.push(issue('TAX_MODEL_SHAPE',id+'/'+q.key+' invalid unit or answer type'));
  }
  if(expected.type==='number'){
   const allowed=Math.max(.000015,Math.abs(expected.answer)*1e-9);
   if(!finite(q.answer)||!finite(expected.answer)||Math.abs(q.answer-expected.answer)>allowed)
    errors.push(issue('TAX_MODEL_MISMATCH',id+'/'+q.key+' got '+q.answer+
      ', independently expected '+expected.answer));
  }else if(q.answer!==expected.answer)
   errors.push(issue('TAX_MODEL_MISMATCH',id+'/'+q.key+' incorrect choice'));
 }
 for(const key of Object.keys(reference)){
  if(!seen.has(key))errors.push(issue('TAX_MODEL_MISSING',id+'/'+key+' disappeared'));
 }
 return errors;
}
