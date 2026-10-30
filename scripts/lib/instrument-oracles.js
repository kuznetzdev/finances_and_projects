/**
 * Independent reference formulae for bond/option exercises. Reads only primitive audit
 * inputs, not generator's computed outputs. Fails closed when inputs are absent.
 * Does not prove story-to-audit consistency; exercised in additional story tests.
 */
export const INSTRUMENT_ORACLE_TEMPLATES=Object.freeze([
 'bond-coupon-duration','bond-coupon-ytm-exact','option-expiry-profit','option-protective-put'
]);
const ids=new Set(INSTRUMENT_ORACLE_TEMPLATES);
const isNumber=v=>typeof v==='number'&&Number.isFinite(v);
const required=(a,keys)=>keys.every(k=>isNumber(a[k]));
const problem=(code,message)=>({code,message});
function presentValue(face,couponPct,years,yieldPct){
 let sum=0;
 for(let year=1;year<=years;year++){
  const cash=face*couponPct/100+(year===years?face:0);
  sum+=cash/Math.pow(1+yieldPct/100,year);
 }
 return sum;
}
function independentYield(price,face,couponPct,years){
 let lower=-.99,upper=1;
 while(presentValue(face,couponPct,years,upper*100)>price)upper=upper*2+1;
 for(let step=0;step<110;step++){
  const mid=(lower+upper)/2;
  if(presentValue(face,couponPct,years,mid*100)>price)lower=mid;else upper=mid;
 }
 return (lower+upper)/2*100;
}
function expected(x){
 switch(x.kind){
 case 'coupon-duration':{
  if(!required(x,['face','couponPct','yieldPct','years','changePct'])||
   !Number.isInteger(x.years)||x.years<1||x.years>30||x.face<=0||x.couponPct<0||
   x.yieldPct<=-90||x.yieldPct>=100||x.changePct!==1)return null;
  const price=presentValue(x.face,x.couponPct,x.years,x.yieldPct);
  let moment=0;
  for(let year=1;year<=x.years;year++){
   const cf=x.face*x.couponPct/100+(year===x.years?x.face:0);
   moment+=year*cf/Math.pow(1+x.yieldPct/100,year);
  }
  const mac=moment/price,mod=mac/(1+x.yieldPct/100);
  const repriced=presentValue(x.face,x.couponPct,x.years,x.yieldPct+1);
  return {price,mac,mod,approx:-mod,exact:(repriced/price-1)*100};
 }
 case 'coupon-ytm':{
  if(!required(x,['face','couponPct','years','observedPrice'])||
    !Number.isInteger(x.years)||x.years<1||x.years>30||x.face<=0||
    x.couponPct<=0||x.couponPct>100||x.observedPrice<=0)return null;
  const coupon=x.face*x.couponPct/100;
  return {coupon,current:coupon/x.observedPrice*100,
   ytm:independentYield(x.observedPrice,x.face,x.couponPct,x.years),
   premium:x.observedPrice>x.face?'Да':'Нет'};
 }
 case 'option-expiry':{
  if(!required(x,['strike','premium','spot'])||
    !['call','put'].includes(x.optionKind)||
    x.strike<=0||x.premium<0||x.spot<0)return null;
  const pay=x.optionKind==='call'?Math.max(0,x.spot-x.strike):Math.max(0,x.strike-x.spot);
  return {payoff:pay,long:pay-x.premium,short:x.premium-pay,breakeven:x.optionKind==='call'?x.strike+x.premium:x.strike-x.premium};
 }
 case 'protective-put':{
  if(!required(x,['purchase','strike','premium','atExpiry'])||
    x.purchase<=0||x.strike<=0||x.strike>x.purchase||x.premium<0||x.atExpiry<0)return null;
  const put=Math.max(0,x.strike-x.atExpiry);
  return {payoff:put,portfolio:x.atExpiry-x.purchase+put-x.premium,
   floor:x.strike-x.purchase-x.premium,breakeven:x.purchase+x.premium};
 }
 default:return null;
 }
}
export function validateInstrumentOracle(ex){
 if(!ids.has(ex?.templateId))return [];
 const raw=ex?.audit?.instrument;
 const ref=raw&&expected(raw);
 if(!ref)return [problem('INSTRUMENT_INPUTS',ex.templateId+': missing/invalid primitive inputs')];
 const seen=new Set(),issues=[];
 for(const q of ex.questions??[]){
  if(seen.has(q.key)){issues.push(problem('INSTRUMENT_DUPLICATE',ex.templateId+'/'+q.key));continue;}
  seen.add(q.key);
  const v=ref[q.key];
  if(v===undefined){issues.push(problem('INSTRUMENT_UNMAPPED',ex.templateId+'/'+q.key));continue;}
  if(q.type==='number'){
   if(!isNumber(v)||!isNumber(q.answer)||Math.abs(v-q.answer)>Math.max(.00003,Math.abs(v)*1e-8))
     issues.push(problem('INSTRUMENT_MISMATCH',ex.templateId+'/'+q.key+' expected '+v+' got '+q.answer));
  }else if(q.type==='choice'){
   if(v!==q.answer)issues.push(problem('INSTRUMENT_MISMATCH',ex.templateId+'/'+q.key+' choice mismatch'));
  }else issues.push(problem('INSTRUMENT_TYPE',ex.templateId+'/'+q.key));
 }
 for(const key of Object.keys(ref))if(!seen.has(key))
  issues.push(problem('INSTRUMENT_OMITTED',ex.templateId+'/'+key));
 return issues;
}
