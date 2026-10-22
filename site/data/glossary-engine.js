/** Single source of truth for canonical terms, synonyms and formula variants. */
import { GLOSSARY_FORMULAS, GLOSSARY_ENRICHMENTS } from './glossary-formulas.js';
export const normalizeTerm = text => String(text??'').normalize('NFKC').toLocaleLowerCase('ru')
  .replace(/ё/g,'е').replace(/[‐‑–—−]/g,'-').replace(/\s+/g,' ').trim();

export function enrichConcepts(items) {
  return items.map(x=>{
    const extra=GLOSSARY_ENRICHMENTS[x.id]||{};
    const aliases=[...(x.aliases||[]),...(extra.aliases||[])];
    const normalized=new Set([normalizeTerm(x.term)]);
    const clean=aliases.map(s=>String(s).trim()).filter(s=>{
      const term=normalizeTerm(s);
      if(!term||normalized.has(term))return false;
      normalized.add(term);return true;
    });
    const result={...x,aliases:clean,formulas:GLOSSARY_FORMULAS[x.id]||x.formulas||[],note:extra.note||x.note||''};
    return result;
  });
}

export function searchConcepts(items,query='',group='Все',abbreviationFor=()=>null) {
  const q=normalizeTerm(query);
  const found=items.filter(x=>{
    if(group!=='Все'&&x.group!==group)return false;
    if(!q)return true;
    const ab=abbreviationFor(x.term)||{};
    const haystack=[x.term,x.definition,x.contrast,x.group,x.note,...(x.aliases||[]),
      ab.english,ab.russian,...(x.formulas||[]).flatMap(f=>[f.title,f.expression,f.explanation])].filter(Boolean).map(normalizeTerm).join(' · ');
    return haystack.includes(q);
  });
  if(!q)return found;
  const rank=x=>{
    if(normalizeTerm(x.term)===q)return 0;
    if((x.aliases||[]).some(a=>normalizeTerm(a)===q))return 1;
    if(normalizeTerm(x.term).startsWith(q))return 2;
    if((x.aliases||[]).some(a=>normalizeTerm(a).startsWith(q)))return 3;
    return 4;
  };
  return found.map((x,i)=>({x,i})).sort((a,b)=>rank(a.x)-rank(b.x)||a.i-b.i).map(a=>a.x);
}

export function glossaryIntegrity(items){
  const errors=[], ids=new Set(),canonical=new Map(),labels=new Map();
  for(const x of items){
    if(ids.has(x.id))errors.push(`Повтор ID: ${x.id}`);ids.add(x.id);
    const name=normalizeTerm(x.term);
    if(canonical.has(name))errors.push(`Дубликат термина: ${x.term} (${canonical.get(name)} / ${x.id})`);
    canonical.set(name,x.id);
    if(!x.definition||x.definition.length<30)errors.push(`Короткое определение: ${x.id}`);
    for(const k of [x.term,...(x.aliases||[])]){
      const a=normalizeTerm(k);if(!a)continue;
      if(labels.has(a)&&labels.get(a)!==x.id)errors.push(`Неоднозначный синоним: ${k} (${labels.get(a)} / ${x.id})`);
      labels.set(a,x.id);
    }
    for(const f of x.formulas||[]){
      if(!f.title||!f.expression||!f.explanation)errors.push(`Неполная формула: ${x.id}`);
      if(f.expression.includes('undefined')||f.expression.includes('NaN'))errors.push(`Плохая формула: ${x.id}`);
    }
  }
  for(const [alias,id] of labels){if(canonical.has(alias)&&canonical.get(alias)!==id)errors.push(`Синоним пересекает основной термин: ${alias}`);}
  return [...new Set(errors)];
}