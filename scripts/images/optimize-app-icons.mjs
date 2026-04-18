/**
 * Losslessly recompress / downscale launcher and splash PNGs referenced in app.json.
 * Safe to re-run; skips missing files.
 *
 *   node scripts/images/optimize-app-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

const APP_JSON = path.join(ROOT, 'app.json');

function relToAbs(rel) {
  return path.join(ROOT, rel.replace(/^\.\//, ''));
}

async function optimizePng(absPath, maxEdge) {
  if (!fs.existsSync(absPath)) {
    console.warn(`[icons] skip (missing): ${path.relative(ROOT, absPath)}`);
    return;
  }
  const before = fs.statSync(absPath).size;
  const img = sharp(absPath);
  const meta = await img.metadata();
  const w = meta.width ?? maxEdge;
  const h = meta.height ?? maxEdge;
  const longest = Math.max(w, h);
  let pipeline = img;
  if (longest > maxEdge) {
    pipeline = pipeline.resize(maxEdge, maxEdge, { fit: 'inside', withoutEnlargement: true });
  }
  const buf = await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  fs.writeFileSync(absPath, buf);
  const after = buf.length;
  console.log(
    `[icons] ${path.relative(ROOT, absPath)}  ${(before / 1024).toFixed(1)} KiB → ${(after / 1024).toFixed(1)} KiB`
  );
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
  const ex = raw.expo ?? {};
  const paths = new Set();
  if (ex.icon) paths.add(relToAbs(ex.icon));
  if (ex.splash?.image) paths.add(relToAbs(ex.splash.image));
  if (ex.android?.adaptiveIcon?.foregroundImage)
    paths.add(relToAbs(ex.android.adaptiveIcon.foregroundImage));
  if (ex.android?.adaptiveIcon?.backgroundImage)
    paths.add(relToAbs(ex.android.adaptiveIcon.backgroundImage));
  if (ex.web?.favicon) paths.add(relToAbs(ex.web.favicon));

  // Foreground: keep enough resolution for Play adaptive icon (512+ source is fine).
  const foregroundMax = 512;
  const splashMax = 1280;
  const faviconMax = 256;
  const defaultMax = 1024;

  for (const p of paths) {
    const rel = path.relative(ROOT, p).replace(/\\/g, '/');
    let max = defaultMax;
    if (rel.includes('icon-forground') || rel.includes('adaptiveIcon')) max = foregroundMax;
    if (rel.includes('splash')) max = splashMax;
    if (rel.includes('favicon')) max = faviconMax;
    await optimizePng(p, max);
  }
  console.log('[icons] done');
}

await main().catch((e) => {
  console.error(e);
  process.exit(1);
});
