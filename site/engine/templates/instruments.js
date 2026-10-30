/** Bonds and derivatives extension. Prices are annual, full coupon periods; no accrued interest, defaults or embedded calls.
 * Source for fixed-rate bond formulas: uploaded «Облигации.pdf», 09.09.2026.
 * Financial option mechanics are additional teaching material (not claimed to come from that PDF).
 */
import {fmt as F,randomInt as I,oneOf as O,num as q,choice as c,exercise as E} from '../helpers.js';

export function couponBondCashflows(face,couponRate,years){
 return Array.from({length:years},(_,i)=>face*couponRate+(i===years-1?face:0));
}
export function pvCashflows(flows,rate){
 return flows.reduce((sum,flow,i)=>sum+flow/(1+rate)**(i+1),0);
}
export function couponBondMetrics(face,couponRate,years,yieldRate){
 const flows=couponBondCashflows(face,couponRate,years);
 const pv=flows.map((cf,i)=>cf/(1+yieldRate)**(i+1));
 const price=pv.reduce((a,b)=>a+b,0);
 const macaulay=pv.reduce((sum,v,i)=>sum+v*(i+1),0)/price;
 const modified=macaulay/(1+yieldRate);
 return {price,macaulay,modified,flows};
}
export function solveCouponYtm(price,face,couponRate,years){
 if(!(price>0&&face>0&&years>=1&&couponRate>=0))throw new RangeError('Invalid bond inputs');
 const flows=couponBondCashflows(face,couponRate,years);
 let lo=-.9999,hi=1;
 while(pvCashflows(flows,hi)>price)hi=2*(hi+1)-1;
 for(let i=0;i<105;i++){
  const mid=(lo+hi)/2;
  if(pvCashflows(flows,mid)>price)lo=mid;else hi=mid;
 }
 return (lo+hi)/2;
}
export const templates=[
 {id:'bond-coupon-duration',topic:'valuation',min:3,build(r,l){
  const face=1000,couponPct=O(r,[4,6,8,10,12]),yieldPct=O(r,[5,7,9,11,13,15]),years=I(r,3,8);
  const m=couponBondMetrics(face,couponPct/100,years,yieldPct/100);
  const approx=-m.modified*.01*100;
  const exact=(couponBondMetrics(face,couponPct/100,years,(yieldPct+1)/100).price/m.price-1)*100;
  const data={kind:'coupon-duration',face,couponPct,yieldPct,years,changePct:1};
  return {...E(this.id,this.topic,'Дюрация купонной облигации и процентный риск',
   'Номинал облигации 1 000 ₽, купон '+couponPct+'% годовых выплачивается ровно раз в год, до погашения '+years+' полных лет. Текущая эффективная годовая доходность к погашению '+yieldPct+'%. Рассчитай цену, дюрацию Маколея, модифицированную дюрацию и сравни линейный прогноз цены с точным пересчётом при росте доходности на 1 процентный пункт. Покупка сразу после купона: НКД 0. Дефолт, встроенные опционы и комиссии отсутствуют.',
   [q('price','Текущая цена (₽)',m.price,'₽'),
    q('mac','Дюрация Маколея (лет)',m.macaulay,'лет'),
    q('mod','Модифицированная дюрация (лет)',m.modified,'лет'),
    q('approx','Прогноз изменения цены при +1 п.п. (процент)',approx,'%'),
    q('exact','Точное изменение цены при +1 п.п. (процент)',exact,'%')],
   'Сначала дисконтируй все купоны и номинал. Затем посчитай средневзвешенный срок PV платежей. Для процента изменения цены используй именно модифицированную дюрацию, а не дюрацию Маколея.',
   ['Годовой купон = 1 000 × '+couponPct+'% = '+face*couponPct/100+' ₽. Цена = сумма PV всех купонов и номинала = '+F(m.price)+' ₽.',
    'Дюрация Маколея = сумма(t × PV платежа) / цена = '+F(m.macaulay,4)+' года.',
    'Модифицированная = D_Mac / (1 + '+yieldPct+'%) = '+F(m.modified,4)+' года.',
    'Оценка ΔP/P ≈ −D_mod × Δy = '+F(approx,3)+'%; точный пересчёт потока под '+(yieldPct+1)+'% даёт '+F(exact,3)+'%. Разница возникает из-за выпуклости зависимости цены от доходности.'],
   'Облигации.pdf · дюрация; методическое уточнение о модифицированной дюрации',l),audit:{instrument:data}};
 }},
 {id:'bond-coupon-ytm-exact',topic:'valuation',min:3,build(r,l){
  const face=1000,couponPct=O(r,[5,7,9,11,13]),years=I(r,2,7),trueY=O(r,[6,8,10,12,14,16]);
  const price=couponBondMetrics(face,couponPct/100,years,trueY/100).price;
  const ytm=solveCouponYtm(price,face,couponPct/100,years)*100;
  const current=face*couponPct/100/price*100;
  return {...E(this.id,this.topic,'Купонная облигация: YTM вместо текущей доходности',
   'Номинал 1 000 ₽, фиксированный годовой купон '+couponPct+'%, срок до погашения '+years+' полных лет. Текущая полная цена сделки '+F(price,5)+' ₽ непосредственно после купона (НКД = 0). Все купоны выплачиваются в конце года, дефолт, комиссии, досрочное погашение и реинвестирование не учитываются. Найди годовую текущую доходность и точную доходность к погашению YTM как внутреннюю норму доходности денежного потока.',
   [q('coupon','Годовой купон',face*couponPct/100,'₽'),
    q('current','Текущая купонная доходность',current,'%'),
    q('ytm','Точная доходность к погашению YTM',ytm,'%',.035),
    c('premium','Бумага дороже номинала?',price>face?'Да':'Нет',['Да','Нет'])],
   'Текущая доходность = купон / цена; YTM — такая ставка, при которой сумма приведённых купонов и номинала равна цене. Не заменяй YTM приближённой формулой и не путай её с купонной ставкой.',
   ['Купон = 1 000 × '+couponPct+'% = '+face*couponPct/100+' ₽.',
    'Текущая доходность = купон / '+F(price,5)+' × 100 = '+F(current,3)+'%.',
    'Уравнение YTM: цена = сумма(C/(1+y)^t) + 1 000/(1+y)^'+years+'. Бисекцией получаем '+F(ytm,4)+'%.',
    'Доходность '+(price<face?'выше':'ниже или равна')+' купона при '+(price<face?'дисконте':'премии или номинале')+'. Реинвестиционная доходность будущих купонов не гарантируется YTM.'],
   'Облигации.pdf · цена и YTM; численное решение уравнения для купонной облигации',l),
   audit:{instrument:{kind:'coupon-ytm',face,couponPct,years,observedPrice:Number(F(price,5).replace(',','.').replace(/\s/g,''))}}};
 }},
 {id:'option-expiry-profit',topic:'valuation',min:2,build(r,l){
  const kind=O(r,['call','put']),strike=I(r,80,120),premium=I(r,4,15),spot=strike+I(r,-45,50);
  const intrinsic=kind==='call'?Math.max(spot-strike,0):Math.max(strike-spot,0);
  const net=intrinsic-premium,short=-net,be=kind==='call'?strike+premium:strike-premium;
  return {...E(this.id,this.topic,'Финансовый опцион '+(kind==='call'?'CALL':'PUT')+': выплата и прибыль',
   'Куплен европейский '+(kind==='call'?'CALL (право купить)':'PUT (право продать)')+' на одну акцию с ценой исполнения '+strike+' ₽. Премия покупателя '+premium+' ₽ за акцию оплачена при заключении. Цена акции в дату исполнения '+spot+' ₽. В задаче игнорируются проценты, дивиденды, налоги и комиссии; все суммы относятся к одной акции. Найди выплату при исполнении, чистую прибыль покупателя, результат продавца и цену безубыточности. Результат продавца противоположен результату покупателя только в этой упрощённой модели без обеспечения и комиссии.',
   [q('payoff','Выплата держателю при исполнении',intrinsic,'₽'),
    q('long','Прибыль покупателя после премии',net,'₽'),
    q('short','Прибыль продавца после премии',short,'₽'),
    q('breakeven','Цена безубыточности покупателя',be,'₽')],
   'Выплата CALL = max(S_T − K,0), PUT = max(K − S_T,0). Прибыль покупателя = выплата − премия. Продавец получает премию и выплачивает результат исполнения.',
   [(kind==='call'?'CALL':'PUT')+': max('+ (kind==='call'?spot+' − '+strike:strike+' − '+spot)+',0) = '+intrinsic+' ₽.',
    'Покупатель: '+intrinsic+' − '+premium+' = '+net+' ₽; продавец: '+premium+' − '+intrinsic+' = '+short+' ₽.',
    'Безубыточность = K '+(kind==='call'?'+':'−')+' премия = '+be+' ₽. Пут нельзя трактовать как право купить актив.',
    'Риск продавца CALL без покрытия неограничен при росте акции; убыток покупателя ограничен премией. Для PUT продавец при цене акции 0 теряет не более K − премии на акцию.'],
   'Авторский пример · финансовые опционы, дополнение к плану пользователя (не из лекции об облигациях)',l),
   audit:{instrument:{kind:'option-expiry',optionKind:kind,strike,premium,spot}}};
 }},
 {id:'option-protective-put',topic:'valuation',min:4,build(r,l){
  const purchase=100,strike=O(r,[85,90,95,100]),premium=I(r,3,10),atExpiry=I(r,55,155);
  const intrinsic=Math.max(strike-atExpiry,0),stock=atExpiry-purchase;
  const position=stock+intrinsic-premium;
  const floor=strike-purchase-premium,be=purchase+premium;
  return {...E(this.id,this.topic,'Защитный PUT: страховка акции и цена защиты',
   'Инвестор купил одну акцию по 100 ₽ и одновременно купил европейский PUT с ценой исполнения '+strike+' ₽, заплатив премию '+premium+' ₽. Через год цена акции '+atExpiry+' ₽. Проценты, дивиденды и комиссии для наглядности исключены. Рассчитай выплату PUT, общий финансовый результат портфеля с премией и минимально возможную прибыль при S_T ≥ 0. Объясни, чем защита отличается от бесплатной гарантии прибыли.',
   [q('payoff','Выплата опциона PUT',intrinsic,'₽'),
    q('portfolio','Прибыль акции вместе с PUT и премией',position,'₽'),
    q('floor','Минимально возможная прибыль защищённой позиции',floor,'₽'),
    q('breakeven','Цена акции для нулевой общей прибыли',be,'₽')],
   'Сложи изменение цены акции, max(K−S_T,0) и вычти уплаченную премию. Для S_T ниже K итог фиксируется на K−S0−премия.',
   ['PUT = max('+strike+' − '+atExpiry+',0) = '+intrinsic+' ₽.',
    'Акция: '+atExpiry+' − 100 = '+stock+' ₽. Совокупная прибыль = '+stock+' + '+intrinsic+' − '+premium+' = '+position+' ₽.',
    'Нижняя граница = '+strike+' − 100 − '+premium+' = '+floor+' ₽: защита ограничивает падение, но премия уменьшает результат.',
    'Безубыточность при цене акции выше страйка = 100 + '+premium+' = '+be+' ₽. Цена защиты — гарантированный первоначальный расход, а не дополнительный доход.'],
   'Авторский пример · защитный PUT и управление риском, расширение учебной программы',l),
   audit:{instrument:{kind:'protective-put',purchase,strike,premium,atExpiry}}};
 }}
];
