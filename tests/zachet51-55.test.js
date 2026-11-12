import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE_BANK, CASE_BY_ID, CASE_CHECKPOINTS, verifyCheckpoint, availableCases} from '../site/engine/casebook.js';
import {ZACHET51_55_CASES, ZACHET51_55_CHECKPOINTS} from '../site/data/zachet51-55.js';

const get = (number,label) => {
 const id = 'ZACHET50-'+number;
 const checkpoint = ZACHET51_55_CHECKPOINTS[id]?.find(q=>q.label===label);
 assert.ok(checkpoint, 'no checkpoint: '+id+' / '+label);
 return checkpoint.answer;
};
const close = (actual, expected, name) =>
 assert.ok(Math.abs(actual-expected)<1e-8, name+': '+actual+' vs '+expected);

test('five new numbered cases are in the original exam collection exactly once',()=>{
 assert.deepEqual(ZACHET51_55_CASES.map(x=>x.id),[51,52,53,54,55].map(n=>'ZACHET50-'+n));
 assert.equal(CASE_BANK.length,179);
 assert.equal(new Set(CASE_BANK.map(x=>x.id)).size,CASE_BANK.length);
 for(const item of ZACHET51_55_CASES){
  assert.equal(CASE_BY_ID.get(item.id),item);
  assert.ok(item.conditionHtml.length>250,'missing full assignment '+item.id);
  assert.ok(item.steps.length>=4,'insufficient reasoning '+item.id);
  assert.ok(item.solutionHtml.length>400,'missing worked steps '+item.id);
  assert.match(item.source,/сообщения пользователя/);
  const checkpoints=CASE_CHECKPOINTS[item.id];
  assert.equal(checkpoints.length,ZACHET51_55_CHECKPOINTS[item.id].length);
  assert.ok(checkpoints.length>=7,'missing numerical checks '+item.id);
  for(const q of checkpoints){
   assert.equal(q.hint.levels.length,3);
   assert.ok(q.hint.levels.every(x=>x.length>10));
   assert.ok(Number.isFinite(q.answer));
   assert.equal(verifyCheckpoint(q,String(q.answer).replace('.',',')),true);
   assert.equal(verifyCheckpoint(q,''),null);
   assert.equal(verifyCheckpoint(q,'not a number'),false);
  }
 }
 const subset=availableCases('Зачет · 9. Реальные опционы');
 assert.equal(subset.length,5);
 assert.equal(availableCases('Все направления','ZACHET50-55').length,1);
});

test('problem 51: expansion uses end-of-year-one exercise and four years of returns',()=>{
 const annuity=[1,2,3,4].reduce((sum,k)=>sum+1/1.12**k,0);
 const base=-1000+(0.6*600*.75+0.4*200*.75)/1.12;
 const exercise=-400+(.5*600*.75)*annuity;
 const option=.6*Math.max(exercise,0)/1.12;
 close(get(51,'NPV без опциона'),base,'base NPV');
 close(get(51,'NPV расширения на конец года 1'),exercise,'exercise value');
 close(get(51,'Стоимость опциона сегодня'),option,'option value');
 close(get(51,'NPV с опционом'),base+option,'NPV with expansion');
});

test('problem 52: operational loss shield and after-tax equipment sale are distinct',()=>{
 const operationLoss=-100*(1-.2);
 const expected=.7*500*.8+.3*operationLoss;
 const base=-800+expected/1.15;
 const sale=700*.4;
 const saleTaxShield=(700-sale)*.2;
 const option=.3*(sale+saleTaxShield)/1.15;
 close(get(52,'FCFF при операционном убытке'),operationLoss,'operating shield');
 close(get(52,'Цена продажи оборудования'),sale,'sale price');
 close(get(52,'Дополнительный налоговый щит продажи'),saleTaxShield,'sale tax shield');
 close(get(52,'NPV без опциона'),base,'base NPV');
 close(get(52,'Стоимость опциона сегодня'),option,'abandonment option');
 close(get(52,'NPV с опционом'),base+option,'NPV with sale');
 assert.match(CASE_BY_ID.get('ZACHET50-52').solutionHtml,/терминальных потоков нет/);
});

test('problem 53: deferred investment is paid only after the success signal',()=>{
 const now=-1000+(.5*2000*.8+.5*200*.8)/1.1;
 const successExercise=-1000+2000*.8/1.1;
 const delayed=.5*Math.max(successExercise,0)/1.1;
 close(get(53,'NPV запуска сейчас'),now,'launch now');
 close(get(53,'NPV успешной отсрочки на конец года 1'),successExercise,'conditional year-one NPV');
 close(get(53,'NPV стратегии отсрочки сегодня'),delayed,'wait');
 close(get(53,'Стоимость опциона относительно обязательного запуска'),delayed-now,'option vs forced launch');
 assert.match(CASE_BY_ID.get('ZACHET50-53').solutionHtml,/206,6116/);
 assert.match(CASE_BY_ID.get('ZACHET50-53').solutionHtml,/лучшей стратегии без права отсрочки|лучшая стратегия без права отсрочки/);
});

test('problem 54: switching only in low-demand state',()=>{
 const base=-800+(.6*500*.75+.4*200*.75)/1.12;
 const exercise=-100+400*.75/1.12;
 const option=.4*Math.max(exercise,0)/1.12;
 close(get(54,'NPV без опциона'),base,'base');
 close(get(54,'NPV переключения на конец года 1'),exercise,'switch');
 close(get(54,'Стоимость опциона сегодня'),option,'option');
 close(get(54,'NPV с опционом'),base+option,'with switch');
});

test('problem 55: EV not NPV, and both equity values subtract the same net debt',()=>{
 const annuity=[1,2,3,4].reduce((sum,k)=>sum+1/1.12**k,0);
 const baseEV=(.5*900*.75+.5*300*.75)/1.12;
 const exercise=-600+400*.75*annuity;
 const option=.5*Math.max(exercise,0)/1.12;
 close(get(55,'EV без опциона'),baseEV,'EV without option');
 close(get(55,'NPV масштабирования на конец года 1'),exercise,'scale up');
 close(get(55,'Стоимость опциона сегодня'),option,'option value');
 close(get(55,'EV с опционом'),baseEV+option,'EV with option');
 close(get(55,'Equity без опциона'),baseEV-200,'base equity');
 close(get(55,'Equity с опционом'),baseEV+option-200,'equity with option');
 assert.match(CASE_BY_ID.get('ZACHET50-55').solutionHtml,/первоначальный CAPEX.*не задан/);
});
