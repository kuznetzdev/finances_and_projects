/**
 * Reference calculations for DCF questions.
 *
 * Deliberately recompute answers from primitive audit inputs rather than
 * using calculated audit outputs (ev, tv, fcfe, etc.). This is a second
 * implementation of the formulas, NOT a second source of original inputs.
 * It does not prove that the story and primitive audit inputs agree.
 */
export const ORACLE_TEMPLATES = Object.freeze([
  'dcf-fcff-ebitda-tax',
  'dcf-fcfe-equity',
  'dcf-two-stage',
  'dcf-terminal-exit',
  'dcf-midyear',
  'dcf-sensitivity',
  'dcf-income-capitalization'
]);
const supported = new Set(ORACLE_TEMPLATES);
const issue = (code,message) => ({code,message});
const isNumber = value => typeof value === 'number' && Number.isFinite(value);
const present = (v,...fields) => fields.every(key => isNumber(v[key]));
const discounted = (flows,rate,offset=1) =>
  flows.reduce((total,amount,index) => total + amount / Math.pow(1 + rate,index + offset),0);

function referenceAnswers(id,v) {
  switch(id) {
    case 'dcf-fcff-ebitda-tax': {
      if(!present(v,'ebitda','da','capex','nwc','tax'))return null;
      const operating=v.ebitda-v.da;
      return {
        ebit:operating,
        nopat:operating*(1-v.tax),
        fcff:operating*(1-v.tax)+v.da-v.capex-v.nwc,
        'tax-operating':operating*v.tax,
        reinvestment:v.capex+v.nwc,
        'net-reinvestment':v.capex+v.nwc-v.da
      };
    }
    case 'dcf-fcfe-equity': {
      if(!present(v,'fcff','debt','kd','tax','ke','netBorrowing'))return null;
      const afterTaxInterest=v.debt*v.kd*(1-v.tax);
      const available=v.fcff-afterTaxInterest+v.netBorrowing;
      const ownersValue=available/v.ke;
      const businessValue=ownersValue+v.debt;
      return {
        'interest-net':afterTaxInterest,
        fcfe:available,
        equity:ownersValue,
        'net-new-debt':v.netBorrowing,
        'implied-wacc':100*(ownersValue*v.ke+v.debt*v.kd*(1-v.tax))/businessValue
      };
    }
    case 'dcf-two-stage': {
      if(!present(v,'years','first','growth','wacc','g') ||
          !Number.isInteger(v.years) || v.years<1 || v.years>50)return null;
      const series=Array.from({length:v.years},(_,year)=>v.first*Math.pow(1+v.growth,year));
      const forecast=discounted(series,v.wacc);
      const terminal=series[series.length-1]*(1+v.g)/(v.wacc-v.g);
      const todayTerminal=terminal/Math.pow(1+v.wacc,v.years);
      const total=forecast+todayTerminal;
      return {
        'last-fcff':series[series.length-1],
        'pv-explicit':forecast,
        terminal,
        ev:total,
        'terminal-share':100*todayTerminal/total
      };
    }
    case 'dcf-terminal-exit': {
      if(!present(v,'years','first','growth','wacc','exitEbitda','multiple') ||
          !Number.isInteger(v.years) || v.years<1 || v.years>50)return null;
      const flows=Array.from({length:v.years},(_,year)=>v.first*Math.pow(1+v.growth,year));
      const terminal=v.exitEbitda*v.multiple;
      const presentTerminal=terminal/Math.pow(1+v.wacc,v.years);
      return {
        'exit-ebitda':v.exitEbitda,
        tv:terminal,
        'pv-tv':presentTerminal,
        ev:discounted(flows,v.wacc)+presentTerminal
      };
    }
    case 'dcf-midyear': {
      if(!present(v,'years','first','growth','wacc') ||
          !Number.isInteger(v.years) || v.years<1 || v.years>50)return null;
      const annual=Array.from({length:v.years},(_,year)=>v.first*Math.pow(1+v.growth,year));
      const end=discounted(annual,v.wacc);
      const middle=discounted(annual,v.wacc,0.5);
      return {
        'pv-end':end,
        'pv-mid':middle,
        'pv-delta':middle-end,
        'first-mid':v.first/Math.sqrt(1+v.wacc)
      };
    }
    case 'dcf-sensitivity': {
      if(!present(v,'fcff','wacc','g','step'))return null;
      const perpetuity=(rate,growth)=>v.fcff*(1+growth)/(rate-growth);
      const baseline=perpetuity(v.wacc,v.g);
      const raised=perpetuity(v.wacc+v.step,v.g);
      return {
        'ev-base':baseline,
        'ev-rate-up':raised,
        'ev-growth-up':perpetuity(v.wacc,v.g+v.step),
        'ev-growth-down':perpetuity(v.wacc,v.g-v.step),
        'rate-effect':raised-baseline
      };
    }
    case 'dcf-income-capitalization': {
      if(!present(v,'income','wacc','g'))return null;
      return {
        'cap-rate':100*(v.wacc-v.g),
        income:v.income,
        value:v.income/(v.wacc-v.g),
        'value-no-growth':v.income/v.wacc
      };
    }
    default:return null;
  }
}

/**
 * Audit every displayed numerical answer, including additional expert-level
 * questions. Unknown question keys fail closed so new questions require an
 * explicit oracle update rather than silently losing coverage.
 */
export function validateFinanceOracle(ex) {
  const id=ex?.templateId;
  if(!supported.has(id))return [];
  const ref=referenceAnswers(id,ex.audit??{});
  if(!ref)return [issue('ORACLE_INPUTS',id+': missing or invalid reference inputs')];
  const errors=[];
  const questions=ex.questions??[];
  for(const q of questions){
    if(q.type!=='number'){
      errors.push(issue('ORACLE_UNMAPPED',id+'/'+q.key+': expected numeric DCF question'));
      continue;
    }
    if(!Object.hasOwn(ref,q.key)){
      errors.push(issue('ORACLE_UNMAPPED',id+'/'+q.key+': no independent formula'));
      continue;
    }
    const actual=q.answer,expected=ref[q.key];
    if(!isNumber(actual)||!isNumber(expected)){
      errors.push(issue('ORACLE_NONFINITE',id+'/'+q.key+': non-finite reference or answer'));
      continue;
    }
    // Generator rounds answers to five decimals; tolerance here is much
    // stricter than the student's answer-entry tolerance.
    const allowed=Math.max(0.000015,Math.abs(expected)*1e-9);
    if(Math.abs(actual-expected)>allowed)
      errors.push(issue('ORACLE_MISMATCH',id+'/'+q.key+': got '+actual+'; reference '+expected));
  }
  return errors;
}
