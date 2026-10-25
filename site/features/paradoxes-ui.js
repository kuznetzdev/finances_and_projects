import { SEMINARS, PARADOXES } from '../data/paradoxes.js';

const KEY='finpraktika.paradoxes.v1';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x&&typeof x==='object'?x:{};}catch{return {};}}
function save(data){try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}}
const state={seminar:'all',query:'',selected:null,showAnswer:false,showChecklist:false};
const records=load();
const key=id=>records[id]&&typeof records[id]==='object'?records[id]:{};
function setRecord(id,change){records[id]={...key(id),...change};save(records);}
const count=(s,kind)=>PARADOXES.filter(p=>(s==='all'||p.seminar===Number(s))&&(kind==='done'?key(p.id).status==='done':!!key(p.id).draft?.trim())).length;
function toolbar(){return `<section class="paradox-toolbar"><label>СЕМИНАР <select id="paradox-seminar"><option value="all">Все семинары · 30</option>${SEMINARS.map(s=>`<option value="${s.id}" ${String(s.id)===state.seminar?'selected':''}>Семинар ${s.id} · ${escape(s.title)}</option>`).join('')}</select></label><label>ПОИСК <input id="paradox-search" type="search" placeholder="Название или понятие…" value="${escape(state.query)}"></label></section>`;}
function list(){const arr=PARADOXES.filter(p=>(state.seminar==='all'||p.seminar===Number(state.seminar))&&(`${p.title} ${p.question} ${p.analysis}`.toLowerCase().includes(state.query.trim().toLowerCase())));
return `<div class="paradox-summary"><strong>${count('all','done')} из 30</strong><span>Парадоксов разобрано</span><div class="progress-track"><span style="width:${Math.round(count('all','done')/30*100)}%"></span></div></div>${toolbar()}<section class="paradox-list" aria-label="Список парадоксов">${arr.map(p=>`<button type="button" class="paradox-row" data-paradox="${p.id}"><span class="paradox-number">${p.seminar}.${String(p.number).padStart(2,'0')}</span><span class="paradox-row-text"><strong>${escape(p.title)}</strong><small>Семинар ${p.seminar} · ${escape(SEMINARS[p.seminar-1].title)}</small></span><span class="paradox-state">${key(p.id).status==='done'?'Разобран':key(p.id).draft?.trim()?'Черновик':'Открыть →'}</span></button>`).join('')}</section>${arr.length?'':'<div class="empty-state">По запросу ничего не найдено.</div>'}`;}
function detail(p){const r=key(p.id);return `<button type="button" id="paradox-back" class="button ghost">← К списку</button>
<article class="paradox-detail">
 <div class="eyebrow">СЕМИНАР ${p.seminar} · ПАРАДОКС ${p.number} ИЗ 10</div><h2>${escape(p.title)}</h2>
 <div class="paradox-question"><h3>Условие и вопрос</h3><p>${escape(p.question)}</p></div>
 <label class="paradox-label" for="paradox-draft">Твой развёрнутый ответ</label>
 <p class="paradox-help">Объясни причинно-следственные связи, проверь исключения и, где требуется, приведи числовой пример. Это самопроверка, а не автоматическое оценивание текста.</p>
 <textarea id="paradox-draft" rows="7" placeholder="Тезис → аргументы → пример → ограничения → вывод…">${escape(r.draft||'')}</textarea>
 <div class="paradox-actions"><button type="button" id="paradox-save" class="button secondary">Сохранить черновик</button><button type="button" id="paradox-reveal" class="button primary">${state.showAnswer?'Скрыть разбор':'Открыть эталонный разбор'}</button></div>
 ${state.showAnswer?`<div class="paradox-answer"><h3>Развёрнутый разбор</h3><p class="paradox-thesis"><strong>Ключевой вывод.</strong> ${escape(p.thesis)}</p><p>${escape(p.analysis)}</p><h3>Типичная ошибка рассуждения</h3><p>${escape(p.trap)}</p></div><div class="paradox-check"><h3>Проверка логики решения</h3><p>Отметь только те пункты, которые действительно обоснованы в твоём ответе.</p>${p.checks.map((c,i)=>`<label class="paradox-check-row"><input type="checkbox" data-check="${i}" ${r.checks?.includes(i)?'checked':''}><span>${escape(c)}</span></label>`).join('')}<p class="paradox-check-result" id="paradox-check-result">${(r.checks||[]).length} из ${p.checks.length} логических критериев</p><div class="paradox-actions"><button type="button" id="paradox-done" class="button primary" ${(r.checks||[]).length!==p.checks.length?'disabled':''}>Отметить как разобранный</button><button type="button" id="paradox-revise" class="button secondary">Вернуть на изучение</button></div></div>`:''}
 <div class="paradox-source">Источник: ${escape(SEMINARS[p.seminar-1].source)} · семинар ${p.seminar}, вопрос ${p.number}.</div></article>`;}
export function renderParadoxes(root,intro){
 if(!root)return;
 const p=PARADOXES.find(x=>x.id===state.selected);
 root.innerHTML=`${intro('06 / ПАРАДОКСЫ','Парадоксы','30 вопросов с развёрнутыми объяснениями и проверкой логики финансовых решений.','06')}${p?detail(p):list()}`;
 if(!p){
  root.querySelector('#paradox-seminar').onchange=e=>{state.seminar=e.target.value;renderParadoxes(root,intro);};
  root.querySelector('#paradox-search').oninput=e=>{const pos=e.target.selectionStart;state.query=e.target.value;renderParadoxes(root,intro);const input=root.querySelector('#paradox-search');input.focus();input.setSelectionRange(pos,pos);};
  root.querySelectorAll('[data-paradox]').forEach(b=>b.onclick=()=>{state.selected=b.dataset.paradox;state.showAnswer=false;renderParadoxes(root,intro);root.querySelector('.paradox-detail')?.scrollIntoView({block:'start'});});
  return;
 }
 const draft=root.querySelector('#paradox-draft');
 const persist=()=>setRecord(p.id,{draft:draft.value});
 draft.addEventListener('input',persist);
 root.querySelector('#paradox-back').onclick=()=>{persist();state.selected=null;state.showAnswer=false;renderParadoxes(root,intro);};
 root.querySelector('#paradox-save').onclick=()=>{persist();root.querySelector('#paradox-save').textContent='Черновик сохранён ✓';};
 root.querySelector('#paradox-reveal').onclick=()=>{persist();state.showAnswer=!state.showAnswer;renderParadoxes(root,intro);};
 if(state.showAnswer){
  root.querySelectorAll('[data-check]').forEach(b=>b.onchange=()=>{const checks=[...root.querySelectorAll('[data-check]:checked')].map(x=>Number(x.dataset.check));setRecord(p.id,{checks,status:checks.length===p.checks.length?key(p.id).status:'review'});root.querySelector('#paradox-check-result').textContent=`${checks.length} из ${p.checks.length} логических критериев`;root.querySelector('#paradox-done').disabled=checks.length!==p.checks.length;});
  root.querySelector('#paradox-done').onclick=()=>{persist();const checks=key(p.id).checks||[];if(checks.length!==p.checks.length)return;setRecord(p.id,{status:'done'});root.querySelector('#paradox-done').textContent='Разобран ✓';};
  root.querySelector('#paradox-revise').onclick=()=>{setRecord(p.id,{status:'review'});root.querySelector('#paradox-done').textContent='Отметить как разобранный';};
 }
}
