import test from 'node:test';
import assert from 'node:assert/strict';
import {GLOSSARY_FORMULAS} from '../site/data/glossary-formulas.js';
import {symbolsForFormula, symbolsForHint} from '../site/data/formula-notation.js';
import {formulaVariantsMarkup,symbolLegendMarkup} from '../site/features/glossary-ui.js';
const escape = input => String(input).replace(/[&<>"']/g, c=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const all=Object.entries(GLOSSARY_FORMULAS).flatMap(([id,forms])=>forms.map(form=>[id,form]));

test('All published formula variants have nonempty and nonduplicated symbols',()=>{
 assert.ok(all.length>=140,'Formulas unexpectedly missing');
 for(const [id,f] of all){
  const list=symbolsForFormula(f.expression,id);
  assert.ok(list.length>0,`${id}: ${f.expression}`);
  assert.equal(new Set(list.map(s=>s.symbol)).size,list.length,id);
  for(const s of list){assert.ok(f.expression.includes(s.symbol),`${id}: missing symbol ${s.symbol}`);assert.ok(s.meaning.length>15,`${id}: short meaning for ${s.symbol}`);}
 }
});

test('Different contexts do not confuse debt, dividends and growth',()=>{
 const wacc=symbolsForFormula('WACC = (E/V) × Re + (D/V) × Rd × (1 − T)','wacc');
 const gordon=symbolsForFormula('P₀ = D₁ / (Re − g)','gordon');
 const simple=symbolsForFormula('P₀ = D / Re','gordon');
 assert.match(wacc.find(x=>x.symbol==='D').meaning,/долг/);
 assert.match(wacc.find(x=>x.symbol==='T').meaning,/налог/);
 assert.match(simple.find(x=>x.symbol==='D').meaning,/дивиденд/);
 assert.match(gordon.find(x=>x.symbol==='D₁').meaning,/дивиденд/);
 assert.ok(!gordon.some(x=>x.symbol==='T'));
 const social=symbolsForFormula('SDR ≈ ρ + η × g','ramsey');
 assert.match(social.find(x=>x.symbol==='g').meaning,/потреблен/);
 assert.ok(social.some(x=>x.symbol==='η'));
 const socialAlias=symbolsForFormula('SDR ≈ ρ + η × g','social-discount');
 assert.match(socialAlias.find(x=>x.symbol==='g').meaning,/потреблен/);
 assert.ok(socialAlias.some(x=>x.symbol==='ρ'));
 const preferred=symbolsForFormula('P = Постоянный дивиденд / Rp','preferred');
 assert.match(preferred.find(x=>x.symbol==='P').meaning,/привилегирован/);
 const covenant=symbolsForFormula('DSCR = CFADS / Платёж по долгу','dscr');
 assert.match(covenant.find(x=>x.symbol==='CFADS').meaning,/долга/);

 assert.match(symbolsForFormula('I = P × r × t','loan-interest').find(x=>x.symbol==='I').meaning,/процент/);
});

test('Components of shares and annuity factors are explained, not hidden',()=>{
 const wacc=symbolsForFormula('WACC = (E/V) × Re + (D/V) × Rd × (1 − T)','wacc');
 for(const x of ['E','V','D','T','E/V','D/V'])assert.ok(wacc.some(t=>t.symbol===x),x);
 const af=symbolsForFormula('EAC = PV затрат / AF(r,n)','eac');
 for(const x of ['AF(r,n)','r','n','PV'])assert.ok(af.some(t=>t.symbol===x),x);
});

test('Hint legend only explains variables present in the actual hint',()=>{
 const hint='PV = FV / (1+r)^n';
 const out=symbolsForHint(hint,{topic:'valuation',title:'Текущая стоимость'});
 assert.ok(['PV','FV','r','n'].every(x=>out.some(a=>a.symbol===x)));
 assert.ok(!out.some(a=>a.symbol==='T'));
 const plain=symbolsForHint('Разделите доходы от продаж и поступления денег.',{topic:'pl'});
 assert.equal(plain.length,0);
 const loan=symbolsForHint('I = P × r × t',{topic:'valuation',title:'Проценты по кредиту'});
 assert.match(loan.find(x=>x.symbol==='P').meaning,/основного долга/);
});

test('Legend rendering escapes content and does not expose untrusted HTML',()=>{
 const html=symbolLegendMarkup([{symbol:'<script>',meaning:'<b>unsafe</b>',unit:'руб.'}],escape);
 assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(html.includes('&lt;b&gt;unsafe&lt;/b&gt;'));
 const formula=formulaVariantsMarkup({id:'pv',formulas:GLOSSARY_FORMULAS.pv},escape);
 assert.match(formula,/Обозначения/);
 assert.match(formula,/Ставка|ставка/);
});

test('No legend on empty formula text',()=>{
 assert.deepEqual(symbolsForFormula('','pv'),[]);
 assert.equal(symbolLegendMarkup([],escape),'');
});

test('Iteration 2 distinguishes Ku and debt D in MM and tax shield formulas',()=>{
 const mm=symbolsForFormula('Re = Ku + (Ku − Rd) × D/E','capital-mm-ii');
 assert.match(mm.find(x=>x.symbol==='Ku').meaning,/безрычагов|активов/);
 const shield=symbolsForFormula('PV налогового щита = T × D','capital-debt-tax-benefit');
 assert.match(shield.find(x=>x.symbol==='D').meaning,/долг/);
});
