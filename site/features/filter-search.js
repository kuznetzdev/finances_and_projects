/** Fast, accent-tolerant matches for the section/topic search comboboxes. */
export const normalizeSearch=value=>String(value??'').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const acronyms={reporting:'баланс прибыль отчетность офр оддс финансовый анализ',capital:'кредит облигации долг capm бета стоимость капитала',value:'оценка dcf fcff fcfe wacc npv irr мультипликатор инвестиции',deals:'рычаг wacc mm структура капитала pecking order сделки',forecast:'прогноз модель финансовое моделирование',taxes:'налог амортизация прибыль убытки',pl:'прибыль выручка расходы ebitda',cash:'потоки cash flow оддс',balance:'активы пассивы баланс',links:'три формы отчетности',valuation:'dcf wacc npv irr fcfe fcff оценка инвестиции',tax:'налоги щит амортизация',ratios:'коэффициент рентабельность ликвидность roe roa',model:'финансовая модель прогноз'};
export function searchFilterOptions(options,term,minChars=3){
 const needle=normalizeSearch(term);if([...needle].length<minChars)return [];
 const words=needle.split(' ').filter(Boolean);
 return options.map(item=>{
  const name=normalizeSearch([item.name,item.short,item.id,...(item.keywords||[]),acronyms[item.id]||''].join(' '));
  if(!words.every(word=>name.includes(word)))return null;
  const title=normalizeSearch(item.name);
  const score=(title.startsWith(needle)?0:title.includes(needle)?1:2);
  return {...item,score};
 }).filter(Boolean).sort((a,b)=>a.score-b.score||a.name.localeCompare(b.name,'ru'));
}
/** All DOM handlers are local to the field, no requests or third-party libraries. */
export function bindFilterSearch({input,results,options,onPick,minChars=3,escape}){
 if(!input||!results||!Array.isArray(options)||typeof onPick!=='function')throw new TypeError('Invalid searchable filter');
 let matches=[],active=-1;
 const close=()=>{results.hidden=true;results.innerHTML='';input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;};
 const highlight=()=>{
  results.querySelectorAll('[data-option-id]').forEach((button,i)=>{
   const selected=i===active;button.classList.toggle('active',selected);button.setAttribute('aria-selected',String(selected));
  });
  if(active<0)input.removeAttribute('aria-activedescendant');
  else input.setAttribute('aria-activedescendant',results.id+'-option-'+active);
 };
 const update=()=>{
  const term=input.value.trim();
  matches=searchFilterOptions(options,term,minChars);active=-1;
  if([...normalizeSearch(term)].length<minChars){close();return;}
  results.hidden=false;input.setAttribute('aria-expanded','true');
  results.innerHTML=matches.length?matches.map((x,i)=>'<button type="button" role="option" id="'+results.id+'-option-'+i+'" data-option-id="'+escape(x.id)+'" aria-selected="false"><span>'+escape(x.name)+'</span></button>').join(''):'<p class="filter-empty">Совпадений нет. Попробуйте другое слово.</p>';
 };
 const choose=(index)=>{
  const item=matches[index];if(!item)return;
  input.value='';close();onPick(item.id);
 };
 input.addEventListener('input',update);
 input.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'){close();return;}
  if(!matches.length||results.hidden)return;
  if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){ev.preventDefault();active=(active+(ev.key==='ArrowDown'?1:-1)+matches.length)%matches.length;highlight();}
  else if(ev.key==='Enter'&&active>=0){ev.preventDefault();choose(active);}
 });
 results.addEventListener('click',ev=>{
  const button=ev.target.closest?.('[data-option-id]');
  if(!button)return;
  choose(matches.findIndex(x=>x.id===button.dataset.optionId));
 });
 input.addEventListener('blur',()=>{queueMicrotask(()=>{if(!results.contains(document.activeElement))close();});});
 return {update,close};
}
