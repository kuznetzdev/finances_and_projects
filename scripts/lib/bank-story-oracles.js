/** Independent scenario-based arithmetic for nine bank-derived exercises. */
import {take,numberFrom,ref,yes,compareScenarioAnswers} from './scenario-oracle-core.js';
export const BANK_STORY_ORACLE_IDS=Object.freeze([
 'bank-ledger-day','bank-ebitda-property','bank-three-cashflows','bank-tax-year-profile',
 'bank-capm-supplier','bank-covenant-penalty','bank-amortizing-bond',
 'bank-dcf-multiples-bridge','bank-liquid-assets'
]);
export function reconstructBank(id,s){
 switch(id){
 case 'bank-ledger-day':{
  const cash0=take(s,'имеет деньги','тыс. ₽'),stock0=take(s,'товары','тыс. ₽');
  const ppe=take(s,'оборудование','тыс. ₽'),ap=take(s,'долг поставщикам','тыс. ₽');
  const debt=take(s,'банковский кредит','тыс. ₽'),stockBought=take(s,'сразу за','тыс. ₽');
  const loan=take(s,'получен новый кредит','тыс. ₽'),cost=take(s,'товары себестоимостью','тыс. ₽');
  const markup=take(s,'с наценкой','%')/100,revenue=cost*(1+markup);
  const start=cash0+stock0+ppe-ap-debt;
  const endCash=cash0-stockBought+loan+revenue,endGoods=stock0+stockBought-cost;
  const profit=revenue-cost,equity=start+profit,total=endCash+endGoods+ppe;
  if(Math.abs(total-(ap+debt+loan+equity))>1e-7)throw Error('Bank-ledger equation fails');
  return ref({start,cash:endCash,goods:endGoods,profit,equity,total},
   {start:'тыс. ₽',cash:'тыс. ₽',goods:'тыс. ₽',profit:'тыс. ₽',equity:'тыс. ₽',total:'тыс. ₽'});
 }
 case 'bank-ebitda-property':{
  const sales=take(s,'Выручка компании за год','млн ₽'),cogs=take(s,'себестоимость','млн ₽');
  const admin=take(s,'коммерческие и управленческие расходы','млн ₽'),propertyTax=take(s,'налог на имущество','млн ₽');
  const da=take(s,'уже включена амортизация','млн ₽');
  const ebit=sales-cogs-admin-propertyTax,ebitda=ebit+da;
  return ref({ebit,ebitda,margin:100*ebitda/sales,property:'Нет'},{margin:'%'});
 }
 case 'bank-three-cashflows':{
  const ni=take(s,'Чистая прибыль за год','млн ₽'),da=take(s,'амортизация','млн ₽');
  const inventory=take(s,'запасы выросли на','млн ₽'),ar=take(s,'дебиторская задолженность выросла на','млн ₽');
  const ap=take(s,'кредиторская задолженность перед поставщиками выросла на','млн ₽');
  const capex=take(s,'CAPEX оплачен в размере','млн ₽'),newLoan=take(s,'привлекла кредит','млн ₽');
  const repaid=take(s,'погасила основной долг','млн ₽'),div=take(s,'выплатила дивиденды','млн ₽');
  const start=take(s,'Деньги на начало года','млн ₽');
  const cfo=ni+da-inventory-ar+ap,cfi=-capex,cff=newLoan-repaid-div;
  return ref({cfo,cfi,cff,delta:cfo+cfi+cff,closing:start+cfo+cfi+cff});
 }
 case 'bank-tax-year-profile':{
  const cost=take(s,'Оборудование стоимостью','тыс. ₽');
  const years=5,low=take(s,'первые два года','%')/100;
  const high=take(s,'годы 3–5','%')/100;
  const rates=[low,low,high,high,high],annual=cost/years;
  const accelerated=Array.from({length:years},(_,i)=>cost*(years-i)/(years*(years+1)/2));
  const straight=annual*rates.reduce((a,b)=>a+b,0);
  const sy=accelerated.reduce((acc,da,i)=>acc+da*rates[i],0);
  return ref({linear:annual,sy:accelerated[0],straight,accelerated:sy,winner:straight>sy?'Линейный':'По сумме чисел лет'},
   {linear:'тыс. ₽',sy:'тыс. ₽',straight:'тыс. ₽',accelerated:'тыс. ₽'});
 }
 case 'bank-capm-supplier':{
  const rf=take(s,'безрисковая ставка','%'),premium=take(s,'рыночная премия','п.п.');
  const m=s.match(/Беты двух компаний:\s*([\d,.]+)\s+и\s+([\d,.]+)\./);
  if(!m)throw Error('Two betas not shown in scenario');
  const betaA=numberFrom(m[1]),betaB=numberFrom(m[2]),extra=take(s,'отдельно предлагает премию','п.п.');
  const a=rf+premium*betaA,b=rf+premium*betaB;
  return ref({a,b,as:a+extra,spec:'Нет'},{a:'%',b:'%',as:'%'});
 }
 case 'bank-covenant-penalty':{
  const loan=take(s,'Долг компании','млн ₽'),base=take(s,'по ставке','%');
  const limit=take(s,'превышает'),step=take(s,'растёт на','п.п.');
  const m=s.match(/EBITDA в годах 1–4:\s*([\s\S]+?)\s+млн ₽\./);
  if(!m)throw Error('Missing four year EBITDA values');
  const ebitda=m[1].split('; ').map(numberFrom);
  if(ebitda.length!==4||ebitda.some(x=>!Number.isFinite(x)||x<=0))throw Error('Invalid four year EBITDA values');
  const ratios=ebitda.map(v=>loan/v),breach=ratios.map(x=>x>limit);
  const affected=[false,...breach.slice(0,3)];
  const surcharge=loan*(step/100)*affected.filter(Boolean).length;
  // Year 3 is determined by breach at the end of YEAR 2, never year 1.
  const year3=base+(breach[1]?step:0);
  return ref({ratio2:ratios[1],ratio3:ratios[2],year3,extra:surcharge},{ratio2:'раз',ratio3:'раз',year3:'%'});
 }
 case 'bank-amortizing-bond':{
  const face=take(s,'Номинал облигации','₽'),years=take(s,'Срок','лет');
  const coupon=take(s,'купон','%')/100,y=take(s,'доходность инвестора','%')/100;
  const principal=face/years;
  const flows=Array.from({length:years},(_,i)=>principal+(face-i*principal)*coupon);
  const value=flows.reduce((acc,cf,i)=>acc+cf/(1+y)**(i+1),0);
  return ref({principal,first:flows[0],last:flows.at(-1),price:value},
   {principal:'₽',first:'₽',last:'₽',price:'₽'});
 }
 case 'bank-dcf-multiples-bridge':{
  const ebitda=take(s,'У компании EBITDA','млн ₽'),multiple=take(s,'принят EV/EBITDA','×');
  const debt=take(s,'Процентный долг','млн ₽'),cash=take(s,'свободные деньги','млн ₽');
  const shares=take(s,'Выпущено','млн обыкновенных акций');
  const ev=ebitda*multiple,netdebt=debt-cash,equity=ev-netdebt;
  return ref({ev,netdebt,equity,price:equity/shares},{price:'₽'});
 }
 case 'bank-liquid-assets':{
  const inventory=take(s,'Исходные оборотные активы: запасы','млн ₽'),ar=take(s,'ДЗ','млн ₽');
  const cash=take(s,'деньги','млн ₽'),liabilities=take(s,'Краткосрочные обязательства','млн ₽');
  const badAR=take(s,'события: ДЗ на','млн ₽'),stockLoss=take(s,'списаны запасы','млн ₽');
  const insurance=take(s,'страховщик уже перечислил','млн ₽');
  const blocked=take(s,';','млн ₽ денег стали временно недоступны');
  const taxes=take(s,'новое краткосрочное налоговое обязательство','млн ₽');
  const adjustedCash=cash+insurance,available=adjustedCash-blocked;
  const ca=inventory-stockLoss+ar-badAR+adjustedCash,cl=liabilities+taxes;
  return ref({cr:ca/cl,qr:(available+ar-badAR)/cl,qar:available/cl,forgive:'Нет'},
   {cr:'раз',qr:'раз',qar:'раз'});
 }
 default:throw Error('Unknown bank-derived reference '+id);
 }
}
export function validateBankStoryMath(ex){
 if(!BANK_STORY_ORACLE_IDS.includes(ex?.templateId))return [];
 let expected;
 try{expected=reconstructBank(ex.templateId,String(ex.story??''));}
 catch(e){return [{code:'BANK_SOURCE',message:ex.templateId+': '+e.message}];}
 // Dynamic difficulty levels are subsets of the full accounting schedule.
 const keys=new Set(ex.questions.map(q=>q.key));
 if(!Object.keys(expected).every(k=>typeof expected[k].answer==='number'||typeof expected[k].answer==='string'))
  return [{code:'BANK_SOURCE',message:ex.templateId+': invalid independent result'}];
 const selected=Object.fromEntries(Object.entries(expected).filter(([k])=>keys.has(k)));
 return compareScenarioAnswers(ex,selected,'BANK',{tolerance:.035});
}
