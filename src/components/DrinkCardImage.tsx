import React, { useEffect, useMemo, useState, memo } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveDrinkImage } from '../../assets/images/drinks';

const IMAGE_BG = '#121212';
const INSET = 10;
const CORNER = 16;

type Props = {
  /** `image_path` or `slug` — must match `assets/images/drinks` registry keys. */
  imageKey: string;
  /** From recipe JSON — shown when there is no unique bundled photo. */
  emoji?: string;
  /** Stronger gold edge + shadow (e.g. spotlight recipes). */
  featured?: boolean;
  /** Soft “bokeh” wash behind the sharp `contain` layer (same asset, cropped). */
  showAmbience?: boolean;
  style?: ViewStyle;
};

/**
 * Explore grid square tile: 1:1, `resizeMode="contain"`, letterboxing on
 * `#121212`, optional low-opacity backdrop of the same asset, bottom fade.
 */
function DrinkCardImageInner({
  imageKey,
  emoji = '🍹',
  featured,
  showAmbience = true,
  style,
}: Props) {
  const [decodeFailed, setDecodeFailed] = useState(false);
  const primary = useMemo(() => resolveDrinkImage(imageKey), [imageKey]);

  useEffect(() => {
    setDecodeFailed(false);
  }, [imageKey]);

  const showPhoto = primary != null && !decodeFailed;
  const glyph = (emoji && emoji.trim()) || '🍹';

  return (
    <View
      style={[
        styles.shadowHost,
        featured ? styles.shadowHostFeatured : null,
        style,
      ]}
    >
      <View
        style={[
          styles.square,
          featured ? styles.squareFeatured : null,
        ]}
      >
        {showAmbience && showPhoto && primary != null ? (
          <Image
            source={primary}
            style={styles.ambience}
            resizeMode="cover"
            accessibilityElementsHidden
          />
        ) : null}

        <View style={styles.inset}>
          {showPhoto && primary != null ? (
            <Image
              source={primary}
              style={styles.image}
              resizeMode="contain"
              onError={() => {
                if (__DEV__) {
                  console.warn(
                    '[MixMate] Drink image failed to load for key:',
                    imageKey
                  );
                }
                setDecodeFailed(true);
              }}
            />
          ) : (
            <Text
              style={styles.emojiTile}
              accessibilityLabel="Drink illustration"
            >
              {glyph}
            </Text>
          )}
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.72)']}
          locations={[0, 0.55, 1]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowHost: {
    width: '100%',
    borderRadius: CORNER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  shadowHostFeatured: {
    shadowColor: '#D4AF37',
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 12,
  },
  square: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: CORNER,
    overflow: 'hidden',
    backgroundColor: IMAGE_BG,
  },
  squareFeatured: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(212, 175, 55, 0.55)',
  },
  /** Same asset, cropped — only as depth behind `contain` artwork. */
  ambience: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
    transform: [{ scale: 1.15 }],
  },
  inset: {
    ...StyleSheet.absoluteFillObject,
    top: INSET,
    left: INSET,
    right: INSET,
    bottom: INSET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emojiTile: {
    fontSize: 64,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
});

export const DrinkCardImage = memo(DrinkCardImageInner);
