/** Independent accounting interpretation of conceptual and numeric stories. */
import {take,ref,yes,compareScenarioAnswers} from './scenario-oracle-core.js';
export const REASONING_STORY_ORACLE_IDS=Object.freeze([
 'logic-cash-sufficiency','logic-equipment','logic-advance','logic-dividends','logic-positive-profit'
]);
export function reconstructReasoning(id,s){
 switch(id){
 case 'logic-cash-sufficiency':{
  if(!/Изменение оборотного капитала не сообщалось\./.test(s))throw Error('No evidence that WC data is missing');
  for(const required of ['Чистая прибыль','амортизация','инвестиции в оборудование','дивиденды'])
   if(!s.includes(required))throw Error('Missing scenario parameter '+required);
  return ref({enough:'Нет',missing:['Изменение дебиторской задолженности',
   'Изменение запасов','Изменение кредиторской задолженности']});
 }
 case 'logic-equipment':{
  const cost=take(s,'станок стоимостью','млн ₽'),da=take(s,'начислена амортизация','млн ₽');
  if(!s.includes('Он признан основным средством.')||cost<da)throw Error('Not a capitalized asset');
  return ref({claims:['CFI уменьшается на стоимость станка','Прибыль уменьшается на амортизацию',
   'Основные средства на конец увеличиваются на стоимость за вычетом амортизации']});
 }
 case 'logic-advance':{
  const advance=take(s,'перечислил компании','млн ₽');
  if(!s.includes('услуги ещё не оказывались')||advance<0)throw Error('No unearned customer advance');
  return ref({classify:['Денежные средства увеличатся','Обязательства увеличатся']});
 }
 case 'logic-dividends':{
  const dividends=take(s,'дивиденды','млн ₽');
  if(!s.includes('из уже сформированной нераспределённой прибыли')||!s.includes('деньгами')||dividends<=0)
   throw Error('Cash dividend conditions missing');
  return ref({impact:['Денежные средства уменьшатся','Собственный капитал уменьшится','CFF будет отрицательным']});
 }
 case 'logic-positive-profit':{
  const net=take(s,'Чистая прибыль','млн ₽');
  const increase=take(s,'дебиторская задолженность выросла на','млн ₽'),cfo=net-increase;
  return ref({cfo,possible:yes(cfo<0)});
 }
 default:throw Error('Unknown logic template '+id);
 }
}
export function validateReasoningStoryMath(ex){
 if(!REASONING_STORY_ORACLE_IDS.includes(ex?.templateId))return [];
 let expected;
 try{expected=reconstructReasoning(ex.templateId,String(ex.story??''));}
 catch(e){return [{code:'REASONING_SOURCE',message:ex.templateId+': '+e.message}];}
 return compareScenarioAnswers(ex,expected,'REASONING');
}
