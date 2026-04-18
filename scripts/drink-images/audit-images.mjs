/**
 * One-off audit: recipes vs bundled DRINK_IMAGES, duplicate filenames, emoji gaps.
 * Run: node scripts/drink-images/audit-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const recipesPath = path.join(ROOT, 'src', 'data', 'recipes.json');
const indexPath = path.join(ROOT, 'assets', 'images', 'drinks', 'index.ts');
const drinksDir = path.join(ROOT, 'assets', 'images', 'drinks');

const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8')).drinks;
const indexSrc = fs.readFileSync(indexPath, 'utf8');

const lineRe = /^\s*'([^']+)':\s*require\('\.\/([^']+)'\)/gm;
const fileToSlugs = new Map();
let m;
while ((m = lineRe.exec(indexSrc))) {
  const slug = m[1];
  const file = m[2];
  if (!fileToSlugs.has(file)) fileToSlugs.set(file, []);
  fileToSlugs.get(file).push(slug);
}

const dupEntries = [...fileToSlugs.entries()].filter(([, slugs]) => slugs.length > 1);
console.log('--- Duplicate require() filename (multiple registry keys) ---');
if (dupEntries.length === 0) console.log('None.');
else dupEntries.forEach(([f, s]) => console.log(f, '->', s.join(', ')));

const slugToFile = new Map();
for (const [file, slugs] of fileToSlugs) {
  for (const s of slugs) slugToFile.set(s, file);
}

const missing = [];
for (const d of recipes) {
  const key = (d.image_path || d.slug || '').trim().replace(/\.(webp|png|jpg|jpeg)$/i, '');
  if (!slugToFile.has(key)) {
    missing.push({
      slug: d.slug,
      name: d.name,
      emoji: d.emoji,
      image_path: d.image_path,
    });
  }
}

console.log('\n--- Drinks with no bundled image ---');
console.log('Count:', missing.length);
const noEmoji = missing.filter((x) => !x.emoji || !String(x.emoji).trim());
console.log('Missing emoji field:', noEmoji.length);
if (noEmoji.length) console.log(noEmoji.slice(0, 20));

const generic = new Set(['🍹', '🥤', '🥃', '🍸', '🧉']);
const missingOnlyGeneric = missing.filter((x) => generic.has(x.emoji));
console.log('Missing image but emoji is only a generic drink glyph:', missingOnlyGeneric.length);

// Perceptual duplicate files: same SHA-256 hash, different slugs
console.log('\n--- Identical image files (SHA-256), different slugs ---');
const hashToFiles = new Map();
for (const [file, slugs] of fileToSlugs) {
  if (slugs.length !== 1) continue;
  const slug = slugs[0];
  const fp = path.join(drinksDir, file);
  if (!fs.existsSync(fp)) continue;
  const buf = fs.readFileSync(fp);
  const h = crypto.createHash('sha256').update(buf).digest('hex');
  if (!hashToFiles.has(h)) hashToFiles.set(h, []);
  hashToFiles.get(h).push({ file, slug });
}
const dupHashes = [...hashToFiles.entries()].filter(([, arr]) => arr.length > 1);
if (dupHashes.length === 0) console.log('None.');
else {
  for (const [, arr] of dupHashes) {
    console.log(
      arr.map((x) => x.slug).join(' | '),
      '(same bytes as',
      arr[0].file + ')'
    );
  }
  console.log('Total duplicate-byte groups:', dupHashes.length);
}
