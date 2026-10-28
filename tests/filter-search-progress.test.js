import test from 'node:test';
import assert from 'node:assert/strict';
import {searchFilterOptions,normalizeSearch,buildFilterOptions} from '../site/features/filter-search.js';
import {recordPracticeResult,progressRows,retryArea,retryTopic,nextRetry} from '../site/features/progress-breakdown.js';
import {STUDY_AREAS} from '../site/data/curriculum.js';
import {TOPICS,TEMPLATE_CATALOG} from '../site/engine/index.js';

test('an unopened query or one/two characters shows the entire in-app option list',()=>{
 const areas=buildFilterOptions(STUDY_AREAS,TEMPLATE_CATALOG,'area');
 for(const query of ['','о','оц','CF','  '])assert.deepEqual(searchFilterOptions(areas,query).map(x=>x.id),STUDY_AREAS.map(x=>x.id));
 assert.ok(searchFilterOptions(areas,'оце').some(x=>x.id==='value'));
 assert.equal(searchFilterOptions(areas,'ъъъ').length,0);
 assert.equal(normalizeSearch('Ёмкость / EBITDA!'),'емкость ebitda');
});
test('financial acronym indexes target their actual syllabus directions',()=>{
 const areas=buildFilterOptions(STUDY_AREAS,TEMPLATE_CATALOG,'area');
 const topics=buildFilterOptions(TOPICS,TEMPLATE_CATALOG,'topic');
 const has=(rows,id)=>rows.some(x=>x.id===id);
 assert.ok(has(searchFilterOptions(areas,'CAPM'),'capital'));
 assert.ok(has(searchFilterOptions(topics,'capm'),'valuation'));
 assert.ok(has(searchFilterOptions(areas,'CFF'),'reporting'));
 assert.ok(has(searchFilterOptions(topics,'CFF'),'cash'));
 assert.ok(!has(searchFilterOptions(areas,'CFF'),'value'),'CFF is financing cash flow, not FCFF');
 assert.ok(has(searchFilterOptions(areas,'FCFF'),'value'));
 assert.ok(has(searchFilterOptions(areas,'FCFE'),'value'));
 assert.ok(has(searchFilterOptions(topics,'DCF'),'valuation'));
 assert.ok(has(searchFilterOptions(topics,'EBITDA'),'pl'));
 assert.ok(has(searchFilterOptions(topics,'бал'),'balance'));
 assert.ok(has(searchFilterOptions(areas,'долг'),'capital'));
 assert.ok(has(searchFilterOptions(areas,'амортизация'),'taxes'));
 assert.ok(has(searchFilterOptions(areas,'wacc'),'deals'));
});
test('the embedded pickers offer accurate counts for current level and companion filter',()=>{
 const areas=buildFilterOptions(STUDY_AREAS,TEMPLATE_CATALOG,'area',{topic:'valuation',level:'all'});
 const value=areas.find(x=>x.id==='value');
 assert.equal(value.count,TEMPLATE_CATALOG.filter(t=>t.area==='value'&&t.topic==='valuation').length);
 const topics=buildFilterOptions(TOPICS,TEMPLATE_CATALOG,'topic',{area:'reporting',level:'1'});
 const cash=topics.find(x=>x.id==='cash');
 assert.equal(cash.count,TEMPLATE_CATALOG.filter(t=>t.topic==='cash'&&t.area==='reporting'&&t.min<=1).length);
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
