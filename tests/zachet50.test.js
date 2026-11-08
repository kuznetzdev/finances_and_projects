import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CASE_BANK,CASE_BY_ID,CASE_CHECKPOINTS,verifyCheckpoint} from '../site/engine/casebook.js';
import {ZACHET50_CASES_A,ZACHET50_CHECKPOINTS_A} from '../site/data/zachet50-part-a.js';
import {ZACHET50_CASES_B,ZACHET50_CHECKPOINTS_B} from '../site/data/zachet50-part-b.js';

const cases=[...ZACHET50_CASES_A,...ZACHET50_CASES_B];
const checks={...ZACHET50_CHECKPOINTS_A,...ZACHET50_CHECKPOINTS_B};
const get=(id,label)=>{const q=checks[id]?.find(q=>q.label===label);assert.ok(q,'missing '+id+' / '+label);return q.answer};
const close=(actual,expected,name,tol=0.0001)=>assert.ok(Math.abs(actual-expected)<tol, name+': '+actual+' vs '+expected);

test('all 50 numbered original assignments present, integrated once, source and explanation intact',()=>{
 assert.equal(cases.length,50);
 assert.equal(CASE_BANK.length,174);
 assert.equal(new Set(CASE_BANK.map(c=>c.id)).size,CASE_BANK.length);
 for(let n=1;n<=50;n++){
  const id='ZACHET50-'+String(n).padStart(2,'0'),item=cases[n-1];
  assert.equal(item.id,id);
  assert.equal(CASE_BY_ID.get(id),item);
  assert.match(item.source,/50 задач для подготовки к зачету2\.docx/);
  assert.ok(item.conditionHtml.length>160,id+' truncated original statement');
  assert.ok(item.steps.length>=3,id+' insufficient reasoning');
  assert.ok(item.solutionHtml.length>250,id+' insufficient full solution');
  assert.ok(item.answerHtml.includes('Проверочные результаты'),id);
  assert.ok(checks[id].length>=1,id+' no numeric checkpoints');
  for(const checkpoint of checks[id]){
   assert.equal(CASE_CHECKPOINTS[id].find(x=>x.label===checkpoint.label),checkpoint);
   assert.equal(checkpoint.hint.levels.length,3,id+' three consecutive hints');
   assert.ok(checkpoint.hint.levels.every(s=>typeof s==='string'&&s.length>=3),id+' empty hint');
   assert.ok(Number.isFinite(checkpoint.answer),id+' nonnumeric answer');
   assert.equal(verifyCheckpoint(checkpoint,String(checkpoint.answer).replace('.',',')),true,id+' comma entry');
   assert.equal(verifyCheckpoint(checkpoint,''),null,id+' empty is not zero');
  }
 }
});

test('cash flow and P&L are not confused with accrual revenue, VAT and capex',()=>{
 close(get('ZACHET50-01','CFO'),720+150+40+30-60+25,'indirect CFO');
 close(get('ZACHET50-02','CFO прямым методом'),3100-1800-850,'direct CFO');
 close(get('ZACHET50-03','EBITDA'),1800-1150-120+.2*1150,'EBITDA: depreciation once');
 close(get('ZACHET50-04','Себестоимость при трактовке запасов как сырья'),200+1200-150+100,'raw materials plus depreciation');
 close(get('ZACHET50-04','EBITDA при трактовке запасов как сырья'),2500-1350-300+100,'P&L EBITDA');
 close(get('ZACHET50-07','FCFF'),800*.8+150-250-80,'FCFF');
 close(get('ZACHET50-07','FCFE'),800*.8+150-250-80-100*.8+50,'FCFE');
 close(get('ZACHET50-08','CFO'),500+80-(100-60)-200,'sale gain in investing');
 close(get('ZACHET50-39','Чистое изменение денег'),400+100-40-150+200-50-80,'CFO+CFI+CFF');
});

test('WACC, valuations and bond prices agree with independent calculations',()=>{
 const issueKd=(120+(1000-(950-20))/5)/((1000+(950-20))/2)*100;
 close(get('ZACHET50-21','Kd (приближенная)'),issueKd,'issue effective cost');
 close(get('ZACHET50-21','WACC'),.4*issueKd*.8+.6*16,'issue WACC');
 close(get('ZACHET50-16','NPV'),500/1.12+700/1.12**2+800/1.12**3-1500,'NPV');
 const ev=[300,350,400].reduce((a,v,i)=>a+v/1.14**(i+1),0)+400*1.03/(.14-.03)/1.14**3;
 close(get('ZACHET50-17','EV'),ev,'terminal DCF');
 close(get('ZACHET50-17','Equity'),ev-1000+200,'equity bridge');
 close(get('ZACHET50-25','Цена амортизируемой облигации'),390/1.12+360/1.12**2+330/1.12**3,'bond amortization');
 const subPV=[50,50,50,50,1050].reduce((a,v,i)=>a+v/1.15**(i+1),0);
 close(get('ZACHET50-40','Рыночная PV льготного займа'),subPV,'subsidized debt market value');
 close(get('ZACHET50-40','WACC'),(2000*18+subPV*15*.8+500*12*.8)/(2000+subPV+500),'subsidized WACC');
});

test('LBO interest waterfall uses opening debt, and mezzanine has separate senior waterfall',()=>{
 let d=4200;for(let y=0;y<3;y++){const coupon=d*.1;d-=900-coupon;}
 close(get('ZACHET50-30','Долг после трех лет'),d,'LBO senior');
 d=3000;for(let y=0;y<3;y++){d-=800-d*.1-1000*.15;}
 close(get('ZACHET50-32','Остаток старшего долга'),d,'LBO mezzanine');
 close(get('ZACHET50-33','Долг/EBITDA на конец'),(2800+(2800*.14-300))/500,'PIK covenants');
});

test('debt announcement is not placement, and project finance is not a buyback',()=>{
 close(get('ZACHET50-13','Equity до размещения'),100+.25*20,'MM announcement no funded debt');
 close(get('ZACHET50-46','Equity после размещения и выкупа'),120*.75/.12+.25*300-300,'MM buyback');
 close(get('ZACHET50-47','Equity на этапе объявления'),200*.8/.15+.2*400+30,'project NPV announcement');
 close(get('ZACHET50-47','EV после финансирования и реализации проекта'),200*.8/.15+400+30+.2*400,'full project asset value');
 close(get('ZACHET50-47','Equity после финансирования проекта'),200*.8/.15+30+.2*400,'project debt offsets new asset');
});

test('combined route visible in practice screen with old and new preparatory cases',()=>{
 const ui=readFileSync(new URL('../site/features/casebook-ui.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 assert.match(ui,/Подготовка к контрольной \/ зачету/);
 assert.match(ui,/startsWith\('PREP26-'\)/);
 assert.match(ui,/startsWith\('ZACHET50-'\)/);
 assert.match(app,/case=ZACHET50-01/);
});
