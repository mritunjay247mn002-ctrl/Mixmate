import { useState, useEffect, useCallback } from 'react';
import { getFavorites, addFavorite, removeFavorite } from '../storage/db';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFavorites(new Set(getFavorites()));
    setLoading(false);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        removeFavorite(id);
      } else {
        next.add(id);
        addFavorite(id);
      }
      return next;
    });
  }, []);

  return { favorites, toggleFavorite, loading };
}
