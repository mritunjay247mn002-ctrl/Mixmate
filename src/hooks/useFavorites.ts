import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Drink } from '../utils/types';
import * as db from '../storage/db';

/**
 * Favorites are kept as a Set in React state for instant UI toggle feedback,
 * but every change is also persisted to the SQLite `favorites` table. On every
 * screen focus we re-read from the DB so newly saved drinks show up instantly
 * without manually refreshing the list.
 */
export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set(db.getFavoriteIds()));

  useFocusEffect(
    useCallback(() => {
      setFavoriteIds(new Set(db.getFavoriteIds()));
    }, [])
  );

  const toggleFavorite = useCallback((id: string) => {
    const added = db.toggleFavorite(id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (added) next.add(id); else next.delete(id);
      return next;
    });
    return added;
  }, []);

  const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);

  return { favorites: favoriteIds, toggleFavorite, isFavorite };
}

/**
 * Favorites list hook that joins against the recipes table so the caller
 * receives hydrated Drink objects. Auto-refreshes on focus.
 */
export function useFavoriteDrinks(): { drinks: Drink[]; refresh: () => void } {
  const [drinks, setDrinks] = useState<Drink[]>(() => db.getFavoriteDrinks());

  const refresh = useCallback(() => {
    setDrinks(db.getFavoriteDrinks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { drinks, refresh };
}
