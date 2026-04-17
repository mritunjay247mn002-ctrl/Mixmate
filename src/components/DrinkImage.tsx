import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveDrinkImage } from '../../assets/images/drinks';
import { gradFor, GLASS_BORDER, RAD } from '../utils/theme';

export type DrinkImageSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

interface Props {
  slug: string;
  emoji?: string;
  category?: string;
  size?: DrinkImageSize;
  radius?: number;
  style?: ViewStyle;
  showShine?: boolean;
}

const SIZE_MAP: Record<DrinkImageSize, number> = {
  sm: 64,
  md: 96,
  lg: 140,
  xl: 200,
  hero: 260,
};

const EMOJI_SCALE: Record<DrinkImageSize, number> = {
  sm: 0.55,
  md: 0.55,
  lg: 0.55,
  xl: 0.55,
  hero: 0.5,
};

/**
 * Renders a drink image using the offline bundled PNG registered for the
 * given slug. When no PNG is registered, falls back to a premium gradient
 * placeholder stamped with the drink's emoji.
 */
export function DrinkImage({
  slug,
  emoji = '🍹',
  category,
  size = 'lg',
  radius,
  style,
  showShine = true,
}: Props) {
  const dim = SIZE_MAP[size];
  const grad = useMemo(() => gradFor(category), [category]);
  const source = useMemo(() => resolveDrinkImage(slug), [slug]);

  const r = radius ?? (size === 'sm' ? RAD.md : size === 'hero' ? RAD.xxl : RAD.lg);

  return (
    <View style={[styles.wrap, { width: dim, height: dim, borderRadius: r }, style]}>
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: r }]}
      />
      {source ? (
        <Image
          source={source}
          style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text
            style={[
              styles.emoji,
              { fontSize: Math.round(dim * EMOJI_SCALE[size]) },
            ]}
            accessibilityElementsHidden
          >
            {emoji}
          </Text>
        </View>
      )}
      {showShine && (
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)']}
          start={{ x: 0.05, y: 0.05 }}
          end={{ x: 0.6, y: 0.55 }}
          style={[StyleSheet.absoluteFill, { borderRadius: r }]}
          pointerEvents="none"
        />
      )}
      <View
        pointerEvents="none"
        style={[styles.hairline, { borderRadius: r }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#1A0B2A',
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  emoji: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  hairline: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
  },
});
