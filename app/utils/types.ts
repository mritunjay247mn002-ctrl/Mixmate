export interface Drink {
  id: string;
  name: string;
  type: 'cocktail' | 'mocktail';
  ingredients: string[];
  steps: string[];
  image: string;
  category: string;
  prepTime?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  isTrending?: boolean;
  isPopular?: boolean;
  rating?: number;
}

export type FilterType = 'all' | 'cocktail' | 'mocktail' | 'popular' | 'quick';

export type MoodKey =
  | 'all' | 'bold' | 'fresh' | 'sweet' | 'party' | 'chill' | 'quick' | 'zero';

export interface IngredientMatch {
  drink: Drink;
  missing: string[];
  have: string[];
  matchScore: number;
  status: 'ready' | 'almost' | 'far';
}
