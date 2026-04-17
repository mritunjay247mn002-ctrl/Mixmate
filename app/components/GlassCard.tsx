import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { RAD, GLASS_BORDER } from '../utils/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'dark' | 'light';
  radius?: number;
  bordered?: boolean;
  sheen?: boolean;
}

export default function GlassCard({
  children,
  style,
  intensity = 40,
  tint = 'dark',
  radius = RAD.lg,
  bordered = true,
  sheen = true,
}: Props) {
  return (
    <View
      style={[
        styles.wrap,
        {
          borderRadius: radius,
          borderWidth: bordered ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: bordered ? GLASS_BORDER : 'transparent',
        },
        style,
      ]}
    >
      {Platform.OS === 'web' ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(20,10,40,0.55)' },
          ]}
        />
      ) : (
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(20,10,40,0.35)' },
        ]}
      />
      {sheen ? (
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.14)',
            'rgba(255,255,255,0.02)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
