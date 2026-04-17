import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

function getDB(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('mixmate.db');
    _db.execSync(
      'CREATE TABLE IF NOT EXISTS favorites (id TEXT PRIMARY KEY NOT NULL);'
    );
    _db.execSync(
      'CREATE TABLE IF NOT EXISTS recently_viewed (id TEXT PRIMARY KEY NOT NULL, viewed_at INTEGER NOT NULL);'
    );
  }
  return _db;
}

export function getFavorites(): string[] {
  try {
    return getDB()
      .getAllSync<{ id: string }>('SELECT id FROM favorites;')
      .map((r) => r.id);
  } catch {
    return [];
  }
}

export function addFavorite(id: string): void {
  try {
    getDB().runSync('INSERT OR IGNORE INTO favorites (id) VALUES (?);', id);
  } catch {}
}

export function removeFavorite(id: string): void {
  try {
    getDB().runSync('DELETE FROM favorites WHERE id = ?;', id);
  } catch {}
}

export function addRecentlyViewed(id: string): void {
  try {
    const db = getDB();
    db.runSync(
      'INSERT OR REPLACE INTO recently_viewed (id, viewed_at) VALUES (?, ?);',
      id,
      Date.now()
    );
    db.runSync(
      'DELETE FROM recently_viewed WHERE id NOT IN (SELECT id FROM recently_viewed ORDER BY viewed_at DESC LIMIT 20);'
    );
  } catch {}
}

export function getRecentlyViewed(): string[] {
  try {
    return getDB()
      .getAllSync<{ id: string }>(
        'SELECT id FROM recently_viewed ORDER BY viewed_at DESC LIMIT 20;'
      )
      .map((r) => r.id);
  } catch {
    return [];
  }
}
