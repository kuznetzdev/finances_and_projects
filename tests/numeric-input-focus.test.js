import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../site/styles.css',import.meta.url),'utf8');

test('bank numeric field uses one visible focus indicator, not a clipped orange inner outline',()=>{
 assert.match(css,/\.case-number-wrap:focus-within\s*\{[^}]*outline:\s*2px solid var\(--ok\)/);
 assert.match(css,/\.case-number-wrap input:focus-visible\s*\{[^}]*outline:\s*(?:none|0)\s*;/);
});

test('numeric exercise fields have a focused border without a second orange outline',()=>{
 assert.match(css,/\.answer-input:focus-visible\s*,\s*\.answer-select:focus-visible\s*\{[^}]*outline:\s*(?:none|0)\s*;/);
});

test('unit label remains readable and occupies its own space in the bank answer field',()=>{
 assert.match(css,/\.case-number-wrap span\s*\{[^}]*flex:\s*0 0 auto\s*;/);
 assert.match(css,/\.case-number-wrap span\s*\{[^}]*padding-left:\s*\d+px\s*;/);
});
