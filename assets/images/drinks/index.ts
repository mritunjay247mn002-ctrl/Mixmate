/**
 * Offline drink image registry.
 *
 * Metro requires `require()` calls to use literal string paths, so every image
 * must be listed explicitly here. The app never performs runtime image
 * fetching — anything not listed falls back to the `DrinkImage` gradient
 * placeholder bearing the drink's emoji.
 *
 * To add real images:
 *   1. Drop `<slug>.png` into this folder (slug must match the recipe slug).
 *   2. Add a line below mapping the slug to `require('./<slug>.png')`.
 */
export const DRINK_IMAGES: Record<string, number> = {
  // Example (uncomment after adding the file):
  // 'classic-mojito': require('./classic-mojito.png'),
};

export function resolveDrinkImage(slug: string): number | undefined {
  return DRINK_IMAGES[slug];
}
