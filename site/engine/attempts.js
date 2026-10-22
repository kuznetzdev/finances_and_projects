/** Neutral navigation actions. A skipped item is neither solved nor answered incorrectly. */
const FIELDS = Object.freeze({ task: 'skippedTasks', quiz: 'skippedQuizzes', case: 'skippedCases' });

export function recordSkip(stats, kind) {
  const field = FIELDS[kind];
  if (!field) throw new TypeError(`Unknown skip kind: ${kind}`);
  const previous = Number(stats[field]);
  stats[field] = (Number.isSafeInteger(previous) && previous >= 0 ? previous : 0) + 1;
  return stats[field];
}

export function totalSkipped(stats) {
  return Object.values(FIELDS).reduce((total, field) => total + (Number(stats[field]) || 0), 0);
}