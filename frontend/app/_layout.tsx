import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { AuthProvider } from '@/src/lib/auth';
import { SubscriptionsProvider } from '@/src/lib/subs';
import { C } from '@/src/lib/constants';

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.surface }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SubscriptionsProvider>
            <StatusBar barStyle="light-content" backgroundColor={C.surface} />
            <View style={{ flex: 1, backgroundColor: C.surface }}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.surface } }} />
            </View>
          </SubscriptionsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
