import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, GLASS_BORDER, RAD, SP, FS } from '../utils/theme';
import type { AlcoholFilter as Filter } from '../utils/types';

interface Option {
  key: Filter;
  label: string;
  sub: string;
  emoji: string;
  gradient: [string, string];
}

const OPTIONS: Option[] = [
  { key: 'all',      label: 'All',        sub: 'Everything',     emoji: '✨', gradient: ['#B026FF', '#FF2E93'] },
  { key: 'cocktail', label: 'Cocktails',  sub: 'With alcohol',   emoji: '🥃', gradient: ['#FF2E93', '#FF7A00'] },
  { key: 'mocktail', label: 'Mocktails',  sub: 'Zero proof',     emoji: '🧃', gradient: ['#00E5FF', '#3CF5B0'] },
];

interface Props {
  value: Filter;
  onChange: (next: Filter) => void;
  counts?: Partial<Record<Filter, number>>;
}

export function AlcoholFilter({ value, onChange, counts }: Props) {
  return (
    <View style={styles.wrap}>
      {OPTIONS.map((opt) => (
        <FilterCard
          key={opt.key}
          option={opt}
          active={value === opt.key}
          count={counts?.[opt.key]}
          onPress={() => {
            if (value !== opt.key) {
              Haptics.selectionAsync();
              onChange(opt.key);
            }
          }}
        />
      ))}
    </View>
  );
}

function FilterCard({
  option,
  active,
  count,
  onPress,
}: {
  option: Option;
  active: boolean;
  count?: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(active ? 1 : 0.97);
  const glow = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(active ? 1 : 0.97, { damping: 18, stiffness: 240 });
    glow.value = withTiming(active ? 1 : 0, { duration: 260 });
  }, [active, scale, glow]);

  const rStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const rGlow = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <Animated.View style={[styles.card, rStyle]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 18, stiffness: 260 });
        }}
        onPressOut={() => {
          scale.value = withSpring(active ? 1 : 0.97, { damping: 18, stiffness: 240 });
        }}
        onPress={onPress}
        style={styles.pressable}
      >
        <Animated.View style={[StyleSheet.absoluteFill, rGlow]}>
          <LinearGradient
            colors={option.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: RAD.lg }]}
          />
        </Animated.View>
        <View style={styles.content}>
          <Text style={styles.emoji}>{option.emoji}</Text>
          <Text
            style={[styles.label, active && styles.labelActive]}
            numberOfLines={1}
          >
            {option.label}
          </Text>
          <Text
            style={[styles.sub, active && styles.subActive]}
            numberOfLines={1}
          >
            {option.sub}
          </Text>
          {typeof count === 'number' && (
            <View style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillTxt, active && styles.pillTxtActive]}>
                {count}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: SP.md,
    gap: SP.sm,
  },
  card: {
    flex: 1,
    borderRadius: RAD.lg,
    overflow: 'hidden',
  },
  pressable: {
    minHeight: 100,
    borderRadius: RAD.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    backgroundColor: Colors.dark.bgCard,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  content: {
    padding: SP.md,
    alignItems: 'flex-start',
    gap: 2,
  },
  emoji: { fontSize: 22, marginBottom: 4 },
  label: {
    color: Colors.dark.text,
    fontSize: FS.md,
    fontWeight: '800',
  },
  labelActive: { color: '#FFFFFF' },
  sub: {
    color: Colors.dark.textMuted,
    fontSize: FS.xs,
    fontWeight: '600',
    opacity: 0.9,
  },
  subActive: { color: 'rgba(255,255,255,0.92)' },
  pill: {
    marginTop: SP.xs,
    paddingHorizontal: SP.sm,
    paddingVertical: 2,
    borderRadius: RAD.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillActive: { backgroundColor: 'rgba(0,0,0,0.3)' },
  pillTxt: {
    color: Colors.dark.textMuted,
    fontSize: FS.xs,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  pillTxtActive: { color: '#FFFFFF' },
});
