import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { IngredientMatch } from '../utils/types';
import { gradFor, FS, RAD, SP } from '../utils/theme';
import MatchRing from './MatchRing';
import IngredientChip from './IngredientChip';
import { DrinkImage } from './DrinkImage';

interface Props {
  match: IngredientMatch;
  onPress: (m: IngredientMatch) => void;
}

export default function MatchDrinkCard({ match, onPress }: Props) {
  const press = useSharedValue(0);
  const { drink, have, missing, matchScore, status } = match;
  const grad = gradFor(drink.category);

  const ringColors: [string, string] =
    status === 'ready'
      ? ['#3CF5B0', '#00E5FF']
      : status === 'almost'
        ? ['#FFD166', '#FF7A00']
        : ['#B026FF', '#FF2E93'];

  const label =
    status === 'ready'
      ? 'READY'
      : status === 'almost'
        ? missing.length === 1
          ? '1 AWAY'
          : `${missing.length} AWAY`
        : 'SOON';

  const callout =
    status === 'ready'
      ? 'You can make this now ✨'
      : status === 'almost'
        ? missing.length === 1
          ? `Almost ready · grab ${missing[0]}`
          : `Almost ready · ${missing.slice(0, 2).join(' + ')}`
        : `${have.length}/${drink.ingredients.length} in your bar`;

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - press.value * 0.02) }],
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress(match);
      }}
      onPressIn={() => (press.value = 1)}
      onPressOut={() => (press.value = 0)}
    >
      <Animated.View style={[styles.card, style]}>
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(7,2,15,0.35)', 'rgba(7,2,15,0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.row}>
          <DrinkImage
            slug={drink.image_path || drink.slug}
            emoji={drink.emoji}
            category={drink.category}
            size="sm"
            showShine={false}
            style={styles.left}
          />

          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text numberOfLines={1} style={styles.name}>
                {drink.name}
              </Text>
              {status === 'ready' ? (
                <View style={styles.readyBadge}>
                  <Ionicons name="checkmark" size={10} color="#07020F" />
                  <Text style={styles.readyTxt}>READY</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.category}>
              {drink.category.toUpperCase()}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.callout,
                {
                  color:
                    status === 'ready'
                      ? '#3CF5B0'
                      : status === 'almost'
                        ? '#FFD166'
                        : 'rgba(255,255,255,0.7)',
                },
              ]}
            >
              {callout}
            </Text>
          </View>

          <MatchRing
            progress={matchScore}
            colors={ringColors}
            label={label}
            pulse={status === 'ready'}
            size={72}
          />
        </View>

        <View style={styles.chipRow}>
          {have.slice(0, 3).map((ing) => (
            <IngredientChip key={'h-' + ing} label={ing} selected compact />
          ))}
          {missing.slice(0, 3).map((ing) => (
            <IngredientChip key={'m-' + ing} label={ing} missing compact />
          ))}
          {have.length + missing.length > 6 ? (
            <View style={styles.moreChip}>
              <Text style={styles.moreTxt}>
                +{have.length + missing.length - 6}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SP.md,
    marginBottom: SP.md,
    borderRadius: RAD.lg,
    overflow: 'hidden',
    padding: SP.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
  },
  left: {
    width: 62,
    height: 62,
    borderRadius: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: 'white',
    fontSize: FS.lg,
    fontWeight: '900',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  category: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginTop: 1,
  },
  callout: {
    fontSize: FS.sm,
    fontWeight: '700',
    marginTop: 4,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#3CF5B0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RAD.full,
  },
  readyTxt: {
    color: '#07020F',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SP.sm,
  },
  moreChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RAD.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  moreTxt: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FS.xs,
    fontWeight: '700',
  },
});
