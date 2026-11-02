/**
 * Independently reconstructed expected results for the user's 13 exam-prep cases.
 * DO NOT import the case data or checkpoints here. Inputs come from user statements,
 * and teaching assumptions are explicit. Any altered answer fails the preflight.
 * These source-specific assumptions are not universal financial conclusions.
 */
const as=(unit,values)=>Object.fromEntries(Object.entries(values).map(([label,answer])=>[label,{unit,answer}]));
const merge=(...parts)=>Object.assign({},...parts);
const pct=x=>x*100;
const annuityPrice=(coupon,face,years,rate)=>
 Array.from({length:years},(_,i)=>coupon/(1+rate)**(i+1)).reduce((a,b)=>a+b,0)+face/(1+rate)**years;
function bondYtm(net,coupon,face,years){
 let lo=0,hi=1;
 for(let i=0;i<160;i++){
  const mid=(lo+hi)/2;
  if(annuityPrice(coupon,face,years,mid)>net)lo=mid;
  else hi=mid;
 }
 return (lo+hi)/2;
}
function lboSchedule(initial,fcf,rate,years){
 let debt=initial;
 const yearsEnd=[];
 for(let i=0;i<years;i++){
  const interest=debt*rate;
  const repaid=Math.min(Math.max(fcf-interest,0),debt);
  debt-=repaid;
  yearsEnd.push(debt);
 }
 return yearsEnd;
}
const base={
 revenue:320-120+1300,
 cost:80+1100-130,
 da:.15*(80+1100-130),
 sales:1500,commercial:70
};
const assetsAfter={cash:120+40,receivables:380-100,inventory:400-150};
const currentAfter=Object.values(assetsAfter).reduce((a,b)=>a+b,0);
const quickAfter=assetsAfter.cash+assetsAfter.receivables;
const bondIssue={face:1000,coupon:.14,proceeds:920,flotation:.03,tax:.25,ke:.15+.02};
const bondDebt=bondYtm(bondIssue.proceeds*(1-bondIssue.flotation),bondIssue.face*bondIssue.coupon,bondIssue.face,5);
const amort={principal:[400,300,200,100],yield:.11,rate:.10,face:1000};
let outstanding=amort.face;
const amortFlows=amort.principal.map(repay=>{
 const payment=outstanding*amort.rate+repay;
 outstanding-=repay;return payment;
});
const option={invest:600,success:.7,successCF:800,failCF:200,expand:300,extraCF:400,discount:.12};
const expectedYear1=option.success*option.successCF+(1-option.success)*option.failCF;
const optionBase=-option.invest+expectedYear1/(1+option.discount);
const expansionValue=option.extraCF/(1+option.discount)-option.expand;
const optionPV=option.success*Math.max(0,expansionValue)/(1+option.discount);
const dcf={fcff:[250,300,350],wacc:.13,g:.02,debt:800,cash:150};
const f4=dcf.fcff[2]*(1+dcf.g);
const tv=f4/(dcf.wacc-dcf.g);
const tvPv=tv/(1+dcf.wacc)**3;
const dcfEv=dcf.fcff.reduce((s,flow,i)=>s+flow/(1+dcf.wacc)**(i+1),0)+tvPv;
const lbo4={entry:10000,initialDebt:7000,fcf:1400,rate:.09,years:4,exitEv:11000};
const lbo4Debts=lboSchedule(lbo4.initialDebt,lbo4.fcf,lbo4.rate,lbo4.years);
const lbo4ExitDebt=lbo4Debts.at(-1);
const lbo4Equity=lbo4.exitEv-lbo4ExitDebt;
const lever={roa:.18,kd:.12,tax:.25,debtToEquity:1.5};
const leverRoe=(lever.roa+(lever.roa-lever.kd)*lever.debtToEquity)*(1-lever.tax);
const leverEquityWeight=1/(1+lever.debtToEquity);
const leverDebtWeight=1-leverEquityWeight;
const mm={ebit:10,tax:.3,ku:.16,debt:10,kd:.08};
const mmVu=mm.ebit*(1-mm.tax)/mm.ku;
const mmTaxAnnual=mm.debt*mm.kd*mm.tax;
const mmShield=mmTaxAnnual/mm.kd;
const mmVl=mmVu+mmShield;
const mmEquityAfter=mmVl-mm.debt;
const cfo={ni:600,da:150,arDelta:50,invDelta:-30,apDelta:40,capex:200,interest:60,tax:.25};
const deltaNwc=cfo.arDelta+cfo.invDelta-cfo.apDelta;
const operatingCash=cfo.ni+cfo.da-deltaNwc;
const fcff=operatingCash+cfo.interest*(1-cfo.tax)-cfo.capex;
const capital={ebit:1000,assets:5000,kd:.12,tax:.2,shares:[0,.5,.8]};
const capitalRoe=share=>{
 const debt=capital.assets*share,equity=capital.assets-debt;
 return pct((capital.ebit-capital.kd*debt)*(1-capital.tax)/equity);
};
const venture={pre:4000,investment:1000,poolPre:.2};
const ventureInvestor=venture.investment/(venture.pre+venture.investment);
const ventureFounderBefore=1-venture.poolPre;
const ventureFounderAfter=ventureFounderBefore*(1-ventureInvestor);
const venturePoolAfter=venture.poolPre*(1-ventureInvestor);
const lbo5={entryEv:10000,debtFraction:.7,fcf:1200,years:5,scenarioRate:.09,exitEv:10000};
const lbo5Debt=lbo5.entryEv*lbo5.debtFraction;
const lbo5Equity0=lbo5.entryEv-lbo5Debt;
const lbo5A=lbo5Debt-lbo5.fcf*lbo5.years;
const lbo5B=lboSchedule(lbo5Debt,lbo5.fcf,lbo5.scenarioRate,lbo5.years).at(-1);
const lbo5MoicA=(lbo5.exitEv-lbo5A)/lbo5Equity0;
const lbo5MoicB=(lbo5.exitEv-lbo5B)/lbo5Equity0;
export const EXAM_PREP_ORACLES=Object.freeze({
 'PREP26-01':as('ед.',{
  'Выручка':base.revenue,
  'Себестоимость проданной продукции':base.cost,
  'Амортизация':base.da,
  'EBIT':base.revenue-base.cost-base.commercial,
  'EBITDA':base.revenue-base.cost-base.commercial+base.da
 }),
 'PREP26-02':merge(as('раз',{
  'Текущая ликвидность до событий':900/400,
  'Быстрая ликвидность до событий':(120+380)/400,
  'Текущая после, долг поставщику сохраняется':currentAfter/400,
  'Быстрая после, долг поставщику сохраняется':quickAfter/400,
  'Текущая после, если долг поставщику списан':currentAfter/(400-60),
  'Быстрая после, если долг поставщику списан':quickAfter/(400-60)
 }),as('ед.',{'Оборотные активы после событий':currentAfter})),
 'PREP26-03':merge(as('ед.',{
  'Годовой купон':bondIssue.face*bondIssue.coupon,
  'Чистые поступления от размещения':bondIssue.proceeds*(1-bondIssue.flotation)
 }),as('%',{
  'Эффективная стоимость долга Rd':pct(bondDebt),
  'Стоимость акционерного капитала':pct(bondIssue.ke),
  'WACC с налоговым щитом':pct(.5*bondIssue.ke+.5*bondDebt*(1-bondIssue.tax))
 })),
 'PREP26-04':as('ед.',{
  'Купон первого года':amort.face*amort.rate,
  'Полный платёж второго года':amortFlows[1],
  'Полный платёж третьего года':amortFlows[2],
  'Полный платёж четвёртого года':amortFlows[3],
  'Стоимость облигации':amortFlows.reduce((s,p,i)=>s+p/(1+amort.yield)**(i+1),0)
 }),
 'PREP26-05':as('ед.',{
  'Ожидаемый поток t=1':expectedYear1,
  'NPV без расширения':optionBase,
  'NPV расширения на момент t=1':expansionValue,
  'Стоимость опциона на момент t=0':optionPV,
  'NPV с опционом':optionBase+optionPV
 }),
 'PREP26-06':as('ед.',{
  'FCFF четвёртого года':f4,
  'Терминальная стоимость на конец 3-го года':tv,
  'PV терминальной стоимости':tvPv,
  'EV':dcfEv,
  'Стоимость Equity':dcfEv-dcf.debt+dcf.cash
 }),
 'PREP26-07':merge(as('ед.',{
  'Остаток долга после 1-го года':lbo4Debts[0],
  'Остаток долга после 2-го года':lbo4Debts[1],
  'Остаток долга после 3-го года':lbo4Debts[2],
  'Долг при выходе через 4 года':lbo4ExitDebt,
  'Equity при продаже':lbo4Equity
 }),as('%',{'IRR спонсора':pct((lbo4Equity/(lbo4.entry-lbo4.initialDebt))**(1/lbo4.years)-1)})),
 'PREP26-08':as('%',{
  'ROE после налога':pct(leverRoe),
  'Вес equity':pct(leverEquityWeight),
  'Вес долга':pct(leverDebtWeight),
  'WACC':pct(leverEquityWeight*leverRoe+leverDebtWeight*lever.kd*(1-lever.tax))
 }),
 'PREP26-09':as('млн',{
  'EV без долга':mmVu,
  'Годовая налоговая экономия':mmTaxAnnual,
  'PV вечного налогового щита':mmShield,
  'EV после объявления':mmVl,
  'Equity после объявления до размещения':mmVl,
  'Equity после размещения и выкупа':mmEquityAfter,
  'WACC после выкупа':pct(mm.ebit*(1-mm.tax)/mmVl)
 }),
 'PREP26-10':as('ед.',{
  'Изменение операционного NWC':deltaNwc,
  'CFO с процентами в операционном потоке':operatingCash,
  'Проценты после налога':cfo.interest*(1-cfo.tax),
  'FCFF':fcff,
  'CFO при классификации процентов в финансовой деятельности':operatingCash+cfo.interest
 }),
 'PREP26-11':as('%',{
  'ROAebit при дополнительном A=5000':pct(capital.ebit/capital.assets),
  'ROE при доле долга 0% и A=5000':capitalRoe(capital.shares[0]),
  'ROE при доле долга 50% и A=5000':capitalRoe(capital.shares[1]),
  'ROE при доле долга 80% и A=5000':capitalRoe(capital.shares[2]),
  'Порог ставки долга Kd=ROA при A=5000':pct(capital.ebit/capital.assets),
  'Снижение EBIT для нулевой прибыли при 80% долга':pct((capital.ebit-capital.assets*.8*capital.kd)/capital.ebit)
 }),
 'PREP26-12':merge(as('ед.',{'Post-money':venture.pre+venture.investment}),as('%',{
  'Доля инвестора':pct(ventureInvestor),
  'Доля основателей при пуле 20% до сделки':pct(ventureFounderAfter),
  'Доля пула при пуле 20% до сделки':pct(venturePoolAfter),
  'Доля основателей при обязательном пуле 20% после сделки':pct(1-ventureInvestor-.2)
 }),as('п.п.',{'Размытие основателей в п.п. при пуле до сделки':pct(ventureFounderBefore-ventureFounderAfter)})),
 'PREP26-13':merge(as('ед.',{
  'Входной долг':lbo5Debt,
  'Входной капитал спонсора':lbo5Equity0,
  'Долг после 5 лет: сценарий A (FCF после процентов)':lbo5A,
  'Долг после 5 лет: сценарий B (ставка 9%)':lbo5B
 }),as('раз',{'MOIC сценарий A':lbo5MoicA,'MOIC сценарий B':lbo5MoicB}),as('%',{
  'IRR сценарий A':pct(lbo5MoicA**(1/lbo5.years)-1),
  'IRR сценарий B':pct(lbo5MoicB**(1/lbo5.years)-1)
 }))
});
export const EXAM_PREP_CASE_IDS=Object.freeze(Object.keys(EXAM_PREP_ORACLES));
const issue=(code,message)=>({code,message});
export function validateExamPrepReferences(cases,checkpoints){
 const problems=[],found=new Map();
 for(const item of cases??[]){
  if(item?.id?.startsWith('PREP26-')){
   if(found.has(item.id))problems.push(issue('EXAM_DUPLICATE',item.id+' duplicate case'));
   found.set(item.id,item);
  }
 }
 for(const id of found.keys())if(!EXAM_PREP_CASE_IDS.includes(id))problems.push(issue('EXAM_UNREGISTERED',id+' no independent oracle'));
 for(const id of EXAM_PREP_CASE_IDS){
  const item=found.get(id);
  if(!item){problems.push(issue('EXAM_MISSING',id+' missing case'));continue;}
  const expected=EXAM_PREP_ORACLES[id],actual=checkpoints?.[id]??[];
  const names=new Set();
  if(actual.length!==Object.keys(expected).length)
   problems.push(issue('EXAM_COVERAGE',id+' expected '+Object.keys(expected).length+' answers, found '+actual.length));
  for(const q of actual){
   if(names.has(q.label))problems.push(issue('EXAM_DUPLICATE',id+'/'+q.label+' duplicate checkpoint'));
   names.add(q.label);
   const reference=expected[q.label];
   if(!reference){problems.push(issue('EXAM_UNMAPPED',id+'/'+q.label+' unapproved checkpoint'));continue;}
   if(q.unit!==reference.unit)problems.push(issue('EXAM_UNIT',id+'/'+q.label+' unit '+q.unit+' expected '+reference.unit));
   if(!Number.isFinite(q.answer)||Math.abs(q.answer-reference.answer)>Math.max(1e-7,1e-9*Math.abs(reference.answer)))
    problems.push(issue('EXAM_MISMATCH',id+'/'+q.label+': got '+q.answer+' expected '+reference.answer));
   if(!Number.isFinite(q.tolerance)||q.tolerance<0||q.tolerance>Math.max(.1,Math.abs(reference.answer)*.001))
    problems.push(issue('EXAM_TOLERANCE',id+'/'+q.label+' tolerance too large or invalid'));
  }
  for(const label of Object.keys(expected))if(!names.has(label))
   problems.push(issue('EXAM_COVERAGE',id+'/'+label+' expected checkpoint missing'));
 }
 return problems;
}
