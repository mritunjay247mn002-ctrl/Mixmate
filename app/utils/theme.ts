export const Colors = {
  dark: {
    bg: '#07020F',
    bgDeep: '#04010A',
    bgCard: 'rgba(255,255,255,0.06)',
    bgCardAlt: 'rgba(255,255,255,0.04)',
    glass: 'rgba(255,255,255,0.08)',
    glassStrong: 'rgba(255,255,255,0.14)',
    primary: '#B026FF',
    accent: '#FF2E93',
    neon: '#00E5FF',
    neonAlt: '#FF7A00',
    text: '#F5F0FF',
    textMuted: '#A99AD6',
    textFaint: '#655680',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.22)',
    gold: '#FFD166',
    green: '#3CF5B0',
    red: '#FF4D6D',
  },
  light: {
    bg: '#07020F',
    bgDeep: '#04010A',
    bgCard: 'rgba(255,255,255,0.06)',
    bgCardAlt: 'rgba(255,255,255,0.04)',
    glass: 'rgba(255,255,255,0.08)',
    glassStrong: 'rgba(255,255,255,0.14)',
    primary: '#B026FF',
    accent: '#FF2E93',
    neon: '#00E5FF',
    neonAlt: '#FF7A00',
    text: '#F5F0FF',
    textMuted: '#A99AD6',
    textFaint: '#655680',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.22)',
    gold: '#FFD166',
    green: '#3CF5B0',
    red: '#FF4D6D',
  },
};

// Each category gets a signature neon gradient
export const CAT_GRADIENTS: Record<string, [string, string, string]> = {
  Refreshing:    ['#00E5FF', '#1E88FF', '#6A00FF'],
  Fruity:        ['#FF2E93', '#FF5E7E', '#FF9A44'],
  Classic:       ['#7A00FF', '#B026FF', '#FF2E93'],
  Sparkling:     ['#3CF5B0', '#00E5FF', '#7A00FF'],
  Tropical:      ['#FFD166', '#FF7A00', '#FF2E93'],
  'After-Dinner':['#4A1A7A', '#7A00FF', '#FF2E93'],
  Sour:          ['#D9F200', '#3CF5B0', '#00E5FF'],
  Sweet:         ['#FF5ED0', '#FF2E93', '#B026FF'],
  Floral:        ['#C084FC', '#FF5ED0', '#FF2E93'],
  Creamy:        ['#FF9A44', '#FF2E93', '#7A00FF'],
};

export const DEFAULT_GRAD: [string, string, string] = ['#7A00FF', '#B026FF', '#FF2E93'];

export function gradFor(category?: string): [string, string, string] {
  if (!category) return DEFAULT_GRAD;
  return CAT_GRADIENTS[category] ?? DEFAULT_GRAD;
}

// Moods map category/tag signals -> a vibe
export interface Mood {
  key: string;
  label: string;
  emoji: string;
  gradient: [string, string];
  match: (d: { category: string; tags?: string[]; prepTime?: number; type: string }) => boolean;
}

export const MOODS: Mood[] = [
  {
    key: 'all',
    label: 'All',
    emoji: '✨',
    gradient: ['#B026FF', '#FF2E93'],
    match: () => true,
  },
  {
    key: 'bold',
    label: 'Bold',
    emoji: '🔥',
    gradient: ['#FF2E93', '#FF7A00'],
    match: (d) =>
      d.category === 'Classic' ||
      (d.tags ?? []).some((t) => ['whiskey', 'gin', 'bitter', 'strong'].includes(t)),
  },
  {
    key: 'fresh',
    label: 'Fresh',
    emoji: '🌿',
    gradient: ['#3CF5B0', '#00E5FF'],
    match: (d) =>
      d.category === 'Refreshing' ||
      (d.tags ?? []).some((t) => ['minty', 'citrus', 'refreshing'].includes(t)),
  },
  {
    key: 'sweet',
    label: 'Sweet',
    emoji: '🍓',
    gradient: ['#FF5ED0', '#FF2E93'],
    match: (d) =>
      ['Fruity', 'Sweet', 'Tropical'].includes(d.category) ||
      (d.tags ?? []).some((t) => ['sweet', 'fruity', 'tropical'].includes(t)),
  },
  {
    key: 'party',
    label: 'Party',
    emoji: '🎉',
    gradient: ['#B026FF', '#00E5FF'],
    match: (d) =>
      d.category === 'Sparkling' ||
      (d.tags ?? []).some((t) => ['bubbly', 'party', 'shot'].includes(t)),
  },
  {
    key: 'chill',
    label: 'Chill',
    emoji: '😴',
    gradient: ['#7A00FF', '#4A1A7A'],
    match: (d) =>
      d.category === 'After-Dinner' ||
      d.category === 'Creamy' ||
      (d.tags ?? []).some((t) => ['coffee', 'creamy', 'nightcap'].includes(t)),
  },
  {
    key: 'quick',
    label: 'Quick',
    emoji: '⚡',
    gradient: ['#FFD166', '#FF7A00'],
    match: (d) => typeof d.prepTime === 'number' && d.prepTime <= 3,
  },
  {
    key: 'zero',
    label: 'Zero Proof',
    emoji: '🧃',
    gradient: ['#00E5FF', '#3CF5B0'],
    match: (d) => d.type === 'mocktail',
  },
];

export const SP = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40,
};

export const RAD = {
  sm: 8, md: 14, lg: 22, xl: 32, xxl: 40, full: 999,
};

export const FS = {
  xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 30, display: 40,
};

export const GLASS_BORDER = 'rgba(255,255,255,0.18)';
export const GLASS_SHEEN = 'rgba(255,255,255,0.06)';
