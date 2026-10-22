/** Render glossary's structured formula and synonym metadata. Pure and DOM-independent. */
export function formulaVariantsMarkup(entry, escape) {
  const variants=entry?.formulas||[];
  if(!variants.length)return '';
  return `<section class="glossary-formulas" aria-label="Формулы и варианты расчёта">
    <div class="glossary-formulas-head"><h3>Формулы и способы расчёта</h3><span>${variants.length} ${variants.length===1?'вариант':variants.length<5?'варианта':'вариантов'}</span></div>
    <div class="glossary-formula-grid">${variants.map((v,i)=>`<article class="glossary-formula-card">
      <div class="glossary-formula-title"><span class="glossary-formula-index">${String(i+1).padStart(2,'0')}</span><strong>${escape(v.title)}</strong></div>
      <div class="glossary-formula-equation" aria-label="Формула: ${escape(v.expression)}">${escape(v.expression)}</div>
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