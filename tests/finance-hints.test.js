import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';

const corrected=[
  'v-pv','v-fv','v-ytm','t-profit','r-dso','r-cash-cycle','a-beta-unlever'
];

test('previously short finance hints provide useful reasoning at each level',()=>{
  for(const id of corrected){
    const t=TEMPLATE_CATALOG.find(v=>v.id===id);
    assert.ok(t,id);
    for(const level of new Set([t.min,4])){
      for(let seed=1;seed<=20;seed++){
        const task=generateExercise({templateId:id,topic:t.topic,level,seed});
        assert.ok(task.hint.length>=75,id+' level='+level+' seed='+seed);
        assert.ok(!/undefined|NaN|Infinity/.test(task.hint),id);
      }
    }
  }
});
