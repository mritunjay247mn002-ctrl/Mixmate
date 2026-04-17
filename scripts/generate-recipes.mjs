// Generates the MixMate offline recipe dataset.
// Outputs app/data/recipes.json with 300+ well-structured entries.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'app', 'data', 'recipes.json');

function slug(s) {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Canonical data ────────────────────────────────────────────────────────
const SPIRITS = {
  'white rum':        { family: 'rum',     pct: 40, emoji: '🍹' },
  'dark rum':         { family: 'rum',     pct: 40, emoji: '🥃' },
  'gold rum':         { family: 'rum',     pct: 40, emoji: '🍹' },
  'spiced rum':       { family: 'rum',     pct: 35, emoji: '🥃' },
  'coconut rum':      { family: 'rum',     pct: 21, emoji: '🥥' },
  'vodka':            { family: 'vodka',   pct: 40, emoji: '🍸' },
  'citrus vodka':     { family: 'vodka',   pct: 37, emoji: '🍋' },
  'vanilla vodka':    { family: 'vodka',   pct: 35, emoji: '🍦' },
  'raspberry vodka':  { family: 'vodka',   pct: 35, emoji: '🫐' },
  'gin':              { family: 'gin',     pct: 42, emoji: '🍸' },
  'sloe gin':         { family: 'gin',     pct: 26, emoji: '🍷' },
  'tequila':          { family: 'tequila', pct: 38, emoji: '🌵' },
  'reposado tequila': { family: 'tequila', pct: 38, emoji: '🌵' },
  'mezcal':           { family: 'tequila', pct: 40, emoji: '🔥' },
  'bourbon whiskey':  { family: 'whiskey', pct: 45, emoji: '🥃' },
  'rye whiskey':      { family: 'whiskey', pct: 45, emoji: '🥃' },
  'scotch whisky':    { family: 'whiskey', pct: 40, emoji: '🥃' },
  'irish whiskey':    { family: 'whiskey', pct: 40, emoji: '☘️' },
  'japanese whisky':  { family: 'whiskey', pct: 43, emoji: '🥃' },
  'cognac':           { family: 'brandy',  pct: 40, emoji: '🥃' },
  'brandy':           { family: 'brandy',  pct: 38, emoji: '🥃' },
  'pisco':            { family: 'brandy',  pct: 42, emoji: '🍇' },
  'cachaca':          { family: 'rum',     pct: 40, emoji: '🇧🇷' },
  'soju':             { family: 'vodka',   pct: 20, emoji: '🍶' },
  'sake':             { family: 'rice',    pct: 16, emoji: '🍶' },
};

// Taste-profile helpers
const T = {
  refreshing: 'refreshing',
  citrus: 'citrus',
  minty: 'minty',
  sweet: 'sweet',
  sour: 'sour',
  bitter: 'bitter',
  smoky: 'smoky',
  floral: 'floral',
  spicy: 'spicy',
  creamy: 'creamy',
  fruity: 'fruity',
  tropical: 'tropical',
  herbal: 'herbal',
  rich: 'rich',
  dry: 'dry',
  bubbly: 'bubbly',
  warming: 'warming',
  nutty: 'nutty',
  coffee: 'coffee',
};

function aggAlcohol(ingredients) {
  let ml = 0, pure = 0;
  ingredients.forEach((i) => {
    if (i.unit !== 'ml') return;
    ml += i.quantity;
    const sp = SPIRITS[i.name];
    if (sp) pure += (i.quantity * sp.pct) / 100;
    if (/liqueur|aperol|campari|vermouth|triple sec|cointreau|amaretto|baileys|kahlua|chartreuse|cordial|absinthe|prosecco|champagne|wine|sherry|port/i.test(i.name)) {
      const p =
        /aperol|campari/.test(i.name) ? 11 :
        /triple sec|cointreau|amaretto/.test(i.name) ? 24 :
        /vermouth/.test(i.name) ? 17 :
        /baileys|kahlua|coffee liqueur/.test(i.name) ? 17 :
        /chartreuse|absinthe|cordial/.test(i.name) ? 55 :
        /prosecco|champagne|sparkling wine/.test(i.name) ? 12 :
        /wine|sherry|port/.test(i.name) ? 15 :
        20;
      pure += (i.quantity * p) / 100;
    }
  });
  if (ml === 0) return { level: 'none', pct: 0 };
  const totalVol = ml + 40; // add mixer/ice dilution
  const pct = Math.round((pure / totalVol) * 100);
  if (pct === 0) return { level: 'none', pct: 0 };
  if (pct < 5) return { level: 'low', pct };
  if (pct < 15) return { level: 'medium', pct };
  return { level: 'high', pct };
}

// Seeded RNG so regenerating stays stable
let _seed = 42;
function rand() {
  _seed = (_seed * 9301 + 49297) % 233280;
  return _seed / 233280;
}
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function maybe(p) { return rand() < p; }

// ─── Recipe factories ──────────────────────────────────────────────────────

/**
 * Build a recipe from structured parts.
 */
function recipe({ name, type, category, glass, ingredients, steps, tags, taste, emoji, prep = 5, difficulty = 'easy' }) {
  const al = aggAlcohol(ingredients);
  return {
    name,
    slug: slug(name),
    type,
    category,
    glass,
    ingredients,
    steps,
    tags,
    taste_profile: taste,
    emoji,
    image_path: slug(name),
    alcohol_level: type === 'mocktail' ? 'none' : al.level,
    alcohol_percentage: type === 'mocktail' ? 0 : al.pct,
    prep_time: prep,
    difficulty,
    rating: Math.round((4.2 + rand() * 0.7) * 10) / 10,
    is_popular: rand() < 0.22,
    is_trending: rand() < 0.18,
  };
}

// ── Classic cocktails & variants ──
const CLASSICS = [];

// Mojito family
['white rum', 'gold rum', 'spiced rum', 'dark rum'].forEach((sp) => {
  ['Mojito'].forEach(() => {
    CLASSICS.push(recipe({
      name: `${sp.replace(/\brum\b/, '').trim() || 'Classic'} Mojito`.replace(/^\s+/, '').replace(/^(?:classic|white) /i, (m) => m).replace(/^ /, '').replace(/^(.)/, (c) => c.toUpperCase()),
      type: 'cocktail', category: 'Refreshing', glass: 'highball', emoji: '🍹',
      ingredients: [
        { name: sp, quantity: 60, unit: 'ml' },
        { name: 'fresh lime juice', quantity: 25, unit: 'ml' },
        { name: 'sugar syrup', quantity: 15, unit: 'ml' },
        { name: 'fresh mint', quantity: 10, unit: 'leaves' },
        { name: 'soda water', quantity: 60, unit: 'ml' },
        { name: 'ice', quantity: 1, unit: 'cup' },
      ],
      steps: [
        'Muddle mint with sugar syrup in a tall glass.',
        `Add lime juice and ${sp}.`,
        'Fill with crushed ice.',
        'Top with soda water and stir gently from the bottom.',
        'Garnish with a mint sprig and a lime wedge.',
      ],
      tags: ['citrus', 'minty', 'refreshing', sp.split(' ')[0]],
      taste: [T.refreshing, T.citrus, T.minty],
      prep: 5,
    }));
  });
});

// Fruit-infused mojitos
['strawberry', 'raspberry', 'blueberry', 'pineapple', 'watermelon', 'passionfruit', 'mango', 'peach', 'coconut', 'ginger'].forEach((fruit) => {
  CLASSICS.push(recipe({
    name: `${fruit[0].toUpperCase() + fruit.slice(1)} Mojito`,
    type: 'cocktail', category: 'Fruity', glass: 'highball', emoji: '🍓',
    ingredients: [
      { name: 'white rum', quantity: 60, unit: 'ml' },
      { name: `fresh ${fruit}`, quantity: 50, unit: 'g' },
      { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      { name: 'fresh mint', quantity: 8, unit: 'leaves' },
      { name: 'soda water', quantity: 60, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: [
      `Muddle ${fruit} with sugar syrup and mint.`,
      'Add rum and lime juice and stir.',
      'Fill with crushed ice.',
      'Top with soda water.',
      `Garnish with fresh ${fruit} and mint.`,
    ],
    tags: ['citrus', 'fruity', fruit, 'summer'],
    taste: [T.fruity, T.refreshing, T.citrus, T.sweet],
  }));
});

// Margarita family
['Classic', 'Spicy', 'Frozen', 'Tommy\'s', 'Tamarind', 'Mezcal'].forEach((v) => {
  CLASSICS.push(recipe({
    name: `${v} Margarita`,
    type: 'cocktail', category: 'Classic', glass: 'coupe', emoji: '🍸',
    ingredients: [
      { name: v === 'Mezcal' ? 'mezcal' : 'tequila', quantity: 50, unit: 'ml' },
      { name: 'triple sec', quantity: 25, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 25, unit: 'ml' },
      { name: 'agave syrup', quantity: 10, unit: 'ml' },
      ...(v === 'Spicy' ? [{ name: 'jalapeno slices', quantity: 3, unit: 'pieces' }] : []),
      ...(v === 'Tamarind' ? [{ name: 'tamarind paste', quantity: 15, unit: 'ml' }] : []),
      { name: 'salt', quantity: 1, unit: 'pinch' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: [
      'Salt the rim of a chilled glass.',
      v === 'Frozen'
        ? 'Blend all ingredients with ice until smooth.'
        : 'Shake all ingredients with ice for 12 seconds.',
      v === 'Frozen' ? 'Pour into the salted glass.' : 'Strain into the salted glass over fresh ice.',
      'Garnish with a lime wheel.',
    ],
    tags: ['tequila', 'sour', 'classic', slug(v)],
    taste: v === 'Spicy' ? [T.sour, T.spicy, T.citrus] : [T.sour, T.citrus, T.refreshing],
    difficulty: v === 'Frozen' ? 'medium' : 'easy',
  }));
});

// Martini family
[
  { name: 'Classic Martini', gin: 'gin', vermouth: 25, garnish: 'olive or lemon twist', category: 'Classic' },
  { name: 'Dirty Martini', gin: 'gin', vermouth: 15, brine: 10, garnish: 'three olives', category: 'Classic' },
  { name: 'Vodka Martini', gin: 'vodka', vermouth: 15, garnish: 'lemon twist', category: 'Classic' },
  { name: 'Vesper Martini', gin: 'gin', vodka: 30, lillet: 15, garnish: 'lemon twist', category: 'Classic' },
  { name: 'Espresso Martini', coffee: true, category: 'After-Dinner' },
  { name: 'Lychee Martini', lychee: true, category: 'Fruity' },
  { name: 'Apple Martini', apple: true, category: 'Fruity' },
  { name: 'Chocolate Martini', choc: true, category: 'After-Dinner' },
  { name: 'Pornstar Martini', pornstar: true, category: 'Fruity' },
  { name: 'French Martini', french: true, category: 'Fruity' },
  { name: 'Cucumber Martini', cucumber: true, category: 'Refreshing' },
  { name: 'Dry Martini', gin: 'gin', vermouth: 10, garnish: 'lemon twist', dry: true, category: 'Classic' },
].forEach((m) => {
  let ingredients, steps, tags, taste, emoji = '🍸';
  if (m.coffee) {
    ingredients = [
      { name: 'vodka', quantity: 50, unit: 'ml' },
      { name: 'coffee liqueur', quantity: 25, unit: 'ml' },
      { name: 'fresh espresso', quantity: 30, unit: 'ml' },
      { name: 'sugar syrup', quantity: 10, unit: 'ml' },
      { name: 'coffee beans', quantity: 3, unit: 'pieces' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Brew a shot of espresso and allow it to cool briefly.',
      'Add all liquids and ice to a shaker.',
      'Shake hard for 20 seconds to build a thick foam.',
      'Double-strain into a chilled coupe.',
      'Float three coffee beans on the crema.',
    ];
    tags = ['coffee', 'vodka', 'shaken'];
    taste = [T.coffee, T.rich, T.sweet];
    emoji = '☕';
  } else if (m.lychee) {
    ingredients = [
      { name: 'vodka', quantity: 50, unit: 'ml' },
      { name: 'lychee liqueur', quantity: 25, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
      { name: 'lychee syrup', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Add all liquids to a shaker with ice.',
      'Shake for 12 seconds.',
      'Strain into a chilled martini glass.',
      'Garnish with a peeled lychee.',
    ];
    tags = ['vodka', 'floral', 'fruity'];
    taste = [T.floral, T.sweet, T.fruity];
  } else if (m.apple) {
    ingredients = [
      { name: 'vodka', quantity: 45, unit: 'ml' },
      { name: 'apple liqueur', quantity: 25, unit: 'ml' },
      { name: 'fresh apple juice', quantity: 20, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Add all ingredients to a shaker with ice.',
      'Shake well for 12 seconds.',
      'Strain into a chilled martini glass.',
      'Garnish with a thin apple slice.',
    ];
    tags = ['vodka', 'apple', 'crisp'];
    taste = [T.fruity, T.sweet, T.refreshing];
  } else if (m.choc) {
    ingredients = [
      { name: 'vodka', quantity: 45, unit: 'ml' },
      { name: 'chocolate liqueur', quantity: 25, unit: 'ml' },
      { name: 'cream', quantity: 20, unit: 'ml' },
      { name: 'cocoa powder', quantity: 1, unit: 'tsp' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Rim the glass with cocoa powder.',
      'Add all liquids to a shaker with ice and shake for 15 seconds.',
      'Strain into the cocoa-rimmed glass.',
      'Garnish with chocolate shavings.',
    ];
    tags = ['chocolate', 'creamy', 'dessert'];
    taste = [T.sweet, T.creamy, T.rich];
    emoji = '🍫';
  } else if (m.pornstar) {
    ingredients = [
      { name: 'vanilla vodka', quantity: 40, unit: 'ml' },
      { name: 'passionfruit liqueur', quantity: 20, unit: 'ml' },
      { name: 'fresh passionfruit', quantity: 0.5, unit: 'whole' },
      { name: 'vanilla syrup', quantity: 10, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
      { name: 'prosecco', quantity: 60, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Scoop passionfruit pulp into a shaker.',
      'Add vodka, liqueur, vanilla syrup, lime juice and ice.',
      'Shake hard for 15 seconds.',
      'Double-strain into a chilled coupe.',
      'Serve with a side shot of prosecco.',
    ];
    tags = ['passionfruit', 'vanilla', 'fancy'];
    taste = [T.fruity, T.sweet, T.tropical];
    emoji = '🍑';
  } else if (m.french) {
    ingredients = [
      { name: 'vodka', quantity: 45, unit: 'ml' },
      { name: 'raspberry liqueur', quantity: 15, unit: 'ml' },
      { name: 'pineapple juice', quantity: 30, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake vodka, liqueur and pineapple juice with ice.',
      'Shake hard until foamy.',
      'Double-strain into a chilled martini glass.',
      'Garnish with a raspberry.',
    ];
    tags = ['vodka', 'raspberry', 'silky'];
    taste = [T.fruity, T.sweet];
    emoji = '🫐';
  } else if (m.cucumber) {
    ingredients = [
      { name: 'gin', quantity: 50, unit: 'ml' },
      { name: 'fresh cucumber', quantity: 4, unit: 'slices' },
      { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
      { name: 'elderflower liqueur', quantity: 15, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Muddle cucumber in the shaker.',
      'Add gin, lime juice, elderflower liqueur and ice.',
      'Shake for 12 seconds.',
      'Double-strain into a chilled martini glass.',
      'Garnish with a cucumber ribbon.',
    ];
    tags = ['gin', 'cucumber', 'floral'];
    taste = [T.refreshing, T.floral, T.herbal];
    emoji = '🥒';
  } else {
    ingredients = [
      { name: m.vodka ? 'vodka' : (m.gin || 'gin'), quantity: 60, unit: 'ml' },
      ...(m.vodka ? [{ name: m.gin, quantity: 30, unit: 'ml' }] : []),
      { name: 'dry vermouth', quantity: m.vermouth ?? 15, unit: 'ml' },
      ...(m.brine ? [{ name: 'olive brine', quantity: m.brine, unit: 'ml' }] : []),
      ...(m.lillet ? [{ name: 'lillet blanc', quantity: m.lillet, unit: 'ml' }] : []),
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      m.dry
        ? 'Rinse a chilled glass with vermouth and discard.'
        : 'Fill a mixing glass with ice.',
      'Add all liquids and stir for 30 seconds.',
      'Strain into a chilled martini glass.',
      `Garnish with ${m.garnish}.`,
    ];
    tags = [m.gin?.includes('gin') ? 'gin' : 'vodka', 'classic', 'stirred'];
    taste = [T.dry, T.herbal, T.bitter];
  }
  CLASSICS.push(recipe({
    name: m.name, type: 'cocktail', category: m.category, glass: 'martini',
    ingredients, steps, tags, taste, emoji,
  }));
});

// Old Fashioned family
['Classic', 'Maple', 'Smoked', 'Rum', 'Tequila', 'Irish'].forEach((v) => {
  let spirit = 'bourbon whiskey';
  if (v === 'Rum') spirit = 'dark rum';
  if (v === 'Tequila') spirit = 'reposado tequila';
  if (v === 'Irish') spirit = 'irish whiskey';
  const ingredients = [
    { name: spirit, quantity: 60, unit: 'ml' },
    ...(v === 'Maple'
      ? [{ name: 'maple syrup', quantity: 10, unit: 'ml' }]
      : [{ name: 'sugar cube', quantity: 1, unit: 'piece' }]),
    { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
    { name: 'orange peel', quantity: 1, unit: 'strip' },
    { name: 'ice', quantity: 1, unit: 'large cube' },
  ];
  const steps = v === 'Smoked' ? [
    'Smoke a rocks glass with wood chips for 10 seconds.',
    'Add sugar cube and bitters, muddle with a splash of water.',
    'Add a large ice cube and pour the whiskey.',
    'Stir for 30 seconds.',
    'Express and drop in an orange peel.',
  ] : [
    'In a rocks glass, muddle sugar with bitters and a splash of water.',
    `Add a large ice cube and pour the ${spirit}.`,
    'Stir for 30 seconds.',
    'Express an orange peel over the glass and drop it in.',
  ];
  CLASSICS.push(recipe({
    name: `${v} Old Fashioned`, type: 'cocktail', category: 'Classic', glass: 'rocks', emoji: '🥃',
    ingredients, steps,
    tags: ['whiskey', 'classic', 'stirred'],
    taste: [T.bitter, T.rich, T.warming],
  }));
});

// Negroni family
[
  { name: 'Classic Negroni', spirit: 'gin' },
  { name: 'Boulevardier', spirit: 'bourbon whiskey' },
  { name: 'White Negroni', spirit: 'gin', white: true },
  { name: 'Mezcal Negroni', spirit: 'mezcal' },
  { name: 'Sbagliato', spirit: 'prosecco', sparkling: true },
  { name: 'Rosita', spirit: 'reposado tequila' },
].forEach((n) => {
  const ingredients = [
    { name: n.spirit, quantity: 30, unit: 'ml' },
    { name: n.white ? 'suze' : 'campari', quantity: 30, unit: 'ml' },
    { name: n.white ? 'lillet blanc' : 'sweet vermouth', quantity: 30, unit: 'ml' },
    { name: 'orange peel', quantity: 1, unit: 'strip' },
    { name: 'ice', quantity: 1, unit: 'large cube' },
  ];
  CLASSICS.push(recipe({
    name: n.name, type: 'cocktail', category: 'Classic', glass: 'rocks', emoji: '🟠',
    ingredients,
    steps: n.sparkling
      ? [
          'Add campari and sweet vermouth to an ice-filled rocks glass.',
          'Top with prosecco and stir gently.',
          'Garnish with an orange slice.',
        ]
      : [
          `Add ${n.spirit}, ${n.white ? 'suze' : 'campari'} and ${n.white ? 'lillet' : 'sweet vermouth'} to a mixing glass with ice.`,
          'Stir for 30 seconds.',
          'Strain into a rocks glass over a large ice cube.',
          'Express an orange peel over the glass.',
        ],
    tags: ['bitter', 'italian', 'aperitif', n.spirit.split(' ')[0]],
    taste: [T.bitter, T.herbal, T.dry],
  }));
});

// Sours family
const SOURS = [
  { name: 'Whiskey Sour', base: 'bourbon whiskey' },
  { name: 'Amaretto Sour', base: 'amaretto', foam: true },
  { name: 'Pisco Sour', base: 'pisco', foam: true },
  { name: 'Gin Sour', base: 'gin' },
  { name: 'Rum Sour', base: 'white rum' },
  { name: 'Tequila Sour', base: 'tequila' },
  { name: 'Brandy Sour', base: 'brandy' },
  { name: 'Midori Sour', base: 'midori' },
  { name: 'Scotch Sour', base: 'scotch whisky' },
  { name: 'New York Sour', base: 'bourbon whiskey', redwine: true },
];
SOURS.forEach((s) => {
  const ingredients = [
    { name: s.base, quantity: 50, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 25, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'egg white', quantity: 1, unit: 'whole' },
    ...(s.redwine ? [{ name: 'red wine', quantity: 15, unit: 'ml' }] : []),
    { name: 'angostura bitters', quantity: 2, unit: 'drops' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ];
  const steps = [
    `Dry-shake ${s.base}, lemon juice, sugar syrup and egg white for 15 seconds.`,
    'Add ice and shake again for 15 seconds.',
    'Strain into a rocks glass over fresh ice.',
    ...(s.redwine ? ['Slowly float red wine over the back of a spoon.'] : []),
    'Add bitters on the foam and create a pattern with a pick.',
  ];
  CLASSICS.push(recipe({
    name: s.name, type: 'cocktail', category: 'Sour', glass: 'rocks', emoji: '🍋',
    ingredients, steps,
    tags: ['sour', 'foam', s.base.split(' ')[0]],
    taste: [T.sour, T.citrus, T.smoky, T.rich],
    difficulty: 'medium',
  }));
});

// Highballs
[
  { name: 'Gin and Tonic',      s: 'gin',            m: 'tonic water' },
  { name: 'Vodka Tonic',        s: 'vodka',          m: 'tonic water' },
  { name: 'Rum and Coke',       s: 'white rum',      m: 'cola' },
  { name: 'Whiskey Highball',   s: 'japanese whisky',m: 'soda water' },
  { name: 'Dark and Stormy',    s: 'dark rum',       m: 'ginger beer', lime: true },
  { name: 'Moscow Mule',        s: 'vodka',          m: 'ginger beer', lime: true },
  { name: 'Kentucky Mule',      s: 'bourbon whiskey',m: 'ginger beer', lime: true },
  { name: 'Mexican Mule',       s: 'tequila',        m: 'ginger beer', lime: true },
  { name: 'London Mule',        s: 'gin',            m: 'ginger beer', lime: true },
  { name: 'Paloma',             s: 'tequila',        m: 'grapefruit soda', lime: true, salt: true },
  { name: 'Horsefeather',       s: 'rye whiskey',    m: 'ginger ale',  lime: true, bitters: true },
  { name: 'Pimms Cup',          s: 'pimms',          m: 'lemonade',    fruit: true },
  { name: 'Cape Codder',        s: 'vodka',          m: 'cranberry juice', lime: true },
  { name: 'Sea Breeze',         s: 'vodka',          m: 'grapefruit and cranberry', lime: true },
  { name: 'Madras',             s: 'vodka',          m: 'cranberry and orange juice' },
  { name: 'Greyhound',          s: 'vodka',          m: 'grapefruit juice' },
  { name: 'Screwdriver',        s: 'vodka',          m: 'orange juice' },
  { name: 'Bay Breeze',         s: 'vodka',          m: 'pineapple and cranberry' },
].forEach((h) => {
  const ingredients = [
    { name: h.s, quantity: 50, unit: 'ml' },
    { name: h.m, quantity: 120, unit: 'ml' },
    ...(h.lime ? [{ name: 'fresh lime juice', quantity: 10, unit: 'ml' }] : []),
    ...(h.bitters ? [{ name: 'angostura bitters', quantity: 2, unit: 'dashes' }] : []),
    { name: 'ice', quantity: 1, unit: 'cup' },
  ];
  CLASSICS.push(recipe({
    name: h.name, type: 'cocktail', category: 'Refreshing', glass: 'highball', emoji: '🥃',
    ingredients,
    steps: [
      'Fill a highball glass with ice.',
      `Pour the ${h.s}.`,
      ...(h.lime ? ['Squeeze fresh lime juice.'] : []),
      `Top with ${h.m}.`,
      'Stir once gently.',
      h.fruit ? 'Garnish with cucumber, strawberry and mint.' : 'Garnish with a citrus wedge.',
    ],
    tags: ['highball', 'refreshing', h.s.split(' ')[0]],
    taste: [T.refreshing, T.bubbly, T.citrus],
  }));
});

// Sparkling / spritzes
[
  { name: 'Aperol Spritz', b: 'aperol' },
  { name: 'Campari Spritz', b: 'campari' },
  { name: 'Hugo Spritz', b: 'elderflower cordial' },
  { name: 'Lillet Spritz', b: 'lillet blanc' },
  { name: 'St-Germain Spritz', b: 'elderflower liqueur' },
  { name: 'Limoncello Spritz', b: 'limoncello' },
  { name: 'French 75', b: 'gin', lemon: true, champagne: true },
  { name: 'Bellini', b: 'peach puree', prosecco: 90 },
  { name: 'Rossini', b: 'strawberry puree', prosecco: 90 },
  { name: 'Mimosa', b: 'orange juice', champagne: 70, noMixer: true },
  { name: 'Kir Royale', b: 'creme de cassis', prosecco: 100, noMixer: true },
  { name: 'Seelbach', b: 'bourbon whiskey', lemon: true, bitters: true, champagne: true },
].forEach((sp) => {
  const ingredients = sp.champagne ? [
    { name: sp.b, quantity: 30, unit: 'ml' },
    ...(sp.lemon ? [
      { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
      { name: 'sugar syrup', quantity: 10, unit: 'ml' }] : []),
    ...(sp.bitters ? [{ name: 'angostura bitters', quantity: 3, unit: 'dashes' }] : []),
    { name: 'champagne', quantity: 60, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ] : sp.prosecco ? [
    { name: sp.b, quantity: sp.noMixer ? 15 : 30, unit: 'ml' },
    { name: 'prosecco', quantity: sp.prosecco, unit: 'ml' },
    ...(sp.noMixer ? [] : [{ name: 'soda water', quantity: 30, unit: 'ml' }]),
    { name: 'ice', quantity: 1, unit: 'cup' },
  ] : [
    { name: sp.b, quantity: 60, unit: 'ml' },
    { name: 'prosecco', quantity: 90, unit: 'ml' },
    { name: 'soda water', quantity: 30, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ];
  CLASSICS.push(recipe({
    name: sp.name, type: 'cocktail', category: 'Sparkling',
    glass: sp.name.includes('75') ? 'flute' : 'wine', emoji: '🥂',
    ingredients,
    steps: [
      'Fill a large glass with ice (or chill a flute).',
      `Pour the ${sp.b}.`,
      ...(sp.lemon ? ['Add the lemon juice and sugar syrup.'] : []),
      `Top with ${sp.champagne ? 'champagne' : 'prosecco'}.`,
      ...(sp.noMixer ? [] : ['Finish with a splash of soda water.']),
      'Stir gently once. Garnish with citrus and a fresh herb.',
    ],
    tags: ['bubbly', 'italian', 'aperitif'],
    taste: [T.bubbly, T.bitter, T.refreshing],
  }));
});

// Tropical
[
  { name: 'Pina Colada',          f: 'pineapple', cream: true },
  { name: 'Mai Tai',              mai: true },
  { name: 'Hurricane',            hurricane: true },
  { name: 'Zombie',               zombie: true },
  { name: 'Blue Hawaiian',        blueh: true },
  { name: 'Tequila Sunrise',      sunrise: true },
  { name: 'Caipirinha',           caip: true },
  { name: 'Caipiroska',           caip: true, vodka: true },
  { name: 'Jungle Bird',          jungle: true },
  { name: 'Painkiller',           painkiller: true },
  { name: 'Bahama Mama',          bahama: true },
  { name: 'Chi Chi',              f: 'pineapple', cream: true, chichi: true },
  { name: 'Malibu Sunset',        malibu: true },
  { name: 'Miami Vice',           miami: true },
  { name: 'Goombay Smash',        goombay: true },
].forEach((t) => {
  let ingredients, steps, emoji = '🍍';
  if (t.mai) {
    ingredients = [
      { name: 'white rum', quantity: 30, unit: 'ml' },
      { name: 'dark rum', quantity: 30, unit: 'ml' },
      { name: 'orange curacao', quantity: 15, unit: 'ml' },
      { name: 'orgeat syrup', quantity: 15, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 25, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all ingredients with crushed ice for 10 seconds.',
      'Pour into a tiki glass without straining.',
      'Top with more crushed ice.',
      'Garnish with mint and a lime shell.',
    ];
  } else if (t.hurricane) {
    ingredients = [
      { name: 'dark rum', quantity: 30, unit: 'ml' },
      { name: 'white rum', quantity: 30, unit: 'ml' },
      { name: 'passionfruit syrup', quantity: 30, unit: 'ml' },
      { name: 'orange juice', quantity: 30, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
      { name: 'grenadine', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all with ice for 10 seconds.',
      'Strain into a hurricane glass over fresh ice.',
      'Garnish with an orange slice and cherry.',
    ];
    emoji = '🌴';
  } else if (t.zombie) {
    ingredients = [
      { name: 'white rum', quantity: 30, unit: 'ml' },
      { name: 'gold rum', quantity: 30, unit: 'ml' },
      { name: 'dark rum', quantity: 30, unit: 'ml' },
      { name: 'apricot brandy', quantity: 15, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
      { name: 'pineapple juice', quantity: 30, unit: 'ml' },
      { name: 'grenadine', quantity: 10, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Add all ingredients to a shaker with ice.',
      'Shake for 10 seconds.',
      'Strain into a tall tiki glass with crushed ice.',
      'Garnish with mint and an orchid.',
    ];
  } else if (t.blueh) {
    ingredients = [
      { name: 'white rum', quantity: 30, unit: 'ml' },
      { name: 'vodka', quantity: 30, unit: 'ml' },
      { name: 'blue curacao', quantity: 15, unit: 'ml' },
      { name: 'pineapple juice', quantity: 60, unit: 'ml' },
      { name: 'coconut cream', quantity: 15, unit: 'ml' },
      { name: 'ice', quantity: 2, unit: 'cups' },
    ];
    steps = [
      'Blend all ingredients until smooth.',
      'Pour into a hurricane glass.',
      'Garnish with pineapple, cherry and an umbrella.',
    ];
    emoji = '🔵';
  } else if (t.sunrise) {
    ingredients = [
      { name: 'tequila', quantity: 50, unit: 'ml' },
      { name: 'orange juice', quantity: 120, unit: 'ml' },
      { name: 'grenadine', quantity: 15, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Fill a highball glass with ice.',
      'Pour tequila and orange juice.',
      'Slowly pour grenadine down the side — do not stir.',
      'Garnish with an orange slice and cherry.',
    ];
    emoji = '🌅';
  } else if (t.caip) {
    ingredients = [
      { name: t.vodka ? 'vodka' : 'cachaca', quantity: 60, unit: 'ml' },
      { name: 'fresh lime', quantity: 0.5, unit: 'whole' },
      { name: 'sugar', quantity: 2, unit: 'tsp' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Cut lime into wedges and muddle with sugar in a rocks glass.',
      `Add ${t.vodka ? 'vodka' : 'cachaca'}.`,
      'Fill with crushed ice and stir well.',
    ];
  } else if (t.jungle) {
    ingredients = [
      { name: 'dark rum', quantity: 45, unit: 'ml' },
      { name: 'campari', quantity: 20, unit: 'ml' },
      { name: 'pineapple juice', quantity: 45, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
      { name: 'sugar syrup', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all ingredients with ice for 10 seconds.',
      'Strain into a tiki glass over fresh ice.',
      'Garnish with a pineapple leaf.',
    ];
  } else if (t.painkiller) {
    ingredients = [
      { name: 'dark rum', quantity: 60, unit: 'ml' },
      { name: 'pineapple juice', quantity: 120, unit: 'ml' },
      { name: 'orange juice', quantity: 30, unit: 'ml' },
      { name: 'coconut cream', quantity: 30, unit: 'ml' },
      { name: 'nutmeg', quantity: 1, unit: 'pinch' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all with ice for 10 seconds.',
      'Pour into a tall glass.',
      'Grate fresh nutmeg over the top.',
    ];
  } else if (t.bahama) {
    ingredients = [
      { name: 'dark rum', quantity: 30, unit: 'ml' },
      { name: 'coconut rum', quantity: 30, unit: 'ml' },
      { name: 'coffee liqueur', quantity: 15, unit: 'ml' },
      { name: 'pineapple juice', quantity: 60, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
      { name: 'grenadine', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all with ice for 10 seconds.',
      'Strain into a hurricane glass over fresh ice.',
      'Garnish with a pineapple wedge.',
    ];
  } else if (t.chichi) {
    ingredients = [
      { name: 'vodka', quantity: 45, unit: 'ml' },
      { name: 'coconut cream', quantity: 30, unit: 'ml' },
      { name: 'pineapple juice', quantity: 90, unit: 'ml' },
      { name: 'ice', quantity: 2, unit: 'cups' },
    ];
    steps = [
      'Blend all ingredients until smooth.',
      'Pour into a hurricane glass.',
      'Garnish with a pineapple slice and cherry.',
    ];
  } else if (t.malibu) {
    ingredients = [
      { name: 'coconut rum', quantity: 45, unit: 'ml' },
      { name: 'peach schnapps', quantity: 15, unit: 'ml' },
      { name: 'orange juice', quantity: 90, unit: 'ml' },
      { name: 'grenadine', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Fill a tall glass with ice.',
      'Add coconut rum, schnapps and orange juice.',
      'Drizzle grenadine down the side for a sunset effect.',
      'Garnish with orange and a cherry.',
    ];
  } else if (t.miami) {
    ingredients = [
      { name: 'white rum', quantity: 45, unit: 'ml' },
      { name: 'fresh strawberries', quantity: 60, unit: 'g' },
      { name: 'pineapple juice', quantity: 60, unit: 'ml' },
      { name: 'coconut cream', quantity: 30, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
      { name: 'ice', quantity: 2, unit: 'cups' },
    ];
    steps = [
      'Blend strawberries with rum, lime juice and ice until smooth.',
      'In a second blender, combine rum, pineapple juice, coconut cream and ice.',
      'Layer alternately in a hurricane glass.',
      'Garnish with a strawberry.',
    ];
    emoji = '🍓';
    t.difficulty = 'medium';
  } else if (t.goombay) {
    ingredients = [
      { name: 'coconut rum', quantity: 30, unit: 'ml' },
      { name: 'gold rum', quantity: 30, unit: 'ml' },
      { name: 'apricot brandy', quantity: 15, unit: 'ml' },
      { name: 'pineapple juice', quantity: 60, unit: 'ml' },
      { name: 'orange juice', quantity: 60, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all ingredients with ice.',
      'Strain into a hurricane glass over fresh ice.',
      'Garnish with a pineapple wedge.',
    ];
  } else {
    // Pina Colada default
    ingredients = [
      { name: 'white rum', quantity: 60, unit: 'ml' },
      { name: 'pineapple juice', quantity: 90, unit: 'ml' },
      { name: 'coconut cream', quantity: 30, unit: 'ml' },
      { name: 'ice', quantity: 2, unit: 'cups' },
    ];
    steps = [
      'Add all ingredients to a blender.',
      'Blend until completely smooth.',
      'Pour into a hurricane glass.',
      'Garnish with a pineapple wedge and cherry.',
    ];
  }
  CLASSICS.push(recipe({
    name: t.name, type: 'cocktail', category: 'Tropical',
    glass: 'hurricane', emoji,
    ingredients, steps,
    tags: ['tropical', 'fruity', 'vacation'],
    taste: [T.tropical, T.fruity, T.sweet],
    difficulty: t.difficulty || 'easy',
  }));
});

// Cosmos/Metro cocktails
[
  { name: 'Cosmopolitan',      base: 'citrus vodka', tri: 'triple sec', j: 'cranberry juice' },
  { name: 'Kamikaze',          base: 'vodka',         tri: 'triple sec', j: 'fresh lime juice', shot: true },
  { name: 'Lemon Drop',        base: 'citrus vodka',  tri: 'triple sec', j: 'fresh lemon juice', sugar: true },
  { name: 'Sidecar',           base: 'cognac',        tri: 'triple sec', j: 'fresh lemon juice', sugar: true },
  { name: 'Between the Sheets',base: 'cognac',        tri: 'triple sec', j: 'fresh lemon juice', rum: true },
  { name: 'Corpse Reviver #2', base: 'gin',           tri: 'triple sec', j: 'fresh lemon juice', lillet: true, absinthe: true },
  { name: 'White Lady',        base: 'gin',           tri: 'triple sec', j: 'fresh lemon juice', foam: true },
  { name: 'Aviation',          base: 'gin',           j: 'fresh lemon juice', violet: true, maraschino: true },
  { name: 'Last Word',         base: 'gin',           j: 'fresh lime juice', chartreuse: true, maraschino: true },
].forEach((c) => {
  const ingredients = [
    { name: c.base, quantity: 45, unit: 'ml' },
    ...(c.rum ? [{ name: 'white rum', quantity: 20, unit: 'ml' }] : []),
    ...(c.tri ? [{ name: c.tri, quantity: 20, unit: 'ml' }] : []),
    ...(c.lillet ? [{ name: 'lillet blanc', quantity: 20, unit: 'ml' }] : []),
    ...(c.chartreuse ? [{ name: 'green chartreuse', quantity: 20, unit: 'ml' }] : []),
    ...(c.maraschino ? [{ name: 'maraschino liqueur', quantity: 15, unit: 'ml' }] : []),
    ...(c.violet ? [{ name: 'creme de violette', quantity: 5, unit: 'ml' }] : []),
    { name: c.j, quantity: 20, unit: 'ml' },
    ...(c.foam ? [{ name: 'egg white', quantity: 1, unit: 'whole' }] : []),
    ...(c.absinthe ? [{ name: 'absinthe', quantity: 1, unit: 'dash' }] : []),
    ...(c.sugar ? [{ name: 'sugar syrup', quantity: 10, unit: 'ml' }] : []),
    { name: 'ice', quantity: 1, unit: 'cup' },
  ];
  CLASSICS.push(recipe({
    name: c.name, type: 'cocktail',
    category: c.shot ? 'Classic' : 'Classic',
    glass: c.shot ? 'shot' : 'coupe', emoji: '🍸',
    ingredients,
    steps: c.shot ? [
      'Shake all ingredients with ice for 10 seconds.',
      'Strain into a chilled shot glass.',
    ] : [
      'Add all ingredients to a shaker with ice.',
      c.foam ? 'Dry-shake without ice, then shake again with ice.' : 'Shake for 12 seconds.',
      'Double-strain into a chilled coupe.',
      'Garnish with a citrus twist.',
    ],
    tags: ['classic', 'shaken'],
    taste: [T.citrus, T.dry, T.sour],
  }));
});

// Shots
[
  { name: 'B-52', layers: [
    { name: 'coffee liqueur', quantity: 15, unit: 'ml' },
    { name: 'baileys irish cream', quantity: 15, unit: 'ml' },
    { name: 'grand marnier', quantity: 15, unit: 'ml' },
  ] },
  { name: 'Jagerbomb', ingredients: [
    { name: 'jagermeister', quantity: 30, unit: 'ml' },
    { name: 'energy drink', quantity: 120, unit: 'ml' },
  ] },
  { name: 'Tequila Shot', ingredients: [
    { name: 'tequila', quantity: 30, unit: 'ml' },
    { name: 'salt', quantity: 1, unit: 'pinch' },
    { name: 'lime wedge', quantity: 1, unit: 'piece' },
  ] },
  { name: 'Lemon Drop Shot', ingredients: [
    { name: 'citrus vodka', quantity: 20, unit: 'ml' },
    { name: 'triple sec', quantity: 10, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
    { name: 'sugar', quantity: 1, unit: 'tsp' },
  ] },
  { name: 'Kamikaze Shot', ingredients: [
    { name: 'vodka', quantity: 20, unit: 'ml' },
    { name: 'triple sec', quantity: 10, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 10, unit: 'ml' },
  ] },
  { name: 'Buttery Nipple', layers: [
    { name: 'butterscotch schnapps', quantity: 15, unit: 'ml' },
    { name: 'baileys irish cream', quantity: 15, unit: 'ml' },
  ] },
  { name: 'Slippery Nipple', layers: [
    { name: 'sambuca', quantity: 15, unit: 'ml' },
    { name: 'baileys irish cream', quantity: 15, unit: 'ml' },
  ] },
  { name: 'Mind Eraser', ingredients: [
    { name: 'vodka', quantity: 20, unit: 'ml' },
    { name: 'coffee liqueur', quantity: 20, unit: 'ml' },
    { name: 'soda water', quantity: 60, unit: 'ml' },
  ] },
].forEach((sh) => {
  const ingredients = sh.ingredients || sh.layers;
  CLASSICS.push(recipe({
    name: sh.name, type: 'cocktail', category: 'Classic',
    glass: 'shot', emoji: '🧪',
    ingredients,
    steps: sh.layers ? [
      `Layer ${sh.layers.map((l) => l.name).join(', ')} slowly over the back of a spoon in a shot glass.`,
      'Serve immediately, neat.',
    ] : [
      'Build all ingredients in a shot glass.',
      'Serve with the garnish alongside.',
    ],
    tags: ['shot', 'party'],
    taste: [T.sweet, T.rich],
    prep: 2,
  }));
});

// Hot drinks
[
  { name: 'Irish Coffee',   s: 'irish whiskey',  hot: 'hot coffee',     garnish: 'whipped cream' },
  { name: 'Hot Toddy',      s: 'bourbon whiskey',hot: 'hot water',      lemon: true, honey: true },
  { name: 'Mulled Wine',    mulled: true },
  { name: 'Hot Buttered Rum',s: 'dark rum',      hot: 'hot water',      butter: true, spice: true },
  { name: 'Tom and Jerry',  s: 'brandy',         tom: true },
].forEach((h) => {
  let ingredients, steps;
  if (h.mulled) {
    ingredients = [
      { name: 'red wine', quantity: 750, unit: 'ml' },
      { name: 'orange', quantity: 1, unit: 'whole' },
      { name: 'cinnamon stick', quantity: 2, unit: 'pieces' },
      { name: 'star anise', quantity: 3, unit: 'pieces' },
      { name: 'cloves', quantity: 6, unit: 'pieces' },
      { name: 'honey', quantity: 60, unit: 'ml' },
      { name: 'brandy', quantity: 60, unit: 'ml' },
    ];
    steps = [
      'Combine wine, spices, orange zest and honey in a pot.',
      'Heat gently for 15 minutes without boiling.',
      'Stir in brandy at the end of heating.',
      'Ladle into mugs and garnish with orange and cinnamon.',
    ];
  } else if (h.tom) {
    ingredients = [
      { name: 'brandy', quantity: 30, unit: 'ml' },
      { name: 'dark rum', quantity: 30, unit: 'ml' },
      { name: 'eggs', quantity: 1, unit: 'whole' },
      { name: 'sugar', quantity: 2, unit: 'tsp' },
      { name: 'nutmeg', quantity: 1, unit: 'pinch' },
      { name: 'hot milk', quantity: 120, unit: 'ml' },
    ];
    steps = [
      'Beat egg yolk with sugar until pale; whip the white until stiff.',
      'Fold them together with a pinch of nutmeg.',
      'Spoon the batter into a mug with brandy and rum.',
      'Top with hot milk and stir gently.',
    ];
  } else {
    ingredients = [
      { name: h.s, quantity: 45, unit: 'ml' },
      ...(h.lemon ? [{ name: 'fresh lemon juice', quantity: 15, unit: 'ml' }] : []),
      ...(h.honey ? [{ name: 'honey', quantity: 15, unit: 'ml' }] : []),
      ...(h.butter ? [{ name: 'butter', quantity: 1, unit: 'tsp' }, { name: 'brown sugar', quantity: 2, unit: 'tsp' }, { name: 'nutmeg', quantity: 1, unit: 'pinch' }] : []),
      { name: h.hot, quantity: 150, unit: 'ml' },
    ];
    steps = [
      `Preheat a mug with hot water and discard.`,
      `Add ${h.s}, ${h.lemon ? 'lemon juice, ' : ''}${h.honey ? 'honey, ' : ''}${h.butter ? 'butter and spices, ' : ''}to the mug.`,
      `Fill with ${h.hot}.`,
      `Garnish with ${h.garnish || 'a cinnamon stick and orange wheel'}.`,
    ];
  }
  CLASSICS.push(recipe({
    name: h.name, type: 'cocktail', category: 'After-Dinner',
    glass: 'mug', emoji: '☕',
    ingredients, steps,
    tags: ['hot', 'warming', 'winter'],
    taste: [T.warming, T.rich, T.spicy],
    difficulty: h.mulled || h.tom ? 'medium' : 'easy',
    prep: h.mulled ? 20 : 5,
  }));
});

// Frozen & creamy
[
  { name: 'Frozen Daiquiri',       base: 'white rum',   fruit: null },
  { name: 'Frozen Strawberry Daiquiri', base: 'white rum', fruit: 'strawberry' },
  { name: 'Frozen Banana Daiquiri', base: 'white rum',  fruit: 'banana' },
  { name: 'Frozen Mango Daiquiri',  base: 'white rum',  fruit: 'mango' },
  { name: 'Frozen Margarita',       base: 'tequila',    fruit: null, marg: true },
  { name: 'Frozen Peach Margarita', base: 'tequila',    fruit: 'peach', marg: true },
  { name: 'Frozen Pina Colada',     base: 'white rum',  colada: true },
  { name: 'Grasshopper',            grass: true },
  { name: 'Mudslide',               mud: true },
  { name: 'White Russian',          wr: true },
  { name: 'Black Russian',          br: true },
  { name: 'Brandy Alexander',       ba: true },
  { name: 'Golden Cadillac',        gc: true },
  { name: 'Pink Squirrel',          ps: true },
].forEach((f) => {
  let ingredients, steps;
  if (f.grass) {
    ingredients = [
      { name: 'creme de menthe', quantity: 30, unit: 'ml' },
      { name: 'creme de cacao', quantity: 30, unit: 'ml' },
      { name: 'cream', quantity: 30, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all ingredients with ice for 10 seconds.',
      'Strain into a chilled coupe.',
      'Garnish with shaved chocolate.',
    ];
  } else if (f.mud) {
    ingredients = [
      { name: 'vodka', quantity: 30, unit: 'ml' },
      { name: 'coffee liqueur', quantity: 30, unit: 'ml' },
      { name: 'baileys irish cream', quantity: 30, unit: 'ml' },
      { name: 'ice', quantity: 2, unit: 'cups' },
    ];
    steps = [
      'Blend all ingredients until thick.',
      'Drizzle chocolate syrup inside a hurricane glass.',
      'Pour in the blend.',
      'Top with whipped cream.',
    ];
  } else if (f.wr) {
    ingredients = [
      { name: 'vodka', quantity: 50, unit: 'ml' },
      { name: 'coffee liqueur', quantity: 20, unit: 'ml' },
      { name: 'cream', quantity: 30, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Build vodka and coffee liqueur over ice in a rocks glass.',
      'Float cream over the back of a spoon.',
      'Do not stir — serve layered.',
    ];
  } else if (f.br) {
    ingredients = [
      { name: 'vodka', quantity: 50, unit: 'ml' },
      { name: 'coffee liqueur', quantity: 20, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Build over ice in a rocks glass.',
      'Stir gently.',
    ];
  } else if (f.ba) {
    ingredients = [
      { name: 'cognac', quantity: 30, unit: 'ml' },
      { name: 'creme de cacao', quantity: 30, unit: 'ml' },
      { name: 'cream', quantity: 30, unit: 'ml' },
      { name: 'nutmeg', quantity: 1, unit: 'pinch' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all with ice for 12 seconds.',
      'Strain into a chilled coupe.',
      'Grate nutmeg on top.',
    ];
  } else if (f.gc) {
    ingredients = [
      { name: 'galliano', quantity: 20, unit: 'ml' },
      { name: 'white creme de cacao', quantity: 20, unit: 'ml' },
      { name: 'cream', quantity: 20, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all with ice for 10 seconds.',
      'Strain into a chilled coupe.',
    ];
  } else if (f.ps) {
    ingredients = [
      { name: 'creme de noyaux', quantity: 25, unit: 'ml' },
      { name: 'white creme de cacao', quantity: 25, unit: 'ml' },
      { name: 'cream', quantity: 25, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all with ice for 10 seconds.',
      'Strain into a chilled coupe.',
    ];
  } else if (f.colada) {
    ingredients = [
      { name: 'white rum', quantity: 60, unit: 'ml' },
      { name: 'pineapple juice', quantity: 90, unit: 'ml' },
      { name: 'coconut cream', quantity: 30, unit: 'ml' },
      { name: 'ice', quantity: 2, unit: 'cups' },
    ];
    steps = [
      'Blend until smooth.',
      'Pour into a hurricane glass.',
      'Garnish with pineapple and cherry.',
    ];
  } else {
    ingredients = [
      { name: f.base, quantity: 60, unit: 'ml' },
      ...(f.marg ? [{ name: 'triple sec', quantity: 25, unit: 'ml' }] : []),
      { name: f.marg ? 'fresh lime juice' : 'fresh lime juice', quantity: 25, unit: 'ml' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      ...(f.fruit ? [{ name: `fresh ${f.fruit}`, quantity: 60, unit: 'g' }] : []),
      { name: 'ice', quantity: 2, unit: 'cups' },
    ];
    steps = [
      'Add all ingredients to a blender.',
      'Blend until smooth.',
      'Pour into a chilled glass.',
      'Garnish appropriately.',
    ];
  }
  CLASSICS.push(recipe({
    name: f.name, type: 'cocktail',
    category: f.name.startsWith('Frozen') ? 'Tropical' : 'Creamy',
    glass: 'coupe', emoji: '🍨',
    ingredients, steps,
    tags: ['creamy', 'dessert'],
    taste: [T.creamy, T.sweet, T.rich],
    difficulty: 'easy',
  }));
});

// Nightcaps / After-Dinner
[
  { name: 'Godfather', ingredients: [
    { name: 'scotch whisky', quantity: 45, unit: 'ml' },
    { name: 'amaretto', quantity: 20, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'large cube' },
  ]},
  { name: 'Godmother', ingredients: [
    { name: 'vodka', quantity: 45, unit: 'ml' },
    { name: 'amaretto', quantity: 20, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'large cube' },
  ]},
  { name: 'Rusty Nail', ingredients: [
    { name: 'scotch whisky', quantity: 45, unit: 'ml' },
    { name: 'drambuie', quantity: 20, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'large cube' },
  ]},
  { name: 'Stinger', ingredients: [
    { name: 'cognac', quantity: 50, unit: 'ml' },
    { name: 'creme de menthe', quantity: 20, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'large cube' },
  ]},
].forEach((n) => {
  CLASSICS.push(recipe({
    name: n.name, type: 'cocktail', category: 'After-Dinner',
    glass: 'rocks', emoji: '🥃',
    ingredients: n.ingredients,
    steps: [
      'Build over a large ice cube in a rocks glass.',
      'Stir gently.',
      'Garnish with a citrus twist.',
    ],
    tags: ['after-dinner', 'nightcap'],
    taste: [T.rich, T.smoky, T.warming],
  }));
});

// ── Mocktails ───────────────────────────────────────────────────────────────
const MOCKTAILS = [];

// Virgin versions of classics
[
  { name: 'Virgin Mojito',       base: 'mojito' },
  { name: 'Virgin Piña Colada',  base: 'colada' },
  { name: 'Virgin Mary',         base: 'mary' },
  { name: 'Virgin Daiquiri',     base: 'daiquiri' },
  { name: 'Virgin Margarita',    base: 'margarita' },
  { name: 'Virgin Sangria',      base: 'sangria' },
  { name: 'Virgin Mule',         base: 'mule' },
  { name: 'Virgin Cosmopolitan', base: 'cosmo' },
].forEach((v) => {
  let ingredients, steps, emoji = '🧃';
  if (v.base === 'mojito') {
    ingredients = [
      { name: 'fresh lime juice', quantity: 30, unit: 'ml' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      { name: 'fresh mint', quantity: 10, unit: 'leaves' },
      { name: 'soda water', quantity: 150, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Muddle mint with sugar syrup.',
      'Add lime juice and ice.',
      'Top with soda water.',
      'Garnish with mint and lime.',
    ];
    emoji = '🌿';
  } else if (v.base === 'colada') {
    ingredients = [
      { name: 'pineapple juice', quantity: 90, unit: 'ml' },
      { name: 'coconut cream', quantity: 45, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 2, unit: 'cups' },
    ];
    steps = [
      'Blend all ingredients until smooth.',
      'Pour into a hurricane glass.',
      'Garnish with pineapple and cherry.',
    ];
    emoji = '🥥';
  } else if (v.base === 'mary') {
    ingredients = [
      { name: 'tomato juice', quantity: 150, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
      { name: 'worcestershire sauce', quantity: 3, unit: 'dashes' },
      { name: 'hot sauce', quantity: 3, unit: 'dashes' },
      { name: 'celery salt', quantity: 1, unit: 'pinch' },
      { name: 'black pepper', quantity: 1, unit: 'pinch' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Rim a highball glass with celery salt.',
      'Add all ingredients with ice and roll between two tins.',
      'Pour into the glass.',
      'Garnish with celery, olives and a lemon wedge.',
    ];
    emoji = '🍅';
  } else if (v.base === 'daiquiri') {
    ingredients = [
      { name: 'fresh lime juice', quantity: 40, unit: 'ml' },
      { name: 'sugar syrup', quantity: 20, unit: 'ml' },
      { name: 'fresh strawberries', quantity: 60, unit: 'g' },
      { name: 'ice', quantity: 2, unit: 'cups' },
    ];
    steps = [
      'Blend all ingredients until smooth.',
      'Pour into a chilled coupe.',
      'Garnish with a strawberry.',
    ];
    emoji = '🍓';
  } else if (v.base === 'margarita') {
    ingredients = [
      { name: 'fresh lime juice', quantity: 40, unit: 'ml' },
      { name: 'orange juice', quantity: 40, unit: 'ml' },
      { name: 'agave syrup', quantity: 15, unit: 'ml' },
      { name: 'salt', quantity: 1, unit: 'pinch' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Salt the rim of a glass.',
      'Shake all ingredients with ice.',
      'Strain into the glass over fresh ice.',
      'Garnish with a lime wedge.',
    ];
  } else if (v.base === 'sangria') {
    ingredients = [
      { name: 'red grape juice', quantity: 150, unit: 'ml' },
      { name: 'orange juice', quantity: 60, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
      { name: 'fresh apple', quantity: 30, unit: 'g' },
      { name: 'fresh orange', quantity: 30, unit: 'g' },
      { name: 'cinnamon stick', quantity: 1, unit: 'piece' },
      { name: 'soda water', quantity: 60, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Combine juices and fruit in a pitcher.',
      'Refrigerate for 2 hours.',
      'Top with soda water and stir gently.',
      'Pour into ice-filled glasses.',
    ];
    emoji = '🍇';
  } else if (v.base === 'mule') {
    ingredients = [
      { name: 'ginger beer', quantity: 150, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
      { name: 'angostura bitters', quantity: 2, unit: 'dashes' },
      { name: 'fresh mint', quantity: 4, unit: 'leaves' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Fill a copper mug with ice.',
      'Add lime juice, bitters and mint.',
      'Top with ginger beer and stir gently.',
      'Garnish with a lime wedge.',
    ];
    emoji = '🫚';
  } else if (v.base === 'cosmo') {
    ingredients = [
      { name: 'cranberry juice', quantity: 90, unit: 'ml' },
      { name: 'orange juice', quantity: 30, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
      { name: 'sugar syrup', quantity: 10, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ];
    steps = [
      'Shake all with ice for 10 seconds.',
      'Strain into a chilled martini glass.',
      'Garnish with a lime twist.',
    ];
    emoji = '💗';
  } else {
    ingredients = [{ name: 'juice', quantity: 150, unit: 'ml' }];
    steps = ['Pour over ice.'];
  }
  MOCKTAILS.push(recipe({
    name: v.name, type: 'mocktail',
    category: v.base === 'mule' || v.base === 'mojito' ? 'Refreshing' : 'Fruity',
    glass: v.base === 'mule' ? 'copper mug' : 'highball', emoji,
    ingredients, steps,
    tags: ['mocktail', 'zero proof'],
    taste: [T.refreshing, T.fruity, T.citrus],
  }));
});

// Fruit lemonades
['strawberry', 'raspberry', 'watermelon', 'mango', 'peach', 'blueberry', 'pineapple', 'pomegranate', 'cucumber', 'lavender', 'basil', 'rose'].forEach((flavor) => {
  MOCKTAILS.push(recipe({
    name: `${flavor[0].toUpperCase() + flavor.slice(1)} Lemonade`,
    type: 'mocktail', category: 'Refreshing', glass: 'mason jar', emoji: '🍋',
    ingredients: [
      { name: `fresh ${flavor}`, quantity: 60, unit: flavor === 'lavender' || flavor === 'basil' || flavor === 'rose' ? 'sprigs' : 'g' },
      { name: 'fresh lemon juice', quantity: 30, unit: 'ml' },
      { name: 'sugar syrup', quantity: 20, unit: 'ml' },
      { name: 'water', quantity: 120, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
      { name: 'fresh mint', quantity: 4, unit: 'leaves' },
    ],
    steps: [
      `Muddle ${flavor} with sugar syrup.`,
      'Add lemon juice, water and ice.',
      'Stir well or shake for 10 seconds.',
      'Strain into a glass of fresh ice.',
      'Garnish with mint and a lemon wheel.',
    ],
    tags: ['mocktail', 'fruity', 'summer', flavor],
    taste: [T.refreshing, T.fruity, T.sour],
  }));
});

// Fruit coolers
['pineapple', 'mango', 'passionfruit', 'guava', 'papaya', 'lychee', 'kiwi', 'dragonfruit', 'cherry', 'apricot'].forEach((fruit) => {
  MOCKTAILS.push(recipe({
    name: `${fruit[0].toUpperCase() + fruit.slice(1)} Cooler`,
    type: 'mocktail', category: 'Fruity', glass: 'highball', emoji: '🍹',
    ingredients: [
      { name: `${fruit} puree`, quantity: 60, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
      { name: 'sugar syrup', quantity: 10, unit: 'ml' },
      { name: 'soda water', quantity: 100, unit: 'ml' },
      { name: 'fresh mint', quantity: 6, unit: 'leaves' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: [
      `Combine ${fruit} puree, lime juice and syrup in a shaker.`,
      'Add ice and shake for 10 seconds.',
      'Strain into a tall ice-filled glass.',
      'Top with soda water.',
      `Garnish with ${fruit} and mint.`,
    ],
    tags: ['mocktail', fruit, 'summer'],
    taste: [T.fruity, T.refreshing, T.sweet],
  }));
});

// Classic mocktails
const NAMED_MOCKTAILS = [
  { name: 'Shirley Temple', i: [
    { name: 'ginger ale', quantity: 150, unit: 'ml' },
    { name: 'grenadine', quantity: 15, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 10, unit: 'ml' },
    { name: 'cherry', quantity: 1, unit: 'piece' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.bubbly], emoji: '🌸' },
  { name: 'Roy Rogers', i: [
    { name: 'cola', quantity: 150, unit: 'ml' },
    { name: 'grenadine', quantity: 15, unit: 'ml' },
    { name: 'cherry', quantity: 1, unit: 'piece' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.bubbly] },
  { name: 'Arnold Palmer', i: [
    { name: 'iced tea', quantity: 120, unit: 'ml' },
    { name: 'lemonade', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
    { name: 'fresh lemon', quantity: 1, unit: 'slice' },
  ], taste: [T.refreshing, T.citrus], emoji: '🍋' },
  { name: 'John Daly', i: [
    { name: 'iced tea', quantity: 120, unit: 'ml' },
    { name: 'lemonade', quantity: 120, unit: 'ml' },
    { name: 'fresh mint', quantity: 6, unit: 'leaves' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.refreshing, T.minty] },
  { name: 'Cinderella', i: [
    { name: 'orange juice', quantity: 60, unit: 'ml' },
    { name: 'pineapple juice', quantity: 60, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 20, unit: 'ml' },
    { name: 'grenadine', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 30, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.sweet], emoji: '✨' },
  { name: 'Safe Sex on the Beach', i: [
    { name: 'peach juice', quantity: 60, unit: 'ml' },
    { name: 'orange juice', quantity: 60, unit: 'ml' },
    { name: 'cranberry juice', quantity: 60, unit: 'ml' },
    { name: 'grenadine', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.sweet], emoji: '🏖️' },
  { name: 'Nojito', i: [
    { name: 'fresh lime juice', quantity: 25, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'fresh mint', quantity: 10, unit: 'leaves' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.refreshing, T.minty, T.citrus], emoji: '🌿' },
  { name: 'Italian Soda', i: [
    { name: 'raspberry syrup', quantity: 30, unit: 'ml' },
    { name: 'soda water', quantity: 180, unit: 'ml' },
    { name: 'cream', quantity: 30, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.bubbly, T.creamy], emoji: '🫐' },
  { name: 'Egg Cream', i: [
    { name: 'chocolate syrup', quantity: 30, unit: 'ml' },
    { name: 'milk', quantity: 60, unit: 'ml' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
  ], taste: [T.sweet, T.creamy], emoji: '🥛' },
  { name: 'Mango Lassi', i: [
    { name: 'ripe mango', quantity: 1, unit: 'whole' },
    { name: 'yogurt', quantity: 200, unit: 'ml' },
    { name: 'milk', quantity: 100, unit: 'ml' },
    { name: 'sugar syrup', quantity: 20, unit: 'ml' },
    { name: 'cardamom powder', quantity: 1, unit: 'pinch' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.creamy, T.sweet, T.fruity], emoji: '🥭' },
  { name: 'Rose Falooda', i: [
    { name: 'rose syrup', quantity: 30, unit: 'ml' },
    { name: 'milk', quantity: 180, unit: 'ml' },
    { name: 'basil seeds', quantity: 1, unit: 'tbsp' },
    { name: 'vermicelli', quantity: 2, unit: 'tbsp' },
    { name: 'vanilla ice cream', quantity: 1, unit: 'scoop' },
  ], taste: [T.sweet, T.creamy, T.floral], emoji: '🌹' },
  { name: 'Masala Chaas', i: [
    { name: 'yogurt', quantity: 150, unit: 'ml' },
    { name: 'water', quantity: 120, unit: 'ml' },
    { name: 'cumin powder', quantity: 1, unit: 'pinch' },
    { name: 'black salt', quantity: 1, unit: 'pinch' },
    { name: 'fresh mint', quantity: 6, unit: 'leaves' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.refreshing, T.spicy], emoji: '🥛' },
  { name: 'Iced Matcha Latte', i: [
    { name: 'matcha powder', quantity: 1, unit: 'tsp' },
    { name: 'hot water', quantity: 30, unit: 'ml' },
    { name: 'milk', quantity: 200, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.creamy, T.bitter, T.herbal], emoji: '🍵' },
  { name: 'Thai Iced Tea', i: [
    { name: 'strong black tea', quantity: 180, unit: 'ml' },
    { name: 'condensed milk', quantity: 30, unit: 'ml' },
    { name: 'sugar', quantity: 2, unit: 'tsp' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.creamy, T.rich], emoji: '🍵' },
  { name: 'Affogato', i: [
    { name: 'vanilla ice cream', quantity: 1, unit: 'scoop' },
    { name: 'fresh espresso', quantity: 30, unit: 'ml' },
  ], taste: [T.sweet, T.rich, T.coffee], emoji: '☕' },
  { name: 'Iced Caramel Latte', i: [
    { name: 'fresh espresso', quantity: 60, unit: 'ml' },
    { name: 'milk', quantity: 180, unit: 'ml' },
    { name: 'caramel syrup', quantity: 20, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.creamy, T.coffee], emoji: '☕' },
  { name: 'Frozen Hot Chocolate', i: [
    { name: 'chocolate syrup', quantity: 60, unit: 'ml' },
    { name: 'cocoa powder', quantity: 1, unit: 'tbsp' },
    { name: 'milk', quantity: 180, unit: 'ml' },
    { name: 'vanilla ice cream', quantity: 1, unit: 'scoop' },
    { name: 'ice', quantity: 2, unit: 'cups' },
  ], taste: [T.sweet, T.creamy, T.rich], emoji: '🍫' },
  { name: 'Strawberry Milkshake', i: [
    { name: 'fresh strawberries', quantity: 120, unit: 'g' },
    { name: 'vanilla ice cream', quantity: 2, unit: 'scoops' },
    { name: 'milk', quantity: 150, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
  ], taste: [T.sweet, T.creamy, T.fruity], emoji: '🍓' },
  { name: 'Banana Smoothie', i: [
    { name: 'banana', quantity: 1, unit: 'whole' },
    { name: 'yogurt', quantity: 120, unit: 'ml' },
    { name: 'milk', quantity: 120, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.creamy, T.fruity], emoji: '🍌' },
  { name: 'Green Goddess Smoothie', i: [
    { name: 'spinach', quantity: 30, unit: 'g' },
    { name: 'banana', quantity: 1, unit: 'whole' },
    { name: 'apple', quantity: 1, unit: 'whole' },
    { name: 'fresh ginger', quantity: 5, unit: 'g' },
    { name: 'coconut water', quantity: 180, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.herbal, T.refreshing], emoji: '🥬' },
  { name: 'Cucumber Cooler', i: [
    { name: 'fresh cucumber', quantity: 60, unit: 'g' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'fresh mint', quantity: 6, unit: 'leaves' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.refreshing, T.herbal, T.citrus], emoji: '🥒' },
  { name: 'Basil Lemon Fizz', i: [
    { name: 'fresh basil', quantity: 6, unit: 'leaves' },
    { name: 'fresh lemon juice', quantity: 25, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.herbal, T.citrus, T.refreshing], emoji: '🌿' },
  { name: 'Ginger Fizz', i: [
    { name: 'fresh ginger', quantity: 10, unit: 'g' },
    { name: 'fresh lemon juice', quantity: 20, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.spicy, T.citrus, T.bubbly], emoji: '🫚' },
  { name: 'Pomegranate Fizz', i: [
    { name: 'pomegranate juice', quantity: 90, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.bubbly], emoji: '🍎' },
  { name: 'Watermelon Agua Fresca', i: [
    { name: 'fresh watermelon', quantity: 300, unit: 'g' },
    { name: 'fresh lime juice', quantity: 30, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.refreshing, T.fruity], emoji: '🍉' },
  { name: 'Hibiscus Iced Tea', i: [
    { name: 'dried hibiscus', quantity: 2, unit: 'tbsp' },
    { name: 'hot water', quantity: 240, unit: 'ml' },
    { name: 'honey', quantity: 20, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.floral, T.sour, T.refreshing], emoji: '🌺' },
  { name: 'Apple Cider Fizz', i: [
    { name: 'apple cider', quantity: 120, unit: 'ml' },
    { name: 'cinnamon stick', quantity: 1, unit: 'piece' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.spicy, T.bubbly], emoji: '🍎' },
  { name: 'Butterbeer', i: [
    { name: 'cream soda', quantity: 240, unit: 'ml' },
    { name: 'butterscotch syrup', quantity: 30, unit: 'ml' },
    { name: 'whipped cream', quantity: 30, unit: 'ml' },
    { name: 'vanilla extract', quantity: 2, unit: 'drops' },
  ], taste: [T.sweet, T.creamy, T.rich], emoji: '🧈' },
  { name: 'Coconut Water Splash', i: [
    { name: 'coconut water', quantity: 200, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'fresh mint', quantity: 6, unit: 'leaves' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.refreshing, T.tropical], emoji: '🥥' },
  { name: 'Lemon Ginger Detox', i: [
    { name: 'fresh lemon juice', quantity: 30, unit: 'ml' },
    { name: 'fresh ginger', quantity: 10, unit: 'g' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'warm water', quantity: 240, unit: 'ml' },
    { name: 'cayenne', quantity: 1, unit: 'pinch' },
  ], taste: [T.spicy, T.citrus], emoji: '🍋' },
  { name: 'Blue Raspberry Splash', i: [
    { name: 'blue raspberry syrup', quantity: 30, unit: 'ml' },
    { name: 'sprite', quantity: 180, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.bubbly, T.fruity], emoji: '🔵' },
  { name: 'Sparkling Rose Lemonade', i: [
    { name: 'rose water', quantity: 10, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 30, unit: 'ml' },
    { name: 'sugar syrup', quantity: 20, unit: 'ml' },
    { name: 'soda water', quantity: 180, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.floral, T.citrus, T.bubbly], emoji: '🌹' },
  { name: 'Honey Peach Iced Tea', i: [
    { name: 'black tea', quantity: 180, unit: 'ml' },
    { name: 'peach puree', quantity: 45, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.fruity, T.refreshing], emoji: '🍑' },
  { name: 'Lavender Lemon Fizz', i: [
    { name: 'lavender syrup', quantity: 20, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 30, unit: 'ml' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.floral, T.citrus, T.bubbly], emoji: '💜' },
  { name: 'Tropical Sunrise', i: [
    { name: 'orange juice', quantity: 90, unit: 'ml' },
    { name: 'pineapple juice', quantity: 60, unit: 'ml' },
    { name: 'grenadine', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.tropical], emoji: '🌅' },
  { name: 'Dragon Punch', i: [
    { name: 'dragonfruit', quantity: 80, unit: 'g' },
    { name: 'pineapple juice', quantity: 90, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'coconut water', quantity: 60, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.fruity], emoji: '🐉' },
  { name: 'Mint Chocolate Shake', i: [
    { name: 'vanilla ice cream', quantity: 2, unit: 'scoops' },
    { name: 'milk', quantity: 180, unit: 'ml' },
    { name: 'chocolate syrup', quantity: 30, unit: 'ml' },
    { name: 'fresh mint', quantity: 8, unit: 'leaves' },
  ], taste: [T.creamy, T.sweet, T.minty], emoji: '🍫' },
  { name: 'Orange Cream Soda', i: [
    { name: 'orange juice', quantity: 90, unit: 'ml' },
    { name: 'vanilla ice cream', quantity: 1, unit: 'scoop' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.creamy, T.bubbly], emoji: '🍊' },
  { name: 'Berry Blast', i: [
    { name: 'mixed berries', quantity: 120, unit: 'g' },
    { name: 'fresh lemon juice', quantity: 20, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.sour], emoji: '🫐' },
  { name: 'Pineapple Ginger Cooler', i: [
    { name: 'pineapple juice', quantity: 120, unit: 'ml' },
    { name: 'fresh ginger', quantity: 10, unit: 'g' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.spicy], emoji: '🍍' },
  { name: 'Strawberry Basil Crush', i: [
    { name: 'fresh strawberries', quantity: 80, unit: 'g' },
    { name: 'fresh basil', quantity: 6, unit: 'leaves' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.herbal, T.refreshing], emoji: '🍓' },
  { name: 'Virgin Piña Mango', i: [
    { name: 'pineapple juice', quantity: 90, unit: 'ml' },
    { name: 'mango puree', quantity: 60, unit: 'ml' },
    { name: 'coconut cream', quantity: 30, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 2, unit: 'cups' },
  ], taste: [T.tropical, T.creamy, T.fruity], emoji: '🥭' },
  { name: 'Cranberry Kiss', i: [
    { name: 'cranberry juice', quantity: 120, unit: 'ml' },
    { name: 'orange juice', quantity: 60, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'ginger ale', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.sour], emoji: '💋' },
  { name: 'Sparkling Elderflower', i: [
    { name: 'elderflower cordial', quantity: 30, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
    { name: 'cucumber', quantity: 3, unit: 'slices' },
  ], taste: [T.floral, T.bubbly], emoji: '🌼' },
  { name: 'Spiced Apple Mocktail', i: [
    { name: 'apple juice', quantity: 150, unit: 'ml' },
    { name: 'cinnamon stick', quantity: 1, unit: 'piece' },
    { name: 'star anise', quantity: 1, unit: 'piece' },
    { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
    { name: 'ginger ale', quantity: 60, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.spicy, T.fruity, T.warming], emoji: '🍎' },
  { name: 'Chocolate Milkshake', i: [
    { name: 'chocolate ice cream', quantity: 2, unit: 'scoops' },
    { name: 'milk', quantity: 180, unit: 'ml' },
    { name: 'chocolate syrup', quantity: 30, unit: 'ml' },
    { name: 'whipped cream', quantity: 30, unit: 'ml' },
  ], taste: [T.sweet, T.creamy, T.rich], emoji: '🍫' },
  { name: 'Vanilla Bean Frappe', i: [
    { name: 'vanilla ice cream', quantity: 2, unit: 'scoops' },
    { name: 'milk', quantity: 120, unit: 'ml' },
    { name: 'fresh espresso', quantity: 30, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.creamy, T.coffee], emoji: '🍦' },
  { name: 'Passionfruit Pearl', i: [
    { name: 'passionfruit puree', quantity: 60, unit: 'ml' },
    { name: 'orange juice', quantity: 90, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.fruity, T.sour], emoji: '🟡' },
  { name: 'Cucumber Mint Spritz', i: [
    { name: 'fresh cucumber', quantity: 60, unit: 'g' },
    { name: 'fresh mint', quantity: 8, unit: 'leaves' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.refreshing, T.herbal], emoji: '🥒' },
  { name: 'Honey Citrus Punch', i: [
    { name: 'fresh orange juice', quantity: 90, unit: 'ml' },
    { name: 'fresh grapefruit juice', quantity: 60, unit: 'ml' },
    { name: 'honey', quantity: 20, unit: 'ml' },
    { name: 'soda water', quantity: 60, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.citrus, T.sweet], emoji: '🍯' },
  { name: 'Coconut Lime Smash', i: [
    { name: 'coconut water', quantity: 150, unit: 'ml' },
    { name: 'coconut cream', quantity: 30, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.creamy, T.refreshing], emoji: '🥥' },
  { name: 'Mocha Frappe', i: [
    { name: 'fresh espresso', quantity: 60, unit: 'ml' },
    { name: 'chocolate syrup', quantity: 30, unit: 'ml' },
    { name: 'milk', quantity: 150, unit: 'ml' },
    { name: 'vanilla ice cream', quantity: 1, unit: 'scoop' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.creamy, T.coffee], emoji: '🧋' },
  { name: 'Pink Lemonade', i: [
    { name: 'fresh lemon juice', quantity: 45, unit: 'ml' },
    { name: 'cranberry juice', quantity: 60, unit: 'ml' },
    { name: 'sugar syrup', quantity: 20, unit: 'ml' },
    { name: 'water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sour, T.fruity], emoji: '💗' },
  { name: 'Frozen Mango Smoothie', i: [
    { name: 'mango', quantity: 200, unit: 'g' },
    { name: 'yogurt', quantity: 90, unit: 'ml' },
    { name: 'orange juice', quantity: 60, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 2, unit: 'cups' },
  ], taste: [T.fruity, T.creamy], emoji: '🥭' },
  { name: 'Spicy Watermelon Kick', i: [
    { name: 'fresh watermelon', quantity: 300, unit: 'g' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'chili powder', quantity: 1, unit: 'pinch' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.spicy, T.fruity, T.refreshing], emoji: '🌶️' },
  { name: 'Blueberry Mint Fizz', i: [
    { name: 'blueberries', quantity: 80, unit: 'g' },
    { name: 'fresh mint', quantity: 6, unit: 'leaves' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.bubbly, T.minty], emoji: '🫐' },
  { name: 'Raspberry Lime Rickey', i: [
    { name: 'fresh raspberries', quantity: 60, unit: 'g' },
    { name: 'fresh lime juice', quantity: 25, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.sour, T.bubbly], emoji: '🍒' },
  { name: 'Melon Splash', i: [
    { name: 'honeydew melon', quantity: 200, unit: 'g' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.refreshing, T.fruity], emoji: '🍈' },
  { name: 'Golden Turmeric Tonic', i: [
    { name: 'fresh turmeric', quantity: 5, unit: 'g' },
    { name: 'fresh ginger', quantity: 5, unit: 'g' },
    { name: 'fresh lemon juice', quantity: 20, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'black pepper', quantity: 1, unit: 'pinch' },
    { name: 'warm water', quantity: 200, unit: 'ml' },
  ], taste: [T.spicy, T.warming, T.herbal], emoji: '🌞' },
  { name: 'Peach Bellini Mocktail', i: [
    { name: 'peach puree', quantity: 60, unit: 'ml' },
    { name: 'sparkling white grape juice', quantity: 120, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.bubbly], emoji: '🍑' },
  { name: 'Rose Sherbet Soda', i: [
    { name: 'rose syrup', quantity: 20, unit: 'ml' },
    { name: 'sherbet', quantity: 1, unit: 'scoop' },
    { name: 'soda water', quantity: 180, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.floral, T.sweet, T.bubbly], emoji: '🌷' },
  { name: 'Caramel Apple Smash', i: [
    { name: 'apple juice', quantity: 120, unit: 'ml' },
    { name: 'caramel syrup', quantity: 20, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
    { name: 'cinnamon', quantity: 1, unit: 'pinch' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.fruity, T.warming], emoji: '🍎' },
  { name: 'Cold Brew Tonic', i: [
    { name: 'cold brew coffee', quantity: 90, unit: 'ml' },
    { name: 'tonic water', quantity: 120, unit: 'ml' },
    { name: 'orange peel', quantity: 1, unit: 'strip' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.bitter, T.coffee, T.bubbly], emoji: '☕' },
  { name: 'Fizzy Orange Spice', i: [
    { name: 'orange juice', quantity: 120, unit: 'ml' },
    { name: 'cinnamon', quantity: 1, unit: 'pinch' },
    { name: 'nutmeg', quantity: 1, unit: 'pinch' },
    { name: 'ginger ale', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.citrus, T.spicy, T.bubbly], emoji: '🍊' },
  { name: 'Pineapple Basil Fizz', i: [
    { name: 'pineapple juice', quantity: 120, unit: 'ml' },
    { name: 'fresh basil', quantity: 6, unit: 'leaves' },
    { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.herbal, T.bubbly], emoji: '🍍' },
  { name: 'Sparkling Pomegranate Rose', i: [
    { name: 'pomegranate juice', quantity: 90, unit: 'ml' },
    { name: 'rose water', quantity: 5, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.floral, T.fruity, T.bubbly], emoji: '🌹' },
  { name: 'Green Apple Basil Smash', i: [
    { name: 'green apple', quantity: 80, unit: 'g' },
    { name: 'fresh basil', quantity: 6, unit: 'leaves' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.herbal, T.refreshing], emoji: '🍏' },
  { name: 'Chai Latte', i: [
    { name: 'chai tea concentrate', quantity: 120, unit: 'ml' },
    { name: 'milk', quantity: 120, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'cinnamon', quantity: 1, unit: 'pinch' },
  ], taste: [T.warming, T.spicy, T.creamy], emoji: '🫖' },
  { name: 'Iced Hibiscus Rose', i: [
    { name: 'dried hibiscus', quantity: 1, unit: 'tbsp' },
    { name: 'rose petals', quantity: 1, unit: 'pinch' },
    { name: 'hot water', quantity: 180, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.floral, T.sour], emoji: '🌺' },
  { name: 'Orchard Crush', i: [
    { name: 'apple juice', quantity: 90, unit: 'ml' },
    { name: 'pear juice', quantity: 60, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 60, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.refreshing], emoji: '🍐' },
  { name: 'Pineapple Turmeric Shot', i: [
    { name: 'pineapple juice', quantity: 60, unit: 'ml' },
    { name: 'fresh turmeric', quantity: 5, unit: 'g' },
    { name: 'fresh ginger', quantity: 5, unit: 'g' },
    { name: 'cayenne', quantity: 1, unit: 'pinch' },
  ], taste: [T.spicy, T.fruity], emoji: '💛' },
  { name: 'Tiger Milk', i: [
    { name: 'milk', quantity: 180, unit: 'ml' },
    { name: 'brown sugar syrup', quantity: 30, unit: 'ml' },
    { name: 'vanilla extract', quantity: 2, unit: 'drops' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.creamy], emoji: '🐯' },
  { name: 'Tropical Iced Green Tea', i: [
    { name: 'green tea', quantity: 180, unit: 'ml' },
    { name: 'mango puree', quantity: 30, unit: 'ml' },
    { name: 'pineapple juice', quantity: 60, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.refreshing], emoji: '🍵' },
  { name: 'Spiced Cranberry Punch', i: [
    { name: 'cranberry juice', quantity: 150, unit: 'ml' },
    { name: 'orange juice', quantity: 60, unit: 'ml' },
    { name: 'cinnamon stick', quantity: 1, unit: 'piece' },
    { name: 'cloves', quantity: 2, unit: 'pieces' },
    { name: 'star anise', quantity: 1, unit: 'piece' },
    { name: 'honey', quantity: 15, unit: 'ml' },
  ], taste: [T.warming, T.fruity, T.spicy], emoji: '❤️' },
  { name: 'Charcoal Lemonade', i: [
    { name: 'activated charcoal', quantity: 1, unit: 'tsp' },
    { name: 'fresh lemon juice', quantity: 30, unit: 'ml' },
    { name: 'agave syrup', quantity: 20, unit: 'ml' },
    { name: 'water', quantity: 180, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sour, T.refreshing], emoji: '⚫' },
  { name: 'Grape Frost', i: [
    { name: 'red grape juice', quantity: 180, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 2, unit: 'cups' },
  ], taste: [T.fruity, T.sweet], emoji: '🍇' },
  { name: 'Fig Smash', i: [
    { name: 'fresh fig', quantity: 80, unit: 'g' },
    { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
    { name: 'honey', quantity: 20, unit: 'ml' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.sweet], emoji: '🟣' },
  { name: 'Green Tea Lemonade', i: [
    { name: 'green tea', quantity: 150, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 30, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.citrus, T.refreshing], emoji: '🍵' },
  { name: 'Almond Horchata', i: [
    { name: 'almond milk', quantity: 180, unit: 'ml' },
    { name: 'rice milk', quantity: 60, unit: 'ml' },
    { name: 'cinnamon', quantity: 1, unit: 'pinch' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.creamy, T.sweet, T.nutty], emoji: '🥛' },
];
NAMED_MOCKTAILS.forEach((nm) => {
  MOCKTAILS.push(recipe({
    name: nm.name, type: 'mocktail',
    category: nm.taste.includes(T.refreshing) ? 'Refreshing' :
              nm.taste.includes(T.tropical) ? 'Tropical' :
              nm.taste.includes(T.creamy) ? 'Creamy' :
              nm.taste.includes(T.floral) ? 'Floral' :
              nm.taste.includes(T.coffee) ? 'After-Dinner' :
              nm.taste.includes(T.sour) ? 'Sour' :
              'Fruity',
    glass: 'highball', emoji: nm.emoji ?? '🧃',
    ingredients: nm.i,
    steps: nm.name.includes('Shot') ? [
      'Combine all ingredients.',
      'Serve immediately.',
    ] : nm.name.includes('Smoothie') || nm.name.includes('Frappe') || nm.name.includes('Milkshake') || nm.name.includes('Frozen') ? [
      'Add all ingredients to a blender.',
      'Blend until smooth.',
      'Pour into a chilled glass.',
      'Garnish appropriately.',
    ] : [
      'Combine all ingredients in a shaker with ice.',
      'Shake for 10 seconds.',
      'Strain into a tall ice-filled glass.',
      'Finish with the garnish and serve.',
    ],
    tags: ['mocktail', 'zero proof'],
    taste: nm.taste,
  }));
});

// Collins family
['Tom', 'John', 'Vodka', 'Captain', 'Pedro', 'Michael', 'Pierre', 'Juan'].forEach((n) => {
  const spiritMap = {
    Tom: 'gin', John: 'bourbon whiskey', Vodka: 'vodka', Captain: 'white rum',
    Pedro: 'pisco', Michael: 'irish whiskey', Pierre: 'cognac', Juan: 'tequila',
  };
  const sp = spiritMap[n];
  CLASSICS.push(recipe({
    name: `${n} Collins`, type: 'cocktail', category: 'Refreshing',
    glass: 'collins', emoji: '🍸',
    ingredients: [
      { name: sp, quantity: 50, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 25, unit: 'ml' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      { name: 'soda water', quantity: 90, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: [
      `Add ${sp}, lemon juice and syrup to a shaker with ice.`,
      'Shake briefly for 6 seconds.',
      'Pour into a collins glass with fresh ice.',
      'Top with soda water and stir gently.',
      'Garnish with a lemon wheel and cherry.',
    ],
    tags: ['refreshing', 'tall', 'classic'],
    taste: [T.citrus, T.refreshing, T.bubbly],
  }));
});

// Gimlet family
['gin', 'vodka', 'white rum', 'tequila'].forEach((sp) => {
  const label = sp === 'gin' ? 'Gimlet' : `${sp[0].toUpperCase() + sp.slice(1).replace(' rum', ' Rum')} Gimlet`;
  CLASSICS.push(recipe({
    name: label, type: 'cocktail', category: 'Classic',
    glass: 'coupe', emoji: '🍸',
    ingredients: [
      { name: sp, quantity: 60, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 25, unit: 'ml' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: [
      'Shake all ingredients with ice for 10 seconds.',
      'Double-strain into a chilled coupe.',
      'Garnish with a lime wheel.',
    ],
    tags: ['sour', 'classic', sp.split(' ')[0]],
    taste: [T.sour, T.citrus, T.dry],
  }));
});

// Fizz family
['Gin Fizz', 'Ramos Gin Fizz', 'Sloe Gin Fizz', 'Silver Fizz', 'Royal Fizz', 'Golden Fizz', 'Diamond Fizz'].forEach((n) => {
  const base = n === 'Sloe Gin Fizz' ? 'sloe gin' : 'gin';
  CLASSICS.push(recipe({
    name: n, type: 'cocktail', category: 'Sparkling',
    glass: 'highball', emoji: '🍋',
    ingredients: [
      { name: base, quantity: 50, unit: 'ml' },
      { name: 'fresh lemon juice', quantity: 25, unit: 'ml' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      ...(n.includes('Ramos') ? [
        { name: 'cream', quantity: 20, unit: 'ml' },
        { name: 'orange flower water', quantity: 2, unit: 'drops' },
        { name: 'egg white', quantity: 1, unit: 'whole' },
      ] : []),
      ...(n === 'Silver Fizz' ? [{ name: 'egg white', quantity: 1, unit: 'whole' }] : []),
      ...(n === 'Royal Fizz' ? [{ name: 'eggs', quantity: 1, unit: 'whole' }] : []),
      ...(n === 'Golden Fizz' ? [{ name: 'egg yolk', quantity: 1, unit: 'whole' }] : []),
      ...(n === 'Diamond Fizz' ? [{ name: 'champagne', quantity: 60, unit: 'ml' }] : [{ name: 'soda water', quantity: 60, unit: 'ml' }]),
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: [
      (n.includes('Silver') || n.includes('Royal') || n.includes('Golden') || n.includes('Ramos'))
        ? 'Dry-shake without ice for 15 seconds.' : 'Add gin, lemon and syrup to shaker.',
      'Add ice and shake hard for 20 seconds.',
      'Strain into a chilled highball glass.',
      n === 'Diamond Fizz' ? 'Top with champagne.' : 'Top with cold soda water.',
      'Serve immediately.',
    ],
    tags: ['fizzy', 'classic'],
    taste: [T.bubbly, T.citrus, T.rich],
    difficulty: n.includes('Ramos') ? 'hard' : 'medium',
  }));
});

// Julep family
['Mint', 'Peach', 'Pineapple', 'Ginger'].forEach((flavor) => {
  CLASSICS.push(recipe({
    name: `${flavor} Julep`, type: 'cocktail', category: 'Refreshing',
    glass: 'julep', emoji: '🥃',
    ingredients: [
      { name: 'bourbon whiskey', quantity: 60, unit: 'ml' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      ...(flavor === 'Mint' ? [{ name: 'fresh mint', quantity: 10, unit: 'leaves' }] : []),
      ...(flavor === 'Peach' ? [{ name: 'fresh peach', quantity: 60, unit: 'g' }, { name: 'fresh mint', quantity: 6, unit: 'leaves' }] : []),
      ...(flavor === 'Pineapple' ? [{ name: 'pineapple', quantity: 60, unit: 'g' }, { name: 'fresh mint', quantity: 6, unit: 'leaves' }] : []),
      ...(flavor === 'Ginger' ? [{ name: 'fresh ginger', quantity: 10, unit: 'g' }, { name: 'fresh mint', quantity: 6, unit: 'leaves' }] : []),
      { name: 'crushed ice', quantity: 1, unit: 'cup' },
    ],
    steps: [
      `Muddle ${flavor.toLowerCase()} with sugar syrup in a julep cup.`,
      'Add bourbon and crushed ice.',
      'Churn with a barspoon.',
      'Top with more crushed ice to form a dome.',
      'Slap a mint bouquet and insert it.',
    ],
    tags: ['whiskey', 'refreshing', flavor.toLowerCase()],
    taste: [T.refreshing, T.minty, T.warming],
  }));
});

// Punches (batch-style but single-serve scaled)
[
  { name: 'Rum Punch', base: 'dark rum', extra: 'white rum' },
  { name: 'Planters Punch', base: 'dark rum' },
  { name: 'Fish House Punch', base: 'cognac', extra: 'dark rum' },
  { name: 'Sangria (Red)', base: 'red wine', sangria: true },
  { name: 'Sangria (White)', base: 'white wine', sangria: true },
  { name: 'Hunch Punch', base: 'vodka', punch: true },
  { name: 'Tropical Fruit Punch', base: 'white rum', punch: true },
].forEach((p) => {
  const ingredients = p.sangria ? [
    { name: p.base, quantity: 150, unit: 'ml' },
    { name: 'brandy', quantity: 30, unit: 'ml' },
    { name: 'orange juice', quantity: 60, unit: 'ml' },
    { name: 'fresh orange', quantity: 30, unit: 'g' },
    { name: 'fresh apple', quantity: 30, unit: 'g' },
    { name: 'cinnamon stick', quantity: 1, unit: 'piece' },
    { name: 'sugar', quantity: 2, unit: 'tsp' },
    { name: 'soda water', quantity: 60, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ] : [
    { name: p.base, quantity: 45, unit: 'ml' },
    ...(p.extra ? [{ name: p.extra, quantity: 30, unit: 'ml' }] : []),
    { name: 'pineapple juice', quantity: 60, unit: 'ml' },
    { name: 'orange juice', quantity: 60, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'grenadine', quantity: 10, unit: 'ml' },
    ...(p.punch ? [{ name: 'cranberry juice', quantity: 60, unit: 'ml' }] : []),
    { name: 'ice', quantity: 1, unit: 'cup' },
  ];
  CLASSICS.push(recipe({
    name: p.name, type: 'cocktail',
    category: p.sangria ? 'Fruity' : 'Tropical',
    glass: p.sangria ? 'wine' : 'hurricane', emoji: '🍷',
    ingredients,
    steps: p.sangria ? [
      'Combine wine, brandy, orange juice, fruit and sugar in a pitcher.',
      'Refrigerate overnight.',
      'Pour over ice, top with soda water and stir gently.',
    ] : [
      'Add all ingredients except grenadine to a shaker with ice.',
      'Shake for 8 seconds.',
      'Strain into a tall glass with fresh ice.',
      'Drizzle grenadine down the side for a sunset effect.',
    ],
    tags: ['punch', 'fruity', 'group'],
    taste: [T.fruity, T.tropical, T.sweet],
  }));
});

// Swizzle / Crusta family
[
  { name: 'Queen\'s Park Swizzle', base: 'dark rum' },
  { name: 'Rum Swizzle', base: 'dark rum' },
  { name: 'Green Swizzle', base: 'gin' },
].forEach((s) => {
  CLASSICS.push(recipe({
    name: s.name, type: 'cocktail', category: 'Refreshing',
    glass: 'collins', emoji: '🌀',
    ingredients: [
      { name: s.base, quantity: 60, unit: 'ml' },
      { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
      { name: 'sugar syrup', quantity: 15, unit: 'ml' },
      { name: 'fresh mint', quantity: 10, unit: 'leaves' },
      { name: 'angostura bitters', quantity: 5, unit: 'dashes' },
      { name: 'crushed ice', quantity: 1, unit: 'cup' },
    ],
    steps: [
      'Add mint and sugar syrup to a collins glass and lightly press.',
      'Add lime juice, rum and crushed ice.',
      'Swizzle with a swizzle stick until the glass frosts over.',
      'Top with more crushed ice.',
      'Crown with bitters.',
    ],
    tags: ['tiki', 'swizzle'],
    taste: [T.refreshing, T.bitter, T.minty],
    difficulty: 'medium',
  }));
});

// Highball variants
[
  { name: 'Vodka Soda', s: 'vodka', m: 'soda water' },
  { name: 'Whiskey Ginger', s: 'bourbon whiskey', m: 'ginger ale' },
  { name: 'Jack and Coke', s: 'bourbon whiskey', m: 'cola' },
  { name: 'Amaretto and Soda', s: 'amaretto', m: 'soda water' },
  { name: 'Bourbon Lemonade', s: 'bourbon whiskey', m: 'lemonade' },
  { name: 'Gin Buck', s: 'gin', m: 'ginger ale', lime: true },
  { name: 'Rum Buck', s: 'white rum', m: 'ginger ale', lime: true },
  { name: 'Tequila Sunrise', s: 'tequila', m: 'orange juice' },
  { name: 'Tequila Grapefruit', s: 'tequila', m: 'grapefruit soda' },
].forEach((h) => {
  CLASSICS.push(recipe({
    name: h.name, type: 'cocktail', category: 'Refreshing',
    glass: 'highball', emoji: '🥤',
    ingredients: [
      { name: h.s, quantity: 50, unit: 'ml' },
      { name: h.m, quantity: 120, unit: 'ml' },
      ...(h.lime ? [{ name: 'fresh lime juice', quantity: 15, unit: 'ml' }] : []),
      { name: 'ice', quantity: 1, unit: 'cup' },
    ],
    steps: [
      'Fill a highball glass with ice.',
      `Pour the ${h.s}.`,
      ...(h.lime ? ['Squeeze lime juice.'] : []),
      `Top with ${h.m}.`,
      'Stir once gently. Garnish with citrus.',
    ],
    tags: ['highball', 'easy', h.s.split(' ')[0]],
    taste: [T.refreshing, T.bubbly],
  }));
});

// Extra mocktails to cross 300
const EXTRA_MOCKTAILS = [
  { name: 'Strawberry Kiwi Splash', i: [
    { name: 'fresh strawberries', quantity: 80, unit: 'g' },
    { name: 'kiwi', quantity: 1, unit: 'whole' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.bubbly], emoji: '🥝' },
  { name: 'Raspberry Rose Crush', i: [
    { name: 'fresh raspberries', quantity: 60, unit: 'g' },
    { name: 'rose syrup', quantity: 20, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.floral], emoji: '🌹' },
  { name: 'Orchid Mint Sparkle', i: [
    { name: 'fresh mint', quantity: 10, unit: 'leaves' },
    { name: 'cucumber', quantity: 4, unit: 'slices' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'honey', quantity: 10, unit: 'ml' },
    { name: 'tonic water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.minty, T.refreshing, T.bubbly], emoji: '🌿' },
  { name: 'Guava Sunrise', i: [
    { name: 'guava juice', quantity: 120, unit: 'ml' },
    { name: 'orange juice', quantity: 60, unit: 'ml' },
    { name: 'grenadine', quantity: 10, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.fruity], emoji: '🌅' },
  { name: 'Kombucha Cooler', i: [
    { name: 'kombucha', quantity: 180, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'fresh mint', quantity: 6, unit: 'leaves' },
    { name: 'honey', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sour, T.bubbly, T.refreshing], emoji: '🧋' },
  { name: 'Tamarind Cooler', i: [
    { name: 'tamarind paste', quantity: 20, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'black salt', quantity: 1, unit: 'pinch' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sour, T.spicy, T.refreshing], emoji: '🟤' },
  { name: 'Orange Blossom Fizz', i: [
    { name: 'orange juice', quantity: 120, unit: 'ml' },
    { name: 'orange flower water', quantity: 3, unit: 'drops' },
    { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.citrus, T.floral, T.bubbly], emoji: '🌼' },
  { name: 'Cranberry Apple Spritz', i: [
    { name: 'cranberry juice', quantity: 90, unit: 'ml' },
    { name: 'apple juice', quantity: 90, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 60, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.bubbly], emoji: '🍏' },
  { name: 'Rose Cardamom Cooler', i: [
    { name: 'rose syrup', quantity: 20, unit: 'ml' },
    { name: 'cardamom syrup', quantity: 10, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 20, unit: 'ml' },
    { name: 'milk', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.floral, T.spicy, T.creamy], emoji: '🌸' },
  { name: 'Watermelon Mint Slush', i: [
    { name: 'fresh watermelon', quantity: 250, unit: 'g' },
    { name: 'fresh mint', quantity: 8, unit: 'leaves' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 2, unit: 'cups' },
  ], taste: [T.refreshing, T.fruity, T.minty], emoji: '🍉' },
  { name: 'Strawberry Rhubarb Cooler', i: [
    { name: 'strawberry puree', quantity: 45, unit: 'ml' },
    { name: 'rhubarb syrup', quantity: 20, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 20, unit: 'ml' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.sour, T.bubbly], emoji: '🍓' },
  { name: 'Papaya Lime Smoothie', i: [
    { name: 'papaya', quantity: 200, unit: 'g' },
    { name: 'yogurt', quantity: 90, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.creamy, T.fruity], emoji: '🟠' },
  { name: 'Coconut Cocoa Shake', i: [
    { name: 'coconut milk', quantity: 180, unit: 'ml' },
    { name: 'cocoa powder', quantity: 1, unit: 'tbsp' },
    { name: 'banana', quantity: 1, unit: 'whole' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.creamy, T.rich, T.sweet], emoji: '🥥' },
  { name: 'Apricot Nectar Cooler', i: [
    { name: 'apricot nectar', quantity: 120, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 20, unit: 'ml' },
    { name: 'honey', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.sweet, T.refreshing], emoji: '🟧' },
  { name: 'Saffron Rose Milk', i: [
    { name: 'milk', quantity: 200, unit: 'ml' },
    { name: 'saffron', quantity: 3, unit: 'strands' },
    { name: 'rose syrup', quantity: 15, unit: 'ml' },
    { name: 'sugar', quantity: 1, unit: 'tsp' },
    { name: 'crushed pistachios', quantity: 1, unit: 'tsp' },
  ], taste: [T.creamy, T.floral, T.sweet], emoji: '🌼' },
  { name: 'Pear Ginger Sparkler', i: [
    { name: 'pear juice', quantity: 120, unit: 'ml' },
    { name: 'fresh ginger', quantity: 10, unit: 'g' },
    { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
    { name: 'honey', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.spicy, T.bubbly], emoji: '🍐' },
  { name: 'Mango Chili Fizz', i: [
    { name: 'mango puree', quantity: 60, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'chili powder', quantity: 1, unit: 'pinch' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.spicy, T.fruity], emoji: '🌶️' },
  { name: 'Lychee Rose Cooler', i: [
    { name: 'lychee juice', quantity: 90, unit: 'ml' },
    { name: 'rose syrup', quantity: 15, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.floral, T.fruity, T.refreshing], emoji: '🌸' },
  { name: 'Berry Basil Sparkler', i: [
    { name: 'mixed berries', quantity: 80, unit: 'g' },
    { name: 'fresh basil', quantity: 5, unit: 'leaves' },
    { name: 'fresh lemon juice', quantity: 20, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.herbal, T.bubbly], emoji: '🫐' },
  { name: 'Peach Ginger Iced Tea', i: [
    { name: 'black tea', quantity: 180, unit: 'ml' },
    { name: 'peach puree', quantity: 40, unit: 'ml' },
    { name: 'fresh ginger', quantity: 5, unit: 'g' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.spicy, T.refreshing], emoji: '🍑' },
  { name: 'Melon Lime Cooler', i: [
    { name: 'honeydew melon', quantity: 200, unit: 'g' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'fresh mint', quantity: 6, unit: 'leaves' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.refreshing, T.fruity, T.minty], emoji: '🍈' },
  { name: 'Hibiscus Lime Spritz', i: [
    { name: 'hibiscus tea', quantity: 120, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.floral, T.sour, T.bubbly], emoji: '🌺' },
  { name: 'Pomegranate Mint Cooler', i: [
    { name: 'pomegranate juice', quantity: 120, unit: 'ml' },
    { name: 'fresh mint', quantity: 8, unit: 'leaves' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 60, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.minty, T.refreshing], emoji: '🔴' },
  { name: 'Cantaloupe Cooler', i: [
    { name: 'cantaloupe', quantity: 200, unit: 'g' },
    { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
    { name: 'fresh mint', quantity: 6, unit: 'leaves' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.refreshing, T.fruity], emoji: '🍈' },
  { name: 'Gingerbread Latte', i: [
    { name: 'milk', quantity: 200, unit: 'ml' },
    { name: 'fresh espresso', quantity: 30, unit: 'ml' },
    { name: 'gingerbread syrup', quantity: 20, unit: 'ml' },
    { name: 'cinnamon', quantity: 1, unit: 'pinch' },
    { name: 'whipped cream', quantity: 30, unit: 'ml' },
  ], taste: [T.sweet, T.creamy, T.coffee, T.warming], emoji: '🎄' },
  { name: 'Maple Cinnamon Shake', i: [
    { name: 'vanilla ice cream', quantity: 2, unit: 'scoops' },
    { name: 'milk', quantity: 150, unit: 'ml' },
    { name: 'maple syrup', quantity: 30, unit: 'ml' },
    { name: 'cinnamon', quantity: 1, unit: 'pinch' },
  ], taste: [T.sweet, T.creamy, T.rich], emoji: '🍁' },
  { name: 'Pumpkin Spice Latte', i: [
    { name: 'pumpkin puree', quantity: 30, unit: 'ml' },
    { name: 'fresh espresso', quantity: 30, unit: 'ml' },
    { name: 'milk', quantity: 180, unit: 'ml' },
    { name: 'sugar', quantity: 15, unit: 'ml' },
    { name: 'pumpkin spice', quantity: 1, unit: 'pinch' },
  ], taste: [T.spicy, T.sweet, T.warming], emoji: '🎃' },
  { name: 'Taro Bubble Milk Tea', i: [
    { name: 'taro powder', quantity: 30, unit: 'g' },
    { name: 'milk', quantity: 180, unit: 'ml' },
    { name: 'sugar syrup', quantity: 20, unit: 'ml' },
    { name: 'tapioca pearls', quantity: 30, unit: 'g' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.creamy], emoji: '🟣' },
  { name: 'Peach Green Tea', i: [
    { name: 'green tea', quantity: 200, unit: 'ml' },
    { name: 'peach puree', quantity: 45, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 10, unit: 'ml' },
    { name: 'sugar syrup', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.refreshing], emoji: '🍑' },
  { name: 'Strawberry Lemonade', i: [
    { name: 'fresh strawberries', quantity: 100, unit: 'g' },
    { name: 'fresh lemon juice', quantity: 30, unit: 'ml' },
    { name: 'sugar syrup', quantity: 20, unit: 'ml' },
    { name: 'water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.sour], emoji: '🍓' },
  { name: 'Mango Coconut Slush', i: [
    { name: 'mango', quantity: 200, unit: 'g' },
    { name: 'coconut milk', quantity: 120, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 2, unit: 'cups' },
  ], taste: [T.tropical, T.creamy, T.fruity], emoji: '🥭' },
  { name: 'Cucumber Cilantro Cooler', i: [
    { name: 'cucumber', quantity: 80, unit: 'g' },
    { name: 'cilantro', quantity: 4, unit: 'sprigs' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'agave syrup', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.herbal, T.refreshing], emoji: '🥒' },
  { name: 'Berry Iced Tea', i: [
    { name: 'black tea', quantity: 180, unit: 'ml' },
    { name: 'mixed berries', quantity: 60, unit: 'g' },
    { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.refreshing], emoji: '🫐' },
  { name: 'Raspberry Chia Fresca', i: [
    { name: 'fresh raspberries', quantity: 80, unit: 'g' },
    { name: 'chia seeds', quantity: 2, unit: 'tsp' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'water', quantity: 180, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.refreshing], emoji: '🍒' },
  { name: 'Sparkling Cranberry', i: [
    { name: 'cranberry juice', quantity: 120, unit: 'ml' },
    { name: 'sparkling white grape juice', quantity: 120, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 10, unit: 'ml' },
    { name: 'fresh rosemary', quantity: 1, unit: 'sprig' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.bubbly, T.herbal], emoji: '❄️' },
  { name: 'Blood Orange Spritz', i: [
    { name: 'blood orange juice', quantity: 90, unit: 'ml' },
    { name: 'fresh lemon juice', quantity: 15, unit: 'ml' },
    { name: 'sugar syrup', quantity: 10, unit: 'ml' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.citrus, T.bubbly, T.fruity], emoji: '🩸' },
  { name: 'Yuzu Sparkler', i: [
    { name: 'yuzu juice', quantity: 30, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 150, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.citrus, T.bubbly, T.refreshing], emoji: '🟡' },
  { name: 'Spiced Hot Apple', i: [
    { name: 'apple juice', quantity: 240, unit: 'ml' },
    { name: 'cinnamon stick', quantity: 1, unit: 'piece' },
    { name: 'cloves', quantity: 3, unit: 'pieces' },
    { name: 'star anise', quantity: 1, unit: 'piece' },
    { name: 'honey', quantity: 15, unit: 'ml' },
  ], taste: [T.warming, T.spicy], emoji: '🍎' },
  { name: 'Iced Thai Peach Tea', i: [
    { name: 'black tea', quantity: 180, unit: 'ml' },
    { name: 'peach puree', quantity: 40, unit: 'ml' },
    { name: 'condensed milk', quantity: 20, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.fruity, T.creamy], emoji: '🍑' },
  { name: 'Frozen Lemonade', i: [
    { name: 'fresh lemon juice', quantity: 45, unit: 'ml' },
    { name: 'sugar syrup', quantity: 30, unit: 'ml' },
    { name: 'water', quantity: 60, unit: 'ml' },
    { name: 'ice', quantity: 2, unit: 'cups' },
  ], taste: [T.sour, T.refreshing], emoji: '🍋' },
  { name: 'Chocolate Mint Frappe', i: [
    { name: 'chocolate syrup', quantity: 30, unit: 'ml' },
    { name: 'fresh mint', quantity: 8, unit: 'leaves' },
    { name: 'milk', quantity: 150, unit: 'ml' },
    { name: 'vanilla ice cream', quantity: 2, unit: 'scoops' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.creamy, T.minty], emoji: '🍫' },
  { name: 'Vanilla Almond Latte', i: [
    { name: 'almond milk', quantity: 180, unit: 'ml' },
    { name: 'fresh espresso', quantity: 30, unit: 'ml' },
    { name: 'vanilla syrup', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.sweet, T.creamy, T.coffee, T.nutty], emoji: '☕' },
  { name: 'Spicy Mango Cooler', i: [
    { name: 'mango puree', quantity: 60, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'chili powder', quantity: 1, unit: 'pinch' },
    { name: 'tajin', quantity: 1, unit: 'pinch' },
    { name: 'soda water', quantity: 120, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.spicy], emoji: '🌶️' },
  { name: 'Cold Brew Cream', i: [
    { name: 'cold brew coffee', quantity: 180, unit: 'ml' },
    { name: 'vanilla syrup', quantity: 15, unit: 'ml' },
    { name: 'cream', quantity: 30, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.coffee, T.sweet, T.creamy], emoji: '☕' },
  { name: 'Sparkling Watermelon Rose', i: [
    { name: 'watermelon juice', quantity: 120, unit: 'ml' },
    { name: 'rose syrup', quantity: 15, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 15, unit: 'ml' },
    { name: 'soda water', quantity: 60, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.floral, T.bubbly], emoji: '🍉' },
  { name: 'Peach Raspberry Iced Tea', i: [
    { name: 'black tea', quantity: 180, unit: 'ml' },
    { name: 'peach puree', quantity: 30, unit: 'ml' },
    { name: 'raspberry puree', quantity: 30, unit: 'ml' },
    { name: 'honey', quantity: 15, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.fruity, T.refreshing], emoji: '🍑' },
  { name: 'Orange Vanilla Float', i: [
    { name: 'orange juice', quantity: 120, unit: 'ml' },
    { name: 'vanilla ice cream', quantity: 1, unit: 'scoop' },
    { name: 'soda water', quantity: 90, unit: 'ml' },
  ], taste: [T.sweet, T.creamy, T.citrus], emoji: '🍦' },
  { name: 'Tropical Mocktail Punch', i: [
    { name: 'pineapple juice', quantity: 90, unit: 'ml' },
    { name: 'orange juice', quantity: 60, unit: 'ml' },
    { name: 'mango nectar', quantity: 60, unit: 'ml' },
    { name: 'fresh lime juice', quantity: 20, unit: 'ml' },
    { name: 'grenadine', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.fruity, T.sweet], emoji: '🏝️' },
  { name: 'Pineapple Coconut Iced Tea', i: [
    { name: 'black tea', quantity: 150, unit: 'ml' },
    { name: 'pineapple juice', quantity: 60, unit: 'ml' },
    { name: 'coconut cream', quantity: 30, unit: 'ml' },
    { name: 'honey', quantity: 10, unit: 'ml' },
    { name: 'ice', quantity: 1, unit: 'cup' },
  ], taste: [T.tropical, T.creamy], emoji: '🥥' },
];
EXTRA_MOCKTAILS.forEach((nm) => {
  MOCKTAILS.push(recipe({
    name: nm.name, type: 'mocktail',
    category: nm.taste.includes(T.tropical) ? 'Tropical' :
              nm.taste.includes(T.creamy) ? 'Creamy' :
              nm.taste.includes(T.floral) ? 'Floral' :
              nm.taste.includes(T.coffee) ? 'After-Dinner' :
              nm.taste.includes(T.sour) ? 'Sour' :
              nm.taste.includes(T.refreshing) ? 'Refreshing' :
              'Fruity',
    glass: 'highball', emoji: nm.emoji ?? '🧃',
    ingredients: nm.i,
    steps: nm.name.match(/Smoothie|Frappe|Milkshake|Frozen|Slush|Shake/) ? [
      'Add all ingredients to a blender.',
      'Blend until smooth and thick.',
      'Pour into a chilled glass.',
      'Garnish appropriately.',
    ] : nm.name.match(/Latte|Chai|Pumpkin/) ? [
      'Warm milk (or milk alternative) in a saucepan.',
      'Whisk in syrup and spices.',
      'Pour into a mug and add espresso or tea.',
      'Top with whipped cream if using.',
    ] : [
      'Combine all ingredients in a shaker or jar.',
      'Shake with ice for 10 seconds.',
      'Strain into a chilled glass with fresh ice.',
      'Finish with the garnish and serve.',
    ],
    tags: ['mocktail', 'zero proof'],
    taste: nm.taste,
  }));
});

// Combine + de-dup + id
const all = [...CLASSICS, ...MOCKTAILS];
const seen = new Set();
const unique = [];
for (const r of all) {
  if (seen.has(r.slug)) continue;
  seen.add(r.slug);
  unique.push(r);
}

// Assign ids
unique.forEach((r, i) => { r.id = String(i + 1); });

// Sanity
console.log(`Generated ${unique.length} recipes (cocktails: ${unique.filter(r => r.type === 'cocktail').length}, mocktails: ${unique.filter(r => r.type === 'mocktail').length}).`);
if (unique.length < 300) {
  console.error('Dataset below 300 entries. Bailing.');
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify({ drinks: unique }, null, 2));
console.log('Wrote', outPath);
