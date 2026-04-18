import {
  getMixologistTitlePreference,
  setMixologistTitlePreference,
} from '../storage/db';

/** Curated for Golden Mixology — luxury + professional, shuffled at runtime when unset. */
export const MIXOLOGIST_TITLE_OPTIONS = [
  'Master Mixologist',
  'Chief Mixologist',
  'Bar Maestro',
  'Beverage Curator',
  'Cocktail Connoisseur',
  'Mixology Artisan',
  'Head of Mixology',
  'The House Mixologist',
  'Bartender',
  'Senior Bartender',
  'Lead Bartender',
  'Mixologist',
  'Beverage Specialist',
  'Bar Professional',
] as const;

const POOL = [...MIXOLOGIST_TITLE_OPTIONS];

let sessionPick: string | null = null;

export function pickRandomMixologistTitle(): string {
  return POOL[Math.floor(Math.random() * POOL.length)]!;
}

/** Clears the “one title this session” cache so the next read picks anew. */
export function resetMixologistSessionTitle(): void {
  sessionPick = null;
}

/** User-chosen title from storage, or a single random pick per app session. */
export function getMixologistDisplayTitle(): string {
  const pref = getMixologistTitlePreference();
  if (pref) return pref;
  if (!sessionPick) sessionPick = pickRandomMixologistTitle();
  return sessionPick;
}

export function setLockedMixologistTitle(title: string): void {
  const t = title.trim();
  if (!t) return;
  setMixologistTitlePreference(t);
  sessionPick = null;
}

/** Surprise mode: no saved title; next session read gets a fresh random. */
export function clearMixologistTitlePreference(): void {
  setMixologistTitlePreference(null);
  resetMixologistSessionTitle();
}

export function isMixologistTitleLocked(): boolean {
  return !!getMixologistTitlePreference();
}

/** New random title for this app session (still respects a saved lock if any). */
export function pickNewSessionMixologistTitle(): string {
  resetMixologistSessionTitle();
  return getMixologistDisplayTitle();
}
