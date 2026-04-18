/**
 * Scan drink images for slug-match suggestions:
 * - assets/images/drinks/incoming/** (staging)
 * - assets/images/drinks/* loose files (same folder as index.ts), excluding incoming/
 *
 * Writes docs/drink-images/REPORT.json + REPORT.md
 *
 * Usage: node scripts/drink-images/analyze.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const INCOMING = path.join(ROOT, 'assets', 'images', 'drinks', 'incoming');
const DRINKS_DIR = path.join(ROOT, 'assets', 'images', 'drinks');
const RECIPES = path.join(ROOT, 'src', 'data', 'recipes.json');
const OUT_DIR = path.join(ROOT, 'docs', 'drink-images');
const OUT_JSON = path.join(OUT_DIR, 'REPORT.json');
const OUT_MD = path.join(OUT_DIR, 'REPORT.md');

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function tokenize(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\(\d+\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function compactSlugish(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\(\d+\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Float64Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function scoreMatch(basename, drink) {
  const baseCompact = compactSlugish(basename);
  const slug = drink.slug;
  const nameTokens = tokenize(drink.name);
  const slugTokens = tokenize(slug.replace(/-/g, ' '));
  const baseTokens = tokenize(basename.replace(/_/g, ' '));

  if (baseCompact === slug) return { score: 1, reason: 'exact-slug' };
  if (baseCompact.endsWith(`-${slug}`) || baseCompact.startsWith(`${slug}-`))
    return { score: 0.99, reason: 'slug-with-suffix' };

  const slugNoHyphen = slug.replace(/-/g, '');
  const baseNoHyphen = baseCompact.replace(/-/g, '');
  if (slugNoHyphen && baseNoHyphen.includes(slugNoHyphen)) return { score: 0.96, reason: 'slug-substring' };
  if (slugNoHyphen && slugNoHyphen.includes(baseNoHyphen) && baseNoHyphen.length >= 6)
    return { score: 0.94, reason: 'basename-in-slug' };

  const maxLen = Math.max(slug.length, baseCompact.length);
  const dist = levenshtein(slug, baseCompact);
  const sim = maxLen === 0 ? 0 : 1 - dist / maxLen;
  if (sim >= 0.88) return { score: 0.75 + sim * 0.2, reason: 'levenshtein-slug' };

  const jacSlug = jaccard(baseTokens, slugTokens);
  const jacName = jaccard(baseTokens, nameTokens);
  const jac = Math.max(jacSlug, jacName);
  if (jac >= 0.6) return { score: 0.55 + jac * 0.35, reason: 'token-overlap' };

  for (const part of slug.split('-')) {
    if (part.length >= 4 && baseCompact.includes(part)) {
      return { score: 0.93, reason: 'slug-token-in-basename' };
    }
  }
  for (const t of nameTokens) {
    if (t.length >= 5 && baseCompact.includes(t)) {
      return { score: 0.91, reason: 'name-token-in-basename' };
    }
  }

  return { score: jac * 0.5, reason: 'weak' };
}

function walkImages(dir, baseDir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(baseDir, full).replace(/\\/g, '/');
    if (e.isDirectory()) walkImages(full, baseDir, out);
    else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (IMAGE_EXT.has(ext)) out.push({ full, rel });
    }
  }
  return out;
}

/** Loose images sitting in assets/images/drinks/ (not inside incoming/). */
function listRootDrinkImages(slugSet) {
  const out = [];
  if (!fs.existsSync(DRINKS_DIR)) return out;
  const skipNames = new Set([
    'incoming',
    'index.ts',
    'README.md',
    '.gitkeep',
  ]);
  for (const e of fs.readdirSync(DRINKS_DIR, { withFileTypes: true })) {
    if (e.isDirectory()) continue;
    if (skipNames.has(e.name)) continue;
    if (e.name.startsWith('.')) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    if (e.name.toLowerCase().endsWith('.html')) continue;
    const base = e.name.slice(0, -ext.length);
    if (slugSet.has(base) && (ext === '.png' || ext === '.webp')) continue;
    const full = path.join(DRINKS_DIR, e.name);
    out.push({ full, rel: e.name, fileName: `root/${e.name}` });
  }
  return out;
}

function main() {
  const raw = fs.readFileSync(RECIPES, 'utf8');
  const { drinks } = JSON.parse(raw);
  const slugSet = new Set(drinks.map((d) => d.slug));

  fs.mkdirSync(INCOMING, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const incomingFiles = walkImages(INCOMING, INCOMING, []);
  const rootFiles = listRootDrinkImages(slugSet);
  const files = [
    ...incomingFiles.map(({ full, rel }) => ({
      full,
      fileName: `incoming/${rel.replace(/\\/g, '/')}`,
    })),
    ...rootFiles.map(({ full, fileName }) => ({ full, fileName })),
  ];
  const rows = [];

  for (const { full, fileName } of files) {
    const basename = path.basename(full, path.extname(full));
    const candidates = drinks
      .map((d) => {
        const { score, reason } = scoreMatch(basename, d);
        return {
          slug: d.slug,
          name: d.name,
          type: d.type,
          score,
          confidence: Math.min(1, Math.max(0, score)),
          reason,
        };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);

    const top = candidates[0];
    const autoOk = top && top.confidence >= 0.97;
    rows.push({
      fileName,
      relativePath: fileName,
      topCandidates: candidates,
      recommendedSlug: top?.slug ?? null,
      recommendedConfidence: top?.confidence ?? 0,
      passesThreshold: autoOk,
      skipReason: autoOk ? null : top ? 'below-0.97-threshold' : 'no-candidates',
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    incomingDir: path.relative(ROOT, INCOMING).replace(/\\/g, '/'),
    drinksRootDir: path.relative(ROOT, DRINKS_DIR).replace(/\\/g, '/'),
    totalFiles: rows.length,
    autoPass97: rows.filter((r) => r.passesThreshold).length,
    rows,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), 'utf8');

  const md = [
    '# Drink image analysis report',
    '',
    `Generated: ${report.generatedAt}`,
    `Incoming: \`${report.incomingDir}\``,
    `Drinks root (loose files): \`${report.drinksRootDir}\``,
    `Files: **${report.totalFiles}** · Auto ≥97%: **${report.autoPass97}**`,
    '',
    '| File | Top slug | Conf | Pass 97% |',
    '|------|----------|------|----------|',
    ...rows.map((r) => {
      const t = r.topCandidates[0];
      const slug = t ? t.slug : '—';
      const c = t ? (t.confidence * 100).toFixed(1) + '%' : '—';
      const p = r.passesThreshold ? 'yes' : 'no';
      return `| \`${r.fileName}\` | ${slug} | ${c} | ${p} |`;
    }),
    '',
    'Next: copy approved rows into `src/data/drink-image-manifest.approved.json` and run `npm run images:apply`.',
    '',
  ].join('\n');

  fs.writeFileSync(OUT_MD, md, 'utf8');

  console.log(`[analyze] ${files.length} image(s) → ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`[analyze] auto ≥97%: ${report.autoPass97} / ${report.totalFiles}`);
}

main();
