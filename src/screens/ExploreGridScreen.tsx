import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  FlatList,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from '@expo-google-fonts/inter/useFonts';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import * as Haptics from 'expo-haptics';
import { LUX } from '../theme/luxuryDesignSystem';
import { useDrinks } from '../hooks/useDrinks';
import { useFavorites } from '../hooks/useFavorites';
import { addRecentlyViewed } from '../storage/db';
import type { Drink, AlcoholFilter as AlcoholFilterKey } from '../utils/types';
import { AlcoholFilter } from '../components/AlcoholFilter';
import { LuxuryDrinkCard } from '../components/luxury/LuxuryDrinkCard';
import { useAudio } from '../audio/useAudio';

/** Gold-border hero cards — only slugs with bundled WebP so the ring matches real art. */
const SPOTLIGHT_SLUGS = new Set([
  'classic-old-fashioned',
  'classic-negroni',
  'espresso-martini',
  'cosmopolitan',
  'dark-mojito',
  'classic-margarita',
]);

function isSpotlight(d: Drink) {
  return SPOTLIGHT_SLUGS.has(d.slug);
}

export default function ExploreGridScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AlcoholFilterKey>('all');
  const { filtered, all } = useDrinks(query, filter, 'all');
  const { favorites, toggleFavorite } = useFavorites();
  const { playSfx } = useAudio();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const counts = useMemo(
    () => ({
      all: all.length,
      cocktail: all.filter((d) => d.type === 'cocktail').length,
      mocktail: all.filter((d) => d.type === 'mocktail').length,
    }),
    [all]
  );

  const cardWidth = useMemo(() => {
    const pad = LUX.outerPad * 2;
    const gap = LUX.gridGap;
    return (width - pad - gap) / 2;
  }, [width]);

  const onOpen = useCallback(
    (d: Drink) => {
      addRecentlyViewed(d.id);
      playSfx('open');
      router.push({ pathname: '/screens/DetailScreen', params: { id: d.id } });
    },
    [router, playSfx]
  );

  const isFav = useCallback((id: string) => favorites.has(id), [favorites]);

  const renderItem = useCallback(
    ({ item, index }: { item: Drink; index: number }) => (
      <View
        style={{
          width: cardWidth,
          marginRight: index % 2 === 0 ? LUX.gridGap : 0,
          marginBottom: LUX.gridGap,
        }}
      >
        <LuxuryDrinkCard
          drink={item}
          width={cardWidth}
          featured={isSpotlight(item)}
          onPress={() => onOpen(item)}
          onToggleFavorite={() => toggleFavorite(item.id)}
          isFavorite={isFav(item.id)}
        />
      </View>
    ),
    [cardWidth, onOpen, toggleFavorite, isFav]
  );

  if (!fontsLoaded) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={LUX.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[LUX.voidDeep, LUX.void, '#101018', LUX.voidDeep]}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>GOLDEN MIXOLOGY</Text>
              <Text style={styles.heroTitle}>500+ Drink Recipes</Text>
              <Text style={styles.sub}>Discover premium mixology</Text>
            </View>
            <View style={styles.iconRow}>
              <Pressable
                hitSlop={10}
                style={styles.iconBtn}
                onPress={() => router.push('/(tabs)/ingredients')}
              >
                <Ionicons name="options-outline" size={22} color={LUX.gold} />
              </Pressable>
              <Pressable
                hitSlop={10}
                style={styles.iconBtn}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Ionicons name="person-circle-outline" size={24} color={LUX.gold} />
              </Pressable>
            </View>
          </View>

          <View style={styles.searchShell}>
            <Ionicons name="search" size={18} color={LUX.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search cocktails & mocktails…"
              placeholderTextColor={LUX.textDim}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={LUX.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <AlcoholFilter value={filter} onChange={setFilter} counts={counts} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          numColumns={2}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: LUX.outerPad,
            paddingTop: 8,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={16}
          windowSize={7}
          removeClippedSubviews
          ListHeaderComponent={
            <Text style={styles.countLbl}>
              {filtered.length} recipe{filtered.length === 1 ? '' : 's'}
            </Text>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LUX.void,
  },
  safe: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: LUX.outerPad,
    paddingBottom: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  kicker: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 2.2,
    color: LUX.goldMuted,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: LUX.gold,
    textShadowColor: LUX.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: LUX.textMuted,
    marginTop: 6,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,175,55,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LUX.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: LUX.text,
    paddingVertical: 0,
  },
  countLbl: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: LUX.textMuted,
    marginBottom: 10,
    marginTop: 4,
  },
});
