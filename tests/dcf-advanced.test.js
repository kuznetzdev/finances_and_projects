import test from 'node:test';
import assert from 'node:assert/strict';
import {templates} from '../site/engine/templates/dcf-advanced.js';
import {TEMPLATE_CATALOG,generateExercise,checkAnswer} from '../site/engine/index.js';
import {CONCEPTS} from '../site/data/knowledge.js';
import {CASE_BY_ID,CASE_CHECKPOINTS,verifyCheckpoint} from '../site/engine/casebook.js';
const close=(a,b,where)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<.00012,where+': '+a+' vs '+b);
const get=(e,k)=>{let q=e.questions.find(x=>x.key===k);assert.ok(q,e.templateId+': '+k);return q.answer;};
const ids=['dcf-fcff-ebitda-tax','dcf-fcfe-equity','dcf-two-stage','dcf-terminal-exit','dcf-midyear','dcf-sensitivity','dcf-income-capitalization'];
test('Seven DCF generators registered for the valuation curriculum',()=>{
 assert.deepEqual(templates.map(x=>x.id),ids);
 assert.equal(TEMPLATE_CATALOG.length,122);
 for(const x of templates){let t=TEMPLATE_CATALOG.find(t=>t.id===x.id);assert.equal(t.area,'value');}
});
test('Independent DCF reconciliation for 200 seeds per template',()=>{
 for(const template of templates)for(let seed=1;seed<=200;seed++){
  const args={templateId:template.id,level:4,topic:template.topic,seed},e=generateExercise(args),v=e.audit;
  assert.deepEqual(e,generateExercise(args));assert.ok(e.story.length>230);assert.ok(e.hint.length>75);
  assert.ok(e.explanation.length>=4);assert.ok(e.questions.length>=4);
  assert.ok(!/NaN|Infinity|undefined/.test(JSON.stringify(e)));
  for(const q of e.questions)if(q.type==='number'){assert.ok(Number.isFinite(q.answer));assert.ok(checkAnswer(q,String(q.answer).replace('.',',')));}
  assert.ok(v&&v.wacc>v.g&&v.wacc>.01&&v.wacc<.5,'DCF rate/g invalid '+template.id);
  if(template.id==='dcf-fcff-ebitda-tax'){
   close(v.ebit,v.ebitda-v.da,'EBIT');
   close(v.fcff,v.ebit*(1-v.tax)+v.da-v.capex-v.nwc,'FCFF');
   close(get(e,'fcff'),v.fcff,'FCFF answer');
  }else if(template.id==='dcf-fcfe-equity'){
   close(v.fcfe,v.fcff-v.interest*(1-v.tax)+v.netBorrowing,'FCFE');
   close(v.equity,v.fcfe/v.ke,'equity perpetuity');
   close(get(e,'equity'),v.equity,'equity answer');
  }else if(template.id==='dcf-two-stage'){
   const pv=v.fcffs.reduce((s,cf,i)=>s+cf/(1+v.wacc)**(i+1),0);
   close(v.tv,v.fcffs.at(-1)*(1+v.g)/(v.wacc-v.g),'terminal');
   close(v.ev,pv+v.tv/(1+v.wacc)**v.fcffs.length,'ev');
   close(get(e,'ev'),v.ev,'ev question');
  }else if(template.id==='dcf-terminal-exit'){
   close(v.tv,v.exitEbitda*v.multiple,'exit tv');
   close(v.ev,v.pvExplicit+v.tv/(1+v.wacc)**v.years,'exit ev');
   close(get(e,'tv'),v.tv,'tv');
  }else if(template.id==='dcf-midyear'){
   const pv=v.flows.reduce((s,cf,i)=>s+cf/(1+v.wacc)**(i+.5),0);
   close(v.midPv,pv,'mid');
   close(v.endPv,v.flows.reduce((s,cf,i)=>s+cf/(1+v.wacc)**(i+1),0),'end');
   assert.ok(v.midPv>v.endPv);
  }else if(template.id==='dcf-sensitivity'){
   assert.ok(v.g<v.wacc);
   close(v.base,v.fcff*(1+v.g)/(v.wacc-v.g),'base perpetuity');
   assert.ok(v.upperWaccValue<v.base);
   assert.ok(v.upperGrowthValue>v.base);
  }else if(template.id==='dcf-income-capitalization'){
   close(v.capRate,v.wacc-v.g,'capitalization rate');
   close(v.value,v.income/v.capRate,'income capitalization');
  }
 }
});
test('B09 integrates FCFF DCF and FCFE DCF consistently',()=>{
 const c=CASE_BY_ID.get('B09');assert.ok(c&&c.steps.length>=5);
 assert.ok(c.conditionHtml.includes('FCFE')&&c.conditionHtml.includes('FCFF'));
 assert.ok(c.solutionHtml.length>1000);
 assert.ok(CASE_CHECKPOINTS.B09.length>=4);
 for(const q of CASE_CHECKPOINTS.B09)assert.equal(verifyCheckpoint(q,String(q.answer)),true);
 assert.equal(CASE_BY_ID.size,74);
});
test('Income valuation glossary includes separate canonical models',()=>{
 for(const id of ['dcf-two-stage-model','dcf-terminal-exit-multiple','dcf-midyear-convention','dcf-capitalization-rate','dcf-value-sensitivity']){
  const c=CONCEPTS.find(c=>c.id===id);assert.ok(c&&c.formulas?.length,id);
 }
 assert.equal(CONCEPTS.length,236);
});
