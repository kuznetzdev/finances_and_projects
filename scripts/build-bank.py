#!/usr/bin/env python3
"""Rebuild checked-in case bank from user-provided markdown (requires mistune + bleach)."""
from pathlib import Path
import json, re
import mistune, bleach
root=Path(__file__).resolve().parents[1]
src=root/'docs/CASE_BANK_SOURCE.md'
text=src.read_text(encoding='utf-8')
headings=list(re.finditer(r'^### ([FTV]\d{2})\. ([^\n]+)$',text,re.M))
renderer=mistune.create_markdown(plugins=['table','strikethrough'])
allowed=['p','strong','em','code','pre','ul','ol','li','table','thead','tbody','tr','th','td','blockquote','h1','h2','h3','h4','hr','br','del','a']
def html(s):
 return bleach.clean(renderer(s.strip()),tags=allowed,attributes={'a':['href','title'],'th':['align'],'td':['align']},protocols=['https','http'],strip=True)
def section(block,start_mark,end_mark):
 match=re.search(start_mark,block,re.I)
 if not match:return ''
 after=block[match.end():]
 finish=re.search(end_mark,after,re.I) if end_mark else None
 return after[:finish.start()].strip() if finish else after.strip()
def chunks(solution):
 # Separate numbered derivation steps; keep tables and explanatory paragraphs inside their step.
 parts=[];split=re.split(r'(?m)^\s*(?=\d+\.\s)',solution)
 if len([p for p in split if p.strip()])>=2:
  parts=[p.strip() for p in split if p.strip()]
 else:
  fragments=[p.strip() for p in re.split(r'\n\s*\n',solution) if p.strip()]
  buffer=''
  for p in fragments:
   if buffer and (len(buffer)+len(p)>650 or len(parts)>0 and p.startswith('**')):
    parts.append(buffer);buffer=''
   buffer=(buffer+'\n\n'+p).strip()
  if buffer:parts.append(buffer)
 if len(parts)>14:
  total=len(parts);group=2 if total<=28 else 3
  parts=['\n\n'.join(parts[i:i+group]) for i in range(0,total,group)]
 return [html(part) for part in parts if part.strip()]
records=[]
for i,m in enumerate(headings):
 ending=headings[i+1].start() if i+1<len(headings) else text.find('\n# ',m.end())
 block=text[m.end():ending].strip()
 # The next theme heading / horizontal separator can precede next task; remove trailing section dividers.
 block=re.split(r'(?m)^#{1,2}\s+|\n---\s*\n',block)[0].strip()
 solmark=re.search(r'\*\*Решение[^\n*]*?\*\*',block)
 if not solmark:
  raise ValueError('No solution: '+m.group(1))
 intro=block[:solmark.start()].strip()
 rest=block[solmark.end():].strip()
 answer=re.search(r'(?m)^\*\*Ответ[^\n]*?\*\*',rest)
 # Only split on last ANSWER when it is an actual label, not a part of a warning or narrative.
 if answer:
  solution=rest[:answer.start()].strip()
  summary=rest[answer.start():].strip()
 else:solution=rest;summary=''
 topic_match=re.search(r'\*\*Тем[аы]:\*\*\s*([^\n]+)',intro)
 topic=topic_match.group(1).strip() if topic_match else ''
 intro=re.sub(r'\*\*Тем[аы]:\*\*[^\n]*\n?','',intro).strip()
 caveat=bool(re.search(r'\b(?:недостаточно|не определя|услови[еин] [^\n.]{0,35}оговор|при допущении|исходн[^\n]{0,15}ошиб|альтернативн|неизвестн|зависит от|не указан|нельзя утверждать|не оговор|двояк|неполнот)\b',block,re.I))
 tag=m.group(1)
 caveat = caveat or tag in {'F03','F05','F07','F13','F17','F18','F19','T01','T02','T05','T08','T09','T15','T16','T17','V04','V09','V11','V13','V15','V17','V18','V19','V21'}
 group={'F':'Отчётность и анализ','T':'Деньги и капитал','V':'Оценка бизнеса'}[tag[0]]
 category=({'F':'reporting','T':'capital','V':'value'}[tag[0]])
 records.append(dict(id=tag,title=m.group(2).strip(),group=group,area=category,topic=topic,conditionHtml=html(intro),solutionHtml=html(solution),answerHtml=html(summary),steps=chunks(solution),caveat=caveat,source='Банк задач по корпоративным финансам, редакция 1.1 от 22.10.2026'))
assert len(records)==57,len(records)
assert len(set(x['id'] for x in records))==57
assert all(x['conditionHtml'] and x['solutionHtml'] and x['steps'] for x in records)
out=root/'site/data/case-bank.js'
out.write_text('/* Auto-generated from docs/CASE_BANK_SOURCE.md. Do not edit manually. */\nexport const CASE_BANK = [\n'+',\n'.join(json.dumps(rec,ensure_ascii=False,separators=(',',':')) for rec in records)+'\n];\n',encoding='utf-8')
print('Generated',len(records),'cases,',sum(x['caveat'] for x in records),'flagged,',out.stat().st_size,'bytes')