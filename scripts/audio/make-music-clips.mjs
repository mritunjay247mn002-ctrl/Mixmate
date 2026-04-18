/**
 * Builds ~40s AAC-LC .m4a clips for bundled background music (reduces APK/AAB size).
 *
 *   node scripts/audio/make-music-clips.mjs
 *
 * Requires source MP3s under assets/Drinkmusic/sources/ (not bundled; gitignored).
 * Uses ffmpeg-static (no system ffmpeg).
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const drinkDir = path.join(root, 'assets', 'Drinkmusic');
const sourcesDir = path.join(drinkDir, 'sources');
const outDir = path.join(drinkDir, 'clips');

/** 40s clips, 96k mono AAC; -ss skips intro dead air where helpful */
const JOBS = [
  {
    src: 'amaksi-lounge-bar-233471.mp3',
    out: 'lounge.m4a',
    ss: 25,
  },
  {
    src: 'backgroundmusicforvideos-jazz-bar-music-restaurant-whiskey-coctail-background-intro-theme-284460.mp3',
    out: 'whiskey-jazz.m4a',
    ss: 30,
  },
  {
    src: 'bransboynd-cocktail-bar-421413.mp3',
    out: 'cocktail.m4a',
    ss: 20,
  },
  {
    src: 'moonpub-slow-hotel-lounge-jazz-music-506551.mp3',
    out: 'hotel-lounge.m4a',
    ss: 35,
  },
  {
    src: 'soulprodmusic-bar-sad-calm-chillhop-lofi-background-music-122128.mp3',
    out: 'chillhop.m4a',
    ss: 15,
  },
];

const DURATION_SEC = 40;
const BITRATE = '96k';

function main() {
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    console.error('ffmpeg-static binary not found.');
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  for (const { src, out, ss } of JOBS) {
    const input = path.join(sourcesDir, src);
    const output = path.join(outDir, out);
    if (!fs.existsSync(input)) {
      console.error(`Missing source: ${input}`);
      process.exit(1);
    }

    const args = [
      '-y',
      '-ss',
      String(ss),
      '-i',
      input,
      '-t',
      String(DURATION_SEC),
      '-vn',
      '-c:a',
      'aac',
      '-b:a',
      BITRATE,
      '-ac',
      '1',
      '-movflags',
      '+faststart',
      output,
    ];

    const r = spawnSync(ffmpegPath, args, {
      stdio: 'inherit',
      encoding: 'utf8',
    });
    if (r.status !== 0) {
      console.error(`ffmpeg failed for ${src} -> ${out}`);
      process.exit(r.status ?? 1);
    }
    const st = fs.statSync(output);
    console.log(`OK ${out} (${(st.size / 1024).toFixed(0)} KiB)`);
  }

  console.log('\nDone. App uses clips/*.m4a via src/audio/tracks.ts; keep full MP3s only under sources/ (ignored by git).');
}

main();
