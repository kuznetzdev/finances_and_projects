import { formulaMarkup } from './math-ui.js';
import { symbolsForFormula } from '../data/formula-notation.js';
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