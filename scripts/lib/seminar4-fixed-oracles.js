/** Independently derived answers for all eight financial seminar-4 cases (40 checks). */
import {unitReferences as u,combineReferences as m,percent as pc,verifyReferenceSet} from './audit-reference-core.js';
const s1={ev:7500,senior:.60*7500,mezz:.15*7500,fcf:700,seniorRate:.09,mezzRate:.13,growth:.025,years:4};
const s2={ev:15000,senior:.7*15000,fcf:1200,rate:.08,growth:.04,years:6};
const paySenior=(initial,years,annualFCF,seniorRate,mezzInterest=0)=>{
 let debt=initial;
 for(let t=1;t<=years;t++){
  const interest=debt*seniorRate+mezzInterest;
  if(interest>=annualFCF)throw Error('Insufficient cash flow for contractual debt paydown');
  debt=debt+interest-annualFCF;
 }
 return debt;
};
const s1Senior1=paySenior(s1.senior,1,s1.fcf,s1.seniorRate,s1.mezz*s1.mezzRate);
const s1Senior4=paySenior(s1.senior,4,s1.fcf,s1.seniorRate,s1.mezz*s1.mezzRate);
const s1DebtExit=s1Senior4+s1.mezz;
const s1EquityExit=s1.ev*(1+s1.growth)**s1.years-s1DebtExit;
const s1EquityEntry=s1.ev-s1.senior-s1.mezz;
const s2Debt1=paySenior(s2.senior,1,s2.fcf,s2.rate);
const s2Debt6=paySenior(s2.senior,s2.years,s2.fcf,s2.rate);
const s2EquityExit=s2.ev*(1+s2.growth)**s2.years-s2Debt6;
const s2EquityEntry=s2.ev-s2.senior;
const v3={investment:800,pre:3000,post:3000};
const v4={pre:9000,oldShares:20,founderShares:15,poolShares:5,investment:1800};
const v4Price=v4.pre/v4.oldShares,v4New=v4.investment/v4Price,v4Total=v4.oldShares+v4New;
const c5={assets:12000,ebit:2400,debtShare:.4,kd:.12,tax:.25};
const c5Debt=c5.assets*c5.debtShare,c5NI0=c5.ebit*(1-c5.tax);
const c5NI1=(c5.ebit-c5Debt*c5.kd)*(1-c5.tax);
const c6={debt:5000,kd:.1,tax:.25};
const c7=[[.2,.06,.12],[.4,.07,.13],[.6,.09,.16],[.8,.13,.22]];
const c7Wacc=c7.map(([d,kd,ke])=>pc((1-d)*ke+d*kd*.75));
const c8={equityBefore:15,sharesMillions:.75,ebit:2.5,tax:.35,perpetualDebt:4,kd:.08};
const c8KeBefore=pc(c8.ebit*(1-c8.tax)/c8.equityBefore);
const c8LeveredEV=c8.equityBefore+c8.perpetualDebt*c8.tax;
const c8Price=c8LeveredEV/c8.sharesMillions;
const c8RetiredThousands=c8.perpetualDebt/c8Price*1000;
const c8EquityAfter=c8LeveredEV-c8.perpetualDebt;
const c8KeAfter=pc((c8.ebit-c8.perpetualDebt*c8.kd)*(1-c8.tax)/c8EquityAfter);
const c8Wacc=c8EquityAfter/c8LeveredEV*c8KeAfter+c8.perpetualDebt/c8LeveredEV*c8.kd*(1-c8.tax)*100;
export const SECTION4_REFERENCES=Object.freeze({
 'S4-01':m(u('млн ₽',{
  'Старший долг на входе':s1.senior,
  'Мезонин на входе':s1.mezz,
  'Старший долг после года 1':s1Senior1,
  'Старший долг после года 4':s1Senior4,
  'Совокупный долг при выходе':s1DebtExit,
  'Equity спонсора при выходе':s1EquityExit
 }),u('%',{'IRR спонсора':pc((s1EquityExit/s1EquityEntry)**(1/s1.years)-1)})),
 'S4-02':m(u('млн ₽',{
  'Старший долг на входе':s2.senior,
  'Остаток долга после года 1':s2Debt1,
  'Остаток долга после года 6':s2Debt6,
  'Equity спонсора при выходе':s2EquityExit
 }),u('%',{'IRR спонсора за 6 лет':pc((s2EquityExit/s2EquityEntry)**(1/s2.years)-1)})),
 'S4-03':m(u('%',{
  'Доля инвестора при pre-money 3 000':pc(v3.investment/(v3.pre+v3.investment)),
  'Доля инвестора при post-money 3 000':pc(v3.investment/v3.post)
 }),u('п.п.',{'Разница долей в процентных пунктах':pc(v3.investment/v3.post-v3.investment/(v3.pre+v3.investment))})),
 'S4-04':m(u('₽',{'Цена одной акции до инвестиции':v4Price}),u('млн шт.',{'Количество новых акций':v4New}),u('%',{
  'Доля основателей после раунда':pc(v4.founderShares/v4Total),
  'Доля опционного пула после раунда':pc(v4.poolShares/v4Total),
  'Доля нового инвестора':pc(v4New/v4Total)
 })),
 'S4-05':m(u('млн ₽',{
  'Чистая прибыль без долга':c5NI0,
  'Годовые проценты при 40% долга':c5Debt*c5.kd,
  'Чистая прибыль при 40% долга':c5NI1
 }),u('%',{
  'ROE без долга':pc(c5NI0/c5.assets),
  'ROE при 40% долга':pc(c5NI1/(c5.assets-c5Debt))
 })),
 'S4-06':u('млн ₽',{
  'Годовые проценты по долгу':c6.debt*c6.kd,
  'Годовая экономия налога':c6.debt*c6.kd*c6.tax,
  'PV бессрочного налогового щита':c6.debt*c6.tax
 }),
 'S4-07':u('%',{
  'WACC структуры А':c7Wacc[0],
  'WACC структуры Б':c7Wacc[1],
  'WACC структуры В':c7Wacc[2],
  'WACC структуры Г':c7Wacc[3],
  'Минимальная WACC среди четырёх вариантов':Math.min(...c7Wacc)
 }),
 'S4-08':m(u('%',{
  'Ke и WACC без долга':c8KeBefore,
  'Ke после выкупа':c8KeAfter,
  'WACC после займа и выкупа':c8Wacc
 }),u('млн $',{
  'Стоимость предприятия после объявления':c8LeveredEV,
  'Стоимость equity после выкупа':c8EquityAfter
 }),u('$',{'Цена одной акции после объявления до выкупа':c8Price}),
 u('тыс. шт.',{'Число выкупаемых акций':c8RetiredThousands}))
});
export const validateSection4References=(cases,checkpoints)=>verifyReferenceSet({cases,checkpoints,references:SECTION4_REFERENCES,code:'S4'});
