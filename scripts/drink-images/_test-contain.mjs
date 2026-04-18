import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const src = path.join(ROOT, 'docs', 'drink-images', 'drink_images', 'aviation.jpg');
const out = path.join(ROOT, 'assets', 'images', 'drinks', '_test-contain.webp');

await sharp(src)
  .rotate()
  .resize(640, 640, {
    fit: 'contain',
    position: 'centre',
    background: { r: 7, g: 2, b: 15, alpha: 1 },
    withoutEnlargement: false,
  })
  .webp({ quality: 82 })
  .toFile(out);
console.log('wrote', out);
