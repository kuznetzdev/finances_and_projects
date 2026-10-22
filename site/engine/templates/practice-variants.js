/** Новые генераторы с несколькими деловыми контекстами и проверяемыми промежуточными шагами.
 * Указанные в условии суммы совпадают с суммами в расчёте; проценты и даты оговорены явно.
 */
import { fmt as F, randomInt as I, oneOf as O, num as q, choice as c, exercise as E } from '../helpers.js';
const money=v=>F(v,2);
const percentage=v=>F(v,2);
const scenarios=(r, variants)=>O(r, variants);
const make=(self,l,title,story,questions,hint,solution,source,audit)=>({
 ...E(self.id,self.topic,title,story,questions,hint,solution,source,l), audit
});
const annuity=(rate,years)=>(1-(1+rate)**(-years))/rate;
const yearsWord=n=>n===2||n===3||n===4?'года':'лет';
const monthsWord=n=>n===2||n===3||n===4?'месяца':'месяцев';

export const templates=[
 {id:'x-invoice-payments',topic:'pl',min:1,build(r,l){
  const context=scenarios(r,['проектное консультирование для корпоративного клиента','внедрение системы управления складом','разработку программного модуля для заказчика']);
  const sales=I(r,8,34)*20, share=O(r,[.4,.5,.6,.7,.8]), cash=sales*share, ar=sales-cash, expenses=sales*O(r,[.4,.45,.5,.55,.6]);
  const net=sales-expenses, cfo=cash-expenses;
  const questions=[q('revenue','Выручка, признанная за период',sales)];
  if(l>=2)questions.push(q('receivable','Дебиторская задолженность клиента на конец периода',ar));
  if(l>=3)questions.push(q('profit','Прибыль до налога',net),q('cfo','Операционный денежный поток',cfo));
  if(l>=4)questions.push(c('cash-equal-profit','Равны ли прибыль и полученные от клиента деньги?',cash===net?'Да':'Нет',['Да','Нет']));
  return make(this,l,'Прибыль и деньги по договору',`Компания завершила ${context} и передала результат клиенту в текущем году. Стоимость работ ${money(sales)} млн ₽ без НДС. До 31 декабря заказчик оплатил ${percentage(share*100)}% стоимости; остаток будет получен в следующем году. Операционные расходы по проекту ${money(expenses)} млн ₽ признаны и полностью оплачены в этом же году. Налог на прибыль, прочие операции и начальные остатки задолженности в данном учебном примере не рассматриваются. Определите показатели за текущий год.`,questions,
  'Не смешивайте передачу результата клиенту с датой банковского платежа. Выручка признаётся по исполнению договора, дебиторка показывает долг клиента, CFO учитывает только фактические денежные поступления и выплаты.',
  [`Выручка после передачи результата = ${money(sales)} млн ₽.`,`Поступление от клиента = ${money(sales)} × ${percentage(share*100)}% = ${money(cash)} млн ₽; дебиторка = ${money(ar)} млн ₽.`,`Прибыль до налога = ${money(sales)} − ${money(expenses)} = ${money(net)} млн ₽.`,`CFO = ${money(cash)} − ${money(expenses)} = ${money(cfo)} млн ₽. Разница между прибылью и CFO равна неоплаченной выручке ${money(ar)}.`],
  'Метод начисления · выручка, дебиторка, CFO',{sales,share,cash,ar,expenses,net,cfo});
 }},
 {id:'x-prepayment-delivery',topic:'links',min:2,build(r,l){
  const context=scenarios(r,['техническую поддержку клиентской платформы','абонентское обслуживание сети магазинов','доступ к корпоративному сервису']);
  const monthly=I(r,2,10),months=I(r,2,9),total=12*monthly,earned=monthly*months,liability=total-earned;
  const questions=[q('received','Деньги, полученные от клиента за год',total),q('revenue','Выручка за оказанные к отчётной дате услуги',earned)];
  if(l>=3)questions.push(q('liability','Обязательство перед клиентом на отчётную дату',liability));
  if(l>=4)questions.push(c('account','Неотработанная часть предоплаты относится к','Обязательствам',['Выручке будущего года, признанной сейчас','Обязательствам','Дебиторской задолженности','Основным средствам']));
  return make(this,l,'Годовая предоплата и признание выручки',`1 января компания получила ${money(total)} млн ₽ без НДС предоплаты за ${context} в течение 12 месяцев. Стоимость каждого месяца одинакова: ${monthly} млн ₽. На отчётную дату успешно оказаны услуги ровно за ${months} полных ${monthsWord(months)}; оставшиеся месяцы ещё не наступили. Возвратов, дополнительных платежей и расходов в задаче нет.`,questions,
  'Предоплата увеличивает деньги сразу, но обязательство перед заказчиком исчезает только по мере оказания услуг. Не признавайте стоимость всех 12 месяцев выручкой в день получения денег.',
  [`Поступившие деньги = ${money(total)} млн ₽.`,`Выручка за ${months} мес. = ${monthly} × ${months} = ${money(earned)} млн ₽.`,`Неотработанная предоплата = ${monthly} × (12 − ${months}) = ${money(liability)} млн ₽, это обязательство до оказания услуг.`],
  'Сопоставление P&L и баланса · авансы',{monthly,months,total,earned,liability});
 }},
 {id:'x-cfo-change-analysis',topic:'cash',min:2,build(r,l){
  const context=scenarios(r,['оптовой торговой компании','производителя запасных частей','дистрибьютора медицинского оборудования']);
  const profit=I(r,9,27)*10,da=I(r,2,9)*5,ar=I(r,2,9)*5,inventory=I(r,1,8)*5,payables=I(r,1,7)*5;
  const wc=ar+inventory-payables,cfo=profit+da-wc;
  const questions=[q('delta-wc','Изменение операционного оборотного капитала (со знаком)',wc)];
  if(l>=3)questions.push(q('cfo','CFO косвенным методом',cfo));
  if(l>=4)questions.push(q('bridge','Корректировка чистой прибыли на амортизацию и оборотный капитал вместе',da-wc));
  return make(this,l,'ОДДС: оборотный капитал и движение денег',`За год у ${context} чистая прибыль составила ${profit} млн ₽. Начисленная за этот же год амортизация ${da} млн ₽ полностью учтена в расходах при расчёте прибыли. Операционная дебиторская задолженность увеличилась на ${ar} млн ₽, запасы — на ${inventory} млн ₽, а кредиторская задолженность поставщикам — на ${payables} млн ₽. Других неденежных статей и изменений операционного капитала нет; налоги и проценты уже учтены в чистой прибыли. Определите показатели для косвенного метода ОДДС.`,questions,
  'Рост дебиторки и запасов связывает деньги и уменьшает CFO. Рост кредиторки поставщикам означает, что часть расходов пока не оплачена. Амортизацию добавляют обратно: она уменьшила прибыль без денежного оттока.',
  [`Прирост операционного оборотного капитала = ${ar} + ${inventory} − ${payables} = ${money(wc)} млн ₽.`,`CFO = ${profit} + ${da} − ${money(wc)} = ${money(cfo)} млн ₽.`,`Совокупная корректировка = +${da} − ${money(wc)} = ${money(da-wc)} млн ₽.`],
  'ОДДС косвенным методом · оборотный капитал',{profit,da,ar,inventory,payables,wc,cfo});
 }},
 {id:'x-year-comparison',topic:'ratios',min:2,build(r,l){
  const context=scenarios(r,['сети производственных мастерских','оператора логистических услуг','дистрибьютора строительных материалов']);
  const last=I(r,8,22)*100,delta=O(r,[-10,-5,5,10,15,20,25]),current=last*(1+delta/100);
  const share=O(r,[.45,.5,.55,.6,.65,.7]),cogs=current*share,change=current-last;
  const questions=[q('change','Абсолютное изменение годовой выручки',change),q('growth','Темп изменения выручки относительно прошлого года',delta,'%')];
  if(l>=3)questions.push(q('vertical','Доля себестоимости в выручке текущего года',share*100,'%'));
  if(l>=4)questions.push(q('gross','Валовая прибыль текущего года',current-cogs));
  return make(this,l,'Горизонтальный и вертикальный анализ отчётности',`Выручка ${context} за предыдущий год составила ${money(last)} млн ₽, за текущий год — ${money(current)} млн ₽. Себестоимость продаж в текущем году равна ${money(cogs)} млн ₽. Показатели приведены без НДС, учётная политика не изменялась, данных о других расходах нет. Сравните динамику выручки и структуру текущего отчёта.`,questions,
  'Горизонтальный анализ сравнивает одну статью между двумя годами. Вертикальный анализ выражает статью как долю выбранной базы внутри одного года (например, себестоимость / выручка).',
  [`Изменение выручки = ${money(current)} − ${money(last)} = ${money(change)} млн ₽.`,`Темп = ${money(change)} / ${money(last)} × 100% = ${percentage(delta)}%.`,`Доля себестоимости = ${money(cogs)} / ${money(current)} × 100% = ${percentage(share*100)}%.`,`Валовая прибыль = ${money(current)} − ${money(cogs)} = ${money(current-cogs)} млн ₽.`],
  'Финансовый анализ · сравнение периодов',{last,current,cogs,share,delta,change});
 }},
 {id:'x-breakeven-units',topic:'model',min:2,build(r,l){
  const context=scenarios(r,['линии фасовки продуктов','мастерской по изготовлению деталей','небольшого пищевого производства']);
  const price=I(r,5,12)*1000,varShare=O(r,[.35,.4,.45,.5,.55,.6]),unitVariable=price*varShare,contribution=price-unitVariable;
  const fixed=I(r,12,44)*100000,units=Math.ceil(fixed/contribution),planned=units+I(r,30,190),profit=planned*contribution-fixed;
  const questions=[q('contribution','Маржинальный доход с одной единицы',contribution,'₽'),q('units','Минимальный целый объём безубыточности',units,'шт.',0)];
  if(l>=3)questions.push(q('revenue','Выручка при минимальном безубыточном объёме',units*price/1e6));
  if(l>=4)questions.push(q('plan','Операционная прибыль при плановом выпуске',profit/1e6));
  return make(this,l,'Точка безубыточности в штуках',`Для ${context} цена одной единицы продукции составляет ${F(price,0)} ₽ без НДС. Переменные затраты на единицу ${F(unitVariable,0)} ₽, а постоянные расходы за месяц ${money(fixed/1e6)} млн ₽. Производство и продажи совпадают; запасов готовой продукции нет. Плановый месячный объём — ${planned} единиц. Амортизация входит в указанные постоянные расходы, проценты и налог на прибыль не рассматриваются. Рассчитайте минимальный целый объём продаж, при котором операционный результат неотрицателен.`,questions,
  'Сначала определите вклад одной единицы в покрытие постоянных затрат: цена минус переменные затраты. Разделите фиксированные расходы на этот вклад. Если получилось дробное число штук, округлите вверх.',
  [`Маржинальный доход на единицу = ${price} − ${F(unitVariable,0)} = ${F(contribution,0)} ₽.`,`Точка безубыточности = округление вверх(${fixed} / ${contribution}) = ${units} единиц.`,`Выручка на пороге = ${units} × ${price} = ${money(units*price/1e6)} млн ₽.`,`Операционная прибыль плана = ${planned} × ${contribution} − ${fixed} = ${money(profit/1e6)} млн ₽.`],
  'Финансовая модель · CVP-анализ',{price,varShare,unitVariable,contribution,fixed,units,planned,profit});
 }},
 {id:'x-credit-covenants',topic:'ratios',min:2,build(r,l){
  const context=scenarios(r,['проекта модернизации завода','инвестиционной программы лизинговой компании','строительства складского комплекса']);
  const cfads=I(r,8,24)*10,ebit=I(r,13,31)*10,interest=I(r,2,6)*10,principal=I(r,3,10)*10,service=interest+principal;
  const threshold=O(r,[1.2,1.3,1.5]),dscr=cfads/service,icr=ebit/interest;
  const questions=[q('service','Полное обслуживание долга за год',service),q('dscr','DSCR: покрытие обслуживания долга',dscr,'раз')];
  if(l>=3)questions.push(q('icr','ICR: покрытие процентных расходов',icr,'раз'));
  if(l>=4)questions.push(c('pass','Соблюдён ли установленный минимум DSCR?',dscr+1e-9>=threshold?'Да':'Нет',['Да','Нет']));
  return make(this,l,'Проверка банковских ковенантов',`Для ${context} денежный поток, доступный для обслуживания долга (CFADS), равен ${cfads} млн ₽ за год. Прибыль до процентов и налога (EBIT) ${ebit} млн ₽. По кредитному договору в том же году нужно уплатить ${interest} млн ₽ процентов и ${principal} млн ₽ основного долга. Договор требует DSCR не ниже ${percentage(threshold)}; ICR по условиям задачи рассчитывается как EBIT / проценты. Других платежей по кредитам нет.`,questions,
  'DSCR (Debt Service Coverage Ratio) проверяет, хватит ли доступного денежного потока на проценты и погашение тела долга вместе. ICR (Interest Coverage Ratio) измеряет покрытие одних процентов результатом деятельности. Это разные знаменатели и числители.',
  [`Обслуживание долга = ${interest} + ${principal} = ${service} млн ₽.`,`DSCR = CFADS / обслуживание = ${cfads} / ${service} = ${percentage(dscr)} раз.`,`ICR = EBIT / проценты = ${ebit} / ${interest} = ${percentage(icr)} раз.`,`Условие DSCR ≥ ${percentage(threshold)} ${dscr>=threshold?'выполнено':'не выполнено'}.`],
  'Финансовые ковенанты · DSCR и ICR',{cfads,ebit,interest,principal,service,threshold,dscr,icr});
 }},
 {id:'x-beta-relever-capm',topic:'valuation',min:3,build(r,l,ctx){
  const context=scenarios(r,['частной производственной компании','оператора дата-центров','логистической платформы']);
  const betaAnalog=O(r,[1.2,1.35,1.5,1.65,1.8]),analogDE=O(r,[.3,.5,.7,.9]),targetDE=O(r,[.2,.4,.6,.8]),tax=ctx.tax.profitRate;
  const riskFree=I(r,6,10),premium=I(r,5,9),rd=I(r,8,12),betaUnlever=betaAnalog/(1+(1-tax)*analogDE),betaOur=betaUnlever*(1+(1-tax)*targetDE),re=riskFree+betaOur*premium;
  const debtShare=targetDE/(1+targetDE),wacc=(1-debtShare)*re+debtShare*rd*(1-tax);
  const questions=[q('unlever','Безрычаговая β отраслевого аналога',betaUnlever,'раз'),q('relever','Рычаговая β оцениваемой компании',betaOur,'раз')];
  if(l>=3)questions.push(q('re','Цена собственного капитала по CAPM',re,'%'));
  if(l>=4)questions.push(q('wacc','WACC при целевой структуре капитала',wacc,'%'));
  return make(this,l,'От рычаговой beta до WACC',`Для оценки ${context} выбран публичный аналог из той же отрасли: его рычаговая beta равна ${percentage(betaAnalog)}, отношение рыночного долга к рыночному капиталу D/E = ${percentage(analogDE)}. Для оцениваемой компании целевое D/E = ${percentage(targetDE)}. Налог на прибыль ${percentage(tax*100)}%, применяется упрощённая формула Хамады с нулевой beta долга и возможностью использовать налоговый щит. Безрисковая ставка ${riskFree}%, премия за рыночный риск ${premium} процентных пунктов, стоимость долга до налогообложения ${rd}%. Оценка структуры капитала выполнена по рыночным величинам.`,questions,
  'Сначала очистите beta аналога от его долга: βu = βl / [1 + (1−T)×D/E]. Затем учтите целевое плечо компании. В CAPM премию умножают на рычаговую beta нашей компании, а в WACC вес долга D/V не совпадает с D/E.',
  [`β без плеча = ${percentage(betaAnalog)} / [1 + (1−${percentage(tax)}) × ${percentage(analogDE)}] = ${percentage(betaUnlever)}.`,`β компании = ${percentage(betaUnlever)} × [1 + (1−${percentage(tax)}) × ${percentage(targetDE)}] = ${percentage(betaOur)}.`,`Re = ${riskFree}% + ${percentage(betaOur)} × ${premium} п.п. = ${percentage(re)}%.`,`Вес долга D/V = ${percentage(targetDE)} / (1 + ${percentage(targetDE)}) = ${percentage(debtShare*100)}%; WACC = ${percentage(wacc)}%.`],
  'Рычаговая beta · CAPM · WACC',{betaAnalog,analogDE,targetDE,tax,riskFree,premium,rd,betaUnlever,betaOur,re,debtShare,wacc});
 }},
 {id:'x-bond-clean-price',topic:'valuation',min:3,build(r,l){
  const context=scenarios(r,['вторичного рынка корпоративного долга','портфеля облигаций страховой компании','котировок корпоративных облигаций']);
  const nominal=O(r,[1000,2000,5000]),couponPct=O(r,[6,8,10,12,14]),yieldPct=O(r,[7,9,11,13,15]),n=I(r,2,5);
  const coupon=nominal*couponPct/100,yieldRate=yieldPct/100,price=Array.from({length:n},(_,i)=>coupon/(1+yieldRate)**(i+1)).reduce((a,b)=>a+b,nominal/(1+yieldRate)**n);
  const premium=price>nominal+0.00001?'Премия':price<nominal-0.00001?'Дисконт':'По номиналу';
  const questions=[q('coupon','Годовой купон по облигации',coupon,'₽')];
  if(l>=3)questions.push(q('price','Теоретическая чистая цена облигации',price,'₽'));
  if(l>=4)questions.push(c('premium','Цена относительно номинала',premium,['Премия','Дисконт','По номиналу']));
  return make(this,l,'Цена облигации при изменении доходности',`При анализе ${context} рассматривается облигация номиналом ${F(nominal,0)} ₽. Она приносит фиксированный годовой купон ${couponPct}% от неизменного номинала; до погашения осталось ${n} полных ${yearsWord(n)}. Требуемая эффективная годовая доходность на дату оценки ${yieldPct}%. Купоны поступают в конце каждого года, в последний год дополнительно выплачивается номинал. Покупка рассматривается в дату купонного платежа, поэтому накопленный купонный доход (НКД) равен нулю и чистая цена совпадает с грязной. Дефолт, налоги и комиссии не рассматриваются.`,questions,
  'Не путайте купон (процент от номинала) с рыночной доходностью, по которой дисконтируется поток. Чистая цена равна текущей стоимости всех будущих купонов плюс приведённый номинал.',
  [`Купон C = ${F(nominal,0)} × ${couponPct}% = ${money(coupon)} ₽ ежегодно.`,`Цена = ${Array.from({length:n},(_,i)=>`${money(coupon)}/(1+${percentage(yieldRate)})^${i+1}`).join(' + ')} + ${nominal}/(1+${percentage(yieldRate)})^${n} = ${money(price)} ₽.`,`Цена ${premium==='Премия'?'выше':premium==='Дисконт'?'ниже':'равна'} номиналу: ${premium.toLowerCase()}.`],
  'Облигации · цена, купон и YTM',{nominal,couponPct,yieldPct,n,coupon,price,premium});
 }},
 {id:'x-equivalent-annual-cost',topic:'valuation',min:3,build(r,l){
  const context=scenarios(r,['охлаждения производственного цеха','обработки металлических деталей','сортировки посылок']);
  const capA=I(r,8,16)*10,lifeA=3,opexA=I(r,20,36);
  const capB=capA+I(r,5,11)*10,lifeB=5;
  let opexB=Math.max(7,opexA-I(r,8,16));
  const rate=O(r,[.08,.1,.12,.14]),afA=annuity(rate,lifeA),afB=annuity(rate,lifeB),eacA=capA/afA+opexA;
  let eacB=capB/afB+opexB;
  if(Math.abs(eacA-eacB)<2){opexB+=5;eacB=capB/afB+opexB;}
  const pvA=capA+opexA*afA,pvB=capB+opexB*afB;
  const questions=[q('pva','Приведённые затраты варианта А',pvA),q('eaca','EAC варианта А',eacA,'млн ₽/год'),q('eacb','EAC варианта Б',eacB,'млн ₽/год')];
  if(l>=4)questions.push(q('pvb','Приведённые затраты варианта Б',pvB),c('winner','Какой вариант дешевле в пересчёте на один год?',eacA<eacB?'А':'Б',['А','Б']));
  return make(this,l,'EAC: сравнение оборудования с разным сроком службы',`Предприятие выбирает оборудование для ${context}. Рассматриваются два варианта, выполняющих одинаковую работу и позволяющих поддерживать требуемую мощность. Вариант А: затраты на покупку сегодня ${capA} млн ₽, ежегодное обслуживание ${opexA} млн ₽, срок службы ${lifeA} года. Вариант Б: покупка сегодня ${capB} млн ₽, ежегодное обслуживание ${opexB} млн ₽, срок службы ${lifeB} лет. Расходы на обслуживание оплачиваются в конце каждого года. Ставка дисконтирования ${percentage(rate*100)}% годовых. Остаточная стоимость нулевая, налоги, инфляция и разница в производительности отсутствуют. Считаем, что оборудование можно заменять аналогичным на тех же условиях, так что сроки службы допустимо сравнивать через EAC.`,questions,
  'EAC расшифровывается как Equivalent Annual Cost, эквивалентные годовые затраты. Сначала приведите все затраты к моменту покупки, затем поделите их PV на коэффициент аннуитета для соответствующего срока. Для одинакового результата работы выбирают меньший EAC, а не меньший начальный CAPEX.',
  [`Аннуитетный фактор А = ${percentage(afA)}; PV затрат А = ${capA} + ${opexA} × ${percentage(afA)} = ${money(pvA)} млн ₽.`,`EAC А = ${money(pvA)} / ${percentage(afA)} = ${money(eacA)} млн ₽/год.`,`Аннуитетный фактор Б = ${percentage(afB)}; PV затрат Б = ${capB} + ${opexB} × ${percentage(afB)} = ${money(pvB)} млн ₽.`,`EAC Б = ${money(pvB)} / ${percentage(afB)} = ${money(eacB)} млн ₽/год.`,`Меньшие ежегодные затраты у варианта ${eacA<eacB?'А':'Б'}; для данной одинаковой услуги он предпочтительнее.`],
  'Инвестиционные проекты · Equivalent Annual Cost',{capA,lifeA,opexA,capB,lifeB,opexB,rate,afA,afB,pvA,pvB,eacA,eacB});
 }},
 {id:'x-npv-nwc-return',topic:'valuation',min:3,build(r,l){
  const context=scenarios(r,['запуск производственной линии по выпуску упаковки','создание центра обслуживания промышленного оборудования','проект аренды и комплектации складских помещений']);
  const capex=I(r,8,17)*100,nwc=I(r,8,23)*10,rate=I(r,8,16)/100,n=4,operating=[0,1,2,3].map(()=>I(r,35,66)*10),salvage=I(r,8,24)*10;
  const initial=capex+nwc,terminal=operating[3]+salvage+nwc,pv=operating.reduce((s,x,i)=>s+(i===3?terminal:x)/(1+rate)**(i+1),0),npv=pv-initial;
  const questions=[q('initial','Инвестиции и вложения в оборотный капитал в момент t=0',initial),q('terminal','Денежный поток четвёртого года со всеми возвратами',terminal)];
  if(l>=3)questions.push(q('npv','Чистая приведённая стоимость проекта (NPV)',npv));
  if(l>=4)questions.push(c('decision','Принять ли проект по правилу NPV?',npv>0?'Да':'Нет',['Да','Нет']));
  return make(this,l,'NPV с возвратом оборотного капитала',`Компания оценивает ${context}. В момент начала проекта необходимо оплатить оборудование ${capex} млн ₽ и дополнительно вложить ${nwc} млн ₽ в чистый операционный оборотный капитал. Операционные свободные денежные потоки после налога и без учёта указанных стартовых вложений по годам 1–4 составят ${operating.map(x=>money(x)).join(', ')} млн ₽. В конце четвёртого года оборудование продаётся за ${salvage} млн ₽ (это денежная сумма после всех налогов), весь дополнительный оборотный капитал возвращается. Ставка дисконтирования ${percentage(rate*100)}% годовых, все годовые потоки поступают в конце соответствующего года, иных денежных операций нет.`,questions,
  'В момент t=0 учитывайте сразу CAPEX и связанный оборотный капитал со знаком минус. В последнем году к операционному потоку прибавьте чистую цену продажи оборудования и возврат оборотного капитала, но только один раз.',
  [`Первоначальный поток = −(${capex} + ${nwc}) = −${initial} млн ₽.`,`Поток в конце года 4 = ${operating[3]} + ${salvage} + ${nwc} = ${terminal} млн ₽.`,`PV всех поступлений = ${operating.slice(0,3).map((x,i)=>`${x}/(1+${percentage(rate)})^${i+1}`).join(' + ')} + ${terminal}/(1+${percentage(rate)})^4 = ${money(pv)} млн ₽.`,`NPV = ${money(pv)} − ${initial} = ${money(npv)} млн ₽. ${npv>0?'Положительная NPV поддерживает принятие проекта по финансовому критерию.':'Отрицательная NPV означает, что проект не покрывает требуемую доходность.'}`],
  'Оценка проектов · NPV с изменением NWC',{capex,nwc,rate,n,operating,salvage,initial,terminal,pv,npv});
 }},
 {id:'x-dcf-operating-equity',topic:'valuation',min:4,build(r,l){
  const context=scenarios(r,['сервиса промышленного мониторинга','оператора контрактной логистики','производителя сервисного оборудования']);
  const fcff1=I(r,15,28)*10,fcff2=fcff1+I(r,2,7)*10,fcff3=fcff2+I(r,2,7)*10;
  const wacc=I(r,11,17)/100,g=O(r,[.02,.025,.03,.035,.04]),tv=fcff3*(1+g)/(wacc-g);
  const pvFcff=fcff1/(1+wacc)+fcff2/(1+wacc)**2+fcff3/(1+wacc)**3,pvTv=tv/(1+wacc)**3,ev=pvFcff+pvTv;
  const debt=Math.round(ev*O(r,[.2,.25,.3,.35])/10)*10,cash=I(r,5,16)*10,equity=ev-debt+cash;
  const questions=[q('terminal','Терминальная стоимость на конец третьего года',tv),q('pvterminal','PV терминальной стоимости сегодня',pvTv),q('ev','Операционная стоимость бизнеса EV',ev),q('equity','Стоимость акционерам Equity Value',equity)];
  return make(this,l,'DCF: FCFF, терминал и переход к стоимости капитала',`Для ${context} аналитик прогнозирует свободный денежный поток всем инвесторам (FCFF) в конце ближайших трёх лет: ${fcff1}, ${fcff2} и ${fcff3} млн ₽. Ставка средневзвешенной стоимости капитала WACC ${percentage(wacc*100)}% годовых. Начиная с четвёртого года FCFF стабильно растёт на ${percentage(g*100)}% ежегодно, что меньше WACC; терминальную стоимость рассчитывают моделью Гордона на конец третьего года. Рыночный процентный долг на дату оценки ${debt} млн ₽, свободные избыточные деньги ${cash} млн ₽; иных корректировок между EV и Equity Value нет.`,questions,
  'Поток FCFF дисконтируйте по WACC. Терминал TV = FCFF следующего года / (WACC−g) считается на конец третьего года и ещё должен быть дисконтирован к сегодняшней дате. Стоимость акционерам = EV − долг + избыточные деньги.',
  [`TV на конец года 3 = ${fcff3} × (1 + ${percentage(g)}) / (${percentage(wacc)} − ${percentage(g)}) = ${money(tv)} млн ₽.`,`PV терминала = ${money(tv)} / (1 + ${percentage(wacc)})^3 = ${money(pvTv)} млн ₽.`,`PV явных FCFF = ${money(pvFcff)} млн ₽, EV = ${money(pvFcff)} + ${money(pvTv)} = ${money(ev)} млн ₽.`,`Equity Value = ${money(ev)} − ${debt} + ${cash} = ${money(equity)} млн ₽.`],
  'DCF · Free Cash Flow to Firm · Enterprise Value',{fcff1,fcff2,fcff3,wacc,g,tv,pvFcff,pvTv,ev,debt,cash,equity});
 }},
 {id:'x-cash-cycle-factors',topic:'ratios',min:3,build(r,l){
  const context=scenarios(r,['торговой сети','производителя комплектующих','сети дистрибьюторских складов']);
  const dio=I(r,5,9)*10,dso=I(r,4,8)*10,dpo=I(r,2,6)*10;
  const shorterInv=I(r,5,12),shorterAR=I(r,5,12),longerPay=I(r,5,12),before=dio+dso-dpo;
  const after=(dio-shorterInv)+(dso-shorterAR)-(dpo+longerPay),improvement=before-after;
  const questions=[q('before','Денежный цикл до изменений',before,'дней'),q('after','Денежный цикл после изменений',after,'дней')];
  if(l>=4)questions.push(q('improve','На сколько дней сократился цикл',improvement,'дней'));
  return make(this,l,'Оборачиваемость и денежный цикл',`У ${context} средний срок нахождения средств в запасах (DIO) составляет ${dio} дней, получения оплаты от покупателей (DSO) — ${dso} дней, оплаты поставщикам (DPO) — ${dpo} дней. Планируется ускорить оборачиваемость запасов на ${shorterInv} дней, уменьшить ожидание оплаты покупателей на ${shorterAR} дней и увеличить отсрочку поставщиков на ${longerPay} дней. Значения после изменений остаются положительными; остальные условия не меняются.`,questions,
  'Денежный цикл = DIO + DSO − DPO. Важно не перепутать знак: увеличение срока расчёта с поставщиками сокращает денежный цикл, а не удлиняет его.',
  [`Старый цикл = ${dio} + ${dso} − ${dpo} = ${before} дней.`,`Новый цикл = (${dio} − ${shorterInv}) + (${dso} − ${shorterAR}) − (${dpo} + ${longerPay}) = ${after} дней.`,`Сокращение = ${before} − ${after} = ${improvement} дней.`],
  'Оборачиваемость · DIO, DSO, DPO и CCC',{dio,dso,dpo,shorterInv,shorterAR,longerPay,before,after,improvement});
 }},
 {id:'x-venture-next-round',topic:'valuation',min:3,build(r,l){
  const context=scenarios(r,['технологического стартапа','разработчика промышленного программного обеспечения','компании в сфере медицинского оборудования']);
  const pre=I(r,20,75)*10,invest=I(r,8,25)*10,post=pre+invest,stake=invest/post*100,founders=100-stake;
  const multiplier=O(r,[1.5,2,2.5,3]),exit=post*multiplier,investProceeds=exit*stake/100;
  const questions=[q('post','Post-money стоимость после инвестиций',post),q('stake','Доля нового инвестора после раунда',stake,'%'),q('founders','Доля основателей после раунда',founders,'%')];
  if(l>=4)questions.push(q('exit','Поступления инвестора при заданной оценке выхода',investProceeds));
  return make(this,l,'Венчурный раунд: оценка и доли',`Основатели владеют 100% акций ${context}. Инвестор согласовал оценку компании до инвестиций (pre-money) в ${pre} млн ₽ и переводит непосредственно в компанию ${invest} млн ₽ за вновь выпускаемые обыкновенные акции. Доля основателей не продаётся, опционного пула, комиссий и привилегированных прав нет. Через несколько лет все акции могут быть проданы по оценке всего капитала ${exit} млн ₽; для расчёта последнего этапа новые раунды и дивиденды не рассматриваются.`,questions,
  'Post-money (стоимость после привлечения денег) = pre-money + новые инвестиции. Доля инвестора — отношение внесённых денег к post-money, а не к pre-money. При пропорциональном выходе поступления зависят от доли, а не только от цены бизнеса.',
  [`Post-money = ${pre} + ${invest} = ${post} млн ₽.`,`Доля нового инвестора = ${invest} / ${post} × 100% = ${percentage(stake)}%.`,`Доля основателей = 100% − ${percentage(stake)}% = ${percentage(founders)}%.`,`Поступления инвестора на выходе = ${exit} × ${percentage(stake)}% = ${money(investProceeds)} млн ₽.`],
  'Pre-money/Post-money · cap table',{pre,invest,post,stake,founders,multiplier,exit,investProceeds});
 }},
 {id:'x-discount-tax-savings',topic:'tax',min:3,build(r,l,ctx){
  const context=scenarios(r,['станок для упаковки','производственную линию','автоматизированный комплекс тестирования']);
  const life=O(r,[4,5]),cost=I(r,4,14)*100,rate=O(r,[.08,.1,.12]),tax=ctx.tax.profitRate;
  const linear=cost/life,den=life*(life+1)/2;
  const years=Array.from({length:life},(_,i)=>i+1);
  const linShields=years.map(()=>linear*tax),accShields=years.map(year=>cost*(life-year+1)/den*tax);
  const pvLinear=linShields.reduce((s,x,i)=>s+x/(1+rate)**(i+1),0),pvAcc=accShields.reduce((s,x,i)=>s+x/(1+rate)**(i+1),0);
  const questions=[q('linear','Амортизация за первый год линейным способом',linear),q('accelerated','Амортизация первого года по сумме чисел лет',accShields[0]/tax)];
  if(l>=3)questions.push(q('tax','Экономия налога в первом году по ускоренному методу',accShields[0]));
  if(l>=4)questions.push(q('pv-delta','Прирост PV налоговой экономии из-за ускорения',pvAcc-pvLinear));
  return make(this,l,'Амортизация: налоговый щит и время получения экономии',`Компания приобрела ${context} стоимостью ${cost} млн ₽, срок полезного использования ${life} ${yearsWord(life)}, ликвидационная стоимость нулевая. В учебной модели сравниваются линейная амортизация и метод суммы чисел лет. Прямо предполагается, что оба графика разрешены для расчёта налогооблагаемой прибыли, а прибыль во все годы достаточна для полной налоговой экономии. Ставка налога на прибыль ${percentage(tax*100)}%, ставка дисконтирования налоговых выгод ${percentage(rate*100)}%, налоговая экономия возникает в конце каждого года. Это упрощённое сравнительное упражнение, а не утверждение о доступности метода в конкретном налоговом режиме РФ.`,questions,
  'Налоговый щит каждого года = налоговая амортизация × ставка налога, если есть прибыль для вычета. Метод суммы чисел лет относит большую долю стоимости на ранние годы, поэтому при равной сумме амортизации ценность налоговой экономии во времени может быть выше.',
  [`Линейная амортизация = ${cost}/${life} = ${money(linear)} млн ₽/год.`,`По сумме чисел лет: сумма коэффициентов = ${den}; первый год = ${cost} × ${life}/${den} = ${money(accShields[0]/tax)} млн ₽.`,`Щит за первый год = ${money(accShields[0]/tax)} × ${percentage(tax*100)}% = ${money(accShields[0])} млн ₽.`,`PV щита линейного графика = ${money(pvLinear)} млн ₽, ускоренного = ${money(pvAcc)} млн ₽; выигрыш в PV = ${money(pvAcc-pvLinear)} млн ₽.`],
  'Амортизационная политика · налоговая экономия',{life,cost,rate,tax,linear,den,linShields,accShields,pvLinear,pvAcc});
 }}
];