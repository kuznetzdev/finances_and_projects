/**
 * Conservative, context-specific plausibility checks for generated exercises.
 *
 * Hard failures are only algebraic constraints that follow from a template's
 * explicit assumptions, NOT generic "normal" industry ranges. Negative NPV,
 * free cash flow, ROE, CFO, working capital and cash cycles are never rejected
 * merely for their sign. Rates and multiples may exceed conventional norms.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const problem=(code,message)=>({code,message});
const tolerance=.00002;
const between=(x,low,high)=>finite(x)&&x>=low-tolerance&&x<=high+tolerance;
const find=(ex,key)=>ex?.questions?.find(x=>x.key===key&&x.type==='number')?.answer;

export function validatePlausibility(ex){
 const id=ex?.templateId??'',errors=[],warnings=[];
 const check=(valid,tag,description)=>{
   if(!valid)errors.push(problem('FINANCIAL_PLAUSIBILITY',id+'/'+tag+': '+description));
 };
 if(id==='r-current'){
  const current=find(ex,'current'),quick=find(ex,'quick');
  check(finite(current)&&finite(quick)&&current>=0&&quick>=0&&quick<=current+tolerance,
    'liquidity','текущая и быстрая ликвидность: 0 ≤ quick ≤ current');
 }
 if(id==='r-margins'){
  const gross=find(ex,'gross'),operating=find(ex,'oper'),net=find(ex,'net');
  check([gross,operating,net].every(finite)&&gross<=100+tolerance&&
    operating<=gross+tolerance&&net<=operating+tolerance,
    'margin','валовая ≥ операционная ≥ чистая; выручка положительна, расходы неотрицательны');
  // Negative margins are legal and intentionally not blocked.
 }
 if(id==='r-leverage'){
  const de=find(ex,'de'),share=find(ex,'debtshare');
  check(finite(de)&&de>=0&&between(share,0,100)&&
    Math.abs(share-100*de/(1+de))<.0002,
    'capital-mix','доля долга = D/E ÷ (1 + D/E), лежит в диапазоне 0–100%');
 }
 if(id==='v-wacc'){
  const rate=find(ex,'wacc');
  check(finite(rate)&&rate>0&&rate<=100,'wacc','положительная средневзвешенная цена капитала при положительных Re, Rd и весах');
 }
 if(id==='v-pi'){
  const index=find(ex,'pi');
  check(finite(index)&&index>=0,'profitability-index','PV поступлений и начальные инвестиции положительны');
 }
 if(id==='v-irr-zero'){
  const rate=find(ex,'irr');
  check(finite(rate)&&rate>-100,'irr-one-payment','IRR единственного положительного терминального платежа > −100%');
 }
 if(id==='r-roe-roa'){
  const roa=find(ex,'roa'),roe=find(ex,'roe');
  check(finite(roa)&&finite(roe)&&roa>=0&&roe>=0,
    'profitability','в этом шаблоне чистая прибыль, активы и капитал положительны');
 }

 // Broadly plausible values are NOT finance identities. Report, do not block.
 for(const q of ex?.questions??[]){
  if(q.type!=='number'||!finite(q.answer))continue;
  const label=String(q.label??'');
  const unit=String(q.unit??'');
  if(unit.includes('%')&&Math.abs(q.answer)>1000){
   warnings.push(problem('IMPLAUSIBLE_RATE',id+'/'+q.key+': '+q.answer+' '+unit+'; требует проверки сценария'));
  }
  if((/ликвидности|WACC|IRR|ROE|ROA|маржинальност|рентабельност/i.test(label))&&
     unit.includes('%')&&Math.abs(q.answer)>100){
   // Some returns and leverage effects legitimately exceed 100%; never fatal.
   warnings.push(problem('UNUSUAL_FINANCIAL_RATIO',id+'/'+q.key+': '+q.answer+' '+unit));
  }
  if(/мультипликатор|P\/E|EV\/EBITDA/i.test(label)&&
    (q.answer<0||q.answer>100)){
   // Negative valuation multiples may be meaningful or explicitly invalid;
   // without denominators there is no universal safe cutoff.
   warnings.push(problem('UNUSUAL_MULTIPLE',id+'/'+q.key+': '+q.answer+' '+unit));
  }
 }
 return {errors,warnings};
}
