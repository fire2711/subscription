import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/src/lib/ui';
import { useAuth } from '@/src/lib/auth';
import { C, F, R, S } from '@/src/lib/constants';

type Plan = 'monthly' | 'yearly';

const FEATURES = [
  'Unlimited subscription tracking',
  'Full Insights & 6-month trends',
  'Renewal history log',
  'Custom per-subscription reminders',
  'Priority updates & new features',
];

export default function Paywall() {
  const router = useRouter();
  const { setPro } = useAuth();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [buying, setBuying] = useState(false);

  const purchase = async () => {
    setBuying(true);
    // MOCKED — RevenueCat requires real device builds. Simulate success.
    await new Promise(r => setTimeout(r, 800));
    await setPro(true);
    setBuying(false);
    router.back();
  };

  const restore = async () => {
    setBuying(true);
    await new Promise(r => setTimeout(r, 500));
    setBuying(false);
    // In mock mode, restore is a no-op.
  };

  return (
    <SafeAreaView style={styles.root} testID="paywall-screen">
      <LinearGradient colors={['transparent', C.surface]} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <Pressable testID="paywall-close-btn" onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="close" size={28} color={C.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={16} color={C.brand} />
            <Text style={styles.badgeText}>SubTracker Pro</Text>
          </View>
          <Text style={styles.title}>Take full control of your subscriptions</Text>
          <Text style={styles.subtitle}>Unlimited tracking + smarter insights.</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={22} color={C.brand} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          <Pressable
            testID="paywall-plan-monthly"
            onPress={() => setPlan('monthly')}
            style={[styles.planCard, plan === 'monthly' && styles.planCardActive]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.planTitle}>Monthly</Text>
              <Text style={styles.planPrice}>$2.99<Text style={styles.planPer}>/mo</Text></Text>
            </View>
            <View style={[styles.radio, plan === 'monthly' && styles.radioActive]} />
          </Pressable>

          <Pressable
            testID="paywall-plan-yearly"
            onPress={() => setPlan('yearly')}
            style={[styles.planCard, plan === 'yearly' && styles.planCardActive]}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
                <Text style={styles.planTitle}>Yearly</Text>
                <View style={styles.saveBadge}><Text style={styles.saveText}>SAVE 44%</Text></View>
              </View>
              <Text style={styles.planPrice}>$19.99<Text style={styles.planPer}>/yr</Text></Text>
              <Text style={styles.trialText}>7 days free, then $19.99/year</Text>
            </View>
            <View style={[styles.radio, plan === 'yearly' && styles.radioActive]} />
          </Pressable>
        </View>

        <View style={{ marginTop: S.xl, gap: S.md }}>
          <Button
            testID="paywall-purchase-btn"
            title={plan === 'yearly' ? 'Start Free Trial' : 'Upgrade to Pro'}
            onPress={purchase}
            loading={buying}
          />
          <Pressable testID="paywall-restore-btn" onPress={restore}>
            <Text style={styles.restore}>Restore Purchases</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          Payments are simulated in this preview. Real subscriptions ship with the production build.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: { flexDirection: 'row', justifyContent: 'flex-end', padding: S.lg },
  body: { padding: S.lg, paddingBottom: S.xxxl },
  hero: { alignItems: 'center', marginBottom: S.xl },
  badge: { flexDirection: 'row', alignItems: 'center', gap: S.xs, backgroundColor: C.brandTertiary, paddingHorizontal: S.md, paddingVertical: S.xs, borderRadius: R.pill, marginBottom: S.md },
  badgeText: { color: C.brand, fontSize: F.sm, fontWeight: '700' },
  title: { color: C.onSurface, fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { color: C.onSurfaceSecondary, fontSize: F.lg, textAlign: 'center', marginTop: S.sm },
  features: { gap: S.md, marginBottom: S.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  featureText: { color: C.onSurface, fontSize: F.lg, flex: 1 },
  plans: { gap: S.md },
  planCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceSecondary, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, padding: S.lg },
  planCardActive: { borderColor: C.brand, backgroundColor: C.brandTertiary },
  planTitle: { color: C.onSurface, fontSize: F.lg, fontWeight: '700' },
  planPrice: { color: C.onSurface, fontSize: F.xxl, fontWeight: '800', marginTop: S.xs },
  planPer: { color: C.onSurfaceSecondary, fontSize: F.base, fontWeight: '400' },
  trialText: { color: C.brand, fontSize: F.sm, marginTop: S.xs, fontWeight: '600' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.borderStrong },
  radioActive: { borderColor: C.brand, backgroundColor: C.brand },
  saveBadge: { backgroundColor: C.brand, paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.sm },
  saveText: { color: C.onBrandPrimary, fontSize: 10, fontWeight: '800' },
  restore: { color: C.onSurfaceSecondary, fontSize: F.base, textAlign: 'center', textDecorationLine: 'underline' },
  disclaimer: { color: C.onSurfaceSecondary, fontSize: F.sm, textAlign: 'center', marginTop: S.xl, lineHeight: 20 },
});
