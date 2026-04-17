import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { AlcoholLevel, DrinkType } from '../utils/types';
import { FS, GLASS_BORDER, RAD, SP } from '../utils/theme';

interface Props {
  type: DrinkType;
  level?: AlcoholLevel;
  percentage?: number;
  compact?: boolean;
  style?: ViewStyle;
}

const LEVEL_GRADIENT: Record<AlcoholLevel, [string, string]> = {
  none:   ['#00E5FF', '#3CF5B0'],
  low:    ['#3CF5B0', '#FFD166'],
  medium: ['#FFD166', '#FF7A00'],
  high:   ['#FF7A00', '#FF2E93'],
};

const LEVEL_LABEL: Record<AlcoholLevel, string> = {
  none:   '0% ABV',
  low:    'Low ABV',
  medium: 'Medium ABV',
  high:   'High ABV',
};

/**
 * Pill-style badge that communicates whether a drink is a cocktail or
 * mocktail and its alcohol level at a glance.
 */
export function AlcoholBadge({ type, level, percentage, compact, style }: Props) {
  const lvl: AlcoholLevel = level ?? (type === 'mocktail' ? 'none' : 'medium');
  const grad = LEVEL_GRADIENT[lvl];
  const icon = type === 'mocktail' ? '🧃' : '🍸';
  const label =
    type === 'mocktail'
      ? 'Mocktail'
      : typeof percentage === 'number' && percentage > 0
      ? `${percentage}% ABV`
      : LEVEL_LABEL[lvl];

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.icon, compact && { fontSize: 10 }]}>{icon}</Text>
      <Text
        style={[styles.label, compact && { fontSize: 10 }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SP.sm,
    paddingVertical: 4,
    borderRadius: RAD.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    overflow: 'hidden',
    gap: 4,
  },
  wrapCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  icon: { fontSize: 12 },
  label: {
    fontSize: FS.xs,
    fontWeight: '800',
    color: '#0F0520',
    letterSpacing: 0.4,
  },
});
