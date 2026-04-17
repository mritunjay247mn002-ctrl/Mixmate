import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { FS, SP, RAD } from '../utils/theme';
import { Drink, FilterType, MoodKey } from '../utils/types';
import { useDrinks } from '../hooks/useDrinks';
import { useFavorites } from '../hooks/useFavorites';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useShake } from '../hooks/useShake';
import NeonBackground from '../components/NeonBackground';
import MiniSearch from '../components/MiniSearch';
import MoodBar from '../components/MoodBar';
import DrinkDeck from '../components/DrinkDeck';
import ActionDock from '../components/ActionDock';
import PartyMode from '../components/PartyMode';

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState<MoodKey>('all');
  const [filter] = useState<FilterType>('all');
  const [partyOpen, setPartyOpen] = useState(false);
  const [surpriseDrink, setSurpriseDrink] = useState<Drink | null>(null);

  const { filtered, featured, trending } = useDrinks(query, filter, mood);
  const { favorites, toggleFavorite } = useFavorites();
  const { addRecent } = useRecentlyViewed();

  const hour = new Date().getHours();
  const greeting =
    hour < 6 ? 'Still up?' :
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    hour < 22 ? 'Good evening' : 'Nightcap?';

  const onOpen = useCallback(
    (d: Drink) => {
      addRecent(d.id);
      router.push({ pathname: '/screens/DetailScreen', params: { id: d.id } });
    },
    [router, addRecent]
  );

  // Build the deck pool: search/mood match → filtered; otherwise all featured+trending
  const deck = useMemo<Drink[]>(() => {
    if (query.trim().length > 0 || mood !== 'all') return filtered;
    // weave featured + trending + the rest for variety
    const seen = new Set<string>();
    const out: Drink[] = [];
    [...featured, ...trending, ...filtered].forEach((d) => {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        out.push(d);
      }
    });
    return out;
  }, [filtered, featured, trending, query, mood]);

  // Shake-to-generate
  const shakeFlash = useSharedValue(0);
  const surpriseMe = useCallback(() => {
    const pool = deck.length > 0 ? deck : filtered;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSurpriseDrink(pick);
    shakeFlash.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(0, { duration: 600 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
  }, [deck, filtered, shakeFlash]);

  useShake(surpriseMe);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: shakeFlash.value * 0.6,
  }));

  const isFav = useCallback((id: string) => favorites.has(id), [favorites]);

  return (
    <View style={styles.root}>
      <NeonBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle="light-content" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>{greeting.toUpperCase()}</Text>
              <Text style={styles.title}>What shall we mix?</Text>
            </View>
            <View style={styles.nightBadge}>
              <Text style={{ fontSize: 22 }}>🌙</Text>
            </View>
          </View>

          <MiniSearch value={query} onChangeText={setQuery} />
          <MoodBar active={mood} onChange={setMood} />

          {surpriseDrink ? (
            <SurpriseBanner
              drink={surpriseDrink}
              onOpen={() => {
                onOpen(surpriseDrink);
                setSurpriseDrink(null);
              }}
              onDismiss={() => setSurpriseDrink(null)}
            />
          ) : null}

          <ActionDock
            actions={[
              {
                key: 'shake',
                icon: 'shuffle',
                label: 'Shake Me',
                gradient: ['#FF2E93', '#FF7A00'],
                onPress: surpriseMe,
                pulse: true,
              },
              {
                key: 'party',
                icon: 'sparkles',
                label: 'Party',
                gradient: ['#B026FF', '#00E5FF'],
                onPress: () => setPartyOpen(true),
              },
              {
                key: 'bar',
                icon: 'flask',
                label: 'My Bar',
                gradient: ['#3CF5B0', '#00E5FF'],
                onPress: () => router.push('/(tabs)/ingredients'),
              },
              {
                key: 'saved',
                icon: 'heart',
                label: 'Saved',
                gradient: ['#FF4D6D', '#FF2E93'],
                onPress: () => router.push('/(tabs)/favorites'),
              },
            ]}
          />

          {/* Deck */}
          <View style={styles.deckSection}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionEmoji}>🃏</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  {mood === 'all' ? 'Tonight\'s Deck' : `${capitalize(mood)} Deck`}
                </Text>
                <Text style={styles.sectionSub}>
                  {deck.length} drink{deck.length === 1 ? '' : 's'} · swipe, tap, hold
                </Text>
              </View>
            </View>
            <DrinkDeck
              drinks={deck}
              onOpen={onOpen}
              isFavorite={isFav}
              toggleFavorite={toggleFavorite}
            />
          </View>

          {/* Trending ribbon */}
          {mood === 'all' && query.length === 0 && trending.length > 0 ? (
            <TrendingRibbon
              drinks={trending}
              onPress={onOpen}
              isFav={isFav}
              toggleFav={toggleFavorite}
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {/* Shake flash */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, flashStyle, { backgroundColor: '#FF2E93' }]}
      />

      <PartyMode
        visible={partyOpen}
        onClose={() => setPartyOpen(false)}
        onPickDrink={onOpen}
        drinks={[...featured, ...trending, ...filtered]}
      />
    </View>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SurpriseBanner({
  drink,
  onOpen,
  onDismiss,
}: {
  drink: Drink;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const scale = useSharedValue(0.9);
  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 14 });
  }, [scale, drink.id]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.surprise, style]}>
      <View style={styles.surpriseEmojiWrap}>
        <Text style={styles.surpriseEmoji}>{drink.image}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.surpriseKicker}>SHAKEN PICK</Text>
        <Text style={styles.surpriseName} numberOfLines={1}>
          {drink.name}
        </Text>
        <Text style={styles.surpriseSub} numberOfLines={1}>
          {drink.category} · {drink.prepTime ?? 5} min
        </Text>
      </View>
      <Pressable onPress={onOpen} style={styles.surpriseGo}>
        <Ionicons name="arrow-forward" size={18} color="#07020F" />
      </Pressable>
      <Pressable onPress={onDismiss} hitSlop={12} style={styles.surpriseX}>
        <Ionicons name="close" size={14} color="rgba(255,255,255,0.6)" />
      </Pressable>
    </Animated.View>
  );
}

function TrendingRibbon({
  drinks,
  onPress,
  isFav,
  toggleFav,
}: {
  drinks: Drink[];
  onPress: (d: Drink) => void;
  isFav: (id: string) => boolean;
  toggleFav: (id: string) => void;
}) {
  return (
    <View style={{ marginTop: SP.lg }}>
      <View style={[styles.sectionHead, { marginBottom: 0 }]}>
        <Text style={styles.sectionEmoji}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Trending Right Now</Text>
          <Text style={styles.sectionSub}>Hot at the bar tonight</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SP.md, gap: 10, paddingVertical: SP.sm }}
      >
        {drinks.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => onPress(d)}
            onLongPress={() => toggleFav(d.id)}
            style={styles.ribbonCard}
          >
            <Text style={styles.ribbonEmoji}>{d.image}</Text>
            <Text style={styles.ribbonName} numberOfLines={1}>{d.name}</Text>
            <View style={styles.ribbonMeta}>
              <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.7)" />
              <Text style={styles.ribbonMetaTxt}>{d.prepTime ?? 5}m</Text>
              {isFav(d.id) ? (
                <Ionicons name="heart" size={11} color="#FF4D6D" />
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07020F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.md,
    paddingTop: SP.sm,
    paddingBottom: SP.md,
  },
  kicker: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  title: {
    color: 'white',
    fontSize: FS.display,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 2,
  },
  nightBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  deckSection: { marginTop: SP.md },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    paddingHorizontal: SP.md,
    marginTop: SP.md,
    marginBottom: SP.sm,
  },
  sectionEmoji: { fontSize: 22 },
  sectionTitle: {
    color: 'white',
    fontSize: FS.lg,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FS.xs,
    marginTop: 2,
  },
  surprise: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SP.md,
    marginTop: SP.sm,
    padding: 10,
    borderRadius: RAD.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,46,147,0.5)',
    backgroundColor: 'rgba(255,46,147,0.12)',
  },
  surpriseEmojiWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  surpriseEmoji: { fontSize: 24 },
  surpriseKicker: {
    color: '#FF2E93',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  surpriseName: { color: 'white', fontSize: FS.md, fontWeight: '800' },
  surpriseSub: { color: 'rgba(255,255,255,0.6)', fontSize: FS.xs },
  surpriseGo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  surpriseX: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  ribbonCard: {
    width: 130,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RAD.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 6,
  },
  ribbonEmoji: { fontSize: 32 },
  ribbonName: { color: 'white', fontSize: FS.sm, fontWeight: '700' },
  ribbonMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ribbonMetaTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FS.xs,
    fontWeight: '700',
  },
});
