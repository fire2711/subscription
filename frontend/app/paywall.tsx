import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Button } from '@/src/lib/ui';
import { useAuth } from '@/src/lib/auth';
import { C, F, R, S } from '@/src/lib/constants';
import { fetchOfferings, purchasePackage, isProFromCustomerInfo } from '@/src/lib/revenuecat';

type Plan = 'monthly' | 'yearly';

const FEATURES = [
  'Unlimited subscription tracking',
  'Full Insights & 6-month trends',
  'Renewal history log',
  'Custom per-subscription reminders',
  'Priority updates & new features',
];

// Fallback display prices, used only if RevenueCat offerings can't be
// fetched (e.g. running in Expo Go, or no network). Real prices from the
// App Store / Play Store are used whenever available.
const FALLBACK_PRICE = { monthly: '$2.99', yearly: '$19.99' };

export default function Paywall() {
  const router = useRouter();
  const { setPro, restorePurchases } = useAuth();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [buying, setBuying] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOffering, setLoadingOffering] = useState(true);

  useEffect(() => {
    (async () => {
      const current = await fetchOfferings();
      setOffering(current);
      setLoadingOffering(false);
    })();
  }, []);

  const monthlyPkg: PurchasesPackage | undefined = offering?.monthly ?? undefined;
  const yearlyPkg: PurchasesPackage | undefined = offering?.annual ?? undefined;
  const selectedPkg = plan === 'monthly' ? monthlyPkg : yearlyPkg;

  const monthlyPrice = monthlyPkg?.product.priceString ?? FALLBACK_PRICE.monthly;
  const yearlyPrice = yearlyPkg?.product.priceString ?? FALLBACK_PRICE.yearly;
  const hasLiveOffering = !!offering;

  const purchase = async () => {
    if (!selectedPkg) {
      // No RevenueCat offering available (e.g. Expo Go / dev build without
      // native purchases). Can't process a real payment here.
      Alert.alert(
        'Purchases unavailable',
        'In-app purchases require a production build with RevenueCat configured. This preview build can\'t process real payments.'
      );
      return;
    }
    setBuying(true);
    const { customerInfo, cancelled, error } = await purchasePackage(selectedPkg);
    setBuying(false);
    if (cancelled) return;
    if (error) {
      Alert.alert('Purchase failed', error);
      return;
    }
    if (isProFromCustomerInfo(customerInfo)) {
      await setPro(true);
      router.back();
    }
  };

  const restore = async () => {
    setRestoring(true);
    const isPro = await restorePurchases();
    setRestoring(false);
    if (isPro) {
      router.back();
    } else {
      Alert.alert('No purchases found', "We couldn't find an active Pro subscription for this account.");
    }
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
              <Text style={styles.planPrice}>{monthlyPrice}<Text style={styles.planPer}>/mo</Text></Text>
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
              <Text style={styles.planPrice}>{yearlyPrice}<Text style={styles.planPer}>/yr</Text></Text>
              {!!yearlyPkg?.product.introPrice && (
                <Text style={styles.trialText}>
                  {yearlyPkg.product.introPrice.periodNumberOfUnits}-{yearlyPkg.product.introPrice.periodUnit.toLowerCase()} free trial, then {yearlyPrice}/year
                </Text>
              )}
            </View>
            <View style={[styles.radio, plan === 'yearly' && styles.radioActive]} />
          </Pressable>
        </View>

        <View style={{ marginTop: S.xl, gap: S.md }}>
          <Button
            testID="paywall-purchase-btn"
            title={plan === 'yearly' ? 'Start Free Trial' : 'Upgrade to Pro'}
            onPress={purchase}
            loading={buying || loadingOffering}
          />
          <Pressable testID="paywall-restore-btn" onPress={restore} disabled={restoring}>
            <Text style={styles.restore}>{restoring ? 'Restoring…' : 'Restore Purchases'}</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          {hasLiveOffering
            ? 'Payment will be charged to your App Store or Google Play account. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period.'
            : "Purchases unavailable in this build. Install via TestFlight/production build with RevenueCat configured to buy Pro."}
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
