import {PARADOXES, ORIGINAL_PROMPTS} from '../data/paradoxes.js';

export const MIN_ANSWER_LENGTH=150;
export const allParadoxes=PARADOXES;
export const promptFor=p=>ORIGINAL_PROMPTS[p.id]||p.question;

export function filterParadoxes(seminar='all',search=''){
 const q=String(search??'').trim().toLocaleLowerCase('ru');
 return PARADOXES.filter(p=>(seminar==='all'||p.seminar===Number(seminar))&&
 (!q||[p.title,p.question,promptFor(p),p.thesis,p.analysis].some(x=>x.toLocaleLowerCase('ru').includes(q))));
}
export function normalizeRecord(input){
 const r=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const checks=Array.isArray(r.checks)?[...new Set(r.checks.filter(x=>Number.isInteger(x)&&x>=0&&x<3))]:[];
 return {draft:typeof r.draft==='string'?r.draft:'',checks,status:r.status==='done'?'done':'review'};
}
export function canMarkReviewed(p,input){
 const r=normalizeRecord(input);
 return r.draft.trim().length>=MIN_ANSWER_LENGTH && p.checks.every((_,i)=>r.checks.includes(i));
}
export function countReviewed(records,seminar='all'){
 return PARADOXES.filter(p=>(seminar==='all'||p.seminar===Number(seminar))&&
 normalizeRecord(records?.[p.id]).status==='done').length;
}
