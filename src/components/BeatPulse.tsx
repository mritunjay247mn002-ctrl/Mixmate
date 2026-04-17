import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAudio } from '../audio/useAudio';

interface Props {
  /** Approximate beats-per-minute feel (default 92 BPM). */
  bpm?: number;
  /** Force the pulse to run regardless of playback state. */
  force?: boolean;
  /** Container style (e.g. to match a card's borderRadius). */
  style?: ViewStyle;
  /** Halo border radius. Defaults to a stadium shape. */
  radius?: number;
  /** Glow ring color. Falls back to neon accent. */
  color?: string;
  /** Maximum scale at beat peak. */
  maxScale?: number;
  /** Maximum glow opacity at beat peak. */
  maxOpacity?: number;
  children?: React.ReactNode;
}

/**
 * Wraps arbitrary children with a soft breathing halo that syncs to a
 * simulated BPM while music is playing. Purely visual — no BPM detection is
 * performed. Animations are driven by reanimated worklets so they never block
 * JS interactions.
 */
export function BeatPulse({
  bpm = 92,
  force = false,
  style,
  radius = 9999,
  color = '#FF2E93',
  maxScale = 1.06,
  maxOpacity = 0.55,
  children,
}: Props) {
  const { state } = useAudio();
  const active = force || state.isPlaying;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const beatMs = Math.max(250, Math.round(60000 / bpm));
    if (active) {
      scale.value = withRepeat(
        withTiming(maxScale, {
          duration: beatMs,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      );
      opacity.value = withRepeat(
        withTiming(maxOpacity, {
          duration: beatMs,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1, { duration: 260 });
      opacity.value = withTiming(0, { duration: 260 });
    }
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [active, bpm, maxScale, maxOpacity, scale, opacity]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.halo,
          { shadowColor: color, borderColor: color, borderRadius: radius },
          haloStyle,
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  halo: {
    borderWidth: 2,
    shadowOpacity: 0.9,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
});
