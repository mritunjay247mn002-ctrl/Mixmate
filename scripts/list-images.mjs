import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'recipes.json'), 'utf8')
);
const rows = data.drinks.map((r) => ({
  filename: `${r.slug}.png`,
  slug: r.slug,
  name: r.name,
  type: r.type,
  emoji: r.emoji,
  alcohol: r.alcohol_level,
}));

const docsDir = path.join(__dirname, '..', 'docs');
fs.mkdirSync(docsDir, { recursive: true });

// Plain checklist
const checklist = [
  `# MixMate — drink image checklist`,
  ``,
  `Drop **one PNG per slug** into \`assets/images/drinks/\`.`,
  `Filenames MUST match the slug column below. Any missing file falls back`,
  `automatically to the neon gradient + emoji tile (so the app keeps working`,
  `with partial coverage).`,
  ``,
  `After adding images, register them in \`assets/images/drinks/index.ts\`:`,
  ``,
  '```ts',
  `export const DRINK_IMAGES: Record<string, number> = {`,
  `  'classic-mojito': require('./classic-mojito.png'),`,
  `  // ...one line per added file`,
  `};`,
  '```',
  ``,
  `Total drinks: **${rows.length}**  (cocktails: ${rows.filter((r) => r.type === 'cocktail').length}, mocktails: ${rows.filter((r) => r.type === 'mocktail').length})`,
  ``,
  `| # | Filename | Drink | Type | Emoji |`,
  `|---|----------|-------|------|-------|`,
  ...rows.map(
    (r, i) => `| ${i + 1} | \`${r.filename}\` | ${r.name} | ${r.type} | ${r.emoji} |`
  ),
  ``,
];

fs.writeFileSync(path.join(docsDir, 'IMAGE_FILES.md'), checklist.join('\n'), 'utf8');

// Plain newline-delimited filename list (easy copy-paste)
fs.writeFileSync(
  path.join(docsDir, 'IMAGE_FILES.txt'),
  rows.map((r) => r.filename).join('\n') + '\n',
  'utf8'
);

// Ready-to-paste require map
const requireMap = [
  '/**',
  ` * Auto-generated from recipes.json (${rows.length} entries).`,
  ' * Uncomment any line once you drop the matching PNG into this folder.',
  ' */',
  'export const DRINK_IMAGES_TEMPLATE: Record<string, () => number> = {',
  ...rows.map((r) => `  // '${r.slug}': () => require('./${r.filename}'),`),
  '};',
  '',
];
fs.writeFileSync(
  path.join(docsDir, 'IMAGE_REGISTRY_TEMPLATE.ts'),
  requireMap.join('\n'),
  'utf8'
);

console.log(`Wrote ${rows.length} entries -> docs/IMAGE_FILES.md, docs/IMAGE_FILES.txt, docs/IMAGE_REGISTRY_TEMPLATE.ts`);
