import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bindPracticeModes } from '../site/features/practice-modes.js';

function simulatedRoot() {
  const handlers = new Map();
  return {
    innerHTML: '',
    contains(node) { return node.owner === this; },
    addEventListener(type, listener) { assert.equal(handlers.has(type), false, 'do not register twice'); handlers.set(type, listener); },
    removeEventListener(type, listener) { if (handlers.get(type) === listener) handlers.delete(type); },
    click(button) {
      const child = { closest: selector => selector === '[data-practice-mode]' ? button : null };
      handlers.get('click')?.({target: child});
    },
    listenerCount() { return handlers.size; },
  };
}

const button = (root, mode) => ({owner:root, dataset:{practiceMode:mode}});

test('generator remains reachable after the case book replaces its DOM repeatedly', () => {
  const root = simulatedRoot();
  const changes = [];
  const dispose = bindPracticeModes(root, mode => changes.push(mode));
  assert.equal(root.listenerCount(), 1);
  root.innerHTML = '<section>generator controls</section>';
  root.click(button(root, 'bank'));
  for (let i = 0; i < 8; i++) {
    root.innerHTML = `<section>bank step ${i}</section>`;
    root.click(button(root, 'bank'));
  }
  root.innerHTML = '<section>case bank step 9</section>';
  root.click(button(root, 'generator'));
  assert.deepEqual(changes, ['bank', ...Array(8).fill('bank'), 'generator']);
  assert.equal(root.listenerCount(), 1);
  dispose();
  root.click(button(root, 'bank'));
  assert.equal(changes.at(-1), 'generator');
  assert.equal(root.listenerCount(), 0);
});

test('delegation ignores invalid, outside and unrelated controls', () => {
  const root = simulatedRoot(), other = simulatedRoot();
  const changes = [];
  bindPracticeModes(root, m => changes.push(m));
  root.click(button(root, 'quiz'));
  root.click(button(other, 'generator'));
  root.click(null);
  root.click(button(root, 'bank'));
  assert.deepEqual(changes, ['bank']);
  assert.throws(() => bindPracticeModes(null, () => {}), TypeError);
  assert.throws(() => bindPracticeModes(root, null), TypeError);
});

test('practice navigation lives on a stable root and active-mode styling is responsive', () => {
  const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
  const bank=readFileSync(new URL('../site/features/casebook-ui.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../site/interaction.css',import.meta.url),'utf8');
  assert.match(app,/bindPracticeModes\(\$\('#content'\), changePracticeMode\)/);
  assert.doesNotMatch(app,/attachPracticeTabs/);
  assert.match(bank,/deps\.root\.innerHTML\s*=/);
  assert.match(app,/const fromURL = \(k, fallback\) => \{ const params = new URLSearchParams\(location\.search\)/);
  assert.match(css,/\.practice-mode-tabs\s*\{[^}]*position:\s*sticky/s);
  assert.match(css,/\.practice-mode-tabs button\.active\s*\{[^}]*color:\s*var\(--bg\)/s);
  assert.match(css,/@media \(max-width: 640px\)\s*\{\s*\.practice-mode-tabs/);
});