/** Statistics are recorded per submitted exercise, never for skips or screen visits. */
const fresh=()=>({attempts:0,perfect:0,questions:0,correct:0});
export function recordPracticeResult(stats,exercise,correct,total){
 const area=exercise.area||'other',topic=exercise.topic||'other';
 for(const [key,id] of [['byArea',area],['byTopic',area+'::'+topic]]){
  const base=stats[key]&&typeof stats[key]==='object'?stats[key]:{};
  const row=base[id]&&Number.isFinite(base[id].attempts)?base[id]:fresh();
  base[id]={attempts:row.attempts+1,perfect:row.perfect+Number(correct===total),questions:row.questions+total,correct:row.correct+correct};
  stats[key]=base;
 }
}
export const retryArea=(retry,catalog,id)=>retry.filter(item=>(item.area||catalog.find(x=>x.id===item.templateId)?.area||'other')===id);
export const retryTopic=(retry,catalog,area,topic)=>retryArea(retry,catalog,area).filter(x=>x.topic===topic);
export function progressRows(stats,areas,topics,catalog){
 const areaRows=areas.filter(a=>a.id!=='all').map(a=>{
  const r=stats.byArea?.[a.id]||fresh();
  const pending=retryArea(stats.retry||[],catalog,a.id);
  return {...a,...r,accuracy:r.questions?Math.round(100*r.correct/r.questions):null,pending:pending.length,
   topics:topics.filter(t=>t.id!=='all'&&catalog.some(x=>x.area===a.id&&x.topic===t.id)).map(t=>{
    const q=stats.byTopic?.[a.id+'::'+t.id]||fresh();
    return {...t,...q,accuracy:q.questions?Math.round(100*q.correct/q.questions):null,pending:retryTopic(pending,catalog,a.id,t.id).length};
   }).filter(t=>t.attempts||t.pending).sort((a,b)=>(a.accuracy??101)-(b.accuracy??101)||b.pending-a.pending)};
 });
 return areaRows.sort((a,b)=>(a.accuracy??101)-(b.accuracy??101)||b.pending-a.pending);
}
export function nextRetry(retry,catalog,area='all',topic='all'){
 return retry.find(item=>{
  const a=item.area||catalog.find(x=>x.id===item.templateId)?.area||'other';
  return (area==='all'||a===area)&&(topic==='all'||item.topic===topic);
 })||null;
}
