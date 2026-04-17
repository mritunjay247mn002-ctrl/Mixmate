import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { initDb } from '../src/storage/db';
import { MiniPlayer } from '../src/components/MiniPlayer';

initDb();

export default function RootLayout() {
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
