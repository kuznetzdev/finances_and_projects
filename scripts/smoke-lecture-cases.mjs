import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright-core';
const PORT=8767,base='http://127.0.0.1:'+PORT+'/';
const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
if(!executablePath)throw new Error('Chromium executable missing');
mkdirSync('artifacts',{recursive:true});
const server=spawn('python3',['-m','http.server',String(PORT),'-d','site'],{stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let i=0;i<35;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await delay(180);}
 assert.ok(ready,'HTTP server unavailable');
 browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[];
 const desktop=await browser.newContext({viewport:{width:1320,height:920}});
 const page=await desktop.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'?page=practice&mode=bank&case=LC01',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-code').innerText(),'LC01');
 assert.equal(await page.locator('#bank-group').inputValue(),'LBO · видеолекция');
 assert.equal(await page.locator('#bank-random .ui-icon').count(),1);
 assert.equal(await page.locator('#bank-match-count').innerText(),'3 найдено по фильтру');
 // A hint is available without disclosing or grading the user's result.
 await page.locator('#bank-step-hint').click();
 assert.equal(await page.locator('#bank-step-hint').getAttribute('aria-expanded'),'true');
 assert.equal(await page.locator('.case-hint-panel .financial-formula').count(),0);
 await page.locator('#bank-step-hint').click();
 assert.ok(await page.locator('.case-hint-panel .financial-formula').isVisible());
 await page.locator('#bank-step-hint').click();
 assert.match(await page.locator('.case-hint-panel').innerText(),/350/);
 await page.screenshot({path:'artifacts/lecture-lbo-hint.png',fullPage:true});
 await page.locator('#bank-step-hint').click();
 assert.equal(await page.locator('.case-hint-panel').count(),0);

 assert.match(await page.locator('.case-counter').innerText(),/111 разобранных задач/);
 assert.match(await page.locator('.case-condition').innerText(),/500 млн/);
 await page.locator('#bank-answer').fill('150');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 assert.match(await page.locator('#bank-feedback').innerText(),/Верно/);
 await page.locator('#bank-next').click();
 await page.locator('#bank-answer').fill('350');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 await page.locator('#bank-next').click();
 await page.locator('#bank-answer').fill('2,333');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 await page.locator('#bank-next').click();
 await page.locator('#bank-answer').fill('23,60');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 await page.locator('#bank-next').click();
 await page.locator('#bank-answer').fill('250');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 assert.equal(await page.locator('#bank-complete').isEnabled(),true);
 await page.screenshot({path:'artifacts/lecture-lbo-desktop.png',fullPage:true});
 // Regression: changing an already verified answer must immediately revoke credit.
 await page.locator('#bank-answer').fill('100');
 assert.equal(await page.locator('#bank-complete').isDisabled(),true);
 assert.match(await page.locator('#bank-feedback').innerText(),/изменён/);
 assert.equal(await page.locator('.case-workpad-head strong').innerText(),'4/5');
 await page.reload({waitUntil:'networkidle'});
 // The book intentionally returns to step one on reload; navigate to saved fifth answer.
 for(let i=0;i<4;i++)await page.locator('#bank-next').click();
 assert.equal(await page.locator('#bank-answer').inputValue(),'100');
 assert.equal(await page.locator('#bank-complete').isDisabled(),true);
 await page.locator('#bank-answer').fill('250');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 assert.equal(await page.locator('#bank-complete').isEnabled(),true);
 await page.locator('#bank-complete').click();
 assert.ok(await page.locator('.case-success').isVisible());
 // A changed answer also revokes a previously completed case.
 await page.locator('#bank-answer').fill('3');
 assert.equal(await page.locator('.case-success').count(),0);
 assert.equal(await page.locator('#bank-complete').isDisabled(),true);
 // Ensure the debounce has completed before deliberately modifying persisted storage.
 await page.waitForTimeout(650);
 // A corrupted old localStorage record cannot preserve an unearned passing state.
 await page.evaluate(()=>{
   const stats=JSON.parse(localStorage.getItem('finpraktika.v3'));
   stats.caseDrafts.LC01.checked[0]=true;
   stats.caseDrafts.LC01.answers[0]='999';
   stats.caseCompleted.LC01='2026-10-26';
   localStorage.setItem('finpraktika.v3',JSON.stringify(stats));
 });
 await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-workpad-head strong').innerText(),'3/5');
 assert.equal(await page.locator('.case-success').count(),0);
 assert.equal(await page.locator('#bank-complete').isDisabled(),true);
 assert.doesNotMatch(await page.locator('#bank-feedback').innerText(),/Верно/);
 // Two added fixed assignments and enhanced original LBO checks.
 await page.goto(base+'?page=practice&mode=bank&case=LC02',{waitUntil:'networkidle'});
 for(const [i,v] of ['630','6,3','600','30'].entries()){
  await page.locator('#bank-answer').fill(v);
  await page.locator('#bank-answer-form button[type="submit"]').click();
  assert.match(await page.locator('#bank-feedback').innerText(),/Верно/,'LC02 step '+i);
  if(i<3)await page.locator('#bank-next').click();
 }
 assert.equal(await page.locator('#bank-complete').isEnabled(),true);
 await page.goto(base+'?page=practice&mode=bank&case=LC03',{waitUntil:'networkidle'});
 assert.equal(await page.locator('#bank-answer').count(),0,'LBO vs VC is qualitative');
 await page.locator('#bank-compare').click();
 assert.equal(await page.locator('#bank-understood').isDisabled(),true);
 await page.locator('#bank-solution-toggle').click();
 assert.match(await page.locator('.case-full-solution').innerText(),/рефинансировать/);
 await page.goto(base+'?page=practice&mode=bank&case=CS01',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-code').innerText(),'CS01');
 for(const [i,v] of ['1000','21000','19500'].entries()){
  await page.locator('#bank-answer').fill(v);
  await page.locator('#bank-answer-form button[type="submit"]').click();
  assert.match(await page.locator('#bank-feedback').innerText(),/Верно/,'CS01 step '+i);
  if(i<2)await page.locator('#bank-next').click();
 }
 assert.equal(await page.locator('#bank-complete').isEnabled(),true);
 await page.goto(base+'?page=practice&mode=bank&case=CS02',{waitUntil:'networkidle'});
 assert.equal(await page.locator('#bank-code').count(),0);
 assert.equal(await page.locator('.case-code').innerText(),'CS02');
 for(const [i,v] of ['800','1200','0','0','120','300','200','174'].entries()){
  await page.locator('#bank-answer').fill(v);
  await page.locator('#bank-answer-form button[type="submit"]').click();
  assert.match(await page.locator('#bank-feedback').innerText(),/Верно/,'CS02 step '+i);
  if(i<7)await page.locator('#bank-next').click();
 }
 assert.equal(await page.locator('#bank-complete').isEnabled(),true);
 await page.screenshot({path:'artifacts/stage1-pecking-order.png',fullPage:true});
 // The section 4 route maps theory to eight PDF cases and existing paradoxes.
 await page.goto(base+'?page=practice&mode=bank&case=S4-03',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-code').innerText(),'S4-03');
 assert.equal(await page.locator('#bank-group').inputValue(),'Семинар 4 · дополнительные задачи');
 await page.locator('#section4-learning-path summary').click();
 assert.equal(await page.locator('#section4-learning-path .section4-path-topic').count(),12);
 assert.ok(await page.locator('.section4-path-link[href*="case=S4-01"]').count()>=1);
 assert.ok(await page.locator('.section4-path-link[href*="paradox=s4-p5"]').count()>=1);
 const destinations=await page.locator('.section4-path-link').evaluateAll(links=>links.map(a=>a.href));
 assert.ok(destinations.every(url=>url.includes('?page=practice')||url.includes('?page=paradoxes')));
 for(const [i,val] of ['21,053','26,667','5,614'].entries()){
  await page.locator('#bank-answer').fill(val);
  await page.locator('#bank-answer-form button[type="submit"]').click();
  assert.match(await page.locator('#bank-feedback').innerText(),/Верно/,'S4-03 step '+i);
  if(i<2)await page.locator('#bank-next').click();
 }
 assert.equal(await page.locator('#bank-complete').isEnabled(),true);
 await page.goto(base+'?page=practice&mode=bank&case=S4-08',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-code').innerText(),'S4-08');
 assert.match(await page.locator('.case-condition').innerText(),/Дополнительное условие/);
 assert.ok(await page.locator('.case-caution').isVisible());
 await page.locator('#bank-step-hint').click();
 assert.equal(await page.locator('.case-hint-panel .financial-formula').count(),0);
 await page.locator('#bank-step-hint').click();
 assert.ok(await page.locator('.case-hint-panel .financial-formula').isVisible());
 await page.locator('#bank-answer').fill('10,8333');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 assert.match(await page.locator('#bank-feedback').innerText(),/Верно/);
 await page.locator('#bank-solution-toggle').click();
 assert.match(await page.locator('.case-full-solution').innerText(),/без добавленных условий/);
 await page.screenshot({path:'artifacts/section4-novatech-desktop.png',fullPage:true});
 // New bond and option cases, source notes and five-topic route.
 await page.goto(base+'?page=practice&mode=bank&case=I01',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-code').innerText(),'I01');
 assert.equal(await page.locator('#bank-group').inputValue(),'Облигации и опционы · углублённые кейсы');
 await page.locator('#instruments-learning-path summary').click();
 assert.equal(await page.locator('#instruments-learning-path .section4-path-topic').count(),5);
 assert.ok(await page.locator('#instruments-learning-path a[href*="case=I02"]').count()>=1);
 assert.ok(await page.locator('#instruments-learning-path a[href*="case=I03"]').count()>=1);
 await page.locator('#bank-step-hint').click();
 assert.equal(await page.locator('.case-hint-panel .financial-formula').count(),0);
 await page.locator('#bank-step-hint').click();
 assert.ok(await page.locator('.case-hint-panel .financial-formula').isVisible());
 for(const [i,v] of ['950,263','2,7774','2,5249','-2,5249','-2,4808'].entries()){
  await page.locator('#bank-answer').fill(v);
  await page.locator('#bank-answer-form button[type="submit"]').click();
  assert.match(await page.locator('#bank-feedback').innerText(),/Верно/,'I01 step '+i);
  if(i<4)await page.locator('#bank-next').click();
 }
 assert.equal(await page.locator('#bank-complete').isEnabled(),true);
 await page.locator('#bank-solution-toggle').click();
 assert.match(await page.locator('.case-full-solution').innerText(),/модифицированную дюрацию/);
 await page.goto(base+'?page=practice&mode=bank&case=I03',{waitUntil:'networkidle'});
 assert.match(await page.locator('.case-condition').innerText(),/Авторский пример/);
 for(const [i,v] of ['20','12','108','20','14','94'].entries()){
  await page.locator('#bank-answer').fill(v);
  await page.locator('#bank-answer-form button[type="submit"]').click();
  assert.match(await page.locator('#bank-feedback').innerText(),/Верно/,'I03 step '+i);
  if(i<5)await page.locator('#bank-next').click();
 }
 assert.equal(await page.locator('#bank-complete').isEnabled(),true);
 await page.goto(base+'?page=practice&mode=bank&case=I04',{waitUntil:'networkidle'});
 for(const [i,v] of ['-25','20','-13','13','108'].entries()){
  await page.locator('#bank-answer').fill(v);
  await page.locator('#bank-answer-form button[type="submit"]').click();
  assert.match(await page.locator('#bank-feedback').innerText(),/Верно/,'I04 step '+i);
  if(i<4)await page.locator('#bank-next').click();
 }
 await page.screenshot({path:'artifacts/instruments-protective-put.png',fullPage:true});
 await page.goto(base+'?page=practice&mode=bank&case=VC03',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-code').innerText(),'VC03');
 assert.match(await page.locator('.case-condition').innerText(),/500 млн/);
 await page.locator('#bank-answer').fill('8');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 await page.locator('#bank-next').click();
 await page.locator('#bank-answer').fill('68,18');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 assert.equal(await page.locator('#bank-complete').isEnabled(),true);
 await page.goto(base+'?page=practice&mode=bank&case=RO01',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-code').innerText(),'RO01');
 assert.ok(await page.locator('.case-caution').isVisible());
 assert.equal(await page.locator('#bank-answer').count(),0);
 // Self-graded reasoning must not be certified without an original explanation.
 await page.locator('#bank-compare').click();
 assert.equal(await page.locator('#bank-understood').isDisabled(),true);
 await page.locator('#bank-notes').fill('Пока не могу объяснить расчет');
 assert.equal(await page.locator('#bank-understood').isDisabled(),true);
 const reasoning='Ключевое условие состоит в возможности не осуществлять инвестиции при неблагоприятном сценарии. Затраты после раскрытия информации должны учитываться только в той ветке дерева, где менеджмент действительно выбирает масштабирование, иначе стоимость опциона окажется искаженной.';
 await page.locator('#bank-notes').fill(reasoning);
 assert.equal(await page.locator('#bank-understood').isEnabled(),true);
 await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.locator('#bank-notes').inputValue(),reasoning);
 await page.locator('#bank-compare').click();
 assert.equal(await page.locator('#bank-understood').isEnabled(),true);
 await page.locator('#bank-understood').click();
 assert.equal(await page.locator('.case-workpad-head strong').innerText(),'1/3');
 await page.locator('#bank-prev').click();
 assert.equal(await page.locator('#bank-next').isEnabled(),true);
 await page.locator('#bank-solution-toggle').click();
 const solution=await page.locator('.case-full-solution').innerText();
 assert.match(solution,/378,07/);assert.match(solution,/756,14/);
 await page.goto(base+'?page=practice&mode=bank&case=RO02',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-code').innerText(),'RO02');
 assert.match(await page.locator('.case-condition').innerText(),/переключ/);
 assert.equal(await page.locator('#bank-group').inputValue(),'Реальные опционы · видеолекция');
 await page.locator('#bank-group').selectOption('Реальные опционы · видеолекция');
 assert.equal(await page.locator('#bank-select option').count(),3);
 // Search the actual problem text, not only title metadata.
 await page.locator('#bank-group').selectOption('Все направления');
 await page.locator('#bank-search').fill('мебель');
 assert.ok((await page.locator('#bank-select option').allTextContents()).some(x=>x.includes('LC03')));
 assert.equal(await page.locator('#bank-match-count').innerText(),'1 найдено по фильтру');
 await page.locator('#bank-search').fill('нереальное_слово_для_поиска');
 assert.equal(await page.locator('#bank-random').isDisabled(),true);
 assert.equal(await page.locator('#bank-select').inputValue(),'');
 assert.equal(await page.locator('#bank-match-count').innerText(),'0 найдено по фильтру');
 await page.locator('#bank-search').fill('IRR и MOIC');
 assert.equal(await page.locator('#bank-random').isEnabled(),true);

 await page.screenshot({path:'artifacts/lecture-options-desktop.png',fullPage:true});
 // New fixed-source control assignments share the bank's numeric grading and search UI.
 await page.goto(base+'?page=practice&mode=bank&case=CW-F03',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-code').innerText(),'CW-F03');
 assert.equal(await page.locator('#bank-group').inputValue(),'Контрольные · Финансовая отчётность');
 assert.match(await page.locator('.case-condition').innerText(),/1 000 тыс/);
 await page.locator('#bank-answer').fill('800');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 assert.match(await page.locator('#bank-feedback').innerText(),/Верно/);
 await page.goto(base+'?page=practice&mode=bank&case=CW-V06',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.case-code').innerText(),'CW-V06');
 assert.equal(await page.locator('#bank-group').inputValue(),'Контрольные · Оценка бизнеса');
 assert.match(await page.locator('.case-condition').innerText(),/2022/);
 await page.locator('#bank-answer').fill('-100');
 await page.locator('#bank-answer-form button[type="submit"]').click();
 assert.match(await page.locator('#bank-feedback').innerText(),/Верно/);
 await page.locator('#bank-solution-toggle').click();
 assert.match(await page.locator('.case-full-solution').innerText(),/570/);
 await page.locator('[data-page="glossary"]').first().click();
 await page.locator('#glossary-search').fill('pro-rata');
 assert.ok(await page.locator('.term-item').count()>=1);
 await desktop.close();
 const mobile=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true});
 const mob=await mobile.newPage();
 mob.on('pageerror',e=>errors.push('mobile: '+e.message));
 await mob.goto(base+'?page=practice&mode=bank&case=VC04',{waitUntil:'networkidle'});
 assert.equal(await mob.locator('.case-code').innerText(),'VC04');
 assert.equal(await mob.locator('#bank-random .ui-icon').count(),1);
 await mob.locator('#bank-solution-toggle').click();
 assert.equal(await mob.locator('#bank-solution-toggle').getAttribute('aria-expanded'),'true');
 await mob.screenshot({path:'artifacts/lecture-venture-mobile.png',fullPage:true});
 const widths=await mob.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(widths.document<=widths.viewport+5,JSON.stringify(widths));
 await mob.goto(base+'?page=practice&mode=bank&case=CW-V05',{waitUntil:'networkidle'});
 assert.equal(await mob.locator('.case-code').innerText(),'CW-V05');
 assert.ok(await mob.locator('.case-caution').isVisible());
 assert.equal(await mob.locator('#bank-answer').count(),1);
 const controlWidths=await mob.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(controlWidths.document<=controlWidths.viewport+5,'control valuation mobile overflow: '+JSON.stringify(controlWidths));
 await mob.goto(base+'?page=practice&mode=bank&case=CS02',{waitUntil:'networkidle'});
 await mob.locator('#bank-step-hint').click();
 assert.ok(await mob.locator('.case-hint-panel').isVisible());
 const stage1Widths=await mob.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(stage1Widths.document<=stage1Widths.viewport+5,'CS02 mobile overflow: '+JSON.stringify(stage1Widths));
 await mob.goto(base+'?page=practice&mode=bank&case=S4-01',{waitUntil:'networkidle'});
 assert.equal(await mob.locator('.case-code').innerText(),'S4-01');
 await mob.locator('#section4-learning-path summary').click();
 assert.equal(await mob.locator('#section4-learning-path .section4-path-topic').count(),12);
 const section4Widths=await mob.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(section4Widths.document<=section4Widths.viewport+5,'seminar 4 route mobile overflow: '+JSON.stringify(section4Widths));
 await mob.goto(base+'?page=practice&mode=bank&case=I01',{waitUntil:'networkidle'});
 await mob.locator('#instruments-learning-path summary').click();
 assert.equal(await mob.locator('#instruments-learning-path .section4-path-topic').count(),5);
 const instrumentWidths=await mob.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
 assert.ok(instrumentWidths.doc<=instrumentWidths.viewport+5,'bond/option mobile overflow '+JSON.stringify(instrumentWidths));
 await mobile.close();
 assert.deepEqual(errors,[]);
 console.log('PASS: 111 cases, section 4 linked guide, eight PDF solutions, three-stage hints, advanced LBO, fixed MM/Pecking numeric checks, persistence and mobile styling.');
}finally{await browser?.close();server.kill('SIGTERM');}
