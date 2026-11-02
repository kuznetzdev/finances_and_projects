import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAM_PREP_CASES,EXAM_PREP_CHECKPOINTS} from '../site/data/exam-prep-2026.js';
import {CASE_BANK,CASE_BY_ID,CASE_CHECKPOINTS,availableCases,verifyCheckpoint} from '../site/engine/casebook.js';

const close=(got,want,label,tol=1e-7)=>assert.ok(Math.abs(got-want)<tol,label+': '+got+' != '+want);
const c=(id,label)=>{
 const result=EXAM_PREP_CHECKPOINTS[id].find(q=>q.label===label);
 assert.ok(result,id+': '+label);
 return result.answer;
};
test('all thirteen source references are unique, correctly grouped and searchable',()=>{
 assert.equal(EXAM_PREP_CASES.length,13);
 assert.equal(CASE_BANK.length,124);
 assert.equal(new Set(CASE_BANK.map(x=>x.id)).size,124);
 const groups={
 'Контрольные · Финансовая отчётность':[1,2,10],
 'Облигации и опционы · углублённые кейсы':[4],
 'Реальные опционы · видеолекция':[5],
 'Доходный подход · комплексные кейсы':[6],
 'LBO · видеолекция':[7,13],
 'Структура капитала · комплексные кейсы':[3,8,9,11],
 'Венчур · видеолекция':[12]
 };
 for(const [group,numbers] of Object.entries(groups)){
  for(const number of numbers){
   const id='PREP26-'+String(number).padStart(2,'0');
   const item=CASE_BY_ID.get(id);
   assert.ok(item,id); assert.equal(item.group,group);
   assert.ok(availableCases(group,id).some(x=>x.id===id),id);
  }
 }
 for(const item of EXAM_PREP_CASES){
  assert.equal(item.steps.length>=5,true,item.id);
  assert.equal(item.solutionHtml.length>360,true,item.id);
  assert.equal(item.conditionHtml.length>200,true,item.id);
  assert.equal(item.answerHtml.length>30,true,item.id);
  assert.equal(CASE_CHECKPOINTS[item.id],EXAM_PREP_CHECKPOINTS[item.id]);
  assert.ok(item.source.includes('ноябрь 2026'),item.id);
 }
});
test('three-level hints and numeric answer checking are present for every checkpoint',()=>{
 for(const [id,checks] of Object.entries(EXAM_PREP_CHECKPOINTS)){
  assert.ok(checks.length>=4,id);
  for(const q of checks){
   assert.ok(Number.isFinite(q.answer),id+'/'+q.label);
   assert.ok(q.tolerance>0,id+'/'+q.label);
   assert.equal(q.hint.levels.length,3,id+'/'+q.label);
   assert.ok(q.hint.levels.every(s=>s.length>4),id+'/'+q.label);
   assert.equal(verifyCheckpoint(q,String(q.answer)),true,id+'/'+q.label);
   assert.equal(verifyCheckpoint(q,'не число'),false,id+'/'+q.label);
   assert.equal(verifyCheckpoint(q,''),null,id+'/'+q.label);
  }
 }
});
test('reporting, liquidity and financing outputs match independent financial formulas',()=>{
 close(c('PREP26-01','Выручка'),320-120+1300,'revenue');
 close(c('PREP26-01','Себестоимость проданной продукции'),80+1100-130,'COGS');
 close(c('PREP26-01','EBITDA'),1500-1050-70+.15*1050,'EBITDA');
 close(c('PREP26-02','Текущая после, долг поставщику сохраняется'),690/400,'CR legally intact');
 close(c('PREP26-02','Быстрая после, если долг поставщику списан'),440/(400-60),'QR conditional');
 close(c('PREP26-08','ROE после налога'),(.18+(.18-.12)*1.5)*.75*100,'ROE');
 close(c('PREP26-08','WACC'),(.4*.2025+.6*.12*.75)*100,'WACC');
 close(c('PREP26-10','CFO с процентами в операционном потоке'),600+150-50+30+40,'CFO');
 close(c('PREP26-10','FCFF'),770+60*(1-.25)-200,'FCFF');
});
test('bond, option and DCF references independently discount correctly timed flows',()=>{
 const debtNet=920*(1-.03);
 const yd=c('PREP26-03','Эффективная стоимость долга Rd')/100;
 const bondPv=[140,140,140,140,1140].reduce((s,cf,i)=>s+cf/(1+yd)**(i+1),0);
 close(bondPv,debtNet,'debt issue IRR',.00001);
 close(c('PREP26-03','WACC с налоговым щитом'),(.5*.17+.5*yd*(1-.25))*100,'WACC issue');
 close(c('PREP26-04','Стоимость облигации'),[500,360,230,110].reduce((s,cf,i)=>s+cf/1.11**(i+1),0),'amort bond');
 const base=-600+(.7*800+.3*200)/1.12;
 const option=.7*(400/1.12-300)/1.12;
 close(c('PREP26-05','NPV без расширения'),base,'base NPV');
 close(c('PREP26-05','Стоимость опциона на момент t=0'),option,'option');
 close(c('PREP26-05','NPV с опционом'),base+option,'with option');
 const tv=350*1.02/(.13-.02);
 const ev=[250,300,350].reduce((a,cf,i)=>a+cf/1.13**(i+1),0)+tv/1.13**3;
 close(c('PREP26-06','EV'),ev,'DCF EV');
 close(c('PREP26-06','Стоимость Equity'),ev-800+150,'DCF Equity');
});
test('LBO interest waterfall, tax-shield sequence and missing-data scenarios stay distinct',()=>{
 let d=7000;
 for(let i=0;i<4;i++)d=d*1.09-1400;
 close(c('PREP26-07','Долг при выходе через 4 года'),d,'LBO4 D');
 close(c('PREP26-07','IRR спонсора'),(((11000-d)/3000)**.25-1)*100,'LBO4 IRR');
 close(c('PREP26-09','EV после объявления'),10*(1-.30)/.16+.3*10,'MM V');
 close(c('PREP26-09','Equity после размещения и выкупа'),46.75-10,'MM E');
 close(c('PREP26-09','WACC после выкупа'),7/46.75*100,'MM WACC');
 for(const [pct,expected] of [[0,16],[.5,22.4],[.8,41.6]]){
  const label='ROE при доле долга '+(100*pct)+'% и A=5000';
  close(c('PREP26-11',label),(1000-5000*pct*.12)*.8/(5000*(1-pct))*100,'debt share '+pct);
  close(c('PREP26-11',label),expected,'teaching case '+pct);
  if(pct===.8)close(c('PREP26-11','Снижение EBIT для нулевой прибыли при 80% долга'),(1000-4000*.12)/1000*100,'EBIT break-even stress');
 }
 close(c('PREP26-12','Доля основателей при пуле 20% до сделки'),.8*.8*100,'founder 64');
 close(c('PREP26-12','Доля основателей при обязательном пуле 20% после сделки'),60,'founder 60');
 close(c('PREP26-13','Долг после 5 лет: сценарий A (FCF после процентов)'),7000-5*1200,'LBO5 A');
 let db=7000;
 for(let i=0;i<5;i++)db=db*1.09-1200;
 close(c('PREP26-13','Долг после 5 лет: сценарий B (ставка 9%)'),db,'LBO5 B');
 close(c('PREP26-13','IRR сценарий B'),(((10000-db)/3000)**.2-1)*100,'LBO5 B IRR');
 for(const id of ['PREP26-02','PREP26-03','PREP26-09','PREP26-10','PREP26-11','PREP26-12','PREP26-13']){
  assert.ok(CASE_BY_ID.get(id).caveat,id);
 }
});
