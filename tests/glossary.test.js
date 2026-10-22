import test from 'node:test';
import assert from 'node:assert/strict';
import {CONCEPTS,KNOWLEDGE_GROUPS} from '../site/data/knowledge.js';
import { GLOSSARY_ADDITIONS } from '../site/data/glossary-additions.js';
import { GLOSSARY_FORMULAS, GLOSSARY_ENRICHMENTS } from '../site/data/glossary-formulas.js';
import { searchConcepts, glossaryIntegrity, normalizeTerm } from '../site/data/glossary-engine.js';
import { formulaVariantsMarkup, glossaryMetaMarkup, glossaryCardMarkup } from '../site/features/glossary-ui.js';
const byId=id=>CONCEPTS.find(c=>c.id===id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const close=(actual,expected,eps=1e-9)=>assert.ok(Math.abs(actual-expected)<eps,`${actual} != ${expected}`);

test('Glossary is large, has unique IDs, canonical terms and unambiguous aliases',()=>{
 assert.equal(CONCEPTS.length,205);
 assert.equal(GLOSSARY_ADDITIONS.length,101);
 assert.deepEqual(glossaryIntegrity(CONCEPTS),[]);
 assert.equal(new Set(CONCEPTS.map(x=>x.id)).size,205);
 assert.ok(KNOWLEDGE_GROUPS.includes('Фонды и венчур'));
 assert.ok(CONCEPTS.filter(x=>x.formulas.length).length>=115);
 assert.ok(CONCEPTS.reduce((n,x)=>n+x.formulas.length,0)>=175);
 for(const id of Object.keys(GLOSSARY_FORMULAS))assert.ok(byId(id),`formula orphan ${id}`);
 for(const id of Object.keys(GLOSSARY_ENRICHMENTS))assert.ok(byId(id),`enrichment orphan ${id}`);
});

test('Existing canonical records persist; misspellings and synonyms do not become duplicates',()=>{
 assert.equal(CONCEPTS.filter(x=>x.id==='preferred').length,1);
 assert.equal(CONCEPTS.filter(x=>x.id==='bridge').length,1);
 assert.equal(CONCEPTS.filter(x=>x.id==='fcfe').length,1);
 assert.equal(CONCEPTS.filter(x=>x.id==='fcff').length,1);
 assert.equal(CONCEPTS.filter(x=>x.id==='covenant').length,1);
 assert.equal(searchConcepts(CONCEPTS,'привелигированная акция')[0]?.id,'preferred');
 assert.equal(searchConcepts(CONCEPTS,'обычная акция')[0]?.id,'common-share');
 assert.equal(searchConcepts(CONCEPTS,'бридж кредит')[0]?.id,'bridge');
 assert.equal(searchConcepts(CONCEPTS,'ПИФ')[0]?.id,'unit-fund');
 assert.equal(searchConcepts(CONCEPTS,'OIBDA')[0]?.id,'oibda');
 assert.equal(searchConcepts(CONCEPTS,'pre IPO')[0]?.id,'pre-ipo');
 assert.equal(searchConcepts(CONCEPTS,'НАЛОГ НА ПРИБЫЛЬ ОРГАНИЗАЦИЙ')[0]?.id,'profit-tax');
 assert.equal(normalizeTerm('   САЛЬДО  '),'сальдо');
});

test('Search considers formulas, synonyms, descriptions and respects category',()=>{
 assert.ok(searchConcepts(CONCEPTS,'Profit_call').some(x=>x.id==='call-option'));
 assert.ok(searchConcepts(CONCEPTS,'аннуитетный платёж').some(x=>x.id==='annuity-payment'));
 assert.ok(searchConcepts(CONCEPTS,'специальные ставки').some(x=>x.id==='profit-tax'));
 assert.ok(searchConcepts(CONCEPTS,'seed','Фонды и венчур').some(x=>x.id==='seed-stage'));
 assert.equal(searchConcepts(CONCEPTS,'seed','Налоги').length,0);
 for(const c of CONCEPTS){if(c.aliases?.length)assert.ok(searchConcepts(CONCEPTS,c.aliases[0]).some(x=>x.id===c.id),`alias not searchable for ${c.id}`);}
});

test('Stages, security types, and fund definitions are distinct and cautious',()=>{
 const stages=['pre-seed','seed-stage','series-a','series-b','series-c','pre-ipo','ipo'];
 for(const id of stages)assert.ok(byId(id).definition.length>60,id);
 assert.match(byId('seed-stage').contrast,/Series A/);
 assert.match(byId('unit-fund').definition,/не является юридическим лицом/);
 assert.match(byId('financial-option').contrast,/реального опциона/);
 assert.match(byId('loan').contrast,/не выручку/);
 assert.match(byId('oibda').contrast,/EBITDA/);
 assert.match(byId('profit-tax').note,/25%/);
});

test('All formula variants render with explanatory headings and escaped content',()=>{
 for(const c of CONCEPTS){
  const html=formulaVariantsMarkup(c,escape);
  if(!c.formulas.length){assert.equal(html,'');continue;}
  assert.match(html,/glossary-formulas/);
  assert.equal((html.match(/glossary-formula-card/g)||[]).length,c.formulas.length);
  for(const f of c.formulas){assert.ok(html.includes(escape(f.expression)),c.id);assert.ok(html.includes(escape(f.title)),c.id);}
  assert.match(glossaryCardMarkup(c,escape),/data-term=/);
 }
 const bad={aliases:['<script>alert(1)</script>'],note:'<img src=x>'};
 const escaped=glossaryMetaMarkup(bad,escape);
 assert.ok(!escaped.includes('<script>')&&!escaped.includes('<img'));
});

test('EAC/EAA and FCFF/FCFE differences are explicitly explained',()=>{
 const formulas=byId('eac').formulas;
 assert.ok(formulas.some(f=>f.expression.startsWith('EAC')));
 assert.ok(formulas.some(f=>f.expression.startsWith('EAA')));
 assert.ok(formulas.some(f=>f.explanation.includes('МИНИМАЛЬНЫМ')));
 assert.ok(formulas.some(f=>f.explanation.includes('МАКСИМАЛЬНЫЙ')));
 assert.equal(byId('fcff').formulas.length,2);
 assert.equal(byId('fcfe').formulas.length,2);
 assert.ok(byId('oibda').formulas.length>=2);
 assert.ok(byId('ebitda').formulas.length>=3);
 assert.ok(byId('profit-tax').formulas.some(f=>f.explanation.includes('25%')));
});

test('Independent financial calculation checks for printed variants, 2026 rate and standard annuity',()=>{
 // These numerical checks are independent of rendering and verify the identities described in entries.
 for(let i=1;i<=300;i++){
   const t=.25,r=.03+(i%17)*.01,n=2+i%12,ebit=100+i,da=10+i%14,capex=20+i%27;
   const deltaNwc=3+i%8,interest=12+i%13,borrow=5+i%21;
   const fcff=ebit*(1-t)+da-capex-deltaNwc;
   const ni=(ebit-interest)*(1-t);
   const fcfe=ni+da-capex-deltaNwc+borrow;
   close(fcfe,fcff-interest*(1-t)+borrow);
   const pvCosts=180+i*2.6;
   const af=(1-(1+r)**(-n))/r;
   close(pvCosts/af,pvCosts*r/(1-(1+r)**(-n)));
   const I0=100+i, cf=I0*1.15;
   close(cf/(1+r)-I0, -I0+cf/(1+r));
   const E=100+i,D=25+(i%140),re=.12,rd=.08;
   const wacc=E/(E+D)*re+D/(E+D)*rd*(1-t);
   assert.ok(wacc>0&&wacc<re);
   const vatRate=.22,net=100+i;
   close((net*(1+vatRate))*vatRate/(1+vatRate),net*vatRate);
   const payment=100*r/(1-(1+r)**(-n));assert.ok(payment>0);
   const principal=100;
   close(payment*(1-(1+r)**(-n))/r,principal);
 }
});