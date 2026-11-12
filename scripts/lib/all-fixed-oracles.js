/** Authoritative independent math gate for every fixed-case numeric checkpoint. */
import {SOURCE_BANK_REFERENCES} from './source-bank-oracles.js';
import {LECTURE_REFERENCES} from './lecture-fixed-oracles.js';
import {ASSIGNMENT_REFERENCES} from './assignment-fixed-oracles.js';
import {SECTION4_REFERENCES} from './seminar4-fixed-oracles.js';
import {INSTRUMENT_REFERENCES} from './instrument-fixed-oracles.js';
import {CAPITAL_REFERENCES} from './capital-fixed-oracles.js';
import {TAX_DCF_REFERENCES} from './tax-dcf-fixed-oracles.js';
import {CONTROL_WORK_REFERENCES} from './control-work-oracles.js';
import {EXAM_PREP_ORACLES} from './exam-prep-oracles.js';
import {ZACHET50_ORACLES_A} from './zachet50-oracles-a.js';
import {ZACHET50_ORACLES_B} from './zachet50-oracles-b.js';
import {ZACHET51_55_REFERENCES} from './zachet51-55-oracles.js';
import {verifyReferenceSet} from './audit-reference-core.js';
export const FIXED_REFERENCE_GROUPS=Object.freeze({
 'original-bank':SOURCE_BANK_REFERENCES,
 'lecture':LECTURE_REFERENCES,
 'capital-and-assignments':Object.freeze({...CAPITAL_REFERENCES,...ASSIGNMENT_REFERENCES}),
 'seminar4':SECTION4_REFERENCES,
 'instrument':INSTRUMENT_REFERENCES,
 'dcf-and-taxes':TAX_DCF_REFERENCES,
 'control-works':CONTROL_WORK_REFERENCES,
 'exam-prep':EXAM_PREP_ORACLES,
 'exam-prep-50':Object.freeze({...ZACHET50_ORACLES_A,...ZACHET50_ORACLES_B}),
 'exam-prep-51-55':ZACHET51_55_REFERENCES
});
export const ALL_FIXED_REFERENCES=Object.freeze(Object.assign({},...Object.values(FIXED_REFERENCE_GROUPS)));
export function validateAllFixedReferences(cases,checkpoints){
 const errors=[],caseIDs=new Set(),registeredIDs=new Set(),sourceForId=new Map();
 const totals={checkedCases:(cases??[]).length,checkedAnswers:0,coveredAnswers:0,errors};
 for(const [group,references] of Object.entries(FIXED_REFERENCE_GROUPS)){
  for(const id of Object.keys(references)){
   if(sourceForId.has(id)){
    errors.push({code:'ALL_DUPLICATE_ORACLE',message:id+' referenced by '+sourceForId.get(id)+' and '+group});
   }
   sourceForId.set(id,group);
   registeredIDs.add(id);
  }
  const checked=verifyReferenceSet({
   cases,checkpoints,references,code:'FIXED_'+group.replace(/-/g,'_').toUpperCase(),
   roundingPrecision:group==='original-bank'?2:null
  });
  errors.push(...checked);
 }
 for(const c of cases??[]){
  if(caseIDs.has(c.id))errors.push({code:'ALL_DUPLICATE_CASE',message:c.id+' duplicate case'});
  caseIDs.add(c.id);
  const q=checkpoints?.[c.id]??[];
  totals.checkedAnswers+=q.length;
  if(q.length&&!registeredIDs.has(c.id))
   errors.push({code:'ALL_UNMAPPED',message:c.id+' graded answers lack independent references'});
 }
 for(const [id,questions] of Object.entries(checkpoints??{})){
  if(!caseIDs.has(id))errors.push({code:'ALL_ORPHAN',message:id+' checkpoints for missing case'});
 }
 totals.coveredAnswers=Object.values(ALL_FIXED_REFERENCES)
  .reduce((count,questions)=>count+Object.keys(questions).length,0);
 if(totals.checkedAnswers!==totals.coveredAnswers)
  errors.push({code:'ALL_COVERAGE',message:'Expected '+totals.coveredAnswers+' independently derived answers; found '+totals.checkedAnswers});
 return totals;
}
