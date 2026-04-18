import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { FS, RAD } from '../../src/utils/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ROUTES: Record<
  string,
  { label: string; icon: IoniconName; iconActive: IoniconName; grad: [string, string] }
> = {
  index: {
    label: 'Home',
    icon: 'moon-outline',
    iconActive: 'moon',
    grad: ['#B026FF', '#FF2E93'],
  },
  explore: {
    label: 'Explore',
    icon: 'grid-outline',
    iconActive: 'grid',
    grad: ['#D4AF37', '#8B6914'],
  },
  favorites: {
    label: 'Favorites',
    icon: 'heart-outline',
    iconActive: 'heart',
    grad: ['#FF4D6D', '#FF2E93'],
  },
  profile: {
    label: 'Profile',
    icon: 'person-outline',
    iconActive: 'person',
    grad: ['#D4AF37', '#B026FF'],
  },
};

const TAB_ORDER = ['index', 'explore', 'favorites', 'profile'] as const;

function NeonTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe} pointerEvents="box-none">
      <View style={styles.dockWrap}>
        <View style={styles.dock}>
          {Platform.OS === 'web' ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(20,10,40,0.7)' },
              ]}
            />
          ) : (
            <BlurView
              intensity={60}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          )}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(20,10,40,0.4)' },
            ]}
          />
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.18)',
              'rgba(255,255,255,0.04)',
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {state.routes
            .filter((r) => (TAB_ORDER as readonly string[]).includes(r.name))
            .sort(
              (a, b) =>
                (TAB_ORDER as readonly string[]).indexOf(a.name) -
                (TAB_ORDER as readonly string[]).indexOf(b.name)
            )
            .map((route) => {
              const focused = state.routes[state.index]?.name === route.name;
              const cfg = ROUTES[route.name] ?? ROUTES.index;
              return (
                <TabBtn
                  key={route.key}
                  focused={focused}
                  cfg={cfg}
                  onPress={() => {
                    if (!focused) {
                      Haptics.selectionAsync().catch(() => {});
                      navigation.navigate(route.name);
                    }
                  }}
                />
              );
            })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function TabBtn({
  focused,
  cfg,
  onPress,
}: {
  focused: boolean;
  cfg: { label: string; icon: IoniconName; iconActive: IoniconName; grad: [string, string] };
  onPress: () => void;
}) {
  const a = useSharedValue(focused ? 1 : 0);
  const press = useSharedValue(0);

  React.useEffect(() => {
    a.value = withSpring(focused ? 1 : 0, { damping: 14 });
  }, [focused, a]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: a.value,
    transform: [{ scale: 0.6 + a.value * 0.4 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - press.value * 0.1) }],
  }));

  const lblStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: 160 }),
    maxWidth: focused ? 80 : 0,
    marginLeft: focused ? 6 : 0,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (press.value = 1)}
      onPressOut={() => (press.value = 0)}
      style={styles.btn}
    >
      <Animated.View style={[styles.pill, pillStyle]}>
        <LinearGradient
          colors={cfg.grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
        />
      </Animated.View>
      <Animated.View style={[styles.row, iconStyle]}>
        <Ionicons
          name={focused ? cfg.iconActive : cfg.icon}
          size={20}
          color={focused ? '#fff' : 'rgba(255,255,255,0.7)'}
        />
        <Animated.View style={[{ overflow: 'hidden' }, lblStyle]}>
          <Text numberOfLines={1} style={styles.lbl}>
            {cfg.label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => <NeonTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Favorites' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="ingredients" options={{ title: 'Bar', href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  safe: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  dockWrap: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  dock: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  btn: {
    height: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderRadius: RAD.full,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lbl: {
    color: '#fff',
    fontWeight: '800',
    fontSize: FS.sm,
    letterSpacing: 0.3,
  },
});
