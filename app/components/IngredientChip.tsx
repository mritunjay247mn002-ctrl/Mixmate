import React, { useEffect } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { FS, RAD } from '../utils/theme';

interface Props {
  label: string;
  selected?: boolean;
  missing?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export default function IngredientChip({
  label,
  selected = false,
  missing = false,
  onPress,
  compact = false,
}: Props) {
  const s = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    s.value = withTiming(selected ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [selected, s]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(1 - press.value * 0.06, { damping: 12 }) },
    ],
  }));

  const gradStyle = useAnimatedStyle(() => ({ opacity: s.value }));

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onPress();
    }
  };

  const gradient: [string, string] = missing
    ? ['#FF7A00', '#FF2E93']
    : ['#B026FF', '#FF2E93'];

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => (press.value = 1)}
      onPressOut={() => (press.value = 0)}
    >
      <Animated.View
        style={[
          styles.chip,
          compact && styles.compact,
          animStyle,
          {
            borderColor: selected || missing
              ? 'rgba(255,255,255,0.35)'
              : 'rgba(255,255,255,0.15)',
          },
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, gradStyle]}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {missing ? (
          <Ionicons name="close-circle" size={13} color="#FF7A00" />
        ) : selected ? (
          <Ionicons name="checkmark-circle" size={13} color="rgba(255,255,255,0.95)" />
        ) : null}
        <Text
          numberOfLines={1}
          style={[
            styles.txt,
            compact && styles.txtCompact,
            {
              color: selected
                ? 'white'
                : missing
                  ? '#FFB277'
                  : 'rgba(255,255,255,0.78)',
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RAD.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  compact: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  txt: {
    fontSize: FS.sm,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  txtCompact: { fontSize: FS.xs },
});
