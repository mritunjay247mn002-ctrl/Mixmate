import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Drink } from '../utils/types';
import { FS, RAD, SP, gradFor } from '../utils/theme';

const { width: W } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onPickDrink: (d: Drink) => void;
  drinks: Drink[]; // candidate pool (all drinks)
}

const VIBES: {
  key: string;
  label: string;
  emoji: string;
  gradient: [string, string];
  filter: (d: Drink) => boolean;
}[] = [
  {
    key: 'banger',
    label: 'Crowd Banger',
    emoji: '🎉',
    gradient: ['#FF2E93', '#B026FF'],
    filter: (d) => d.isPopular === true,
  },
  {
    key: 'easy',
    label: 'Easy Batch',
    emoji: '🍹',
    gradient: ['#00E5FF', '#3CF5B0'],
    filter: (d) => (d.difficulty ?? 'easy') === 'easy' && (d.prepTime ?? 5) <= 4,
  },
  {
    key: 'zero',
    label: 'Zero-Proof Set',
    emoji: '🧃',
    gradient: ['#3CF5B0', '#00E5FF'],
    filter: (d) => d.type === 'mocktail',
  },
  {
    key: 'fancy',
    label: 'Fancy Round',
    emoji: '🍸',
    gradient: ['#B026FF', '#00E5FF'],
    filter: (d) => (d.difficulty === 'medium' || d.difficulty === 'hard') && !!d.rating && d.rating >= 4.5,
  },
];

export default function PartyMode({ visible, onClose, onPickDrink, drinks }: Props) {
  const sheet = useSharedValue(0);

  useEffect(() => {
    sheet.value = withTiming(visible ? 1 : 0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, sheet]);

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: sheet.value,
    transform: [
      { translateY: interpolate(sheet.value, [0, 1], [60, 0]) },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: sheet.value * 0.85,
  }));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          <LinearGradient
            colors={['#1A0736', '#0A0220']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.kicker}>LIGHTS, MUSIC, MIX</Text>
            <Text style={styles.title}>Party Mode</Text>
            <Text style={styles.sub}>Pick a vibe, get a curated round</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: SP.md }}
          >
            {VIBES.map((v) => {
              const pool = drinks.filter(v.filter);
              if (pool.length === 0) return null;
              const pick = pool[Math.floor(Math.random() * pool.length)];
              const all = pool.slice(0, 6);
              return (
                <VibeRow
                  key={v.key}
                  emoji={v.emoji}
                  label={v.label}
                  gradient={v.gradient}
                  pick={pick}
                  drinks={all}
                  onPick={(d) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    onPickDrink(d);
                    onClose();
                  }}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function VibeRow({
  emoji,
  label,
  gradient,
  pick,
  drinks,
  onPick,
}: {
  emoji: string;
  label: string;
  gradient: [string, string];
  pick: Drink;
  drinks: Drink[];
  onPick: (d: Drink) => void;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 0.9]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.06]) }],
  }));

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <View style={styles.emojiBadge}>
          <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
            />
          </Animated.View>
          <Text style={styles.emojiBig}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLbl}>{label}</Text>
          <Text style={styles.rowHint}>Tap any card · tonight's pick is first</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {[pick, ...drinks.filter((d) => d.id !== pick.id)].map((d, i) => {
          const gr = gradFor(d.category);
          const featured = i === 0;
          return (
            <Pressable key={d.id} onPress={() => onPick(d)}>
              <View
                style={[
                  styles.vCard,
                  featured && styles.vCardFeatured,
                ]}
              >
                <LinearGradient
                  colors={gr}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={StyleSheet.absoluteFill}
                />
                {featured ? (
                  <View style={styles.featTag}>
                    <Ionicons name="sparkles" size={10} color="#07020F" />
                    <Text style={styles.featTxt}>TONIGHT'S PICK</Text>
                  </View>
                ) : null}
                <Text style={styles.vEmoji}>{d.image}</Text>
                <Text numberOfLines={2} style={styles.vName}>
                  {d.name}
                </Text>
                <View style={styles.vMeta}>
                  <Ionicons name="time-outline" size={10} color="#fff" />
                  <Text style={styles.vMetaTxt}>{d.prepTime ?? 5}m</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: '88%',
    borderTopLeftRadius: RAD.xxl,
    borderTopRightRadius: RAD.xxl,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: 10,
  },
  header: { padding: SP.md, paddingBottom: SP.sm },
  kicker: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  title: { color: 'white', fontSize: FS.display, fontWeight: '900', letterSpacing: -1 },
  sub: { color: 'rgba(255,255,255,0.6)', fontSize: FS.sm, marginTop: 2 },
  row: { marginBottom: SP.lg },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    marginBottom: 10,
  },
  emojiBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emojiBig: { fontSize: 26 },
  rowLbl: { color: 'white', fontSize: FS.lg, fontWeight: '900' },
  rowHint: { color: 'rgba(255,255,255,0.55)', fontSize: FS.xs, marginTop: 2 },
  vCard: {
    width: W * 0.4,
    height: 170,
    borderRadius: RAD.lg,
    overflow: 'hidden',
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'flex-end',
  },
  vCardFeatured: {
    borderColor: '#FFD166',
    shadowColor: '#FFD166',
    shadowOpacity: 0.6,
    shadowRadius: 14,
  },
  featTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD166',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RAD.full,
  },
  featTxt: {
    color: '#07020F',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  vEmoji: { position: 'absolute', top: 40, alignSelf: 'center', fontSize: 52 },
  vName: { color: 'white', fontSize: FS.sm, fontWeight: '800', lineHeight: 17 },
  vMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  vMetaTxt: { color: 'rgba(255,255,255,0.9)', fontSize: FS.xs, fontWeight: '700' },
});
