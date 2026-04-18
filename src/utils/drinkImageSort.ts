import { hasBundledDrinkImage } from '../../assets/images/drinks';
import type { Drink } from './types';

function imageKey(d: Pick<Drink, 'image_path' | 'slug'>): string {
  return d.image_path || d.slug;
}

/** Home deck / ribbons: only drinks with a bundled WebP in the app. */
export function filterDrinksWithBundledImagesOnly<T extends Pick<Drink, 'image_path' | 'slug'>>(
  drinks: T[]
): T[] {
  return drinks.filter((d) => hasBundledDrinkImage(imageKey(d)));
}

/**
 * Front-of-house lists: drinks with bundled art first, then higher rating,
 * then name (stable, predictable).
 */
export function sortDrinksWithBundledImagesFirst(drinks: Drink[]): Drink[] {
  return [...drinks].sort((a, b) => {
    const ha = hasBundledDrinkImage(imageKey(a)) ? 1 : 0;
    const hb = hasBundledDrinkImage(imageKey(b)) ? 1 : 0;
    if (hb !== ha) return hb - ha;
    const ra = a.rating ?? 0;
    const rb = b.rating ?? 0;
    if (rb !== ra) return rb - ra;
    return a.name.localeCompare(b.name);
  });
}
