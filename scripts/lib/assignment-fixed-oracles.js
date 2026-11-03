/** Finance references for independently stated capital-structure assignments 30 Oct. */
import {unitReferences as u,verifyReferenceSet} from './audit-reference-core.js';
const mm={enterpriseWithout:20000,perpetualDebt:4000,tax:.25,distressPV:1500};
const funding={need:2000,availableInternal:800,bankLimit:1500,bankRate:.10,
  bondRate:.12,reserve:500};
const internal=Math.min(funding.need,funding.availableInternal);
const bank=Math.min(funding.bankLimit,funding.need-internal);
const bonds=Math.max(0,funding.need-internal-bank);
const equity=Math.max(0,funding.need-internal-bank-bonds);
const reserveInternal=Math.max(0,funding.availableInternal-funding.reserve);
const reserveBank=Math.min(funding.bankLimit,funding.need-reserveInternal);
const reserveBonds=Math.max(0,funding.need-reserveInternal-reserveBank);
const shield=mm.perpetualDebt*mm.tax;
export const ASSIGNMENT_REFERENCES=Object.freeze({
 CS01:u('млн ₽',{
  'Приведённая стоимость налогового щита':shield,
  'Стоимость фирмы с долгом в модели M&M':mm.enterpriseWithout+shield,
  'Стоимость в дополнительном сценарии с PV издержек 1 500':mm.enterpriseWithout+shield-mm.distressPV
 }),
 CS02:u('млн ₽',{
  'Использованные внутренние денежные средства, основной сценарий':internal,
  'Кредит банка в основном сценарии':bank,
  'Облигации в основном сценарии':bonds,
  'Новые акции в основном сценарии':equity,
  'Годовые проценты по банку в основном сценарии':bank*funding.bankRate,
  'Внутренние средства с резервом 500 млн':reserveInternal,
  'Облигации при резерве 500 млн':reserveBonds,
  'Годовые проценты при резерве 500 млн':reserveBank*funding.bankRate+reserveBonds*funding.bondRate
 })
});
export const validateAssignmentReferences=(cases,checkpoints)=>verifyReferenceSet({cases,checkpoints,references:ASSIGNMENT_REFERENCES,code:'ASSIGN'});
