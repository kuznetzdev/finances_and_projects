import { renderParadoxes, resetParadoxesView } from './features/paradoxes-ui.js';
import {setupCasebook} from './features/casebook-ui.js';
import {bindPracticeModes} from './features/practice-modes.js';
import { TOPICS, LEVELS, TEMPLATE_CATALOG, generateExercise, checkAnswer, formatAnswer } from './engine/index.js';
import { CONCEPTS, KNOWLEDGE_GROUPS, OPERATIONS, OPERATION_CATEGORIES } from './data/knowledge.js';
import { searchConcepts } from './data/glossary-engine.js';
import { formulaVariantsMarkup, glossaryMetaMarkup, glossaryCardMarkup, symbolLegendMarkup } from './features/glossary-ui.js';
import { symbolsForHint } from './data/formula-notation.js';
import { DEFAULT_TAX_POLICY } from './data/tax.js';
import { rng, oneOf } from './engine/helpers.js';
import { shuffle, chooseFresh, recordRecent, newDeck } from './engine/scheduler.js';
import { STUDY_AREAS } from './data/curriculum.js';
import { recordSkip, totalSkipped } from './engine/attempts.js';
import { buildOperationQuiz, buildConceptQuiz, describeQuizAnswer, explainAlternative } from './engine/quiz-learning.js';
import { abbreviationFor, abbreviationsIn } from './data/abbreviations.js';

const $ = sel => document.querySelector(sel), $$ = sel => [...document.querySelectorAll(sel)];
const STORAGE = 'finpraktika.v3', THEME = 'finpraktika.theme';
const baseline = () => ({ lastCardId: null, solved: 0, perfect: 0, total: 0, correct: 0, streak: 0, best: 0, quizSolved: 0, quizCorrect: 0, known: [], retry: [], recentTemplates: [], recentOperations: [], recentTerms: [], recentCases: [], caseCompleted: {}, caseReview: [], caseDrafts: {}, skippedTasks: 0, skippedQuizzes: 0, skippedCases: 0 });
function load() { try { const v = JSON.parse(localStorage.getItem(STORAGE)); return { ...baseline(), ...v, known: Array.isArray(v?.known) ? v.known : [], retry: Array.isArray(v?.retry) ? v.retry : [], recentTemplates: Array.isArray(v?.recentTemplates) ? v.recentTemplates : [], recentOperations: Array.isArray(v?.recentOperations) ? v.recentOperations : [], recentTerms: Array.isArray(v?.recentTerms) ? v.recentTerms : [], recentCases: Array.isArray(v?.recentCases) ? v.recentCases : [], caseCompleted: v?.caseCompleted && typeof v.caseCompleted==='object' ? v.caseCompleted : {}, caseReview: Array.isArray(v?.caseReview) ? v.caseReview : [], caseDrafts: v?.caseDrafts && typeof v.caseDrafts==='object' ? v.caseDrafts : {} }; } catch { return baseline(); } }
let stats = load(); const save = () => { try { localStorage.setItem(STORAGE, JSON.stringify(stats)); } catch { } };
const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function randomSeed() { if (globalThis.crypto?.getRandomValues) { let a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] || 11; } return Math.floor(Math.random() * 2 ** 32) || 11; }
// Read the current URL, not an initial snapshot: the bank updates ?case= while in use.
const fromURL = (k, fallback) => { const params = new URLSearchParams(location.search); return params.has(k) ? params.get(k) : fallback; };
const allowedTopic = new Set(TOPICS.map(t => t.id));
let app = { practiceMode: fromURL('mode','generator')==='bank'?'bank':'generator', area: STUDY_AREAS.some(x=>x.id===fromURL('area','all')) ? fromURL('area','all') : 'all', cardDeck: [], page: ['practice', 'quiz', 'cards', 'paradoxes', 'glossary', 'progress'].includes(fromURL('page', 'practice')) ? fromURL('page', 'practice') : 'practice', topic: allowedTopic.has(fromURL('topic', 'all')) ? fromURL('topic', 'all') : 'all', level: Math.max(1, Math.min(4, Number(fromURL('level', 1)) || 1)), seed: (Number(fromURL('seed', randomSeed())) >>> 0) || 42, templateId: fromURL('template', null), exercise: null, checked: false, hint: false, solution: false, quizMode: 'operations', quiz: null, quizResult: null, quizHint: false, quizScore: 0, quizTotal: 0, quizAnswered: 0, cardIndex: 0, cardFlipped: false, cardGroup: 'Все', glossaryQuery: '', glossaryGroup: 'Все', glossarySelected: null };
let toastTimer;
function notice(text) { const el = $('#toast'); el.textContent = text; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2500); }
function syncPageNavigation(page) {
 $('[data-page]').forEach(e => {
  const current=e.dataset.page===page;
  e.classList.toggle('selected',current);
  if(current)e.setAttribute('aria-current','page');
  else e.removeAttribute('aria-current');
 });
 const labels={practice:'ЗАДАЧИ',quiz:'ТЕСТЫ',cards:'КАРТОЧКИ',paradoxes:'ПАРАДОКСЫ',glossary:'СЛОВАРЬ',progress:'ПРОГРЕСС'};
 $('#page-crumb').textContent=labels[page]||'ЗАДАЧИ';
}
function route(page) {
 if(page!=='paradoxes')resetParadoxesView();
 app.page=page;
 syncPageNavigation(page);
 const u=new URL(location.href);
 u.searchParams.set('page',page);
 if(page!=='paradoxes')u.searchParams.delete('paradox');
 history.replaceState({},'',u);
 render();
 window.scrollTo({top:0,behavior:'instant'});
}
function refreshProgressSidebar() { $('#side-solved').textContent = stats.solved; $('#side-accuracy').textContent = stats.total ? Math.round(stats.correct / stats.total * 100) + '%' : '0%'; }
function availableTemplates() { return TEMPLATE_CATALOG.filter(t => (app.topic === 'all' || t.topic === app.topic) && (app.area === 'all' || t.area === app.area) && t.min <= app.level); }
function ensureExercise() { try { app.exercise = generateExercise({ topic: app.topic, area: app.area, level: app.level, seed: app.seed, templateId: app.templateId, policy: DEFAULT_TAX_POLICY }); app.templateId = app.exercise.templateId; } catch { app.topic = 'all'; app.area = 'all'; app.templateId = null; app.exercise = generateExercise({ topic: 'all', level: app.level, seed: app.seed, policy: DEFAULT_TAX_POLICY }); app.templateId = app.exercise.templateId; } }
function syncExerciseUrl() { const u = new URL(location.href); for (const [k,v] of Object.entries({ topic:app.topic, area:app.area, level:app.level, seed:app.seed, template:app.templateId })) u.searchParams.set(k,String(v)); history.replaceState({},'',u); }
/** Skips are neutral: no accuracy, streak or review-queue changes. */
function skipExercise(){
 recordSkip(stats,'task');save();nextExercise();
 focusTaskHeader();
 notice('Задача пропущена без оценки');
}
function focusQuizQuestion(){const el=document.querySelector('.quiz-question');el?.scrollIntoView({block:'start',behavior:'instant'});el?.focus({preventScroll:true});}
function focusTaskHeader(){const el=document.querySelector('.task-header');el?.scrollIntoView({block:'start',behavior:'instant'});el?.focus({preventScroll:true});}
function skipQuiz(){
 recordSkip(stats,'quiz');save();newQuiz();renderQuiz();
 focusQuizQuestion();notice('Вопрос пропущен без оценки');
}
function nextExercise(forceTemplate=null) {
  const candidates = availableTemplates();
  if(!candidates.length){const min = TEMPLATE_CATALOG.filter(t => (app.topic === 'all'||t.topic === app.topic)&&(app.area === 'all'||t.area === app.area)).reduce((n,t)=>Math.min(n,t.min),4);app.level=Math.max(app.level,min);}
  const pool=availableTemplates();
  const selected=forceTemplate || chooseFresh(pool, stats.recentTemplates, Math.random).id;
  app.seed=randomSeed();app.templateId=selected;app.checked=false;app.hint=false;app.solution=false;
  ensureExercise();stats.recentTemplates=recordRecent(stats.recentTemplates,app.exercise.templateId);save();syncExerciseUrl();renderPractice();
}
function storyHtml(value){
 const story=String(value||'').trim();
 if(story.length<350)return `<p class="task-story">${escape(story)}</p>`;
 const sentences=story.split(/(?<=[.!?])\s+(?=[А-ЯЁ])/);
 if(sentences.length<4)return `<p class="task-story">${escape(story)}</p>`;
 const pairs=[];for(let i=0;i<sentences.length;i+=2)pairs.push(sentences.slice(i,i+2).join(' '));
 return `<div class="task-story task-story-long">${pairs.map(x=>`<p>${escape(x)}</p>`).join('')}</div>`;
}
function pageIntro(label, title, description, number) { return `<section class="page-intro"><div><div class="eyebrow">${escape(label)}</div><h1>${escape(title)}</h1><p>${escape(description)}</p></div><div class="hero-index" aria-hidden="true">${escape(number)}</div></section>`; }
function render() { $('#content').dataset.page = app.page; refreshProgressSidebar(); if (app.page === 'practice') (app.practiceMode==='bank'?renderBankMode():renderPractice()); else if (app.page === 'quiz') renderQuiz(); else if (app.page === 'cards') renderCards(); else if (app.page === 'glossary') renderGlossary(); else if (app.page === 'paradoxes') renderParadoxes($('#content'),pageIntro); else renderProgress(); }
function practiceTabs() { return `<div class="practice-mode-tabs" role="group" aria-label="Режим решения"><button type="button" data-practice-mode="generator" class="${app.practiceMode==='generator'?'active':''}" aria-pressed="${app.practiceMode==='generator'}">Генератор задач</button><button type="button" data-practice-mode="bank" class="${app.practiceMode==='bank'?'active':''}" aria-pressed="${app.practiceMode==='bank'}">Банк задач · 57 кейсов</button></div>`; }
// The case book replaces #content.innerHTML after each internal action. Only #content
// survives all renders, so practice mode changes MUST be delegated to that root.
function changePracticeMode(next) {
 if (next===app.practiceMode) return;
 app.practiceMode=next;
 const url=new URL(location.href);
 url.searchParams.set('mode', next);
 history.replaceState({},'',url);
 render();
 window.scrollTo({top:0,behavior:'instant'});
 $('#content [data-practice-mode="'+next+'"]')?.focus({preventScroll:true});
}
function renderBankMode() { setupCasebook({root:$('#content'),stats,save,notice,escape,intro:pageIntro,tabs:practiceTabs,initialId:fromURL('case',null)}); }
function renderPractice() {  
if (!app.exercise) ensureExercise(); syncExerciseUrl(); const e = app.exercise, t = TOPICS.find(x => x.id === e.topic), total = stats.total ? Math.round(stats.correct / stats.total * 100) : 0;
  const guided = e.questions.length >= 4;
  const fields = e.questions.map((q, i) => {
    const label = `<span class="field-no">${String(i + 1).padStart(2, '0')}</span> ${escape(q.label)}`;
    if (q.type === 'multi') return `<fieldset class="field-group multi-group" data-step-index="${i}" data-key="${escape(q.key)}"><legend class="field-label">${label}</legend><div class="multiple-options">${q.choices.map((item, j) => `<label class="multiple-option"><input type="checkbox" data-multi="${escape(q.key)}" value="${escape(item)}"><span>${escape(item)}</span></label>`).join('')}</div><div class="field-feedback" aria-live="polite"></div></fieldset>`;
    const control = q.type === 'choice' ? `<select class="answer-select" id="answer-${escape(q.key)}"><option value="">Выбери ответ</option>${q.choices.map(x => `<option value="${escape(x)}">${escape(x)}</option>`).join('')}</select>` : `<input class="answer-input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" id="answer-${escape(q.key)}" placeholder="Введите число"><span class="input-unit">${escape(q.unit)}</span>`;
    return `<div class="field-group" data-step-index="${i}" data-key="${escape(q.key)}"><label class="field-label" for="answer-${escape(q.key)}">${label}</label><div class="field-control">${control}</div><div class="field-feedback" aria-live="polite"></div></div>`;
  }).join('');
  $('#content').innerHTML = `${pageIntro('01 / ПРАКТИКА', 'Финансовые задачи', 'Расчёты, анализ ситуаций и прикладные кейсы по программе курса.', '01')}
 <section class="control-strip"><div class="study-filter"><label for="area-filter" class="control-label">НАПРАВЛЕНИЕ ПРОГРАММЫ</label><select id="area-filter" class="group-select" aria-label="Направление программы">${STUDY_AREAS.map(a=>`<option value="${a.id}" ${a.id===app.area ? 'selected' : ''}>${escape(a.name)}</option>`).join('')}</select></div><div class="control-label">ТЕМА ЗАДАЧ</div><div class="topic-chips">${TOPICS.map(x => `<button type="button" class="filter-chip ${x.id === app.topic ? 'selected' : ''}" data-topic="${x.id}" aria-pressed="${x.id === app.topic}">${escape(x.short)}</button>`).join('')}</div><div class="strip-lower"><div class="levels" aria-label="Сложность">${LEVELS.map(x => `<button type="button" class="level-chip ${x.id === app.level ? 'selected' : ''}" data-level="${x.id}" aria-pressed="${x.id === app.level}"><small>0${x.id}</small>${escape(x.title)}</button>`).join('')}</div><span class="skill-description">${escape(LEVELS[app.level - 1].desc)}</span></div></section>
 <section class="workspace"><div class="task-paper"><div class="task-header" tabindex="-1"><div class="task-topline"><span class="task-kicker">ЗАДАНИЕ · ${escape(t?.short || 'ФИНАНСЫ')}</span><span class="task-serial">#${String(app.seed).slice(-6).padStart(6, '0')}</span></div><h2>${escape(e.title)}</h2><div class="task-meta"><span>Уровень ${app.level}</span><i></i><span>${e.questions.length} ${e.questions.length === 1 ? 'вопрос' : e.questions.length < 5 ? 'вопроса' : 'вопросов'}</span><i></i><span>${escape(e.skill || 'Финансы')}</span></div></div><form id="exercise-form" class="task-body">${storyHtml(e.story)}<div class="sub-heading">ВАШЕ РЕШЕНИЕ</div>${guided ? `<div class="guided-head" id="guided-head"><div><strong id="guided-title">Этап 1 из ${e.questions.length}</strong><span id="guided-detail">Ответы сохраняются при переходе между этапами</span></div><button type="button" class="guided-toggle" id="show-all-steps">Показать все этапы</button></div><div class="guided-track" id="guided-track" aria-hidden="true"><span id="guided-progress"></span></div>` : ''}<div class="fields">${fields}</div><div id="exercise-result" aria-live="polite"></div><div id="hint-place"></div><div id="solution-place"></div><div class="action-row task-actions" role="group" aria-label="Действия с задачей"><div class="task-actions-aux"><button type="button" class="button ghost" id="hint-btn">? Подсказка</button><button type="button" class="button ghost" id="share-btn">↗ Поделиться</button></div><div class="task-actions-main">${guided ? `<div class="guided-nav" id="guided-nav"><button type="button" class="button secondary" id="step-prev">← Назад</button><button type="button" class="button secondary" id="step-next">Далее →</button></div>` : ''}<button type="button" class="button secondary" id="skip-task">Пропустить</button><button type="submit" class="button primary" id="check-btn">Проверить →</button></div></div></form><div class="task-source">ТЕМА: ${escape(e.areaName || 'Финансы')} · МАТЕРИАЛ: ${escape(e.source || 'Учебные материалы')} ${e.taxPolicy ? '· ставки по ' + escape(e.taxPolicy) : ''}</div></div>
 <aside class="assist-column"><div class="assist-card"><h3>ТОЧНОСТЬ РЕШЕНИЙ</h3><div class="assist-stat">${total}%</div><div class="assist-copy">Доля правильных ответов за всё время</div><div class="progress-track"><span style="width:${total}%"></span></div></div><div class="assist-card"><h3>ТВОЯ СТАТИСТИКА</h3><div class="assist-list"><div>Задач решено <b>${stats.solved}</b></div><div>Без ошибок <b>${stats.perfect}</b></div><div>Серия <b>${stats.streak}</b></div><div>На повторение <b>${stats.retry.length}</b></div></div></div><div class="assist-card assist-note"><h3>КАК РЕШАТЬ</h3><p>Проверь условие, выбери формулу и введи ответы. Пояснение можно открыть после проверки.</p></div></aside></section>`;
  $('#content').querySelector('.control-strip').insertAdjacentHTML('beforebegin',practiceTabs());
  $$('[data-topic]').forEach(b => b.onclick = () => { app.topic = b.dataset.topic; app.area = 'all'; nextExercise(); }); $('#area-filter').onchange = ev => {app.area=ev.target.value;app.topic='all';nextExercise();}; $$('[data-level]').forEach(b => b.onclick = () => { app.level = Number(b.dataset.level); nextExercise(); }); $('#exercise-form').onsubmit = ev => { ev.preventDefault(); if (app.checked) {nextExercise();focusTaskHeader();} else if (guided && $('#check-btn').hidden) {$('#step-next')?.click();} else checkExercise(); }; $('#skip-task').onclick=skipExercise; $('#hint-btn').onclick = () => { app.hint = !app.hint; $('#hint-place').innerHTML = app.hint ? exerciseHintHtml(e) : ''; $('#hint-btn').textContent = app.hint ? 'Скрыть подсказку' : '? Подсказка'; }; $('#share-btn').onclick = async () => { syncExerciseUrl(); try { await navigator.clipboard.writeText(location.href); notice('Ссылка на задачу скопирована'); } catch { const a = document.createElement('textarea'); a.value = location.href; document.body.append(a); a.select(); document.execCommand('copy'); a.remove(); notice('Ссылка на задачу скопирована'); } };
  if(guided) setupGuidedSteps(e.questions.length);
}
function setupGuidedSteps(count){
 let position=0, all=false;
 const groups=$$('.field-group'), prev=$('#step-prev'), next=$('#step-next'), check=$('#check-btn'), toggle=$('#show-all-steps');
 const apply=()=>{
   groups.forEach((el,i)=>{el.hidden=!all && position!==i;});
   prev.hidden=all||position===0;next.hidden=all||position===count-1;$('#guided-nav').hidden=all;
   check.hidden=!all&&position!==count-1;
   $('#guided-title').textContent=all ? `Все этапы (${count})` : `Этап ${position+1} из ${count}`;
   $('#guided-detail').textContent=all?'Можно отвечать на вопросы в любом порядке':'Ответы сохраняются при переходе между этапами';
   $('#guided-progress').style.width=`${(all?1:(position+1)/count)*100}%`;
   toggle.textContent=all?'Показать по этапам':'Показать все этапы';
 };
 prev.onclick=()=>{position=Math.max(0,position-1);apply();};
 next.onclick=()=>{position=Math.min(count-1,position+1);apply();groups[position].querySelector('input,select')?.focus({preventScroll:true});};
 toggle.onclick=()=>{all=!all;apply();};
 apply();
}
function checkExercise() {  
const e = app.exercise; if(e.questions.length>=4){$$('.field-group').forEach(el=>el.hidden=false);$('#guided-head')?.remove();$('#guided-track')?.remove();$('#guided-nav')?.remove();} let correct = 0; for (const q of e.questions) { const wrap = $$('.field-group').find(el => el.dataset.key === q.key), input = document.getElementById('answer-' + q.key), value = q.type === 'multi' ? [...wrap.querySelectorAll('input:checked')].map(el => el.value) : input.value, result = checkAnswer(q, value); if (result) correct++; wrap.classList.add(result ? 'correct' : 'wrong'); wrap.querySelector('.field-feedback').textContent = result ? '✓ Верно' : `Правильный ответ: ${formatAnswer(q)}`; wrap.querySelectorAll('input,select').forEach(el => el.disabled = true); }
  const all = correct === e.questions.length; stats.solved++; stats.total += e.questions.length; stats.correct += correct; if (all) { stats.perfect++; stats.streak++; stats.best = Math.max(stats.best, stats.streak); stats.retry = stats.retry.filter(x => !(x.seed === app.seed && x.templateId === e.templateId)); } else { stats.streak = 0; if (!stats.retry.some(x => x.seed === app.seed && x.templateId === e.templateId)) stats.retry.unshift({ topic: e.topic, templateId: e.templateId, level: app.level, seed: app.seed }); stats.retry = stats.retry.slice(0, 35); } save(); refreshProgressSidebar(); app.checked = true; $('#exercise-result').innerHTML = `<div class="result-summary"><strong>${all ? 'Все ответы верны.' : `Правильно ${correct} из ${e.questions.length}`}</strong><div>${all ? 'Задача выполнена. Можно перейти к следующей.' : 'Проверь вычисления и посмотри разбор.'}</div><button type="button" class="button link" id="solution-btn">${all ? 'Посмотреть ход решения' : 'Разобрать решение'} ↓</button></div>`; $('#solution-btn').onclick = () => { app.solution = !app.solution; $('#solution-place').innerHTML = app.solution ? `<div class="solution-panel"><strong>Пошаговое объяснение</strong><ol>${e.explanation.map(x => `<li>${escape(x)}</li>`).join('')}</ol></div>` : ''; }; $('#check-btn').textContent = 'Следующая →';
}
function newQuiz(){
 app.quizResult=null;app.quizHint=false;app.quizTotal++;
 const seed=randomSeed();
 if(app.quizMode==='operations'){
   const operation=chooseFresh(OPERATIONS,stats.recentOperations,Math.random);
   stats.recentOperations=recordRecent(stats.recentOperations,operation.id);save();
   app.quiz=buildOperationQuiz(operation,OPERATIONS,seed);
 }else{
   const concept=chooseFresh(CONCEPTS,stats.recentTerms,Math.random);
   stats.recentTerms=recordRecent(stats.recentTerms,concept.id);save();
   app.quiz=buildConceptQuiz(concept,CONCEPTS,seed);
 }
}
function abbreviationLine(entry){
 return `<span class="abbr-key">${escape(entry.key)}</span><span><b>${escape(entry.english)}</b> — ${escape(entry.russian)}. ${escape(entry.meaning)}</span>`;
}
function exerciseHintHtml(exercise){
 const symbols=symbolsForHint(exercise.hint,{topic:exercise.topic,title:exercise.title});
 const detected=abbreviationsIn([exercise.title,exercise.story,...exercise.questions.map(q=>q.label)].join(' '),6);
 const tips={
  pl:'Определите момент признания выручки и расходов: оплата может произойти в другом периоде.',
  cash:'Разделите операционные, инвестиционные и финансовые платежи. При косвенном методе учитывайте изменение оборотного капитала.',
  balance:'После каждой операции проверьте баланс: активы должны равняться обязательствам плюс капиталу.',
  links:'Начните с прибыли, перенесите изменения оборотного капитала в ОДДС и затем проверьте баланс.',
  ratios:'Сначала найдите правильные числитель, знаменатель и период. Не смешивайте разы, проценты и дни.',
  valuation:'Уточните дату каждого потока и объект оценки: проект, бизнес или доля акционеров. Не дисконтируйте потоки по неподходящей ставке.',
  tax:'Проверьте, что именно задано: налоговая база, ставка, период возникновения выгоды и право на вычет.',
  model:'Зафиксируйте единицы, период и допущения модели. Проверьте, как одна величина связана с другими.'
 };
 return `<div class="hint-panel"><strong>Как подойти к решению</strong><p>${escape(tips[exercise.topic]||'Выделите исходные данные, единицы и искомый показатель.')}</p><p><strong>Формула и порядок расчёта:</strong> ${escape(exercise.hint)}</p>${symbolLegendMarkup(symbols,escape)}${detected.length?`<details class="term-disclosures"><summary>Расшифровки обозначений (${detected.length})</summary><div class="abbr-list">${detected.map(abbreviationLine).join('')}</div></details>`:''}</div>`;
}
function renderQuiz() {
 if(!app.quiz)newQuiz();
 const item=app.quiz, answered=app.quizResult!==null;
 const analysis=answered?describeQuizAnswer(item,app.quizResult,CONCEPTS):null;
 $('#content').innerHTML=`${pageIntro('02 / ПРОВЕРЬ СЕБЯ','Быстрые тесты','Различайте показатели, операции и методы по финансовому смыслу.','02')}
 <section class="aux-panel quiz-card"><div class="mode-header"><div><h2>Быстрый тест</h2><p>Сначала определите, что именно нужно классифицировать. После ответа получите пояснение.</p></div><span class="badge-soft">${app.quizScore} / ${app.quizAnswered} верно</span></div>
 <div class="quiz-toolbar"><div class="quiz-modes"><button type="button" class="pill-switch ${app.quizMode==='operations'?'active':''}" data-qmode="operations" aria-pressed="${app.quizMode==='operations'}">Классификация</button><button type="button" class="pill-switch ${app.quizMode==='terms'?'active':''}" data-qmode="terms" aria-pressed="${app.quizMode==='terms'}">Угадай термин</button></div><span>ВОПРОС ${app.quizTotal}</span></div>
 <div class="eyebrow">${item.kind==='operations'?'СИТУАЦИЯ ИЗ ПРАКТИКИ':'ОПРЕДЕЛЕНИЕ ПОНЯТИЯ'}</div>
 <p class="quiz-scenario">${escape(item.scenario)}</p>
 <h3 class="quiz-question" tabindex="-1">${escape(item.question)}</h3>
 ${!answered?`<div class="quiz-prep"><button type="button" id="quiz-hint-toggle" class="quiz-hint-toggle" aria-expanded="${app.quizHint}" aria-controls="quiz-hint-details">${app.quizHint?'Скрыть подсказку':'? Как рассуждать'}</button><div class="quiz-hint-details" id="quiz-hint-details" ${app.quizHint?'':'hidden'}><strong>Подсказка по методу</strong><p>${escape(item.hint)}</p>${symbolLegendMarkup(symbolsForHint(item.hint,{title:item.question}),escape)}</div></div>`:''}
 <div class="quiz-options">${item.options.map((x,i)=>`<button type="button" class="quiz-option ${answered?(x===item.answer?'correct':x===app.quizResult?'wrong':''):''}" data-choice="${escape(x)}" ${answered?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${escape(x)}</button>`).join('')}</div>
 ${answered?`<div class="quiz-feedback" role="status"><strong>${app.quizResult===item.answer?'✓ Верно':'Разбор ответа'}</strong><p class="quiz-answer-line">Правильный ответ: <b>${escape(item.answer)}</b>.</p><p><b>Почему именно так:</b> ${escape(analysis.reason)}</p><p><b>Как отличить от похожих понятий:</b> ${escape(analysis.rule)}</p>${analysis.wrong?`<p class="quiz-mistake"><b>Почему выбранный вариант не подходит:</b> ${escape(analysis.wrong)}</p>`:''}${analysis.expansion?`<div class="quiz-term-expansion">${abbreviationLine(analysis.expansion)}</div>`:''}<details class="quiz-alternatives"><summary>Разобрать все варианты ответов</summary><div class="quiz-alternatives-list">${item.options.map(label=>`<div><strong>${escape(label)}${label===item.answer?' ✓':''}</strong><p>${escape(explainAlternative(label,item,CONCEPTS))}</p></div>`).join('')}</div></details></div>`:''}
 <div class="quiz-actions" role="group" aria-label="Управление тестом"><span class="quiz-actions-hint">${answered?'Разбор доступен выше, можно переходить к следующему вопросу.':'Пропуск не снижает точность тестов.'}</span><button type="button" class="button ${answered?'primary':'secondary'}" id="${answered?'next-quiz':'skip-quiz'}">${answered?'Следующий вопрос →':'Пропустить →'}</button></div></section>`;
 $$('[data-qmode]').forEach(b=>b.onclick=()=>{app.quizMode=b.dataset.qmode;app.quizTotal=0;app.quizScore=0;app.quizAnswered=0;newQuiz();renderQuiz();focusQuizQuestion();});
 $('#quiz-hint-toggle')?.addEventListener('click',()=>{app.quizHint=!app.quizHint;renderQuiz();focusQuizQuestion();});
 $$('[data-choice]').forEach(b=>b.onclick=()=>{if(app.quizResult!==null)return;app.quizResult=b.dataset.choice;stats.quizSolved++;app.quizAnswered++;if(app.quizResult===item.answer){stats.quizCorrect++;app.quizScore++;}save();renderQuiz();document.querySelector('.quiz-feedback')?.scrollIntoView({block:'nearest',behavior:'instant'});});
 $('#skip-quiz')?.addEventListener('click',skipQuiz);
 $('#next-quiz')?.addEventListener('click',()=>{newQuiz();renderQuiz();focusQuizQuestion();});
}
function filteredCards() {const items=app.cardGroup==='Все'?CONCEPTS:CONCEPTS.filter(x=>x.group===app.cardGroup);return items.length?items:CONCEPTS;}
function initCardDeck(previousId=stats.lastCardId){const items=filteredCards();app.cardDeck=newDeck(items,previousId);app.cardIndex=0;app.cardFlipped=false;stats.lastCardId=app.cardDeck[0]||null;save();}
function renderCards(){
 const items=filteredCards();
 if(!app.cardDeck.length||app.cardDeck.some(id=>!items.some(x=>x.id===id))||app.cardDeck.length!==items.length)initCardDeck();
 const card=CONCEPTS.find(x=>x.id===app.cardDeck[app.cardIndex])||items[0], known=stats.known.includes(card.id);
 $('#content').innerHTML=`${pageIntro('03 / ПОВТОРЕНИЕ','Карточки терминов','Изучай понятия и проверяй определения. Порядок карточек случайный.', '03')}
 <section class="aux-panel flash-card"><div class="mode-header"><div><h2>Понятия и определения</h2><p>${stats.known.length} из ${CONCEPTS.length} отмечено как изученные.</p></div><span class="badge-soft">${app.cardIndex+1} / ${items.length}</span></div>
 <div class="quiz-toolbar"><select id="card-group" class="group-select" aria-label="Фильтр карточек"><option value="Все">Все категории · случайно</option>${KNOWLEDGE_GROUPS.map(x=>`<option value="${escape(x)}" ${app.cardGroup===x?'selected':''}>${escape(x)}</option>`).join('')}</select><span>${escape(card.group)}</span></div>
 <button type="button" id="flip-card" class="flip-surface ${app.cardFlipped?'revealed':''}" aria-label="${app.cardFlipped?'Вернуться к термину':'Показать определение'}" aria-pressed="${app.cardFlipped}"><small>${app.cardFlipped?'ОПРЕДЕЛЕНИЕ':'ТЕРМИН'} · ${known?'ИЗУЧЕНО':'НА ПОВТОРЕНИЕ'}</small><div class="flip-main">${app.cardFlipped?`<div class="back-def">${escape(card.definition)}${abbreviationFor(card.term)?`<div class="card-abbr">${abbreviationLine(abbreviationFor(card.term))}</div>`:''}</div>`:`<div class="front-term">${escape(card.term)}</div>`}</div><div class="flip-footer">${app.cardFlipped?`<strong>Важно не путать:</strong> ${escape(card.contrast)}`:'Нажми, чтобы посмотреть определение'}</div></button>
 <div class="flip-controls"><button type="button" class="button secondary" id="card-prev">← Назад</button><button type="button" class="button secondary" id="card-toggle">${known?'Вернуть на повторение':'✓ Уже знаю'}</button><button type="button" class="button primary" id="card-next">Следующая →</button></div><div class="micro" style="text-align:center;margin:20px 0 0">${escape(card.source)}</div></section>`;
 $('#flip-card').onclick=()=>{app.cardFlipped=!app.cardFlipped;renderCards();};
 $('#card-prev').onclick=()=>{app.cardIndex=(app.cardIndex-1+items.length)%items.length;app.cardFlipped=false;stats.lastCardId=app.cardDeck[app.cardIndex];save();renderCards();};
 $('#card-next').onclick=()=>{const was=card.id;if(app.cardIndex===items.length-1)initCardDeck(was);else{app.cardIndex++;app.cardFlipped=false;stats.lastCardId=app.cardDeck[app.cardIndex];save();}renderCards();};
 $('#card-toggle').onclick=()=>{stats.known=known?stats.known.filter(x=>x!==card.id):[...stats.known,card.id];save();renderCards();notice(known?'Добавлено на повторение':'Отмечено как изученное');};
 $('#card-group').onchange=e=>{app.cardGroup=e.target.value;initCardDeck();renderCards();};
}
function renderGlossary() {
 const arr=searchConcepts(CONCEPTS, app.glossaryQuery, app.glossaryGroup, abbreviationFor);
 const sel=arr.find(x=>x.id===app.glossarySelected);
 const countFormula=CONCEPTS.filter(x=>x.formulas?.length).length;
 $('#content').innerHTML=`${pageIntro('04 / БАЗА ЗНАНИЙ','Финансовый словарь','Термины, синонимы и варианты финансовых формул с пояснениями.', '04')}
 <section class="glossary-controls"><input type="search" class="search-input" id="glossary-search" placeholder="Название, аббревиатура или формула…" value="${escape(app.glossaryQuery)}" aria-label="Поиск термина"><select class="group-select" id="glossary-group" aria-label="Категория"><option value="Все">Все темы</option>${KNOWLEDGE_GROUPS.map(x=>`<option value="${escape(x)}" ${x===app.glossaryGroup?'selected':''}>${escape(x)}</option>`).join('')}</select></section>
 ${sel?`<section class="term-detail" aria-labelledby="selected-term-title"><div class="eyebrow">${escape(sel.group)}</div><h2 id="selected-term-title" style="font:normal clamp(25px,3.5vw,33px) Georgia,serif;margin:13px 0">${escape(sel.term)}</h2><p>${escape(sel.definition)}</p><p><strong>Чем отличается:</strong> ${escape(sel.contrast)}</p>${glossaryMetaMarkup(sel,escape)}${abbreviationFor(sel.term)?`<div class="glossary-expansion">${abbreviationLine(abbreviationFor(sel.term))}</div>`:''}${formulaVariantsMarkup(sel,escape)}<small>${escape(sel.source)}</small><div style="margin-top:14px"><button type="button" class="button ghost" id="close-term">Закрыть ↑</button></div></section>`:''}
 <div class="micro" style="margin-bottom:12px">НАЙДЕНО: ${arr.length} · ВСЕГО ПОНЯТИЙ: ${CONCEPTS.length} · С ФОРМУЛАМИ: ${countFormula}</div>
 <section class="term-list" aria-label="Термины словаря">${arr.map(x=>glossaryCardMarkup(x,escape)).join('')}</section>
 ${!arr.length?'<div class="empty-state">Ничего не найдено. Попробуйте другой термин или категорию.</div>':''}`;
 $('#glossary-search').oninput=e=>{const pos=e.target.selectionStart;app.glossaryQuery=e.target.value;renderGlossary();const el=$('#glossary-search');el.focus();el.setSelectionRange(pos,pos);};
 $('#glossary-group').onchange=e=>{app.glossaryGroup=e.target.value;app.glossarySelected=null;renderGlossary();};
 $$('[data-term]').forEach(b=>b.onclick=()=>{app.glossarySelected=b.dataset.term;renderGlossary();window.scrollTo({top:0,behavior:'smooth'});});
 if($('#close-term'))$('#close-term').onclick=()=>{app.glossarySelected=null;renderGlossary();};
}
function renderProgress() {  
const accuracy = stats.total ? Math.round(stats.correct / stats.total * 100) : 0, qa = stats.quizSolved ? Math.round(stats.quizCorrect / stats.quizSolved * 100) : 0; $('#content').innerHTML = `${pageIntro('05 / РЕЗУЛЬТАТ', 'Мой прогресс', 'Личный прогресс остаётся в браузере. Ни регистрация, ни сервер для занятий не нужны.', '05')}<section class="stat-grid"><div class="stat-tile"><strong>${stats.solved}</strong><span>Задач решено</span></div><div class="stat-tile"><strong>${accuracy}%</strong><span>Правильных ответов</span></div><div class="stat-tile"><strong>${stats.best}</strong><span>Лучшая серия</span></div></section><section class="aux-panel"><div class="mode-header"><div><h2>Твой путь</h2><p>Возвращайся к сложным задачам, а не только к тем, что уже получаются.</p></div></div><div class="data-list"><div class="data-row"><span>Задачи без ошибок</span><strong>${stats.perfect}</strong></div><div class="data-row"><span>Точность тестов</span><strong>${qa}% (${stats.quizSolved} вопросов)</strong></div><div class="data-row"><span>Изученных карточек</span><strong>${stats.known.length} / ${CONCEPTS.length}</strong></div><div class="data-row"><span>Кейсов из банка изучено</span><strong>${Object.keys(stats.caseCompleted||{}).length} / 57</strong></div><div class="data-row"><span>Задач на повторение</span><strong>${stats.retry.length}</strong></div><div class="data-row"><span>Пропущено без оценки</span><strong>${totalSkipped(stats)}</strong></div></div><div class="action-row"><button class="button primary" id="repeat-errors" ${stats.retry.length ? '' : 'disabled'}>Повторить ошибки →</button><button class="button ghost" id="export-progress">↓ Экспорт JSON</button><button class="button ghost" id="reset-progress">Сбросить статистику</button></div></section>`;
  $('#repeat-errors').onclick = () => { const a = stats.retry[0]; if (!a) return; app.level = a.level; app.topic = a.topic; app.area = 'all'; app.seed = a.seed; app.templateId = a.templateId; app.exercise = null; app.checked = false; app.hint = false; app.solution = false; route('practice'); }; $('#reset-progress').onclick = () => { if (confirm('Удалить весь личный прогресс в этом браузере?')) { stats = baseline(); save(); renderProgress(); refreshProgressSidebar(); } }; $('#export-progress').onclick = () => { const blob = new Blob([JSON.stringify({ version: 4, exportedAt: new Date().toISOString(), stats }, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = 'finpraktika-progress.json'; a.click(); URL.revokeObjectURL(u); };
}
$$('[data-page]').forEach(b => b.onclick = () => route(b.dataset.page));
try { document.documentElement.dataset.theme = localStorage.getItem(THEME) === 'dark' ? 'dark' : 'light'; } catch { }
$('#theme-toggle').onclick = () => { const mode = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = mode; try { localStorage.setItem(THEME, mode); } catch { } };
// Register once on the stable container, never on replaceable tab elements.
bindPracticeModes($('#content'), changePracticeMode);
if(app.page==='practice'&&app.practiceMode!=='bank')ensureExercise();
syncPageNavigation(app.page);
render();
$('#brand').addEventListener('click',e=>{e.preventDefault();route('practice');});