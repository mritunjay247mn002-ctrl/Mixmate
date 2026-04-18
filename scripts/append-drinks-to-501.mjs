/**
 * Expands src/data/recipes.json to 501 drinks with unique slugs.
 * Run from repo root: node scripts/append-drinks-to-501.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const recipesPath = path.join(__dirname, '..', 'src', 'data', 'recipes.json');

function slug(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SHAKE = [
  'Add all liquid ingredients to a shaker with ice.',
  'Shake hard for 10–12 seconds until frosty.',
  'Double-strain into a chilled glass.',
  'Garnish and serve at once.',
];
const STIR = [
  'Combine ingredients in a mixing glass filled with ice.',
  'Stir until ice-cold and slightly diluted.',
  'Strain into a chilled glass.',
  'Finish with the garnish and serve.',
];
const BUILD = [
  'Fill a chilled glass with ice.',
  'Pour spirits first, then modifiers.',
  'Top with mixer and stir gently once.',
  'Garnish and serve.',
];

/** @typedef {{ name: string, type: 'cocktail'|'mocktail', category: string, glass: string, ingredients: {name:string,quantity:number,unit:string}[], steps: string[], tags: string[], taste_profile: string[], emoji: string, prep_time?: number, difficulty?: string, rating?: number, alcohol_level?: string, alcohol_percentage?: number }} Row */

/** @param {Row} r */
function row(r) {
  const isMock = r.type === 'mocktail';
  return {
    ...r,
    slug: slug(r.name),
    image_path: slug(r.name),
    prep_time: r.prep_time ?? 5,
    difficulty: r.difficulty ?? 'easy',
    rating: r.rating ?? 4.3,
    is_popular: false,
    is_trending: false,
    alcohol_level: r.alcohol_level ?? (isMock ? 'none' : 'medium'),
    alcohol_percentage: r.alcohol_percentage ?? (isMock ? 0 : 18),
  };
}

/** @type {Row[]} */
const CLASSICS = [
  row({
    name: 'Manhattan',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 30, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'stirred', 'whiskey'],
    taste_profile: ['rich', 'bitter', 'warming'],
    emoji: '🥃',
    rating: 4.9,
  }),
  row({
    name: 'Perfect Manhattan',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 50, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 15, unit: 'ml' },
      { name: 'dry vermouth', quantity: 15, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'stirred'],
    taste_profile: ['rich', 'dry', 'bitter'],
    emoji: '🥃',
  }),
  row({
    name: 'Rob Roy',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'scotch whisky', quantity: 60, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 30, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'scotch'],
    taste_profile: ['smoky', 'rich', 'bitter'],
    emoji: '🥃',
  }),
  row({
    name: 'Martinez',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'gin', quantity: 45, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 45, unit: 'ml' },
      { name: 'maraschino liqueur', quantity: 10, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'gin'],
    taste_profile: ['floral', 'rich', 'bitter'],
    emoji: '🍸',
  }),
  row({
    name: 'Brooklyn',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'dry vermouth', quantity: 20, unit: 'ml' },
      { name: 'amaretto', quantity: 10, unit: 'ml' },
      { name: 'angostura bitters', quantity: 1, unit: 'dash' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'whiskey'],
    taste_profile: ['nutty', 'dry', 'bitter'],
    emoji: '🥃',
  }),
  row({
    name: 'Vieux Carré',
    type: 'cocktail',
    category: 'Classic',
    glass: 'rocks',
    ingredients: [
      { name: 'rye whiskey', quantity: 30, unit: 'ml' },
      { name: 'cognac', quantity: 30, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 30, unit: 'ml' },
      { name: 'bénédictine', quantity: 7, unit: 'ml' },
      { name: 'angostura bitters', quantity: 1, unit: 'dash' },
      { name: 'peychaud bitters', quantity: 1, unit: 'dash' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'new orleans'],
    taste_profile: ['herbal', 'rich', 'bitter'],
    emoji: '🥃',
  }),
  row({
    name: 'Tipperary',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'irish whiskey', quantity: 45, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 30, unit: 'ml' },
      { name: 'green chartreuse', quantity: 15, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'irish'],
    taste_profile: ['herbal', 'warming', 'bitter'],
    emoji: '☘️',
  }),
  row({
    name: 'Bobby Burns',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'scotch whisky', quantity: 60, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 30, unit: 'ml' },
      { name: 'bénédictine', quantity: 10, unit: 'ml' },
      { name: 'angostura bitters', quantity: 1, unit: 'dash' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'scotch'],
    taste_profile: ['herbal', 'smoky', 'rich'],
    emoji: '🥃',
  }),
  row({
    name: 'Hanky Panky',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'gin', quantity: 45, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 45, unit: 'ml' },
      { name: 'fernet-branca', quantity: 7, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'bitter'],
    taste_profile: ['bitter', 'herbal', 'rich'],
    emoji: '🍸',
  }),
  row({
    name: 'Remember the Maine',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 20, unit: 'ml' },
      { name: 'cherry liqueur', quantity: 10, unit: 'ml' },
      { name: 'absinthe', quantity: 5, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'absinthe'],
    taste_profile: ['rich', 'herbal', 'bitter'],
    emoji: '🥃',
  }),
  row({
    name: 'Monte Carlo',
    type: 'cocktail',
    category: 'Classic',
    glass: 'rocks',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'bénédictine', quantity: 22, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'large cube' },
    ],
    steps: STIR,
    tags: ['classic', 'whiskey'],
    taste_profile: ['herbal', 'sweet', 'warming'],
    emoji: '🥃',
  }),
  row({
    name: 'Clover Club',
    type: 'cocktail',
    category: 'Sour',
    glass: 'coupe',
    ingredients: [
      { name: 'gin', quantity: 60, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 22, unit: 'ml' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      { name: 'egg white', quantity: 1, unit: 'whole' },
      { name: 'raspberry puree', quantity: 15, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['sour', 'gin', 'foamy'],
    taste_profile: ['sour', 'fruity', 'creamy'],
    emoji: '🍸',
  }),
  row({
    name: 'Pink Lady',
    type: 'cocktail',
    category: 'Sour',
    glass: 'coupe',
    ingredients: [
      { name: 'gin', quantity: 45, unit: 'ml' },
      { name: 'brandy', quantity: 15, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 20, unit: 'ml' },
      { name: 'grenadine', quantity: 10, unit: 'ml' },
      { name: 'egg white', quantity: 1, unit: 'whole' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['sour', 'classic'],
    taste_profile: ['sour', 'fruity', 'creamy'],
    emoji: '🍸',
  }),
  row({
    name: 'Scofflaw',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 45, unit: 'ml' },
      { name: 'dry vermouth', quantity: 30, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 22, unit: 'ml' },
      { name: 'grenadine', quantity: 10, unit: 'ml' },
      { name: 'angostura bitters', quantity: 1, unit: 'dash' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['classic', 'whiskey'],
    taste_profile: ['sour', 'dry', 'fruity'],
    emoji: '🥃',
  }),
  row({
    name: 'Ward Eight',
    type: 'cocktail',
    category: 'Sour',
    glass: 'rocks',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 22, unit: 'ml' },
      { name: 'fresh orange juice', quantity: 15, unit: 'ml' },
      { name: 'grenadine', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['sour', 'whiskey'],
    taste_profile: ['sour', 'fruity', 'refreshing'],
    emoji: '🥃',
  }),
  row({
    name: 'Paper Plane',
    type: 'cocktail',
    category: 'Modern Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'bourbon whiskey', quantity: 22, unit: 'ml' },
      { name: 'aperol', quantity: 22, unit: 'ml' },
      { name: 'amaro', quantity: 22, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 22, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['modern', 'equal parts'],
    taste_profile: ['bitter', 'citrus', 'herbal'],
    emoji: '✈️',
  }),
  row({
    name: 'Penicillin',
    type: 'cocktail',
    category: 'Modern Classic',
    glass: 'rocks',
    ingredients: [
      { name: 'scotch whisky', quantity: 60, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 22, unit: 'ml' },
      { name: 'honey syrup', quantity: 15, unit: 'ml' },
      { name: 'fresh ginger', quantity: 3, unit: 'slices' },
      { name: 'scotch whisky', quantity: 5, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['modern', 'smoky', 'ginger'],
    taste_profile: ['smoky', 'sour', 'spicy'],
    emoji: '🥃',
  }),
  row({
    name: 'Trinidad Sour',
    type: 'cocktail',
    category: 'Bitter',
    glass: 'coupe',
    ingredients: [
      { name: 'angostura bitters', quantity: 45, unit: 'ml' },
      { name: 'rye whiskey', quantity: 15, unit: 'ml' },
      { name: 'orgeat syrup', quantity: 30, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 22, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['bitter', 'sour'],
    taste_profile: ['bitter', 'sour', 'nutty'],
    emoji: '🍸',
  }),
  row({
    name: 'Naked and Famous',
    type: 'cocktail',
    category: 'Modern Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'mezcal', quantity: 22, unit: 'ml' },
      { name: 'aperol', quantity: 22, unit: 'ml' },
      { name: 'green chartreuse', quantity: 22, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 22, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['modern', 'mezcal'],
    taste_profile: ['smoky', 'bitter', 'citrus'],
    emoji: '🔥',
  }),
  row({
    name: 'Division Bell',
    type: 'cocktail',
    category: 'Modern Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'mezcal', quantity: 22, unit: 'ml' },
      { name: 'aperol', quantity: 22, unit: 'ml' },
      { name: 'maraschino liqueur', quantity: 22, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 22, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['modern', 'mezcal'],
    taste_profile: ['smoky', 'citrus', 'floral'],
    emoji: '🔔',
  }),
  row({
    name: 'Final Ward',
    type: 'cocktail',
    category: 'Modern Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 22, unit: 'ml' },
      { name: 'green chartreuse', quantity: 22, unit: 'ml' },
      { name: 'maraschino liqueur', quantity: 22, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 22, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['modern', 'equal parts'],
    taste_profile: ['herbal', 'sour', 'rich'],
    emoji: '🥃',
  }),
  row({
    name: 'Gold Rush',
    type: 'cocktail',
    category: 'Sour',
    glass: 'rocks',
    ingredients: [
      { name: 'bourbon whiskey', quantity: 60, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 22, unit: 'ml' },
      { name: 'honey syrup', quantity: 22, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['sour', 'bourbon'],
    taste_profile: ['sour', 'sweet', 'warming'],
    emoji: '🥃',
  }),
  row({
    name: 'Brown Derby',
    type: 'cocktail',
    category: 'Sour',
    glass: 'coupe',
    ingredients: [
      { name: 'bourbon whiskey', quantity: 60, unit: 'ml' },
      { name: 'fresh grapefruit juice', quantity: 30, unit: 'ml' },
      { name: 'honey syrup', quantity: 15, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['sour', 'bourbon'],
    taste_profile: ['sour', 'citrus', 'sweet'],
    emoji: '🥃',
  }),
  row({
    name: 'Hemingway Daiquiri',
    type: 'cocktail',
    category: 'Sour',
    glass: 'coupe',
    ingredients: [
      { name: 'white rum', quantity: 60, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 22, unit: 'ml' },
      { name: 'grapefruit juice', quantity: 22, unit: 'ml' },
      { name: 'maraschino liqueur', quantity: 15, unit: 'ml' },
      { name: 'sugar syrup', quantity: 5, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['rum', 'sour'],
    taste_profile: ['sour', 'citrus', 'dry'],
    emoji: '🍹',
  }),
  row({
    name: 'Hotel Nacional Special',
    type: 'cocktail',
    category: 'Tropical',
    glass: 'coupe',
    ingredients: [
      { name: 'gold rum', quantity: 45, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 22, unit: 'ml' },
      { name: 'pineapple juice', quantity: 30, unit: 'ml' },
      { name: 'apricot liqueur', quantity: 15, unit: 'ml' },
      { name: 'sugar syrup', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['rum', 'tropical'],
    taste_profile: ['tropical', 'sour', 'fruity'],
    emoji: '🍍',
  }),
  row({
    name: 'Mary Pickford',
    type: 'cocktail',
    category: 'Tropical',
    glass: 'coupe',
    ingredients: [
      { name: 'white rum', quantity: 60, unit: 'ml' },
      { name: 'pineapple juice', quantity: 45, unit: 'ml' },
      { name: 'grenadine', quantity: 10, unit: 'ml' },
      { name: 'maraschino liqueur', quantity: 7, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['rum', 'tropical'],
    taste_profile: ['sweet', 'tropical', 'fruity'],
    emoji: '🍍',
  }),
  row({
    name: 'El Presidente',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'white rum', quantity: 45, unit: 'ml' },
      { name: 'dry vermouth', quantity: 22, unit: 'ml' },
      { name: 'orange curacao', quantity: 10, unit: 'ml' },
      { name: 'grenadine', quantity: 5, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['rum', 'stirred'],
    taste_profile: ['dry', 'citrus', 'fruity'],
    emoji: '🍹',
  }),
  row({
    name: 'Singapore Sling',
    type: 'cocktail',
    category: 'Long',
    glass: 'highball',
    ingredients: [
      { name: 'gin', quantity: 45, unit: 'ml' },
      { name: 'cherry liqueur', quantity: 15, unit: 'ml' },
      { name: 'cointreau', quantity: 10, unit: 'ml' },
      { name: 'bénédictine', quantity: 10, unit: 'ml' },
      { name: 'pineapple juice', quantity: 90, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
      { name: 'grenadine', quantity: 10, unit: 'ml' },
      { name: 'soda water', quantity: 30, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: BUILD,
    tags: ['long', 'gin'],
    taste_profile: ['fruity', 'refreshing', 'herbal'],
    emoji: '🍸',
  }),
  row({
    name: 'Japanese Cocktail',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'brandy', quantity: 60, unit: 'ml' },
      { name: 'orgeat syrup', quantity: 15, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['brandy', 'classic'],
    taste_profile: ['nutty', 'rich', 'bitter'],
    emoji: '🥃',
  }),
  row({
    name: 'Algonquin',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'dry vermouth', quantity: 30, unit: 'ml' },
      { name: 'pineapple juice', quantity: 30, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['whiskey', 'tropical'],
    taste_profile: ['dry', 'fruity', 'refreshing'],
    emoji: '🥃',
  }),
  row({
    name: 'Tuxedo',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'gin', quantity: 45, unit: 'ml' },
      { name: 'dry vermouth', quantity: 45, unit: 'ml' },
      { name: 'maraschino liqueur', quantity: 5, unit: 'ml' },
      { name: 'absinthe', quantity: 3, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['gin', 'dry'],
    taste_profile: ['dry', 'herbal', 'floral'],
    emoji: '🍸',
  }),
  row({
    name: 'Adonis',
    type: 'cocktail',
    category: 'Low ABV',
    glass: 'coupe',
    ingredients: [
      { name: 'sweet vermouth', quantity: 45, unit: 'ml' },
      { name: 'sherry', quantity: 45, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['sherry', 'aperitif'],
    taste_profile: ['dry', 'nutty', 'bitter'],
    emoji: '🍷',
    alcohol_percentage: 12,
  }),
  row({
    name: 'Bamboo',
    type: 'cocktail',
    category: 'Low ABV',
    glass: 'coupe',
    ingredients: [
      { name: 'dry vermouth', quantity: 45, unit: 'ml' },
      { name: 'sherry', quantity: 45, unit: 'ml' },
      { name: 'angostura bitters', quantity: 3, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['sherry', 'aperitif'],
    taste_profile: ['dry', 'herbal', 'bitter'],
    emoji: '🍷',
    alcohol_percentage: 11,
  }),
  row({
    name: 'Chrysanthemum',
    type: 'cocktail',
    category: 'Low ABV',
    glass: 'coupe',
    ingredients: [
      { name: 'dry vermouth', quantity: 60, unit: 'ml' },
      { name: 'bénédictine', quantity: 22, unit: 'ml' },
      { name: 'absinthe', quantity: 5, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['aperitif', 'herbal'],
    taste_profile: ['herbal', 'dry', 'floral'],
    emoji: '🌼',
    alcohol_percentage: 14,
  }),
  row({
    name: 'Harvard',
    type: 'cocktail',
    category: 'Classic',
    glass: 'rocks',
    ingredients: [
      { name: 'cognac', quantity: 45, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 30, unit: 'ml' },
      { name: 'soda water', quantity: 30, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: BUILD,
    tags: ['brandy', 'long'],
    taste_profile: ['rich', 'bubbly', 'sweet'],
    emoji: '🥃',
  }),
  row({
    name: 'Stone Fence',
    type: 'cocktail',
    category: 'Highball',
    glass: 'highball',
    ingredients: [
      { name: 'bourbon whiskey', quantity: 60, unit: 'ml' },
      { name: 'apple cider', quantity: 120, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: BUILD,
    tags: ['highball', 'apple'],
    taste_profile: ['warming', 'fruity', 'refreshing'],
    emoji: '🍎',
  }),
  row({
    name: 'Horsefeather',
    type: 'cocktail',
    category: 'Highball',
    glass: 'highball',
    ingredients: [
      { name: 'bourbon whiskey', quantity: 60, unit: 'ml' },
      { name: 'fresh ginger beer', quantity: 120, unit: 'ml' },
      { name: 'angostura bitters', quantity: 3, unit: 'dashes' },
      { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: BUILD,
    tags: ['highball', 'ginger'],
    taste_profile: ['spicy', 'warming', 'bubbly'],
    emoji: '🐴',
  }),
  row({
    name: 'Kentucky Buck',
    type: 'cocktail',
    category: 'Highball',
    glass: 'highball',
    ingredients: [
      { name: 'bourbon whiskey', quantity: 60, unit: 'ml' },
      { name: 'fresh ginger beer', quantity: 100, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
      { name: 'strawberry puree', quantity: 20, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: BUILD,
    tags: ['highball', 'strawberry'],
    taste_profile: ['fruity', 'spicy', 'refreshing'],
    emoji: '🍓',
  }),
  row({
    name: 'Irish Maid',
    type: 'cocktail',
    category: 'Smash',
    glass: 'rocks',
    ingredients: [
      { name: 'irish whiskey', quantity: 60, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 22, unit: 'ml' },
      { name: 'cucumber', quantity: 4, unit: 'slices' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      { name: 'elderflower cordial', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['irish', 'cucumber'],
    taste_profile: ['refreshing', 'floral', 'citrus'],
    emoji: '☘️',
  }),
  row({
    name: 'Royal Hawaiian',
    type: 'cocktail',
    category: 'Tropical',
    glass: 'coupe',
    ingredients: [
      { name: 'gin', quantity: 45, unit: 'ml' },
      { name: 'pineapple juice', quantity: 45, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
      { name: 'orgeat syrup', quantity: 15, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['gin', 'tropical'],
    taste_profile: ['tropical', 'nutty', 'citrus'],
    emoji: '🌺',
  }),
  row({
    name: 'Oriental',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 45, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 22, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 22, unit: 'ml' },
      { name: 'orange curacao', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['classic', 'whiskey'],
    taste_profile: ['citrus', 'rich', 'fruity'],
    emoji: '🥃',
  }),
  row({
    name: 'El Diablo',
    type: 'cocktail',
    category: 'Long',
    glass: 'highball',
    ingredients: [
      { name: 'tequila', quantity: 45, unit: 'ml' },
      { name: 'creme de cassis', quantity: 15, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 22, unit: 'ml' },
      { name: 'fresh ginger beer', quantity: 90, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: BUILD,
    tags: ['tequila', 'long'],
    taste_profile: ['spicy', 'fruity', 'refreshing'],
    emoji: '🌵',
  }),
  row({
    name: 'Remember Me',
    type: 'cocktail',
    category: 'Bitter',
    glass: 'rocks',
    ingredients: [
      { name: 'reposado tequila', quantity: 45, unit: 'ml' },
      { name: 'amaro', quantity: 22, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 22, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'large cube' },
    ],
    steps: STIR,
    tags: ['tequila', 'bitter'],
    taste_profile: ['bitter', 'rich', 'herbal'],
    emoji: '🌵',
  }),
  row({
    name: 'Saratoga',
    type: 'cocktail',
    category: 'Classic',
    glass: 'rocks',
    ingredients: [
      { name: 'brandy', quantity: 30, unit: 'ml' },
      { name: 'rye whiskey', quantity: 30, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 30, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['classic', 'split base'],
    taste_profile: ['rich', 'warming', 'bitter'],
    emoji: '🥃',
  }),
  row({
    name: 'Greenpoint',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 22, unit: 'ml' },
      { name: 'green chartreuse', quantity: 12, unit: 'ml' },
      { name: 'angostura bitters', quantity: 1, unit: 'dash' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['whiskey', 'herbal'],
    taste_profile: ['herbal', 'rich', 'bitter'],
    emoji: '🥃',
  }),
  row({
    name: 'Red Hook',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 22, unit: 'ml' },
      { name: 'maraschino liqueur', quantity: 7, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['whiskey', 'bitter'],
    taste_profile: ['bitter', 'rich', 'fruity'],
    emoji: '🥃',
  }),
  row({
    name: 'Black Manhattan',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'amaro', quantity: 30, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['whiskey', 'bitter'],
    taste_profile: ['bitter', 'rich', 'herbal'],
    emoji: '🥃',
  }),
  row({
    name: 'Little Italy',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'campari', quantity: 15, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 22, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['whiskey', 'bitter'],
    taste_profile: ['bitter', 'herbal', 'rich'],
    emoji: '🥃',
  }),
  row({
    name: 'Cobble Hill',
    type: 'cocktail',
    category: 'Modern Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'rye whiskey', quantity: 60, unit: 'ml' },
      { name: 'dry vermouth', quantity: 22, unit: 'ml' },
      { name: 'campari', quantity: 12, unit: 'ml' },
      { name: 'fresh cucumber', quantity: 2, unit: 'slices' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['whiskey', 'vegetal'],
    taste_profile: ['herbal', 'dry', 'refreshing'],
    emoji: '🥒',
  }),
  row({
    name: 'Bensonhurst',
    type: 'cocktail',
    category: 'Modern Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'gin', quantity: 60, unit: 'ml' },
      { name: 'dry vermouth', quantity: 22, unit: 'ml' },
      { name: 'campari', quantity: 12, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['gin', 'bitter'],
    taste_profile: ['bitter', 'dry', 'herbal'],
    emoji: '🍸',
  }),
  row({
    name: 'Tailspin',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'gin', quantity: 45, unit: 'ml' },
      { name: 'sweet vermouth', quantity: 22, unit: 'ml' },
      { name: 'green chartreuse', quantity: 7, unit: 'ml' },
      { name: 'campari', quantity: 7, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['gin', 'bitter'],
    taste_profile: ['bitter', 'herbal', 'rich'],
    emoji: '🍸',
  }),
  row({
    name: 'Presidente',
    type: 'cocktail',
    category: 'Classic',
    glass: 'coupe',
    ingredients: [
      { name: 'white rum', quantity: 45, unit: 'ml' },
      { name: 'dry vermouth', quantity: 22, unit: 'ml' },
      { name: 'orange curacao', quantity: 10, unit: 'ml' },
      { name: 'grenadine', quantity: 8, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: STIR,
    tags: ['rum'],
    taste_profile: ['dry', 'citrus', 'sweet'],
    emoji: '🍹',
  }),
];

const SPIRITS = [
  'gin',
  'vodka',
  'bourbon whiskey',
  'rye whiskey',
  'scotch whisky',
  'irish whiskey',
  'white rum',
  'dark rum',
  'gold rum',
  'tequila',
  'reposado tequila',
  'mezcal',
  'brandy',
  'cognac',
  'pisco',
  'cachaca',
];

const ADJ = [
  'Harbor',
  'Garden',
  'Velvet',
  'Copper',
  'Silver',
  'Ruby',
  'Maple',
  'Smoked',
  'Desert',
  'Pacific',
  'Alpine',
  'Urban',
  'Citrus',
  'Wild',
  'Honey',
  'Spiced',
  'Coastal',
  'Midnight',
  'Solstice',
  'Harvest',
  'Imperial',
  'Royal',
  'Autumn',
  'Spring',
  'Summer',
];

const STYLES = ['Sour', 'Rickey', 'Smash', 'Swizzle', 'Collins', 'Fizz', 'Fix', 'Buck', 'Highball'];

const JUICES = [
  { j: 'white grape juice', cat: 'Fruity', taste: ['fruity', 'refreshing'], e: '🍇' },
  { j: 'pear juice', cat: 'Fruity', taste: ['fruity', 'floral'], e: '🍐' },
  { j: 'white peach juice', cat: 'Fruity', taste: ['fruity', 'sweet'], e: '🍑' },
  { j: 'blackcurrant juice', cat: 'Fruity', taste: ['fruity', 'tart'], e: '🫐' },
  { j: 'cloudy apple juice', cat: 'Refreshing', taste: ['fruity', 'refreshing'], e: '🍎' },
  { j: 'white cranberry juice', cat: 'Refreshing', taste: ['fruity', 'tart'], e: '❄️' },
  { j: 'tangerine juice', cat: 'Citrus', taste: ['citrus', 'sweet'], e: '🍊' },
  { j: 'cara cara orange juice', cat: 'Citrus', taste: ['citrus', 'fruity'], e: '🍊' },
  { j: 'ruby red grapefruit juice', cat: 'Citrus', taste: ['citrus', 'bitter'], e: '🍊' },
  { j: 'white cherry juice', cat: 'Fruity', taste: ['fruity', 'sweet'], e: '🍒' },
  { j: 'lychee nectar', cat: 'Tropical', taste: ['tropical', 'floral'], e: '🍒' },
  { j: 'passionfruit nectar', cat: 'Tropical', taste: ['tropical', 'sour'], e: '🥭' },
  { j: 'guava nectar', cat: 'Tropical', taste: ['tropical', 'fruity'], e: '🍈' },
  { j: 'coconut water', cat: 'Tropical', taste: ['tropical', 'refreshing'], e: '🥥' },
  { j: 'elderflower cordial', cat: 'Floral', taste: ['floral', 'sweet'], e: '🌼' },
];

const CITIES = [
  'Savannah',
  'Charleston',
  'Nashville',
  'Memphis',
  'Austin',
  'Denver',
  'Seattle',
  'Portland',
  'Boston',
  'Chicago',
  'Detroit',
  'Cleveland',
  'Phoenix',
  'Tucson',
  'Santa Fe',
  'Santa Barbara',
  'Monterey',
  'Key West',
  'Asheville',
  'Richmond',
  'Baltimore',
  'Philadelphia',
  'Pittsburgh',
  'Cincinnati',
  'Milwaukee',
  'Minneapolis',
  'Kansas City',
  'St Louis',
  'New Orleans',
  'Houston',
  'Dallas',
  'San Antonio',
  'Salt Lake City',
  'Boise',
  'Reno',
  'Anchorage',
  'Honolulu',
  'Vancouver',
  'Montreal',
  'Toronto',
];

function spiritTitle(s) {
  return s
    .split(' ')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

/** @param {string} name @param {string} spirit */
function genSour(name, spirit) {
  return row({
    name,
    type: 'cocktail',
    category: 'Sour',
    glass: 'coupe',
    ingredients: [
      { name: spirit, quantity: 60, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 22, unit: 'ml' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: SHAKE,
    tags: ['sour', 'shaken'],
    taste_profile: ['sour', 'citrus', 'refreshing'],
    emoji: spirit.includes('rum') ? '🍹' : spirit.includes('tequila') || spirit.includes('mezcal') ? '🌵' : spirit.includes('gin') ? '🍸' : '🥃',
  });
}

/** @param {string} name @param {string} spirit */
function genRickey(name, spirit) {
  return row({
    name,
    type: 'cocktail',
    category: 'Highball',
    glass: 'highball',
    ingredients: [
      { name: spirit, quantity: 60, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 22, unit: 'ml' },
      { name: 'soda water', quantity: 120, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: BUILD,
    tags: ['highball', 'rickey'],
    taste_profile: ['refreshing', 'citrus', 'bubbly'],
    emoji: '🫧',
  });
}

/** @param {string} name @param {typeof JUICES[0]} spec @param {string} herb */
function genMock(name, spec, herb) {
  return row({
    name,
    type: 'mocktail',
    category: spec.cat,
    glass: 'highball',
    ingredients: [
      { name: spec.j, quantity: 90, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
      { name: 'sugar syrup', quantity: 10, unit: 'ml' },
      { name: herb, quantity: 4, unit: 'leaves' },
      { name: 'soda water', quantity: 90, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: [
      'Muddle herbs gently in a shaker.',
      'Add juices, syrup, and ice; shake briefly.',
      'Strain into an ice-filled glass.',
      'Top with soda and stir once.',
    ],
    tags: ['mocktail', 'zero proof'],
    taste_profile: [...spec.taste, 'herbal'],
    emoji: spec.e,
  });
}

const HERBS = ['fresh mint', 'fresh basil', 'fresh thyme', 'fresh sage'];

const data = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
const existing = new Set(data.drinks.map((d) => d.slug));

/** @type {Row[]} */
const pool = [...CLASSICS];

for (const city of CITIES) {
  pool.push(genSour(`The ${city} Sour`, SPIRITS[(city.length + pool.length) % SPIRITS.length]));
}

for (const adj of ADJ) {
  for (const spirit of SPIRITS) {
    pool.push(genSour(`${adj} ${spiritTitle(spirit)} Sour`, spirit));
  }
}

for (const adj of ADJ.slice(0, 12)) {
  for (const spirit of SPIRITS.slice(0, 12)) {
    pool.push(genRickey(`${adj} ${spiritTitle(spirit)} Rickey`, spirit));
  }
}

let mi = 0;
for (const spec of JUICES) {
  for (const herb of HERBS) {
    const n = `${spec.j.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')} ${herb.replace('fresh ', '').replace(/^\w/, (c) => c.toUpperCase())} Refresher`;
    pool.push(genMock(n, spec, herb));
    mi++;
  }
}

const additions = [];
for (const r of pool) {
  const s = slug(r.name);
  if (existing.has(s)) continue;
  existing.add(s);
  additions.push(r);
  if (additions.length >= 165) break;
}

if (additions.length < 165) {
  let n = 0;
  while (additions.length < 165) {
    n++;
    const name = `House Signature Cooler No. ${n}`;
    const s = slug(name);
    if (existing.has(s)) continue;
    existing.add(s);
    additions.push(
      row({
        name,
        type: 'mocktail',
        category: 'Refreshing',
        glass: 'highball',
        ingredients: [
          { name: 'lemonade', quantity: 120, unit: 'ml' },
          { name: 'soda water', quantity: 60, unit: 'ml' },
          { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
          { name: 'ice', quantity: 1, unit: 'cup' },
        ],
        steps: BUILD,
        tags: ['mocktail', 'zero proof'],
        taste_profile: ['refreshing', 'citrus', 'bubbly'],
        emoji: '🧃',
      })
    );
  }
}

let nextId = data.drinks.length + 1;
for (const a of additions) {
  a.id = String(nextId++);
}

data.drinks.push(...additions);

if (data.drinks.length !== 501) {
  console.error(`Expected 501 drinks, got ${data.drinks.length} (added ${additions.length})`);
  process.exit(1);
}

fs.writeFileSync(recipesPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Wrote ${recipesPath} — total ${data.drinks.length} drinks (+${additions.length}).`);
