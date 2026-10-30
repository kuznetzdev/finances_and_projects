/**
 * Independent full-answer oracle for capital-structure scenarios.
 * Only consumes raw financing primitives; ignores generator's cached results.
 * Refuses omitted/unexpected questions and mismatches in source story figures.
 */
export const CAPITAL_ORACLE_TEMPLATES=Object.freeze([
 'capital-financing-match','capital-roa-debt-roe','capital-wacc-dynamic',
 'capital-mm-tax','capital-tradeoff','capital-pecking-order','capital-waterfall'
]);
const ids=new Set(CAPITAL_ORACLE_TEMPLATES);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const req=(v,...keys)=>keys.every(k=>finite(v[k]));
const arr=(v,key,n)=>Array.isArray(v[key])&&v[key].length===n&&v[key].every(finite);
const money=n=>Number(n.toFixed(2)).toLocaleString('ru-RU',{maximumFractionDigits:2})+' млн ₽';
const pct=n=>Number((n*100).toFixed(2)).toLocaleString('ru-RU',{maximumFractionDigits:2})+'%';
const err=(code,message)=>({code,message});
const sum=x=>x.reduce((a,b)=>a+b,0);
function reference(id,v,level){
 switch(id){
  case 'capital-financing-match':{
   if(!req(v,'lta','permanentWC','seasonalWC')||!['Консервативная','Умеренная','Агрессивная'].includes(v.model))return null;
   const total=v.lta+v.permanentWC+v.seasonalWC;
   const short=v.model==='Консервативная'?0:v.model==='Умеренная'?v.seasonalWC:v.seasonalWC+v.permanentWC/2;
   const answers={'total-assets':total,'long-term':total-short,'short-term':short};
   if(level>=3)answers.policy=v.model;
   if(level>=4)answers['permanent-short']=Math.max(0,short-v.seasonalWC);
   return {answers,story:[money(v.lta),money(v.permanentWC),money(v.seasonalWC)]};
  }
  case 'capital-roa-debt-roe':{
   if(!req(v,'assets','roa','kd','tax')||v.assets<=0||v.roa<=0||v.kd<=0||v.tax<0||v.tax>=1)return null;
   const calc=share=>(v.roa-v.kd*share)*(1-v.tax)/(1-share)*100;
   const answers={'operating-ebit':v.assets*v.roa,'roe-low':calc(.2),'roe-high':calc(.6)};
   if(level>=4)Object.assign(answers,{'roe-middle':calc(.4),'delta-roe':calc(.6)-calc(.2),
    effect:v.roa>v.kd?'Положительный':v.roa<v.kd?'Отрицательный':'Нулевой'});
   return {answers,story:[money(v.assets),pct(v.roa),pct(v.kd),pct(v.tax)]};
  }
  case 'capital-wacc-dynamic':{
   if(!req(v,'tax')||!arr(v,'shares',4)||!arr(v,'re',4)||!arr(v,'rd',4)||
     v.tax<0||v.tax>=1||v.shares.some(x=>x<0||x>1)||v.re.some(x=>x<=0)||v.rd.some(x=>x<=0))return null;
   const values=v.shares.map((d,i)=>100*((1-d)*v.re[i]+d*v.rd[i]*(1-v.tax)));
   const best=Math.min(...values),index=values.indexOf(best);
   return {answers:{'wacc-low':values[0],'wacc-middle':values[1],
     'wacc-high':values[2],'wacc-maximum':values[3],'wacc-min':best,
     'min-share':String(v.shares[index]*100)+'%'},
    story:[pct(v.tax),...v.re.map(pct),...v.rd.map(pct)]};
  }
  case 'capital-mm-tax':{
   if(!req(v,'ebit','ku','debt','tax')||v.ebit<=0||v.ku<=0||v.debt<=0||v.tax<0||v.tax>=1)return null;
   const u=v.ebit*(1-v.tax)/v.ku,shield=v.tax*v.debt,firm=u+shield;
   const answers={'no-tax-value':v.ebit/v.ku,unlevered:u,'tax-shield':shield,levered:firm};
   if(level>=4)answers['levered-equity']=firm-v.debt;
   return {answers,story:[money(v.ebit),money(v.debt),pct(v.ku),pct(v.tax)]};
  }
  case 'capital-tradeoff':{
   if(!req(v,'unlevered','tax','scale')||v.unlevered<=0||v.scale<0||v.tax<0||v.tax>=1)return null;
   const debts=[0,100,200,300];
   const values=debts.map(d=>v.unlevered+v.tax*d-v.scale*(d/300)**2);
   const best=Math.max(...values),bestDebt=debts[values.indexOf(best)];
   return {answers:{'tax-shield-max':v.tax*300,'distress-max':v.scale,
     'value-100':values[1],'value-200':values[2],'best-value':best,
     'best-debt':String(bestDebt)+' млн ₽'},
    story:[money(v.unlevered),money(v.scale),pct(v.tax)]};
  }
  case 'capital-pecking-order':{
   if(!req(v,'need','cash','debtCapacity')||v.need<=0||v.cash<0||v.debtCapacity<0)return null;
   const internal=Math.min(v.need,v.cash),debt=Math.min(v.need-internal,v.debtCapacity);
   const answers={internal,borrowed:debt,issue:v.need-internal-debt};
   if(level>=4)Object.assign(answers,{'debt-remaining':v.debtCapacity-debt,'first-source':'Накопленные внутренние средства'});
   else answers.total=v.need;
   return {answers,story:[money(v.need),money(v.cash),money(v.debtCapacity)]};
  }
  case 'capital-waterfall':{
   if(!req(v,'proceeds')||!arr(v,'claims',3)||v.proceeds<0||v.claims.some(x=>x<=0))return null;
   let rem=v.proceeds;
   const paid=v.claims.map(claim=>{const x=Math.min(claim,rem);rem-=x;return x;});
   const answers={senior:paid[0],mezzanine:paid[1],preferred:paid[2],common:rem};
   if(level>=4)Object.assign(answers,{'unpaid-senior':v.claims[0]-paid[0],
     'total-claims-unpaid':sum(v.claims)-sum(paid)});
   return {answers,story:[money(v.proceeds),...v.claims.map(money)]};
  }
  default:return null;
 }
}
export function validateCapitalOracle(ex){
 const id=ex?.templateId;if(!ids.has(id))return [];
 const ref=ex.audit&&reference(id,ex.audit,ex.level);
 if(!ref)return [err('CAPITAL_INPUTS',id+': invalid primitives')];
 const errors=[],seen=new Set();
 for(const q of ex.questions??[]){
  if(seen.has(q.key)){errors.push(err('CAPITAL_DUPLICATE',id+'/'+q.key));continue;}
  seen.add(q.key);
  const expected=ref.answers[q.key];
  if(expected===undefined){errors.push(err('CAPITAL_UNMAPPED',id+'/'+q.key));continue;}
  const mismatch=typeof expected==='string'?q.type!=='choice'||q.answer!==expected:
    q.type!=='number'||!finite(q.answer)||Math.abs(q.answer-expected)>Math.max(.00003,Math.abs(expected)*1e-8);
  if(mismatch)errors.push(err('CAPITAL_MISMATCH',id+'/'+q.key));
 }
 for(const key of Object.keys(ref.answers))if(!seen.has(key))
   errors.push(err('CAPITAL_OMITTED',id+'/'+key));
 for(const fragment of new Set(ref.story))if(!ex.story?.includes(fragment))
   errors.push(err('CAPITAL_STORY',id+': source absent from question: '+fragment));
 return errors;
}
