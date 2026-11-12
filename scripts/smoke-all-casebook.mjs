/** Browser QA of the entire fixed bank and every graded exam-prep step.
 * Run after: npm install --no-save playwright-core@1.56.0
 */
import {spawn} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright-core';
import {CASE_BANK,CASE_CHECKPOINTS} from '../site/engine/casebook.js';
import {EXAM_PREP_CASE_IDS} from './lib/exam-prep-oracles.js';
const PORT=8771,base='http://127.0.0.1:'+PORT+'/';
const executablePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
if(!executablePath)throw Error('Chromium executable missing');
mkdirSync('artifacts',{recursive:true});
const server=spawn('python3',['-m','http.server',String(PORT),'-d','site'],{stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let i=0;i<50;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await delay(200);}
 assert.ok(ready,'HTTP server unavailable');
 browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const desktop=await browser.newContext({viewport:{width:1280,height:840}});
 const page=await desktop.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 let inspected=0,answered=0,examAnswers=0;
 for(const item of CASE_BANK){
  const url=base+'?page=practice&mode=bank&case='+encodeURIComponent(item.id);
  const response=await page.goto(url,{waitUntil:'domcontentloaded'});
  assert.equal(response?.status(),200,item.id+' response');
  await page.locator('.case-code').waitFor({state:'visible',timeout:10000});
  assert.equal(await page.locator('.case-code').innerText(),item.id,item.id+' must resolve');
  assert.ok((await page.locator('.case-condition').innerText()).trim().length>40,item.id+' missing condition');
  assert.ok((await page.locator('.case-footnote').innerText()).trim().length>10,item.id+' missing source');
  await page.locator('#bank-solution-toggle').click();
  assert.ok((await page.locator('.case-full-solution').innerText()).length>40,item.id+' missing full solution');
  inspected++;
  const questions=CASE_CHECKPOINTS[item.id];
  if(!questions?.length)continue;
  const exam=EXAM_PREP_CASE_IDS.includes(item.id);
  await page.locator('#bank-solution-toggle').click();
  if(exam)assert.ok(questions.length>=4,item.id);
  for(let i=0;i<questions.length;i++){
   const q=questions[i];
   assert.equal(await page.locator('.case-step-heading h3').innerText(),q.label,item.id+' step '+i);
   if(item.id==='PREP26-03' && i===0){
    // Numeric field has one external focus ring; units stay in their own area.
    const focus=await page.locator('#bank-answer').evaluate(input=>{
     input.focus();
     const wrap=input.closest('.case-number-wrap'),unit=wrap.querySelector('span');
     return {
      innerOutline:getComputedStyle(input).outlineStyle,
      outerOutline:getComputedStyle(wrap).outlineStyle,
      unitLeft:unit.getBoundingClientRect().left,
      inputRight:input.getBoundingClientRect().right,
      unitRight:unit.getBoundingClientRect().right,
      wrapRight:wrap.getBoundingClientRect().right
     };
    });
    assert.equal(focus.innerOutline,'none','numeric input must not draw an orange focus rectangle inside its wrapper');
    assert.equal(focus.outerOutline,'solid','external visible keyboard focus indicator must remain');
    assert.ok(focus.unitLeft>=focus.inputRight-1&&focus.unitRight<=focus.wrapRight+1,
     'units must remain readable beside the entry area '+JSON.stringify(focus));
    await page.screenshot({path:'artifacts/exam-input-focus-desktop.png'});
   }
   if(exam){
    await page.locator('#bank-step-hint').click();
    assert.equal(await page.locator('#bank-step-hint').getAttribute('aria-expanded'),'true',item.id+' hint 1');
    await page.locator('#bank-step-hint').click();
    assert.ok(await page.locator('.case-hint-panel').isVisible(),item.id+' hint 2');
    await page.locator('#bank-step-hint').click();
    assert.ok(await page.locator('.case-hint-panel').isVisible(),item.id+' hint 3');
    await page.locator('#bank-step-hint').click();
    assert.equal(await page.locator('.case-hint-panel').count(),0,item.id+' hints hide');
   }
   await page.locator('#bank-answer').fill(String(q.answer));
   await page.locator('#bank-answer-form button[type="submit"]').click();
   assert.match(await page.locator('#bank-feedback').innerText(),/Верно/,item.id+' / '+q.label);
   answered++;if(exam)examAnswers++;
   if(i+1<questions.length)await page.locator('#bank-next').click();
  }
  assert.equal(await page.locator('#bank-complete').isEnabled(),true,item.id+' mark complete');
  assert.equal(await page.locator('.case-workpad-head strong').innerText(),questions.length+'/'+questions.length,item.id+' progress');
  if(item.id==='PREP26-13')await page.screenshot({path:'artifacts/exam-all-steps-desktop.png',fullPage:true});
 }
 assert.equal(inspected,179,'all 179 bank cases must render');
 assert.equal(answered,Object.values(CASE_CHECKPOINTS).reduce((n,questions)=>n+questions.length,0),'all numeric answers graded in browser');
 assert.equal(examAnswers,EXAM_PREP_CASE_IDS.reduce((n,id)=>n+CASE_CHECKPOINTS[id].length,0),'all exam answers graded');
 assert.deepEqual(errors,[],'app console and runtime errors');
 await desktop.close();
 const mobile=await browser.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true});
 const mob=await mobile.newPage();
 const mobileErrors=[];
 mob.on('pageerror',e=>mobileErrors.push(e.message));
 for(const id of ['PREP26-01','PREP26-02','PREP26-03','PREP26-05','PREP26-07','PREP26-09','PREP26-11','PREP26-12','PREP26-13']){
  await mob.goto(base+'?page=practice&mode=bank&case='+encodeURIComponent(id),{waitUntil:'domcontentloaded'});
  await mob.locator('.case-code').waitFor();
  assert.equal(await mob.locator('.case-code').innerText(),id);
  if(id==='PREP26-03'){
   const bounds=await mob.locator('.case-number-wrap').evaluate(wrap=>{
    const input=wrap.querySelector('input'),unit=wrap.querySelector('span');
    const parent=wrap.getBoundingClientRect(),u=unit.getBoundingClientRect(),i=input.getBoundingClientRect();
    return {unitLeft:u.left,unitRight:u.right,inputRight:i.right,wrapRight:parent.right};
   });
   assert.ok(bounds.unitLeft>=bounds.inputRight-1&&bounds.unitRight<=bounds.wrapRight+1,
    'mobile units clipped or overlapping input '+JSON.stringify(bounds));
   await mob.locator('#bank-answer').focus();
   assert.equal(await mob.locator('#bank-answer').evaluate(el=>getComputedStyle(el).outlineStyle),'none');
   await mob.screenshot({path:'artifacts/exam-input-focus-mobile.png'});
  }
  const widths=await mob.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert.ok(widths.document<=widths.viewport+5,id+' mobile horizontal overflow '+JSON.stringify(widths));
 }
 await mob.locator('#bank-solution-toggle').click();
 await mob.screenshot({path:'artifacts/exam-final-case-mobile.png',fullPage:true});
 assert.deepEqual(mobileErrors,[]);
 await mobile.close();
 console.log('PASS: browser opened '+inspected+'/179 fixed cases, viewed every full solution, graded '+answered+' fixed checkpoints including '+examAnswers+' exam checkpoints with three hint levels; '+9+' exam mobile pages checked.');
}finally{
 await browser?.close();
 server.kill('SIGTERM');
}
