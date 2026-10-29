/**
 * Independent numeric references for the 23 fixed photographed control works.
 *
 * Primitives are transcribed independently from the photo inventory in
 * docs/CONTROL_WORKS_SOURCE.md. Neither generator functions nor stored
 * checkpoint answers are used as inputs. A second human review of the
 * photographed text is still required if the original task is edited.
 */
const F03={founder:1000,loan:500,equipment:600,invoiced:800,collected:600,
  wages:300,wagesPaid:250,depreciation:50,principalPaid:100};
const F04={revenueBefore:5000,revenueAfter:6500,profitBefore:400,profitAfter:700,
  arBefore:600,arAfter:1300,stockBefore:500,stockAfter:900,
  apBefore:700,apAfter:1000,cashBefore:800,cashAfter:450};
const F06={sales:20,cogs:9,admin:2,advertising:1.5,rent:1,interest:.5,tax:.25};
const F08={salesOnCredit:100,costs:70};
const F10={asset:10,depreciation:2,sale:9};
const F11={loan:20,principalPaid:5,interestPaid:1};
const F12={purchases:12,soldCost:8,salesOnCredit:11};
const F13={loss:-8,depreciation:15,impairment:5};
const V05={riskFree:11.05,erp:6.10,beta:1.20,size:11.19,industry:1.50,
  specific:2,debtCost:15,debtWeight:.45,yearlyFlows:[-200,90,200]};
const V06={netIncome:320,da:150,capex:1000,nwcBefore:950,nwcAfter:850,
  debtBefore:5000,debtAfter:6000};
const V07={fcffYearOne:100,wacc:.12,growth:.05,netDebt:50};
const V08={baseFcff:3500,newCapex:1200};
const V09={netIncome:280,da:300,capex:850,nwcBefore:1100,nwcAfter:950,
  debtBefore:5000,debtAfter:5500};
const V10={operatingValue:900,netDebt:150,otherAssets:80,fcfeEquity:800};

const operatingProfit=F06.sales-F06.cogs-F06.admin-F06.advertising-F06.rent;
const adjustedRevenue=F06.sales*2;
const adjustedCost=F06.cogs*2; // Assumption stated in photographed-case solution.
const ke=V05.riskFree+V05.beta*V05.erp+V05.size+V05.industry+V05.specific;
const costOfCapital=(1-V05.debtWeight)*ke+V05.debtWeight*V05.debtCost;
const presentValue=V05.yearlyFlows.reduce((total,flow,i)=>
  total+flow/Math.pow(1+costOfCapital/100,i+1),0);
const alphaProfit=F03.invoiced-F03.wages-F03.depreciation;
const alphaCfo=F03.collected-F03.wagesPaid;
const alphaCff=F03.founder+F03.loan-F03.principalPaid;
const alphaCash=alphaCfo-F03.equipment+alphaCff;
const alphaAssets=alphaCash+(F03.invoiced-F03.collected)+(F03.equipment-F03.depreciation);
const alphaLiabilities=(F03.loan-F03.principalPaid)+(F03.wages-F03.wagesPaid);
const equityFromFcff=V10.operatingValue-V10.netDebt+V10.otherAssets;
const pctGrowth=(after,before)=>100*(after/before-1);
const change=(after,before)=>after-before;
const fcfe=v=>v.netIncome+v.da-v.capex-change(v.nwcAfter,v.nwcBefore)+
  change(v.debtAfter,v.debtBefore);
const cashFlowsOfSales=F12.salesOnCredit-(F12.purchases-F12.soldCost)-F12.soldCost;

const withUnit=(unit,values)=>Object.fromEntries(
 Object.entries(values).map(([label,answer])=>[label,{answer,unit}])
);
const r={
 'CW-F03':withUnit('тыс. ₽',{
  'Начисленная выручка':F03.invoiced,
  'Прибыль за январь':alphaProfit,
  'CFO января':alphaCfo,
  'CFI января':-F03.equipment,
  'CFF января':alphaCff,
  'Деньги на конец января':alphaCash,
  'Дебиторская задолженность':F03.invoiced-F03.collected,
  'Основные средства после амортизации':F03.equipment-F03.depreciation,
  'Балансовая стоимость активов':alphaAssets,
  'Обязательства на конец января':alphaLiabilities,
  'Собственный капитал на конец января':F03.founder+alphaProfit
 }),
 'CW-F04':withUnit('ед.',{
  'Изменение NWC по ДЗ, запасам и КЗ':
    change(F04.arAfter,F04.arBefore)+change(F04.stockAfter,F04.stockBefore)-
    change(F04.apAfter,F04.apBefore),
  'Изменение денежных средств':change(F04.cashAfter,F04.cashBefore)
 }),
 'CW-F06':withUnit('млн ₽',{
  'Валовая прибыль':F06.sales-F06.cogs,
  'EBIT':operatingProfit,
  'Прибыль до налога':operatingProfit-F06.interest,
  'Налог на прибыль':(operatingProfit-F06.interest)*F06.tax,
  'Чистая прибыль':(operatingProfit-F06.interest)*(1-F06.tax)
 }),
 'CW-F07':withUnit('млн ₽',{
  'Новая выручка':adjustedRevenue,
  'Новая себестоимость при прежних затратах на единицу':adjustedCost,
  'EBIT по новому объёму':adjustedRevenue-adjustedCost-F06.admin-F06.advertising-F06.rent,
  'Чистая прибыль при неизменных процентах':
    (adjustedRevenue-adjustedCost-F06.admin-F06.advertising-F06.rent-F06.interest)*(1-F06.tax),
  'Сумма запрошенного аванса по аренде':.3
 }),
 'CW-F08':withUnit('млн ₽',{
  'Прибыль до неуказанных налогов':F08.salesOnCredit-F08.costs,
  'Дебиторка по выручке':F08.salesOnCredit,
  'Поступления от клиентов':0
 }),
 'CW-F10':withUnit('млн ₽',{
  'Балансовая стоимость ОС перед продажей':F10.asset-F10.depreciation,
  'Прибыль от продажи оборудования':F10.sale-(F10.asset-F10.depreciation),
  'Суммарный эффект в P&L':-F10.depreciation+F10.sale-(F10.asset-F10.depreciation),
  'CFI от покупки и продажи':F10.sale-F10.asset
 }),
 'CW-F11':withUnit('млн ₽',{
  'Процентные расходы P&L':F11.interestPaid,
  'Остаток основного долга':F11.loan-F11.principalPaid,
  'CFF: привлечение и погашение тела':F11.loan-F11.principalPaid,
  'Изменение денежных средств':F11.loan-F11.principalPaid-F11.interestPaid
 }),
 'CW-F12':withUnit('млн ₽',{
  'Прибыль от продажи товаров':F12.salesOnCredit-F12.soldCost,
  'Остаток товаров':F12.purchases-F12.soldCost,
  'Дебиторка':F12.salesOnCredit,
  'CFO':cashFlowsOfSales-F12.salesOnCredit
 }),
 'CW-F13':withUnit('млн ₽',{
  'Некассовые корректировки':F13.depreciation+F13.impairment,
  'CFO до изменений WC и прочих корректировок':
    F13.loss+F13.depreciation+F13.impairment
 }),
 'CW-V05':withUnit('%',{
  'Стоимость собственного капитала Ke':ke,
  'WACC без налогового щита':costOfCapital
 }),
 'CW-V06':withUnit('ден. ед.',{
  'Изменение операционного оборотного капитала':change(V06.nwcAfter,V06.nwcBefore),
  'Чистое привлечение долга':change(V06.debtAfter,V06.debtBefore),
  'FCFE за 2022 год':fcfe(V06)
 }),
 'CW-V07':withUnit('ден. ед.',{
  'Enterprise Value':V07.fcffYearOne/(V07.wacc-V07.growth),
  'Equity Value':V07.fcffYearOne/(V07.wacc-V07.growth)-V07.netDebt
 }),
 'CW-V08':withUnit('ден. ед.',{
  'FCFF при ранее неучтённом CAPEX':V08.baseFcff-V08.newCapex
 }),
 'CW-V09':withUnit('ден. ед.',{
  'Изменение операционного оборотного капитала':change(V09.nwcAfter,V09.nwcBefore),
  'Чистое привлечение долга':change(V09.debtAfter,V09.debtBefore),
  'FCFE за 2024 год':fcfe(V09)
 }),
 'CW-V10':withUnit('ден. ед.',{
  'Equity Value через FCFF':equityFromFcff,
  'Equity Value через FCFE (дано)':V10.fcfeEquity,
  'Расхождение двух оценок':equityFromFcff-V10.fcfeEquity
 })
};
r['CW-F04']={
 ...withUnit('%',{
  'Темп роста выручки':pctGrowth(F04.revenueAfter,F04.revenueBefore),
  'Темп роста чистой прибыли':pctGrowth(F04.profitAfter,F04.profitBefore)
 }),
 ...r['CW-F04']
};
r['CW-V05']={
 ...r['CW-V05'],
 ...withUnit('ден. ед.',{'PV всех FCFF при WACC без щита':presentValue})
};

export const CONTROL_WORK_CASE_IDS=Object.freeze([
 ...Array.from({length:13},(_,i)=>'CW-F'+String(i+1).padStart(2,'0')),
 ...Array.from({length:10},(_,i)=>'CW-V'+String(i+1).padStart(2,'0'))
]);
export const CONTROL_WORK_REFERENCES=Object.freeze(r);
const ids=new Set(CONTROL_WORK_CASE_IDS);
const fail=(code,message)=>({code,message});
const finite=x=>typeof x==='number'&&Number.isFinite(x);

/**
 * Intentionally fail closed: adding a numerical question or a new CW case
 * requires an explicit addition to the independently maintained reference.
 * A free-text case must not silently gain auto-grading.
 */
export function validateControlWorkReferences(cases,checkpoints){
 const errors=[],actualCases=new Map();
 for(const c of cases??[]){
  if(c?.id?.startsWith('CW-'))actualCases.set(c.id,c);
 }
 for(const id of actualCases.keys()){
  if(!ids.has(id))errors.push(fail('CW_UNREGISTERED',id+' needs a source audit'));
 }
 for(const id of CONTROL_WORK_CASE_IDS){
  if(!actualCases.has(id)){
   errors.push(fail('CW_MISSING',id+' missing from case bank'));
   continue;
  }
  const c=actualCases.get(id),expected=CONTROL_WORK_REFERENCES[id];
  const actual=checkpoints[id]??[];
  if(!c.source?.includes('контрольн')&&!c.source?.includes('Контрольн')){
   errors.push(fail('CW_SOURCE',id+' source is missing'));
  }
  if(expected===undefined&&actual.length){
   errors.push(fail('CW_UNAPPROVED_GRADING',id+' is a reasoning-only case'));
   continue;
  }
  if(expected===undefined)continue;
  if(actual.length!==Object.keys(expected).length)
   errors.push(fail('CW_COVERAGE',id+': expected '+Object.keys(expected).length+' numeric checkpoints, got '+actual.length));
  const seen=new Set();
  for(const step of actual){
   if(seen.has(step.label))errors.push(fail('CW_DUPLICATE',id+'/'+step.label+' duplicated'));
   seen.add(step.label);
   const reference=expected[step.label];
   if(!reference){
    errors.push(fail('CW_UNMAPPED',id+'/'+step.label+' no independent formula'));
    continue;
   }
   if(step.unit!==reference.unit){
    errors.push(fail('CW_UNIT',id+'/'+step.label+' unit '+step.unit+' expected '+reference.unit));
   }
   if(!finite(step.answer)||!finite(reference.answer)||
      Math.abs(step.answer-reference.answer)>Math.max(.000015,1e-10*Math.abs(reference.answer))){
    errors.push(fail('CW_MISMATCH',id+'/'+step.label+
      ' answer '+step.answer+' vs independent '+reference.answer));
   }
  }
 }
 for(const id of Object.keys(checkpoints)){
  if(id.startsWith('CW-')&&!ids.has(id))errors.push(fail('CW_ORPHAN',id+' unknown reference'));
 }
 return errors;
}
