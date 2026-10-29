/**
 * Independent answers for the 8 valuation and 6 ratio generator templates.
 *
 * Inputs are deliberately separate from question.answer and the explanation.
 * These formulas DO NOT import or call generator calculations. The story
 * evidence check verifies that the primitive values appear in the displayed
 * question, including formatting/rounding where necessary.
 */
export const BASIC_ORACLE_TEMPLATES=Object.freeze([
 'v-pv','v-fv','v-ytm','v-wacc','v-npv-irregular','v-tax-shield','v-pi','v-irr-zero',
 'r-current','r-margins','r-roe-roa','r-dso','r-cash-cycle','r-leverage'
]);
const known=new Set(BASIC_ORACLE_TEMPLATES);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const valid=(v,...keys)=>keys.every(k=>finite(v[k]));
const issue=(code,message)=>({code,message});
const fmt=(x,digits=2)=>Number(x.toFixed(digits)).toLocaleString('ru-RU',{maximumFractionDigits:digits});
const q=(answer,unit)=>({answer,unit,type:'number'});
const ch=answer=>({answer,type:'choice'});

function calculate(id,v){
 switch(id){
  case 'v-pv':
   if(!valid(v,'fv','years','rate')||v.years<=0||v.rate<=-100)return null;
   return {pv:q(v.fv/Math.pow(1+v.rate/100,v.years),'млн ₽')};
  case 'v-fv':
   if(!valid(v,'pv','years','rate')||v.years<=0||v.rate<=-100)return null;
   return {fv:q(v.pv*Math.pow(1+v.rate/100,v.years),'млн ₽')};
  case 'v-ytm':
   if(!valid(v,'face','years','price')||v.face<=0||v.price<=0||v.years<=0)return null;
   return {ytm:q(100*(Math.pow(v.face/v.price,1/v.years)-1),'% годовых')};
  case 'v-wacc':{
   if(!valid(v,'debtSharePct','kePct','kdPct','taxPct')||
     v.debtSharePct<0||v.debtSharePct>100||v.taxPct<0||v.taxPct>100)return null;
   const debtWeight=v.debtSharePct/100, tax=v.taxPct/100;
   return {wacc:q((1-debtWeight)*v.kePct+debtWeight*v.kdPct*(1-tax),'% годовых')};
  }
  case 'v-npv-irregular':{
   if(!valid(v,'initial','rate')||!Array.isArray(v.cash)||v.cash.length!==3||
     !v.cash.every(finite)||v.initial<=0||v.rate<=-100)return null;
   const npv=v.cash.reduce((sum,amount,index)=>
     sum+amount/Math.pow(1+v.rate/100,index+1),-v.initial);
   return {npv:q(npv,'млн ₽'),accept:ch(npv>0?'Да':'Нет')};
  }
  case 'v-tax-shield':
   if(!valid(v,'cost','years','taxRate')||v.years<=0||v.cost<=0||
     v.taxRate<0||v.taxRate>1)return null;
   return {dep:q(v.cost/v.years,'млн ₽'),
     shield:q((v.cost/v.years)*v.taxRate,'млн ₽')};
  case 'v-pi':
   if(!valid(v,'initial','pv')||v.initial<=0)return null;
   return {pi:q(v.pv/v.initial,'раз'),npv:q(v.pv-v.initial,'млн ₽')};
  case 'v-irr-zero':
   if(!valid(v,'initial','years','terminal')||v.initial<=0||
     v.terminal<=0||v.years<=0)return null;
   return {irr:q(100*(Math.pow(v.terminal/v.initial,1/v.years)-1),'% годовых')};
  case 'r-current':
   if(!valid(v,'ca','cl','inv')||v.cl<=0)return null;
   return {
     current:q(v.ca/v.cl,'раз'),
     quick:q((v.ca-v.inv)/v.cl,'раз'),
     nwc:q(v.ca-v.cl,'млн ₽')
   };
  case 'r-margins':{
   if(!valid(v,'sales','cogs','oper','interest','tax')||v.sales<=0)return null;
   const gross=v.sales-v.cogs,ebit=gross-v.oper,net=ebit-v.interest-v.tax;
   return {
     gross:q(100*gross/v.sales,'%'),
     oper:q(100*ebit/v.sales,'%'),
     net:q(100*net/v.sales,'%')
   };
  }
  case 'r-roe-roa':
   if(!valid(v,'net','assets','equity')||v.assets<=0||v.equity<=0)return null;
   return {roa:q(100*v.net/v.assets,'%'),roe:q(100*v.net/v.equity,'%')};
  case 'r-dso':
   if(!valid(v,'sales','days','ar','yearDays')||v.sales<=0||v.ar<=0||v.yearDays<=0)return null;
   return {dso:q(v.ar/v.sales*v.yearDays,'дней'),turnover:q(v.sales/v.ar,'раз/год')};
  case 'r-cash-cycle':
   if(!valid(v,'dio','dso','dpo'))return null;
   return {ccc:q(v.dio+v.dso-v.dpo,'дней'),effect:ch('Да')};
  case 'r-leverage':
   if(!valid(v,'debt','equity')||v.equity<=0||v.debt+v.equity<=0)return null;
   return {de:q(v.debt/v.equity,'раз'),debtshare:q(100*v.debt/(v.debt+v.equity),'%')};
  default:return null;
 }
}

/** Expected fragments tie independently supplied inputs to the visible task. */
function inputEvidence(id,v){
 switch(id){
  case 'v-pv':return [fmt(v.fv)+' млн ₽',v.years+' года',v.rate+'% годовых'];
  case 'v-fv':return [fmt(v.pv)+' млн ₽',v.years+' года',v.rate+'% годовых'];
  case 'v-ytm':return [fmt(v.face,0)+' ₽',fmt(v.price,0)+' ₽',v.years+' года'];
  case 'v-wacc':return ['Доля заёмного капитала '+v.debtSharePct+'%',
    'Rd = '+v.kdPct+'%', 'Re = '+v.kePct+'%', 'Ставка налога на прибыль '+v.taxPct+'%'];
  case 'v-npv-irregular':return [fmt(v.initial)+' млн ₽',
    'первый '+fmt(v.cash[0]),'второй '+fmt(v.cash[1]),'третий '+fmt(v.cash[2]),
    v.rate+'% годовых'];
  case 'v-tax-shield':return [fmt(v.cost)+' млн ₽',
    'амортизация '+v.years+' лет','Ставка налога на прибыль '+fmt(v.taxRate*100,0)+'%'];
  case 'v-pi':return [fmt(v.pv)+' млн ₽','вложения '+fmt(v.initial)+' млн ₽'];
  case 'v-irr-zero':return [fmt(v.initial)+' млн ₽',fmt(v.terminal)+' млн ₽',
    v.years+' года'];
  case 'r-current':return ['активы = '+v.ca+' млн ₽',
    'обязательства = '+v.cl+' млн ₽','запасы = '+v.inv+' млн ₽'];
  case 'r-margins':return ['Выручка '+v.sales+' млн ₽',
    'себестоимость '+v.cogs,'расходы '+v.oper,
    'проценты '+v.interest,'налог '+v.tax];
  case 'r-roe-roa':return ['прибыль '+v.net+' млн ₽',
    'активы = '+v.assets+' млн ₽','капитал = '+v.equity+' млн ₽'];
  case 'r-dso':return ['Выручка за год '+v.sales+' млн ₽',
    'задолженность '+fmt(v.ar)+' млн ₽',
    '360 дням'];
  case 'r-cash-cycle':return [v.dio+' дней (DIO)',
    v.dso+' дней (DSO)',v.dpo+' дней (DPO)'];
  case 'r-leverage':return ['долг '+v.debt+' млн ₽','капитал '+v.equity+' млн ₽'];
  default:return [];
 }
}
export function validateBasicOracle(ex){
 const id=ex?.templateId;
 if(!known.has(id))return [];
 const v=ex?.inputs;
 if(!v||typeof v!=='object'||Array.isArray(v))return [issue('BASIC_ORACLE_INPUTS',id+' has no primitive inputs')];
 const expected=calculate(id,v);
 if(!expected)return [issue('BASIC_ORACLE_INPUTS',id+' inputs missing or invalid')];
 const errors=[];
 for(const text of inputEvidence(id,v)){
  if(!ex.story?.includes(text))
   errors.push(issue('BASIC_ORACLE_STORY',id+' story does not match input: '+text));
 }
 const actual=ex.questions??[];
 const seen=new Set();
 for(const answer of actual){
  const key=answer.key;
  if(seen.has(key))errors.push(issue('BASIC_ORACLE_DUPLICATE',id+'/'+key));
  seen.add(key);
  if(!Object.hasOwn(expected,key)){
   errors.push(issue('BASIC_ORACLE_UNMAPPED',id+'/'+key+' is not independently checked'));
   continue;
  }
  const ref=expected[key];
  if(answer.type!==ref.type||ref.unit!==undefined&&answer.unit!==ref.unit)
   errors.push(issue('BASIC_ORACLE_SHAPE',id+'/'+key+' incorrect question type or unit'));
  if(ref.type==='number'){
   const tolerance=Math.max(.000015,Math.abs(ref.answer)*1e-9);
   if(!finite(answer.answer)||!finite(ref.answer)||Math.abs(answer.answer-ref.answer)>tolerance)
    errors.push(issue('BASIC_ORACLE_MISMATCH',id+'/'+key+' answer '+answer.answer+' expected '+ref.answer));
  }else if(answer.answer!==ref.answer)errors.push(issue('BASIC_ORACLE_MISMATCH',id+'/'+key+' choice mismatch'));
 }
 for(const key of Object.keys(expected)){
  if(!seen.has(key))errors.push(issue('BASIC_ORACLE_MISSING',id+'/'+key+' disappeared from questions'));
 }
 return errors;
}
