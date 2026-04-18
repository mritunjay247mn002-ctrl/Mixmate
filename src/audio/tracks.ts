/**
 * Offline music track registry (small bundled clips — see scripts/audio/make-music-clips.mjs).
 *
 * Metro needs literal `require()` paths. Each file is a ~40s AAC-LC `.m4a` clip under
 * `assets/Drinkmusic/clips/` to keep the app binary small.
 */
export interface Track {
  id: string;
  title: string;
  artist?: string;
  source: number;
}

type Raw = { id: string; title: string; artist?: string; source: number };

const RAW: Raw[] = [
  {
    id: 'amaksi-lounge-bar',
    title: 'Lounge Bar',
    artist: 'Amaksi',
    source: require('../../assets/Drinkmusic/clips/lounge.m4a'),
  },
  {
    id: 'jazz-bar-whiskey',
    title: 'Whiskey Jazz Bar',
    artist: 'Background Music for Videos',
    source: require('../../assets/Drinkmusic/clips/whiskey-jazz.m4a'),
  },
  {
    id: 'cocktail-bar',
    title: 'Cocktail Bar',
    artist: 'Bransboynd',
    source: require('../../assets/Drinkmusic/clips/cocktail.m4a'),
  },
  {
    id: 'slow-hotel-lounge',
    title: 'Slow Hotel Lounge Jazz',
    artist: 'Moonpub',
    source: require('../../assets/Drinkmusic/clips/hotel-lounge.m4a'),
  },
  {
    id: 'chillhop-lofi',
    title: 'Sad Calm Chillhop Lofi',
    artist: 'Soul Prod Music',
    source: require('../../assets/Drinkmusic/clips/chillhop.m4a'),
  },
];

export const TRACKS: Track[] = RAW.map((t) => ({ ...t }));

export function trackById(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}
