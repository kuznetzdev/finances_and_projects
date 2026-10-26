import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formulaMarkup} from '../site/features/math-ui.js';
import {GLOSSARY_FORMULAS} from '../site/data/glossary-formulas.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('Financial equations preserve their exact accessible source and escape input',()=>{
 for(const forms of Object.values(GLOSSARY_FORMULAS)){
  for(const f of forms){
   const html=formulaMarkup(f.expression,escape);
   assert.ok(html.includes('role="math"'),f.expression);
   assert.ok(html.includes('aria-label="'+escape(f.expression)+'"'),f.expression);
  }
 }
 const unsafe=formulaMarkup('P = <script>alert(1)</script>',escape);
 assert.ok(!unsafe.includes('<script>'));
 assert.match(unsafe,/&lt;script&gt;/);
});
test('Ratios, superscripts and subscripts receive semantic math markup',()=>{
 assert.match(formulaMarkup('WACC = (E/V) × Re + (D/V) × Rd × (1 − T)',escape),/math-fraction/);
 assert.match(formulaMarkup('NPV = Σ[t=0..n] CF_t \/ (1+r)^t',escape),/<sub>t<\/sub>/);
 assert.match(formulaMarkup('FV = P × (1+r)^n',escape),/<sup>n<\/sup>/);
 assert.match(formulaMarkup('PV = A × [1 − (1+r)^(-n)] / r',escape),/math-fraction/);
});
test('Navigation icons and source headings stay consistent without decorative glyphs',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../site/interaction.css',import.meta.url),'utf8');
 assert.match(html,/УЧЕБНЫЙ ПРОЦЕСС/);
 assert.doesNotMatch(html,/УЧЁБНЫЙ ПРОЦЕСС/);
 const matches=[...html.matchAll(/<use href="#(icon-[a-z-]+)"/g)];
 for(const m of matches)assert.ok(html.includes('id="'+m[1]+'"'),m[1]);
 assert.ok(matches.length>=17);
 assert.ok(!/[◫◈▤◇⌕▥◐]/.test(html));
 assert.match(app,/uiIcon\('bulb'\)/);
 assert.match(css,/--font-ui:/);
 assert.match(css,/--font-math:/);
});
