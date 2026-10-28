import test from 'node:test';
import assert from 'node:assert/strict';
import { generateExercise, TEMPLATE_CATALOG, checkAnswer } from '../site/engine/index.js';
import { templates } from '../site/engine/templates/practice-variants.js';
const near=(actual,expect,where)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expect)<.00003,`${where}: ${actual} != ${expect}`);
const amount=(ex,key)=>{const q=ex.questions.find(q=>q.key===key);assert.ok(q,`${ex.templateId}: no ${key}`);return q.answer;};
const valid=(ex,key,v)=>{if(ex.questions.some(q=>q.key===key))near(amount(ex,key),v,`${ex.templateId}/${key}`);};
const eligible=(ex,key)=>ex.questions.some(q=>q.key===key);

test('New variant registry contains 14 distinct templates mapped to course themes',()=>{
 assert.equal(templates.length,14);
 assert.equal(new Set(templates.map(x=>x.id)).size,templates.length);
 assert.equal(TEMPLATE_CATALOG.length,115);
 for(const t of templates){const entry=TEMPLATE_CATALOG.find(x=>x.id===t.id);assert.ok(entry?.skill && entry.area!=='all',t.id);}
});

test('Thousands of varied scenarios satisfy independently recomputed financial identities',()=>{
 for(const t of templates){
  const contexts=new Set();
  for(let seed=1;seed<=500;seed++){
   const ex=generateExercise({level:4,seed,templateId:t.id,topic:t.topic});
   const ex2=generateExercise({level:4,seed,templateId:t.id,topic:t.topic});
   assert.deepEqual(ex,ex2,t.id+': non-deterministic');
   assert.ok(ex.story.length>=135,t.id);
   assert.ok(ex.explanation.length>=2&&ex.hint.length>=70,t.id);
   assert.ok(ex.questions.length>=3,t.id);
   assert.ok(!/\b(NaN|undefined|Infinity)\b/.test(ex.story+' '+JSON.stringify(ex.questions)),t.id);
   assert.equal(new Set(ex.questions.map(q=>q.key)).size,ex.questions.length,t.id);
   for(const q of ex.questions){
    assert.ok(q.label.length>12,`${t.id}/${q.key}`);
    if(q.type==='number'){
     assert.ok(Number.isFinite(q.answer),`${t.id}/${q.key}`);
     assert.ok(checkAnswer(q,String(q.answer).replace('.',',')),t.id);
     assert.ok(!checkAnswer(q,''),t.id);
    }else{assert.ok(q.choices.includes(q.answer),`${t.id}/${q.key}`);}
   }
   const v=ex.audit;assert.ok(v,t.id);
   contexts.add(ex.story.slice(0,120).replace(/[0-9.,\u00a0\u202f]+/g,'#'));
   switch(t.id){
    case 'x-invoice-payments':
     valid(ex,'revenue',v.sales);valid(ex,'receivable',v.sales*(1-v.share));valid(ex,'profit',v.sales-v.expenses);
     valid(ex,'cfo',v.sales*v.share-v.expenses);
     assert.ok(v.cash>=0&&v.ar>=0&&v.net>=0&&v.expenses>0);break;
    case 'x-prepayment-delivery':
     valid(ex,'received',v.monthly*12);valid(ex,'revenue',v.monthly*v.months);
     valid(ex,'liability',v.monthly*(12-v.months));assert.equal(v.total,v.earned+v.liability);break;
    case 'x-cfo-change-analysis':
     valid(ex,'delta-wc',v.ar+v.inventory-v.payables);
     valid(ex,'cfo',v.profit+v.da-v.ar-v.inventory+v.payables);
     valid(ex,'bridge',v.da-v.ar-v.inventory+v.payables);assert.ok(v.cfo>=0);break;
    case 'x-year-comparison':
     valid(ex,'change',v.current-v.last);
     valid(ex,'growth',(v.current/v.last-1)*100);
     valid(ex,'vertical',v.cogs/v.current*100);
     valid(ex,'gross',v.current-v.cogs);
     assert.ok(v.cogs<v.current);break;
    case 'x-breakeven-units':
     valid(ex,'contribution',v.price-v.unitVariable);
     valid(ex,'units',Math.ceil(v.fixed/v.contribution));
     valid(ex,'revenue',v.units*v.price/1e6);valid(ex,'plan', (v.planned*v.contribution-v.fixed)/1e6);
     assert.ok((v.units-1)*v.contribution<v.fixed+1e-9);
     assert.ok(v.units*v.contribution>=v.fixed);break;
    case 'x-credit-covenants':
     valid(ex,'service',v.interest+v.principal);
     valid(ex,'dscr',v.cfads/(v.interest+v.principal));valid(ex,'icr',v.ebit/v.interest);
     assert.equal(amount(ex,'pass'),v.dscr>=v.threshold?'Да':'Нет');break;
    case 'x-beta-relever-capm':{
     const unlever=v.betaAnalog/(1+(1-v.tax)*v.analogDE);
     const relever=unlever*(1+(1-v.tax)*v.targetDE);
     const re=v.riskFree+relever*v.premium;
     valid(ex,'unlever',unlever);valid(ex,'relever',relever);valid(ex,'re',re);
     valid(ex,'wacc',re/(1+v.targetDE)+(v.targetDE/(1+v.targetDE))*v.rd*(1-v.tax));
     assert.equal(v.tax,.25);break;
    }
    case 'x-bond-clean-price':{
     const coupon=v.nominal*v.couponPct/100,rate=v.yieldPct/100;
     const price=Array.from({length:v.n},(_,i)=>coupon/(1+rate)**(i+1)).reduce((s,x)=>s+x,v.nominal/(1+rate)**v.n);
     valid(ex,'coupon',coupon);valid(ex,'price',price);
     assert.equal(amount(ex,'premium'),price>v.nominal?'Премия':price<v.nominal?'Дисконт':'По номиналу');break;
    }
    case 'x-equivalent-annual-cost':{
     const af=(r,n)=>(1-(1+r)**(-n))/r;
     const pvA=v.capA+v.opexA*af(v.rate,v.lifeA),pvB=v.capB+v.opexB*af(v.rate,v.lifeB);
     valid(ex,'pva',pvA);valid(ex,'pvb',pvB);
     valid(ex,'eaca',pvA/af(v.rate,v.lifeA));valid(ex,'eacb',pvB/af(v.rate,v.lifeB));
     assert.equal(amount(ex,'winner'),v.eacA<v.eacB?'А':'Б');
     assert.ok(Math.abs(v.eacA-v.eacB)>1.9,seed);break;
    }
    case 'x-npv-nwc-return':{
     const initial=v.capex+v.nwc,terminal=v.operating[3]+v.salvage+v.nwc;
     const npv=-initial+v.operating.reduce((s,x,i)=>s+(i===3?terminal:x)/(1+v.rate)**(i+1),0);
     valid(ex,'initial',initial);valid(ex,'terminal',terminal);valid(ex,'npv',npv);
     assert.equal(amount(ex,'decision'),npv>0?'Да':'Нет');break;
    }
    case 'x-dcf-operating-equity':{
     const tv=v.fcff3*(1+v.g)/(v.wacc-v.g);
     const pvT=tv/(1+v.wacc)**3;
     const pv=v.fcff1/(1+v.wacc)+v.fcff2/(1+v.wacc)**2+v.fcff3/(1+v.wacc)**3;
     const ev=pv+pvT;
     valid(ex,'terminal',tv);valid(ex,'pvterminal',pvT);valid(ex,'ev',ev);
     valid(ex,'equity',ev-v.debt+v.cash);
     assert.ok(v.g<v.wacc&&v.equity>0);break;
    }
    case 'x-cash-cycle-factors':
     valid(ex,'before',v.dio+v.dso-v.dpo);
     valid(ex,'after',v.dio-v.shorterInv+v.dso-v.shorterAR-v.dpo-v.longerPay);
     valid(ex,'improve',v.shorterInv+v.shorterAR+v.longerPay);
     assert.ok(v.after>0);break;
    case 'x-venture-next-round':
     valid(ex,'post',v.pre+v.invest);
     valid(ex,'stake',v.invest/(v.pre+v.invest)*100);
     valid(ex,'founders',100-v.invest/(v.pre+v.invest)*100);
     valid(ex,'exit',v.exit*v.invest/(v.pre+v.invest));break;
    case 'x-discount-tax-savings':{
     const shield=v.cost*v.tax;
     assert.ok(Math.abs(v.linShields.reduce((s,x)=>s+x,0)-shield)<.0001);
     assert.ok(Math.abs(v.accShields.reduce((s,x)=>s+x,0)-shield)<.0001);
     const pvA=v.accShields.reduce((s,x,i)=>s+x/(1+v.rate)**(i+1),0);
     const pvL=v.linShields.reduce((s,x,i)=>s+x/(1+v.rate)**(i+1),0);
     valid(ex,'linear',v.cost/v.life);
     valid(ex,'accelerated',v.cost*v.life/(v.life*(v.life+1)/2));
     valid(ex,'tax',v.accShields[0]);valid(ex,'pv-delta',pvA-pvL);
     assert.ok(pvA>pvL&&v.tax===.25);break;
    }
   }
  }
  assert.ok(contexts.size>=2,`${t.id} has no wording variation`);
 }
});

test('Task complexity adds meaningful checked stages and numerical problems remain self-contained',()=>{
 for(const t of templates){
  const sizes=[];
  for(let level=t.min;level<=4;level++){
   const ex=generateExercise({level,seed:49,templateId:t.id});
   sizes.push(ex.questions.length);
   assert.equal(ex.level,level);
   assert.ok(ex.story.includes('₽')||/денежный цикл/.test(ex.title)||/beta/.test(ex.title),t.id);
  }
  assert.ok(sizes.every((n,i)=>i===0||n>=sizes[i-1]),t.id);
 }
});