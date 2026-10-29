import test from 'node:test';
import assert from 'node:assert/strict';
import {CONCEPTS} from '../site/data/knowledge.js';
import {GLOSSARY_FORMULAS} from '../site/data/glossary-formulas.js';
import {calculatePnlExample,PNL_TEACHING_EXAMPLE,PNL_EXAMPLE_CONCEPTS} from '../site/data/pnl-example.js';
import {searchConcepts,glossaryIntegrity} from '../site/data/glossary-engine.js';
import {pnlWorkedExampleMarkup,formulaVariantsMarkup} from '../site/features/glossary-ui.js';
import {symbolsForFormula} from '../site/data/formula-notation.js';
const byId=id=>CONCEPTS.find(x=>x.id===id);
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);

test('Lecture 3.1 P&L reconciles COGS, operating expenses, net profit and EBITDA',()=>{
 const p=calculatePnlExample();
 assert.equal(p.revenue,2000);
 assert.equal(p.cogs,1300);
 assert.equal(p.depreciationInCogs,70);
 assert.equal(p.sellingAndAdministrative,350);
 assert.equal(p.depreciationInSellingAndAdministrative,30);
 assert.equal(p.gross,700);
 assert.equal(p.ebit,350);
 assert.equal(p.profitBeforeTax,300);
 assert.equal(p.profitTax,60);
 assert.equal(p.netprofit,240);
 assert.equal(p.depreciationTotal,100);
 assert.equal(p.ebitda,450);
 assert.equal(p.grossMargin,35);
 assert.equal(p.ebitdaMargin,22.5);
 assert.equal(p.netMargin,12);
 assert.equal(p.exampleTaxRate,.2);
});

test('No double deduction of depreciation; EBITDA reconciles for alternative valid scenarios',()=>{
 for(let i=0;i<150;i++){
  const d={revenue:1000+i*12,cogs:500+i*4,depreciationInCogs:10+i%45,
   sellingAndAdministrative:180+i*2,depreciationInSellingAndAdministrative:7+i%28,
   interest:10+i%9,exampleTaxRate:.20};
  assert.ok(d.depreciationInCogs<d.cogs&&d.depreciationInSellingAndAdministrative<d.sellingAndAdministrative);
  const p=calculatePnlExample(d);
  near(p.gross,p.revenue-p.cogs);
  near(p.ebit,p.revenue-p.cogs-p.sellingAndAdministrative);
  near(p.ebitda,p.ebit+p.depreciationInCogs+p.depreciationInSellingAndAdministrative);
  near(p.ebitda,p.revenue-(p.cogs-p.depreciationInCogs)-(p.sellingAndAdministrative-p.depreciationInSellingAndAdministrative));
  near(p.netprofit,(p.ebit-p.interest)*(1-p.exampleTaxRate));
 }
});

test('All related terms explicitly distinguish amortization in cost of sales vs below gross profit',()=>{
 assert.deepEqual(glossaryIntegrity(CONCEPTS),[]);
 for(const id of PNL_EXAMPLE_CONCEPTS){
  const item=byId(id);
  assert.ok(item,id+' is absent');
  assert.ok(pnlWorkedExampleMarkup(item,esc).includes('glossary-pnl-table'),id);
 }
 assert.equal(pnlWorkedExampleMarkup(byId('fcff'),esc),'');
 assert.match(byId('cogs').definition,/амортизац/);
 assert.match(byId('gross').contrast,/второй раз/);
 assert.match(byId('ebit').definition,/Амортизация/);
 assert.match(byId('ebitda').contrast,/дважды/);
 assert.match(byId('depreciation').contrast,/валовую прибыль/);
 assert.match(byId('gross-margin').definition,/амортизац/);
 assert.match(byId('netprofit').contrast,/повторно/);
 assert.ok(searchConcepts(CONCEPTS,'производственная амортизация').some(x=>x.id==='gross'));
});

test('P&L formula variants name the correct expense scope and keep symbol legends',()=>{
 for(const id of ['cogs','gross','ebit','ebitda','netprofit']){
  const formulas=GLOSSARY_FORMULAS[id];
  assert.ok(Array.isArray(formulas)&&formulas.length,id);
  const html=formulaVariantsMarkup(byId(id),esc);
  assert.match(html,/glossary-formula-card/);
  for(const formula of formulas){
   assert.ok(symbolsForFormula(formula.expression,id).length>0,id+' missing legend');
  }
 }
 assert.match(GLOSSARY_FORMULAS.gross[0].explanation,/70/);
 assert.match(GLOSSARY_FORMULAS.ebitda[0].explanation,/70.*30/);
 assert.match(GLOSSARY_FORMULAS.ebitda[0].assumptions,/дважды/);
 assert.match(GLOSSARY_FORMULAS.netprofit[1].expression,/Валовая прибыль/);
});

test('The displayed example is accessible, numeric, and warns that 20% is not the Russian headline tax rate',()=>{
 const html=pnlWorkedExampleMarkup(byId('gross'),esc);
 for(const [name,number] of [['Выручка','2 000'],['Себестоимость продаж','1 300'],['Валовая прибыль','700'],['EBIT','350'],['Чистая прибыль','240']]){
  assert.ok(html.includes(name),name);
  assert.ok(html.includes(number.replace(' ',' '))||html.includes(number),number);
 }
 assert.match(html,/aria-label="Сквозной пример/);
 assert.match(html,/70 \+ 30/);
 assert.match(html,/450/);
 assert.match(html,/20%/);
 assert.match(html,/не.*общая ставка/);
 const k=pnlWorkedExampleMarkup(byId('ebitda'),esc);
 assert.match(k,/glossary-pnl-bridge is-highlighted/);
 assert.equal(PNL_TEACHING_EXAMPLE.exampleTaxRate,.2);
});
