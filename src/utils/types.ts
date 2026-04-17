export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export type AlcoholLevel = 'none' | 'low' | 'medium' | 'high';
export type DrinkType = 'cocktail' | 'mocktail';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Drink {
  id: string;
  name: string;
  slug: string;
  type: DrinkType;
  category: string;
  glass: string;
  ingredients: Ingredient[];
  steps: string[];
  image_path: string;
  emoji: string;
  tags: string[];
  taste_profile: string[];
  alcohol_level: AlcoholLevel;
  alcohol_percentage: number;
  prep_time: number;
  difficulty: Difficulty;
  rating: number;
  is_popular: boolean;
  is_trending: boolean;
}

// UI filter for the big "alcoholic / non-alcoholic / all" card toggle.
export type AlcoholFilter = 'all' | 'cocktail' | 'mocktail';

// Secondary quick filters still supported by useDrinks.
export type ListFilter = 'all' | 'popular' | 'quick';

export type MoodKey =
  | 'all' | 'bold' | 'fresh' | 'sweet' | 'party' | 'chill' | 'quick' | 'zero';

export interface IngredientMatch {
  drink: Drink;
  missing: string[];
  have: string[];
  matchScore: number;
  status: 'ready' | 'almost' | 'far';
}

// ── helpers ────────────────────────────────────────────────────────────────

export function ingredientNames(d: Pick<Drink, 'ingredients'>): string[] {
  return d.ingredients.map((i) => i.name);
}

export function formatIngredient(i: Ingredient): string {
  const q = Number.isInteger(i.quantity) ? i.quantity : Number(i.quantity.toFixed(1));
  const u = i.unit;
  if (u === 'whole' && q === 1) return i.name;
  if (u === 'whole' || u === 'piece' || u === 'pieces' || u === 'slices' ||
      u === 'slice' || u === 'scoop' || u === 'scoops' || u === 'sprig' ||
      u === 'sprigs' || u === 'leaves' || u === 'strands' || u === 'wedge' ||
      u === 'wedges' || u === 'large cube') {
    return `${q} ${i.name}`;
  }
  if (u === 'pinch') return `pinch of ${i.name}`;
  if (u === 'dash' || u === 'dashes') return `${q} dash${q > 1 ? 'es' : ''} ${i.name}`;
  if (u === 'drops') return `${q} drops ${i.name}`;
  if (u === 'strip') return `${i.name} peel`;
  if (u === 'cup' || u === 'cups') return `${q} ${u} ${i.name}`;
  return `${q} ${u} ${i.name}`;
}
