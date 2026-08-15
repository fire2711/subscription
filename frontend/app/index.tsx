import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/lib/auth';
import { C, F, S } from '@/src/lib/constants';

const ONBOARDED_KEY = 'subtracker.onboarded';

export default function Index() {
  const router = useRouter();
  const { loading, session, isGuest } = useAuth();

  useEffect(() => {
    if (loading) return;
    (async () => {
      const onboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
      if (session || isGuest) {
        router.replace('/(tabs)');
      } else if (onboarded === '1') {
        router.replace('/auth');
      } else {
        router.replace('/onboarding');
      }
    })();
  }, [loading, session, isGuest, router]);

  return (
    <View style={styles.container} testID="splash-screen">
      <Text style={styles.title}>SubTracker</Text>
      <ActivityIndicator color={C.brand} style={{ marginTop: S.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  title: { color: C.brand, fontSize: 36, fontWeight: '800', letterSpacing: -1 },
});
