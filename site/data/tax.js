/** Tax policy for educational use. Keep fiscal data outside template implementations. */
export const TAX_POLICIES = Object.freeze({
  'RU-2026': Object.freeze({
    jurisdiction: 'RU', year: 2026, profitRate: 0.25, vatRate: 0.22, insuranceThreshold: 2979000,
    insuranceBaseRate: 0.30, insuranceOverRate: 0.151,
    salaryBands: [{ limit: 2400000, rate: .13 }, { limit: 5000000, rate: .15 }, { limit: 20000000, rate: .18 }, { limit: 50000000, rate: .20 }, { limit: Infinity, rate: .22 }],
    sources: {
      profit: 'https://www.nalog.gov.ru/rn77/taxation/taxes/profitul/',
      vat: 'https://www.nalog.gov.ru/new2026/',
      income: 'https://www.nalog.gov.ru/nu/',
      insurance: 'https://www.nalog.gov.ru/rn32/news/seminar/16602155/'
    },
    notes: 'Учебная модель: общие ставки для стандартного режима, без льгот, исключений и специальных налоговых баз.'
  }),
  'RU-2025': Object.freeze({
    jurisdiction: 'RU', year: 2025, profitRate: 0.25, vatRate: 0.20,
    sources: { profit: 'https://www.nalog.gov.ru/rn77/taxation/taxes/profitul/', vat: 'https://www.nalog.gov.ru/new2026/' },
    notes: 'Исторический учебный пример, не применять как ставку НДС 2026 года.'
  })
});
export const DEFAULT_TAX_POLICY = 'RU-2026';
export function policyFor(id = DEFAULT_TAX_POLICY) {
  const p = TAX_POLICIES[id]; if (!p) throw new Error(`Unknown tax policy: ${id}`); return p;
}
export function progressiveTax(base, bands) {
  let previous = 0, total = 0;
  for (const { limit, rate } of bands) { const taxable = Math.max(0, Math.min(base, limit) - previous); total += taxable * rate; previous = limit; if (base <= limit) break; }
  return total;
}
export function insuranceContributions(salary, policy = policyFor()) {
  return Math.min(salary, policy.insuranceThreshold) * policy.insuranceBaseRate + Math.max(0, salary - policy.insuranceThreshold) * policy.insuranceOverRate;
}
