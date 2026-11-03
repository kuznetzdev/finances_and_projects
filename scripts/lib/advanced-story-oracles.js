
/** Independent finance formulas from user-visible statements, not stored answers. */
export const ADVANCED_STORY_ORACLE_IDS=Object.freeze([
'a-horizontal','a-vertical','a-du-pont-three','a-du-pont-five','a-icr-dscr','a-capm','a-beta','a-beta-unlever',
'a-bond-price','a-bond-accrued','a-bond-duration','a-eac','a-dpp','a-social-ramsey','a-multiples','a-nav',
'a-recovery','a-grant-element','a-venture','a-moic-irr','a-lbo','a-wacc-scenarios','a-real-option',
'a-stress-case','a-integrated-statements'
]);
const yes=b=>b?'Да':'Нет';
const float=s=>Number(String(s).replace(/[\s\u00a0\u202f]/g,'').replace(',','.'));
const number='([+-]?\\d(?:[\\d\\u00a0\\u202f ]*\\d)?(?:[.,]\\d+)?)';
const esc=s=>Array.from(s).map(ch=>('\\^$.*+?()[]{}|'.includes(ch)?'\\'+ch:ch)).join('');
const take=(story,prefix,suffix='')=>{
 const pattern=new RegExp(esc(prefix)+'\\s*'+number+'\\s*'+esc(suffix),'i');
 const m=story.match(pattern);
 if(!m)throw Error('Cannot extract '+JSON.stringify(prefix)+' / '+JSON.stringify(suffix));
 const n=float(m[1]);
 if(!Number.isFinite(n))throw Error('Non-finite input '+m[1]);
 return n;
};
const pv=(flows,r)=>flows.reduce((s,cf,i)=>s+cf/(1+r)**(i+1),0);
const refs=(values,units={})=>Object.fromEntries(Object.entries(values).map(([key,value])=>
 [key,{value,unit:units[key]??(typeof value==='string'?null:'млн ₽')}]));
export function reconstructAdvanced(id,t){
 switch(id){
 case 'a-horizontal':{
  const a=take(t,'предыдущий год составила','млн ₽'),b=take(t,'за отчётный —','млн ₽');
  return refs({delta:b-a,growth:100*(b-a)/a},{growth:'%'});
 }
 case 'a-vertical':{
  const sales=take(t,'Выручка торговой компании за год составила','млн ₽'),cost=take(t,'себестоимость продаж —','млн ₽');
  return refs({share:cost/sales*100,margin:(sales-cost)/sales*100,gross:sales-cost},{share:'%',margin:'%'});
 }
 case 'a-du-pont-three':{
  const revenue=take(t,'За год выручка компании','млн ₽'),net=take(t,'чистая прибыль','млн ₽');
  const assets=take(t,'Средние активы за год','млн ₽'),equity=take(t,'средний собственный капитал','млн ₽');
  return refs({m:100*net/revenue,turn:revenue/assets,mult:assets/equity,roe:100*net/equity},{m:'%',turn:'раз',mult:'раз',roe:'%'});
 }
 case 'a-du-pont-five':{
  const revenue=take(t,'Сервисная компания: выручка','млн ₽'),ebit=take(t,'EBIT','млн ₽');
  const interest=take(t,'процентные расходы','млн ₽'),ebt=take(t,'EBT','млн ₽'),tax=take(t,'Налог на прибыль','%')/100;
  const assets=take(t,'Средние активы','млн ₽'),equity=take(t,'средний капитал','млн ₽');
  if(Math.abs(ebit-interest-ebt)>.01)throw Error('EBT does not match EBIT less interest');
  return refs({tax:100*(1-tax),interest:ebt/ebit,margin:100*ebit/revenue,turn:revenue/assets,
   mult:assets/equity,roe:100*ebt*(1-tax)/equity},{tax:'%',interest:'раз',margin:'%',turn:'раз',mult:'раз',roe:'%'});
 }
 case 'a-icr-dscr':{
  const ebit=take(t,'EBIT за год','млн ₽'),interest=take(t,'начисленные проценты','млн ₽');
  const cash=take(t,'CFADS), составляет','млн ₽'),principal=take(t,'Погашение основного долга','млн ₽');
  const min=take(t,'Минимальный DSCR по договору —');
  return refs({icr:ebit/interest,dscr:cash/(interest+principal),test:yes(cash/(interest+principal)>=min)},{icr:'раз',dscr:'раз'});
 }
 case 'a-capm':{
  const rf=take(t,'Безрисковая ставка','%'),premium=take(t,'ожидаемая премия рынка','п.п.'),beta=take(t,'рычаговая β акции');
  return refs({re:rf+beta*premium},{re:'%'});
 }
 case 'a-beta':{
  const cov=take(t,'ковариация доходностей','условных единиц²'),variance=take(t,'дисперсия рыночной доходности','в тех же единицах²');
  return refs({beta:cov/variance},{beta:'раз'});
 }
 case 'a-beta-unlever':{
  const bu=take(t,'β без долга равна'),de=take(t,'D/E ='),tax=take(t,'Налог на прибыль','%')/100;
  return refs({levered:bu*(1+(1-tax)*de)},{levered:'раз'});
 }
 case 'a-bond-price':{
  const face=take(t,'Номинал облигации','₽'),coupon=take(t,'Купонная ставка','%')/100;
  const years=take(t,'Осталось','полных лет'),yieldRate=take(t,'доходность аналогичных облигаций','%')/100;
  const annual=face*coupon,price=pv(Array(years).fill(annual),yieldRate)+face/(1+yieldRate)**years;
  return refs({coupon:annual,price,discount:yes(price<face)},{coupon:'₽',price:'₽'});
 }
 case 'a-bond-accrued':{
  const face=take(t,'Номинал облигации','₽'),coupon=take(t,'годовой купон','%')/100;
  const days=take(t,'прошло','дней'),year=take(t,'год равен','дням'),clean=take(t,'Чистая рыночная цена','₽');
  const accrued=face*coupon*days/year;
  return refs({nkd:accrued,dirty:clean+accrued},{nkd:'₽',dirty:'₽'});
 }
 case 'a-bond-duration':{
  const years=take(t,'погашается ровно через','лет'),ytm=take(t,'доходность к погашению','%')/100;
  return refs({mac:years,mod:years/(1+ytm)},{mac:'лет',mod:'лет'});
 }
 case 'a-eac':{
  const years=take(t,'со сроком службы','лет'),cost=take(t,'и стоимостью','млн ₽');
  const rate=take(t,'Ставка дисконтирования','%')/100, factor=(1-(1+rate)**(-years))/rate;
  return refs({factor,eac:cost/factor},{factor:'раз'});
 }
 case 'a-dpp':{
  const invest=take(t,'Стартовые вложения','млн ₽'),annual=take(t,'денежные потоки по','млн ₽');
  const n=take(t,'в течение','лет'),r=take(t,'Дисконтирование','%')/100;
  let cum=0,dpp=null;
  for(let i=1;i<=n;i++){
   const flow=annual/(1+r)**i;
   if(cum+flow>=invest){dpp=i-1+(invest-cum)/flow;break;}
   cum+=flow;
  }
  return refs(dpp==null?{exists:'Нет'}:{exists:'Да',dpp},{dpp:'лет'});
 }
 case 'a-social-ramsey':{
  const rho=take(t,'ρ =','%'),eta=take(t,'η ='),growth=take(t,'g =','%');
  return refs({rate:rho+eta*growth},{rate:'% годовых'});
 }
 case 'a-multiples':{
  const m=t.match(/мультипликаторы EV\/EBITDA:\s*([\s\S]+?)×\.\s*Оцениваемая/);
  if(!m)throw Error('Comparables list missing');
  const ms=m[1].split(/×;\s*/).map(float);
  if(ms.length!==5||ms.some(x=>!Number.isFinite(x)))throw Error('Expected five comparables');
  const median=[...ms].sort((a,b)=>a-b)[2];
  const ebitda=take(t,'нормализованную EBITDA','млн ₽'),debt=take(t,'чистый долг (процентный долг минус денежные средства)','млн ₽');
  return refs({median,ev:median*ebitda,eq:median*ebitda-debt},{median:'раз'});
 }
 case 'a-nav':{
  const assets=take(t,'активы компании','млн ₽'),liabilities=take(t,'обязательства','млн ₽');
  const adjustment=take(t,'переоценку активов на','млн ₽');
  return refs({book:assets-liabilities,nav:assets+adjustment-liabilities});
 }
 case 'a-recovery':{
  const debt=take(t,'кредиторов одной очереди','млн ₽'),assets=take(t,'Активы удаётся продать за','млн ₽');
  const fees=take(t,'расходы процедуры','млн ₽'),available=Math.max(0,assets-fees);
  return refs({available,recovery:100*Math.min(debt,available)/debt},{recovery:'%'});
 }
 case 'a-grant-element':{
  const face=take(t,'льготный заём','млн ₽'),years=take(t,'на','лет под');
  const coupon=take(t,'лет под','%')/100,market=take(t,'Рыночная доходность аналогичного кредита','%')/100;
  const value=pv(Array(years).fill(face*coupon),market)+face/(1+market)**years;
  return refs({pv:value,grant:face-value});
 }
 case 'a-venture':{
  const pre=take(t,'(pre-money)','млн ₽'),invest=take(t,'Новый инвестор вносит','млн ₽');
  return refs({post:pre+invest,investor:100*invest/(pre+invest),founders:100*pre/(pre+invest)},{investor:'%',founders:'%'});
 }
 case 'a-moic-irr':{
  const invested=take(t,'Фонд инвестировал','млн ₽'),years=take(t,'через','лет');
  const exit=take(t,'продал свою долю за','млн ₽'),moic=exit/invested;
  return refs({moic,irr:100*(moic**(1/years)-1)},{moic:'раз',irr:'%'});
 }
 case 'a-lbo':{
  const price=take(t,'компании за','млн ₽'),leverage=take(t,'финансирует сделку долгом на','%')/100;
  const years=take(t,'За','года компания'),repaid=take(t,'на погашение долга','млн ₽');
  const exit=take(t,'Цена продажи бизнеса через '+years+' года','млн ₽');
  const debt=price*leverage,equity=price-debt,remain=debt-repaid,proceeds=exit-remain,moic=proceeds/equity;
  return refs({debt,equity,remain,proceeds,moic,irr:100*(moic**(1/years)-1)},{moic:'раз',irr:'%'});
 }
 case 'a-wacc-scenarios':{
  const re=take(t,'Re =','%')/100,rd=take(t,'Rd =','%')/100,tax=take(t,'налог на прибыль','%')/100;
  const shares=[.2,.4,.6],values=shares.map(d=>100*((1-d)*re+d*rd*(1-tax)));
  return refs({w20:values[0],w40:values[1],w60:values[2],best:String(shares[values.indexOf(Math.min(...values))]*100)+'%'},{w20:'%',w40:'%',w60:'%'});
 }
 case 'a-real-option':{
  const investment=take(t,'масштабирование за','млн ₽');
  const p=take(t,'Если рынок окажется успешным (вероятность','%')/100;
  const good=take(t,'масштабирование сразу принесёт','млн ₽');
  const bad=take(t,'при неудаче (вероятность '+Number(((1-p)*100).toFixed(2))+'%) —','млн ₽');
  const expected=p*good+(1-p)*bad,flex=p*Math.max(0,good-investment)+(1-p)*Math.max(0,bad-investment);
  return refs({expected,without:expected-investment,flex,option:flex-expected+investment});
 }
 case 'a-stress-case':{
  const clients=take(t,'Подписной сервис имеет','клиентов в месяц'),check=take(t,'среднюю выручку на клиента','₽');
  const variable=take(t,'переменные расходы','%')/100,fix=take(t,'фиксированные операционные расходы','млн ₽');
  const loss=take(t,'число клиентов падает на','%')/100;
  const base=clients*check/1e6,stress=base*(1-loss),ebitda=stress*(1-variable)-fix;
  return refs({base,stress,profit:ebitda,delta:(stress-base)*(1-variable),viable:yes(ebitda>0)});
 }
 case 'a-integrated-statements':{
  const cash0=take(t,'денежными средствами','млн ₽');
  const ppe0=take(t,'балансовой стоимостью','млн ₽'),inventory0=take(t,'запасами','млн ₽');
  const ap0=take(t,'задолженность поставщикам','млн ₽'),revenue=take(t,'признаёт выручку','млн ₽');
  const onCredit=take(t,'из которой','%')/100,cogs=take(t,'Себестоимость проданного','млн ₽');
  const opex=take(t,'денежные операционные расходы','млн ₽'),depreciation=take(t,'амортизация','млн ₽');
  const inventoryDelta=take(t,'Запасы выросли на','млн ₽'),apDelta=take(t,'кредиторка поставщиков — на','млн ₽');
  const capex=take(t,'оборудование за','млн ₽'),newDebt=take(t,'получен новый кредит','млн ₽');
  const taxRate=take(t,'Налог на прибыль','%')/100;
  const ebit=revenue-cogs-opex-depreciation,tax=ebit*taxRate,profit=ebit-tax;
  const ar=revenue*onCredit,cfo=profit+depreciation-ar-inventoryDelta+apDelta;
  const cfi=-capex,cff=newDebt,cash=cash0+cfo+cfi+cff;
  const assets=cash+ar+ppe0+capex-depreciation+inventory0+inventoryDelta;
  const equity=cash0+ppe0+inventory0-ap0+profit;
  if(Math.abs(assets-(ap0+apDelta+newDebt+equity))>1e-7)throw Error('Balance equation fails');
  return refs({ebit,tax,profit,cfo,cfi,cff,cash,assets,equity});
 }
 default:throw Error('Unapproved template '+id);
 }
}
export function validateAdvancedStoryMath(ex){
 const id=ex?.templateId;
 if(!ADVANCED_STORY_ORACLE_IDS.includes(id))return [];
 let expected;
 try{expected=reconstructAdvanced(id,String(ex.story??''));}
 catch(e){return [{code:'ADV_STORY_SOURCE',message:id+': '+e.message}];}
 const errors=[],questions=ex.questions??[],names=new Set();
 if(questions.length!==Object.keys(expected).length)
  errors.push({code:'ADV_STORY_COVERAGE',message:id+' field count does not match oracle'});
 for(const q of questions){
  if(names.has(q.key))errors.push({code:'ADV_STORY_COVERAGE',message:id+'/'+q.key+' duplicate'});
  names.add(q.key);
  const r=expected[q.key];
  if(!r){errors.push({code:'ADV_STORY_COVERAGE',message:id+'/'+q.key+' has no formula'});continue;}
  if(r.unit!==null&&q.unit!==r.unit)errors.push({code:'ADV_STORY_UNIT',message:id+'/'+q.key+' unit '+q.unit+' expected '+r.unit});
  if(typeof r.value==='string'){
   if(q.type!=='choice'||q.answer!==r.value)errors.push({code:'ADV_STORY_MISMATCH',message:id+'/'+q.key+' wrong choice'});
  }else if(q.type!=='number'||!Number.isFinite(q.answer)||
       Math.abs(q.answer-r.value)>Math.max(.026,Math.abs(r.value)*1e-8)){
   errors.push({code:'ADV_STORY_MISMATCH',message:id+'/'+q.key+' '+q.answer+' expected '+r.value});
  }
 }
 for(const key of Object.keys(expected))if(!names.has(key))errors.push({code:'ADV_STORY_COVERAGE',message:id+'/'+key+' missing'});
 return errors;
}
