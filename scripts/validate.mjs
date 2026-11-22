import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const skill = read('SKILL.md');
const required = [
  'assets/weft.ts',
  'assets/LICENSE',
  'assets/package.json',
  'assets/tsconfig.json',
  'assets/demo/index.html',
  'assets/demo/main.ts',
  'references/options.md',
  'references/recipes.md',
  'references/pitfalls.md',
];
for (const path of required) {
  if (!existsSync(resolve(root, path))) throw new Error(`Missing ${path}`);
  if (!skill.includes(`(${path})`)) throw new Error(`SKILL.md does not reference ${path}`);
}
if (!skill.startsWith('---\nname: weft\n')) throw new Error('Invalid Hermes frontmatter');
if (!read('assets/LICENSE').includes('Copyright (c) 2026 JDhruv14')) throw new Error('Missing upstream copyright');
if (read('LICENSE') !== read('assets/LICENSE')) throw new Error('License copies differ');
for (const path of ['assets/weft.ts', 'assets/demo/main.ts']) {
  stripTypeScriptTypes(read(path), { mode: 'strip' });
}
const hash = createHash('sha1').update(`blob ${Buffer.byteLength(read('assets/weft.ts'))}\0`).update(read('assets/weft.ts')).digest('hex');
if (hash !== 'b6d09d848b3e8ee8690d3bbd0ac571e467aa9a88') {
  throw new Error('Renderer differs from upstream pinned commit');
}
console.log('Hermes skill references, MIT notice and renderer integrity: OK');
