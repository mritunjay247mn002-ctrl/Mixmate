import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LUX } from '../theme/luxuryDesignSystem';
import {
  MIXOLOGIST_TITLE_OPTIONS,
  getMixologistDisplayTitle,
  setLockedMixologistTitle,
  clearMixologistTitlePreference,
  pickNewSessionMixologistTitle,
  isMixologistTitleLocked,
} from '../utils/mixologistTitles';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { DrinkImage } from '../components/DrinkImage';

export default function ProfileScreen() {
  const router = useRouter();
  const { recentDrinks } = useRecentlyViewed();
  const [titleLine, setTitleLine] = useState(() => getMixologistDisplayTitle());
  const [locked, setLocked] = useState(() => isMixologistTitleLocked());

  const refreshTitle = useCallback(() => {
    setTitleLine(getMixologistDisplayTitle());
    setLocked(isMixologistTitleLocked());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshTitle();
    }, [refreshTitle])
  );

  const pickChip = (t: string) => {
    Haptics.selectionAsync().catch(() => {});
    setLockedMixologistTitle(t);
    refreshTitle();
  };

  const rollSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (locked) return;
    setTitleLine(pickNewSessionMixologistTitle());
  };

  const goSurprise = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    clearMixologistTitlePreference();
    refreshTitle();
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[LUX.voidDeep, LUX.void, LUX.voidDeep]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>GOLDEN MIXOLOGY</Text>
          <Text style={styles.heroLabel}>You are addressed as</Text>
          <Text style={styles.title}>{titleLine}</Text>
          <Text style={styles.sub}>
            {locked
              ? 'Saved on this device. Shuffle session or return to surprise picks.'
              : 'A fresh pick each time you open the app — or choose a title to keep.'}
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.pill, !locked && styles.pillActive]}
              onPress={rollSession}
              disabled={locked}
            >
              <Ionicons name="dice-outline" size={18} color={locked ? LUX.textDim : LUX.gold} />
              <Text style={[styles.pillTxt, locked && styles.pillTxtDim]}>Another vibe</Text>
            </Pressable>
            <Pressable style={[styles.pill, styles.pillGold]} onPress={goSurprise}>
              <Ionicons name="sparkles-outline" size={18} color={LUX.voidDeep} />
              <Text style={styles.pillTxtDark}>Surprise me</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>YOUR TITLE</Text>
          <View style={styles.chipWrap}>
            {MIXOLOGIST_TITLE_OPTIONS.map((t) => {
              const active = locked && titleLine === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => pickChip(t)}
                  style={[styles.chip, active && styles.chipOn]}
                >
                  <Text style={[styles.chipTxt, active && styles.chipTxtOn]} numberOfLines={1}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {recentDrinks.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 28 }]}>LAST VIEWED</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentRow}
              >
                {recentDrinks.slice(0, 12).map((d) => (
                  <Pressable
                    key={d.id}
                    style={styles.recentCard}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      router.push({
                        pathname: '/screens/DetailScreen',
                        params: { id: d.id },
                      });
                    }}
                  >
                    <DrinkImage
                      slug={d.image_path || d.slug}
                      emoji={d.emoji}
                      category={d.category}
                      size="sm"
                      radius={14}
                      showShine={false}
                      style={{ width: 56, height: 56 }}
                    />
                    <Text style={styles.recentName} numberOfLines={2}>
                      {d.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>TOOLS</Text>

          <Pressable
            style={styles.row}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push('/(tabs)/ingredients');
            }}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="flask" size={22} color={LUX.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Ingredient Bar</Text>
              <Text style={styles.rowSub}>Match drinks to what you have on hand</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={LUX.textMuted} />
          </Pressable>

          <Pressable
            style={styles.row}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.push('/(tabs)');
            }}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="sparkles" size={22} color={LUX.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Party deck</Text>
              <Text style={styles.rowSub}>Back to swipe mode on Home</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={LUX.textMuted} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LUX.void },
  safe: { flex: 1 },
  scroll: { padding: LUX.outerPad, paddingBottom: 120 },
  kicker: {
    color: LUX.goldMuted,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroLabel: {
    color: LUX.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    color: LUX.gold,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 10,
  },
  sub: { color: LUX.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 16 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: LUX.borderSubtle,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillActive: {
    borderColor: 'rgba(212,175,55,0.45)',
  },
  pillGold: {
    backgroundColor: LUX.gold,
    borderColor: LUX.gold,
  },
  pillTxt: { color: LUX.text, fontSize: 13, fontWeight: '700' },
  pillTxtDim: { color: LUX.textDim },
  pillTxtDark: { color: LUX.voidDeep, fontSize: 13, fontWeight: '800' },
  sectionLabel: {
    color: LUX.goldMuted,
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: '800',
    marginBottom: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LUX.borderSubtle,
    backgroundColor: 'rgba(255,255,255,0.04)',
    maxWidth: '100%',
  },
  chipOn: {
    borderColor: LUX.gold,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  chipTxt: {
    color: LUX.text,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTxtOn: { color: LUX.goldBright },
  recentRow: { gap: 12, paddingVertical: 4 },
  recentCard: {
    width: 100,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LUX.borderSubtle,
    alignItems: 'center',
  },
  recentName: {
    marginTop: 8,
    color: LUX.text,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LUX.borderSubtle,
    padding: 14,
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: { color: LUX.text, fontSize: 17, fontWeight: '700' },
  rowSub: { color: LUX.textMuted, fontSize: 13, marginTop: 2 },
});
