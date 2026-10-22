/** Pure random-selection helpers. A history never changes the answer to a shared, seeded exercise. */
import { rng } from './helpers.js';
export function shuffle(items, random=Math.random) {
  const result=[...items];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function shuffledBySeed(items, seed){return shuffle(items,rng(seed));}
/** Avoid the last N identifiers where there is a choice; softly penalize recent exposure. */
export function chooseFresh(items, history=[], random=Math.random, key=x=>x.id, window=6){
  if(!items.length)throw new Error('Нечего выбирать');
  if(items.length===1)return items[0];
  const previous=history.filter(x=>typeof x==='string');
  const ban=new Set(previous.slice(-Math.min(window,items.length-1)));
  const options=items.filter(x=>!ban.has(key(x)));
  const pool=options.length?options:items.filter(x=>key(x)!==previous.at(-1));
  const weighted=pool.map(x=>({x,weight:1/(1+previous.slice(-18).filter(h=>h===key(x)).length*3)}));
  const sum=weighted.reduce((a,v)=>a+v.weight,0);
  let threshold=random()*sum;
  for(const item of weighted){threshold-=item.weight;if(threshold<0)return item.x;}
  return weighted.at(-1).x;
}
export const recordRecent=(history,id,max=18)=>[...history.filter(x=>typeof x==='string'),id].slice(-max);
export function newDeck(items, previousId=null, random=Math.random){
  const shuffled=shuffle(items,random);
  if(shuffled.length>1&&shuffled[0]?.id===previousId){
    const j=1+Math.floor(random()*(shuffled.length-1));[shuffled[0],shuffled[j]]=[shuffled[j],shuffled[0]];
  }
  return shuffled.map(x=>x.id);
}
