import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { FS, RAD, SP } from '../utils/theme';

interface Action {
  key: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  gradient: [string, string];
  onPress: () => void;
  pulse?: boolean;
}

export default function ActionDock({ actions }: { actions: Action[] }) {
  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <ActionBtn key={a.key} action={a} />
      ))}
    </View>
  );
}

function ActionBtn({ action }: { action: Action }) {
  const press = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (action.pulse) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    }
  }, [action.pulse, pulse]);

  const bStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - press.value * 0.06) }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0, 0.6]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.45]) }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        action.onPress();
      }}
      onPressIn={() => (press.value = 1)}
      onPressOut={() => (press.value = 0)}
      style={{ alignItems: 'center', flex: 1 }}
    >
      <Animated.View style={[styles.btn, bStyle]}>
        {action.pulse ? (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              pulseStyle,
              { borderRadius: 28, backgroundColor: action.gradient[0] },
            ]}
          />
        ) : null}
        <LinearGradient
          colors={action.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
        />
        <Ionicons name={action.icon} size={22} color="#fff" />
      </Animated.View>
      <Text style={styles.lbl}>{action.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: SP.md,
    gap: SP.sm,
    marginTop: SP.sm,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  lbl: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
    textTransform: 'uppercase',
  },
});
