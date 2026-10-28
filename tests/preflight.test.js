import test from 'node:test';
import assert from 'node:assert/strict';
import {validateExercise,validateDcfAudit,validateCatalog,preflight} from '../scripts/lib/preflight.js';
import {formulaMarkup} from '../site/features/math-ui.js';
import {generateExercise,TEMPLATE_CATALOG} from '../site/engine/index.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('Preflight catches broken answers, duplicated keys, invalid choices and nonfinite values',()=>{
 const good={templateId:'sample',title:'Тестовая задача с корректным ответом',story:'Дано корректное описание проектной задачи с исходными данными.',questions:[{key:'v',label:'Выручка предприятия',answer:100,type:'number',unit:'млн ₽',tolerance:.02}],explanation:['Первый шаг','Второй шаг'],hint:'Сопоставьте данные',source:'Учебная задача'};
 assert.deepEqual(validateExercise(good),[]);
 const broken={...good,questions:[{...good.questions[0],answer:NaN},{...good.questions[0]},{key:'k',label:'Выбор',type:'choice',answer:'Нет',choices:['Да','Да']}]};
 const codes=validateExercise(broken).map(x=>x.code);
 for(const code of ['ANSWER_NONFINITE','DUPLICATE_KEY','CHOICE_INVALID'])assert.ok(codes.includes(code),code);
});
test('Preflight catches financial inconsistency even when all numbers are finite',()=>{
 const ex=generateExercise({templateId:'dcf-two-stage',topic:'valuation',level:4,seed:8});
 assert.deepEqual(validateDcfAudit(ex),[]);
 const wrong={...ex,audit:{...ex.audit,ev:ex.audit.ev*1.25}};
 assert.ok(validateDcfAudit(wrong).some(x=>x.code==='DCF_IDENTITY'));
 const illegal={...ex,audit:{...ex.audit,g:ex.audit.wacc}};
 assert.ok(validateDcfAudit(illegal).some(x=>x.code==='DCF_GROWTH'));
});
test('Preflight validates the entire registry, all answers and financial seed scenarios',()=>{
 const result=preflight({seeds:12});
 assert.equal(result.errors.length,0,JSON.stringify(result.errors.slice(0,5)));
 assert.equal(result.checkedTemplates,TEMPLATE_CATALOG.length);
 assert.ok(result.checkedExercises>=TEMPLATE_CATALOG.length);
 assert.ok(result.checkedCases>=74);
 assert.ok(result.checkedConcepts>=236);
 assert.ok(result.checkedFormulas>=195);
 assert.ok(result.checkedFiles>20);
});
test('Catalog guard detects invalid or duplicate structural records',()=>{
 assert.ok(validateCatalog([{id:'x',topic:'valuation'},{id:'x',topic:'valuation'}]).some(e=>e.code==='DUPLICATE_TEMPLATE'));
});
test('Summation limits, numerator denominator and subscripts render semantically and safely',()=>{
 const formula='EV = Σ[t=1..n] FCFF_t / (1+WACC)^t + TV_n / (1+WACC)^n';
 const markup=formulaMarkup(formula,esc);
 assert.match(markup,/math-sum/);
 assert.match(markup,/math-limit-low/);
 assert.match(markup,/math-limit-high/);
 assert.match(markup,/math-fraction/);
 assert.match(markup,/<sub>t<\/sub>/);
 assert.match(markup,/<sup>t<\/sup>/);
 assert.match(markup,/role="math"/);
 assert.match(markup,/aria-label="EV = Σ/);
 assert.ok(!markup.includes('<script>'));
});
