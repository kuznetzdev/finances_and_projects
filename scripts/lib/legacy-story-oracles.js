/** 21 independent calculations from original (legacy) exercise statements. */
import {take,numberFrom,ref,yes,compareScenarioAnswers} from './scenario-oracle-core.js';
export const LEGACY_STORY_ORACLE_IDS=Object.freeze([
 'pl-basics','pl-revenue','pl-subscription','pl-fifo',
 'cash-indirect','cash-direct','cash-missing','cash-interest',
 'balance-equity','balance-depreciation','balance-investment','balance-advance',
 'links-contract','links-error','links-repair','links-audit',
 'valuation-npv','valuation-payback','valuation-multiples','valuation-gordon','valuation-fcff'
]);
const delta=(s,name)=>{
 const m=s.match(new RegExp(name+'\\s+(выросла|выросли|сократилась|сократились)\\s+на\\s+([\\d\\s\u00a0\u202f,\\.]+)\\s+млн ₽','i'));
 if(!m)throw Error('No working capital delta '+name);
 return (m[1].startsWith('сократи')?-1:1)*numberFrom(m[2]);
};
const percent=n=>n/100;
export function reconstructLegacy(id,s){
 switch(id){
 case 'pl-basics':{
  const rev=take(s,'Компания получила выручку','млн ₽'),cogs=take(s,'Себестоимость проданных услуг составила','млн ₽');
  const admin=take(s,'административные расходы','млн ₽'),marketing=take(s,'маркетинг','млн ₽');
  const interest=take(s,'проценты по кредиту','млн ₽'),tax=take(s,'налог на прибыль','млн ₽');
  const gross=rev-cogs,op=gross-admin-marketing,pbt=op-interest;
  return ref({gross,op,pbt,net:pbt-tax});
 }
 case 'pl-revenue':{
  const provided=take(s,'оказала услуги на','млн ₽'),advance=take(s,'(2) получила','млн ₽ аванса');
  const paidSales=take(s,'(3) продала и сразу получила','млн ₽');
  return ref({rev:provided+paidSales,ar:provided,advance});
 }
 case 'pl-subscription':{
  const total=take(s,'получила в начале периода','млн ₽'),months=take(s,'за','-месячную подписку');
  const elapsed=take(s,'услуга оказывалась','мес.'),revenue=total*elapsed/months;
  return ref({revenue,liability:total-revenue,cfo:total});
 }
 case 'pl-fifo':{
  const m=s.match(/по ценам\s+([\s\S]*?)\s+млн ₽ каждый/);
  if(!m)throw Error('Missing 4 FIFO purchase prices');
  const costs=m[1].split(', ').map(numberFrom);
  if(costs.length!==4||costs.some(x=>!Number.isFinite(x)))throw Error('Invalid FIFO purchase list');
  const sold=take(s,'За период продано','шт.');
  return ref({fifo:costs.slice(0,sold).reduce((a,b)=>a+b,0),
   remaining:costs.slice(sold).reduce((a,b)=>a+b,0),
   avg:costs.reduce((a,b)=>a+b,0)*sold/costs.length});
 }
 case 'cash-indirect':{
  const net=take(s,'Чистая прибыль компании за год','млн ₽'),da=take(s,'амортизация','млн ₽');
  const ar=delta(s,'дебиторская задолженность'),inv=delta(s,'запасы'),ap=delta(s,'кредиторская задолженность');
  const nwc=ar+inv-ap;
  return ref({nwc,cfo:net+da-nwc});
 }
 case 'cash-direct':{
  const received=take(s,'клиенты перечислили','млн ₽'),suppliers=take(s,'поставщикам уплачено','млн ₽');
  const wages=take(s,'сотрудникам','млн ₽'),taxes=take(s,'налогов оплачено','млн ₽');
  const capex=take(s,'станок за','млн ₽'),founder=take(s,'Собственник внёс','млн ₽');
  const cfo=received-suppliers-wages-taxes,cfi=-capex,cff=founder;
  return ref({cfo,cfi,cff,total:cfo+cfi+cff});
 }
 case 'cash-missing':{
  if(s.includes('Информация об изменении оборотного капитала отсутствует.'))
   return ref({enough:'Недостаточно данных',missing:'Изменения оборотного капитала'});
  const start=take(s,'Деньги на начало года','млн ₽'),net=take(s,'Чистая прибыль','млн ₽');
  const depreciation=take(s,'амортизация','млн ₽'),capex=take(s,'покупка оборудования (полная оплата)','млн ₽');
  const principal=take(s,'погашение основного долга','млн ₽'),dividends=take(s,'выплата дивидендов','млн ₽');
  const m=s.match(/Операционный оборотный капитал за год (увеличился|сократился) на\s+([\d\s\u00a0\u202f,.]+)\s+млн ₽/);
  if(!m)throw Error('Missing signed working capital change');
  const delta=m[1]==='увеличился'?numberFrom(m[2]):-numberFrom(m[2]);
  return ref({end:start+net+depreciation-delta-capex-principal-dividends});
 }
 case 'cash-interest':{
  const debt=take(s,'получила кредит','млн ₽'),principal=take(s,'погасила','млн ₽');
  const interest=take(s,'начислила и выплатила','млн ₽');
  return ref({cfo:-interest,cff:debt-principal,total:debt-principal-interest,debt:debt-principal});
 }
 case 'balance-equity':{
  const start=take(s,'Собственный капитал на начало года','млн ₽'),net=take(s,'чистая прибыль','млн ₽');
  const dividends=take(s,'выплачены дивиденды','млн ₽'),invest=take(s,'дополнительно внесено','млн ₽');
  return ref({equity:start+net-dividends+invest,cff:invest-dividends,knowcash:'Нет'});
 }
 case 'balance-depreciation':{
  const cost=take(s,'в эксплуатацию за','млн ₽'),residual=take(s,'Ликвидационная стоимость','млн ₽');
  const years=take(s,'срок полезного использования','лет'),elapsed=take(s,'С момента ввода прошло','полных лет');
  const annual=(cost-residual)/years;
  return ref({annual,cum:annual*elapsed,balance:cost-annual*elapsed});
 }
 case 'balance-investment':{
  const assets0=take(s,'В начале года активы компании','млн ₽'),debt=take(s,'обязательства','млн ₽');
  const net=take(s,'получена чистая прибыль','млн ₽'),div=take(s,'дивиденды выплачены','млн ₽');
  const added=take(s,'собственник внёс в капитал','млн ₽');
  const initial=assets0-debt,finalEq=initial+net-div+added;
  return ref({initial,finalEq,assets:finalEq+debt});
 }
 case 'balance-advance':{
  const initial=take(s,'только деньги','млн ₽'),advance=take(s,'получила аванс','млн ₽');
  const equipment=take(s,'купила за деньги оборудование','млн ₽'),da=take(s,'начислила по нему амортизацию','млн ₽');
  const rev=take(s,'оплачены другие услуги на','млн ₽');
  const cash=initial+advance-equipment+rev,equity=initial+rev-da;
  return ref({revenue:rev,liabilities:advance,cash,equity,assets:cash+equipment-da});
 }
 case 'links-contract':{
  const rev=take(s,'полностью оказала услуги на','млн ₽'),cogs=take(s,'Себестоимость','млн ₽');
  const supplier=take(s,'из которых','млн ₽ уже оплачено'),customer=take(s,'Клиент заплатил пока','млн ₽');
  const profit=rev-cogs,cash=customer-supplier,ar=rev-customer,ap=cogs-supplier;
  if(Math.abs((cash+ar)-(ap+profit))>1e-7)throw Error('Contract accounting identity failed');
  return ref({profit,cash,ar,ap,why:'Метод начисления и отсрочки платежей'});
 }
 case 'links-error':{
  const cost=take(s,'Оборудование за','млн ₽'),da=take(s,'Амортизация за первый год','млн ₽');
  return ref({profit:cost-da,ppe:cost-da,cfo:cost,cfi:-cost,total:0,balanced:'Да'});
 }
 case 'links-repair':{
  const old=take(s,'на начало года','млн ₽'),upgrade=take(s,'модернизацию за','млн ₽');
  const depOld=take(s,'по старой части','млн ₽'),depNew=take(s,'по модернизации','млн ₽');
  return ref({pnl:depOld+depNew,cfi:-upgrade,asset:old+upgrade-depOld-depNew,repair:old-depOld,capitalize:'Нет'});
 }
 case 'links-audit':{
  const cost=take(s,'приобрела оборудование за','млн ₽'),da=take(s,'амортизация за год','млн ₽');
  return ref({realpl:-da,realasset:cost-da,realequity:-da,mismatch:cost-da});
 }
 case 'valuation-npv':{
  const investment=take(s,'Проект требует инвестиций','млн ₽'),years=take(s,'следующих','лет');
  const cash=take(s,'проект принесёт денежный поток','млн ₽'),r=take(s,'Ставка дисконтирования','%')/100;
  const pv=Array.from({length:years},(_,i)=>cash/(1+r)**(i+1)).reduce((a,b)=>a+b,0);
  const npv=Number((pv-investment).toFixed(2));
  return ref({npv,decision:yes(npv>0)});
 }
 case 'valuation-payback':{
  const investment=take(s,'Начальные инвестиции в проект','млн ₽'),cash=take(s,'равномерный денежный поток','млн ₽');
  return ref({payback:investment/cash},{payback:'лет'});
 }
 case 'valuation-multiples':{
  const ebitda=take(s,'EBITDA компании =','млн ₽'),multiple=take(s,'оцениваются в','× EBITDA');
  const debt=take(s,'Процентный долг =','млн ₽'),cash=take(s,'денежные средства =','млн ₽');
  const ev=ebitda*multiple,nd=debt-cash;
  return ref({ev,nd,eq:ev-nd});
 }
 case 'valuation-gordon':{
  const fcff1=take(s,'прогнозируется в размере','млн ₽'),g=take(s,'ежегодно растёт на','%')/100;
  const wacc=take(s,'(WACC)','%')/100,debt=take(s,'Процентный долг','млн ₽');
  const cash=take(s,'деньги','млн ₽'),ev=Number((fcff1/(wacc-g)).toFixed(2));
  if(wacc<=g)throw Error('WACC must exceed g');
  return ref({ev,eq:ev-debt+cash});
 }
 case 'valuation-fcff':{
  const cfo=take(s,'CFO =','млн ₽'),interest=take(s,'Проценты уплачены в размере','млн ₽');
  const tax=take(s,'Налоговая ставка','%')/100,capex=take(s,'(CAPEX) =','млн ₽');
  return ref({fcff:cfo+interest*(1-tax)-capex});
 }
 default:throw Error('Unregistered legacy story '+id);
 }
}
export function validateLegacyStoryMath(ex){
 if(!LEGACY_STORY_ORACLE_IDS.includes(ex?.templateId))return [];
 let expected;
 try{expected=reconstructLegacy(ex.templateId,String(ex.story??''));}
 catch(e){return [{code:'LEGACY_SOURCE',message:ex.templateId+': '+e.message}];}
 return compareScenarioAnswers(ex,expected,'LEGACY',{tolerance:.026});
}
