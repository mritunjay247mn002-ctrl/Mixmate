# MixMate Offline Drink Images

Shipped drink images live here as **`<slug>.webp`** (max edge **640px**, quality ~82; slug matches `src/data/recipes.json`). Only files referenced from `index.ts` are bundled — there are no runtime network fetches.

## Recommended workflow

1. Drop **raw** photos into `incoming/` (any filename) or use `docs/drink-images/drink_images/` with `apply-docs-upload.mjs`.
2. Run `npm run images:analyze` → review `docs/drink-images/REPORT.md` (regenerated each run; ignored in `.gitignore` if present).
3. Fill `src/data/drink-image-manifest.approved.json` with only high-confidence rows.
4. Run `npm run images:apply` → writes `<slug>.webp`, regenerates `index.ts`, updates `src/data/drink-image-gradients.json`.

**No time to edit JSON?** After analyze, run `npm run images:apply:auto` to wire every image whose top match is already ≥97% confidence. For more coverage (with some wrong-pair risk), see `npm run images:apply:auto-risky` in [`docs/drink-images/README.md`](../../docs/drink-images/README.md).

See [`docs/drink-images/README.md`](../../docs/drink-images/README.md) for full details.

## Naming (canonical files)

```
white-mojito.webp
espresso-martini.webp
virgin-pina-colada.webp
```

Source photos can be any size; the apply script resizes to **640px** max edge. In the app, drink art uses **`resizeMode: 'contain'`** so the full glass stays visible.

## Duplicate files

Run `npm run images:dedupe` to remove extra `.webp` files that are **byte-identical** to another (keeps one slug per file). Re-run `npm run images:audit` to verify.

## Fallback (no bundled photo)

If a slug has no `DRINK_IMAGES` entry, the UI shows that drink’s **`emoji`** from `recipes.json` on the category gradient (no wrong stock photo). `FALLBACK_DRINK_IMAGE` in `index.ts` remains for rare tooling only.
