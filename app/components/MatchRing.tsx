import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FS } from '../utils/theme';

interface Props {
  progress: number; // 0..1
  size?: number;
  colors?: [string, string];
  label?: string;
  pulse?: boolean;
}

/**
 * A glowing "match" ring. We fake a circular progress by using two
 * overlapping half-disks that rotate based on progress, with an inner
 * glass center showing the percentage.
 */
export default function MatchRing({
  progress,
  size = 86,
  colors = ['#3CF5B0', '#00E5FF'],
  label,
  pulse = false,
}: Props) {
  const p = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, p]);

  useEffect(() => {
    if (pulse) {
      glow.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      glow.value = 0;
    }
  }, [pulse, glow]);

  const halfA = useAnimatedStyle(() => {
    const deg = interpolate(p.value, [0, 0.5], [0, 180], 'clamp');
    return { transform: [{ rotate: `${deg}deg` }] };
  });
  const halfB = useAnimatedStyle(() => {
    const deg = interpolate(p.value, [0.5, 1], [0, 180], 'clamp');
    return { transform: [{ rotate: `${deg}deg` }] };
  });

  const halfBVisible = useAnimatedStyle(() => ({
    opacity: p.value >= 0.5 ? 1 : 0,
  }));
  const mask = useAnimatedStyle(() => ({
    opacity: p.value < 0.5 ? 1 : 0,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.35, 0.85]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.12]) }],
  }));

  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const ringWidth = Math.max(6, size * 0.1);
  const inner = size - ringWidth * 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {pulse ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            glowStyle,
            {
              borderRadius: size / 2,
              backgroundColor: colors[0],
              shadowColor: colors[0],
              shadowOpacity: 0.9,
              shadowRadius: 20,
            },
          ]}
        />
      ) : null}

      <View
        style={[
          styles.track,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />

      {/* Rotating colored halves to render a circular progress */}
      <View style={[styles.half, { width: size, height: size }]}>
        <Animated.View style={[styles.halfInner, halfA]}>
          <LinearGradient
            colors={colors}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ translateX: -size / 2 }],
            }}
          />
        </Animated.View>
      </View>

      <Animated.View style={[styles.half, { width: size, height: size }, halfBVisible]}>
        <Animated.View style={[styles.halfInner, halfB]}>
          <LinearGradient
            colors={colors}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ translateX: -size / 2 }],
            }}
          />
        </Animated.View>
      </Animated.View>

      {/* Mask hiding the other half until progress crosses 50% */}
      <Animated.View style={[styles.mask, { width: size / 2, height: size, left: size / 2 }, mask]} />

      {/* Center hole */}
      <View
        style={[
          styles.center,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
          },
        ]}
      >
        <Text style={styles.pct}>{pct}%</Text>
        {label ? <Text style={styles.lbl}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  half: {
    position: 'absolute',
    overflow: 'hidden',
  },
  halfInner: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '50%',
  },
  mask: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#07020F',
  },
  center: {
    position: 'absolute',
    backgroundColor: 'rgba(7,2,15,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pct: {
    color: 'white',
    fontWeight: '900',
    fontSize: FS.md,
    letterSpacing: -0.3,
  },
  lbl: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
