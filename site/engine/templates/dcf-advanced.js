/** DCF exercises with single time axis, explicit units and consistent valuation bases. */
import {fmt as F,randomInt as I,oneOf as O,num as q,exercise as E} from '../helpers.js';
const money=x=>F(x,2)+' млн ₽', pct=x=>F(x*100,2)+'%';
const pv=(values,r,mid=false)=>values.reduce((s,x,i)=>s+x/(1+r)**(i+(mid?.5:1)),0);
const build=(self,l,title,story,questions,hint,steps,audit)=>({
 ...E(self.id,self.topic,title,story,questions,hint,steps,'МФТИ Лекция 5 «Введение в оценку DCF» (2026); оценка доходным подходом',l),audit
});
export const templates=[
 {id:'dcf-fcff-ebitda-tax',topic:'valuation',min:2,build(r,l,{tax}){
  const ebitda=I(r,18,50)*10,da=I(r,2,6)*10,capex=I(r,4,10)*10,nwc=I(r,1,3)*10;
  const t=tax.profitRate,ebit=ebitda-da,nopat=ebit*(1-t),fcff=nopat+da-capex-nwc;
  const wacc=O(r,[.11,.13,.15]),g=.02;
  const questions=[q('ebit','EBIT после амортизации',ebit),q('nopat','NOPAT при условном налоге на операционную прибыль',nopat),q('fcff','FCFF за год',fcff)];
  if(l>=4)questions.push(q('tax-operating','Условный операционный налог',ebit*t),q('reinvestment','CAPEX + увеличение NWC',capex+nwc));
  else questions.push(q('net-reinvestment','Чистые инвестиции (CAPEX + ΔNWC − D&A)',capex+nwc-da));
  return build(this,l,'От EBITDA до свободного потока компании',
   'Компания оценивает свободный поток за один прогнозный год, все суммы в млн ₽: EBITDA '+money(ebitda)+', амортизация D&A '+money(da)+', капитальные вложения CAPEX '+money(capex)+', увеличение операционного оборотного капитала ΔNWC '+money(nwc)+'. Ставка налога на прибыль '+pct(t)+'. Для расчёта используется условный налог на положительный EBIT без процентных платежей, убытков и налоговых льгот. Финансовые поступления от кредиторов не включаются в FCFF. Для контекста оценка компании использует WACC '+pct(wacc)+' и стабильный рост '+pct(g)+', однако в этом задании требуется только годовой поток.',
   questions,'EBITDA уменьшается на D&A для получения EBIT. Из EBIT найдите NOPAT, затем верните неденежную амортизацию и вычтите фактические реинвестиции. Не вычитайте процентные платежи.',
   ['EBIT = EBITDA − D&A = '+money(ebit)+'.','Условный налог на EBIT = '+money(ebit*t)+', NOPAT = '+money(nopat)+'.',
    'FCFF = NOPAT + D&A − CAPEX − ΔNWC = '+money(fcff)+'.','Чистые инвестиции за период = '+money(capex+nwc-da)+'.','Рост NWC уменьшает денежный поток, а неденежная амортизация прибавляется обратно.'],
   {ebitda,da,ebit,capex,nwc,tax:t,fcff,wacc,g});
 }},
 {id:'dcf-fcfe-equity',topic:'valuation',min:3,build(r,l,{tax}){
  const t=tax.profitRate,fcff=I(r,10,19)*10,interest=I(r,1,4)*10,netBorrowing=I(r,-2,2)*10;
  const ke=O(r,[.14,.16,.18]),fcfe=fcff-interest*(1-t)+netBorrowing;
  // Constant FCFE perpetuity is a standalone equity cash-flow assumption, not a derived capital-structure optimization.
  const equity=fcfe/ke,wacc=.11,g=0;
  const questions=[q('interest-net','Процентные платежи после налога',interest*(1-t)),
   q('fcfe','FCFE, доступный акционерам',fcfe),q('equity','Equity Value при допущении о бессрочном неизменном FCFE',equity),
   q('net-new-debt','Чистое привлечение долга (отрицательное при погашении)',netBorrowing)];
  return build(this,l,'Оценка собственного капитала через FCFE',
   'Для отдельной упрощённой модели собственного капитала свободный поток компании FCFF в ближайшем году '+money(fcff)+'. Годовые процентные платежи '+money(interest)+', налог '+pct(t)+' и все проценты полностью уменьшают налогооблагаемую прибыль. Чистое привлечение долга (новые займы минус погашение основного долга) '+money(netBorrowing)+'. Для расчёта условно принимается, что FCFE после этих корректировок остаётся постоянным ежегодно бессрочно и выплачивается в конце года. Требуемая доходность собственного капитала Ke '+pct(ke)+', рост 0%, ограничений по распределению нет. Нельзя дисконтировать FCFE по WACC; WACC '+pct(wacc)+' здесь указан лишь для сравнения метода.',
   questions,'Найдите поток акционерам вычитанием посленалоговых процентов из FCFF и прибавлением чистого привлечения долга. Дисконтируйте именно по Ke, а не WACC. Отрицательное чистое привлечение означает погашение.',
   ['Проценты после налога = '+money(interest*(1-t))+'.','FCFE = FCFF − проценты × (1 − T) + чистое привлечение долга = '+money(fcfe)+'.',
    'Для постоянного ежегодного FCFE при нулевом росте Equity Value = FCFE / Ke = '+money(equity)+'.',
    'Это отдельная иллюстрация FCFE. Стационарность потока уже принята в условии, а не доказана из его одногодовых компонентов.'],
   {tax:t,fcff,interest,netBorrowing,fcfe,ke,equity,wacc,g});
 }},
 {id:'dcf-two-stage',topic:'valuation',min:3,build(r,l){
  const years=O(r,[3,4,5]),first=I(r,8,18)*10,growth=O(r,[.06,.08,.1]),wacc=O(r,[.12,.14,.16]),g=O(r,[.02,.03]);
  const fcffs=Array.from({length:years},(_,i)=>first*(1+growth)**i);
  const tv=fcffs.at(-1)*(1+g)/(wacc-g),pvExplicit=pv(fcffs,wacc),pvTv=tv/(1+wacc)**years,ev=pvExplicit+pvTv;
  const questions=[q('last-fcff','FCFF последнего прогнозного года',fcffs.at(-1)),q('pv-explicit','PV потоков прогнозного периода',pvExplicit),
   q('terminal','Терминальная стоимость на конец прогнозного периода',tv),q('ev','Enterprise Value на дату оценки',ev)];
  if(l>=4)questions.push(q('terminal-share','Доля терминальной стоимости в общей EV, по PV',pvTv/ev*100,'%'));
  return build(this,l,'Двухэтапный DCF: повышенный рост и стабильная фаза',
   'Компания прогнозирует FCFF на '+years+' года. FCFF первого года '+money(first)+', последующие годовые потоки в прогнозе растут на '+pct(growth)+' и поступают в конце каждого года. Начиная с года '+(years+1)+' ожидается стабильный темп роста '+pct(g)+' бессрочно. WACC '+pct(wacc)+' и неизменен на всём горизонте. Для терминала используйте FCFF следующего года, а не поток последнего прогнозного года без роста. Все денежные суммы в млн ₽, долг и неоперационные активы не рассматриваются: требуется EV, а не Equity.',
   questions,'Сначала сформируйте FCFF для каждого прогнозного года, дисконтируйте их к t=0. Терминальную стоимость рассчитывайте на t=n через FCFF_(n+1)/(WACC−g) и тоже приведите к t=0.',
   ['FCFF в прогнозе: '+fcffs.map(x=>money(x)).join('; ')+'.','Приведённая стоимость прогнозного периода = '+money(pvExplicit)+'.',
    'Терминальная стоимость TV_'+years+' = FCFF_'+(years+1)+' / (WACC−g) = '+money(tv)+'.',
    'PV терминала = '+money(pvTv)+'. Enterprise Value = '+money(ev)+'.',
    'Доля PV терминала в EV = '+F(100*pvTv/ev,2)+'%. Условие устойчивости требует g < WACC; столь большая доля терминала повышает зависимость оценки от ставки.'],
   {years,first,growth,fcffs,tv,pvExplicit,pvTv,ev,wacc,g});
 }},
 {id:'dcf-terminal-exit',topic:'valuation',min:3,build(r,l){
  const years=O(r,[3,4,5]),first=I(r,7,13)*10,growth=O(r,[.05,.07]),wacc=O(r,[.12,.14,.16]),g=.02,multiple=O(r,[5,6,7,8]);
  const flows=Array.from({length:years},(_,i)=>first*(1+growth)**i);
  const exitEbitda=I(r,25,50)*10, tv=exitEbitda*multiple,pvExplicit=pv(flows,wacc),pvTerminal=tv/(1+wacc)**years,ev=pvExplicit+pvTerminal;
  const questions=[q('exit-ebitda','EBITDA последнего прогнозного года',exitEbitda),q('tv','Терминальная стоимость по EV/EBITDA на конец года n',tv),
   q('pv-tv','PV терминальной стоимости',pvTerminal),q('ev','Enterprise Value компании',ev)];
  return build(this,l,'DCF: терминальная стоимость через мультипликатор выхода',
   'Компания прогнозирует положительный FCFF в конце каждого из '+years+' лет: первый год '+money(first)+', рост в прогнозе '+pct(growth)+'. WACC '+pct(wacc)+'. Предполагается, что EBITDA в последнем прогнозном году составит '+money(exitEbitda)+'. По рыночным аналогам принят терминальный EV/EBITDA '+multiple+'×, применяемый к EBITDA именно последнего года. Мультипликатор задаёт стоимость операций на t='+years+', его не следует применять к FCFF. Все суммы млн ₽. Неоперационных активов и долга для расчёта Equity здесь не дано.',
   questions,'Рассчитайте PV явных FCFF, затем умножьте выходную EBITDA на мультипликатор. Дисконтируйте полученную терминальную EV с конца последнего года на дату оценки.',
   ['Потоки по годам: '+flows.map(x=>money(x)).join('; ')+'.','PV явного прогноза = '+money(pvExplicit)+'.',
    'Терминальный EV на t='+years+' = EBITDA × EV/EBITDA = '+money(tv)+'.','PV терминала = '+money(pvTerminal)+'.',
    'Общая EV = PV прогнозных FCFF + PV терминала = '+money(ev)+'. Мультипликатор не должен определяться из оценённой этой же моделью EV, иначе получится круговая логика.'],
   {years,first,growth,flows,exitEbitda,multiple,tv,pvExplicit,pvTerminal,ev,wacc,g});
 }},
 {id:'dcf-midyear',topic:'valuation',min:3,build(r,l){
  const years=O(r,[3,4,5]),first=I(r,8,20)*10,growth=O(r,[.03,.05]),wacc=O(r,[.11,.13,.15]),g=0;
  const flows=Array.from({length:years},(_,i)=>first*(1+growth)**i);
  const midPv=pv(flows,wacc,true),endPv=pv(flows,wacc,false);
  const questions=[q('pv-end','PV потоков при поступлении в конце каждого года',endPv),q('pv-mid','PV потоков при поступлении в середине года',midPv),
   q('pv-delta','Разница PV при mid-year и end-year',midPv-endPv),q('first-mid','PV первого денежного потока в середине первого года',flows[0]/(1+wacc)**.5)];
  return build(this,l,'Дисконтирование: середина года против конца года',
   'Компания получает равномерно распределённые внутри каждого года операционные денежные потоки. В учебном сравнении они заменяются одним платежом в середине каждого года. Прогноз '+years+' лет, FCFF первого года '+money(first)+', рост следующих прогнозных потоков '+pct(growth)+', WACC '+pct(wacc)+'. Поступления считаются положительными, отложенные налоги и долг отсутствуют. Сравните две конвенции исключительно для явных прогнозных потоков без терминальной стоимости: конец года t=1,2,... и середина t=0,5;1,5;... .',
   questions,'Для конвенции конца года степень ставки равна 1,2,... Для mid-year на 0,5 меньше. Суммируйте приведённые значения, не добавляя терминал, которого нет в исходных данных.',
   ['Потоки по годам = '+flows.map(x=>money(x)).join('; ')+'.',
    'PV при end-year = '+money(endPv)+'.','PV при mid-year = '+money(midPv)+'.',
    'Разница в оценке = '+money(midPv-endPv)+'.','Положительные потоки приходят раньше, поэтому mid-year повышает PV при положительной ставке. Не переносите терминальную стоимость автоматически на середину последнего года.'],
   {years,first,growth,flows,midPv,endPv,wacc,g});
 }},
 {id:'dcf-sensitivity',topic:'valuation',min:4,build(r,l){
  const fcff=I(r,7,17)*10,wacc=O(r,[.11,.13,.15]),g=O(r,[.02,.03]),step=.01;
  const value=(rate,growth)=>fcff*(1+growth)/(rate-growth);
  const base=value(wacc,g),upperWaccValue=value(wacc+step,g),upperGrowthValue=value(wacc,g+step),lowerGrowthValue=value(wacc,g-step);
  const questions=[q('ev-base','Базовая EV по модели Гордона',base),q('ev-rate-up','EV при увеличении WACC на 1 п.п.',upperWaccValue),
   q('ev-growth-up','EV при увеличении g на 1 п.п.',upperGrowthValue),q('ev-growth-down','EV при снижении g на 1 п.п.',lowerGrowthValue),
   q('rate-effect','Изменение EV при увеличении WACC',upperWaccValue-base)];
  return build(this,l,'Чувствительность DCF к WACC и терминальному росту',
   'Стабильный FCFF текущего года (t=0) '+money(fcff)+'. Начинающийся с t=1 бессрочный денежный поток растёт с постоянной ставкой g='+pct(g)+', и весь поток дисконтируется по WACC='+pct(wacc)+'. Изучите изменение стоимости при отдельном увеличении WACC на 1 процентный пункт, увеличении g на 1 пункт и снижении g на 1 пункт. Все остальные параметры неизменны. Здесь используется единая бессрочная стабильная модель без отдельного прогнозного этапа; долг и деньги не вычитаются.',
   questions,'Базовая EV = FCFF_0×(1+g)/(WACC−g). Изменяйте по одному параметру: в каждом сценарии разность WACC−g должна оставаться положительной. 1 п.п. означает 0,01, а не рост на 1%.',
   ['FCFF следующего года = '+money(fcff*(1+g))+'.',
    'Базовая EV = '+money(base)+'.','После увеличения WACC на 1 п.п. EV = '+money(upperWaccValue)+'.',
    'После увеличения g на 1 п.п. EV = '+money(upperGrowthValue)+'; при уменьшении g EV = '+money(lowerGrowthValue)+'.',
    'Рост WACC уменьшает оценку; рост устойчивого g повышает оценку, но допущение g<WACC обязательно.'],
   {fcff,wacc,g,step,base,upperWaccValue,upperGrowthValue,lowerGrowthValue});
 }},
 {id:'dcf-income-capitalization',topic:'valuation',min:3,build(r,l){
  const income=I(r,8,19)*10,wacc=O(r,[.12,.14,.16]),g=O(r,[.02,.03]),capRate=wacc-g,value=income/capRate;
  const questions=[q('cap-rate','Ставка капитализации WACC − g',capRate*100,'%'),q('income','Нормализованный FCFF следующего года',income),
   q('value','Стоимость операционного бизнеса',value),q('value-no-growth','Стоимость при нулевом росте, той же ставке WACC',income/wacc)];
  return build(this,l,'Метод капитализации стабильного свободного дохода',
   'Зрелый устойчивый бизнес ожидает нормализованный FCFF в следующем году '+money(income)+'. После этого денежный поток ежегодно растёт на '+pct(g)+' без ограничения срока. Стоимость финансирования WACC '+pct(wacc)+' и соответствует риску FCFF, налоговые и инвестиционные платежи уже отражены в нормализованном потоке. Для стабильного бизнеса метод прямой капитализации использует ставку капитализации R = WACC − g. Все суммы млн ₽. Долг и внеоперационные активы не заданы, рассчитывайте стоимость операций (EV).',
   questions,'Не путайте ставку капитализации с доходностью WACC: при устойчивом росте она равна WACC−g. Капитализируется именно денежный поток следующего года.',
   ['R = WACC − g = '+pct(capRate)+'.','База капитализации: нормализованный FCFF следующего года '+money(income)+'.',
    'EV = FCFF_1 / R = '+money(value)+'.','При нулевом росте, но том же денежном потоке и WACC: EV = '+money(income/wacc)+'.',
    'Ставка капитализации требует сопоставления вида потока и вида стоимости. Нельзя капитализировать FCFE по ставке для FCFF.'],
   {income,wacc,g,capRate,value});
 }}
];