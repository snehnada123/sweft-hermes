import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const skill = read('SKILL.md');
const required = [
  'assets/sweft.ts',
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
if (!skill.startsWith('---\nname: sweft\n')) throw new Error('Invalid Hermes frontmatter');
if (read('LICENSE') !== read('assets/LICENSE')) throw new Error('License copies differ');
const blobHash = (content) => createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest('hex');
if (blobHash(read('assets/LICENSE')) !== 'ab4bb8daa90d028fb9a9f0a7a46e0a3475840b0d') throw new Error('Upstream MIT notice changed');
for (const path of ['assets/sweft.ts', 'assets/demo/main.ts']) {
  stripTypeScriptTypes(read(path), { mode: 'strip' });
}
const hash = blobHash(read('assets/sweft.ts'));
if (hash !== '0f8605abb3da4dd385849ef61da2d86d52c952ee') {
  throw new Error('Bundled renderer differs from validated source');
}
console.log('Hermes skill references, MIT notice and renderer integrity: OK');
