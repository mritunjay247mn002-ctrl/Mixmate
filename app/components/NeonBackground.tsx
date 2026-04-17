import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  colors?: [string, string, string];
}

/**
 * Ambient neon room: a deep-space base + three slowly drifting
 * colored "light bulbs" that drive the nightclub feel.
 */
export default function NeonBackground({
  colors = ['#7A00FF', '#FF2E93', '#00E5FF'],
}: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [t]);

  const blob1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [-W * 0.25, W * 0.15]) },
      { translateY: interpolate(t.value, [0, 1], [-H * 0.1, H * 0.05]) },
      { scale: interpolate(t.value, [0, 1], [1, 1.25]) },
    ],
    opacity: interpolate(t.value, [0, 0.5, 1], [0.55, 0.8, 0.55]),
  }));

  const blob2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [W * 0.25, -W * 0.1]) },
      { translateY: interpolate(t.value, [0, 1], [H * 0.15, H * 0.3]) },
      { scale: interpolate(t.value, [0, 1], [1.1, 0.85]) },
    ],
    opacity: interpolate(t.value, [0, 0.5, 1], [0.5, 0.75, 0.5]),
  }));

  const blob3 = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [W * 0.05, W * 0.35]) },
      { translateY: interpolate(t.value, [0, 1], [H * 0.55, H * 0.4]) },
      { scale: interpolate(t.value, [0, 1], [0.9, 1.15]) },
    ],
    opacity: interpolate(t.value, [0, 0.5, 1], [0.4, 0.7, 0.4]),
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#07020F', '#0B0320', '#04010A']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.blob, blob1, { backgroundColor: colors[0] }]} />
      <Animated.View style={[styles.blob, blob2, { backgroundColor: colors[1] }]} />
      <Animated.View style={[styles.blob, blob3, { backgroundColor: colors[2] }]} />
      {/* subtle dark vignette to anchor content */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const BLOB_SIZE = Math.max(W, H) * 0.9;

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    borderRadius: BLOB_SIZE / 2,
    top: -BLOB_SIZE * 0.25,
    left: -BLOB_SIZE * 0.25,
    // fake glow via shadow; iOS will render, Android falls back gracefully
    shadowColor: '#FF2E93',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 140,
  },
});
