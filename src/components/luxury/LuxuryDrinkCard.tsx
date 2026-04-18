import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LUX } from '../../theme/luxuryDesignSystem';
import type { Drink } from '../../utils/types';
import { DrinkCardImage } from '../DrinkCardImage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CARD_RADIUS = 16;

function Stars({ rating }: { rating?: number }) {
  const r = Math.min(5, Math.max(0, rating ?? 4.2));
  const nodes = [];
  for (let i = 1; i <= 5; i++) {
    const filled = r >= i - 0.25;
    nodes.push(
      <Ionicons
        key={i}
        name={filled ? 'star' : 'star-outline'}
        size={12}
        color={filled ? LUX.gold : 'rgba(212,175,55,0.35)'}
        style={{ marginRight: 2 }}
      />
    );
  }
  return <View style={styles.starsRow}>{nodes}</View>;
}

function tagLabel(drink: Drink): string {
  if (drink.tags?.length) return drink.tags[0];
  return drink.category;
}

export type LuxuryDrinkCardProps = {
  drink: Drink;
  width: number;
  featured?: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
};

function luxuryDrinkCardPropsEqual(
  a: LuxuryDrinkCardProps,
  b: LuxuryDrinkCardProps
): boolean {
  const imgA = a.drink.image_path || a.drink.slug;
  const imgB = b.drink.image_path || b.drink.slug;
  const tagA = a.drink.tags?.[0] ?? a.drink.category;
  const tagB = b.drink.tags?.[0] ?? b.drink.category;
  return (
    a.drink.id === b.drink.id &&
    a.width === b.width &&
    a.featured === b.featured &&
    a.isFavorite === b.isFavorite &&
    a.drink.name === b.drink.name &&
    a.drink.rating === b.drink.rating &&
    a.drink.emoji === b.drink.emoji &&
    imgA === imgB &&
    tagA === tagB
  );
}

function LuxuryDrinkCardInner({
  drink,
  width,
  featured,
  onPress,
  onToggleFavorite,
  isFavorite,
}: LuxuryDrinkCardProps) {
  const press = useSharedValue(0);

  const onIn = () => {
    press.value = withSpring(1, { damping: 18, stiffness: 320 });
  };
  const onOut = () => {
    press.value = withSpring(0, { damping: 18, stiffness: 320 });
  };

  const imageKey = useMemo(
    () => drink.image_path || drink.slug,
    [drink.image_path, drink.slug]
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + press.value * 0.02 }],
  }));

  return (
    <AnimatedPressable
      onPressIn={onIn}
      onPressOut={onOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={[
        styles.wrap,
        {
          width,
          borderRadius: CARD_RADIUS,
          borderWidth: featured ? 2 : StyleSheet.hairlineWidth,
          borderColor: featured ? LUX.gold : LUX.borderSubtle,
          shadowColor: featured ? LUX.gold : '#000',
          shadowOpacity: featured ? 0.38 : 0.32,
          shadowRadius: featured ? 14 : 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: featured ? 10 : 5,
        },
        animStyle,
      ]}
    >
      <View style={styles.imageBlock}>
        <DrinkCardImage
          imageKey={imageKey}
          emoji={drink.emoji}
          featured={featured}
          style={{ width: '100%' }}
        />
        <Pressable
          style={styles.favHit}
          onPress={(e) => {
            e.stopPropagation?.();
            Haptics.selectionAsync().catch(() => {});
            onToggleFavorite();
          }}
          hitSlop={10}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? LUX.goldBright : 'rgba(255,255,255,0.9)'}
          />
        </Pressable>
      </View>

      <LinearGradient
        colors={[LUX.card, LUX.cardElevated]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.meta,
          {
            borderBottomLeftRadius: CARD_RADIUS,
            borderBottomRightRadius: CARD_RADIUS,
          },
        ]}
      >
        <Text style={styles.name} numberOfLines={2}>
          {drink.name.toUpperCase()}
        </Text>
        <View style={styles.starsWrap}>
          <Stars rating={drink.rating} />
        </View>
        <Text style={styles.tag} numberOfLines={1}>
          {tagLabel(drink)}
        </Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export const LuxuryDrinkCard = memo(LuxuryDrinkCardInner, luxuryDrinkCardPropsEqual);

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: LUX.card,
  },
  imageBlock: {
    width: '100%',
    position: 'relative',
  },
  favHit: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8,8,10,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    color: LUX.text,
    fontSize: 13,
    letterSpacing: 0.4,
    lineHeight: 17,
    fontWeight: '700',
  },
  starsWrap: {
    marginTop: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    marginTop: 6,
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: LUX.goldMuted,
    letterSpacing: 0.6,
  },
});
