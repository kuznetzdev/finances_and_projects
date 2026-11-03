/** Independent capital-structure, debt covenant and liquidation math. */
import {unitReferences as u,combineReferences as m,percent as pc,verifyReferenceSet} from './audit-reference-core.js';
const b2={assets:1000,roa:.14,tax:.25,shares:[.2,.4,.6],
  ke:[.15,.17,.25],kd:[.09,.10,.13],cfads:150,principal40:70,principal60:110};
const b2Debt40=b2.assets*b2.shares[1];
const b2Debt60=b2.assets*b2.shares[2];
const b2Ebit=b2.assets*b2.roa;
const b2Roe40=pc((b2Ebit-b2Debt40*b2.kd[1])*(1-b2.tax)/(b2.assets-b2Debt40));
const b2Wacc40=pc((1-b2.shares[1])*b2.ke[1]+b2.shares[1]*b2.kd[1]*(1-b2.tax));
const b3={ebit:180,ku:.15,tax:.25,perpetualDebt:300,distress:90};
const b3WithoutTax=b3.ebit/b3.ku;
const b3TaxFreeValue=b3.ebit*(1-b3.tax)/b3.ku;
const b3Levered=b3TaxFreeValue+b3.tax*b3.perpetualDebt;
const b5={low:390,high:520,senior:240,mezz:120,preferred:80};
const b5PreferredLow=Math.min(b5.preferred,Math.max(0,b5.low-b5.senior-b5.mezz));
const b5CommonLow=Math.max(0,b5.low-b5.senior-b5.mezz-b5.preferred);
const b5CommonHigh=Math.max(0,b5.high-b5.senior-b5.mezz-b5.preferred);
const b14={debt:500,oldRate:.1,oldPrincipal:100,newRate:.12,principalA:50,principalB:25,cfads:110};
export const CAPITAL_REFERENCES=Object.freeze({
 B02:m(u('млн ₽',{'EBIT':b2Ebit}),u('%',{
  'ROE при 40% долга':b2Roe40,'WACC при 40% долга':b2Wacc40
 }),u('раз',{
  'DSCR при 40% долга':b2.cfads/(b2Debt40*b2.kd[1]+b2.principal40),
  'DSCR при 60% долга':b2.cfads/(b2Debt60*b2.kd[2]+b2.principal60)
 })),
 B03:u('млн ₽',{
  'Стоимость без налогов':b3WithoutTax,
  'Стоимость без долга с налогом':b3TaxFreeValue,
  'Стоимость с налоговым щитом':b3Levered,
  'Стоимость после издержек неустойчивости':b3Levered-b3.distress
 }),
 B05:u('млн ₽',{
  'Привилегированные акции при 390 млн ₽':b5PreferredLow,
  'Обыкновенные акции при 390 млн ₽':b5CommonLow,
  'Обыкновенные акции при 520 млн ₽':b5CommonHigh,
  'Непокрытая привилегированная преференция':b5.preferred-b5PreferredLow
 }),
 B14:m(u('раз',{
  'Исходный DSCR':b14.cfads/(b14.debt*b14.oldRate+b14.oldPrincipal),
  'DSCR после варианта А':b14.cfads/(b14.debt*b14.newRate+b14.principalA),
  'DSCR после варианта Б':b14.cfads/(b14.debt*b14.newRate+b14.principalB)
 }),u('млн ₽',{'Прирост годового процента':b14.debt*(b14.newRate-b14.oldRate)}))
});
export const validateCapitalReferences=(cases,checkpoints)=>verifyReferenceSet({cases,checkpoints,references:CAPITAL_REFERENCES,code:'CAPITAL'});
