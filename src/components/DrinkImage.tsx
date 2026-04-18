import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveDrinkImage } from '../../assets/images/drinks';
import { heroGradFor, GLASS_BORDER, RAD } from '../utils/theme';

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

const IMAGE_INSET = 10;

/**
 * Bundled drink art with `resizeMode="contain"` when a photo exists; otherwise
 * shows `emoji` on the category gradient (no misleading duplicate stock photo).
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
  const grad = useMemo(() => heroGradFor(slug, category), [slug, category]);
  const resolved = useMemo(() => resolveDrinkImage(slug), [slug]);
  const [decodeFailed, setDecodeFailed] = useState(false);

  useEffect(() => {
    setDecodeFailed(false);
  }, [slug]);

  const showPhoto = resolved != null && !decodeFailed;
  const glyph = (emoji && String(emoji).trim()) || '🍹';
  const emojiFont = Math.max(22, Math.round(dim * 0.38));

  const r = radius ?? (size === 'sm' ? RAD.md : size === 'hero' ? RAD.xxl : RAD.lg);

  return (
    <View style={[styles.wrap, { width: dim, height: dim, borderRadius: r }, style]}>
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: r }]}
      />
      <View
        style={[
          styles.imageInset,
          { borderRadius: r, padding: IMAGE_INSET },
        ]}
      >
        {showPhoto && resolved != null ? (
          <Image
            source={resolved}
            style={styles.imageContain}
            resizeMode="contain"
            onError={() => {
              if (__DEV__) {
                console.warn('[MixMate] DrinkImage decode error for slug:', slug);
              }
              setDecodeFailed(true);
            }}
          />
        ) : (
          <Text style={[styles.emojiOnly, { fontSize: emojiFont }]}>{glyph}</Text>
        )}
      </View>
      <LinearGradient
        colors={['rgba(7,2,15,0.06)', 'rgba(7,2,15,0.12)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: r }]}
        pointerEvents="none"
      />
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
  imageInset: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContain: {
    width: '100%',
    height: '100%',
  },
  emojiOnly: {
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  hairline: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
  },
});
