/** Embedded, accessible searchable selection panels. No native select menus or remote search. */
import {ABBREVIATIONS} from '../data/abbreviations.js';

export const normalizeSearch=value=>String(value??'').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();

/** An acronym belongs to subjects that actually teach that formula or financial concept.
 * Separate area/topic mappings prevent e.g. CFF from appearing in unrelated DCF subjects. */
export const FINANCIAL_SEARCH_TERMS=[
 {term:'CAPM',areas:['capital'],topics:['valuation'],aliases:['бета','beta','безрисковая ставка','стоимость собственного капитала']},
 {term:'CFF',areas:['reporting'],topics:['cash','links'],aliases:['финансовая деятельность','денежный поток финансирования']},
 {term:'CFO',areas:['reporting'],topics:['cash','links'],aliases:['операционный денежный поток']},
 {term:'CFI',areas:['reporting'],topics:['cash','links'],aliases:['инвестиционный денежный поток']},
 {term:'CFS',areas:['reporting'],topics:['cash','links'],aliases:['оддс','отчет о движении денежных средств']},
 {term:'FCFF',areas:['value'],topics:['valuation'],aliases:['свободный поток фирмы','свободный поток компании']},
 {term:'FCFE',areas:['value'],topics:['valuation'],aliases:['свободный поток акционерам','поток собственникам']},
 {term:'DCF',areas:['value'],topics:['valuation'],aliases:['дисконтирование денежных потоков','оценка бизнеса']},
 {term:'WACC',areas:['capital','deals','value'],topics:['valuation'],aliases:['средневзвешенная стоимость капитала','ставка дисконтирования']},
 {term:'NPV',areas:['value'],topics:['valuation'],aliases:['чистая приведенная стоимость']},
 {term:'IRR',areas:['value','deals'],topics:['valuation'],aliases:['внутренняя норма доходности']},
 {term:'YTM',areas:['capital'],topics:['valuation'],aliases:['доходность облигаций']},
 {term:'PV',areas:['capital'],topics:['valuation'],aliases:['приведенная стоимость']},
 {term:'FV',areas:['capital'],topics:['valuation'],aliases:['будущая стоимость']},
 {term:'ROE',areas:['reporting','deals'],topics:['ratios'],aliases:['рентабельность капитала']},
 {term:'ROA',areas:['reporting','deals'],topics:['ratios'],aliases:['рентабельность активов']},
 {term:'EBITDA',areas:['reporting','value'],topics:['pl','ratios','valuation'],aliases:['прибыль до процентов и амортизации']},
 {term:'NAV',areas:['value'],topics:['valuation'],aliases:['чистые активы']},
 {term:'LBO',areas:['deals'],topics:['valuation'],aliases:['выкуп с долговым финансированием']},
 {term:'NWC',areas:['reporting','forecast','value'],topics:['cash','ratios','model','valuation'],aliases:['оборотный капитал']},
 {term:'CAPEX',areas:['reporting','forecast','value'],topics:['cash','model','valuation'],aliases:['капитальные затраты']},
 {term:'DSCR',areas:['capital','deals'],topics:['ratios','valuation'],aliases:['покрытие обслуживания долга']},
 {term:'DSO',areas:['reporting'],topics:['ratios'],aliases:['оборачиваемость дебиторки']},
 {term:'DIO',areas:['reporting'],topics:['ratios'],aliases:['оборачиваемость запасов']},
 {term:'DPO',areas:['reporting'],topics:['ratios'],aliases:['оборачиваемость кредиторки']},
 {term:'TAX',areas:['taxes'],topics:['tax'],aliases:['налоговый щит','амортизация','временные разницы']},
 {term:'P&L',areas:['reporting'],topics:['pl','links'],aliases:['офр','отчет о прибылях и убытках']}
];
const aliasText=x=>[x.term,...(ABBREVIATIONS[x.term]?.slice(0,2)||[]),...(x.aliases||[])].join(' ');

/** Search index is derived from real generator metadata plus curated formula-to-syllabus links. */
export function buildFilterOptions(items,catalog,kind,{area='all',topic='all',level='all'}={}){
 const column=kind==='area'?'area':'topic';
 const maxLevel=level==='all'?4:Number(level);
 return items.map(item=>{
  const allTemplates=catalog.filter(t=>t[column]===item.id);
  const matched=catalog.filter(t=>(item.id==='all'||t[column]===item.id)&&(area==='all'||t.area===area||column==='area')&&(topic==='all'||t.topic===topic||column==='topic')&&t.min<=maxLevel);
  const terms=FINANCIAL_SEARCH_TERMS.filter(t=>t[kind==='area'?'areas':'topics'].includes(item.id));
  const aliases=terms.map(aliasText);
  const keywords=[...allTemplates.flatMap(t=>[t.skill,t.id]),...aliases];
  return {...item,keywords,examples:terms.slice(0,5).map(t=>t.term),count:matched.length,allCount:allTemplates.length};
 });
}

/** For zero, one or two entered characters, show the whole original list in its syllabus order. */
export function searchFilterOptions(options,term,minChars=3){
 const needle=normalizeSearch(term);
 if([...needle.replace(/\s/g,'')].length<minChars)return [...options];
 const words=needle.split(' ').filter(Boolean);
 return options.map((item,index)=>{
  const title=normalizeSearch(item.name);
  const short=normalizeSearch(item.short||'');
  const terms=(item.examples||[]).map(normalizeSearch);
  const corpus=normalizeSearch([item.name,item.short,item.id,...(item.keywords||[])].join(' '));
  const tokens=corpus.split(' ');
  const matches=words.every(word=>tokens.some(token=>token.startsWith(word))||corpus.includes(word));
  if(!matches)return null;
  const rank=title===needle?0:short===needle?1:terms.some(t=>t===needle)?2:title.startsWith(needle)?3:title.includes(needle)?4:5;
  return {...item,rank,originalIndex:index};
 }).filter(Boolean).sort((a,b)=>a.rank-b.rank||a.originalIndex-b.originalIndex);
}

/** Use actual buttons (scrollable inside the page), not <select> that invokes the OS picker.
 * Return a disposer so document listeners do not pile up on repeated exercise renders.
 */
export function bindFilterSearch({root,trigger,panel,input,list,options,onPick,escape,minChars=3}){
 if(!root||!trigger||!panel||!input||!list||!Array.isArray(options)||typeof onPick!=='function')throw new TypeError('Invalid embedded filter');
 let matches=[],active=-1,isOpen=false;
 const setActive=index=>{
  active=index;
  list.querySelectorAll('[data-option-id]').forEach((el,i)=>{
   el.classList.toggle('active',i===active);
   el.setAttribute('aria-selected',String(i===active||el.dataset.optionId===root.dataset.selected));
  });
  const selected=list.querySelectorAll('[data-option-id]')[active];
  if(selected){
   input.setAttribute('aria-activedescendant',selected.id);
   selected.scrollIntoView({block:'nearest'});
  }else input.removeAttribute('aria-activedescendant');
 };
 const draw=()=>{
  matches=searchFilterOptions(options,input.value,minChars);
  active=-1;input.removeAttribute('aria-activedescendant');
  const query=normalizeSearch(input.value);
  const filtered=[...query.replace(/\s/g,'')].length>=minChars;
  const count=matches.length;
  const status=panel.querySelector('[data-filter-status]');
  if(status)status.textContent=filtered?(count?count+' найдено':'Ничего не найдено'):'Все варианты · '+count;
  list.innerHTML=matches.length?matches.map((entry,i)=>{
   const title=escape(entry.name),examples=entry.examples?.length?entry.examples.join(' · '):'';
   const subtitle=(entry.id==='all'?'Вся программа':entry.count+' типов задач')+(examples?' · '+examples:'');
   return '<button type="button" role="option" id="'+list.id+'-item-'+i+'" data-option-id="'+escape(entry.id)+'" aria-selected="'+String(root.dataset.selected===entry.id)+'"><span class="filter-result-text">'+title+'</span><span class="filter-result-meta">'+escape(subtitle)+'</span></button>';
  }).join(''):'<p class="filter-empty" role="status">Совпадений нет. Попробуйте сокращение или другое название.</p>';
 };
 const close=(restoreFocus=false)=>{
  if(!isOpen)return;
  isOpen=false;panel.hidden=true;root.classList.remove('is-open');
  trigger.setAttribute('aria-expanded','false');input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');
  if(restoreFocus)trigger.focus({preventScroll:true});
 };
 const open=()=>{
  if(isOpen)return;
  document.dispatchEvent(new CustomEvent('practice-filter-open',{detail:{root}}));
  isOpen=true;panel.hidden=false;root.classList.add('is-open');
  trigger.setAttribute('aria-expanded','true');input.setAttribute('aria-expanded','true');
  input.value='';draw();input.focus({preventScroll:true});
 };
 const pick=index=>{
  const entry=matches[index];if(!entry)return;
  root.dataset.selected=entry.id;
  close();onPick(entry.id);
 };
 const onInput=()=>{draw();};
 const onTrigger=()=>{isOpen?close(true):open();};
 const onKeyDown=event=>{
  if(event.key==='Escape'){event.preventDefault();close(true);return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();
   if(matches.length)setActive(active<0?(event.key==='ArrowDown'?0:matches.length-1):(active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length);
  }else if(event.key==='Enter'){
   event.preventDefault();pick(active<0?0:active);
  }
 };
 const onClick=event=>{
  const el=event.target.closest?.('[data-option-id]');
  if(el&&list.contains(el))pick(matches.findIndex(x=>x.id===el.dataset.optionId));
 };
 const outside=event=>{if(isOpen&&!root.contains(event.target))close();};
 const onOtherOpen=event=>{if(event.detail?.root!==root)close();};
 const onFocusOut=event=>{
  if(!isOpen)return;
  if(!root.contains(event.relatedTarget))close();
 };
 trigger.addEventListener('click',onTrigger);
 trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='Enter'||event.key===' '){event.preventDefault();open();}});
 input.addEventListener('input',onInput);
 input.addEventListener('keydown',onKeyDown);
 list.addEventListener('click',onClick);
 root.addEventListener('focusout',onFocusOut);
 document.addEventListener('pointerdown',outside,true);
 document.addEventListener('practice-filter-open',onOtherOpen);
 return {open,close,dispose(){
  close();
  document.removeEventListener('pointerdown',outside,true);
  document.removeEventListener('practice-filter-open',onOtherOpen);
 }};
}
