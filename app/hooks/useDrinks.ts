import { useMemo } from 'react';
import { Drink, FilterType, MoodKey } from '../utils/types';
import { MOODS } from '../utils/theme';
import data from '../data/recipes.json';

const ALL: Drink[] = data.drinks as Drink[];

export function getAllDrinks(): Drink[] {
  return ALL;
}

export function getAllIngredients(): string[] {
  const set = new Set<string>();
  ALL.forEach((d) => d.ingredients.forEach((i) => set.add(i)));
  return Array.from(set).sort();
}

export function getDrinkById(id: string): Drink | undefined {
  return ALL.find((d) => d.id === id);
}

export function useDrinks(
  query: string,
  filter: FilterType,
  mood: MoodKey = 'all'
) {
  const filtered = useMemo(() => {
    let list = ALL;
    if (filter === 'cocktail') list = list.filter((d) => d.type === 'cocktail');
    else if (filter === 'mocktail') list = list.filter((d) => d.type === 'mocktail');
    else if (filter === 'popular') list = list.filter((d) => d.isPopular === true);
    else if (filter === 'quick')
      list = list.filter((d) => typeof d.prepTime === 'number' && d.prepTime <= 5);

    if (mood && mood !== 'all') {
      const m = MOODS.find((x) => x.key === mood);
      if (m) list = list.filter((d) => m.match(d));
    }

    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.ingredients.some((i) => i.toLowerCase().includes(q)) ||
          (d.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [query, filter, mood]);

  const featured = useMemo(
    () => ALL.filter((d) => d.isPopular === true).slice(0, 6),
    []
  );

  const trending = useMemo(
    () => ALL.filter((d) => d.isTrending === true).slice(0, 6),
    []
  );

  return { filtered, featured, trending };
}
