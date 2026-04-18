/**
 * Apply drink images → canonical <slug>.webp (640×640 contain, quality ~82) + Metro index + gradients.
 *
 * Usage:
 *   node scripts/drink-images/apply-approved.mjs
 *   node scripts/drink-images/apply-approved.mjs --from-report
 *   node scripts/drink-images/apply-approved.mjs --from-report --min-confidence=0.88 --yes
 *
 * Flags:
 *   --force              allow replacing slug when another source already mapped it
 *   --from-report        build mappings from docs/drink-images/REPORT.json top-1
 *   --min-confidence=N   with --from-report (default 0.97). Use <0.97 only with --yes
 *   --yes                required when --min-confidence < 0.97 (accepts mis-match risk)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const INCOMING = path.join(ROOT, 'assets', 'images', 'drinks', 'incoming');
const DRINK_IMG_DIR = path.join(ROOT, 'assets', 'images', 'drinks');
const MANIFEST = path.join(ROOT, 'src', 'data', 'drink-image-manifest.approved.json');
const RECIPES = path.join(ROOT, 'src', 'data', 'recipes.json');
const REPORT = path.join(ROOT, 'docs', 'drink-images', 'REPORT.json');
const GRADIENTS_OUT = path.join(ROOT, 'src', 'data', 'drink-image-gradients.json');
const INDEX_OUT = path.join(DRINK_IMG_DIR, 'index.ts');

/** Bundled drink art: WebP for size; legacy PNGs in-repo are migrated on apply. */
const MAX_EDGE = 640;
const WEBP_QUALITY = 82;
/** Full image inside square — no crop (letterbox #07020F). */
const FIT_BG = { r: 7, g: 2, b: 15, alpha: 1 };

const CONF_MIN = 0.97;
const FORCE = process.argv.includes('--force');
const FROM_REPORT = process.argv.includes('--from-report');
const RISK_YES = process.argv.includes('--yes');

function parseMinConfidence() {
  const a = process.argv.find((x) => x.startsWith('--min-confidence='));
  if (!a) return CONF_MIN;
  const v = parseFloat(a.slice('--min-confidence='.length));
  return Number.isFinite(v) ? v : CONF_MIN;
}

function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function luminance(hex) {
  const n = hex.slice(1);
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function darkenHex(hex, factor) {
  const n = hex.slice(1);
  const r = parseInt(n.slice(0, 2), 16) * factor;
  const g = parseInt(n.slice(2, 4), 16) * factor;
  const b = parseInt(n.slice(4, 6), 16) * factor;
  return rgbToHex(r, g, b);
}

/** One-time: legacy canonical PNG → WebP; drop PNG when WebP already exists. */
async function migrateLegacyPngToWebp(slugSet) {
  if (!fs.existsSync(DRINK_IMG_DIR)) return;
  for (const name of fs.readdirSync(DRINK_IMG_DIR)) {
    if (!name.endsWith('.png')) continue;
    const slug = name.slice(0, -4);
    if (!slugSet.has(slug)) continue;
    const pngPath = path.join(DRINK_IMG_DIR, name);
    const webpPath = path.join(DRINK_IMG_DIR, `${slug}.webp`);
    if (fs.existsSync(webpPath)) {
      fs.unlinkSync(pngPath);
      continue;
    }
    await sharp(pngPath)
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 5 })
      .toFile(webpPath);
    fs.unlinkSync(pngPath);
  }
}

async function extractGradient(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize(56, 56)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const buckets = new Map();

  for (let i = 0; i < data.length; i += ch) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 22 || lum > 248) continue;
    const qr = (r >> 3) << 3;
    const qg = (g >> 3) << 3;
    const qb = (b >> 3) << 3;
    const key = `${qr},${qg},${qb}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  const toHex = (entry) => {
    const [key] = entry;
    const [rs, gs, bs] = key.split(',').map(Number);
    return rgbToHex(rs, gs, bs);
  };

  const top = sorted.slice(0, 6).map(toHex);
  if (top.length === 0) {
    return {
      gradient: ['#07020F', '#1A1230'],
      accent: '#FF2E93',
    };
  }

  let c1 = top[0];
  let c2 = top[1] ?? top[0];
  if (c1 === c2 && top[2]) c2 = top[2];

  if (luminance(c1) > luminance(c2)) [c1, c2] = [c2, c1];
  c1 = darkenHex(c1, 0.45);
  c2 = darkenHex(c2, 0.65);
  if (luminance(c2) < 0.08) c2 = darkenHex(top[0] ?? '#1A1230', 0.55);

  const accent = top.find((h) => h !== c1 && h !== c2) ?? '#00E5FF';

  return { gradient: [c1, c2], accent };
}

function listCanonicalRasterSlugs(slugSet) {
  const slugs = new Set();
  if (!fs.existsSync(DRINK_IMG_DIR)) return [];
  for (const name of fs.readdirSync(DRINK_IMG_DIR)) {
    if (name === 'incoming' || name === 'index.ts' || name === 'README.md' || name === '.gitkeep')
      continue;
    const ext = path.extname(name).toLowerCase();
    if (ext !== '.webp' && ext !== '.png') continue;
    const base = name.slice(0, -ext.length);
    if (slugSet.has(base)) slugs.add(base);
  }
  return [...slugs].sort();
}

function writeIndex(slugs) {
  const lines = [];
  for (const s of slugs) {
    const webpPath = path.join(DRINK_IMG_DIR, `${s}.webp`);
    const pngPath = path.join(DRINK_IMG_DIR, `${s}.png`);
    const ext = fs.existsSync(webpPath) ? 'webp' : fs.existsSync(pngPath) ? 'png' : null;
    if (!ext) continue;
    lines.push(`  '${s}': require('./${s}.${ext}'),`);
  }
  const body = [
    '/**',
    ' * Auto-generated by scripts/drink-images/apply-approved.mjs',
    ' * Metro requires literal require() paths per slug.',
    ' */',
    '',
    'export const DRINK_IMAGES: Record<string, number> = {',
    ...lines,
    '};',
    '',
    'export function resolveDrinkImage(slug: string): number | undefined {',
    '  return DRINK_IMAGES[slug];',
    '}',
    '',
  ].join('\n');
  fs.writeFileSync(INDEX_OUT, body, 'utf8');
}

function resolveSourcePath(source) {
  const norm = source.replace(/^\/+/, '').replace(/\\/g, '/');
  if (norm.startsWith('root/')) {
    const name = norm.slice('root/'.length);
    return { full: path.join(DRINK_IMG_DIR, name) };
  }
  if (norm.startsWith('incoming/')) {
    const rel = norm.slice('incoming/'.length);
    return { full: path.join(INCOMING, rel) };
  }
  const tryIncoming = path.join(INCOMING, norm);
  if (fs.existsSync(tryIncoming)) return { full: tryIncoming };
  const tryRoot = path.join(DRINK_IMG_DIR, path.basename(norm));
  if (fs.existsSync(tryRoot)) return { full: tryRoot };
  return { full: tryIncoming };
}

function loadJson(path, fallback) {
  if (!fs.existsSync(path)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function buildRowsFromReport(report, minConf, slugSet) {
  const bySlug = new Map();
  for (const repRow of report.rows ?? []) {
    const top = repRow.topCandidates?.[0];
    if (!top || !slugSet.has(top.slug)) continue;
    if (top.confidence < minConf) continue;
    const prev = bySlug.get(top.slug);
    if (prev && prev.confidence >= top.confidence) continue;
    bySlug.set(top.slug, {
      source: repRow.fileName,
      slug: top.slug,
      confidence: top.confidence,
      __auto: true,
    });
  }
  return [...bySlug.values()];
}

async function main() {
  const rawRecipes = JSON.parse(fs.readFileSync(RECIPES, 'utf8'));
  const drinks = rawRecipes.drinks ?? [];
  const slugSet = new Set(drinks.map((d) => d.slug));

  const report = fs.existsSync(REPORT) ? loadJson(REPORT, null) : null;
  const manifest = loadJson(MANIFEST, []);

  if (!Array.isArray(manifest)) {
    console.error('[apply] Manifest must be a JSON array');
    process.exit(1);
  }

  const minConf = parseMinConfidence();
  if (FROM_REPORT && minConf < CONF_MIN && !RISK_YES) {
    console.error(
      `[apply] --min-confidence=${minConf} is below ${CONF_MIN}. Re-run with --yes if you accept possible wrong image→drink pairs.`
    );
    process.exit(1);
  }
  if (FROM_REPORT && !report?.rows?.length) {
    console.error('[apply] --from-report requires docs/drink-images/REPORT.json — run npm run images:analyze');
    process.exit(1);
  }

  let rowsToApply = [...manifest];
  if (FROM_REPORT) {
    const auto = buildRowsFromReport(report, minConf, slugSet);
    const bySlug = new Map(auto.map((r) => [r.slug, r]));
    for (const row of manifest) {
      if (row && typeof row.slug === 'string' && typeof row.source === 'string') {
        bySlug.set(row.slug, { ...row, __auto: false });
      }
    }
    rowsToApply = [...bySlug.values()];
  }

  const errors = [];
  const slugOwner = new Map();

  for (const row of rowsToApply) {
    if (!row || typeof row.source !== 'string' || typeof row.slug !== 'string') continue;

    const { source, slug, confidence, notes, override, __auto } = row;
    const minNeeded = __auto ? minConf : CONF_MIN;
    if (typeof confidence !== 'number' || confidence < minNeeded) {
      errors.push(`${source}: confidence must be >= ${minNeeded}`);
      continue;
    }
    if (!slugSet.has(slug)) {
      errors.push(`${source}: unknown slug "${slug}"`);
      continue;
    }

    const { full: srcFull } = resolveSourcePath(source);
    if (!fs.existsSync(srcFull)) {
      errors.push(`${source}: file not found at ${path.relative(ROOT, srcFull)}`);
      continue;
    }

    if (report?.rows && !__auto) {
      const repRow = report.rows.find(
        (r) =>
          r.fileName === source ||
          r.fileName === `incoming/${source}` ||
          r.fileName === `root/${path.basename(source)}`
      );
      if (!repRow) {
        errors.push(`${source}: not found in REPORT.json — run npm run images:analyze`);
        continue;
      }
      const top = repRow.topCandidates?.[0];
      const machineOk = top && top.slug === slug && top.confidence >= CONF_MIN;
      const humanOverride =
        typeof notes === 'string' &&
        notes.trim().length >= 12 &&
        confidence >= CONF_MIN &&
        override === true;
      if (!machineOk && !humanOverride) {
        errors.push(
          `${source}: REPORT top match is "${top?.slug}" @ ${((top?.confidence ?? 0) * 100).toFixed(1)}%. Fix slug, re-run analyze, or set "override": true with detailed "notes" (>=12 chars).`
        );
        continue;
      }
    }

    if (slugOwner.has(slug) && slugOwner.get(slug) !== source) {
      if (!FORCE) {
        errors.push(`slug "${slug}" already mapped from ${slugOwner.get(slug)} (use --force)`);
        continue;
      }
    }
    slugOwner.set(slug, source);
  }

  if (errors.length) {
    console.error('[apply] Validation errors:\n' + errors.join('\n'));
    process.exit(1);
  }

  fs.mkdirSync(DRINK_IMG_DIR, { recursive: true });

  await migrateLegacyPngToWebp(slugSet);

  for (const row of rowsToApply) {
    if (!row?.slug || !slugSet.has(row.slug)) continue;
    const { full: srcFull } = resolveSourcePath(row.source);
    if (!fs.existsSync(srcFull)) continue;
    const dest = path.join(DRINK_IMG_DIR, `${row.slug}.webp`);
    await sharp(srcFull)
      .rotate()
      .resize(MAX_EDGE, MAX_EDGE, {
        fit: 'contain',
        position: 'centre',
        background: FIT_BG,
        withoutEnlargement: false,
      })
      .webp({ quality: WEBP_QUALITY, effort: 5 })
      .toFile(dest);
    const legacyPng = path.join(DRINK_IMG_DIR, `${row.slug}.png`);
    if (fs.existsSync(legacyPng)) fs.unlinkSync(legacyPng);
  }

  let gradients = loadJson(GRADIENTS_OUT, {});
  if (typeof gradients !== 'object' || gradients === null) gradients = {};

  const slugs = listCanonicalRasterSlugs(slugSet);
  for (const s of slugs) {
    const rasterPath = fs.existsSync(path.join(DRINK_IMG_DIR, `${s}.webp`))
      ? path.join(DRINK_IMG_DIR, `${s}.webp`)
      : path.join(DRINK_IMG_DIR, `${s}.png`);
    if (!fs.existsSync(rasterPath)) continue;
    if (!gradients[s]) {
      gradients[s] = await extractGradient(rasterPath);
    }
  }

  for (const key of Object.keys(gradients)) {
    if (!slugSet.has(key)) delete gradients[key];
  }

  fs.writeFileSync(GRADIENTS_OUT, JSON.stringify(gradients, null, 2) + '\n', 'utf8');
  writeIndex(slugs);

  const applied = rowsToApply.filter((r) => r && r.slug && slugSet.has(r.slug)).length;
  console.log(`[apply] rows applied: ${applied}`);
  console.log(`[apply] canonical image slugs (webp/png): ${slugs.length}`);
  console.log(`[apply] wrote ${path.relative(ROOT, INDEX_OUT)}`);
  console.log(`[apply] wrote ${path.relative(ROOT, GRADIENTS_OUT)}`);
}

await main().catch((e) => {
  console.error(e);
  process.exit(1);
});
