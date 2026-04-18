import { useEffect, useMemo, useState } from 'react';
import type { Drink, IngredientMatch } from '../utils/types';
import { getAllDrinks } from '../storage/db';

function scoreMatch(drink: Drink, selectedSet: Set<string>): IngredientMatch {
  const have: string[] = [];
  const missing: string[] = [];
  drink.ingredients.forEach((i) => {
    if (selectedSet.has(i.name.toLowerCase())) have.push(i.name);
    else missing.push(i.name);
  });
  const matchScore =
    drink.ingredients.length === 0
      ? 0
      : have.length / drink.ingredients.length;
  let status: IngredientMatch['status'] = 'far';
  if (missing.length === 0) status = 'ready';
  // Only "almost" when this drink already shares the bar — not every 2-ingredient
  // recipe when the user picked something unrelated (missing ≤2 was too loose).
  else if (have.length > 0 && missing.length <= 2) status = 'almost';
  return { drink, have, missing, matchScore, status };
}

export function useIngredientMatcher(selected: string[]) {
  const [all, setAll] = useState<Drink[]>(() => getAllDrinks());
  useEffect(() => {
    if (all.length === 0) setAll(getAllDrinks());
  }, [all.length]);

  return useMemo(() => {
    if (selected.length === 0) {
      return {
        ready: [] as IngredientMatch[],
        almost: [] as IngredientMatch[],
        far: [] as IngredientMatch[],
        all: [] as IngredientMatch[],
      };
    }

    const selectedSet = new Set(selected.map((s) => s.toLowerCase()));
    const scored = all.map((d) => scoreMatch(d, selectedSet));

    const ready = scored
      .filter((m) => m.status === 'ready')
      .sort((a, b) => b.matchScore - a.matchScore);
    const almost = scored
      .filter((m) => m.status === 'almost')
      .sort((a, b) => b.matchScore - a.matchScore);
    const far = scored
      .filter((m) => m.status === 'far')
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return { ready, almost, far, all: scored };
  }, [selected, all]);
}

export function matchDrink(drink: Drink, selected: string[]): IngredientMatch {
  return scoreMatch(drink, new Set(selected.map((s) => s.toLowerCase())));
}
