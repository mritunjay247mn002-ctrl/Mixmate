import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect } from 'react';
import { initDb } from '../src/storage/db';
import { MiniPlayer } from '../src/components/MiniPlayer';
import { initMobileAds } from '../src/lib/initMobileAds';

initDb();

export default function RootLayout() {
  useEffect(() => {
    void initMobileAds().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#07020F' }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#07020F' },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="screens/DetailScreen"
              options={{
                // Reanimated 4.1 + rn-screens 4.16: patches/react-native-screens+4.16.0.patch
                // disables ALL ScreenTransitionProgressEvent dispatches (ScreensAnimation
                // + ScreenFragment) so Fabric does not flush bad translates on touch.
                // Rebuild the Android app after npm install so Kotlin changes apply.
                animation: 'slide_from_bottom',
                presentation: 'card',
              }}
            />
          </Stack>
          {/* Persistent audio UI — survives every navigation. */}
          <MiniPlayer />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
