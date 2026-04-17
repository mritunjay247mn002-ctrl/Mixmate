import { useMemo } from 'react';
import { Drink, IngredientMatch } from '../utils/types';
import data from '../data/recipes.json';

const ALL: Drink[] = data.drinks as Drink[];

function scoreMatch(drink: Drink, selected: string[]): IngredientMatch {
  const selectedSet = new Set(selected.map((s) => s.toLowerCase()));
  const have: string[] = [];
  const missing: string[] = [];
  drink.ingredients.forEach((i) => {
    if (selectedSet.has(i.toLowerCase())) have.push(i);
    else missing.push(i);
  });
  const matchScore = drink.ingredients.length === 0
    ? 0
    : have.length / drink.ingredients.length;
  let status: IngredientMatch['status'] = 'far';
  if (missing.length === 0) status = 'ready';
  else if (missing.length <= 2) status = 'almost';
  return { drink, have, missing, matchScore, status };
}

export function useIngredientMatcher(selected: string[]) {
  return useMemo(() => {
    if (selected.length === 0) {
      return {
        ready: [] as IngredientMatch[],
        almost: [] as IngredientMatch[],
        far: [] as IngredientMatch[],
        all: [] as IngredientMatch[],
      };
    }

    const all = ALL.map((d) => scoreMatch(d, selected));

    const ready = all
      .filter((m) => m.status === 'ready')
      .sort((a, b) => b.matchScore - a.matchScore);
    const almost = all
      .filter((m) => m.status === 'almost')
      .sort((a, b) => b.matchScore - a.matchScore);
    const far = all
      .filter((m) => m.status === 'far')
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return { ready, almost, far, all };
  }, [selected]);
}

export function matchDrink(drink: Drink, selected: string[]): IngredientMatch {
  return scoreMatch(drink, selected);
}
