import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir=fileURLToPath(new URL('../site/', import.meta.url));
const root=fileURLToPath(new URL('../', import.meta.url));
function jsFiles(dir) {
  return readdirSync(dir,{withFileTypes:true}).flatMap(item=>{
    const path=join(dir,item.name);
    return item.isDirectory()?jsFiles(path):item.isFile()&&item.name.endsWith('.js')?[path]:[];
  });
}

test('Every JavaScript file in the published site is syntactically valid',()=>{
  const files=jsFiles(siteDir);
  assert.ok(files.length>=15,'Missing frontend files');
  for(const file of files){
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(result.status,0,relative(root,file)+': '+result.stderr);
  }
});

test('Glossary and flashcards are separate, complete render functions',()=>{
  const app=readFileSync(new URL('../site/app.js',import.meta.url),'utf8');
  assert.match(app,/function renderCards\(\)[\s\S]+?}\nfunction renderGlossary\(\)/);
  assert.match(app,/\$\$\('\[data-term\]'\)\.forEach/,'Dictionary cards must be bound as a collection');
  assert.doesNotMatch(app,/renderCarfunction|^y\(\); window\.scrollTo/m);
  assert.match(app,/function renderGlossary\(\)[\s\S]+?}\nfunction renderProgress\(\)/);
});
