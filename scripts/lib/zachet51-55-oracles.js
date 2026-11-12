/** Independent reference arithmetic for original user-provided problems 51–55.
 * Does not import the cases, their checkpoints, or their stored answers.
 */
import {unitReferences as u, presentValue as pv} from './audit-reference-core.js';

const p1={tax:.25,wacc:.12,initial:1000,pSuccess:.6,goodEbit:600,badEbit:200,expansion:400,deltaEbit:.5};
const f51g=p1.goodEbit*(1-p1.tax),f51b=p1.badEbit*(1-p1.tax);
const e51=p1.pSuccess*f51g+(1-p1.pSuccess)*f51b;
const base51=-p1.initial+e51/(1+p1.wacc);
const exercise51=-p1.expansion+pv(Array(4).fill(p1.goodEbit*p1.deltaEbit*(1-p1.tax)),p1.wacc);
const option51=p1.pSuccess*Math.max(exercise51,0)/(1+p1.wacc);

const p2={tax:.20,wacc:.15,initial:800,pSuccess:.7,goodEbit:500,badEbit:-100,book:700,recovery:.4};
const f52g=p2.goodEbit*(1-p2.tax),f52b=p2.badEbit*(1-p2.tax);
const e52=p2.pSuccess*f52g+(1-p2.pSuccess)*f52b;
const base52=-p2.initial+e52/(1+p2.wacc);
const sale52=p2.book*p2.recovery,shield52=(p2.book-sale52)*p2.tax;
const option52=(1-p2.pSuccess)*(sale52+shield52)/(1+p2.wacc);

const p3={tax:.20,wacc:.10,initial:1000,pSuccess:.5,goodEbit:2000,badEbit:200};
const f53g=p3.goodEbit*(1-p3.tax),f53b=p3.badEbit*(1-p3.tax);
const e53=p3.pSuccess*f53g+(1-p3.pSuccess)*f53b;
const now53=-p3.initial+e53/(1+p3.wacc);
const exercise53=-p3.initial+f53g/(1+p3.wacc);
const wait53=p3.pSuccess*Math.max(exercise53,0)/(1+p3.wacc);

const p4={tax:.25,wacc:.12,initial:800,pHigh:.6,highEbitA:500,lowEbitA:200,switchCost:100,ebitB:400};
const f54g=p4.highEbitA*(1-p4.tax),f54b=p4.lowEbitA*(1-p4.tax);
const e54=p4.pHigh*f54g+(1-p4.pHigh)*f54b;
const base54=-p4.initial+e54/(1+p4.wacc);
const f54B=p4.ebitB*(1-p4.tax);
const exercise54=-p4.switchCost+f54B/(1+p4.wacc);
const option54=(1-p4.pHigh)*Math.max(exercise54,0)/(1+p4.wacc);

const p5={tax:.25,wacc:.12,pSuccess:.5,goodEbit:900,badEbit:300,netDebt:200,expandCost:600,expandEbit:400};
const f55g=p5.goodEbit*(1-p5.tax),f55b=p5.badEbit*(1-p5.tax);
const e55=p5.pSuccess*f55g+(1-p5.pSuccess)*f55b;
const ev55=e55/(1+p5.wacc);
const f55extra=p5.expandEbit*(1-p5.tax);
const exercise55=-p5.expandCost+pv(Array(4).fill(f55extra),p5.wacc);
const option55=p5.pSuccess*Math.max(exercise55,0)/(1+p5.wacc);

export const ZACHET51_55_REFERENCES=Object.freeze({
 'ZACHET50-51':u('ден. ед.',{
  'FCFF при успехе в году 1':f51g,
  'FCFF при неудаче в году 1':f51b,
  'Ожидаемый FCFF года 1':e51,
  'NPV без опциона':base51,
  'NPV расширения на конец года 1':exercise51,
  'Стоимость опциона сегодня':option51,
  'NPV с опционом':base51+option51
 }),
 'ZACHET50-52':u('ден. ед.',{
  'FCFF успеха':f52g,
  'FCFF при операционном убытке':f52b,
  'Ожидаемый FCFF года 1':e52,
  'NPV без опциона':base52,
  'Цена продажи оборудования':sale52,
  'Дополнительный налоговый щит продажи':shield52,
  'Поступление от ликвидации после налога':sale52+shield52,
  'Стоимость опциона сегодня':option52,
  'NPV с опционом':base52+option52
 }),
 'ZACHET50-53':u('ден. ед.',{
  'FCFF успеха при запуске сейчас':f53g,
  'FCFF неудачи при запуске сейчас':f53b,
  'Ожидаемый FCFF первого года':e53,
  'NPV запуска сейчас':now53,
  'NPV успешной отсрочки на конец года 1':exercise53,
  'NPV стратегии отсрочки сегодня':wait53,
  'Стоимость опциона относительно обязательного запуска':wait53-now53
 }),
 'ZACHET50-54':u('ден. ед.',{
  'FCFF высоких продаж А':f54g,
  'FCFF низких продаж А':f54b,
  'Ожидаемый FCFF первого года':e54,
  'NPV без опциона':base54,
  'FCFF продукта Б в году 2':f54B,
  'NPV переключения на конец года 1':exercise54,
  'Стоимость опциона сегодня':option54,
  'NPV с опционом':base54+option54
 }),
 'ZACHET50-55':u('ден. ед.',{
  'FCFF года 1 при успехе':f55g,
  'FCFF года 1 при неудаче':f55b,
  'Ожидаемый FCFF года 1':e55,
  'EV без опциона':ev55,
  'Дополнительный FCFF при расширении':f55extra,
  'NPV масштабирования на конец года 1':exercise55,
  'Стоимость опциона сегодня':option55,
  'EV с опционом':ev55+option55,
  'Equity без опциона':ev55-p5.netDebt,
  'Equity с опционом':ev55+option55-p5.netDebt
 })
});
