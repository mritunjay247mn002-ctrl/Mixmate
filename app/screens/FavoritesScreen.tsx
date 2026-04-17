import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInUp,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { FS, SP, RAD, gradFor } from '../utils/theme';
import { Drink } from '../utils/types';
import { useFavorites } from '../hooks/useFavorites';
import { getDrinkById } from '../hooks/useDrinks';
import { addRecentlyViewed } from '../storage/db';
import NeonBackground from '../components/NeonBackground';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - SP.md * 2 - 10) / 2;
const CARD_H = CARD_W * 1.35;

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, toggleFavorite, loading } = useFavorites();

  const favDrinks = Array.from(favorites)
    .map((id) => getDrinkById(id))
    .filter((d): d is Drink => d !== undefined);

  const onPress = useCallback(
    (d: Drink) => {
      addRecentlyViewed(d.id);
      router.push({ pathname: '/screens/DetailScreen', params: { id: d.id } });
    },
    [router]
  );

  if (loading) return null;

  return (
    <View style={styles.root}>
      <NeonBackground colors={['#FF4D6D', '#FF2E93', '#B026FF']} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle="light-content" />

        <View style={styles.header}>
          <Text style={styles.kicker}>SAVED TONIGHT</Text>
          <Text style={styles.title}>Your Lineup</Text>
          <Text style={styles.sub}>
            {favDrinks.length === 0
              ? 'Tap a heart to save drinks here'
              : `${favDrinks.length} drink${favDrinks.length === 1 ? '' : 's'} on your tab`}
          </Text>
        </View>

        {favDrinks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 72 }}>💔</Text>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySub}>
              Long-press a card anywhere in the app to favorite it.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/')}
              style={styles.emptyBtn}
            >
              <LinearGradient
                colors={['#FF2E93', '#B026FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.emptyBtnTxt}>Discover drinks</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            {favDrinks.map((d, i) => (
              <Animated.View
                key={d.id}
                entering={FadeInUp.duration(420).delay(i * 50)}
                layout={Layout.springify()}
              >
                <FavCard
                  drink={d}
                  onPress={() => onPress(d)}
                  onUnsave={() => toggleFavorite(d.id)}
                />
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function FavCard({
  drink,
  onPress,
  onUnsave,
}: {
  drink: Drink;
  onPress: () => void;
  onUnsave: () => void;
}) {
  const press = useSharedValue(0);
  const g = gradFor(drink.category);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - press.value * 0.03) }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      onLongPress={() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
          () => {}
        );
        onUnsave();
      }}
      onPressIn={() => (press.value = 1)}
      onPressOut={() => (press.value = 0)}
    >
      <Animated.View style={[styles.card, style]}>
        <LinearGradient
          colors={g}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cardGlow} />
        <Text style={styles.emoji}>{drink.image}</Text>

        <View style={styles.heart}>
          <Ionicons name="heart" size={14} color="#FF4D6D" />
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardCat}>{drink.category.toUpperCase()}</Text>
          <Text numberOfLines={2} style={styles.cardName}>
            {drink.name}
          </Text>
          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={11} color="#fff" />
            <Text style={styles.cardMetaTxt}>{drink.prepTime ?? 5}m</Text>
            <View style={styles.dot} />
            <Ionicons name="flask-outline" size={11} color="#fff" />
            <Text style={styles.cardMetaTxt}>{drink.ingredients.length}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07020F' },
  header: {
    paddingHorizontal: SP.md,
    paddingTop: SP.md,
    paddingBottom: SP.md,
  },
  kicker: {
    color: '#FF2E93',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  title: {
    color: 'white',
    fontSize: FS.display,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 2,
  },
  sub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FS.sm,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SP.md,
    gap: 10,
    paddingBottom: 120,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: RAD.lg,
    overflow: 'hidden',
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  cardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  emoji: {
    position: 'absolute',
    alignSelf: 'center',
    top: CARD_H * 0.2,
    fontSize: 76,
  },
  heart: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-end',
  },
  cardInfo: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  cardCat: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  cardName: {
    color: 'white',
    fontSize: FS.md,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 2,
    lineHeight: 19,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  cardMetaTxt: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FS.xs,
    fontWeight: '700',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: SP.xl,
  },
  emptyTitle: {
    color: 'white',
    fontSize: FS.xl,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 6,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FS.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: SP.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RAD.full,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  emptyBtnTxt: {
    color: 'white',
    fontWeight: '800',
    fontSize: FS.sm,
    letterSpacing: 0.3,
  },
});
