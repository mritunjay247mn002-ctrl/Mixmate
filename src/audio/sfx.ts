/**
 * Short-form cocktail sound effects. These are played on user interactions
 * (opening a recipe, tapping "Mix Now", etc.) on a separate audio channel so
 * the main background music stream is never interrupted.
 *
 * To add a real clip:
 *   1. Drop a short `.mp3` / `.wav` under `assets/Drinkmusic/sfx/`.
 *   2. Register it here: `open: require('../../assets/Drinkmusic/sfx/open.mp3')`.
 *
 * Any key left unregistered is silently no-op'd by `AudioManager.playSfx`, so
 * feature code can call `playSfx('open')` without guarding.
 */
export type SfxKey = 'open' | 'mix' | 'save' | 'unsave' | 'shake' | 'tap';

export const SFX: Partial<Record<SfxKey, number>> = {
  // Placeholder registry — intentionally empty. Wire real clips here as they
  // are added to the project. The audio manager tolerates missing entries.
};

export function resolveSfx(key: SfxKey): number | undefined {
  return SFX[key];
}
