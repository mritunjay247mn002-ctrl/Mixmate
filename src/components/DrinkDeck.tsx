import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Drink } from '../utils/types';
import { FS, SP, RAD, heroGradFor } from '../utils/theme';
import { DrinkImage } from './DrinkImage';
import { AlcoholBadge } from './AlcoholBadge';

const { width: W, height: H } = Dimensions.get('window');
const CARD_W = Math.min(W - SP.md * 2, 400);
const CARD_H = Math.min(H * 0.62, 600);
/** Hero art must fit inside `heroWrap` (no overflow clip) — was 260 in a ~42%-tall band. */
const DECK_HERO_WRAP_H = CARD_H * 0.42;
const DECK_HERO_IMAGE = Math.floor(
  Math.min(CARD_W * 0.88, DECK_HERO_WRAP_H * 0.92)
);
const SWIPE_OUT = W * 1.2;
const SWIPE_THRESHOLD = W * 0.28;

interface DeckProps {
  drinks: Drink[];
  onOpen: (d: Drink) => void;
  onLike?: (d: Drink) => void;
  onSkip?: (d: Drink) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

export default function DrinkDeck({
  drinks,
  onOpen,
  onLike,
  onSkip,
  isFavorite,
  toggleFavorite,
}: DeckProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Reset if the underlying list shrinks below current index
    if (index >= drinks.length) setIndex(0);
  }, [drinks, index]);

  const bump = useCallback(
    (dir: 'left' | 'right') => {
      const d = drinks[index];
      if (!d) return;
      if (dir === 'right' && onLike) onLike(d);
      if (dir === 'left' && onSkip) onSkip(d);
      setIndex((i) => (i + 1) % Math.max(drinks.length, 1));
    },
    [drinks, index, onLike, onSkip]
  );

  if (drinks.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🌙</Text>
        <Text style={styles.emptyTitle}>The bar is quiet</Text>
        <Text style={styles.emptySub}>
          Try a different mood or clear the search
        </Text>
      </View>
    );
  }

  // Render 3 upcoming cards for depth
  const visible = [
    drinks[index % drinks.length],
    drinks[(index + 1) % drinks.length],
    drinks[(index + 2) % drinks.length],
  ];

  return (
    <View style={styles.deckWrap}>
      {visible
        .slice()
        .reverse()
        .map((d, i) => {
          const depth = 2 - i; // 0 == top
          const isTop = depth === 0;
          return (
            <DeckCard
              key={`${d.id}-${index}-${depth}`}
              drink={d}
              depth={depth}
              isTop={isTop}
              onSwipe={bump}
              onOpen={onOpen}
              isFav={isFavorite(d.id)}
              onToggleFav={() => toggleFavorite(d.id)}
            />
          );
        })}

      {/* Instruction overlay */}
      <View style={styles.hintRow} pointerEvents="none">
        <Ionicons name="arrow-back" size={12} color="#FF7A00" />
        <Text style={styles.hintTxt}>swipe</Text>
        <Ionicons name="arrow-forward" size={12} color="#3CF5B0" />
      </View>
    </View>
  );
}

interface CardProps {
  drink: Drink;
  depth: number;
  isTop: boolean;
  onSwipe: (dir: 'left' | 'right') => void;
  onOpen: (d: Drink) => void;
  isFav: boolean;
  onToggleFav: () => void;
}

function DeckCard({
  drink,
  depth,
  isTop,
  onSwipe,
  onOpen,
  isFav,
  onToggleFav,
}: CardProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const shake = useSharedValue(0);
  const shimmer = useSharedValue(0);

  const targetScale = 1 - depth * 0.05;
  const targetY = depth * 14;

  useEffect(() => {
    if (isTop) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        -1,
        false
      );
    }
  }, [isTop, shimmer]);

  const doLike = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    onSwipe('right');
  };
  const doSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSwipe('left');
  };

  const triggerShake = () => {
    shake.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
  };

  const pan = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      const x = e.translationX;
      const vx = e.velocityX;
      if (x > SWIPE_THRESHOLD || vx > 800) {
        tx.value = withTiming(SWIPE_OUT, { duration: 220 });
        ty.value = withTiming(ty.value + 80, { duration: 220 });
        runOnJS(doLike)();
      } else if (x < -SWIPE_THRESHOLD || vx < -800) {
        tx.value = withTiming(-SWIPE_OUT, { duration: 220 });
        ty.value = withTiming(ty.value + 80, { duration: 220 });
        runOnJS(doSkip)();
      } else {
        tx.value = withSpring(0, { damping: 14 });
        ty.value = withSpring(0, { damping: 14 });
      }
    });

  const tap = Gesture.Tap()
    .maxDuration(220)
    .onEnd(() => {
      runOnJS(onOpen)(drink);
    });

  const longPress = Gesture.LongPress()
    .minDuration(380)
    .onStart(() => {
      runOnJS(triggerShake)();
      runOnJS(onToggleFav)();
    });

  const composed = Gesture.Exclusive(pan, longPress, tap);

  const cardStyle = useAnimatedStyle(() => {
    const rot = interpolate(
      tx.value,
      [-W, 0, W],
      [-12, 0, 12],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: tx.value + shake.value },
        // Never call withSpring() inside useAnimatedStyle for translate/scale —
        // it is not a number; Reanimated 4 Fabric can crash on touch with
        // "String translate must be a percentage". targetY/targetScale are
        // static per card (depth); springs belong on shared values in handlers.
        { translateY: ty.value + targetY },
        { rotate: `${rot}deg` },
        { scale: targetScale },
      ],
      opacity: 1 - depth * 0.15,
      zIndex: 10 - depth,
    };
  });

  const likeStamp = useAnimatedStyle(() => ({
    opacity: interpolate(
      tx.value,
      [0, SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD],
      [0, 0.6, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          tx.value,
          [0, SWIPE_THRESHOLD],
          [0.7, 1],
          Extrapolation.CLAMP
        ),
      },
      { rotate: '-12deg' },
    ],
  }));

  const skipStamp = useAnimatedStyle(() => ({
    opacity: interpolate(
      tx.value,
      [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.6, 0],
      [1, 0.6, 0],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          tx.value,
          [-SWIPE_THRESHOLD, 0],
          [1, 0.7],
          Extrapolation.CLAMP
        ),
      },
      { rotate: '12deg' },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmer.value,
          [0, 1],
          [-CARD_W, CARD_W]
        ),
      },
    ],
    opacity: isTop ? 0.5 : 0,
  }));

  const grad = heroGradFor(drink.slug, drink.category);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.card, cardStyle]}>
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative glow orb */}
        <View style={styles.orb} />
        <View style={[styles.orb2, { backgroundColor: grad[2] }]} />

        {/* Top chrome */}
        <View style={styles.topRow}>
          <AlcoholBadge
            type={drink.type}
            level={drink.alcohol_level}
            percentage={drink.alcohol_percentage}
          />
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {}
              );
              onToggleFav();
            }}
            hitSlop={16}
            style={styles.favCircle}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={22}
              color={isFav ? '#FF4D6D' : '#fff'}
            />
          </Pressable>
        </View>

        {/* Immersive hero image */}
        <View style={styles.heroWrap}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
          <DrinkImage
            slug={drink.image_path || drink.slug}
            emoji={drink.emoji}
            category={drink.category}
            size="hero"
            radius={RAD.xl}
            style={{
              width: DECK_HERO_IMAGE,
              height: DECK_HERO_IMAGE,
            }}
          />
          {drink.rating ? (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color="#FFD166" />
              <Text style={styles.ratingTxt}>{drink.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom gradient + info */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.92)']}
          style={styles.bottomShade}
        />

        <View style={styles.info}>
          <Text style={styles.category}>{drink.category.toUpperCase()}</Text>
          <Text style={styles.name} numberOfLines={2}>
            {drink.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color="#fff" />
              <Text style={styles.metaTxt}>{drink.prep_time ?? 5} min</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons name="flask-outline" size={13} color="#fff" />
              <Text style={styles.metaTxt}>
                {drink.ingredients.length} items
              </Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={13} color="#fff" />
              <Text style={styles.metaTxt}>{drink.difficulty ?? 'easy'}</Text>
            </View>
          </View>

          {/* Ingredient chip preview */}
          <View style={styles.chips}>
            {drink.ingredients.slice(0, 4).map((ing) => (
              <View key={ing.name} style={styles.chip}>
                <Text numberOfLines={1} style={styles.chipTxt}>
                  {ing.name}
                </Text>
              </View>
            ))}
            {drink.ingredients.length > 4 ? (
              <View style={[styles.chip, styles.chipMore]}>
                <Text style={styles.chipTxt}>
                  +{drink.ingredients.length - 4}
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={() => onOpen(drink)}
            style={({ pressed }) => [
              styles.cta,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.ctaTxt}>Open Recipe</Text>
            <Ionicons name="arrow-forward" size={16} color="#07020F" />
          </Pressable>
        </View>

        {/* Swipe stamps */}
        <Animated.View
          style={[styles.stamp, styles.stampLike, likeStamp]}
          pointerEvents="none"
        >
          <Text style={[styles.stampTxt, { color: '#3CF5B0' }]}>MIX IT</Text>
        </Animated.View>
        <Animated.View
          style={[styles.stamp, styles.stampSkip, skipStamp]}
          pointerEvents="none"
        >
          <Text style={[styles.stampTxt, { color: '#FF7A00' }]}>SKIP</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  deckWrap: {
    width: '100%',
    height: CARD_H + 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  card: {
    position: 'absolute',
    top: 0,
    width: CARD_W,
    height: CARD_H,
    borderRadius: RAD.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 18,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  orb: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.22)',
    top: -80,
    right: -80,
  },
  orb2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.55,
    bottom: -70,
    left: -70,
  },
  topRow: {
    position: 'absolute',
    top: SP.md,
    left: SP.md,
    right: SP.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  typePill: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: RAD.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typePillTxt: { color: 'white', fontSize: FS.xs, fontWeight: '700' },
  favCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroWrap: {
    position: 'absolute',
    top: CARD_H * 0.12,
    left: 0,
    right: 0,
    height: CARD_H * 0.42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 140, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 20 },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: CARD_W * 0.6,
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ skewX: '-20deg' }],
  },
  ratingPill: {
    position: 'absolute',
    top: 8,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RAD.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ratingTxt: { color: '#fff', fontSize: FS.xs, fontWeight: '800' },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: CARD_H * 0.55,
  },
  info: {
    position: 'absolute',
    left: SP.md + 2,
    right: SP.md + 2,
    bottom: SP.md,
    gap: 8,
  },
  category: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FS.xs,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  name: {
    color: 'white',
    fontSize: FS.xxl,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTxt: { color: 'rgba(255,255,255,0.9)', fontSize: FS.sm, fontWeight: '600' },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RAD.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  chipMore: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  chipTxt: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: FS.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cta: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: RAD.full,
    shadowColor: '#fff',
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  ctaTxt: { color: '#07020F', fontWeight: '800', fontSize: FS.sm, letterSpacing: 0.3 },
  stamp: {
    position: 'absolute',
    top: 80,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  stampLike: { right: 30, borderColor: '#3CF5B0' },
  stampSkip: { left: 30, borderColor: '#FF7A00' },
  stampTxt: { fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  hintRow: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RAD.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  hintTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FS.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 120,
  },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { color: '#fff', fontSize: FS.xl, fontWeight: '800' },
  emptySub: { color: 'rgba(255,255,255,0.6)', fontSize: FS.sm },
});
