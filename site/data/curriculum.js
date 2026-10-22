/** Teaching map is a metadata-only layer. It never mutates financial calculations. */
export const STUDY_AREAS=[
  {id:'all',name:'Вся программа',short:'Все направления'},
  {id:'reporting',name:'Финансовая отчётность и анализ',short:'Отчётность и анализ'},
  {id:'capital',name:'Стоимость денег и финансирование',short:'Капитал и облигации'},
  {id:'value',name:'Оценка бизнеса и проектов',short:'DCF и оценка'},
  {id:'deals',name:'Структура капитала и сделки',short:'Сделки и LBO'},
  {id:'forecast',name:'Финансовое моделирование',short:'Финмодели'},
  {id:'taxes',name:'Налоги и налоговый учёт',short:'Налоги'}
];
const explicit={
 'a-horizontal':['reporting','Горизонтальный анализ'], 'a-vertical':['reporting','Вертикальный анализ'],
 'a-du-pont-three':['reporting','Модель Дюпона'], 'a-du-pont-five':['reporting','Модель Дюпона'],
 'a-icr-dscr':['capital','Финансовые ковенанты'], 'a-capm':['capital','CAPM'],
 'a-beta':['capital','Коэффициент Beta'], 'a-beta-unlever':['capital','Рычаговая и безрычаговая Beta'],
 'a-bond-price':['capital','Ценообразование облигаций'], 'a-bond-accrued':['capital','Накопленный купонный доход'],
 'a-bond-duration':['capital','Дюрация облигаций'], 'a-eac':['value','Эквивалентные годовые затраты'],
 'a-dpp':['value','Дисконтированный срок окупаемости'], 'a-social-ramsey':['value','Социальная ставка дисконтирования'],
 'a-dcf-ev':['value','DCF: EV и Equity Value'], 'a-multiples':['value','Мультипликаторы и аналоги'],
 'a-nav':['value','Метод чистых активов'], 'a-recovery':['value','Ликвидационная стоимость'],
 'a-grant-element':['value','Грантовый элемент'], 'a-venture':['deals','Pre-money и Post-money'],
 'a-moic-irr':['deals','IRR и MOIC инвестора'], 'a-lbo':['deals','LBO'],
 'a-wacc-scenarios':['deals','Структура капитала и WACC'], 'a-real-option':['value','Реальные опционы'],
 'a-stress-case':['forecast','Сценарный анализ и Red Team'],
 'v-pv':['capital','Приведённая стоимость PV'], 'v-fv':['capital','Будущая стоимость FV'],
 'v-ytm':['capital','Доходность облигации YTM'], 'v-wacc':['capital','Стоимость капитала WACC'],
 'v-npv-irregular':['value','NPV'], 'v-irr-zero':['value','IRR'],
 'v-pi':['value','Индекс прибыльности PI'], 'v-tax-shield':['taxes','Налоговый щит амортизации'],
 'r-current':['reporting','Коэффициенты ликвидности'], 'r-roe-roa':['reporting','Рентабельность активов и капитала'],
 'r-margins':['reporting','Рентабельность продаж'], 'r-dso':['reporting','Оборачиваемость'],
 'r-cash-cycle':['reporting','Денежный цикл'], 'r-leverage':['reporting','Эффект финансового рычага'],
 'm-break-even':['forecast','Точка безубыточности'], 'm-scenarios':['forecast','Сценарный анализ'],
 'm-funding-gap':['forecast','Потребность в финансировании']
};
const defaults={
 pl:['reporting','Отчёт о финансовых результатах'],cash:['reporting','Отчёт о движении денежных средств'],
 balance:['reporting','Бухгалтерский баланс'],links:['reporting','Связь трёх форм'],
 ratios:['reporting','Финансовые коэффициенты'],valuation:['value','Оценка инвестиционных проектов'],
 tax:['taxes','Налоги'],model:['forecast','Финансовая модель']
};
export function curriculumFor(id,topic){
 const [area,skill]=explicit[id]??defaults[topic]??['reporting','Корпоративные финансы'];
 return {area,skill,areaName:STUDY_AREAS.find(x=>x.id===area)?.name??'Финансы'};
}
