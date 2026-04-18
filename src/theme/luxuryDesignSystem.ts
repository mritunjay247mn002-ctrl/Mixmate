/**
 * MixMate — Luxury “Golden Mixology” layer (Explore grid)
 *
 * ## Layout
 * - Screen outer padding: 16
 * - Grid gap: 12
 * - Columns: 2
 * - Card image: square (1:1), `contain` inside padded #121212 tile, 16 radius
 * - Meta: title, stars, tag under the image tile
 * - Card corner radius: 16 (grid)
 *
 * ## Components (this module)
 * - ExploreGridScreen — shell + FlatList
 * - LuxuryExploreHeader — title, subtitle, search, filter, profile affordances
 * - LuxuryDrinkCard — image, caps title, stars, category chip, fav, press scale
 *
 * ## Typography
 * - Display / hero: Playfair Display (700)
 * - UI / body: Inter (400–600)
 *
 * ## Color
 * - void: page background
 * - gold / goldMuted: accents + inactive chrome
 * - card: elevated surface on void
 */

export const LUX = {
  void: '#0B0B0F',
  voidDeep: '#050508',
  card: '#121218',
  cardElevated: '#18181F',
  gold: '#D4AF37',
  goldBright: '#E8C547',
  goldMuted: '#9A7B2C',
  goldGlow: 'rgba(212, 175, 55, 0.45)',
  text: '#F2F0E6',
  textMuted: '#8E8E93',
  textDim: '#5C5C62',
  borderSubtle: 'rgba(255,255,255,0.06)',
  shadowSoft: 'rgba(0,0,0,0.55)',
  outerPad: 16,
  gridGap: 12,
  radiusCard: 18,
  radiusDock: 22,
} as const;

export type LuxToken = typeof LUX;
