/**
 * Remove duplicate WebP files (identical bytes) and trim DRINK_IMAGES so each
 * byte-hash keeps one canonical slug (lexicographically smallest).
 *
 * Run: node scripts/drink-images/dedupe-drink-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const INDEX = path.join(ROOT, 'assets', 'images', 'drinks', 'index.ts');
const DRINK_DIR = path.join(ROOT, 'assets', 'images', 'drinks');

const src = fs.readFileSync(INDEX, 'utf8');
const lineRe = /^\s*'([^']+)':\s*require\('\.\/([^']+)'\),\s*$/gm;
const entries = [];
let m;
while ((m = lineRe.exec(src))) {
  entries.push({ slug: m[1], file: m[2] });
}

const hashToSlugs = new Map();
for (const { slug, file } of entries) {
  const fp = path.join(DRINK_DIR, file);
  if (!fs.existsSync(fp)) {
    console.warn('[dedupe] missing file on disk, skip hash:', file);
    continue;
  }
  const buf = fs.readFileSync(fp);
  const h = crypto.createHash('sha256').update(buf).digest('hex');
  if (!hashToSlugs.has(h)) hashToSlugs.set(h, []);
  hashToSlugs.get(h).push({ slug, file });
}

const removeSlugs = new Set();
const deleteFiles = new Set();

for (const [, arr] of hashToSlugs) {
  if (arr.length < 2) continue;
  arr.sort((a, b) => a.slug.localeCompare(b.slug));
  for (let i = 1; i < arr.length; i++) {
    removeSlugs.add(arr[i].slug);
    deleteFiles.add(arr[i].file);
  }
  console.log(
    'keep',
    arr[0].slug,
    '(' + arr[0].file + ') — drop',
    arr.slice(1).map((x) => x.slug).join(', ')
  );
}

const kept = entries.filter((e) => !removeSlugs.has(e.slug));
const lines = kept.map((e) => `  '${e.slug}': require('./${e.file}'),`);

const marker = 'export const DRINK_IMAGES: Record<string, number> = {';
const i0 = src.indexOf(marker);
if (i0 < 0) throw new Error('DRINK_IMAGES block not found');
const iOpen = src.indexOf('{', i0) + 1;
const iClose = src.indexOf('\n};', iOpen);
if (iClose < 0) throw new Error('closing }; not found');
const preamble = src.slice(0, iOpen);
const tail = src.slice(iClose);
const newSrc = `${preamble}\n${lines.join('\n')}${tail}`;

fs.writeFileSync(INDEX, newSrc, 'utf8');

for (const f of deleteFiles) {
  const fp = path.join(DRINK_DIR, f);
  if (fs.existsSync(fp)) {
    fs.unlinkSync(fp);
    console.log('deleted', f);
  }
}

console.log('\nDone. Registry entries:', entries.length, '→', kept.length);
console.log('Removed slugs:', removeSlugs.size, 'Deleted files:', deleteFiles.size);
