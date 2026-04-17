# MixMate Offline Drink Images

This folder holds every drink image that ships with the app. There are no
runtime network fetches anywhere in MixMate — if an image is referenced, it is
bundled here.

## Naming convention

`<slug>.png` — lowercase, hyphen-separated. The slug matches the `slug` column
in the SQLite `recipes` table and the `image_path` value stored with every
recipe. Examples:

```
classic-mojito.png
espresso-martini.png
virgin-pina-colada.png
```

Recommended size: **800×800 px, PNG with alpha**. The `DrinkImage` component
will crop and scale as needed.

## Registering a new image

1. Drop the PNG into this folder using the slug of the recipe.
2. Add a line to `assets/images/drinks/index.ts`:

   ```ts
   'classic-mojito': require('./classic-mojito.png'),
   ```

3. Rebuild the app. Metro will bundle it; no other code changes are required.

## Fallback behaviour

If a slug is not present in the registry, `DrinkImage` automatically falls back
to a polished gradient placeholder stamped with the drink's signature emoji.
This means the app is never broken — missing images simply render the
placeholder treatment.
