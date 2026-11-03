/**
 * Reconstruct DCF inputs from student-facing statement, not from the generator's
 * internal variables or stored answer values. Published FCFF are rounded to 0.01.
 */
export const ADVANCED_DCF_ORACLE_TEMPLATES=Object.freeze(['a-dcf-ev']);
const parseNumber=text=>Number(String(text).replace(/[\s\u00a0\u202f]/g,'').replace(',','.'));
const error=(code,message)=>({code,message});
const approx=(a,b,epsilon=.0001)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=epsilon;
export function validateAdvancedDcfOracle(ex){
 if(ex?.templateId!=='a-dcf-ev')return [];
 const errors=[],story=String(ex.story??'');
 const extract=(pattern,name)=>{
  const match=story.match(pattern);
  if(!match){errors.push(error('ADV_DCF_SOURCE','a-dcf-ev missing '+name));return NaN;}
  return parseNumber(match[1]);
 };
 const forecast=story.match(/Прогнозные FCFF на следующие три года:\s*([^]*?)\s*млн ₽\s*\(в конце каждого года\)/);
 if(!forecast)return [error('ADV_DCF_SOURCE','a-dcf-ev forecast cash flows missing')];
 const flows=forecast[1].split(/\s*\/\s*/).map(parseNumber);
 const wacc=extract(/WACC\s+([\d\s,\.]+)%/,'WACC')/100;
 const growth=extract(/рост после третьего года\s+([\d\s,\.]+)%/,'growth')/100;
 const debt=extract(/Процентный долг на дату оценки\s+([\d\s,\.]+)\s*млн/,'debt');
 const cash=extract(/свободные деньги\s+([\d\s,\.]+)\s*млн/,'cash');
 if(flows.length!==3||!flows.every(v=>Number.isFinite(v)&&v>0)||
   !Number.isFinite(wacc)||!Number.isFinite(growth)||growth>=wacc||wacc<=0)
  return [...errors,error('ADV_DCF_INPUTS','a-dcf-ev invalid forecast or discount-rate assumptions')];
 const questions=new Map(ex.questions.map(q=>[q.key,q]));
 const expectedKeys=['pv','tv','evt','ev','eq'];
 if(questions.size!==expectedKeys.length||!expectedKeys.every(k=>questions.has(k)))
  errors.push(error('ADV_DCF_COVERAGE','a-dcf-ev missing or unexpected fields'));
 const actual=key=>{
  const val=questions.get(key)?.answer;
  if(!Number.isFinite(val))errors.push(error('ADV_DCF_INPUTS','a-dcf-ev/'+key+' not finite'));
  return val;
 };
 const pv=actual('pv'),tv=actual('tv'),pvTerminal=actual('evt'),ev=actual('ev'),equity=actual('eq');
 const forecastPv=flows.reduce((s,f,i)=>s+f/(1+wacc)**(i+1),0);
 const trueTv=flows[2]*(1+growth)/(wacc-growth);
 // FCFF displayed in the condition is rounded to 2 decimals. Max TV error:
 // 0.005 * (1+g)/(WACC-g) <= 0.0743 under this template's rate range.
 const maxTVRounding=.0051*(1+growth)/(wacc-growth)+.0001;
 const verify=(label,value,expected,epsilon)=>{
  if(!approx(value,expected,epsilon))
   errors.push(error('ADV_DCF_MISMATCH','a-dcf-ev/'+label+' '+value+' expected '+expected));
 };
 verify('pv',pv,forecastPv,.021);
 verify('tv',tv,trueTv,maxTVRounding);
 verify('evt',pvTerminal,tv/(1+wacc)**3,.0001);
 verify('ev',ev,pv+pvTerminal,.0001);
 verify('eq',equity,ev-debt+cash,.0001);
 // A second equity reconciliation from independently recalculated PV,
 // using published rounded forecast, allows for rounding of up to 0.1.
 verify('eq from original inputs',equity,forecastPv+trueTv/(1+wacc)**3-debt+cash,
   .021+maxTVRounding/(1+wacc)**3+.0001);
 return errors;
}
