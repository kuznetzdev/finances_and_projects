/** Independent valuations for bonds, duration, call/put and protective puts. */
import {unitReferences as u,combineReferences as m,presentValue as pv,percent as pc,verifyReferenceSet} from './audit-reference-core.js';
const bond={face:1000,coupon:80,years:3,ytm:.10,shock:.01};
const bondFlows=[bond.coupon,bond.coupon,bond.coupon+bond.face];
const discounted=bondFlows.map((value,index)=>value/(1+bond.ytm)**(index+1));
const price=discounted.reduce((a,b)=>a+b,0);
const macaulay=discounted.reduce((s,v,i)=>s+(i+1)*v,0)/price;
const modified=macaulay/(1+bond.ytm);
const priceHigher=pv(bondFlows,bond.ytm+bond.shock);
const bond2={face:1000,coupon:120,years:3,ytm:.15};
const bond2Price=pv([120,120,1120],bond2.ytm);
const calls={underlyingHigh:120,underlyingLow:80,strike:100,callPremium:8,putPremium:6};
const hedge={buy:100,exit:75,putStrike:95,putPremium:8};
export const INSTRUMENT_REFERENCES=Object.freeze({
 I01:m(u('₽',{'Цена купонной облигации':price}),u('лет',{
  'Дюрация Маколея':macaulay,
  'Модифицированная дюрация':modified
 }),u('%',{
  'Приближённое изменение цены при росте YTM на 1 п.п.':-modified,
  'Точное изменение цены при росте YTM на 1 п.п.':pc(priceHigher/price-1)
 })),
 I02:m(u('₽',{'Цена при YTM 15%':bond2Price}),u('%',{
  'Текущая купонная доходность':pc(bond2.coupon/bond2Price),
  'Точная годовая доходность к погашению YTM':pc(bond2.ytm)
 })),
 I03:u('₽',{
  'Выплата CALL при исполнении':Math.max(calls.underlyingHigh-calls.strike,0),
  'Чистая прибыль покупателя CALL':Math.max(calls.underlyingHigh-calls.strike,0)-calls.callPremium,
  'Безубыточная цена акции для CALL':calls.strike+calls.callPremium,
  'Выплата PUT при исполнении':Math.max(calls.strike-calls.underlyingLow,0),
  'Чистая прибыль покупателя PUT':Math.max(calls.strike-calls.underlyingLow,0)-calls.putPremium,
  'Безубыточная цена акции для PUT':calls.strike-calls.putPremium
 }),
 I04:u('₽',{
  'Результат акции без PUT':hedge.exit-hedge.buy,
  'Выплата защитного PUT':Math.max(hedge.putStrike-hedge.exit,0),
  'Общий результат акции с защитным PUT':hedge.exit-hedge.buy+Math.max(hedge.putStrike-hedge.exit,0)-hedge.putPremium,
  'Максимальный убыток защищённой позиции':hedge.buy+hedge.putPremium-hedge.putStrike,
  'Цена акции безубыточности портфеля':hedge.buy+hedge.putPremium
 })
});
export const validateInstrumentReferences=(cases,checkpoints)=>verifyReferenceSet({cases,checkpoints,references:INSTRUMENT_REFERENCES,code:'INSTR'});
