/** Independent arithmetic for source-labelled lecture LBO, VC and real-option problems. */
import {unitReferences as u,combineReferences as m,percent as pc,verifyReferenceSet} from './audit-reference-core.js';
const lc1={entryEv:500,initialDebt:350,sponsorEquity:150,annualPrincipal:50,years:4,exitEv:500,stressExit:400};
const lc1Debt=lc1.initialDebt-lc1.years*lc1.annualPrincipal;
const lc1Exit=lc1.exitEv-lc1Debt;
const lc2={entryEv:900,debtShare:.7,ebitda:100,maxLeverage:6};
const vc1={pre:9000,invest:1000};
const vc2={pre:4000,oldShares:10,invest:1000};
const vc2Price=vc2.pre/vc2.oldShares;
const vc2New=vc2.invest/vc2Price;
const vc3={invest:500,exit:4000,years:4};
const vc4={pre:4000,shares:10,founderShares:8,poolShares:2,invest:1000};
const vc4New=vc4.invest/(vc4.pre/vc4.shares);
const vc4Total=vc4.shares+vc4New;
const ro={up:.5,goodA:120,badA:-40,badB:70,optionCost:30,discount:.1};
const flowWithout=ro.up*ro.goodA+(1-ro.up)*ro.badA;
const flowWith=ro.up*ro.goodA+(1-ro.up)*ro.badB;
export const LECTURE_REFERENCES=Object.freeze({
 LC01:m(u('млн ₽',{
  'Остаток долга на дату продажи':lc1Debt,
  'Equity спонсора на выходе':lc1Exit,
  'Equity спонсора при стресс-цене EV 400':lc1.stressExit-lc1Debt
 }),u('раз',{'MOIC спонсора':lc1Exit/lc1.sponsorEquity}),u('%',{
  'IRR спонсора за четыре года':pc((lc1Exit/lc1.sponsorEquity)**(1/lc1.years)-1)
 })),
 LC02:m(u('млн ₽',{
  'Запрошенный банковский кредит':lc2.entryEv*lc2.debtShare,
  'Максимальный долг при дополнительном строгом лимите 6x':lc2.maxLeverage*lc2.ebitda,
  'Дополнительный equity для выполнения лимита 6x':lc2.entryEv*lc2.debtShare-lc2.maxLeverage*lc2.ebitda
 }),u('раз',{'Долг / EBITDA при запрошенном кредите':lc2.entryEv*lc2.debtShare/lc2.ebitda})),
 VC01:m(u('млн ₽',{'Post-money оценка':vc1.pre+vc1.invest}),u('%',{
  'Доля инвестора':pc(vc1.invest/(vc1.pre+vc1.invest)),
  'Доля основателей после раунда':pc(vc1.pre/(vc1.pre+vc1.invest))
 })),
 VC02:m(u('₽',{'Цена одной новой акции':vc2Price}),u('млн шт.',{
  'Количество новых акций инвестора':vc2New,
  'Всего акций после раунда':vc2.oldShares+vc2New
 })),
 VC03:m(u('раз',{'MOIC венчурного фонда':vc3.exit/vc3.invest}),u('%',{
  'IRR за 4 года':pc((vc3.exit/vc3.invest)**(1/vc3.years)-1)
 })),
 VC04:m(u('млн шт.',{'Новых акций инвестора':vc4New}),u('%',{
  'Доля основателей после сделки':pc(vc4.founderShares/vc4Total),
  'Доля опционного пула':pc(vc4.poolShares/vc4Total),
  'Доля нового инвестора':pc(vc4New/vc4Total)
 }),u('п.п.',{'Размытие доли основателей':pc(vc4.founderShares/vc4.shares-vc4.founderShares/vc4Total)})),
 RO02:u('млн ₽',{
  'Ожидаемый поток без гибкости в конце года 1':flowWithout,
  'Ожидаемый поток с гибкостью в конце года 1':flowWith,
  'PV права переключения на сегодня':(flowWith-flowWithout)/(1+ro.discount),
  'Чистый прирост NPV от гибкой линии':(flowWith-flowWithout)/(1+ro.discount)-ro.optionCost
 })
});
export const validateLectureReferences=(cases,checkpoints)=>verifyReferenceSet({cases,checkpoints,references:LECTURE_REFERENCES,code:'LECTURE'});
