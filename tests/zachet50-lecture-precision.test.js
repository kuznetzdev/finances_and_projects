import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE_BY_ID,CASE_CHECKPOINTS} from '../site/engine/casebook.js';

const item=n=>CASE_BY_ID.get('ZACHET50-'+String(n).padStart(2,'0'));
const answer=(n,label)=>CASE_CHECKPOINTS[item(n).id].find(q=>q.label===label)?.answer;

test('task 38 distinguishes target market D/E from actual balance-sheet debt',()=>{
 const x=item(38);
 const actual=500/answer(38,'Equity');
 assert.ok(Math.abs(actual-1)>0.5,'given debt is not the target leverage');
 assert.equal(x.caveat,true);
 assert.match(x.solutionHtml,/0,277/);
 assert.match(x.solutionHtml,/целев.*текущ|текущ.*целев/is);
 assert.match(x.source,/Beta рычаговая и безрычаговая/);
});

test('task 45 does not silently allocate debt proceeds to buybacks',()=>{
 const x=item(45);
 const equityIfPaid=answer(45,'Equity после долга при распределении 500 акционерам');
 assert.ok(Number.isFinite(equityIfPaid),'graded outcome must identify the buyback/distribution assumption');
 const shieldedEV=answer(45,'Стоимость с долгом VL');
 assert.ok(Math.abs(equityIfPaid-(shieldedEV-500))<1e-8);
 assert.equal(x.caveat,true);
 assert.match(x.solutionHtml,/выкуп|распределен/);
 assert.match(x.solutionHtml,/ден.*на счете|ден.*остают|cash/is);
 assert.match(x.solutionHtml,/1 316,6667/);
 assert.match(x.solutionHtml,/816,6667/);
});

test('task 47 declares the investment assumption and announcement-stage EV explicitly',()=>{
 const x=item(47);
 assert.equal(x.caveat,true);
 assert.match(x.solutionHtml,/EV после объявления[^.]*1 176,6667/);
 assert.match(x.solutionHtml,/400.*предполага|предполага.*400/is);
 assert.match(x.solutionHtml,/смета|отдельн.*стоимост|объем инвестиций/is);
 assert.ok(Math.abs(answer(47,'Equity после финансирования проекта')-answer(47,'Equity на этапе объявления'))<1e-8);
});

test('lecture provenance for FCFF, liquidity and comparative valuation is topic specific',()=>{
 assert.match(item(7).source,/МФТИ.*Лекция.*5|МФТИ.*лекция.*5/i);
 assert.match(item(9).source,/Лекция.*2|лекция.*2/i);
 assert.match(item(18).source,/Сравнительный.*подход/i);
 assert.match(item(19).source,/Собственный капитал/i);
});
