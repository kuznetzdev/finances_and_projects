import { formulaMarkup } from './math-ui.js';
import { symbolsForFormula } from '../data/formula-notation.js';
import {calculatePnlExample,PNL_EXAMPLE_CONCEPTS} from '../data/pnl-example.js';
/** Render glossary's structured formula and synonym metadata. Pure and DOM-independent. */
export function formulaVariantsMarkup(entry, escape) {
  const variants=entry?.formulas||[];
  if(!variants.length)return '';
  return `<section class="glossary-formulas" aria-label="Формулы и варианты расчёта">
    <div class="glossary-formulas-head"><h3>Формулы и способы расчёта</h3><span>${variants.length} ${variants.length===1?'вариант':variants.length<5?'варианта':'вариантов'}</span></div>
    <div class="glossary-formula-grid">${variants.map((v,i)=>`<article class="glossary-formula-card">
      <div class="glossary-formula-title"><span class="glossary-formula-index">${String(i+1).padStart(2,'0')}</span><strong>${escape(v.title)}</strong></div>
      <div class="glossary-formula-equation">${formulaMarkup(v.expression,escape)}</div>
      ${symbolLegendMarkup(symbolsForFormula(v.expression,entry.id),escape)}
      <p class="glossary-formula-why">${escape(v.explanation)}</p>
      ${v.assumptions?`<p class="glossary-formula-note"><strong>Когда применять:</strong> ${escape(v.assumptions)}</p>`:''}
    </article>`).join('')}</div>
  </section>`;
}
export function glossaryMetaMarkup(entry,escape) {
  if(!entry)return '';
  return `${entry.aliases?.length?`<p class="glossary-synonyms"><strong>Другие названия:</strong> ${escape(entry.aliases.join(' · '))}</p>`:''}${entry.note?`<div class="glossary-note"><strong>Обратите внимание:</strong> ${escape(entry.note)}</div>`:''}`;
}
/** A single consistent teaching example for the connected P&L terms, not seven isolated stories. */
export function pnlWorkedExampleMarkup(entry,escape){
 if(!PNL_EXAMPLE_CONCEPTS.includes(entry?.id))return '';
 const p=calculatePnlExample();
 const fmt=x=>x<0?'−'+Math.abs(x).toLocaleString('ru-RU'):Number(x).toLocaleString('ru-RU');
 const rows=[
  ['revenue','Выручка',p.revenue],
  ['cogs','Себестоимость продаж (включая амортизацию 70)',-p.cogs],
  ['gross','Валовая прибыль',p.gross],
  ['selling','Коммерческие и управленческие расходы (включая амортизацию 30)',-p.sellingAndAdministrative],
  ['ebit','EBIT',p.ebit],
  ['interest','Проценты к уплате',-p.interest],
  ['ebt','Прибыль до налога',p.profitBeforeTax],
  ['tax','Налог на прибыль (20% в примере)',-p.profitTax],
  ['netprofit','Чистая прибыль',p.netprofit]
 ];
 const active=entry.id;
 return `<section class="glossary-pnl-example" aria-label="Сквозной пример отчёта о финансовых результатах">
  <h3>На одних цифрах: от выручки до EBITDA</h3>
  <p>Суммы в млн ₽. В себестоимость продаж уже входит 70 амортизации производственных активов. В коммерческие и управленческие расходы входит ещё 30. Обе суммы уже уменьшили EBIT.</p>
  <div class="glossary-pnl-table-scroll"><table class="glossary-pnl-table">
   <thead><tr><th scope="col">Статья ОФР</th><th scope="col">млн ₽</th></tr></thead>
   <tbody>${rows.map(([id,label,value])=>`<tr class="${id===active?'is-highlighted':''} ${['gross','ebit','netprofit'].includes(id)?'is-result':''}" data-pnl-step="${id}"><th scope="row">${escape(label)}</th><td>${fmt(value)}</td></tr>`).join('')}</tbody>
  </table></div>
  <div class="glossary-pnl-bridge ${active==='ebitda'||active==='depreciation'?'is-highlighted':''}">
    <strong>Вся амортизация в EBIT: 70 + 30 = ${fmt(p.depreciationTotal)} млн ₽.</strong>
    <span>EBITDA = EBIT + вся учтённая амортизация = ${fmt(p.ebit)} + ${fmt(p.depreciationTotal)} = <strong>${fmt(p.ebitda)} млн ₽</strong>.</span>
    <span>Валовая маржа: ${fmt(p.grossMargin)}%; маржа EBITDA: ${fmt(p.ebitdaMargin)}%; чистая рентабельность продаж: ${fmt(p.netMargin)}%.</span>
  </div>
  <p class="glossary-pnl-warning"><strong>Важно:</strong> амортизацию нельзя вычитать из валовой прибыли ещё раз: производственная часть уже сидит в себестоимости. При переходе от EBIT к EBITDA всю ранее вычтенную амортизацию добавляют обратно. Налог 20% приведён только как допущение учебного примера, а не как текущая общая ставка для РФ.</p>
 </section>`;
}
export function glossaryCardMarkup(entry,escape){
  return `<button type="button" class="term-item" data-term="${escape(entry.id)}" aria-label="Открыть термин ${escape(entry.term)}">
    <span class="term-card-top"><small>${escape(entry.group)}</small>${entry.formulas?.length?`<span class="term-formula-pill">${entry.formulas.length} ${entry.formulas.length===1?'формула':entry.formulas.length<5?'формулы':'формул'}</span>`:''}</span>
    <h3>${escape(entry.term)}</h3><p>${escape(entry.definition)}</p>
  </button>`;
}

/** One reusable notation panel for formula cards and hints. */
export function symbolLegendMarkup(symbols,escape){
  if(!Array.isArray(symbols)||!symbols.length)return '';
  const expanded=symbols.length<=4 ? ' open' : '';
  return `<details class="formula-legend"${expanded}>
    <summary><span>Обозначения (${symbols.length})</span><svg class="ui-icon legend-chevron" aria-hidden="true" focusable="false"><use href="#icon-chevron"></use></svg></summary>
    <dl class="formula-legend-items">${symbols.map(x=>`<div class="formula-legend-pair">
      <dt>${escape(x.symbol)}</dt>
      <dd>${escape(x.meaning)}${x.unit?`<span class="formula-legend-unit">Единицы: ${escape(x.unit)}</span>`:''}</dd>
    </div>`).join('')}</dl>
  </details>`;
}