import test from 'node:test';
import assert from 'node:assert/strict';
import {ZACHET50_CASES_A} from '../site/data/zachet50-part-a.js';
import {ZACHET50_CASES_B} from '../site/data/zachet50-part-b.js';

/** Fingerprints from 50_задач_для_подготовки_к_зачету2.docx, normalized
 * to single whitespace in each task body. Source DOCX SHA-256:
 * b58e9b70d72a225c885c7e80eb557767676927def8c1ee5f45f75290a6ea0e03
 * Verifies source text and every original number, not solution narrative.
 */
const originals=["17b450a4","dece0a5d","1e6a61a3","cc07072a","bd7aa00e","b524330e","6af38108","2624b674","0a1bdaff","202879db","668337a8","22a53ff3","0c415730","306bb527","aed9f733","57e43e7b","5bd3a9a4","db0e3148","40b04eca","3e1708dc","bb9bae20","02b3c02a","d78063f8","a70f572c","ac5f68eb","77c7d459","f0ee4bb7","6c32dfd6","bb844799","873966c0","4ea1812c","407e5b0b","9d2b4c2f","8c55159d","22975580","a35b08d8","e0264713","fc9da171","a2d75b02","529ccf07","017a21c0","0c42348b","f4ac3aef","969c773a","203f61da","72955a09","72ff2188","fbec1bc6","8471086d","0ed1a590"];
function fingerprint(text){
 let hash=2166136261;
 for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
 return (hash>>>0).toString(16).padStart(8,'0');
}
const cases=[...ZACHET50_CASES_A,...ZACHET50_CASES_B];
const raw=[...cases].map(x=>({
 id:x.id,title:x.title,
 // Source text is HTML escaped only in the casebook; decode it for comparison.
 condition:x.conditionHtml.replace(/^<p>Исходное условие и задания: /,'').replace(/<\/p>[\s\S]*$/,'')
  .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
}));

test('all 50 task titles and complete conditions retain their original source fingerprints',()=>{
 assert.equal(raw.length,originals.length);
 for(let i=0;i<50;i++){
  const item=raw[i];
  assert.equal(item.id,'ZACHET50-'+String(i+1).padStart(2,'0'));
  assert.equal(fingerprint(item.title+'\n'+item.condition),originals[i],item.id+' differs from the source DOCX');
 }
});

test('source integrity check rejects an accidental change of any digit',()=>{
 for(let i=0;i<50;i++){
  const item=raw[i];
  const changed=item.condition.replace(/[0-9]/,digit=>String((Number(digit)+1)%10));
  assert.notEqual(changed,item.condition,item.id+' has no source numeric input');
  assert.notEqual(fingerprint(item.title+'\n'+changed),originals[i],item.id+' numeric corruption undetected');
 }
});
