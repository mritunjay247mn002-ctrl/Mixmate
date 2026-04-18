# Drink image ingest (manual approval)

## 1. Drop source files

Place candidate images in either location:

1. **`assets/images/drinks/incoming/`** (recommended staging), or  
2. **`assets/images/drinks/`** next to `index.ts` (“loose” files — e.g. stock downloads with long names).

The analyzer labels loose files as `root/<filename>` in the report. Supported extensions: `.png`, `.jpg`, `.jpeg`, `.webp`. (Non-images like `.html` in that folder are ignored.)

## 2. Analyze (machine suggestions)

```bash
npm run images:analyze
```

Outputs:

- `docs/drink-images/REPORT.json`
- `docs/drink-images/REPORT.md`

Each file gets ranked slug candidates with a confidence score. **Only matches at or above 0.97 are considered safe for automatic wiring.**

## 3. Approve mappings

Edit:

`src/data/drink-image-manifest.approved.json`

Use an array of objects:

Use the exact `fileName` from `REPORT.md` / `REPORT.json` (e.g. `root/cocktail-7118989_1280.jpeg` or `incoming/my-shot.png`):

```json
[
  {
    "source": "root/cocktail-7118989_1280.jpeg",
    "slug": "white-mojito",
    "confidence": 0.99,
    "notes": "visually verified"
  }
]
```

Rules enforced by `npm run images:apply`:

- `confidence` must be **>= 0.97**
- `slug` must exist in `src/data/recipes.json`
- If `docs/drink-images/REPORT.json` exists, the file must appear in the report and the top machine candidate must match **unless** you set `"override": true` with a detailed `notes` string (>= 12 characters) documenting human review.

## 4. Apply (encode WebP + Metro registry + gradients)

```bash
npm run images:apply
```

### Bulk apply (no renaming — uses REPORT top-1 per drink)

If filenames are messy (stock / AI names), you can apply **automatically** from the last analyze report:

```bash
npm run images:analyze
npm run images:apply:auto
```

That uses **only** pairs where the model confidence is **≥ 0.97** (same bar as before, but no hand-edited JSON).

To apply **more** images when the matcher is less sure (may map wrong drinks — you should spot-check in the app):

```bash
npm run images:analyze
npm run images:apply:auto-risky
```

(`auto-risky` uses `--min-confidence=0.88` and requires `--yes` internally.)

This script:

- Writes each approved file to `assets/images/drinks/<slug>.webp` (max edge **640px**, WebP via `sharp`; removes legacy `<slug>.png` for that slug)
- Migrates any existing canonical `.png` in that folder to `.webp` on the next run
- Regenerates `assets/images/drinks/index.ts` with literal `require('./<slug>.webp')` (or `.png` only if a legacy PNG remains)
- Merges `src/data/drink-image-gradients.json` with a 2-stop gradient + accent derived from the image pixels

Optional flag:

```bash
node scripts/drink-images/apply-approved.mjs --force
```

## 5. UI

`DrinkImage`, swipe `DrinkDeck` cards, and `MatchDrinkCard` use `heroGradFor(slug, category)` from `src/utils/theme.ts`, which prefers per-slug gradients when present.

## Notes

- Only canonical `<recipe-slug>.webp` (or legacy `.png`) in `assets/images/drinks/` are bundled via `index.ts`. Random filenames must go through **incoming → manifest → apply**.
- Do not hand-edit `assets/images/drinks/index.ts` after apply; re-run `images:apply` instead.

## Measuring Android release size

After `eas build --platform android --profile production` (or a local release build), open the **APK** or **AAB** in **Android Studio → Build → Analyze APK…** and compare **lib/**, **res/**, **assets/**, and **classes*.dex** before and after changes.

Local release APK (Windows):

```bash
cd android
.\gradlew.bat assembleRelease
```

Artifact: `android/app/build/outputs/apk/release/app-release.apk` (signing uses debug keystore until you configure release signing).
