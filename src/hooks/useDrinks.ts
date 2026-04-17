import { useEffect, useMemo, useState } from 'react';
import type { AlcoholFilter, Drink, MoodKey } from '../utils/types';
import { MOODS } from '../utils/theme';
import { getAllDrinks, queryDrinks } from '../storage/db';

/**
 * Load the full recipe table once per JS runtime. SQLite backs this but the
 * data is essentially static — we rerun the underlying query on a mount so
 * changes after the initial seed (e.g. dev hot-reload) stay fresh.
 */
function useAllDrinks(): Drink[] {
  const [all, setAll] = useState<Drink[]>(() => getAllDrinks());
  useEffect(() => {
    if (all.length === 0) setAll(getAllDrinks());
  }, [all.length]);
  return all;
}

export function useDrinks(
  query: string,
  filter: AlcoholFilter,
  mood: MoodKey = 'all'
) {
  const all = useAllDrinks();

  // Primary filtered list (alcohol filter + query go through SQL indexes).
  const filtered = useMemo(() => {
    let list = queryDrinks({ filter, query });
    if (mood && mood !== 'all') {
      const m = MOODS.find((x) => x.key === mood);
      if (m) list = list.filter((d) => m.match(d));
    }
    return list;
  }, [filter, query, mood]);

  const featured = useMemo(
    () => all.filter((d) => d.is_popular).slice(0, 6),
    [all]
  );
  const trending = useMemo(
    () => all.filter((d) => d.is_trending).slice(0, 6),
    [all]
  );

  return { filtered, featured, trending, all };
}

export function getAllIngredientNames(): string[] {
  const set = new Set<string>();
  getAllDrinks().forEach((d) =>
    d.ingredients.forEach((i) => set.add(i.name.toLowerCase()))
  );
  return Array.from(set).sort();
}

export { getAllDrinks, getDrinkById } from '../storage/db';
