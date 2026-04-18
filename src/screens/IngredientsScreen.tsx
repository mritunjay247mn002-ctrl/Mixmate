import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// NOTE: Reanimated 4.1.x entering/layout animations crash on Android + Fabric
// ("String translate must be a percentage"). Props disabled until the dev
// client is rebuilt with a fixed Reanimated.

import { FS, SP, RAD } from '../utils/theme';
import { getAllIngredientNames } from '../hooks/useDrinks';
import { useIngredientMatcher } from '../hooks/useIngredientMatcher';
import { addRecentlyViewed } from '../storage/db';
import { IngredientMatch } from '../utils/types';
import NeonBackground from '../components/NeonBackground';
import IngredientChip from '../components/IngredientChip';
import MatchDrinkCard from '../components/MatchDrinkCard';
import MatchRing from '../components/MatchRing';

const ALL_ING = getAllIngredientNames();

// Smart groupings so the picker isn't one giant dump
const GROUPS: { key: string; label: string; emoji: string; match: (i: string) => boolean }[] = [
  {
    key: 'spirits',
    label: 'Spirits',
    emoji: '🥃',
    match: (i) =>
      /rum|vodka|whiskey|bourbon|gin|tequila|mezcal|brandy|cognac|sake|soju/i.test(i),
  },
  {
    key: 'liqueur',
    label: 'Liqueurs & Wines',
    emoji: '🍾',
    match: (i) =>
      /liqueur|vermouth|aperol|campari|amaretto|baileys|kahlua|chartreuse|cordial|triple sec|absinthe|prosecco|champagne|wine|sherry|port|sake|soju/i.test(
        i
      ),
  },
  {
    key: 'citrus',
    label: 'Citrus & Juice',
    emoji: '🍋',
    match: (i) => /juice|lime|lemon|orange|grapefruit|cranberry|tomato/i.test(i),
  },
  {
    key: 'fruit',
    label: 'Fresh Fruit',
    emoji: '🍓',
    match: (i) =>
      /strawberry|mango|pineapple|peach|watermelon|berry|kiwi|apple|pear|melon|pomegranate/i.test(
        i
      ),
  },
  {
    key: 'herbs',
    label: 'Herbs & Spice',
    emoji: '🌿',
    match: (i) =>
      /mint|basil|rosemary|thyme|cinnamon|cardamom|ginger|pepper|clove|nutmeg|vanilla|salt|bitters/i.test(
        i
      ),
  },
  {
    key: 'mixers',
    label: 'Mixers',
    emoji: '🫧',
    match: (i) =>
      /soda|tonic|ginger beer|ginger ale|cola|water|milk|cream|coconut|yogurt|syrup|grenadine|honey|sugar|espresso|coffee|tea/i.test(
        i
      ),
  },
];

function groupFor(ing: string): string {
  for (const g of GROUPS) if (g.match(ing)) return g.key;
  return 'other';
}

export default function IngredientsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('spirits');

  const { ready, almost, far } = useIngredientMatcher(selected);

  // Overall progress across all drinks — how close the bar is
  const bestMatch = useMemo<IngredientMatch | null>(() => {
    if (selected.length === 0) return null;
    if (ready.length > 0) return ready[0];
    if (almost.length > 0) return almost[0];
    if (far.length > 0) return far[0];
    return null;
  }, [ready, almost, far, selected]);

  const ingredientsByGroup = useMemo(() => {
    const out: Record<string, string[]> = {};
    ALL_ING.forEach((ing) => {
      const g = groupFor(ing);
      (out[g] = out[g] || []).push(ing);
    });
    // Add "other" tab if any
    if (out['other']?.length && !GROUPS.find((g) => g.key === 'other')) {
      GROUPS.push({ key: 'other', label: 'More', emoji: '🧂', match: () => false });
    }
    return out;
  }, []);

  const visibleIngs = useMemo(() => {
    const list = search.trim()
      ? ALL_ING.filter((i) => i.toLowerCase().includes(search.toLowerCase()))
      : (ingredientsByGroup[activeGroup] || []);
    return list.sort((a, b) => a.localeCompare(b));
  }, [search, activeGroup, ingredientsByGroup]);

  const toggle = useCallback((ing: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelected((p) => (p.includes(ing) ? p.filter((x) => x !== ing) : [...p, ing]));
  }, []);

  const onMatchPress = useCallback(
    (m: IngredientMatch) => {
      addRecentlyViewed(m.drink.id);
      router.push({ pathname: '/screens/DetailScreen', params: { id: m.drink.id } });
    },
    [router]
  );

  return (
    <View style={styles.root}>
      <NeonBackground
        colors={
          selected.length === 0
            ? ['#7A00FF', '#FF2E93', '#00E5FF']
            : ready.length > 0
              ? ['#3CF5B0', '#00E5FF', '#7A00FF']
              : ['#FF7A00', '#FF2E93', '#B026FF']
        }
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle="light-content" />

        {/* Hero / progress */}
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>MIXMATE · YOUR BAR</Text>
            <Text style={styles.title}>
              {selected.length === 0
                ? 'Stock your bar'
                : ready.length > 0
                  ? `${ready.length} drink${ready.length === 1 ? '' : 's'} ready`
                  : almost.length > 0
                    ? `${almost.length} almost ready`
                    : 'Add more to unlock'}
            </Text>
            <Text style={styles.heroSub}>
              {selected.length === 0
                ? 'Tap what you have, MixMate does the math'
                : `${selected.length} ingredient${selected.length === 1 ? '' : 's'} picked`}
            </Text>
          </View>
          <MatchRing
            progress={
              selected.length === 0
                ? 0
                : bestMatch?.matchScore ?? 0
            }
            colors={
              ready.length > 0
                ? ['#3CF5B0', '#00E5FF']
                : ['#FFD166', '#FF7A00']
            }
            label="BEST"
            pulse={ready.length > 0}
            size={94}
          />
        </View>

        {/* Selected chip strip */}
        {selected.length > 0 ? (
          <Animated.View>
            <View style={styles.selRow}>
              <Text style={styles.selLbl}>YOUR BAR · {selected.length}</Text>
              <Pressable onPress={() => setSelected([])}>
                <Text style={styles.clear}>Clear all</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedStrip}
            >
              {selected.map((ing) => (
                <IngredientChip
                  key={ing}
                  label={ing}
                  selected
                  onPress={() => toggle(ing)}
                />
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {/* Search + group tabs */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.55)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search ingredients…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.searchInput}
            autoCorrect={false}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.55)" />
            </Pressable>
          ) : null}
        </View>

        {search.length === 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupRow}
          >
            {GROUPS.map((g) => {
              const on = g.key === activeGroup;
              const count = (ingredientsByGroup[g.key] || []).length;
              const selInGroup = selected.filter((i) => groupFor(i) === g.key).length;
              return (
                <Pressable
                  key={g.key}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setActiveGroup(g.key);
                  }}
                  style={[
                    styles.groupPill,
                    on && styles.groupPillActive,
                  ]}
                >
                  <Text style={styles.groupEmoji}>{g.emoji}</Text>
                  <Text
                    style={[
                      styles.groupLbl,
                      { color: on ? '#fff' : 'rgba(255,255,255,0.7)' },
                    ]}
                  >
                    {g.label}
                  </Text>
                  {selInGroup > 0 ? (
                    <View style={styles.groupCount}>
                      <Text style={styles.groupCountTxt}>{selInGroup}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.groupTotal}>/{count}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Main body */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ingredient grid */}
          <View style={styles.grid}>
            {visibleIngs.map((ing) => (
              <IngredientChip
                key={ing}
                label={ing}
                selected={selected.includes(ing)}
                onPress={() => toggle(ing)}
              />
            ))}
          </View>

          {/* Results */}
          {selected.length > 0 ? (
            <View style={{ marginTop: SP.lg }}>
              {ready.length > 0 ? (
                <ResultSection
                  emoji="✅"
                  title={`You can make ${ready.length} drink${ready.length === 1 ? '' : 's'} now`}
                  sub="All ingredients in your bar"
                  tone="ready"
                >
                  {ready.map((m) => (
                    <MatchDrinkCard key={m.drink.id} match={m} onPress={onMatchPress} />
                  ))}
                </ResultSection>
              ) : null}

              {almost.length > 0 ? (
                <ResultSection
                  emoji="⚡"
                  title={`Almost ready · ${almost.length}`}
                  sub="Missing 1–2 ingredients"
                  tone="almost"
                >
                  {almost.slice(0, 8).map((m) => (
                    <MatchDrinkCard key={m.drink.id} match={m} onPress={onMatchPress} />
                  ))}
                </ResultSection>
              ) : null}

              {ready.length === 0 && almost.length === 0 && far.length > 0 ? (
                <ResultSection
                  emoji="🌱"
                  title="Getting closer…"
                  sub="Add a few more to unlock these"
                  tone="far"
                >
                  {far.slice(0, 4).map((m) => (
                    <MatchDrinkCard key={m.drink.id} match={m} onPress={onMatchPress} />
                  ))}
                </ResultSection>
              ) : null}
            </View>
          ) : (
            <EmptyHint />
          )}
        </ScrollView>

        {/* Floating CTA */}
        {selected.length > 0 && (ready.length + almost.length) > 0 ? (
          <StickyCTA
            ready={ready.length}
            almost={almost.length}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function ResultSection({
  emoji,
  title,
  sub,
  tone,
  children,
}: {
  emoji: string;
  title: string;
  sub: string;
  tone: 'ready' | 'almost' | 'far';
  children: React.ReactNode;
}) {
  const ac =
    tone === 'ready' ? '#3CF5B0' : tone === 'almost' ? '#FFD166' : '#A99AD6';
  return (
    <View style={{ marginTop: SP.sm }}>
      <View style={styles.secHead}>
        <Text style={styles.secEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.secTitle, { color: ac }]}>{title}</Text>
          <Text style={styles.secSub}>{sub}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function EmptyHint() {
  return (
    <View style={styles.emptyHint}>
      <Text style={{ fontSize: 52 }}>🍾</Text>
      <Text style={styles.emptyTitle}>Tell MixMate what's on your shelf</Text>
      <Text style={styles.emptySub}>
        We'll show which drinks you can make right now — and which you're just a splash away from.
      </Text>
      <View style={styles.hintChips}>
        {['white rum', 'fresh lime juice', 'fresh mint', 'vodka'].map((h) => (
          <View key={h} style={styles.hintChip}>
            <Text style={styles.hintChipTxt}>{h}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StickyCTA({ ready, almost }: { ready: number; almost: number }) {
  const scale = useSharedValue(0.9);
  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 14 });
  }, [ready, almost, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.stickyWrap, style]} pointerEvents="none">
      <LinearGradient
        colors={['transparent', 'rgba(7,2,15,0.95)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.stickyInner} pointerEvents="auto">
        <LinearGradient
          colors={ready > 0 ? ['#3CF5B0', '#00E5FF'] : ['#FFD166', '#FF7A00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons
          name={ready > 0 ? 'checkmark-done-circle' : 'flash'}
          size={22}
          color="#07020F"
        />
        <Text style={styles.stickyTxt}>
          {ready > 0
            ? `${ready} ready · ${almost} almost`
            : `${almost} almost · keep stocking`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07020F' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
    paddingHorizontal: SP.md,
    paddingTop: SP.sm,
    paddingBottom: SP.md,
  },
  kicker: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  title: {
    color: 'white',
    fontSize: FS.xxl,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FS.sm,
    marginTop: 4,
  },
  selRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SP.md,
    marginTop: SP.sm,
  },
  selLbl: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  clear: {
    color: '#FF2E93',
    fontSize: FS.sm,
    fontWeight: '800',
  },
  selectedStrip: {
    gap: 8,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SP.md,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm + 2,
    borderRadius: RAD.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: SP.xs,
  },
  searchInput: { flex: 1, color: 'white', fontSize: FS.md, padding: 0 },
  groupRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
  },
  groupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RAD.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  groupPillActive: {
    backgroundColor: 'rgba(176,38,255,0.25)',
    borderColor: '#B026FF',
  },
  groupEmoji: { fontSize: 13 },
  groupLbl: { fontSize: FS.sm, fontWeight: '700' },
  groupCount: {
    backgroundColor: '#3CF5B0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RAD.full,
    marginLeft: 2,
  },
  groupCountTxt: {
    color: '#07020F',
    fontSize: 10,
    fontWeight: '900',
  },
  groupTotal: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: SP.md,
    paddingTop: SP.sm,
  },
  secHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SP.md,
    marginTop: SP.md,
    marginBottom: SP.sm,
  },
  secEmoji: { fontSize: 22 },
  secTitle: { fontSize: FS.lg, fontWeight: '900', letterSpacing: -0.3 },
  secSub: { color: 'rgba(255,255,255,0.55)', fontSize: FS.xs, marginTop: 2 },
  emptyHint: {
    alignItems: 'center',
    paddingHorizontal: SP.lg,
    paddingTop: 40,
    gap: 10,
  },
  emptyTitle: {
    color: 'white',
    fontSize: FS.xl,
    fontWeight: '900',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FS.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  hintChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SP.sm,
    justifyContent: 'center',
  },
  hintChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RAD.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  hintChipTxt: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FS.xs,
    fontWeight: '600',
  },
  stickyWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  stickyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RAD.full,
    overflow: 'hidden',
    shadowColor: '#3CF5B0',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  stickyTxt: {
    color: '#07020F',
    fontSize: FS.sm,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
