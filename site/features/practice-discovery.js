/** Practice selectors: a topic, level and optional exercise family remain independently navigable. */
export function practicePool(catalog,{area='all',topic='all',level='all'}={}){
 const max=level==='all'?4:Number(level);
 return catalog.filter(t=>(area==='all'||t.area===area)&&(topic==='all'||t.topic===topic)&&t.min<=max);
}
export function areaCounts(catalog,areas,filters){
 return areas.map(area=>({...area,count:practicePool(catalog,{...filters,area:area.id}).length}));
}
export function choosePracticeLevel(level,minimum){
 return level==='all'?4:Math.max(Number(level),Number(minimum));
}
export function exerciseOptions(catalog,areas,filters){
 const eligible=practicePool(catalog,filters);
 return areas.map(area=>({area,templates:eligible.filter(t=>area.id==='all'?t.area==='all':t.area===area.id)}))
  .filter(group=>group.area.id!=='all'&&group.templates.length);
}
