import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  FadeInUp,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';

import { FS, SP, RAD, gradFor } from '../utils/theme';
import { getDrinkById } from '../hooks/useDrinks';
import { useFavorites } from '../hooks/useFavorites';
import { addRecentlyViewed } from '../storage/db';
import NeonBackground from '../components/NeonBackground';

const { width: W } = Dimensions.get('window');
const HERO_H = 380;

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const drink = getDrinkById(id ?? '');
  const grad = gradFor(drink?.category);
  const isFav = favorites.has(id ?? '');

  useEffect(() => {
    if (id) addRecentlyViewed(id);
  }, [id]);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: scrollY.value * 0.5 },
      {
        scale: interpolate(scrollY.value, [-200, 0, 200], [1.25, 1, 0.95], 'clamp'),
      },
    ],
  }));

  const emojiFloat = useSharedValue(0);
  useEffect(() => {
    emojiFloat.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [emojiFloat]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(emojiFloat.value, [0, 1], [0, -14]) },
      { rotate: `${interpolate(emojiFloat.value, [0, 1], [-3, 3])}deg` },
    ],
  }));

  const heroGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(emojiFloat.value, [0, 1], [0.35, 0.7]),
    transform: [{ scale: interpolate(emojiFloat.value, [0, 1], [1, 1.15]) }],
  }));

  const difficulty = drink?.difficulty ?? 'easy';
  const difficultyColor = useMemo(() => {
    if (difficulty === 'easy') return '#3CF5B0';
    if (difficulty === 'medium') return '#FFD166';
    return '#FF7A00';
  }, [difficulty]);

  if (!drink) {
    return (
      <View style={styles.root}>
        <NeonBackground />
        <SafeAreaView style={styles.missing}>
          <Pressable onPress={() => router.back()} style={styles.backChip}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={styles.backTxt}>Back</Text>
          </Pressable>
          <Text style={styles.missingTxt}>Drink not found.</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <NeonBackground colors={[grad[0], grad[1], grad[2]]} />

      {/* Floating nav (on top of scroll) */}
      <SafeAreaView edges={['top']} style={styles.navWrap} pointerEvents="box-none">
        <View style={styles.navRow}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.back();
            }}
            hitSlop={10}
            style={styles.navBtn}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              toggleFavorite(drink.id);
            }}
            hitSlop={10}
            style={styles.navBtn}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={22}
              color={isFav ? '#FF4D6D' : '#fff'}
            />
          </Pressable>
        </View>
      </SafeAreaView>

      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero */}
        <Animated.View style={[styles.hero, heroStyle]}>
          <LinearGradient
            colors={grad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Decorative lights */}
          <View style={styles.heroOrbA} />
          <View style={[styles.heroOrbB, { backgroundColor: grad[2] }]} />

          <Animated.View style={[styles.heroGlow, heroGlowStyle]} />

          <Animated.View style={[styles.heroEmojiWrap, emojiStyle]}>
            <Text style={styles.heroEmoji}>{drink.image}</Text>
          </Animated.View>

          <LinearGradient
            colors={['transparent', 'rgba(7,2,15,0.85)']}
            style={styles.heroShade}
          />

          <View style={styles.heroInfo}>
            <Animated.Text
              entering={FadeInUp.duration(450).delay(100)}
              style={styles.heroKicker}
            >
              {drink.category.toUpperCase()}
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.duration(500).delay(180)}
              style={styles.heroTitle}
            >
              {drink.name}
            </Animated.Text>
            <Animated.View
              entering={FadeInUp.duration(500).delay(260)}
              style={styles.heroPills}
            >
              <View style={styles.heroPill}>
                <Text style={styles.heroPillTxt}>
                  {drink.type === 'cocktail' ? '🍸 Cocktail' : '🧃 Mocktail'}
                </Text>
              </View>
              {drink.rating ? (
                <View style={styles.heroPill}>
                  <Ionicons name="star" size={12} color="#FFD166" />
                  <Text style={styles.heroPillTxt}>{drink.rating.toFixed(1)}</Text>
                </View>
              ) : null}
              <View style={styles.heroPill}>
                <Ionicons name="time-outline" size={12} color="#fff" />
                <Text style={styles.heroPillTxt}>{drink.prepTime ?? 5} min</Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Stats strip */}
        <Animated.View
          entering={FadeInUp.duration(450).delay(200)}
          style={styles.stats}
        >
          <StatChip
            icon="time-outline"
            value={String(drink.prepTime ?? 5)}
            label="MIN"
            tint="#00E5FF"
          />
          <StatChip
            icon="flask-outline"
            value={String(drink.ingredients.length)}
            label="ITEMS"
            tint="#B026FF"
          />
          <StatChip
            icon="list-outline"
            value={String(drink.steps.length)}
            label="STEPS"
            tint="#FF2E93"
          />
          <StatChip
            icon="flame-outline"
            value={difficulty}
            label="LEVEL"
            tint={difficultyColor}
            small
          />
        </Animated.View>

        {/* Ingredients */}
        <Section title="Ingredients" emoji="🧪" delay={260}>
          <View style={styles.chipWrap}>
            {drink.ingredients.map((ing, i) => (
              <Animated.View
                key={ing}
                entering={FadeInRight.duration(350).delay(280 + i * 40)}
              >
                <View style={styles.ingChip}>
                  <View style={[styles.ingDot, { backgroundColor: grad[1] }]} />
                  <Text style={styles.ingTxt}>{ing}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Section>

        {/* Steps */}
        <Section title="How to make" emoji="📋" delay={340}>
          <View style={{ gap: 10, paddingHorizontal: SP.md }}>
            {drink.steps.map((s, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.duration(400).delay(360 + i * 60)}
                style={styles.step}
              >
                <LinearGradient
                  colors={[grad[0], grad[2]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stepNum}
                >
                  <Text style={styles.stepNumTxt}>{i + 1}</Text>
                </LinearGradient>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTxt}>{s}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Section>

        {/* Tags */}
        {drink.tags?.length ? (
          <Animated.View
            entering={FadeInDown.duration(420).delay(420)}
            style={styles.tags}
          >
            {drink.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagTxt}>#{t}</Text>
              </View>
            ))}
          </Animated.View>
        ) : null}

        {/* Favorite CTA */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            toggleFavorite(drink.id);
          }}
          style={styles.cta}
        >
          <LinearGradient
            colors={isFav ? ['#FF4D6D', '#FF2E93'] : [grad[0], grad[2]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color="#fff" />
          <Text style={styles.ctaTxt}>
            {isFav ? 'Saved to Favorites' : 'Save to Favorites'}
          </Text>
        </Pressable>
      </Animated.ScrollView>
    </View>
  );
}

function StatChip({
  icon,
  value,
  label,
  tint,
  small,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
  tint: string;
  small?: boolean;
}) {
  return (
    <View style={[styles.stat, { borderColor: tint + '55' }]}>
      <Ionicons name={icon} size={16} color={tint} />
      <Text
        style={[
          styles.statVal,
          small && { fontSize: FS.sm, textTransform: 'uppercase' },
        ]}
      >
        {value}
      </Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  emoji,
  delay = 0,
  children,
}: {
  title: string;
  emoji: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: SP.md }}>
      <Animated.View
        entering={FadeInUp.duration(420).delay(delay)}
        style={styles.secHead}
      >
        <Text style={styles.secEmoji}>{emoji}</Text>
        <Text style={styles.secTitle}>{title}</Text>
      </Animated.View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07020F' },
  navWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 20,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SP.md,
    paddingTop: SP.sm,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    height: HERO_H,
    overflow: 'hidden',
  },
  heroOrbA: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroOrbB: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.5,
  },
  heroGlow: {
    position: 'absolute',
    alignSelf: 'center',
    top: HERO_H / 2 - 110,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  heroEmojiWrap: {
    position: 'absolute',
    top: HERO_H / 2 - 110,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 160,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 30,
  },
  heroShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HERO_H * 0.65,
  },
  heroInfo: {
    position: 'absolute',
    left: SP.md + 4,
    right: SP.md + 4,
    bottom: SP.md,
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FS.xs,
    fontWeight: '800',
    letterSpacing: 2.8,
  },
  heroTitle: {
    color: 'white',
    fontSize: FS.display,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 42,
    marginTop: 4,
  },
  heroPills: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SP.sm,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RAD.full,
  },
  heroPillTxt: {
    color: 'white',
    fontSize: FS.xs,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SP.md,
    marginTop: SP.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: RAD.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 2,
  },
  statVal: {
    color: 'white',
    fontSize: FS.xl,
    fontWeight: '900',
  },
  statLbl: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  secHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SP.md,
    marginBottom: SP.sm,
  },
  secEmoji: { fontSize: 22 },
  secTitle: {
    color: 'white',
    fontSize: FS.lg,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: SP.md,
  },
  ingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RAD.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  ingDot: { width: 8, height: 8, borderRadius: 4 },
  ingTxt: {
    color: 'white',
    fontSize: FS.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#FF2E93',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  stepNumTxt: {
    color: 'white',
    fontWeight: '900',
    fontSize: FS.md,
  },
  stepBody: {
    flex: 1,
    borderRadius: RAD.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stepTxt: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: FS.md,
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: SP.md,
    marginTop: SP.md,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RAD.full,
    backgroundColor: 'rgba(255,46,147,0.15)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,46,147,0.45)',
  },
  tagTxt: {
    color: '#FF9BC9',
    fontSize: FS.xs,
    fontWeight: '700',
  },
  cta: {
    marginHorizontal: SP.md,
    marginTop: SP.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SP.md,
    borderRadius: RAD.full,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#FF2E93',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaTxt: {
    color: 'white',
    fontSize: FS.md,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RAD.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backTxt: {
    color: 'white',
    fontSize: FS.sm,
    fontWeight: '700',
  },
  missingTxt: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FS.md,
  },
});
