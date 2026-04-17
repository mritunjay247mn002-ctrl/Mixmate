import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
  type SharedValue,
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
 * "Match halo" — a glowing gradient ring whose intensity, glow size and
 * dash count reflect progress. Avoids SVG so it works on any Expo target.
 *
 * The ring is rendered as twelve tick bars orbiting a glass center. Ticks
 * below the progress threshold light up with the gradient; the rest stay
 * dim. A pulse animation is optional.
 */
const TICKS = 16;

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
      glow.value = withTiming(0, { duration: 200 });
    }
  }, [pulse, glow]);

  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const tickT = Math.max(2, Math.round(size * 0.028));
  const tickL = Math.max(6, Math.round(size * 0.09));
  const radius = size / 2 - tickL / 2 - 1;
  const inner = size - tickL * 2 - 8;

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.45, 0.95]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.12]) }],
  }));

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {pulse ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            glowStyle,
            {
              borderRadius: size / 2,
              shadowColor: colors[0],
              shadowOpacity: 0.9,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
              backgroundColor: colors[0] + '22',
            },
          ]}
        />
      ) : null}

      {/* Orbital ticks */}
      {Array.from({ length: TICKS }).map((_, i) => {
        const angle = (i / TICKS) * 360 - 90;
        const isOn = i / TICKS < progress;
        return (
          <Tick
            key={i}
            angle={angle}
            radius={radius}
            length={tickL}
            thickness={tickT}
            on={isOn}
            gradient={colors}
            index={i}
            progress={p}
          />
        );
      })}

      {/* Glass center */}
      <View
        style={[
          styles.center,
          { width: inner, height: inner, borderRadius: inner / 2 },
        ]}
      >
        <Text style={styles.pct}>{pct}%</Text>
        {label ? <Text style={styles.lbl}>{label}</Text> : null}
      </View>
    </View>
  );
}

function Tick({
  angle,
  radius,
  length,
  thickness,
  on,
  gradient,
  index,
  progress,
}: {
  angle: number;
  radius: number;
  length: number;
  thickness: number;
  on: boolean;
  gradient: [string, string];
  index: number;
  progress: SharedValue<number>;
}) {
  const threshold = index / TICKS;
  const a = useSharedValue(0);

  useEffect(() => {
    a.value = withTiming(on ? 1 : 0, { duration: 260, easing: Easing.out(Easing.cubic) });
  }, [on, a]);

  const animStyle = useAnimatedStyle(() => {
    const lit = progress.value > threshold ? 1 : 0;
    return {
      opacity: interpolate(a.value, [0, 1], [0.25, 1]) * (lit > 0 ? 1 : 0.3),
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: thickness,
          height: length,
          borderRadius: thickness,
          overflow: 'hidden',
          transform: [
            { rotate: `${angle + 90}deg` },
            { translateY: -radius },
          ],
        },
        animStyle,
      ]}
    >
      <LinearGradient
        colors={on ? gradient : ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)']}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    backgroundColor: 'rgba(7,2,15,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pct: {
    color: 'white',
    fontWeight: '900',
    fontSize: FS.md,
    letterSpacing: -0.3,
  },
  lbl: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
