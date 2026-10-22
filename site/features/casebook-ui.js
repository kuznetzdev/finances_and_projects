import {CASE_BANK, CASE_CHECKPOINTS, CASE_GROUPS, availableCases, nextCase, recordRecent, verifyCheckpoint, CASE_BY_ID} from '../engine/casebook.js';
import {recordSkip} from '../engine/attempts.js';

const state={group:'Все направления',id:null,index:0,showReference:false,search:'',checked:false};
let deps;
const safe=()=>deps.stats.caseDrafts ??= {};
const draft=()=>safe()[state.id] ??= {answers:{}, checked:{}, notes:{}, reviewed:{}};
const filters=()=>`<section class="case-toolbar" aria-label="Поиск по банку"><div class="case-filter-row"><label class="case-filter"><span>Раздел</span><select id="bank-group">${CASE_GROUPS.map(g=>`<option value="${deps.escape(g)}" ${g===state.group?'selected':''}>${deps.escape(g)}</option>`).join('')}</select></label><label class="case-filter"><span>Поиск по банку</span><input id="bank-search" type="search" value="${deps.escape(state.search)}" placeholder="Например: облигации, DCF, ликвидность" autocomplete="off"></label><label class="case-filter"><span>Задача</span><select id="bank-select">${(availableCases(state.group,state.search).length?availableCases(state.group,state.search):availableCases(state.group)).map(c=>`<option value="${c.id}" ${c.id===state.id?'selected':''}>${c.id} · ${deps.escape(c.title)}</option>`).join('')}</select></label><button type="button" class="button primary" id="bank-random">Случайная задача ↻</button></div><p class="case-counter">57 разобранных задач из банка · ${Object.keys(deps.stats.caseCompleted??{}).length} изучено · решения с оговорками обозначены отдельно</p></section>`;
function selectCase(id,remember=true){
 if(!CASE_BY_ID.has(id))return;
 state.id=id;state.index=0;state.showReference=false;state.checked=false;
 if(remember){deps.stats.recentCases=recordRecent(deps.stats.recentCases??[],id,24);deps.save();}
 const url=new URL(location.href);url.searchParams.set('mode','bank');url.searchParams.set('case',id);history.replaceState({},'',url);
 render();
}
function render(){
 const item=CASE_BY_ID.get(state.id), checkpoints=CASE_CHECKPOINTS[item.id]??null;
 const d=draft(),count=checkpoints?.length??item.steps.length,idx=Math.min(state.index,count-1);
 state.index=idx;
 const numerical=!!checkpoints, step=checkpoints?.[idx];
 let activity='';
 if(numerical){
  const current=d.answers[idx]??'', feedback=d.checked[idx];
  const label=deps.escape(step.label);
  activity=`<div class="case-step-heading"><span>ШАГ ${idx+1} / ${count}</span><h3>${label}</h3><p>Ответ в ${deps.escape(step.unit)}. Дробные числа можно вводить через запятую или точку.</p></div><form id="bank-answer-form" class="case-answer-form"><label for="bank-answer">Ваш расчёт</label><div class="case-number-wrap"><input id="bank-answer" type="text" inputmode="decimal" autocomplete="off" value="${deps.escape(current)}" placeholder="Введите число"><span>${deps.escape(step.unit)}</span></div><div id="bank-feedback" class="case-feedback" aria-live="polite">${feedback===true?'<strong class="case-ok">Верно.</strong>':feedback===false?'<strong class="case-bad">Ответ пока не совпадает. Проверь единицы и промежуточные расчёты.</strong>':''}</div><button class="button primary" type="submit">Проверить шаг</button></form>`;
 }else{
  const content=d.notes[idx]??'',revealed=!!d.reviewed[idx];
  activity=`<div class="case-step-heading"><span>ЭТАП ${idx+1} / ${count}</span><h3>Разберите решение: часть ${idx+1}</h3><p>Запишите формулу, ход вычислений или объяснение своими словами. Эти этапы проверяются самостоятельно, потому что единственного машинно проверяемого ответа может не быть.</p></div><label class="case-note-label" for="bank-notes">Ваш ход решения</label><textarea id="bank-notes" class="case-notes" rows="5" placeholder="Что известно? Какую формулу примените? Какие допущения понадобятся?">${deps.escape(content)}</textarea><button type="button" class="button secondary" id="bank-compare">${revealed?'Скрыть эталон':'Сравнить с решением'}</button>${revealed?`<div class="case-reference-piece formatted-bank"><div class="case-piece-title">Разбор из банка задач</div>${item.steps[idx]}</div><div class="case-assessment" aria-label="Самооценка этапа"><button type="button" class="button secondary" id="bank-review">Нужно повторить</button><button type="button" class="button primary" id="bank-understood">Разобрался ✓</button></div>`:''}`;
 }
 const solved=numerical?Object.values(d.checked).filter(x=>x===true).length:Object.values(d.reviewed).filter(x=>x==='understood').length;
 const completed=deps.stats.caseCompleted?.[item.id];
 deps.root.innerHTML=`${deps.intro('01 / БАНК ЗАДАЧ','Разобранные задачи','Учебные условия сохранены. Сначала решите сами, затем проверьте результат по шагам.','01')}${deps.tabs()}${filters()}
 <section class="case-workspace"><article class="case-statement" tabindex="-1"><div class="case-label-row"><span class="case-code">${item.id}</span><span>${deps.escape(item.group)}</span>${completed?'<span class="case-success">Изучено ✓</span>':''}</div><h2>${deps.escape(item.title)}</h2><div class="case-topic">${deps.escape(item.topic.replace(/^\d+(?:[.\d–-]+)?\s*/,'').trim())}</div>${item.caveat?'<div class="case-caution"><strong>Важны допущения.</strong> Сверяйте не только число, но и условия применимости вывода.</div>':''}<div class="formatted-bank case-condition">${item.conditionHtml}</div><div class="case-footnote">Источник: ${deps.escape(item.source)}. Числа приведены как в исходном банке.</div></article>
 <section class="case-workpad" aria-label="Рабочая тетрадь"><div class="case-workpad-head"><div><span class="case-workpad-kicker">РАБОЧАЯ ТЕТРАДЬ</span><h2>${numerical?'Проверьте расчёт':'Сверьте ход решения'}</h2></div><strong>${solved}/${count}</strong></div><div class="case-segment-track" role="progressbar" aria-valuemin="0" aria-valuemax="${count}" aria-valuenow="${solved}"><span style="width:${solved/count*100}%"></span></div>${activity}
 <div class="case-step-nav case-action-dock" role="group" aria-label="Действия с задачей"><button class="button secondary" id="bank-prev" type="button" ${idx===0?'disabled':''}>← Назад</button><span>${idx+1} / ${count}</span><button class="button secondary" id="bank-next" type="button">${idx===count-1?'К началу':'Далее →'}</button><button class="button secondary case-skip" id="bank-skip" type="button">Пропустить задачу →</button></div>
 <button type="button" class="case-solution-toggle" id="bank-solution-toggle" aria-expanded="${state.showReference}">${state.showReference?'Скрыть полный разбор':'Показать полное решение'} <span>${state.showReference?'↑':'↓'}</span></button>${state.showReference?`<div class="case-full-solution formatted-bank"><h3>Полное решение из банка</h3>${item.solutionHtml}${item.answerHtml?`<div class="case-source-answer">${item.answerHtml}</div>`:''}</div>`:''}
 <div class="case-finish"><button type="button" class="button secondary" id="bank-repeat">Отложить на повторение</button><button type="button" class="button primary" id="bank-complete" ${solved===count?'':'disabled title="Сначала пройдите все этапы"'}>Отметить изученной ✓</button></div></section></section>`;
 $('#bank-group').onchange=ev=>{state.group=ev.target.value;state.search='';const choices=availableCases(state.group);selectCase(choices[0].id);};
 $('#bank-search').oninput=ev=>{state.search=ev.target.value;const matches=availableCases(state.group,state.search);$('#bank-select').innerHTML=matches.length?matches.map(c=>`<option value="${c.id}">${c.id} · ${deps.escape(c.title)}</option>`).join(''):'<option value="">Ничего не найдено</option>';};
 $('#bank-select').onchange=ev=>{state.search='';selectCase(ev.target.value);};
 $('#bank-random').onclick=()=>selectCase(nextCase(deps.stats.recentCases??[],state.group).id);
 $('#bank-prev').onclick=()=>{state.index=Math.max(0,state.index-1);render();};
 $('#bank-next').onclick=()=>{state.index=(state.index+1)%count;render();};
 $('#bank-skip').onclick=()=>{const pool=availableCases(state.group);if(pool.length<2){deps.notice('В выбранном разделе нет другой задачи');return;}recordSkip(deps.stats,'case');deps.save();selectCase(nextCase(deps.stats.recentCases??[],state.group).id);const heading=deps.root.querySelector('.case-statement');heading?.scrollIntoView({block:'start',behavior:'instant'});heading?.focus({preventScroll:true});deps.notice('Задача пропущена без оценки');};
 $('#bank-solution-toggle').onclick=()=>{state.showReference=!state.showReference;render();};
 $('#bank-repeat').onclick=()=>{deps.stats.caseReview??=[];if(!deps.stats.caseReview.includes(item.id))deps.stats.caseReview.unshift(item.id);deps.save();deps.notice('Задача добавлена на повторение');};
 $('#bank-complete').onclick=()=>{if(solved!==count){deps.notice('Сначала завершите все этапы');return;}deps.stats.caseCompleted??={};deps.stats.caseCompleted[item.id]=new Date().toISOString().slice(0,10);deps.stats.caseReview=(deps.stats.caseReview??[]).filter(x=>x!==item.id);deps.save();deps.notice('Задача отмечена как изученная');render();};
 if(numerical){
  $('#bank-answer').oninput=ev=>{d.answers[idx]=ev.target.value;delete d.checked[idx];deps.save();};
  $('#bank-answer-form').onsubmit=ev=>{ev.preventDefault();const result=verifyCheckpoint(step,d.answers[idx]);if(result===null){deps.notice('Введите ответ');return;}d.checked[idx]=result;deps.save();render();if(result===true&&idx<count-1){deps.notice('Верно. Можно переходить дальше.');}};
 }else{
  $('#bank-notes').oninput=ev=>{d.notes[idx]=ev.target.value.slice(0,10000);deps.save();};
  $('#bank-compare').onclick=()=>{d.reviewed[idx]=d.reviewed[idx]===true?false:true;deps.save();render();};
  if($('#bank-review'))$('#bank-review').onclick=()=>{d.reviewed[idx]='repeat';deps.stats.caseReview??=[];if(!deps.stats.caseReview.includes(item.id))deps.stats.caseReview.unshift(item.id);deps.save();state.index=(idx+1)%count;render();};
  if($('#bank-understood'))$('#bank-understood').onclick=()=>{d.reviewed[idx]='understood';deps.save();state.index=(idx+1)%count;render();};
 }
}
function $(selector){return deps.root.querySelector(selector);}
export function setupCasebook({root,stats,save,notice,escape,intro,tabs,initialId=null}){
 deps={root,stats,save,notice,escape,intro,tabs};
 if(initialId&&CASE_BY_ID.has(initialId))state.id=initialId;
 if(!state.id){state.id=nextCase(stats.recentCases??[]).id;stats.recentCases=recordRecent(stats.recentCases??[],state.id,24);save();}
 render();
}