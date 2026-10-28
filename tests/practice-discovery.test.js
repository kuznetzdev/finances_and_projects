import test from 'node:test';import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG} from '../site/engine/index.js';
import {STUDY_AREAS} from '../site/data/curriculum.js';
import {practicePool,areaCounts,choosePracticeLevel,exerciseOptions} from '../site/features/practice-discovery.js';
test('all subjects and all difficulties expose the whole generator catalog',()=>{
 assert.equal(practicePool(TEMPLATE_CATALOG,{area:'all',topic:'all',level:'all'}).length,TEMPLATE_CATALOG.length);
 for(const t of TEMPLATE_CATALOG) assert.ok(practicePool(TEMPLATE_CATALOG,{area:t.area,topic:t.topic,level:'all'}).some(x=>x.id===t.id));
});
test('difficulty filters support both individual levels and all levels',()=>{
 for(const level of [1,2,3,4]){
  const items=practicePool(TEMPLATE_CATALOG,{level:String(level)});
  assert.ok(items.length>0);
  assert.ok(items.every(x=>x.min<=level));
  if(level<4)assert.ok(items.length<=practicePool(TEMPLATE_CATALOG,{level:String(level+1)}).length);
 }
 assert.equal(choosePracticeLevel('all',4),4);
 assert.equal(choosePracticeLevel('2',3),3);
});
test('topic and difficulty filters form nonempty truthful groups',()=>{
 const groups=exerciseOptions(TEMPLATE_CATALOG,STUDY_AREAS,{level:'all'});
 const entries=groups.flatMap(g=>g.templates);
 assert.equal(entries.length,TEMPLATE_CATALOG.length);
 assert.equal(new Set(entries.map(x=>x.id)).size,entries.length);
 for(const area of areaCounts(TEMPLATE_CATALOG,STUDY_AREAS,{topic:'all',level:'all'})){
  assert.equal(area.count,practicePool(TEMPLATE_CATALOG,{area:area.id,level:'all'}).length);
 }
});
test('screen exposes clear random action, full catalog and independent selectors',async()=>{
 const fs=await import('node:fs');
 const app=fs.readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 const index=fs.readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 assert.match(app,/id="random-exercise"/);
 assert.match(app,/id="template-picker"/);
 assert.match(app,/id="level-filter"/);
 assert.match(app,/id="area-filter"/);
 assert.match(app,/id="topic-filter"/);
 assert.match(app,/level:'all'/);
 assert.match(index,/id="icon-shuffle"/);
});
