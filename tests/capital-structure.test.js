import test from 'node:test';
import assert from 'node:assert/strict';
import {TEMPLATE_CATALOG,generateExercise,checkAnswer} from '../site/engine/index.js';
import {templates} from '../site/engine/templates/capital-structure.js';
import {CASE_BANK,CASE_BY_ID,CASE_CHECKPOINTS,verifyCheckpoint} from '../site/engine/casebook.js';
import {CONCEPTS} from '../site/data/knowledge.js';
const close=(actual,expected,id)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<0.00015,`${id}: ${actual} != ${expected}`);
const answer=(ex,key)=>{let q=ex.questions.find(v=>v.key===key);assert.ok(q,`${ex.templateId} missing ${key}`);return q.answer;};
const ids=['capital-financing-match','capital-roa-debt-roe','capital-wacc-dynamic','capital-mm-tax','capital-tradeoff','capital-pecking-order','capital-waterfall'];

test('Iteration 2 registers seven separate templates for deals, financing and risks',()=>{
 assert.deepEqual(templates.map(t=>t.id),ids);
 assert.equal(TEMPLATE_CATALOG.length,115);
 for(let t of templates){let item=TEMPLATE_CATALOG.find(x=>x.id===t.id);assert.equal(item.area,'deals');assert.ok(item.skill);assert.ok(item.min>=2&&item.min<=4);}
});

test('Seven capital generators use reproducible numbers and independent financial identities',()=>{
 for(const t of templates)for(let seed=1;seed<=250;seed++){
  let args={templateId:t.id,topic:t.topic,level:4,seed};
  let ex=generateExercise(args),v=ex.audit;
  assert.deepEqual(ex,generateExercise(args));
  assert.ok(ex.story.length>=220,t.id);assert.ok(ex.questions.length>=4,t.id);
  assert.ok(ex.hint.length>=70&&ex.explanation.length>=3,t.id);
  assert.ok(!/NaN|undefined|Infinity/.test(ex.story+JSON.stringify(ex.questions)),t.id);
  assert.ok(v,t.id);assert.equal(new Set(ex.questions.map(q=>q.key)).size,ex.questions.length);
  for(let q of ex.questions){
   if(q.type==='number'){assert.ok(Number.isFinite(q.answer));assert.ok(checkAnswer(q,String(q.answer).replace('.',',')));}
   if(q.type==='choice')assert.ok(q.choices.includes(q.answer));
  }
  if(t.id==='capital-financing-match'){
   close(v.lta+v.permanentWC+v.seasonalWC,v.totalAssets,t.id);
   close(v.longTerm+v.shortTerm,v.totalAssets,t.id);
   close(v.permanentShort,Math.max(0,v.shortTerm-v.seasonalWC),t.id);
   assert.equal(answer(ex,'policy'),v.shortTerm===0?'Консервативная':v.shortTerm===v.seasonalWC?'Умеренная':'Агрессивная');
  }else if(t.id==='capital-roa-debt-roe'){
   for(let i=0;i<v.debtShares.length;i++){
    const debt=v.assets*v.debtShares[i],eq=v.assets-debt;
    let roe=(v.roa*v.assets-v.kd*debt)*(1-v.tax)/eq*100;
    close(v.roes[i],roe,t.id);
   }
   close(answer(ex,'roe-low'),v.roes[0],t.id);
   close(answer(ex,'roe-high'),v.roes.at(-1),t.id);
   close(answer(ex,'delta-roe'),v.roes.at(-1)-v.roes[0],t.id);
  }else if(t.id==='capital-wacc-dynamic'){
   for(let i=0;i<v.shares.length;i++)close(v.wacc[i],((1-v.shares[i])*v.re[i]+v.shares[i]*v.rd[i]*(1-v.tax))*100,t.id);
   close(answer(ex,'wacc-min'),Math.min(...v.wacc),t.id);
   assert.equal(answer(ex,'min-share'),String(v.shares[v.wacc.indexOf(Math.min(...v.wacc))]*100)+'%');
  }else if(t.id==='capital-mm-tax'){
   close(answer(ex,'unlevered'),v.ebit*(1-v.tax)/v.ku,t.id);
   close(answer(ex,'tax-shield'),v.tax*v.debt,t.id);
   close(answer(ex,'levered'),v.ebit*(1-v.tax)/v.ku+v.tax*v.debt,t.id);
   close(answer(ex,'levered-equity'),v.ebit*(1-v.tax)/v.ku+v.tax*v.debt-v.debt,t.id);
   close(answer(ex,'no-tax-value'),v.ebit/v.ku,t.id);
  }else if(t.id==='capital-tradeoff'){
   for(let i=0;i<v.debts.length;i++)close(v.values[i],v.unlevered+v.tax*v.debts[i]-v.distressCosts[i],t.id);
   close(answer(ex,'best-value'),Math.max(...v.values),t.id);
   assert.equal(answer(ex,'best-debt'),String(v.debts[v.values.indexOf(Math.max(...v.values))])+' млн ₽');
  }else if(t.id==='capital-pecking-order'){
   close(v.internal+v.debt+v.equityIssue,v.need,t.id);
   close(v.internal,Math.min(v.need,v.cash),t.id);
   close(v.debt,Math.min(v.need-v.internal,v.debtCapacity),t.id);
   close(answer(ex,'issue'),v.equityIssue,t.id);
  }else if(t.id==='capital-waterfall'){
   let rem=v.proceeds;
   for(let i=0;i<v.claims.length;i++){
    let paid=Math.min(v.claims[i],rem);close(v.paid[i],paid,t.id);rem-=paid;
   }
   close(answer(ex,'common'),rem,t.id);
   close(v.paid.reduce((x,y)=>x+y,0)+rem,v.proceeds,t.id);
  }
 }
});

test('Five independent cases supplement B13 and retain original source bank untouched',()=>{
 assert.equal(CASE_BANK.length,73);
 for(let id of ['B02','B03','B04','B05','B14']){
  let c=CASE_BY_ID.get(id);assert.ok(c,id);
  assert.ok(c.conditionHtml.length>280,id);
  assert.ok(c.steps.length>=4,id);
  assert.ok(c.solutionHtml.length>500,id);
  assert.ok(c.source.length>40,id);
 }
 for(let id of ['B02','B03','B05','B14']){
  assert.ok(CASE_CHECKPOINTS[id]?.length>=3,id);
  for(let chk of CASE_CHECKPOINTS[id])assert.ok(verifyCheckpoint(chk,String(chk.answer)),id);
 }
 assert.ok(!CASE_CHECKPOINTS.B04?.length,'Historical case should not invent numeric answers');
});

test('Fifteen unique capital-structure concepts extend the glossary',()=>{
 const ids=['capital-conservative-policy','capital-moderate-policy','capital-aggressive-policy','capital-maturity-matching','capital-target-structure','capital-mm-i','capital-mm-ii','capital-tradeoff-theory','capital-pecking-order','distress-direct-costs','distress-indirect-costs','capital-debt-tax-benefit','capital-cash-waterfall','capital-financing-deficit','capital-refinancing-risk'];
 assert.equal(CONCEPTS.length,231);
 for(let id of ids){
  let matches=CONCEPTS.filter(v=>v.id===id);
  assert.equal(matches.length,1,id);assert.ok(matches[0].definition.length>=65,id);
  assert.ok(matches[0].source.length>=20,id);
 }
});
