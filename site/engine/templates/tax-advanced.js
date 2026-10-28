/** Итерация 1: амортизация, налоги и денежные потоки.
 * Сравнительные налоговые методы учебные: их юридическая допустимость не предполагается.
 */
import {fmt as F,randomInt as I,oneOf as O,num as q,exercise as E} from '../helpers.js';

const sum=a=>a.reduce((x,y)=>x+y,0);
const pv=(values,r)=>sum(values.map((v,i)=>v/(1+r)**(i+1)));
const money=n=>F(n,2);
const pct=n=>F(n*100,2)+'%';
const make=(self,level,title,story,questions,hint,steps,source,audit)=>({
 ...E(self.id,self.topic,title,story,questions,hint,steps,source,level),audit
});

function decliningSchedule(cost,life){
 let remaining=cost;
 return Array.from({length:life},(_,i)=>{
  const yearsLeft=life-i;
  const amount=yearsLeft===1?remaining:Math.max(remaining*2/life,remaining/yearsLeft);
  remaining-=amount;
  return amount;
 });
}

export const templates=[
 {id:'tax-depreciation-method-comparison',topic:'tax',min:2,build(r,l,ctx){
  const cost=I(r,5,14)*100,life=O(r,[4,5,6]),tax=ctx.tax.profitRate,rate=O(r,[.08,.10,.12,.14]);
  const linear=Array(life).fill(cost/life);
  const denominator=life*(life+1)/2;
  const sumYears=Array.from({length:life},(_,i)=>cost*(life-i)/denominator);
  const declining=decliningSchedule(cost,life);
  const pvLinear=pv(linear,rate)*tax,pvDeclining=pv(declining,rate)*tax,pvSyd=pv(sumYears,rate)*tax;
  const questions=[q('linear-first','Амортизация первого года линейным методом',linear[0]),
   q('declining-first','Амортизация первого года методом уменьшаемого остатка',declining[0])];
  if(l>=3)questions.push(q('syd-first','Амортизация первого года по сумме чисел лет',sumYears[0]));
  if(l>=4)questions.push(q('pv-linear','PV налоговой экономии при линейном методе',pvLinear),
   q('pv-accelerated','PV налоговой экономии при уменьшаемом остатке',pvDeclining),
   q('pv-difference','Дополнительная PV экономии против линейного метода',pvDeclining-pvLinear));
  return make(this,l,'Три метода амортизации и налоговый щит',
   'Учебная сравнительная модель: оборудование стоит '+cost+' млн ₽ и полностью амортизируется за '+life+' лет без остаточной стоимости. Сравните линейный метод, метод суммы чисел лет и уменьшаемый остаток с коэффициентом 2. В методе уменьшаемого остатка ежегодно переходят на линейное списание оставшейся стоимости, если оно больше, чтобы к концу срока остаток стал нулевым. Все три графика условно разрешены для налога на прибыль. Налогооблагаемой прибыли достаточно, налог '+pct(tax)+', налоговая экономия приходит в конце каждого года; дисконтирование '+pct(rate)+'. CAPEX произведён сегодня и одинаков при всех методах.',
   questions,
   'Сначала составьте три графика амортизации по годам. Налоговая экономия года равна налоговой амортизации × T, а сегодняшняя стоимость учитывает момент получения денег.',
   ['Линейная амортизация за год: '+money(cost)+' / '+life+' = '+money(linear[0])+' млн ₽.',
    'Сумма чисел лет: '+denominator+'; в первом году '+money(cost)+' × '+life+'/'+denominator+' = '+money(sumYears[0])+' млн ₽.',
    'Уменьшаемый остаток в первый год: '+money(cost)+' × 2/'+life+' = '+money(declining[0])+' млн ₽; далее используется больший из уменьшаемого остатка и линейного списания остатка.',
    'Амортизация за весь срок: '+money(sum(linear))+' / '+money(sum(declining))+' / '+money(sum(sumYears))+' млн ₽ соответственно.',
    'PV щита: линейный '+money(pvLinear)+', уменьшаемый остаток '+money(pvDeclining)+', сумма чисел лет '+money(pvSyd)+' млн ₽. Прирост PV по отношению к линейному: '+money(pvDeclining-pvLinear)+' млн ₽.',
    'Методы меняют сроки налоговой экономии, но не исходный CAPEX. Это условная учебная модель, а не перечень налоговых методов, разрешённых в конкретной юрисдикции.'],
   'Амортизационная политика, 2026, стр. 2–7; учебное сравнение',{cost,life,tax,rate,linear,declining,sumYears,pvLinear,pvDeclining,pvSyd});
 }},
 {id:'tax-temporary-differences',topic:'tax',min:2,build(r,l,ctx){
  const cost=I(r,5,14)*100,life=O(r,[4,5,6]),tax=ctx.tax.profitRate;
  const bookDep=cost/life,taxDep=cost*life/(life*(life+1)/2);
  const bookProfit=cost*.5+I(r,10,25)*10;
  const taxable=bookProfit+bookDep-taxDep;
  const currentTax=taxable*tax;
  const dtl=(taxDep-bookDep)*tax;
  const deferredExpense=dtl;
  const questions=[q('book-dep','Бухгалтерская амортизация первого года',bookDep),
   q('tax-dep','Налоговая амортизация первого года',taxDep)];
  if(l>=3)questions.push(q('taxable','Налоговая прибыль первого года',taxable),q('current-tax','Текущий налог на прибыль',currentTax));
  if(l>=4)questions.push(q('dtl','Отложенное налоговое обязательство на конец года',dtl),
   q('total-tax','Совокупный расход по налогу на прибыль в P&L',currentTax+deferredExpense));
  return make(this,l,'Бухгалтерская и налоговая амортизация: временная разница',
   'Учебная модель по принципам IAS 12: куплен и введён в эксплуатацию актив стоимостью '+cost+' млн ₽, срок '+life+' лет, остаточная стоимость нулевая. В бухгалтерской отчётности применяется линейная амортизация, в налоговой базе условно допустим метод суммы чисел лет. Прибыль до налога по бухгалтерскому P&L за первый год '+money(bookProfit)+' млн ₽, прочих разниц нет. Налог '+pct(tax)+', его ставка не меняется, будущая прибыль достаточна для погашения временной разницы. Платёж налога равен текущему налогу года. На начало года отложенных налогов нет.',
   questions,
   'Налоговая прибыль = бухгалтерская прибыль + бухгалтерская амортизация − налоговая амортизация. Если налоговая амортизация быстрее, балансовая стоимость актива превышает налоговую базу.',
   ['Бухгалтерская амортизация = '+money(bookDep)+' млн ₽, налоговая по сумме чисел лет = '+money(taxDep)+' млн ₽.',
    'Налогооблагаемая прибыль = '+money(bookProfit)+' + '+money(bookDep)+' − '+money(taxDep)+' = '+money(taxable)+' млн ₽.',
    'Текущий налог = '+money(taxable)+' × '+pct(tax)+' = '+money(currentTax)+' млн ₽.',
    'Налогооблагаемая временная разница = '+money(taxDep-bookDep)+' млн ₽; ОНО = '+money(dtl)+' млн ₽.',
    'Расход по отложенному налогу = прирост ОНО = '+money(deferredExpense)+' млн ₽, а совокупный налоговый расход в P&L = '+money(currentTax+deferredExpense)+' млн ₽.',
    'В этой модели отложенный налог не равен текущему денежному платежу. Допустимость налогового графика является отдельным допущением.'],
   'Лекция 3 МФТИ: налоги и финансовое моделирование; модель IAS 12 (упрощение)',{cost,life,tax,bookDep,taxDep,bookProfit,taxable,currentTax,dtl,deferredExpense});
 }},
 {id:'tax-payments-schedule',topic:'tax',min:2,build(r,l,ctx){
  const tax=ctx.tax.profitRate;
  const quarterlyProfit=Array.from({length:4},()=>I(r,12,35)*10);
  const accrued=quarterlyProfit.map(x=>x*tax);
  const paid=[0,accrued[0],accrued[1],accrued[2]];
  const endPayable=accrued[3];
  const questions=[q('q1-accrued','Налог, начисленный в первом квартале',accrued[0]),
   q('q2-paid','Уплата налога во втором квартале',paid[1])];
  if(l>=3)questions.push(q('accrued-total','Начисленный налог за четыре квартала',sum(accrued)),
   q('cash-paid','Фактически уплачено налога за четыре квартала',sum(paid)));
  if(l>=4)questions.push(q('end-payable','Кредиторская задолженность по налогу на конец года',endPayable),
   q('q4-tax-cash','Денежный отток налога в четвёртом квартале',-paid[3]));
  return make(this,l,'Начисление налога и денежный календарь',
   'Учебная модель платёжного календаря, не календарь обязательных платежей ФНС. Налог на прибыль '+pct(tax)+', облагаемая прибыль по кварталам: '+quarterlyProfit.map(x=>money(x)).join(' / ')+' млн ₽. Налог начисляется в конце каждого квартала, а уплачивается полностью в следующем квартале. На начало года налогового долга и авансов нет. В четвёртом квартале уплачивается налог третьего квартала, а налог четвёртого будет уплачен уже в следующем году.',
   questions,
   'Начисление отражает налоговый расход, фактический платёж отражается в CFO. Закройте календарь тождеством: долг на конец = долг на начало + начислено − оплачено.',
   ['Начисление по кварталам = '+accrued.map(x=>money(x)).join(' / ')+' млн ₽.',
    'Денежные выплаты по кварталам = '+paid.map(x=>money(x)).join(' / ')+' млн ₽.',
    'Сумма начислений = '+money(sum(accrued))+' млн ₽, сумма выплат = '+money(sum(paid))+' млн ₽.',
    'Долг перед бюджетом на конец года = '+money(sum(accrued))+' − '+money(sum(paid))+' = '+money(endPayable)+' млн ₽.',
    'Отток денег в четвёртом квартале = −'+money(paid[3])+' млн ₽. Налог четвёртого квартала ещё не выплачен.'],
   'Лекция 3 МФТИ: налоговый учёт и финансовое моделирование; учебный календарь',{tax,quarterlyProfit,accrued,paid,endPayable});
 }},
 {id:'tax-loss-carryforward',topic:'tax',min:3,build(r,l,ctx){
  const tax=ctx.tax.profitRate,initialLoss=I(r,10,22)*10;
  const profits=Array.from({length:3},()=>I(r,5,12)*10),capFraction=O(r,[.5,1]);
  let loss=initialLoss;
  const used=[],taxable=[];
  for(const profit of profits){
   const allowance=Math.min(loss,profit*capFraction);
   used.push(allowance);
   taxable.push(profit-allowance);
   loss-=allowance;
  }
  const endLoss=loss,totalTax=sum(taxable)*tax,totalShield=sum(used)*tax;
  const questions=[q('year1-used','Перенос убытка, использованный в первом году',used[0]),
   q('year1-tax','Текущий налог за первый год',taxable[0]*tax)];
  if(l>=3)questions.push(q('used-total','Общая сумма использованного убытка',sum(used)),
   q('tax-total','Налог за три года с учётом переноса',totalTax));
  if(l>=4)questions.push(q('loss-end','Оставшийся убыток для будущих периодов',endLoss),
   q('tax-saved','Экономия налога за три года относительно отсутствия убытка',totalShield));
  return make(this,l,'Перенос налоговых убытков на будущие периоды',
   'Учебная модель, не норматив РФ: первоначальный переносимый налоговый убыток '+initialLoss+' млн ₽. Налогооблагаемая прибыль до учёта переносимого убытка за следующие три года: '+profits.join(' / ')+' млн ₽. По специально заданному условию ежегодно разрешено уменьшить прибыль убытком максимум на '+pct(capFraction)+' её величины и не больше ещё не использованного остатка убытка. Налог на прибыль '+pct(tax)+', новых убытков и иных корректировок нет. Признание отложенного налогового актива в бухгалтерском учёте здесь не предполагается.',
   questions,
   'В каждом году используйте минимум из остатка убытка и установленного в условии лимита от прибыли. Только непокрытая часть прибыли облагается налогом.',
   ['Прибыль до переноса по годам = '+profits.join(', ')+' млн ₽; лимит использования за год '+pct(capFraction)+'.',
    'Использовано убытка по годам: '+used.map(x=>money(x)).join(' / ')+' млн ₽.',
    'Налоговая прибыль после зачёта: '+taxable.map(x=>money(x)).join(' / ')+' млн ₽.',
    'Налог за три года = '+money(totalTax)+' млн ₽, экономия налога = '+money(totalShield)+' млн ₽.',
    'Неиспользованный остаток убытка = '+money(endLoss)+' млн ₽. Налоговая экономия не означает автоматического признания отложенного налогового актива.'],
   'Лекция 3 МФТИ: налогообложение и отложенные налоги; учебный сценарий',{tax,initialLoss,profits,capFraction,used,taxable,endLoss,totalTax,totalShield});
 }}
];
