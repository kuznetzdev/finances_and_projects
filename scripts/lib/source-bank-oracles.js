/** References rebuilt from source exercise statements, NOT from stored app answers. */
import {unitReferences as u,combineReferences as merge,presentValue as pv,percent as pc,verifyReferenceSet} from './audit-reference-core.js';
const financials={
 f01:{cash:100,stock:200,equipment:500,payables:150,longDebt:300,
  buying:50,newDebt:100,saleRevenue:40,saleCost:30},
 f02:{sales:1000,cogs:600,admin:200,propertyTax:10,depreciationCost:50,depreciationAdmin:30},
 f10:{stockFrom:120,stockTo:160,arFrom:100,arTo:150,apFrom:210,apTo:240,
  netIncome:180,da:60,capex:120,raisedDebt:100,repaidDebt:40,dividends:70,beginCash:70},
 f19:{revenue:2000,cogs:1200,admin:300,impairment:50,da:100,
  interestAccrual:40,incomeTax:.25,netProfit:307.5,
  stockFrom:120,stockTo:180,arFrom:200,arTo:240,apFrom:100,apTo:130,
  taxPaid:70,interestPaid:30,capex:150,newDebt:80,repaidDebt:50,dividends:60,beginCash:100}
};
const F=financials;
const f01Capital0=F.f01.cash+F.f01.stock+F.f01.equipment-F.f01.payables-F.f01.longDebt;
const f01Cash=F.f01.cash-F.f01.buying+F.f01.newDebt+F.f01.saleRevenue;
const f01Stock=F.f01.stock+F.f01.buying-F.f01.saleCost;
const f01Capital1=f01Capital0+F.f01.saleRevenue-F.f01.saleCost;
const f02Ebit=F.f02.sales-F.f02.cogs-F.f02.admin-F.f02.propertyTax;
const f10Cfo=F.f10.netIncome+F.f10.da-(F.f10.stockTo-F.f10.stockFrom)-(F.f10.arTo-F.f10.arFrom)+(F.f10.apTo-F.f10.apFrom);
const f10Cfi=-F.f10.capex;
const f10Cff=F.f10.raisedDebt-F.f10.repaidDebt-F.f10.dividends;
const f19Ebit=F.f19.revenue-F.f19.cogs-F.f19.admin-F.f19.impairment;
const f19Tax=(f19Ebit-F.f19.interestAccrual)*F.f19.incomeTax;
const f19Cfo=f19Ebit+F.f19.da+F.f19.impairment-F.f19.taxPaid
 -(F.f19.stockTo-F.f19.stockFrom)-(F.f19.arTo-F.f19.arFrom)+(F.f19.apTo-F.f19.apFrom);
const f19Cff=F.f19.newDebt-F.f19.repaidDebt-F.f19.dividends-F.f19.interestPaid;
const rf=.08,marketRiskPremium=.14-rf;
const stocks=[.07,-.03,.11,-.05],market=[.04,-.01,.06,-.03];
const avg=v=>v.reduce((a,b)=>a+b,0)/v.length;
const stockAvg=avg(stocks),marketAvg=avg(market);
const betaNumerator=stocks.reduce((s,r,i)=>s+(r-stockAvg)*(market[i]-marketAvg),0);
const betaDenominator=market.reduce((s,r)=>s+(r-marketAvg)**2,0);
const unleveredBeta=1.5/(1+(1-.25)*.6);
const t08={cfo:500,capex:200,priority:50,debtService:150,ebit:400,interest:120,netDebt:900,ebitda:500,ca:600,cl:500};
const bondPrice=(face,coupon,n,yieldRate)=>pv(Array(n).fill(coupon).map((x,i)=>i===n-1?x+face:x),yieldRate);
const b10={face:1000,coupon:100,n:3,y:.12};
const b11={face:1000,n:2,y:.08,marketPrice:850};
const b13flows=[b10.coupon,b10.coupon,b10.face+b10.coupon];
const b13PV=b13flows.map((x,i)=>x/(1+b10.y)**(i+1));
const dMac=b13PV.reduce((s,x,i)=>s+(i+1)*x,0)/b13PV.reduce((a,b)=>a+b,0);
const b14={face:1000,coupon:120,n:5,marketPrice:950};
const v01={equity:600,debt:400,ke:.15,kd:.10,tax:.20,fcff6:500,g1:.02,g2:.03};
const v01Wacc=(v01.equity*v01.ke+v01.debt*v01.kd*(1-v01.tax))/(v01.equity+v01.debt);
const v02={fcff5:600,wacc:.12,growth:.04,years:5};
const v02Terminal=v02.fcff5*(1+v02.growth)/(v02.wacc-v02.growth);
const v03={ebit:800,tax:.25,da:100,capex:150,nwcIncrease:50};
const v05={netProfit:300,comparables:[10,12,14,15,20]};
const v08={fcff:[200,250,300],discount:.12,g:.03,debt:500,cash:100,shares:10};
const v08Tv=v08.fcff.at(-1)*(1+v08.g)/(v08.discount-v08.g);
const v08Ev=pv(v08.fcff,v08.discount)+v08Tv/(1+v08.discount)**v08.fcff.length;
const v10={ebitda:500,multiple:6,debt:800,cash:200,shares:10};
const v12={assets:2000,liabilities:800,writeUp:300,badAr:100,patent:150};
const v16={ebitda:500,da:80,capex:120,nwcIncrease:40,tax:.25,
  interest:60,netIncome:270,debt0:800,debt1:900};
const v16Fcff=(v16.ebitda-v16.da)*(1-v16.tax)+v16.da-v16.capex-v16.nwcIncrease;
const v16Fcfe=v16.netIncome+v16.da-v16.capex-v16.nwcIncrease+v16.debt1-v16.debt0;
export const SOURCE_BANK_REFERENCES=Object.freeze({
 F01:u('тыс. ₽',{
  'Собственный капитал в начале':f01Capital0,
  'Деньги в конце':f01Cash,
  'Собственный капитал в конце':f01Capital1,
  'Валюта баланса в конце':f01Cash+f01Stock+F.f01.equipment
 }),
 F02:merge(u('млн ₽',{'EBIT':f02Ebit,'EBITDA':f02Ebit+F.f02.depreciationCost+F.f02.depreciationAdmin}),
  u('%',{'Маржа EBITDA':pc((f02Ebit+F.f02.depreciationCost+F.f02.depreciationAdmin)/F.f02.sales)})),
 F10:u('млн ₽',{
  'CFO':f10Cfo,'CFI':f10Cfi,'CFF':f10Cff,
  'Изменение денежных средств':f10Cfo+f10Cfi+f10Cff,
  'Деньги на конец периода':F.f10.beginCash+f10Cfo+f10Cfi+f10Cff
 }),
 F19:u('млн ₽',{
  'EBIT':f19Ebit,'Налог на прибыль':f19Tax,'CFO':f19Cfo,
  'CFI':-F.f19.capex,'CFF':f19Cff,
  'Деньги на конец':F.f19.beginCash+f19Cfo-F.f19.capex+f19Cff
 }),
 T01:u('%',{
  'Re компании «Альфа» по CAPM':pc(rf+1.2*marketRiskPremium),
  'Re компании «Бета» по CAPM':pc(rf+.8*marketRiskPremium),
  'Re «Альфы» с дополнительной премией':pc(rf+1.2*marketRiskPremium)+2
 }),
 T02:merge(u('%',{'Средняя доходность акции':pc(stockAvg),
  'Средняя доходность рынка':pc(marketAvg)}),u('раз',{'Коэффициент β':betaNumerator/betaDenominator})),
 T03:u('раз',{'Безрычаговая β аналога':unleveredBeta,
   'Рычаговая β целевой компании':unleveredBeta*(1+(1-.25)*1)}),
 T04:u('%',{'WACC':pc(.6*.14+.4*.10*(1-.25))}),
 T08:u('раз',{
  'DSCR':(t08.cfo-t08.capex-t08.priority)/t08.debtService,
  'ICR':t08.ebit/t08.interest,
  'Долг / EBITDA':t08.netDebt/t08.ebitda,
  'Текущая ликвидность':t08.ca/t08.cl
 }),
 T10:u('₽',{'Справедливая цена облигации':bondPrice(b10.face,b10.coupon,b10.n,b10.y)}),
 T11:u('₽',{'Цена облигации при доходности 8%':b11.face/(1+b11.y)**b11.n,
  'YTM при цене 850 ₽':null}),
 T13:u('года',{'Дюрация Маколея':dMac}),
 T14:u('%',{'Текущая доходность':pc(b14.coupon/b14.marketPrice),
  'Приблизительная YTM':pc(((b14.face-b14.marketPrice)/b14.n+b14.coupon)/((b14.face+b14.marketPrice)/2))}),
 V01:u('%',{'WACC':pc(v01Wacc)}),
 V02:u('млн ₽',{'Терминальная стоимость на конец горизонта':v02Terminal,
  'Приведённая терминальная стоимость':v02Terminal/(1+v02.wacc)**v02.years}),
 V03:u('млн ₽',{'FCFF':v03.ebit*(1-v03.tax)+v03.da-v03.capex-v03.nwcIncrease}),
 V05:merge(u('раз',{'Медианный P/E аналогов':v05.comparables.sort((a,b)=>a-b)[2]}),
 u('млн ₽',{'Оценка собственного капитала':v05.netProfit*v05.comparables[2]})),
 V08:merge(u('млн ₽',{'Стоимость предприятия EV':v08Ev,
  'Стоимость собственного капитала Equity':v08Ev-v08.debt+v08.cash}),
  u('₽',{'Цена одной акции':(v08Ev-v08.debt+v08.cash)/v08.shares})),
 V10:merge(u('млн ₽',{'Стоимость предприятия EV':v10.ebitda*v10.multiple,
  'Стоимость капитала Equity':v10.ebitda*v10.multiple-v10.debt+v10.cash}),
  u('₽',{'Цена акции':(v10.ebitda*v10.multiple-v10.debt+v10.cash)/v10.shares})),
 V12:u('млн ₽',{'Скорректированный NAV':v12.assets-v12.liabilities+v12.writeUp-v12.badAr+v12.patent}),
 V16:u('млн ₽',{'FCFF':v16Fcff,'FCFE':v16Fcfe})
});
SOURCE_BANK_REFERENCES.T11['YTM при цене 850 ₽'].answer=pc((b11.face/b11.marketPrice)**(1/b11.n)-1);
SOURCE_BANK_REFERENCES.V01['Терминальная стоимость при первом g']={answer:v01.fcff6/(v01Wacc-v01.g1),unit:'млн ₽'};
SOURCE_BANK_REFERENCES.V01['Терминальная стоимость при втором g']={answer:v01.fcff6/(v01Wacc-v01.g2),unit:'млн ₽'};
export const SOURCE_BANK_CASE_IDS=Object.freeze(Object.keys(SOURCE_BANK_REFERENCES));
export const validateSourceBankReferences=(cases,checkpoints)=>verifyReferenceSet({cases,checkpoints,references:SOURCE_BANK_REFERENCES,code:'SOURCE'});
