import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TOUR_STEPS,createInterfaceTour} from '../site/features/interface-tour.js';

const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../site/features/interface-tour.css',import.meta.url),'utf8');

test('Tour is concise, user initiated and points to existing product controls',()=>{
 assert.ok(TOUR_STEPS.length>=6&&TOUR_STEPS.length<=9);
 assert.equal(new Set(TOUR_STEPS.map(x=>x.title)).size,TOUR_STEPS.length);
 assert.ok(TOUR_STEPS.every(x=>x.title.length>4&&x.text.length>35&&x.desktop.startsWith('#')||x.desktop.startsWith('.')));
 assert.match(html,/id="tour-toggle"[^>]*aria-label="Экскурсия по интерфейсу"/);
 assert.match(app,/createInterfaceTour\(\{trigger:\$\('#tour-toggle'\)\}\)/);
 assert.doesNotMatch(app,/interfaceTour\.start\(\);[\s\S]*$('#theme-toggle')\.onclick/);
 assert.throws(()=>createInterfaceTour(),TypeError);
});

test('Level filter reuses existing keyboard-accessible popover and not native select',()=>{
 assert.match(app,/filterPickerMarkup\('level','Сложность'/);
 assert.match(app,/const levelPicker=bindFilterSearch/);
 assert.match(app,/levelPicker\.dispose\(\)/);
 assert.match(app,/app\.levelFilter=id;app\.templateId=null;nextExercise\(\)/);
 assert.doesNotMatch(app,/<select id="level-filter"/);
});

test('Tour has accessible dialog semantics, responsive overlay, and explicit controls',()=>{
 assert.match(html,/id="icon-help"/);
 assert.match(html,/\.\/features\/interface-tour\.css/);
 assert.match(css,/\.tour-dialog\s*\{/);
 assert.match(css,/max-height:calc\(100dvh - 16px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(createInterfaceTour.toString(),/aria-modal/);
});

test('Floating task shortcut remains available during desktop input',()=>{
 assert.match(app,/quickRandom\.hidden=!pastTop\|\|actionVisible\|\|Boolean\(keyboardOpen\)/);
 assert.match(app,/visualViewport\?\.addEventListener/);
 assert.match(app,/visualViewport\?\.removeEventListener/);
});
