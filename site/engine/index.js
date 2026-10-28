import { TOPICS as OLD_TOPICS, LEVELS, TEMPLATE_CATALOG as OLD_CATALOG, generateExercise as oldGenerate } from './legacy.js';
import { templates as taxTemplates } from './templates/taxes.js';
import { templates as valuationTemplates } from './templates/valuation.js';
import { templates as ratioTemplates } from './templates/ratios.js';
import { templates as modelTemplates } from './templates/modeling.js';
import { templates as reasoningTemplates } from './templates/reasoning.js';
import { rng, oneOf } from './helpers.js';
import { templates as bankTemplates } from './templates/bank-derived.js';
import { templates as advancedTemplates } from './templates/advanced.js';
import { templates as practiceVariants } from './templates/practice-variants.js';
import { templates as taxAdvancedTemplates } from './templates/tax-advanced.js';
import { templates as capitalStructureTemplates } from './templates/capital-structure.js';
import { curriculumFor } from '../data/curriculum.js';
import { DEFAULT_TAX_POLICY, policyFor } from '../data/tax.js';

/** Public contract. A new task module only exports {templates:[{id,topic,min,build}]}.
 * Register its array below. UI and checking are independent of task families. */
const plugins = [...valuationTemplates, ...taxTemplates, ...ratioTemplates, ...modelTemplates, ...reasoningTemplates, ...advancedTemplates, ...bankTemplates, ...practiceVariants, ...taxAdvancedTemplates, ...capitalStructureTemplates];
const allIds = [...OLD_CATALOG.map(t => t.id), ...plugins.map(t => t.id)];
if (new Set(allIds).size !== allIds.length) throw new Error('Duplicate exercise IDs in registry');
const byId = new Map(plugins.map(t => [t.id, t]));
export const TOPICS = [
  { id: 'all', name: 'Все темы', short: 'Все', code: '∞' },
  { id: 'pl', name: 'Прибыль и P&L', short: 'P&L', code: '01' },
  { id: 'cash', name: 'Денежные потоки', short: 'Cash Flow', code: '02' },
  { id: 'balance', name: 'Бухгалтерский баланс', short: 'Баланс', code: '03' },
  { id: 'links', name: 'Связь трёх форм', short: 'Три формы', code: '04' },
  { id: 'valuation', name: 'Оценка и инвестиции', short: 'Оценка', code: '05' },
  { id: 'tax', name: 'Налоги', short: 'Налоги', code: '06' },
  { id: 'ratios', name: 'Коэффициенты', short: 'Коэфф.', code: '07' },
  { id: 'model', name: 'Финансовая модель', short: 'Модель', code: '08' }
];
export { LEVELS };
export const TEMPLATE_CATALOG = [...OLD_CATALOG, ...plugins.map(x => ({ id: x.id, topic: x.topic, min: x.min, extra: false }))].map(x => ({...x, ...curriculumFor(x.id,x.topic)}));
export const ENGINE_VERSION = '8.0';

export function generateExercise({ topic = 'all', level = 1, seed = 1, templateId = null, area = 'all', policy = DEFAULT_TAX_POLICY } = {}) {
  const lvl = Math.max(1, Math.min(4, Number(level) || 1)), s = (Number(seed) >>> 0) || 1;
  const available = TEMPLATE_CATALOG.filter(t => (topic === 'all' || t.topic === topic) && (area === 'all' || t.area === area) && t.min <= lvl);
  if (!available.length) throw new Error('Нет заданий для выбранного фильтра');
  const found = templateId ? available.find(t => t.id === templateId) : null;
  const selected = found || oneOf(rng(s), available);
  if (!byId.has(selected.id)) return { ...oldGenerate({ topic: selected.topic, level: lvl, seed: s, templateId: selected.id }), ...curriculumFor(selected.id, selected.topic) };
  const t = byId.get(selected.id), r = rng(s), tax = policyFor(policy), out = t.build(r, lvl, { tax });
  if (!Array.isArray(out.questions) || !out.questions.length) throw new Error('Invalid exercise questions: ' + selected.id);
  return { ...out, seed: s, templateId: t.id, level: lvl, taxPolicy: policy, ...curriculumFor(t.id,t.topic) };
}
export function checkAnswer(question, raw) {
  if (question.type === 'choice') return String(raw).trim() === String(question.answer);
  if (question.type === 'multi') { const given = Array.isArray(raw) ? raw : [], unique = new Set(given); return unique.size === question.answer.length && given.length === unique.size && given.every(x => question.answer.includes(x)); }
  if (raw == null || String(raw).trim() === '') return false;
  const normalized = String(raw).trim().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return false;
  const answer = Number(normalized);
  return Number.isFinite(answer) && Math.abs(answer - question.answer) <= (question.tolerance ?? .021) + 1e-9;
}
export function formatAnswer(q) { return q.type === 'multi' ? q.answer.join('; ') : q.type === 'choice' ? String(q.answer) : `${Number(q.answer.toFixed(3)).toLocaleString('ru-RU', { maximumFractionDigits: 3 })} ${q.unit}`; }