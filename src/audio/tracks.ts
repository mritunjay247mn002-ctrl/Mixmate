/**
 * Offline music track registry.
 *
 * Metro needs literal `require()` paths so every track has to be listed here.
 * Adding a new track: drop `<name>.mp3` into `assets/Drinkmusic/` and append
 * another entry below. The display title is what shows in the mini-player.
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
    source: require('../../assets/Drinkmusic/amaksi-lounge-bar-233471.mp3'),
  },
  {
    id: 'jazz-bar-whiskey',
    title: 'Whiskey Jazz Bar',
    artist: 'Background Music for Videos',
    source: require('../../assets/Drinkmusic/backgroundmusicforvideos-jazz-bar-music-restaurant-whiskey-coctail-background-intro-theme-284460.mp3'),
  },
  {
    id: 'american-acoustic-blues',
    title: 'American Acoustic Blues',
    artist: 'BFC Music',
    source: require('../../assets/Drinkmusic/bfcmusic-american-acoustic-blues-252330.mp3'),
  },
  {
    id: 'cocktail-bar',
    title: 'Cocktail Bar',
    artist: 'Bransboynd',
    source: require('../../assets/Drinkmusic/bransboynd-cocktail-bar-421413.mp3'),
  },
  {
    id: 'future-lounge',
    title: 'Future Lounge',
    artist: 'Bransboynd',
    source: require('../../assets/Drinkmusic/bransboynd-future-lounge-399973.mp3'),
  },
  {
    id: 'groovy-vibe',
    title: 'Groovy Vibe',
    artist: 'Bransboynd',
    source: require('../../assets/Drinkmusic/bransboynd-groovy-vibe-427121.mp3'),
  },
  {
    id: 'bar-noir',
    title: 'Bar Noir',
    artist: 'Danwc',
    source: require('../../assets/Drinkmusic/danwc-bar-noir-415819.mp3'),
  },
  {
    id: 'cozy-morning-jazz',
    title: 'Easy Cozy Morning Jazz',
    artist: 'Denis Pavlov',
    source: require('../../assets/Drinkmusic/denis-pavlov-music-easy-cozy-morning-jazz-coffee-podcast-192585.mp3'),
  },
  {
    id: 'restaurant-wine-bar',
    title: 'Restaurant Wine Bar',
    artist: 'Hitslab',
    source: require('../../assets/Drinkmusic/hitslab-restaurant-wine-bar-whiskey-restaurant-music-269848.mp3'),
  },
  {
    id: 'chill-sky-bar',
    title: 'Chill Sky Bar',
    artist: 'Jazz Bossanova BGM',
    source: require('../../assets/Drinkmusic/jazz_bossanova_bgm-chill-sky-bar-nhac-jazz-thu-gian-222698.mp3'),
  },
  {
    id: 'piano-bar-plage',
    title: 'Le Piano Bar de la Plage',
    artist: 'Jean-Paul V',
    source: require('../../assets/Drinkmusic/jean-paul-v-le-piano-bar-de-la-plage-276504.mp3'),
  },
  {
    id: 'restaurant-groove',
    title: 'Restaurant Groove',
    artist: 'Joy in Sound',
    source: require('../../assets/Drinkmusic/joyinsound-restaurant-groove-403393.mp3'),
  },
  {
    id: 'chicago-shuffle-blues',
    title: 'Chicago Shuffle Blues',
    artist: 'Juliush',
    source: require('../../assets/Drinkmusic/juliush-chicago-shuffle-blues-3912.mp3'),
  },
  {
    id: 'cool-jazz-loops',
    title: 'Cool Jazz Loops',
    artist: 'Juliush',
    source: require('../../assets/Drinkmusic/juliush-cool-jazz-loops-2641.mp3'),
  },
  {
    id: 'cool-piano-jazz',
    title: 'Cool Piano Jazz',
    artist: 'Juliush',
    source: require('../../assets/Drinkmusic/juliush-cool-piano-jazz-2642.mp3'),
  },
  {
    id: 'slow-piano-blues',
    title: 'Simple Slow Piano Blues',
    artist: 'Juliush',
    source: require('../../assets/Drinkmusic/juliush-piano-bar-simple-and-slow-piano-blues-3441.mp3'),
  },
  {
    id: 'slow-piano-blues-ii',
    title: 'Simple Slow Piano Blues II',
    artist: 'Juliush',
    source: require('../../assets/Drinkmusic/juliush-piano-bar-simple-and-slow-piano-blues-3441 (1).mp3'),
  },
  {
    id: 'honky-tonk-piano',
    title: "Rockin' Upright Honky-Tonk",
    artist: 'Juliush',
    source: require('../../assets/Drinkmusic/juliush-rockin39-the-upright-honky-tonk-piano-blues-rock-1725.mp3'),
  },
  {
    id: 'whiskey-restaurant',
    title: 'Whiskey Restaurant Music',
    artist: 'Krasnoshchok',
    source: require('../../assets/Drinkmusic/krasnoshchok-restaurant-wine-bar-whiskey-restaurant-music-407557.mp3'),
  },
  {
    id: 'boston-piano-bar',
    title: 'Boston Piano Bar',
    artist: 'Land of Books',
    source: require('../../assets/Drinkmusic/land_of_books_youtube-boston-piano-bar-231669.mp3'),
  },
  {
    id: 'bar-bg-001',
    title: 'Bar Background I',
    artist: 'Lilex',
    source: require('../../assets/Drinkmusic/lilex-bar-background-001-291671.mp3'),
  },
  {
    id: 'bar-bg-002',
    title: 'Bar Background II',
    artist: 'Lilex',
    source: require('../../assets/Drinkmusic/lilex-bar-background-002-291672.mp3'),
  },
  {
    id: 'bar-bg-002-alt',
    title: 'Bar Background II (Alt)',
    artist: 'Lilex',
    source: require('../../assets/Drinkmusic/lilex-bar-background-002-291672 (1).mp3'),
  },
  {
    id: 'bar-bg-005',
    title: 'Bar Background V',
    artist: 'Lilex',
    source: require('../../assets/Drinkmusic/lilex-bar-background-005-291675.mp3'),
  },
  {
    id: 'bar-bg-008',
    title: 'Bar Background VIII',
    artist: 'Lilex',
    source: require('../../assets/Drinkmusic/lilex-bar-background-008-291819.mp3'),
  },
  {
    id: 'bar-blues',
    title: 'Bar Blues',
    artist: 'Lite Saturation',
    source: require('../../assets/Drinkmusic/litesaturation-bar-blues-317757.mp3'),
  },
  {
    id: 'bar-night-sorrows',
    title: 'Bar Night Sorrows',
    artist: 'Local Beatz',
    source: require('../../assets/Drinkmusic/local_beatz-bar-night-sorrows-439530.mp3'),
  },
  {
    id: 'slow-hotel-lounge',
    title: 'Slow Hotel Lounge Jazz',
    artist: 'Moonpub',
    source: require('../../assets/Drinkmusic/moonpub-slow-hotel-lounge-jazz-music-506551.mp3'),
  },
  {
    id: 'blues-bar-instrumental',
    title: 'Blues Bar Instrumental',
    artist: 'Nickpanekaiassets',
    source: require('../../assets/Drinkmusic/nickpanekaiassets-blues-bar-instrumental-smooth-amp-soulful-309994.mp3'),
  },
  {
    id: 'midnight-cocktail-lounge',
    title: 'Midnight Cocktail Lounge',
    artist: 'Niknet Art',
    source: require('../../assets/Drinkmusic/niknet_art-midnight-cocktail-lounge-sax-amp-piano-jazz-342590.mp3'),
  },
  {
    id: 'chillhop-lofi',
    title: 'Sad Calm Chillhop Lofi',
    artist: 'Soul Prod Music',
    source: require('../../assets/Drinkmusic/soulprodmusic-bar-sad-calm-chillhop-lofi-background-music-122128.mp3'),
  },
  {
    id: 'whiskey-blues-bar',
    title: 'Whiskey Blues Bar',
    artist: 'Sound Garage',
    source: require('../../assets/Drinkmusic/sound_garage-whiskey-blues-bar-394416.mp3'),
  },
];

export const TRACKS: Track[] = RAW.map((t) => ({ ...t }));

export function trackById(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}
