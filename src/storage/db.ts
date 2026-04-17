import * as SQLite from 'expo-sqlite';
import type {
  AlcoholFilter,
  AlcoholLevel,
  Difficulty,
  Drink,
  DrinkType,
  Ingredient,
} from '../utils/types';
import recipesSeed from '../data/recipes.json';

/**
 * ─── Data-access layer ────────────────────────────────────────────────────
 *
 * Recipe data is read directly from the bundled JSON at startup. With only
 * ~300 entries, an in-memory store is dramatically faster and dramatically
 * less error-prone than seeding+querying SQLite on every read. (Seed failures
 * were previously silent, which is what caused the "0 drinks" state in the
 * UI.)
 *
 * SQLite is still used for **user state** — favorites and recently viewed —
 * where persistence across launches genuinely matters. Those tables no longer
 * rely on a seeded `recipes` table because joining against it became a simple
 * `Map<id, Drink>` lookup.
 */

// ─── In-memory recipe store (source of truth) ───────────────────────────────

interface RawSeed {
  id?: string | number;
  name: string;
  slug: string;
  type: DrinkType;
  category: string;
  glass?: string | null;
  ingredients?: Ingredient[] | null;
  steps?: string[] | null;
  image_path?: string | null;
  emoji?: string | null;
  tags?: string[] | null;
  taste_profile?: string[] | null;
  alcohol_level?: AlcoholLevel;
  alcohol_percentage?: number | null;
  prep_time?: number | null;
  difficulty?: Difficulty | null;
  rating?: number | null;
  is_popular?: boolean | number | null;
  is_trending?: boolean | number | null;
}

function normalize(r: RawSeed, idx: number): Drink {
  return {
    id: r.id != null ? String(r.id) : String(idx + 1),
    name: r.name,
    slug: r.slug,
    type: r.type,
    category: r.category,
    glass: r.glass ?? '',
    ingredients: r.ingredients ?? [],
    steps: r.steps ?? [],
    image_path: r.image_path ?? r.slug,
    emoji: r.emoji ?? (r.type === 'mocktail' ? '🧃' : '🍸'),
    tags: r.tags ?? [],
    taste_profile: r.taste_profile ?? [],
    alcohol_level: r.alcohol_level ?? (r.type === 'mocktail' ? 'none' : 'medium'),
    alcohol_percentage: r.alcohol_percentage ?? 0,
    prep_time: r.prep_time ?? 5,
    difficulty: r.difficulty ?? 'easy',
    rating: r.rating ?? 4.5,
    is_popular: !!r.is_popular,
    is_trending: !!r.is_trending,
  };
}

const ALL_DRINKS: Drink[] = (((recipesSeed as { drinks?: RawSeed[] }).drinks) ?? [])
  .map((r, i) => normalize(r, i));

const DRINKS_BY_ID = new Map<string, Drink>();
ALL_DRINKS.forEach((d) => DRINKS_BY_ID.set(d.id, d));

// ─── Recipe API (pure in-memory) ────────────────────────────────────────────

export function getAllDrinks(): Drink[] {
  return ALL_DRINKS;
}

export function getDrinkById(id: string): Drink | undefined {
  return DRINKS_BY_ID.get(id);
}

export function getDrinksByIds(ids: string[]): Drink[] {
  const out: Drink[] = [];
  for (const id of ids) {
    const d = DRINKS_BY_ID.get(id);
    if (d) out.push(d);
  }
  return out;
}

export interface DrinkQueryOptions {
  filter?: AlcoholFilter;
  query?: string;
  popularOnly?: boolean;
  trendingOnly?: boolean;
  maxPrepTime?: number;
  limit?: number;
  orderBy?: 'name' | 'rating' | 'random';
}

export function queryDrinks(opts: DrinkQueryOptions = {}): Drink[] {
  const {
    filter = 'all',
    query,
    popularOnly,
    trendingOnly,
    maxPrepTime,
    limit,
    orderBy = 'name',
  } = opts;

  const q = query?.trim().toLowerCase() ?? '';
  let out = ALL_DRINKS.filter((d) => {
    if (filter === 'cocktail' && d.type !== 'cocktail') return false;
    if (filter === 'mocktail' && d.type !== 'mocktail') return false;
    if (popularOnly && !d.is_popular) return false;
    if (trendingOnly && !d.is_trending) return false;
    if (typeof maxPrepTime === 'number' && d.prep_time > maxPrepTime) return false;
    if (q) {
      const hay =
        d.name.toLowerCase() +
        '|' + d.category.toLowerCase() +
        '|' + d.tags.join(',').toLowerCase() +
        '|' + d.ingredients.map((i) => i.name).join(',').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (orderBy === 'rating') {
    out = [...out].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  } else if (orderBy === 'random') {
    out = [...out].sort(() => Math.random() - 0.5);
  } else {
    out = [...out].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (typeof limit === 'number') out = out.slice(0, limit);
  return out;
}

export function getCategoryCounts(): Array<{ category: string; count: number }> {
  const map = new Map<string, number>();
  ALL_DRINKS.forEach((d) => map.set(d.category, (map.get(d.category) ?? 0) + 1));
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── SQLite for user state (favorites + recently viewed) ────────────────────

const SCHEMA_VERSION = 4;
let _db: SQLite.SQLiteDatabase | null = null;

function runMigrations(db: SQLite.SQLiteDatabase): void {
  try {
    db.execSync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS favorites (
        id        TEXT PRIMARY KEY NOT NULL,
        added_at  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_favorites_added ON favorites(added_at DESC);

      CREATE TABLE IF NOT EXISTS recently_viewed (
        id         TEXT PRIMARY KEY NOT NULL,
        viewed_at  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_recently_viewed ON recently_viewed(viewed_at DESC);

      CREATE TABLE IF NOT EXISTS meta (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);

    // Drop the legacy "recipes" table from older builds — data now lives in JSON.
    try {
      db.execSync(`DROP TABLE IF EXISTS recipes;`);
    } catch {
      /* ignore */
    }
  } catch (err) {
    console.warn('[MixMate db] migration failed', err);
  }
}

function getDB(): SQLite.SQLiteDatabase | null {
  if (_db) return _db;
  try {
    _db = SQLite.openDatabaseSync('mixmate.db');
    runMigrations(_db);
    try {
      _db.runSync(
        `INSERT INTO meta(key, value) VALUES('schema_version', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
        String(SCHEMA_VERSION)
      );
    } catch {
      /* ignore */
    }
    return _db;
  } catch (err) {
    console.warn('[MixMate db] openDatabaseSync failed — favorites will be in-memory', err);
    return null;
  }
}

// In-memory fallbacks so the app never breaks if SQLite refuses to open.
const memFavorites = new Map<string, number>();
const memRecent = new Map<string, number>();

// ─── Favorites API ──────────────────────────────────────────────────────────

export function getFavoriteIds(): string[] {
  const db = getDB();
  const memIds = [...memFavorites.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  if (!db) return memIds;
  try {
    const dbIds = db
      .getAllSync<{ id: string }>(`SELECT id FROM favorites ORDER BY added_at DESC;`)
      .map((r) => r.id);
    // Merge with in-memory fallback IDs so we never lose state during partial DB failures.
    return [...new Set([...dbIds, ...memIds])];
  } catch {
    return memIds;
  }
}

export function getFavoriteDrinks(): Drink[] {
  return getFavoriteIds()
    .map((id) => DRINKS_BY_ID.get(id))
    .filter((d): d is Drink => !!d);
}

export function isFavorite(id: string): boolean {
  const db = getDB();
  if (!db) return memFavorites.has(id);
  try {
    const row = db.getFirstSync<{ id: string }>(
      `SELECT id FROM favorites WHERE id = ? LIMIT 1;`,
      [id]
    );
    return !!row;
  } catch {
    return memFavorites.has(id);
  }
}

export function addFavorite(id: string): void {
  const db = getDB();
  const now = Date.now();
  if (!db) {
    memFavorites.set(id, now);
    return;
  }
  try {
    db.runSync(
      `INSERT OR IGNORE INTO favorites (id, added_at) VALUES (?, ?);`,
      [id, now]
    );
    // Keep memory mirror updated so UI remains resilient even if later reads fail.
    memFavorites.set(id, now);
  } catch (err) {
    console.warn('[MixMate db] addFavorite failed', err);
    memFavorites.set(id, now);
  }
}

export function removeFavorite(id: string): void {
  const db = getDB();
  if (!db) {
    memFavorites.delete(id);
    return;
  }
  try {
    db.runSync(`DELETE FROM favorites WHERE id = ?;`, [id]);
    memFavorites.delete(id);
  } catch (err) {
    console.warn('[MixMate db] removeFavorite failed', err);
    memFavorites.delete(id);
  }
}

export function toggleFavorite(id: string): boolean {
  if (isFavorite(id)) {
    removeFavorite(id);
    return false;
  }
  addFavorite(id);
  return true;
}

// ─── Recently viewed API ────────────────────────────────────────────────────

export function addRecentlyViewed(id: string): void {
  const db = getDB();
  const now = Date.now();
  if (!db) {
    memRecent.set(id, now);
    while (memRecent.size > 20) {
      const oldest = [...memRecent.entries()].sort((a, b) => a[1] - b[1])[0];
      if (oldest) memRecent.delete(oldest[0]);
      else break;
    }
    return;
  }
  try {
    db.runSync(
      `INSERT INTO recently_viewed (id, viewed_at) VALUES (?, ?)
         ON CONFLICT(id) DO UPDATE SET viewed_at = excluded.viewed_at;`,
      [id, now]
    );
    db.runSync(
      `DELETE FROM recently_viewed
         WHERE id NOT IN (
           SELECT id FROM recently_viewed ORDER BY viewed_at DESC LIMIT 20
         );`
    );
    memRecent.set(id, now);
  } catch (err) {
    console.warn('[MixMate db] addRecentlyViewed failed', err);
    memRecent.set(id, now);
  }
}

export function getRecentlyViewedIds(): string[] {
  const db = getDB();
  const memIds = [...memRecent.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  if (!db) return memIds;
  try {
    const dbIds = db
      .getAllSync<{ id: string }>(
        `SELECT id FROM recently_viewed ORDER BY viewed_at DESC LIMIT 20;`
      )
      .map((r) => r.id);
    return [...new Set([...dbIds, ...memIds])].slice(0, 20);
  } catch {
    return memIds.slice(0, 20);
  }
}

export function getRecentlyViewedDrinks(): Drink[] {
  return getRecentlyViewedIds()
    .map((id) => DRINKS_BY_ID.get(id))
    .filter((d): d is Drink => !!d);
}

/** Initialize SQLite up-front (called from root layout). Safe to call repeatedly. */
export function initDb(): void {
  getDB();
  // Log once so dev builds confirm how many recipes are bundled.
  if (__DEV__) {
    console.log(`[MixMate] loaded ${ALL_DRINKS.length} drinks from bundled recipes.json`);
  }
}
