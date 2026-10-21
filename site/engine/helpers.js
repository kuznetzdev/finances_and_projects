/** Seeded random and exact-answer shapes. No browser dependencies. */
export function rng(seed){let a=(Number(seed)>>>0)||1;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export const round=(x,places=4)=>Number(x.toFixed(places));
export const fmt=(v,places=2)=>Number(v.toFixed(places)).toLocaleString('ru-RU',{maximumFractionDigits:places});
export const randomInt=(r,min,max)=>min+Math.floor(r()*(max-min+1));
export const oneOf=(r,items)=>items[Math.floor(r()*items.length)];
export const num=(key,label,answer,unit='млн ₽',tolerance=.021)=>({key,label,answer:round(answer,5),unit,tolerance,type:'number'});
export const choice=(key,label,answer,choices)=>({key,label,answer,choices,type:'choice'});
export const exercise=(id,topic,title,story,questions,hint,explanation,source,level)=>({id,topic,title,story,questions,hint,explanation,source,level});
