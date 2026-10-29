import {CASE_BANK as ORIGINAL_CASE_BANK} from '../data/case-bank.js';
import {LECTURE_CASES} from '../data/lecture-cases.js';
import {LECTURE_CHECKPOINTS} from '../data/lecture-checkpoints.js';
import {ADVANCED_CASES,ADVANCED_CHECKPOINTS} from '../data/advanced-cases.js';
import {CAPITAL_CASES,CAPITAL_CHECKPOINTS} from '../data/capital-cases.js';
import {DCF_CASES,DCF_CHECKPOINTS} from '../data/dcf-cases.js';
import {REPORTING_CONTROL_CASES} from '../data/control-work-reporting.js';
import {REPORTING_CONTROL_CHECKPOINTS} from '../data/control-work-reporting-checkpoints.js';
import {VALUATION_CONTROL_CASES} from '../data/control-work-valuation.js';
import {VALUATION_CONTROL_CHECKPOINTS} from '../data/control-work-valuation-checkpoints.js';
const CASE_BANK=[...ORIGINAL_CASE_BANK,...LECTURE_CASES,...ADVANCED_CASES,...CAPITAL_CASES,...DCF_CASES,...REPORTING_CONTROL_CASES,...VALUATION_CONTROL_CASES];
import {CASE_CHECKPOINTS as SOURCE_CHECKPOINTS} from '../data/case-checkpoints.js';
const CASE_CHECKPOINTS={...SOURCE_CHECKPOINTS,...LECTURE_CHECKPOINTS,...ADVANCED_CHECKPOINTS,...CAPITAL_CHECKPOINTS,...DCF_CHECKPOINTS,...REPORTING_CONTROL_CHECKPOINTS,...VALUATION_CONTROL_CHECKPOINTS};
import {chooseFresh,recordRecent} from './scheduler.js';
export const CASE_GROUPS=['Все направления',...new Set(CASE_BANK.map(x=>x.group))];
export const CASE_BY_ID=new Map(CASE_BANK.map(c=>[c.id,c]));
const searchText=s=>String(s??'').normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/\s+/g,' ').trim();
// Cached once: include task conditions as well as titles so topic searches find the actual assignment.
const SEARCH_INDEX=new Map(CASE_BANK.map(x=>[x.id,searchText([x.id,x.title,x.topic,x.group,x.conditionHtml.replace(/<[^>]*>/g,' ')].join(' '))]));
export function availableCases(group='Все направления',query=''){
 const q=searchText(query);
 return CASE_BANK.filter(x=>(group==='Все направления'||x.group===group)&&(!q||SEARCH_INDEX.get(x.id).includes(q)));
}
export function nextCase(history=[],group='Все направления',random=Math.random,query=''){
 const pool=availableCases(group,query);
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