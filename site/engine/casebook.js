import {CASE_BANK} from '../data/case-bank.js';
import {CASE_CHECKPOINTS} from '../data/case-checkpoints.js';
import {chooseFresh,recordRecent} from './scheduler.js';
export const CASE_GROUPS=['Все направления',...new Set(CASE_BANK.map(x=>x.group))];
export const CASE_BY_ID=new Map(CASE_BANK.map(c=>[c.id,c]));
export function availableCases(group='Все направления',query=''){
 const q=query.trim().toLocaleLowerCase('ru');
 return CASE_BANK.filter(x=>(group==='Все направления'||x.group===group)&&(!q||`${x.id} ${x.title} ${x.topic}`.toLocaleLowerCase('ru').includes(q)));
}
export function nextCase(history=[],group='Все направления',random=Math.random){
 const pool=availableCases(group);
 return chooseFresh(pool,history,random,x=>x.id,8);
}
export {recordRecent,CASE_BANK,CASE_CHECKPOINTS};
export function verifyCheckpoint(question,value){
 if(value==null||!String(value).trim())return null;
 const normalized=String(value).trim().replace(/[\s\u00a0\u202f]/g,'').replace(',','.');
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized))return false;
 const num=Number(normalized);
 return Number.isFinite(num)&&Math.abs(num-question.answer)<=question.tolerance+1e-9;
}