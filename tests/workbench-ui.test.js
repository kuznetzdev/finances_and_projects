import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../site/workbench.css',import.meta.url),'utf8');

test('Workbench is loaded after the existing design system and has a keyboard skip link',()=>{
 assert.ok(html.indexOf('interaction.css')<html.indexOf('workbench.css'));
 assert.match(html,/<a class="skip-link" href="#content">К содержанию<\/a>/);
 assert.match(html,/<main id="content" tabindex="-1"><\/main>/);
 assert.match(css,/\.skip-link:focus\s*\{/);
 assert.match(css,/textarea:focus-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('Workspace places useful content before decorative elements',()=>{
 assert.doesNotMatch(app,/class="hero-index"/);
 assert.doesNotMatch(html,/АКТУАЛЬНО НА 2026/);
 assert.match(app,/class="task-story-heading">Условие/);
 assert.match(app,/class="task-serial">Вариант #/);
 assert.match(css,/\.task-header::after\s*\{\s*display:none;content:none/);
 assert.match(css,/\.term-item\s*\{/);
 assert.match(css,/\.paradox-row\s*\{/);
});

test('Zero attempts never masquerade as zero accuracy',()=>{
 assert.match(app,/#side-accuracy'\)\.textContent = stats\.total \?/);
 assert.match(app,/Нет данных/);
 assert.match(app,/Точность появится после проверки первого решения/);
 assert.match(app,/stats\.total \? total \+ '%' : 'Нет данных'/);
});

test('Quiz feedback remains legible and long content works at small widths',()=>{
 assert.match(css,/\.quiz-option:disabled\s*\{\s*opacity:1/);
 assert.match(css,/@media\(max-width:780px\)/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/\.glossary.*\.term-list\s*\{\s*grid-template-columns:1fr/);
});
