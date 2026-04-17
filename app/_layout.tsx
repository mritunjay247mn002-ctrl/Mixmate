import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
      </View>
    </GestureHandlerRootView>
  );
}
