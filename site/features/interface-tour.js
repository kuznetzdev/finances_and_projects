/** Guided, opt-in tour of the actual learning controls. Does not store or alter task answers. */
export const TOUR_STEPS=[
 {title:'Разделы обучения',text:'Задачи, тесты, карточки, парадоксы, словарь и прогресс. На телефоне часть разделов находится в меню «Ещё».',desktop:'#desktop-navigation',mobile:'#mobile-navigation'},
 {title:'Направление и тема',text:'Выберите раздел программы и нужную тему. Поиск понимает названия и сокращения, например DCF или WACC.',desktop:'#area-filter'},
 {title:'Сложность',text:'«Все уровни» открывает весь доступный набор. «До уровня N» включает задачи уровней от 1 до N.',desktop:'#level-filter'},
 {title:'Новая случайная задача',text:'Эта кнопка создаёт другой вариант по выбранным фильтрам. Ниже по странице доступен такой же быстрый переход.',desktop:'#random-exercise'},
 {title:'Условие задачи',text:'Здесь исходные данные, условия и проверяемые допущения. Сначала прочитайте, что требуется вычислить.',desktop:'.task-header'},
 {title:'Ваш ответ',text:'Введите решение по шагам. Подсказка помогает выбрать метод, а проверка показывает результат и подробный разбор.',desktop:'.task-body .fields'},
 {title:'Действия с задачей',text:'Здесь можно проверить ответ, открыть подсказку, поделиться задачей или перейти к следующей. Пропуск не ухудшает точность.',desktop:'.task-actions'},
 {title:'Где смотреть результат',text:'Статистика появляется после решений. Общие результаты и задачи на повторение собраны в разделе «Прогресс».',desktop:'.assist-overview',mobile:'#mobile-navigation [data-page="progress"]'},
 {title:'Настройки и повтор экскурсии',text:'Тему можно переключать здесь. Соседняя кнопка «Экскурсия» повторно запускает этот обзор в любой момент.',desktop:'#theme-toggle'}
];
export function createInterfaceTour({trigger,steps=TOUR_STEPS}={}){
 if(!trigger||!Array.isArray(steps)||!steps.length)throw new TypeError('A tour trigger and nonempty steps are required');
 let index=-1,previousFocus=null,shield=null,spotlight=null,dialog=null;
 const active=()=>index>=0;
 const findTarget=()=>{
  const step=steps[index];
  const selector=window.innerWidth<=780?(step.mobile||step.desktop):step.desktop;
  return document.querySelector(selector);
 };
 const position=()=>{
  if(!active()||!dialog||!spotlight)return;
  const target=findTarget();
  if(!target)return;
  const r=target.getBoundingClientRect(),width=window.innerWidth,height=window.innerHeight,pad=7;
  const left=Math.max(5,r.left-pad),top=Math.max(5,r.top-pad);
  const right=Math.min(width-5,r.right+pad),bottom=Math.min(height-5,r.bottom+pad);
  Object.assign(spotlight.style,{left:left+'px',top:top+'px',width:Math.max(0,right-left)+'px',height:Math.max(0,bottom-top)+'px'});
  const cardWidth=dialog.offsetWidth,cardHeight=dialog.offsetHeight;
  const availableBelow=height-bottom,availableAbove=top;
  const wantedTop=availableBelow>=cardHeight+14?bottom+12:availableAbove>=cardHeight+14?top-cardHeight-12:height-cardHeight-12;
  dialog.style.top=Math.max(8,Math.min(height-cardHeight-8,wantedTop))+'px';
  dialog.style.left=Math.max(9,Math.min(width-cardWidth-9,r.left))+'px';
 };
 const reveal=()=>{
  const target=findTarget();
  if(!target)return;
  target.scrollIntoView({block:'center',behavior:'instant'});
  window.requestAnimationFrame(position);
 };
 const show=()=>{
  const step=steps[index];
  dialog.querySelector('#tour-position').textContent='Шаг '+(index+1)+' из '+steps.length;
  dialog.querySelector('#tour-title').textContent=step.title;
  dialog.querySelector('#tour-description').textContent=step.text;
  dialog.querySelector('#tour-back').disabled=index===0;
  dialog.querySelector('#tour-next').textContent=index===steps.length-1?'Завершить':'Далее';
  reveal();
  dialog.querySelector('#tour-next').focus({preventScroll:true});
 };
 const onKey=event=>{
  if(!active())return;
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(event.key!=='Tab')return;
  const focusables=[...dialog.querySelectorAll('button:not(:disabled)')];
  const first=focusables[0],last=focusables.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 };
 const reposition=()=>{if(active())window.requestAnimationFrame(position);};
 const close=()=>{
  if(!active())return;
  index=-1;shield?.remove();spotlight?.remove();dialog?.remove();
  shield=null;spotlight=null;dialog=null;
  document.body.classList.remove('tour-is-open');
  document.removeEventListener('keydown',onKey,true);
  window.removeEventListener('resize',reposition);
  window.removeEventListener('scroll',reposition,true);
  trigger.setAttribute('aria-expanded','false');
  (previousFocus?.isConnected?previousFocus:trigger).focus({preventScroll:true});
 };
 const start=()=>{
  if(active()){close();return;}
  previousFocus=document.activeElement;
  index=0;
  shield=document.createElement('div');shield.className='tour-shield';shield.setAttribute('aria-hidden','true');
  spotlight=document.createElement('div');spotlight.className='tour-spotlight';spotlight.setAttribute('aria-hidden','true');
  dialog=document.createElement('section');dialog.className='tour-dialog';dialog.setAttribute('role','dialog');
  dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','tour-title');
  dialog.setAttribute('aria-describedby','tour-description');
  dialog.innerHTML='<div class="tour-heading"><span id="tour-position"></span><button type="button" id="tour-close" aria-label="Закрыть экскурсию">Закрыть ×</button></div><h2 id="tour-title"></h2><p id="tour-description"></p><div class="tour-actions"><button type="button" id="tour-back" class="button secondary">Назад</button><button type="button" id="tour-next" class="button primary">Далее</button></div>';
  document.body.append(shield,spotlight,dialog);
  document.body.classList.add('tour-is-open');trigger.setAttribute('aria-expanded','true');
  dialog.querySelector('#tour-close').addEventListener('click',close);
  dialog.querySelector('#tour-back').addEventListener('click',()=>{index=Math.max(0,index-1);show();});
  dialog.querySelector('#tour-next').addEventListener('click',()=>{
   if(index===steps.length-1)close();
   else{index++;show();}
  });
  document.addEventListener('keydown',onKey,true);
  window.addEventListener('resize',reposition);
  window.addEventListener('scroll',reposition,true);
  show();
 };
 return {start,close,active};
}
