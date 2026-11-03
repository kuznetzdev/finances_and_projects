/** Reusable strict comparison for independent, user-visible-scenario oracles. */
export const numberFrom=s=>Number(String(s).replace(/[\s\u00a0\u202f]/g,'').replace(',','.'));
export const numberExpression='([+-]?\\d(?:[\\d\\u00a0\\u202f ]*\\d)?(?:[.,]\\d+)?)';
const escapeRegex=s=>Array.from(s).map(ch=>('\\^$.*+?()[]{}|'.includes(ch)?'\\'+ch:ch)).join('');
export function take(text,before,after=''){
 const m=String(text).match(new RegExp(escapeRegex(before)+'\\s*'+numberExpression+'\\s*'+escapeRegex(after),'i'));
 if(!m||!Number.isFinite(numberFrom(m[1])))throw Error('Missing or invalid scenario input '+JSON.stringify(before)+' / '+JSON.stringify(after));
 return numberFrom(m[1]);
}
export const yes=x=>x?'Да':'Нет';
export const ref=(answers,units={})=>Object.fromEntries(Object.entries(answers).map(([k,v])=>[k,{
 answer:v,unit:units[k]??(typeof v==='number'?'млн ₽':null),type:Array.isArray(v)?'multi':typeof v==='number'?'number':'choice'
}]));
export function compareScenarioAnswers(ex,approved,prefix,{tolerance=.026}={}){
 const errors=[],questions=ex.questions??[],seen=new Set(),expected=approved;
 const fail=(suffix,message)=>errors.push({code:prefix+'_'+suffix,message:ex.templateId+': '+message});
 if(questions.length!==Object.keys(expected).length)fail('COVERAGE','number of questions differs from the independent reference');
 for(const q of questions){
  if(seen.has(q.key))fail('COVERAGE',q.key+' duplicated');
  seen.add(q.key);
  const source=expected[q.key];
  if(!source){fail('COVERAGE',q.key+' lacks oracle');continue;}
  if(q.type!==source.type)fail('TYPE',q.key+' type mismatch '+q.type);
  if(source.type==='number'){
   if(q.unit!==source.unit)fail('UNIT',q.key+' unit mismatch');
   if(!Number.isFinite(q.answer)||Math.abs(q.answer-source.answer)>Math.max(tolerance,Math.abs(source.answer)*1e-8))
    fail('MISMATCH',q.key+' '+q.answer+' expected '+source.answer);
  }else if(source.type==='multi'){
   if(!Array.isArray(q.answer)||q.answer.length!==source.answer.length||
     q.answer.some(x=>!source.answer.includes(x))||new Set(q.answer).size!==q.answer.length)
    fail('MISMATCH',q.key+' multi answer mismatch');
  }else if(q.answer!==source.answer)fail('MISMATCH',q.key+' wrong option: '+q.answer);
 }
 for(const key of Object.keys(expected))if(!seen.has(key))fail('COVERAGE',key+' missing');
 return errors;
}
