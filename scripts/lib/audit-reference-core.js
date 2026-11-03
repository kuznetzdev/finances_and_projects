/** Shared strict comparison logic for independent, input-derived mathematical references. */
export const unitReferences=(unit,answers)=>Object.fromEntries(Object.entries(answers).map(
 ([label,answer])=>[label,{answer,unit}]
));
export const combineReferences=(...groups)=>Object.assign({},...groups);
export const sum=values=>values.reduce((total,value)=>total+value,0);
export const presentValue=(flows,discount,start=1)=>sum(flows.map((x,i)=>x/(1+discount)**(i+start)));
export const percent=x=>x*100;
export function verifyReferenceSet({cases,checkpoints,references,code='REF',sourceIds=null,roundingPrecision=null}){
 const problems=[],seen=new Set();
 const expectedIds=new Set(Object.keys(references));
 const allowed=new Set(sourceIds??expectedIds);
 for(const c of cases??[]){
  if(allowed.has(c?.id)){
   if(seen.has(c.id))problems.push({code:code+'_DUPLICATE',message:c.id+' duplicated case'});
   seen.add(c.id);
  }
 }
 for(const id of expectedIds){
  if(!seen.has(id)){problems.push({code:code+'_MISSING',message:id+' fixed case not found'});continue;}
  const expected=references[id];
  const actual=checkpoints?.[id]??[];
  if(actual.length!==Object.keys(expected).length)
   problems.push({code:code+'_COVERAGE',message:id+' '+actual.length+' actual, '+Object.keys(expected).length+' expected'});
  const names=new Set();
  for(const q of actual){
   const name=id+'/'+q.label,ref=expected[q.label];
   if(names.has(q.label))problems.push({code:code+'_DUPLICATE',message:name+' duplicate question'});
   names.add(q.label);
   if(!ref){problems.push({code:code+'_UNMAPPED',message:name+' lacks source-derived independent reference'});continue;}
   if(q.unit!==ref.unit)problems.push({code:code+'_UNIT',message:name+' '+q.unit+' expected '+ref.unit});
   const precision=ref.precision??roundingPrecision;
   const rounding=Number.isInteger(precision)&&precision>=0&&precision<=12?0.5*10**(-precision):0;
   const threshold=Math.max(1e-7,1e-9*Math.abs(ref.answer),rounding+1e-9);
   if(!Number.isFinite(q.answer)||!Number.isFinite(ref.answer)||Math.abs(q.answer-ref.answer)>threshold)
    problems.push({code:code+'_MISMATCH',message:name+' '+q.answer+' expected '+ref.answer});
   if(!Number.isFinite(q.tolerance)||q.tolerance<0||q.tolerance>Math.max(.1,Math.abs(ref.answer)*.001))
    problems.push({code:code+'_TOLERANCE',message:name+' tolerance '+q.tolerance+' too large'});
  }
  for(const label of Object.keys(expected)){
   if(!names.has(label))problems.push({code:code+'_COVERAGE',message:id+'/'+label+' missing approved answer'});
  }
 }
 if(sourceIds)for(const id of allowed)if(!expectedIds.has(id))problems.push({code:code+'_UNMAPPED',message:id+' lacks oracle coverage'});
 return problems;
}
