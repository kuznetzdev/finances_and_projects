import test from 'node:test';
import assert from 'node:assert/strict';
import {searchFilterOptions,normalizeSearch} from '../site/features/filter-search.js';
import {recordPracticeResult,progressRows,retryArea,retryTopic,nextRetry} from '../site/features/progress-breakdown.js';
import {STUDY_AREAS} from '../site/data/curriculum.js';
import {TOPICS,TEMPLATE_CATALOG} from '../site/engine/index.js';

test('search appears only from 3 characters and understands Russian, case, aliases',()=>{
 const areas=STUDY_AREAS.map(x=>({...x,keywords:TEMPLATE_CATALOG.filter(t=>t.area===x.id).map(t=>t.skill).filter(Boolean)}));
 assert.deepEqual(searchFilterOptions(areas,'дв'),[]);
 assert.ok(searchFilterOptions(areas,'ОЦЕ').some(x=>x.id==='value'));
 assert.ok(searchFilterOptions(areas,'wacc').some(x=>x.id==='deals'));
 assert.ok(searchFilterOptions(areas,'долг').some(x=>x.id==='capital'));
 assert.equal(normalizeSearch('Ёмкость / EBITDA!'),'емкость ebitda');
 assert.deepEqual(searchFilterOptions(areas,'ъъъ'),[]);
});
test('topic searches include indexed skills and financial synonyms',()=>{
 const topics=TOPICS.map(x=>({...x,keywords:TEMPLATE_CATALOG.filter(t=>t.topic===x.id).map(t=>t.skill).filter(Boolean)}));
 assert.ok(searchFilterOptions(topics,'EBITDA').some(x=>x.id==='pl'));
 assert.ok(searchFilterOptions(topics,'DCF').some(x=>x.id==='valuation'));
 assert.ok(searchFilterOptions(topics,'бал').some(x=>x.id==='balance'));
});
test('attempt stats count separate answers, skips never call recorder',()=>{
 const stats={retry:[],byArea:{},byTopic:{}};
 const e={area:'value',topic:'valuation',templateId:'dcf-two-stage'};
 recordPracticeResult(stats,e,2,4);
 recordPracticeResult(stats,e,4,4);
 assert.deepEqual(stats.byArea.value,{attempts:2,perfect:1,questions:8,correct:6});
 assert.deepEqual(stats.byTopic['value::valuation'],stats.byArea.value);
 assert.equal(progressRows(stats,STUDY_AREAS,TOPICS,TEMPLATE_CATALOG).find(x=>x.id==='value').accuracy,75);
});
test('weak areas sorted first, archived retries without area still accessible',()=>{
 const old=TEMPLATE_CATALOG.find(t=>t.area==='reporting'),low=TEMPLATE_CATALOG.find(t=>t.area==='value');
 assert.ok(old&&low);
 const retry=[{templateId:low.id,topic:low.topic,seed:19,level:4},{templateId:old.id,topic:old.topic,seed:42,level:3}];
 const stats={retry,byArea:{value:{attempts:2,perfect:0,questions:10,correct:2},reporting:{attempts:5,perfect:4,questions:10,correct:9}},byTopic:{}};
 const rows=progressRows(stats,STUDY_AREAS,TOPICS,TEMPLATE_CATALOG);
 assert.equal(rows[0].id,'value');assert.equal(rows[0].accuracy,20);
 assert.equal(retryArea(retry,TEMPLATE_CATALOG,'reporting').length,1);
 assert.equal(retryTopic(retry,TEMPLATE_CATALOG,'value',low.topic).length,1);
 assert.equal(nextRetry(retry,TEMPLATE_CATALOG,'value').templateId,low.id);
 assert.equal(nextRetry(retry,TEMPLATE_CATALOG,'reporting',old.topic).templateId,old.id);
 assert.equal(nextRetry(retry,TEMPLATE_CATALOG,'taxes'),null);
});
