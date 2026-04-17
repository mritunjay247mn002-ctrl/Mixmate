import React, { useCallback } from 'react';
import {
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MOODS, Mood, FS, SP, RAD } from '../utils/theme';
import { MoodKey } from '../utils/types';

interface Props {
  active: MoodKey;
  onChange: (m: MoodKey) => void;
}

function MoodPill({
  mood,
  active,
  onPress,
}: {
  mood: Mood;
  active: boolean;
  onPress: () => void;
}) {
  const press = useSharedValue(0);
  const a = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    a.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active, a]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - press.value * 0.05) }],
  }));

  const gradStyle = useAnimatedStyle(() => ({ opacity: a.value }));

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      onPressIn={() => (press.value = 1)}
      onPressOut={() => (press.value = 0)}
    >
      <Animated.View style={[styles.pill, style, active && styles.pillActive]}>
        <Animated.View style={[StyleSheet.absoluteFill, gradStyle]}>
          <LinearGradient
            colors={mood.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Text style={styles.emoji}>{mood.emoji}</Text>
        <Text
          style={[
            styles.lbl,
            { color: active ? '#fff' : 'rgba(255,255,255,0.7)' },
          ]}
        >
          {mood.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function MoodBar({ active, onChange }: Props) {
  const handle = useCallback(
    (k: MoodKey) => onChange(k),
    [onChange]
  );
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {MOODS.map((m) => (
          <MoodPill
            key={m.key}
            mood={m}
            active={m.key === active}
            onPress={() => handle(m.key as MoodKey)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    gap: SP.sm,
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SP.md,
    paddingVertical: 9,
    borderRadius: RAD.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  pillActive: {
    borderColor: 'rgba(255,255,255,0.35)',
  },
  emoji: { fontSize: 14 },
  lbl: {
    fontSize: FS.sm,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
