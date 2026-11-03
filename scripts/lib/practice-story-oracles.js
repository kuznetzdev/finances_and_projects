/**
 * Independent accounting and valuation for the 14 practice-variant templates.
 * Uses numbers in the rendered student-facing stories rather than audit fields.
 */
import {take,numberFrom,ref,yes,compareScenarioAnswers} from './scenario-oracle-core.js';
export const PRACTICE_STORY_ORACLE_IDS=Object.freeze([
'x-invoice-payments','x-prepayment-delivery','x-cfo-change-analysis','x-year-comparison',
'x-breakeven-units','x-credit-covenants','x-beta-relever-capm','x-bond-clean-price',
'x-equivalent-annual-cost','x-npv-nwc-return','x-dcf-operating-equity','x-cash-cycle-factors',
'x-venture-next-round','x-discount-tax-savings'
]);
const pv=(xs,r)=>xs.reduce((sum,x,i)=>sum+x/(1+r)**(i+1),0);
const annuity=(r,n)=>(1-(1+r)**(-n))/r;
const schema={
 'x-invoice-payments':[['revenue'],['receivable'],['profit','cfo'],['cash-equal-profit']],
 'x-prepayment-delivery':[[],['received','revenue'],['liability'],['account']],
 'x-cfo-change-analysis':[[],['delta-wc'],['cfo'],['bridge']],
 'x-year-comparison':[[],['change','growth'],['vertical'],['gross']],
 'x-breakeven-units':[[],['contribution','units'],['revenue'],['plan']],
 'x-credit-covenants':[[],['service','dscr'],['icr'],['pass']],
 'x-beta-relever-capm':[[],[],['unlever','relever','re'],['wacc']],
 'x-bond-clean-price':[[],[],['coupon','price'],['premium']],
 'x-equivalent-annual-cost':[[],[],['pva','eaca','eacb'],['pvb','winner']],
 'x-npv-nwc-return':[[],[],['initial','terminal','npv'],['decision']],
 'x-dcf-operating-equity':[[],[],[],['terminal','pvterminal','ev','equity']],
 'x-cash-cycle-factors':[[],[],['before','after'],['improve']],
 'x-venture-next-round':[[],[],['post','stake','founders'],['exit']],
 'x-discount-tax-savings':[[],[],['linear','accelerated','tax'],['pv-delta']]
};
export function reconstructPractice(id,s){
 switch(id){
 case 'x-invoice-payments':{
  const sales=take(s,'Стоимость работ','млн ₽'),cashPct=take(s,'заказчик оплатил','%')/100;
  const expense=take(s,'Операционные расходы по проекту','млн ₽'),paid=sales*cashPct;
  return ref({revenue:sales,receivable:sales-paid,profit:sales-expense,cfo:paid-expense,
   'cash-equal-profit':yes(Math.abs(paid-(sales-expense))<1e-7)});
 }
 case 'x-prepayment-delivery':{
  const paid=take(s,'1 января компания получила','млн ₽'),perMonth=take(s,'Стоимость каждого месяца одинакова:','млн ₽');
  const elapsed=take(s,'оказаны услуги ровно за');
  if(Math.abs(paid-12*perMonth)>1e-7)throw Error('Annual prepayment does not match twelve months');
  return ref({received:paid,revenue:perMonth*elapsed,liability:paid-perMonth*elapsed,account:'Обязательствам'});
 }
 case 'x-cfo-change-analysis':{
  const ni=take(s,'чистая прибыль составила','млн ₽'),da=take(s,'амортизация','млн ₽');
  const ar=take(s,'дебиторская задолженность увеличилась на','млн ₽');
  const inventory=take(s,'запасы — на','млн ₽'),ap=take(s,'кредиторская задолженность поставщикам — на','млн ₽');
  const wc=ar+inventory-ap;
  return ref({'delta-wc':wc,cfo:ni+da-wc,bridge:da-wc});
 }
 case 'x-year-comparison':{
  const previous=take(s,'за предыдущий год составила','млн ₽'),current=take(s,'за текущий год —','млн ₽');
  const cogs=take(s,'Себестоимость продаж в текущем году равна','млн ₽');
  return ref({change:current-previous,growth:100*(current-previous)/previous,
   vertical:100*cogs/current,gross:current-cogs},{growth:'%',vertical:'%'});
 }
 case 'x-breakeven-units':{
  const price=take(s,'цена одной единицы продукции составляет','₽'),variable=take(s,'Переменные затраты на единицу','₽');
  const fixed=take(s,'постоянные расходы за месяц','млн ₽')*1e6,planned=take(s,'Плановый месячный объём —','единиц');
  const contribution=price-variable,units=Math.ceil(fixed/contribution);
  return ref({contribution,units,revenue:units*price/1e6,plan:(planned*contribution-fixed)/1e6},
   {contribution:'₽',units:'шт.'});
 }
 case 'x-credit-covenants':{
  const cfads=take(s,'(CFADS), равен','млн ₽'),ebit=take(s,'(EBIT)','млн ₽');
  const interest=take(s,'нужно уплатить','млн ₽ процентов'),principal=take(s,'и','млн ₽ основного долга');
  const min=take(s,'DSCR не ниже'),service=interest+principal;
  return ref({service,dscr:cfads/service,icr:ebit/interest,pass:yes(cfads/service+1e-9>=min)},
    {dscr:'раз',icr:'раз'});
 }
 case 'x-beta-relever-capm':{
  const betaL=take(s,'его рычаговая beta равна'),analogDE=take(s,'D/E =');
  const targetDE=take(s,'целевое D/E ='),tax=take(s,'Налог на прибыль','%')/100;
  const rf=take(s,'Безрисковая ставка','%'),premium=take(s,'премия за рыночный риск','процентных пунктов');
  const kd=take(s,'стоимость долга до налогообложения','%')/100;
  const betaU=betaL/(1+(1-tax)*analogDE),betaOur=betaU*(1+(1-tax)*targetDE);
  const re=rf+betaOur*premium,weight=targetDE/(1+targetDE);
  return ref({unlever:betaU,relever:betaOur,re,wacc:(1-weight)*re+weight*kd*(1-tax)*100},
    {unlever:'раз',relever:'раз',re:'%',wacc:'%'});
 }
 case 'x-bond-clean-price':{
  const face=take(s,'облигация номиналом','₽'),cp=take(s,'фиксированный годовой купон','%')/100;
  const years=take(s,'до погашения осталось','полных'),y=take(s,'доходность на дату оценки','%')/100;
  const coupon=face*cp,price=pv(Array(years).fill(coupon),y)+face/(1+y)**years;
  return ref({coupon,price,premium:price>face+.00001?'Премия':price<face-.00001?'Дисконт':'По номиналу'},
   {coupon:'₽',price:'₽'});
 }
 case 'x-equivalent-annual-cost':{
  const capA=take(s,'Вариант А: затраты на покупку сегодня','млн ₽'),opexA=take(s,'ежегодное обслуживание','млн ₽');
  const lifeA=take(s,'срок службы','года'),capB=take(s,'Вариант Б: покупка сегодня','млн ₽');
  const opexB=take(s,'Вариант Б: покупка сегодня '+capB+' млн ₽, ежегодное обслуживание','млн ₽');
  const lifeB=take(s,'срок службы','лет'),r=take(s,'Ставка дисконтирования','%')/100;
  const aFactor=annuity(r,lifeA),bFactor=annuity(r,lifeB);
  const pva=capA+opexA*aFactor,pvb=capB+opexB*bFactor;
  const eaca=pva/aFactor,eacb=pvb/bFactor;
  return ref({pva,eaca,eacb,pvb,winner:eaca<eacb?'А':'Б'},{eaca:'млн ₽/год',eacb:'млн ₽/год'});
 }
 case 'x-npv-nwc-return':{
  const equipment=take(s,'оплатить оборудование','млн ₽'),nwc=take(s,'дополнительно вложить','млн ₽');
  const m=s.match(/по годам 1–4 составят\s*([\s\S]+?)\s+млн ₽/);
  if(!m)throw Error('Missing 4 yearly cash flows');
  const flows=m[1].split(', ').map(numberFrom);
  if(flows.length!==4||flows.some(v=>!Number.isFinite(v)))throw Error('Wrong forecast length');
  const salvage=take(s,'оборудование продаётся за','млн ₽'),rate=take(s,'Ставка дисконтирования','%')/100;
  const initial=equipment+nwc,terminal=flows[3]+salvage+nwc;
  const npv=pv([...flows.slice(0,3),terminal],rate)-initial;
  return ref({initial,terminal,npv,decision:yes(npv>0)});
 }
 case 'x-dcf-operating-equity':{
  const m=s.match(/FCFF\) в конце ближайших трёх лет:\s*([\d\s\u00a0\u202f]+),\s*([\d\s\u00a0\u202f]+)\s+и\s+([\d\s\u00a0\u202f]+)\s+млн ₽/);
  if(!m)throw Error('Three-year FCFF input missing');
  const flows=m.slice(1).map(numberFrom);
  const r=take(s,'капитала WACC','%')/100,g=take(s,'стабильно растёт на','%')/100;
  const debt=take(s,'Рыночный процентный долг на дату оценки','млн ₽');
  const cash=take(s,'свободные избыточные деньги','млн ₽');
  const tv=flows[2]*(1+g)/(r-g),pvtv=tv/(1+r)**3,ev=pv(flows,r)+pvtv;
  if(r<=g)throw Error('WACC must exceed terminal growth');
  return ref({terminal:tv,pvterminal:pvtv,ev,equity:ev-debt+cash});
 }
 case 'x-cash-cycle-factors':{
  const dio=take(s,'(DIO) составляет','дней'),dso=take(s,'(DSO) —','дней'),dpo=take(s,'(DPO) —','дней');
  const stock=take(s,'оборачиваемость запасов на','дней'),customer=take(s,'ожидание оплаты покупателей на','дней');
  const payable=take(s,'отсрочку поставщиков на','дней');
  const before=dio+dso-dpo,after=before-stock-customer-payable;
  return ref({before,after,improve:before-after},{before:'дней',after:'дней',improve:'дней'});
 }
 case 'x-venture-next-round':{
  const pre=take(s,'(pre-money) в','млн ₽'),invest=take(s,'непосредственно в компанию','млн ₽');
  const exit=take(s,'по оценке всего капитала','млн ₽'),post=pre+invest,stake=100*invest/post;
  return ref({post,stake,founders:100-stake,exit:exit*invest/post},{stake:'%',founders:'%'});
 }
 case 'x-discount-tax-savings':{
  const cost=take(s,'стоимостью','млн ₽'),life=take(s,'срок полезного использования');
  const tax=take(s,'Ставка налога на прибыль','%')/100,discount=take(s,'ставка дисконтирования налоговых выгод','%')/100;
  const linear=cost/life,den=life*(life+1)/2,first=cost*life/den;
  const linearShield=Array(life).fill(linear*tax),accShield=Array.from({length:life},(_,i)=>cost*(life-i)/den*tax);
  return ref({linear,accelerated:first,tax:first*tax,'pv-delta':pv(accShield,discount)-pv(linearShield,discount)});
 }
 default:throw Error('Unapproved practice template '+id);
 }
}
export function validatePracticeStoryMath(ex){
 if(!PRACTICE_STORY_ORACLE_IDS.includes(ex?.templateId))return [];
 let expected;
 try{expected=reconstructPractice(ex.templateId,String(ex.story??''));}
 catch(e){return [{code:'PRACTICE_SOURCE',message:ex.templateId+': '+e.message}];}
 const required=schema[ex.templateId].slice(0,Math.max(1,Math.min(4,Number(ex.level)||1))).flat();
 return compareScenarioAnswers(ex,Object.fromEntries(Object.entries(expected).filter(([key])=>required.includes(key))),'PRACTICE',{tolerance:.03});
}
