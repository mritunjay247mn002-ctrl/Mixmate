import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Drink } from '../utils/types';
import {
  addRecentlyViewed as dbAdd,
  getRecentlyViewedDrinks,
} from '../storage/db';

export function useRecentlyViewed() {
  const [recentDrinks, setRecentDrinks] = useState<Drink[]>(() =>
    getRecentlyViewedDrinks()
  );

  useFocusEffect(
    useCallback(() => {
      setRecentDrinks(getRecentlyViewedDrinks());
    }, [])
  );

  const addRecent = useCallback((id: string) => {
    dbAdd(id);
    setRecentDrinks(getRecentlyViewedDrinks());
  }, []);

  return { recentDrinks, addRecent };
}
