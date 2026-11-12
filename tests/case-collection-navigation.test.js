import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CASE_BANK} from '../site/engine/casebook.js';

const index=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
const ui=readFileSync(new URL('../site/features/casebook-ui.js',import.meta.url),'utf8');

test('exam preparation is an inner case-bank collection, not a duplicate top-level page',()=>{
 assert.doesNotMatch(index,/<a\b[^>]*class="nav-button"[^>]*Подготовка к зачету/);
 assert.doesNotMatch(index,/mobile-prep-link/);
 assert.match(ui,/data-case-collection="all"/);
 assert.match(ui,/data-case-collection="exam"/);
 assert.match(ui,/aria-label="Подборки задач"/);
 assert.match(ui,/&collection='\+kind/);
});
test('exam collection consists of 55 exam tasks plus 13 previously prepared tasks only',()=>{
 const exam=CASE_BANK.filter(item=>/^(?:ZACHET50|PREP26)-/.test(item.id));
 assert.equal(exam.length,68);
 assert.equal(exam.filter(x=>x.id.startsWith('ZACHET50-')).length,55);
 assert.equal(exam.filter(x=>x.id.startsWith('PREP26-')).length,13);
 assert.equal(CASE_BANK.length,179);
});
