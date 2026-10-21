/**
 * ФинПрактика: детерминированный генератор упражнений.
 * Все суммы в млн руб., если явно не указано иное.
 * Налоговые эффекты учитываются только если это сказано в условии.
 */
export const TOPICS = [
  { id: 'all', name: 'Все темы', short: 'Все', icon: '◈' },
  { id: 'pl', name: 'Отчёт о прибылях и убытках', short: 'P&L', icon: '▤' },
  { id: 'cash', name: 'Денежные потоки', short: 'Cash Flow', icon: '⇄' },
  { id: 'balance', name: 'Баланс', short: 'Balance Sheet', icon: '▦' },
  { id: 'links', name: 'Связь трёх форм', short: 'Три формы', icon: '⌁' },
  { id: 'valuation', name: 'Оценка проектов', short: 'Оценка', icon: '◇' }
];
export const LEVELS = [
  { id: 1, title: 'Разминка', desc: 'Простые числа и одна-две операции' },
  { id: 2, title: 'Практика', desc: 'Несколько связанных показателей' },
  { id: 3, title: 'Экзамен', desc: 'Сложные условия и ловушки' },
  { id: 4, title: 'Эксперт', desc: 'Больше вычислений и неоднозначностей' }
];

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
function n(r, min, max, step = 1) {
  const count = Math.floor((max - min) / step + 1e-8);
  return round(min + Math.floor(r() * (count + 1)) * step, 4);
}
function pick(r, xs) { return xs[Math.floor(r() * xs.length)]; }
const round = (x, digits = 2) => Number(x.toFixed(digits));
const fmt = (x, digits = 2) => Number(x.toFixed(digits)).toLocaleString('ru-RU', { maximumFractionDigits: digits });
function q(key, label, answer, unit = 'млн ₽', tolerance = .011) {
  return { key, label, answer: round(answer, 4), unit, type: 'number', tolerance };
}
function option(key, label, answer, choices) {
  return { key, label, answer, choices, type: 'choice' };
}
function task({ id, topic, title, level, story, questions, hint, explanation, source, extra = false }) {
  return { id, topic, title, level, story, questions, hint, explanation, source, extra };
}
const noTaxes = 'НДС и налог на прибыль в этом задании не учитываются. Других операций не было.';

const templates = [
  {
    id: 'pl-basics', topic: 'pl', min: 1,
    build(r, level) {
      const rev = n(r, 12, 50, level >= 3 ? .5 : 2);
      const cogs = n(r, 4, rev - 6, level >= 3 ? .5 : 1);
      const admin = n(r, 1, 3 + level, level >= 3 ? .5 : 1);
      const marketing = n(r, 1, 2 + level, level >= 3 ? .5 : 1);
      const interest = n(r, 0, Math.min(3, level + 1), level >= 3 ? .5 : 1);
      const tax = n(r, 0, Math.min(3, level + 1), level >= 3 ? .5 : 1);
      const gross = rev - cogs, op = gross - admin - marketing, pbt = op - interest, net = pbt - tax;
      return task({ id: 'pl-basics', topic: 'pl', title: 'Соберите отчёт P&L', level,
        story: `Компания получила выручку ${fmt(rev)} млн ₽. Себестоимость проданных услуг составила ${fmt(cogs)} млн ₽, административные расходы ${fmt(admin)} млн ₽, маркетинг ${fmt(marketing)} млн ₽, проценты по кредиту ${fmt(interest)} млн ₽, налог на прибыль ${fmt(tax)} млн ₽. Все доходы и расходы признаны в отчётном периоде.`,
        questions: [q('gross', 'Валовая прибыль', gross), q('op', 'Операционная прибыль', op), q('pbt', 'Прибыль до налогообложения', pbt), q('net', 'Чистая прибыль', net)],
        hint: 'Валовая прибыль = выручка − себестоимость. Затем вычитай операционные расходы, проценты и налог.',
        explanation: [`Валовая прибыль: ${fmt(rev)} − ${fmt(cogs)} = ${fmt(gross)} млн ₽.`, `Операционная прибыль: ${fmt(gross)} − ${fmt(admin)} − ${fmt(marketing)} = ${fmt(op)} млн ₽.`, `Прибыль до налога: ${fmt(op)} − ${fmt(interest)} = ${fmt(pbt)} млн ₽.`, `Чистая прибыль: ${fmt(pbt)} − ${fmt(tax)} = ${fmt(net)} млн ₽.`], source: 'Лекция 1, стр. 27–29 и 39' });
    }
  },
  {
    id: 'pl-revenue', topic: 'pl', min: 1,
    build(r, level) {
      const shipped = n(r, 4, 16, level >= 3 ? .5 : 1);
      const prepaid = n(r, 2, 10, level >= 3 ? .5 : 1);
      const cashSale = n(r, 2, 12, level >= 3 ? .5 : 1);
      const loan = n(r, 4, 12, 2);
      const founder = n(r, 2, 8, 1);
      return task({ id: 'pl-revenue', topic: 'pl', title: 'Что считать выручкой?', level,
        story: `За декабрь компания: (1) оказала услуги на ${fmt(shipped)} млн ₽ с оплатой в январе, (2) получила ${fmt(prepaid)} млн ₽ аванса за январскую поставку, (3) продала и сразу получила ${fmt(cashSale)} млн ₽, (4) получила кредит ${fmt(loan)} млн ₽ и (5) взнос собственника ${fmt(founder)} млн ₽. Все услуги по пункту 1 завершены, товары по пункту 2 ещё не переданы. ${noTaxes}`,
        questions: [q('rev', 'Выручка декабря', shipped + cashSale), q('ar', 'Рост дебиторской задолженности', shipped), q('advance', 'Рост обязательств по авансам покупателей', prepaid)],
        hint: 'Доход признают при выполнении обязательства перед покупателем. Аванс, кредит и вклад собственника не являются выручкой.',
        explanation: [`Выручка: ${fmt(shipped)} + ${fmt(cashSale)} = ${fmt(shipped + cashSale)} млн ₽.`, `Дебиторская задолженность: +${fmt(shipped)} млн ₽ за уже оказанные, но не оплаченные услуги.`, `Авансы покупателей: +${fmt(prepaid)} млн ₽ в обязательствах. Кредит и взнос увеличивают финансирование, но не выручку.`], source: 'Лекция 1, стр. 17–18, 33 и 37' });
    }
  },
  {
    id: 'pl-subscription', topic: 'pl', min: 2,
    build(r, level) {
      const months = 12, fee = n(r, 1, 5, level >= 3 ? .5 : 1);
      const passed = n(r, 1, level >= 3 ? 9 : 6, 1);
      const total = fee * months, revenue = fee * passed;
      return task({ id: 'pl-subscription', topic: 'pl', title: 'Предоплата за подписку', level,
        story: `IT-компания получила в начале периода ${fmt(total)} млн ₽ за 12-месячную подписку. К отчётной дате услуга оказывалась ${passed} мес. равномерно. Денежные средства получены полностью; возмещений нет. ${noTaxes}`,
        questions: [q('revenue', 'Признанная выручка на отчётную дату', revenue), q('liability', 'Обязательство по оставшейся подписке', total - revenue), q('cfo', 'Операционный денежный приток от клиента', total)],
        hint: 'Оплата ≠ выручка: признай ровно столько месяцев, сколько услуг уже оказано.',
        explanation: [`Выручка = ${fmt(total)} / 12 × ${passed} = ${fmt(revenue)} млн ₽.`, `Неотработанная предоплата = ${fmt(total)} − ${fmt(revenue)} = ${fmt(total - revenue)} млн ₽.`, `Операционный приток денег = ${fmt(total)} млн ₽, так как клиент полностью оплатил подписку.`], source: 'Лекция 1, стр. 33–34' });
    }
  },
  {
    id: 'pl-fifo', topic: 'pl', min: 2,
    build(r, level) {
      const costs = [n(r, 2, 5, .5), n(r, 6, 8, .5), n(r, 9, 12, .5), n(r, 13, 16, .5)];
      const sold = level >= 3 ? n(r, 2, 3) : 2;
      const price = n(r, 18, 23, 1);
      const fifo = costs.slice(0, sold).reduce((a,b)=>a+b,0);
      const end = costs.slice(sold).reduce((a,b)=>a+b,0);
      const avg = costs.reduce((a,b)=>a+b,0) / 4 * sold;
      return task({ id: 'pl-fifo', topic: 'pl', title: 'FIFO и средняя себестоимость', level,
        story: `Торговая компания купила подряд четыре одинаковых товара по ценам ${costs.map(x=>fmt(x)).join(', ')} млн ₽ каждый (в порядке поступления). За период продано ${sold} шт. по ${fmt(price)} млн ₽ за единицу. Начальных запасов не было. ${noTaxes}`,
        questions: [q('fifo', 'Себестоимость проданных товаров по FIFO', fifo), q('remaining', 'Запасы на конец по FIFO', end), q('avg', 'Себестоимость продаж по средней цене', avg)],
        hint: 'FIFO списывает самые ранние партии. Средняя цена = сумма затрат на 4 товара / 4.',
        explanation: [`FIFO: первые ${sold} закупки = ${costs.slice(0,sold).map(x=>fmt(x)).join(' + ')} = ${fmt(fifo)} млн ₽.`, `Остаток по FIFO: ${costs.slice(sold).map(x=>fmt(x)).join(' + ')} = ${fmt(end)} млн ₽.`, `По средней цене: (${costs.map(x=>fmt(x)).join(' + ')}) / 4 × ${sold} = ${fmt(avg)} млн ₽.`], source: 'Лекция 2, стр. 47–50' });
    }
  },
  {
    id: 'cash-indirect', topic: 'cash', min: 1,
    build(r, level) {
      const net = n(r, 7, 20, level>=3 ? .5 : 1);
      const dep = n(r, 1, 4, level>=3 ? .5 : 1);
      const ar = n(r, level >= 3 ? -3 : 1, 6, level>=3 ? .5 : 1);
      const inv = n(r, level >= 3 ? -2 : 1, 5, level>=3 ? .5 : 1);
      const ap = n(r, level >= 3 ? -3 : 1, 6, level>=3 ? .5 : 1);
      const wc = ar + inv - ap;
      const cfo = net + dep - wc;
      return task({ id:'cash-indirect', topic:'cash', title:'Косвенный метод: оборотный капитал', level,
        story: `Чистая прибыль компании за год ${fmt(net)} млн ₽, амортизация ${fmt(dep)} млн ₽. За год изменения статей: дебиторская задолженность ${ar >= 0 ? 'выросла' : 'сократилась'} на ${fmt(Math.abs(ar))} млн ₽, запасы ${inv >= 0 ? 'выросли' : 'сократились'} на ${fmt(Math.abs(inv))} млн ₽, кредиторская задолженность ${ap >= 0 ? 'выросла' : 'сократилась'} на ${fmt(Math.abs(ap))} млн ₽. Других неденежных корректировок и изменений оборотных статей нет.`,
        questions:[q('nwc', 'Изменение операционного оборотного капитала', wc),q('cfo', 'Денежный поток от операционной деятельности (CFO)', cfo)],
        hint:'ΔОборотный капитал = ΔДЗ + ΔЗапасы − ΔКЗ. CFO = чистая прибыль + амортизация − ΔОК.',
        explanation:[`ΔОК = (${fmt(ar)}) + (${fmt(inv)}) − (${fmt(ap)}) = ${fmt(wc)} млн ₽.`,`CFO = ${fmt(net)} + ${fmt(dep)} − (${fmt(wc)}) = ${fmt(cfo)} млн ₽. Рост ДЗ и запасов отвлекает деньги, рост КЗ их высвобождает.`], source:'Лекция 2, стр. 16–18' });
    }
  },
  {
    id:'cash-direct', topic:'cash', min:1,
    build(r, level) {
      const receipts = n(r, 10, 35, level>=3?.5:1);
      const suppliers = n(r, 3, 9, level>=3?.5:1);
      const wages = n(r, 2, 6, level>=3?.5:1);
      const taxes = n(r, 1, 3, level>=3?.5:1);
      const capex = n(r, 2, 6, level>=3?.5:1);
      const founder = n(r, 2, 8, level>=3?.5:1);
      const cfo = receipts - suppliers - wages - taxes;
      const cfi = -capex, cff = founder;
      return task({id:'cash-direct',topic:'cash',title:'Соберите отчёт Cash Flow',level,
        story:`За год клиенты перечислили ${fmt(receipts)} млн ₽, поставщикам уплачено ${fmt(suppliers)} млн ₽, сотрудникам ${fmt(wages)} млн ₽, налогов оплачено ${fmt(taxes)} млн ₽. Куплен и оплачен станок за ${fmt(capex)} млн ₽. Собственник внёс ${fmt(founder)} млн ₽ в капитал. Других денежных операций не было.`,
        questions:[q('cfo','CFO: операционный поток',cfo),q('cfi','CFI: инвестиционный поток',cfi),q('cff','CFF: финансовый поток',cff),q('total','Итоговое изменение денежных средств',cfo+cfi+cff)],
        hint:'Распредели деньги по трём разделам. Станок относится к CFI, вклад собственника к CFF.',
        explanation:[`CFO = ${fmt(receipts)} − ${fmt(suppliers)} − ${fmt(wages)} − ${fmt(taxes)} = ${fmt(cfo)} млн ₽.`,`CFI = −${fmt(capex)} млн ₽ (оборудование).`,`CFF = +${fmt(founder)} млн ₽ (взнос в капитал).`,`ΔДенег = ${fmt(cfo)} − ${fmt(capex)} + ${fmt(founder)} = ${fmt(cfo + cfi + cff)} млн ₽.`],source:'Лекция 2, стр. 6–10'});
    }
  },
  {
    id: 'cash-missing',topic:'cash',min:2,
    build(r,level) {
      const start=n(r,20,32),net=n(r,4,12),dep=n(r,1,4),capex=n(r,2,6),debt=n(r,1,4),div=n(r,1,4);
      const nwc=n(r,-2,5,level>=3?.5:1);
      const known=level===2 || (level >= 3 && r()<.4);
      const result=round(start + net + dep - nwc - capex - debt - div);
      return task({id:'cash-missing',topic:'cash',title:'Сколько денег осталось?',level,
        story:`Деньги на начало года ${fmt(start)} млн ₽. Чистая прибыль ${fmt(net)} млн ₽, амортизация ${fmt(dep)} млн ₽, покупка оборудования (полная оплата) ${fmt(capex)} млн ₽, погашение основного долга ${fmt(debt)} млн ₽, выплата дивидендов ${fmt(div)} млн ₽.${known?` Операционный оборотный капитал за год ${nwc>=0?'увеличился':'сократился'} на ${fmt(Math.abs(nwc))} млн ₽.`:' Информация об изменении оборотного капитала отсутствует.'} Других операций и корректировок нет, кроме возможных изменений оборотного капитала, обозначенных выше.`,
        questions:known?[q('end','Денежные средства на конец года',result)]:[option('enough','Хватает ли данных для однозначного расчёта?', 'Недостаточно данных',['Хватает','Недостаточно данных']),option('missing','Чего именно не хватает?','Изменения оборотного капитала',['Ставки дисконтирования','Изменения оборотного капитала','Рыночной цены акций'])],
        hint:'CFO = прибыль + амортизация − Δоборотного капитала. Затем учти инвестиции, погашение долга и дивиденды.',
        explanation:known?[`CFO = ${fmt(net)} + ${fmt(dep)} − (${fmt(nwc)}) = ${fmt(net+dep-nwc)} млн ₽.`,`Деньги на конец = ${fmt(start)} + ${fmt(net+dep-nwc)} − ${fmt(capex)} − ${fmt(debt)} − ${fmt(div)} = ${fmt(result)} млн ₽.`]:[`По одной чистой прибыли и амортизации нельзя найти CFO: неизвестно изменение оборотного капитала.`,`Предполагаемые остатки денег будут различаться при разных изменениях дебиторки, запасов и кредиторки. Значит, конечный остаток определить нельзя.`],source:'Пример пользователя о недостаточности данных; лекция 2, стр. 16–18'});
    }
  },
  {
    id:'cash-interest',topic:'cash',min:3,
    build(r,level) {
      const borrowed = n(r,8,20,level===4?.5:1), repaid=n(r,1,borrowed-2,level===4?.5:1),interest=n(r,.5,3,.5);
      const cff=round(borrowed-repaid),total=round(cff-interest);
      return task({id:'cash-interest',topic:'cash',title:'Кредит: основной долг и проценты',level,
        story:`Компания получила кредит ${fmt(borrowed)} млн ₽ и погасила ${fmt(repaid)} млн ₽ основного долга. За период начислила и выплатила ${fmt(interest)} млн ₽ процентов. По принятой для задачи учётной политике уплаченные проценты относятся к операционному потоку (CFO). Других операций нет, налогов нет.`,
        questions:[q('cfo','CFO',-interest),q('cff','CFF',cff),q('total','Изменение денег всего',total),q('debt','Изменение задолженности по основному долгу',cff)],
        hint:'Тело кредита не является доходом/расходом P&L. Проценты по заданной политике идут в CFO.',
        explanation:[`CFO = −${fmt(interest)} млн ₽ (оплаченные проценты).`,`CFF = +${fmt(borrowed)} − ${fmt(repaid)} = ${fmt(cff)} млн ₽.`,`Совокупный денежный поток = ${fmt(cff)} − ${fmt(interest)} = ${fmt(total)} млн ₽.`,`Задолженность по кредиту растёт на ${fmt(cff)} млн ₽.`],source:'Лекция 2, стр. 9 и 11'});
    }
  },
  {
    id:'balance-equity',topic:'balance',min:1,
    build(r,level) {
      const initial=n(r,16,40,level>=3?.5:1),profit=n(r,3,10,level>=3?.5:1),div=n(r,1,Math.min(13,initial+profit-2),level>=3?.5:1),owner=n(r,1,6,level>=3?.5:1);
      return task({id:'balance-equity',topic:'balance',title:'Движение собственного капитала',level,
        story:`Собственный капитал на начало года ${fmt(initial)} млн ₽. За год чистая прибыль ${fmt(profit)} млн ₽, собственникам выплачены дивиденды ${fmt(div)} млн ₽, дополнительно внесено ${fmt(owner)} млн ₽ в капитал. Все выплаты произведены. Прочих изменений капитала нет.`,
        questions:[q('equity','Капитал на конец года',initial+profit-div+owner),q('cff','Поток от финансовой деятельности по этим операциям',owner-div),option('knowcash','Можно ли по этим данным определить остаток денег на конец?','Нет',['Да','Нет'])],
        hint:'Капитал = начальный капитал + прибыль − дивиденды + новые взносы. Прибыль не равна наличным деньгам.',
        explanation:[`Капитал = ${fmt(initial)} + ${fmt(profit)} − ${fmt(div)} + ${fmt(owner)} = ${fmt(initial+profit-div+owner)} млн ₽.`,`Денежный поток от взносов и дивидендов (CFF) = ${fmt(owner)} − ${fmt(div)} = ${fmt(owner-div)} млн ₽.`,`Остаток денег неизвестен: нужны начальные денежные средства, CFO и CFI.`],source:'Задача пользователя о капитале; лекция 2, стр. 20–22'});
    }
  },
  {
    id:'balance-depreciation',topic:'balance',min:1,
    build(r,level) {
      const years=n(r,3,8), perYear=n(r,1,6,level>=3?.5:1), residual=n(r,0,4,level>=3?.5:1),cost=round(years*perYear+residual);
      const elapsed=n(r,1,years-1),balance=round(cost-perYear*elapsed);
      return task({id:'balance-depreciation',topic:'balance',title:'Амортизация оборудования',level,
        story:`Оборудование приобретено и введено в эксплуатацию за ${fmt(cost)} млн ₽. Ликвидационная стоимость ${fmt(residual)} млн ₽, срок полезного использования ${years} лет. Амортизация линейная, полный год работы. С момента ввода прошло ${elapsed} полных лет.`,
        questions:[q('annual','Амортизация за год',perYear),q('cum','Накопленная амортизация',perYear*elapsed),q('balance','Балансовая стоимость на конец периода',balance)],
        hint:'Ежегодная амортизация = (себестоимость − ликвидационная стоимость) / срок службы.',
        explanation:[`Годовая амортизация = (${fmt(cost)} − ${fmt(residual)}) / ${years} = ${fmt(perYear)} млн ₽.`,`Накопленная амортизация = ${fmt(perYear)} × ${elapsed} = ${fmt(perYear*elapsed)} млн ₽.`,`Балансовая стоимость = ${fmt(cost)} − ${fmt(perYear*elapsed)} = ${fmt(balance)} млн ₽.`],source:'Лекция 2, стр. 33 и 38–39'});
    }
  },
  {
    id:'balance-investment',topic:'balance',min:2,
    build(r,level) {
      const initialAssets=n(r,25,50), initialLiab=n(r,5,16), initialEq=initialAssets-initialLiab;
      const profit=n(r,3,9), dividend=n(r,1,Math.min(8,profit+2)), invest=n(r,1,6);
      const finalEq=initialEq+profit-dividend+invest, finalAssets=initialAssets+profit-dividend+invest;
      return task({id:'balance-investment',topic:'balance',title:'Проверьте балансовое уравнение',level,
        story:`В начале года активы компании ${fmt(initialAssets)} млн ₽, обязательства ${fmt(initialLiab)} млн ₽. За год получена чистая прибыль ${fmt(profit)} млн ₽, дивиденды выплачены ${fmt(dividend)} млн ₽, собственник внёс в капитал ${fmt(invest)} млн ₽ деньгами. Обязательства не менялись. Доходы и расходы из прибыли уже отражены в соответствующих активах, прочих изменений нет.`,
        questions:[q('initial','Капитал на начало',initialEq),q('finalEq','Капитал на конец',finalEq),q('assets','Активы на конец',finalAssets)],
        hint:'Активы = обязательства + капитал. Каждое событие меняет капитал и активы одинаково при неизменных обязательствах.',
        explanation:[`Начальный капитал = ${fmt(initialAssets)} − ${fmt(initialLiab)} = ${fmt(initialEq)} млн ₽.`,`Капитал на конец = ${fmt(initialEq)} + ${fmt(profit)} − ${fmt(dividend)} + ${fmt(invest)} = ${fmt(finalEq)} млн ₽.`,`Активы на конец = обязательства ${fmt(initialLiab)} + капитал ${fmt(finalEq)} = ${fmt(finalAssets)} млн ₽.`],source:'Лекция 2, стр. 20–22 и 54'});
    }
  },
  {
    id:'balance-advance',topic:'balance',min:3,
    build(r,level) {
      const initial=n(r,25,45,level===4?.5:1),advance=n(r,4,12,level===4?.5:1),equipment=n(r,4,10,level===4?.5:1);
      const depreciation=n(r,.5,2,.5),revenue=n(r,3,11,level===4?.5:1);
      const endCash=round(initial+advance-equipment+revenue),endAssets=round(initial+advance+revenue-depreciation);
      const endEquity=round(initial+revenue-depreciation);
      return task({id:'balance-advance',topic:'balance',title:'Аванс, оборудование и баланс',level,
        story:`На начало периода у компании только деньги ${fmt(initial)} млн ₽ и собственный капитал в той же сумме, обязательств нет. За период она получила аванс ${fmt(advance)} млн ₽ за будущие услуги (они пока не оказаны), купила за деньги оборудование ${fmt(equipment)} млн ₽ и начислила по нему амортизацию ${fmt(depreciation)} млн ₽. Дополнительно оказаны и сразу оплачены другие услуги на ${fmt(revenue)} млн ₽. Налогов и иных операций нет.`,
        questions:[q('revenue','Выручка текущего периода',revenue),q('liabilities','Обязательства на конец периода',advance),q('cash','Денежные средства на конец',endCash),q('equity','Капитал на конец',endEquity),q('assets','Активы на конец',endAssets)],
        hint:'Аванс за будущие услуги входит в обязательства. Покупка оборудования переводит деньги в основные средства. Амортизация снижает актив и капитал.',
        explanation:[`Выручка = ${fmt(revenue)} млн ₽, клиентский аванс ${fmt(advance)} млн ₽ остаётся обязательством.`,`Деньги = ${fmt(initial)} + ${fmt(advance)} − ${fmt(equipment)} + ${fmt(revenue)} = ${fmt(endCash)} млн ₽.`,`Основные средства = ${fmt(equipment)} − ${fmt(depreciation)} = ${fmt(equipment-depreciation)} млн ₽.`,`Активы = деньги ${fmt(endCash)} + ОС ${fmt(equipment-depreciation)} = ${fmt(endAssets)} млн ₽.`,`Капитал = ${fmt(initial)} + ${fmt(revenue)} − ${fmt(depreciation)} = ${fmt(endEquity)} млн ₽. Баланс: активы ${fmt(endAssets)} = обязательства ${fmt(advance)} + капитал ${fmt(endEquity)}.`],source:'Лекция 1, стр. 17–18; лекция 2, стр. 20–22, 34 и 54'});
    }
  },
  {
    id:'links-contract',topic:'links',min:1,
    build(r,level) {
      const rev=n(r,10,24,level>=3?.5:1),cogs=n(r,4,rev-3,level>=3?.5:1),client=n(r,1,rev-1,level>=3?.5:1),supplier=n(r,1,cogs-1,level>=3?.5:1);
      const profit=round(rev-cogs),cash=round(client-supplier),ar=round(rev-client),ap=round(cogs-supplier);
      return task({id:'links-contract',topic:'links',title:'Прибыль, деньги и две задолженности',level,
        story:`Компания полностью оказала услуги на ${fmt(rev)} млн ₽. Себестоимость ${fmt(cogs)} млн ₽, из которых ${fmt(supplier)} млн ₽ уже оплачено, остальное позже. Клиент заплатил пока ${fmt(client)} млн ₽, остаток поступит в будущем. Дебиторская и кредиторская задолженности на начало равнялись нулю. ${noTaxes}`,
        questions:[q('profit','Прибыль по контракту',profit),q('cash','Изменение денег',cash),q('ar','Рост дебиторской задолженности',ar),q('ap','Рост кредиторской задолженности',ap),option('why','Почему прибыль не равна изменению денег?','Метод начисления и отсрочки платежей',['Метод начисления и отсрочки платежей','Потому что прибыль всегда больше денег','Из-за выпуска акций'])],
        hint:'Прибыль = начисленная выручка − вся себестоимость. Деньги = фактическая оплата клиента − фактическая оплата поставщикам.',
        explanation:[`Прибыль = ${fmt(rev)} − ${fmt(cogs)} = ${fmt(profit)} млн ₽.`,`ΔДенег = ${fmt(client)} − ${fmt(supplier)} = ${fmt(cash)} млн ₽.`,`ΔДЗ = ${fmt(rev)} − ${fmt(client)} = ${fmt(ar)} млн ₽; ΔКЗ = ${fmt(cogs)} − ${fmt(supplier)} = ${fmt(ap)} млн ₽.`,`Баланс: ΔАктивы = ΔДеньги ${fmt(cash)} + ΔДЗ ${fmt(ar)} = ${fmt(cash+ar)} млн ₽. ΔПассивы = ΔКЗ ${fmt(ap)} + прибыль ${fmt(profit)} = ${fmt(ap+profit)} млн ₽.`],source:'Пример пользователя о контракте; лекция 1, стр. 17; лекция 2, стр. 20 и 54'});
    }
  },
  {
    id:'links-error',topic:'links',min:2,
    build(r,level) {
      const cost=n(r,4,14,level>=3?.5:1),dep=n(r,.5,Math.min(4,cost-1),.5);
      const uplift=round(cost-dep);
      return task({id:'links-error',topic:'links',title:'Исправьте ошибку бухгалтера',level,
        story:`Оборудование за ${fmt(cost)} млн ₽ куплено и полностью оплачено. Амортизация за первый год ${fmt(dep)} млн ₽. Бухгалтер ошибочно списал всю покупку в расходы P&L и отнёс оплату в CFO, актив не признал. Правильно было капитализировать покупку и отразить оплату в CFI. ${noTaxes}`,
        questions:[q('profit','На сколько нужно увеличить объявленную прибыль',uplift),q('ppe','На сколько нужно увеличить объявленные основные средства',uplift),q('cfo','Корректировка CFO (новый минус старый)',cost),q('cfi','Корректировка CFI (новый минус старый)',-cost),q('total','Изменение совокупного денежного потока после исправления',0),option('balanced','Сойдётся ли корректно составленный баланс?','Да',['Да','Нет'])],
        hint:'Правильный расход первого года только амортизация. Переклассификация денежного платежа между CFO и CFI не меняет общий поток.',
        explanation:[`Прибыль раньше = −${fmt(cost)}, должна быть = −${fmt(dep)}; улучшение = ${fmt(cost)} − ${fmt(dep)} = ${fmt(uplift)} млн ₽.`,`Основные средства вместо 0 должны составлять ${fmt(cost)} − ${fmt(dep)} = ${fmt(uplift)} млн ₽. Капитал корректируется на ту же сумму.`,`CFO был −${fmt(cost)}, станет 0. Корректировка +${fmt(cost)}. CFI был 0, станет −${fmt(cost)}.`,`Общий денежный поток остался −${fmt(cost)}, то есть его изменение равно 0. Оба корректно составленных баланса соблюдают равенство активов, обязательств и капитала.`],source:'Пример пользователя об ошибочном учёте оборудования; лекция 2, стр. 34–35'});
    }
  },
  {
    id:'links-repair',topic:'links',min:2,
    build(r,level) {
      const old=n(r,8,20,level>=3?.5:1),upgrade=n(r,3,8,level>=3?.5:1),depOld=n(r,1,3,.5),depUpgrade=n(r,.5,2,.5);
      const totalDep=round(depOld+depUpgrade),end=round(old+upgrade-totalDep),routineEnd=round(old-depOld);
      return task({id:'links-repair',topic:'links',title:'Модернизация или текущий ремонт?',level,
        story:`Балансовая стоимость производственной линии на начало года ${fmt(old)} млн ₽. Компания оплачивает модернизацию за ${fmt(upgrade)} млн ₽, которая увеличивает будущие экономические выгоды и капитализируется. Амортизация в текущем году: по старой части ${fmt(depOld)} млн ₽, по модернизации ${fmt(depUpgrade)} млн ₽. Считаем, что других операций нет, налогов нет.`,
        questions:[q('pnl','Расходы P&L от амортизации',totalDep),q('cfi','Инвестиционный денежный поток',-upgrade),q('asset','Балансовая стоимость линии на конец',end),q('repair','Балансовая стоимость в альтернативном случае обычного ремонта на ту же сумму (без амортизации модернизации)',routineEnd),option('capitalize','Нужно ли всю модернизацию признать расходом текущего периода?','Нет',['Да','Нет'])],
        hint:'Модернизация увеличивает актив; её стоимость не списывают сразу. Текущий ремонт не добавляется к основным средствам.',
        explanation:[`P&L: амортизация ${fmt(depOld)} + ${fmt(depUpgrade)} = ${fmt(totalDep)} млн ₽.`,`CFI: −${fmt(upgrade)} млн ₽, CFO по этой операции 0.`,`Основные средства на конец = ${fmt(old)} + ${fmt(upgrade)} − ${fmt(depOld)} − ${fmt(depUpgrade)} = ${fmt(end)} млн ₽.`,`Если бы это был обычный ремонт: расход P&L на ремонт ${fmt(upgrade)} млн ₽ плюс старая амортизация ${fmt(depOld)} млн ₽, CFO = −${fmt(upgrade)}, CFI = 0, основные средства = ${fmt(routineEnd)} млн ₽.`],source:'Пример пользователя о модернизации; лекция 2, стр. 34 и 37'});
    }
  },
  {
    id:'links-audit',topic:'links',min:3,
    build(r,level) {
      const cost=n(r,4,12,level===4?.5:1),dep=n(r,1,3,.5),asset=round(cost-dep);
      return task({id:'links-audit',topic:'links',title:'Найдите несоответствие в трёх формах',level,
        story:`Компания приобрела оборудование за ${fmt(cost)} млн ₽, полностью оплатив его, амортизация за год ${fmt(dep)} млн ₽. Других операций нет. Бухгалтер представил отчётность: P&L: расход на покупку = ${fmt(cost)} млн ₽ и прибыль −${fmt(cost)} млн ₽; Cash Flow: CFI = −${fmt(cost)} млн ₽, CFO = 0; Balance Sheet: оборудование выросло на ${fmt(asset)} млн ₽, капитал сократился на ${fmt(cost)} млн ₽.`,
        questions:[q('realpl','Верное изменение прибыли',-dep),q('realasset','Верное изменение основных средств',asset),q('realequity','Верное изменение капитала',-dep),q('mismatch','На сколько левая и правая стороны представленного баланса расходятся (модуль)',asset)],
        hint:'Правильный P&L содержит амортизацию, а CFI содержит оплату приобретения оборудования.',
        explanation:[`P&L должен содержать амортизацию −${fmt(dep)}, а не расход покупки −${fmt(cost)} млн ₽.`,`ΔОсновные средства = +${fmt(cost)} − ${fmt(dep)} = +${fmt(asset)} млн ₽. ΔДеньги = −${fmt(cost)}.`,`ΔАктивы = −${fmt(cost)} + ${fmt(asset)} = −${fmt(dep)} млн ₽, ΔКапитал = −${fmt(dep)} млн ₽.`,`У бухгалтера ΔАктивы = −${fmt(dep)}, ΔКапитал = −${fmt(cost)}; разрыв ${fmt(asset)} млн ₽. В CFI/CFO ошибок нет.`],source:'Пример пользователя о неправильно представленных трёх формах'});
    }
  },
  {
    id:'valuation-npv',topic:'valuation',min:2,extra:true,
    build(r,level) {
      const initial=n(r,9,24,level>=3?.5:1),cash=n(r,3,9,level>=3?.5:1),years=level>=3?n(r,3,5):3;
      const rate=pick(r,level>=3?[8,10,12,15]:[10,20]);
      const pv=Array.from({length:years},(_,i)=>cash/(1+rate/100)**(i+1)).reduce((a,b)=>a+b,0);
      const npv=round(pv-initial);
      return task({id:'valuation-npv',topic:'valuation',title:'Оцените проект по NPV',level,
        story:`Проект требует инвестиций ${fmt(initial)} млн ₽ сейчас (t=0). В конце каждого из следующих ${years} лет проект принесёт денежный поток ${fmt(cash)} млн ₽. Ставка дисконтирования ${rate}% годовых. Ликвидационного платежа нет. Рассчитай чистую приведённую стоимость проекта. Округляй до 2 знаков после запятой.`,
        questions:[q('npv','NPV проекта',npv,'млн ₽',.021),option('decision','Принять проект по критерию NPV? ',npv>0?'Да':'Нет',['Да','Нет'])],
        hint:'NPV = −I₀ + Σ[CFₜ / (1+r)ᵗ]. Положительный NPV означает превышение требуемой доходности.',
        explanation:[`NPV = −${fmt(initial)} + ${Array.from({length:years},(_,i)=>`${fmt(cash)}/(1+${rate/100})^${i+1}`).join(' + ')}.`,`Приведённые поступления = ${fmt(pv)} млн ₽. NPV = ${fmt(npv)} млн ₽.`,`По критерию NPV проект ${npv>0?'принимают':'отклоняют'}, если альтернативных ограничений нет.`],source:'Дополнение к курсу: NPV; темы оценки указаны в плане лекции 1, стр. 2',extra:true});
    }
  },
  {
    id:'valuation-payback',topic:'valuation',min:1,extra:true,
    build(r,level) {
      const cash=n(r,3,8,level>=3?.5:1),integerYears=n(r,2,4),part=pick(r,[.25,.5,.75]);
      const initial=round(cash*(integerYears+part));
      const pb=round(initial/cash);
      return task({id:'valuation-payback',topic:'valuation',title:'Срок окупаемости проекта',level,
        story:`Начальные инвестиции в проект ${fmt(initial)} млн ₽. Проект даёт равномерный денежный поток ${fmt(cash)} млн ₽ в год. Игнорируем дисконтирование, налоги и ограничение срока проекта. Допускается пропорциональная окупаемость внутри года.`,
        questions:[q('payback','Простой срок окупаемости',pb,'лет',.011)],
        hint:'При равномерном потоке простой срок окупаемости = инвестиции / ежегодный поток.',
        explanation:[`PP = ${fmt(initial)} / ${fmt(cash)} = ${fmt(pb)} года.`,`Это простой срок окупаемости. Дисконтированный срок был бы другим.`],source:'Дополнение к курсу: срок окупаемости; план лекции 1, стр. 2',extra:true});
    }
  },
  {
    id:'valuation-multiples',topic:'valuation',min:2,extra:true,
    build(r,level) {
      const ebitda=n(r,5,18,level>=3?.5:1),multiple=n(r,4,9,level===4?.5:1),debt=n(r,7,22,level>=3?.5:1),cash=n(r,1,Math.min(7,debt-1),level>=3?.5:1);
      const ev=round(ebitda*multiple),nd=round(debt-cash),eq=round(ev-nd);
      return task({id:'valuation-multiples',topic:'valuation',title:'EV/EBITDA и стоимость капитала',level,
        story:`EBITDA компании = ${fmt(ebitda)} млн ₽. Сравнимые компании оцениваются в ${fmt(multiple)}× EBITDA по мультипликатору EV/EBITDA. Процентный долг = ${fmt(debt)} млн ₽, денежные средства = ${fmt(cash)} млн ₽. Прочих корректировок стоимости нет.`,
        questions:[q('ev','Стоимость бизнеса (EV)',ev),q('nd','Чистый долг',nd),q('eq','Стоимость собственного капитала (Equity Value)',eq)],
        hint:'EV = EBITDA × мультипликатор; чистый долг = долг − деньги; Equity Value = EV − чистый долг.',
        explanation:[`EV = ${fmt(ebitda)} × ${fmt(multiple)} = ${fmt(ev)} млн ₽.`,`Чистый долг = ${fmt(debt)} − ${fmt(cash)} = ${fmt(nd)} млн ₽.`,`Equity Value = ${fmt(ev)} − ${fmt(nd)} = ${fmt(eq)} млн ₽.`],source:'Дополнение к курсу: сравнительный подход; план лекции 1, стр. 2',extra:true});
    }
  },
  {
    id:'valuation-gordon',topic:'valuation',min:3,extra:true,
    build(r,level) {
      const fcf=n(r,6,20,level===4?.5:1),discount=pick(r,[10,12,14,15,16]),growth=pick(r,[1,2,3,4]);
      const debt=n(r,4,16),cash=n(r,1,6);
      const ev=round(fcf/((discount-growth)/100)),eq=round(ev-debt+cash);
      return task({id:'valuation-gordon',topic:'valuation',title:'Стоимость по модели Гордона',level,
        story:`Свободный денежный поток фирмы в следующем году (FCFF₁) прогнозируется в размере ${fmt(fcf)} млн ₽. После этого он ежегодно растёт на ${growth}% бессрочно. Требуемая доходность (WACC) ${discount}%. Процентный долг ${fmt(debt)} млн ₽, деньги ${fmt(cash)} млн ₽. Считай FCFF₁ потоком именно следующего года, округление до 2 знаков.`,
        questions:[q('ev','Стоимость бизнеса (EV)',ev,'млн ₽',.021),q('eq','Стоимость собственного капитала',eq,'млн ₽',.021)],
        hint:'Если WACC > g, стоимость бессрочного растущего потока = FCFF₁ / (WACC − g). Затем вычти чистый долг.',
        explanation:[`EV = ${fmt(fcf)} / (${discount}% − ${growth}%) = ${fmt(ev)} млн ₽.`,`Equity Value = ${fmt(ev)} − ${fmt(debt)} + ${fmt(cash)} = ${fmt(eq)} млн ₽.`,`Здесь модель предполагает постоянный темп роста и WACC больше g.`],source:'Дополнение к курсу: доходный подход; план лекции 1, стр. 2',extra:true});
    }
  },
  {
    id:'valuation-fcff',topic:'valuation',min:3,
    build(r,level) {
      const cfo=n(r,10,30,level===4?.5:1),interest=n(r,1,5,level===4?.5:1),tax=pick(r,[15,20,25]),capex=n(r,3,10,level===4?.5:1);
      const fcff=round(cfo+interest*(1-tax/100)-capex);
      return task({id:'valuation-fcff',topic:'valuation',title:'Свободный денежный поток фирмы (FCFF)',level,
        story:`Денежный поток от операционной деятельности CFO = ${fmt(cfo)} млн ₽. Проценты уплачены в размере ${fmt(interest)} млн ₽ и уже включены в CFO как операционный отток. Налоговая ставка ${tax}%, инвестиции в основные средства (CAPEX) = ${fmt(capex)} млн ₽. Применяй учебную формулу FCFF без других корректировок.`,
        questions:[q('fcff','FCFF',fcff)],
        hint:'FCFF = CFO + проценты × (1 − ставка налога) − CAPEX.',
        explanation:[`FCFF = ${fmt(cfo)} + ${fmt(interest)} × (1 − ${tax/100}) − ${fmt(capex)} = ${fmt(fcff)} млн ₽.`,`Проценты возвращаются после налогообложения, так как свободный поток фирмы рассчитан до распределения между кредиторами и акционерами.`],source:'Лекция 2, стр. 11'});
    }
  }
];

export const TEMPLATE_CATALOG = templates.map(({ id, topic, min, extra }) => ({ id, topic, min, extra:!!extra }));

export function generateExercise({ topic = 'all', level = 1, seed = 1, templateId = null } = {}) {
  const lvl = Math.max(1, Math.min(4, Number(level) || 1));
  const s = Number(seed) >>> 0;
  const r = rng(s);
  const pool = templates.filter(t => (topic === 'all' || topic === t.topic) && t.min <= lvl);
  if (!pool.length) throw new Error('Для выбранной темы и сложности нет задач');
  const templ = (templateId && pool.find(t => t.id === templateId)) || pick(r, pool);
  const ex = templ.build(r, lvl);
  return { ...ex, seed:s, templateId:templ.id, level:lvl };
}

export function checkAnswer(question, userValue) {
  if (question.type === 'choice') return String(userValue).trim() === String(question.answer);
  if (userValue === undefined || userValue === null || String(userValue).trim() === '') return false;
  const value = Number(String(userValue).replaceAll(' ', '').replace(',', '.'));
  return Number.isFinite(value) && Math.abs(value - question.answer) <= question.tolerance;
}

export function formatAnswer(question) {
  return question.type === 'choice' ? String(question.answer) : `${fmt(question.answer)} ${question.unit}`;
}
