import {SEMINARS, PARADOXES} from '../data/paradoxes.js';
import {MIN_ANSWER_LENGTH, promptFor, filterParadoxes, normalizeRecord, canMarkReviewed, countReviewed} from '../engine/paradoxes.js';

const STORAGE_KEY='finpraktika.paradoxes.v1';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(){
 try{
  const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY));
  return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
 }catch{return {};}
}
const records=load();
const state={seminar:'all',query:'',selected:null,showAnswer:false};
if(typeof location!=='undefined'){
 const id=new URLSearchParams(location.search).get('paradox');
 if(PARADOXES.some(p=>p.id===id))state.selected=id;
}
let saveTimer=null, dirty=false;
function flush(){
 if(saveTimer!==null){clearTimeout(saveTimer);saveTimer=null;}
 if(!dirty)return;
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(records));dirty=false;}catch{/* Browser storage can be blocked. */}
}
function scheduleSave(){
 dirty=true;
 if(saveTimer!==null)clearTimeout(saveTimer);
 saveTimer=setTimeout(flush,350);
}
if(typeof window!=='undefined')window.addEventListener('pagehide',flush);
function record(id){return normalizeRecord(records[id]);}
function update(id,change,immediate=false){
 records[id]={...record(id),...change};
 scheduleSave();
 if(immediate)flush();
}
function syncSelection(){
 if(typeof history==='undefined'||typeof location==='undefined')return;
 const url=new URL(location.href);
 if(state.selected)url.searchParams.set('paradox',state.selected);
 else url.searchParams.delete('paradox');
 history.replaceState({},'',url);
}
function progress(){const done=countReviewed(records);
 return `<div class="paradox-summary" aria-label="Прогресс разбора"><strong>${done} из ${PARADOXES.length}</strong><span>разобрано самостоятельно</span><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${PARADOXES.length}" aria-valuenow="${done}" aria-label="Изученные парадоксы"><span style="width:${Math.round(done/PARADOXES.length*100)}%"></span></div></div>`;
}
function toolbar(){return `<section class="paradox-toolbar" aria-label="Фильтры парадоксов">
 <label for="paradox-seminar">СЕМИНАР <select id="paradox-seminar">
 <option value="all">Все семинары · 30</option>
 ${SEMINARS.map(s=>`<option value="${s.id}" ${String(s.id)===state.seminar?'selected':''}>Семинар ${s.id} · ${escape(s.title)}</option>`).join('')}
 </select></label>
 <label for="paradox-search">ПОИСК <input id="paradox-search" type="search" autocomplete="off" placeholder="Тема, формула или понятие" value="${escape(state.query)}"></label>
 </section>`;
}
function rows(){
 const visible=filterParadoxes(state.seminar,state.query);
 if(!visible.length)return '<p class="empty-state">По запросу парадоксов нет. Измени фильтр или поисковую фразу.</p>';
 return SEMINARS.map(s=>{
  const matching=visible.filter(p=>p.seminar===s.id);
  if(!matching.length)return '';
  return `<section class="paradox-group" aria-label="Семинар ${s.id}">
   <div class="paradox-group-heading"><div><span class="eyebrow">СЕМИНАР ${s.id}</span><h2>${escape(s.title)}</h2></div><span>${countReviewed(records,s.id)} / 10 разобрано</span></div>
   <div class="paradox-list">${matching.map(p=>{
    const r=record(p.id);
    const status=r.status==='done'?'Разобран':r.draft.trim()?'Черновик':'Открыть';
    return `<button type="button" class="paradox-row" data-paradox="${p.id}">
      <span class="paradox-number">${p.seminar}.${String(p.number).padStart(2,'0')}</span>
      <span class="paradox-row-text"><strong>${escape(p.title)}</strong><small>${escape(promptFor(p).slice(0,115))}${promptFor(p).length>115?'…':''}</small></span>
      <span class="paradox-state ${r.status==='done'?'paradox-done-state':''}">${status} →</span>
     </button>`;
   }).join('')}</div></section>`;
 }).join('');
}
function list(){
 return `${progress()}${toolbar()}<div id="paradox-list-results" aria-label="Парадоксы по семинарам">${rows()}</div>`;
}
function detail(p){
 const r=record(p.id);
 const siblings=PARADOXES.filter(x=>x.seminar===p.seminar);
 const index=siblings.findIndex(x=>x.id===p.id);
 const completed=r.status==='done'&&canMarkReviewed(p,r);
 return `<button type="button" id="paradox-back" class="button ghost">← Все парадоксы</button>
 <article class="paradox-detail">
 <div class="eyebrow">СЕМИНАР ${p.seminar} · ПАРАДОКС ${p.number} ИЗ 10</div>
 <h2>${escape(p.title)}</h2>
 <div class="paradox-question"><h3>Вопрос семинара</h3><p>${escape(promptFor(p))}</p></div>
 <label class="paradox-label" for="paradox-draft">ТВОЙ РАЗВЁРНУТЫЙ ОТВЕТ</label>
 <p class="paradox-help">Сформулируй вывод, обоснуй причинно-следственные связи, проверь ограничения. Ответ сохраняется в этом браузере.</p>
 <textarea id="paradox-draft" rows="7" spellcheck="true" placeholder="Тезис → аргументы → пример → исключения → вывод…">${escape(r.draft)}</textarea>
 <div class="paradox-answer-meta" aria-live="polite"><span id="paradox-length">${r.draft.trim().length} / ${MIN_ANSWER_LENGTH} символов для завершения</span><span id="paradox-save-indicator">Черновик хранится локально</span></div>
 <div class="paradox-actions"><button type="button" id="paradox-save" class="button secondary">Сохранить ответ</button><button type="button" id="paradox-reveal" class="button primary" aria-expanded="${state.showAnswer}">${state.showAnswer?'Скрыть разбор':'Посмотреть разбор'}</button></div>
 ${state.showAnswer?`<section class="paradox-answer" aria-label="Разбор"><h3>Развёрнутый разбор</h3>
 <p class="paradox-thesis"><strong>Вывод.</strong> ${escape(p.thesis)}</p><p>${escape(p.analysis)}</p>
 <h3>Где ошибается интуиция</h3><p>${escape(p.trap)}</p></section>
 <section class="paradox-check" aria-label="Самопроверка логики">
 <h3>Проверь логику своего решения</h3>
 <p>Сопоставь свой текст с эталонным разбором. Эта проверка выполняется тобой, а не алгоритмом оценки смысла.</p>
 ${p.checks.map((check,i)=>`<label class="paradox-check-row"><input type="checkbox" data-check="${i}" ${r.checks.includes(i)?'checked':''}><span>${escape(check)}</span></label>`).join('')}
 <p class="paradox-check-result" id="paradox-check-result" aria-live="polite">${r.checks.length} из ${p.checks.length} логических критериев</p>
 <div class="paradox-actions"><button type="button" id="paradox-done" class="button primary" ${canMarkReviewed(p,r)?'':'disabled'}>${completed?'✓ Разобран':'Отметить как разобранный'}</button>
 <button type="button" id="paradox-revise" class="button secondary">На повторение</button></div>
 <p class="paradox-help">Для отметки нужен собственный ответ от ${MIN_ANSWER_LENGTH} символов и все три подтверждённых критерия.</p></section>`:''}
 <div class="paradox-source">Источник: ${escape(SEMINARS[p.seminar-1].source)} · семинар ${p.seminar}, вопрос ${p.number}. Формулировка вопроса сохранена из исходного материала.</div>
 <nav class="paradox-pagination" aria-label="Переходы между парадоксами">
 <button type="button" class="button ghost" data-neighbor="${index>0?siblings[index-1].id:''}" ${index===0?'disabled':''}>← Предыдущий</button>
 <button type="button" class="button secondary" data-neighbor="${index<siblings.length-1?siblings[index+1].id:''}" ${index===siblings.length-1?'disabled':''}>Следующий →</button></nav>
 </article>`;
}
export function renderParadoxes(root,intro){
 if(!root)return;
 const selected=PARADOXES.find(x=>x.id===state.selected);
 root.innerHTML=`${intro('04 / ПАРАДОКСЫ','Парадоксы','30 семинарских вопросов: сначала своё решение, затем аргументированный разбор и самопроверка.','04')}${selected?detail(selected):list()}`;
 if(!selected){
  const results=root.querySelector('#paradox-list-results');
  root.querySelector('#paradox-seminar').addEventListener('change',e=>{state.seminar=e.target.value;results.innerHTML=rows();});
  root.querySelector('#paradox-search').addEventListener('input',e=>{state.query=e.target.value;results.innerHTML=rows();});
  results.addEventListener('click',e=>{const btn=e.target.closest('[data-paradox]');if(!btn)return;state.selected=btn.dataset.paradox;state.showAnswer=false;syncSelection();renderParadoxes(root,intro);root.querySelector('#paradox-back')?.focus({preventScroll:true});});
  return;
 }
 const answer=root.querySelector('#paradox-draft');
 const length=root.querySelector('#paradox-length'),indicator=root.querySelector('#paradox-save-indicator');
 const checkButton=()=>{const b=root.querySelector('#paradox-done');if(b)b.disabled=!canMarkReviewed(selected,record(selected.id));};
 const open=id=>{flush();state.selected=id;state.showAnswer=false;syncSelection();renderParadoxes(root,intro);root.querySelector('#paradox-back')?.focus({preventScroll:true});};
 answer.addEventListener('input',()=>{
  const previous=record(selected.id);
  if(previous.draft===answer.value)return;
  const change={draft:answer.value,status:'review',checks:[]};
  update(selected.id,change);
  root.querySelectorAll('[data-check]').forEach(c=>c.checked=false);
  const result=root.querySelector('#paradox-check-result');if(result)result.textContent=`0 из ${selected.checks.length} логических критериев`;
  length.textContent=`${answer.value.trim().length} / ${MIN_ANSWER_LENGTH} символов для завершения`;
  indicator.textContent='Сохранение…';
  checkButton();
 });
 answer.addEventListener('blur',()=>{flush();indicator.textContent='Ответ сохранён в браузере';});
 root.querySelector('#paradox-save').addEventListener('click',()=>{flush();indicator.textContent='Ответ сохранён в браузере';});
 root.querySelector('#paradox-reveal').addEventListener('click',()=>{flush();state.showAnswer=!state.showAnswer;renderParadoxes(root,intro);root.querySelector('#paradox-reveal')?.focus({preventScroll:true});});
 root.querySelector('#paradox-back').addEventListener('click',()=>open(null));
 root.querySelectorAll('[data-neighbor]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.neighbor)open(b.dataset.neighbor);}));
 if(state.showAnswer){
  root.querySelectorAll('[data-check]').forEach(b=>b.addEventListener('change',()=>{
   const checks=[...root.querySelectorAll('[data-check]:checked')].map(x=>Number(x.dataset.check));
   update(selected.id,{checks,status:'review'},true);
   root.querySelector('#paradox-check-result').textContent=`${checks.length} из ${selected.checks.length} логических критериев`;
   const done=root.querySelector('#paradox-done');done.textContent='Отметить как разобранный';checkButton();
  }));
  root.querySelector('#paradox-done').addEventListener('click',()=>{
   if(!canMarkReviewed(selected,record(selected.id)))return;
   update(selected.id,{status:'done'},true);
   root.querySelector('#paradox-done').textContent='✓ Разобран';
  });
  root.querySelector('#paradox-revise').addEventListener('click',()=>{
   update(selected.id,{status:'review'},true);
   root.querySelector('#paradox-done').textContent='Отметить как разобранный';
  });
 }
}

/** Leave the detail view and flush pending drafts when changing app sections. */
export function resetParadoxesView(){flush();state.selected=null;state.showAnswer=false;}
