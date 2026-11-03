/** Independent accounting deferred-tax and fully reconciled DCF references. */
import {unitReferences as u,combineReferences as m,percent as pc,presentValue as pv,verifyReferenceSet} from './audit-reference-core.js';
const tax={cost:600,years:5,rate:.25,cashBeforeDep:350,discount:.10};
const bookDep=tax.cost/tax.years;
const accelerated=Array.from({length:tax.years},(_,i)=>tax.cost*(tax.years-i)/(tax.years*(tax.years+1)/2));
const taxable=accelerated.map(d=>tax.cashBeforeDep-d);
const deferred=(accelerated[0]-bookDep)*tax.rate;
const shieldDifference=pv(accelerated.map(d=>d*tax.rate),tax.discount)-
 pv(Array(tax.years).fill(bookDep*tax.rate),tax.discount);
const dcf={ebit:200,tax:.25,da:30,capex:30,unleveredRate:.15,debt:200,kd:.08};
const fcff=dcf.ebit*(1-dcf.tax)+dcf.da-dcf.capex;
const unleveredEV=fcff/dcf.unleveredRate;
const taxShield=dcf.debt*dcf.tax;
const ev=unleveredEV+taxShield;
const equity=ev-dcf.debt;
const ke=dcf.unleveredRate+(dcf.unleveredRate-dcf.kd)*(1-dcf.tax)*dcf.debt/equity;
const wacc=(equity*ke+dcf.debt*dcf.kd*(1-dcf.tax))/ev;
const fcfe=fcff-dcf.debt*dcf.kd*(1-dcf.tax);
export const ADVANCED_REFERENCES=Object.freeze({
 B13:u('млн ₽',{
  'Бухгалтерская амортизация в первом году':bookDep,
  'Текущий налог на прибыль первого года':taxable[0]*tax.rate,
  'ОНО на конец первого года':deferred,
  'Налоговая задолженность на конец пятого года':taxable.at(-1)*tax.rate,
  'PV прироста налогового щита при уплате в год начисления':shieldDifference
 })
});
export const DCF_REFERENCES=Object.freeze({
 B09:m(u('млн ₽',{
  'FCFF':fcff,
  'Налоговый щит':taxShield,
  'EV':ev,
  'Equity':equity,
  'FCFE':fcfe
 }),u('%',{'Ke':pc(ke),'WACC':pc(wacc)}))
});
export const TAX_DCF_REFERENCES=Object.freeze({...ADVANCED_REFERENCES,...DCF_REFERENCES});
export const validateTaxDcfReferences=(cases,checkpoints)=>verifyReferenceSet({cases,checkpoints,references:TAX_DCF_REFERENCES,code:'TAXDCF'});
