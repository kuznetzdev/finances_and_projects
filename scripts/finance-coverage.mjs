#!/usr/bin/env node
/**
 * Reproducible coverage matrix for the registered exercise catalog.
 * The matrix distinguishes a checked student-facing answer from a
 * financial identity check and from generic answer validation.
 */
import {mkdirSync,writeFileSync} from 'node:fs';
import {TEMPLATE_CATALOG,generateExercise} from '../site/engine/index.js';
import {ORACLE_TEMPLATES} from './lib/finance-oracles.js';
import {BASIC_ORACLE_TEMPLATES} from './lib/basic-finance-oracles.js';
import {TAX_MODEL_ORACLE_TEMPLATES} from './lib/tax-model-oracles.js';
import {INSTRUMENT_ORACLE_TEMPLATES} from './lib/instrument-oracles.js';

const oracle=new Set([...ORACLE_TEMPLATES,...BASIC_ORACLE_TEMPLATES,...TAX_MODEL_ORACLE_TEMPLATES,...INSTRUMENT_ORACLE_TEMPLATES]);
const domainIds=new Set([
  ...ORACLE_TEMPLATES,...INSTRUMENT_ORACLE_TEMPLATES,
  'capital-financing-match','capital-roa-debt-roe','capital-wacc-dynamic',
  'capital-mm-tax','capital-tradeoff','capital-pecking-order','capital-waterfall',
  'tax-depreciation-method-comparison','tax-temporary-differences',
  'tax-payments-schedule','tax-loss-carryforward'
]);
const moduleFor=id=>{
  if(/^(pl-|cash-|balance-|links-|valuation-)/.test(id))return 'legacy.js';
  const prefixes=[
    ['bond-','instruments.js'],['option-','instruments.js'],['dcf-','dcf-advanced.js'],['capital-','capital-structure.js'],
    ['tax-','tax-advanced.js'],['x-','practice-variants.js'],
    ['bank-','bank-derived.js'],['logic-','reasoning.js'],
    ['v-','valuation.js'],['t-','taxes.js'],['r-','ratios.js'],
    ['m-','modeling.js'],['a-','advanced.js']
  ];
  return prefixes.find(([prefix])=>id.startsWith(prefix))?.[1]??'unknown';
};
const quote=x=>String(x??'').replace(/\|/g,'\\|').replace(/\n/g,' ');
const rows=[];
for(const t of TEMPLATE_CATALOG){
  const questions=new Set();
  const audits=new Set(),inputFields=new Set();
  for(const level of new Set([t.min,4])){
    for(const seed of [1,17]){
      const e=generateExercise({templateId:t.id,topic:t.topic,level,seed});
      for(const q of e.questions){
        questions.add(q.key+':'+q.type);
      }
      if(e.audit)Object.keys(e.audit).forEach(k=>audits.add(k));
      if(e.inputs)Object.keys(e.inputs).forEach(k=>inputFields.add(k));
    }
  }
  const status=oracle.has(t.id)?'independent-answer-oracle':
    domainIds.has(t.id)?'preflight-domain-identity':
    t.id.startsWith('x-')?'separate-numeric-tests':
    audits.size?'audit-data-only':'generic-only';
  rows.push({
    id:t.id,topic:t.topic,minLevel:t.min,module:moduleFor(t.id),
    status,questionKeys:[...questions].sort(),auditFields:[...audits].sort(),inputFields:[...inputFields].sort(),
    independentAnswerOracle:oracle.has(t.id),
    preflightDomainIdentity:domainIds.has(t.id)
  });
}
if(new Set(rows.map(r=>r.id)).size!==TEMPLATE_CATALOG.length)throw Error('Duplicate or lost template in coverage matrix');
for(const id of oracle)if(!rows.some(r=>r.id===id))throw Error('Orphan finance oracle '+id);
if(oracle.size!==ORACLE_TEMPLATES.length+BASIC_ORACLE_TEMPLATES.length+TAX_MODEL_ORACLE_TEMPLATES.length+INSTRUMENT_ORACLE_TEMPLATES.length)throw Error('Oracle template IDs overlap');

const counts=Object.fromEntries([...new Set(rows.map(r=>r.status))].sort().map(
  s=>[s,rows.filter(r=>r.status===s).length]
));
const summary={total:rows.length,counts,rows};
const md=[
  '# Матрица проверки финансовых генераторов',
  '',
  'Автоматически сформировано из текущего TEMPLATE_CATALOG. Вывод не следует редактировать вручную.',
  '',
  'Статусы: independent-answer-oracle = независимый пересчёт каждого числового ответа в preflight;',
  'preflight-domain-identity = проверка финансовых тождеств по audit, но не всех отображаемых ответов;',
  'separate-numeric-tests = отдельные числовые тесты, ещё без единого oracle в preflight;',
  'audit-data-only = audit есть, но универсальный независимый oracle не назначен;',
  'generic-only = только структурные и числовые общие проверки.',
  '',
  'Всего шаблонов: '+rows.length+'.',
  '',
  '| ID | Файл | Тема | Мин. уровень | Тип контроля | Вопросы | Данные audit | Исходные inputs |',
  '| --- | --- | --- | ---: | --- | --- | --- | --- |',
  ...rows.map(r=>'| '+[r.id,r.module,r.topic,r.minLevel,r.status,
    r.questionKeys.join(', '),r.auditFields.join(', ')||'нет',r.inputFields.join(', ')||'нет'].map(quote).join(' | ')+' |'),
  ''
].join('\n');
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/finance-coverage.json',JSON.stringify(summary,null,2)+'\n');
writeFileSync('artifacts/finance-coverage.md',md);
console.log('Finance coverage: '+rows.length+' templates; '+JSON.stringify(counts));
