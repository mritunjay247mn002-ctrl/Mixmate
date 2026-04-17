import { useState, useEffect, useCallback } from 'react';
import { getRecentlyViewed, addRecentlyViewed } from '../storage/db';
import { Drink } from '../utils/types';
import data from '../data/recipes.json';

const ALL: Drink[] = data.drinks as Drink[];

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(getRecentlyViewed());
  }, []);

  const addRecent = useCallback((id: string) => {
    addRecentlyViewed(id);
    setIds(getRecentlyViewed());
  }, []);

  const recentDrinks = ids
    .map((id) => ALL.find((d) => d.id === id))
    .filter((d): d is Drink => d !== undefined);

  return { recentDrinks, addRecent };
}
