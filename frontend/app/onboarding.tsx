import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/src/lib/ui';
import { C, F, S } from '@/src/lib/constants';

const { width } = Dimensions.get('window');

const SLIDES = [
  { icon: 'grid-outline', title: 'See every subscription in one place', body: 'Track Netflix, Spotify, gym, SaaS tools — all together.' },
  { icon: 'notifications-outline', title: 'Never get surprise-charged again', body: 'Local reminders fire before every renewal, right on your phone.' },
  { icon: 'trending-up-outline', title: 'Know exactly what you\'re spending', body: 'Beautiful charts break down your monthly and yearly totals.' },
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const finish = async () => {
    await AsyncStorage.setItem('subtracker.onboarded', '1');
    router.replace('/auth');
  };

  const next = () => {
    if (index >= SLIDES.length - 1) return finish();
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID="onboarding-screen">
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <Pressable testID="onboarding-skip" onPress={finish} hitSlop={12}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={s.icon as any} size={80} color={C.brand} />
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          testID="onboarding-next-btn"
          title={index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  topBar: { paddingHorizontal: S.lg, paddingTop: S.md, flexDirection: 'row', alignItems: 'center' },
  skip: { color: C.onSurfaceSecondary, fontSize: F.lg, fontWeight: '500' },
  slide: { flex: 1, paddingHorizontal: S.xl, justifyContent: 'center', alignItems: 'center' },
  iconWrap: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: C.brandTertiary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: S.xxl,
  },
  title: { color: C.onSurface, fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: S.md, letterSpacing: -0.5 },
  body: { color: C.onSurfaceSecondary, fontSize: F.lg, textAlign: 'center', lineHeight: 24, paddingHorizontal: S.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: S.sm, marginBottom: S.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.surfaceTertiary },
  dotActive: { backgroundColor: C.brand, width: 24 },
  footer: { paddingHorizontal: S.lg, paddingBottom: S.lg },
});
