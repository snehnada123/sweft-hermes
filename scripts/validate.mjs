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
if (read('LICENSE') !== read('assets/LICENSE')) throw new Error('License copies differ');
const blobHash = (content) => createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest('hex');
if (blobHash(read('assets/LICENSE')) !== 'ab4bb8daa90d028fb9a9f0a7a46e0a3475840b0d') throw new Error('Upstream MIT notice changed');
for (const path of ['assets/weft.ts', 'assets/demo/main.ts']) {
  stripTypeScriptTypes(read(path), { mode: 'strip' });
}
const hash = blobHash(read('assets/weft.ts'));
if (hash !== 'b6d09d848b3e8ee8690d3bbd0ac571e467aa9a88') {
  throw new Error('Renderer differs from upstream pinned commit');
}
console.log('Hermes skill references, MIT notice and renderer integrity: OK');
