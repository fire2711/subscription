import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSubs } from '@/src/lib/subs';
import { useAuth } from '@/src/lib/auth';
import { LogoBadge, Button } from '@/src/lib/ui';
import { C, F, R, S, PRESETS, CATEGORIES } from '@/src/lib/constants';
import { formatCurrency, cycleLabel, daysUntil } from '@/src/lib/utils';

export default function SubscriptionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { subs, historyFor, remove, togglePause } = useSubs();
  const { isPro } = useAuth();

  const sub = subs.find(s => s.id === id);
  if (!sub) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={{ color: C.onSurface, padding: S.lg }}>Not found.</Text>
      </SafeAreaView>
    );
  }

  const preset = PRESETS.find(p => p.key === sub.icon_key);
  const catLabel = CATEGORIES.find(c => c.key === sub.category)?.label ?? sub.category;
  const days = daysUntil(sub.next_renewal_date);
  const history = historyFor(sub.id);

  return (
    <SafeAreaView style={styles.root} testID="detail-screen">
      <View style={styles.header}>
        <Pressable testID="detail-back-btn" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={C.onSurface} />
        </Pressable>
        <Pressable testID="detail-edit-btn" onPress={() => router.push({ pathname: '/subscription-form', params: { id: sub.id } })}>
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: 100 }}>
        <View style={styles.hero}>
          <LogoBadge name={sub.name} color={preset?.color} monogram={preset?.monogram ?? sub.name[0]?.toUpperCase()} size={88} />
          <Text style={styles.name}>{sub.name}</Text>
          <Text style={styles.price}>{formatCurrency(sub.cost, sub.currency)}</Text>
          <Text style={styles.cycle}>{cycleLabel(sub.billing_cycle, sub.custom_cycle_days)}</Text>
          <View style={styles.pill}>
            <Ionicons name={sub.status === 'active' ? 'checkmark-circle' : 'pause-circle'} size={16} color={sub.status === 'active' ? C.brand : C.warning} />
            <Text style={[styles.pillText, { color: sub.status === 'active' ? C.brand : C.warning }]}>
              {sub.status === 'active' ? 'Active' : 'Paused'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Row label="Next renewal" value={`${sub.next_renewal_date} (${days <= 0 ? 'today' : `${days} day${days === 1 ? '' : 's'}`})`} />
          <Row label="Category" value={catLabel} />
          <Row label="Currency" value={sub.currency} />
          {sub.notes ? <Row label="Notes" value={sub.notes} /> : null}
        </View>

        {isPro && (
          <View style={{ marginTop: S.lg }}>
            <Text style={styles.sectionTitle}>Renewal history</Text>
            <View style={styles.card}>
              {history.length === 0 ? (
                <Text style={{ color: C.onSurfaceSecondary, padding: S.md }}>No past renewals yet.</Text>
              ) : (
                history.map(h => (
                  <View key={h.id} style={styles.hRow}>
                    <Text style={styles.hDate}>{h.charged_date}</Text>
                    <Text style={styles.hAmount}>{formatCurrency(Number(h.amount), h.currency)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <View style={{ gap: S.md, marginTop: S.xl }}>
          <Button
            testID="detail-pause-btn"
            title={sub.status === 'active' ? 'Pause Subscription' : 'Resume Subscription'}
            variant="ghost"
            onPress={() => togglePause(sub.id)}
          />
          <Button
            testID="detail-delete-btn"
            title="Delete Subscription"
            variant="danger"
            onPress={async () => { await remove(sub.id); router.back(); }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue} numberOfLines={3}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: S.lg },
  edit: { color: C.brand, fontSize: F.base, fontWeight: '700' },
  hero: { alignItems: 'center', marginBottom: S.xl },
  name: { color: C.onSurface, fontSize: 28, fontWeight: '800', marginTop: S.md, letterSpacing: -0.5 },
  price: { color: C.onSurface, fontSize: 36, fontWeight: '800', marginTop: S.sm, letterSpacing: -1 },
  cycle: { color: C.onSurfaceSecondary, fontSize: F.base, marginTop: S.xs },
  pill: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginTop: S.md, paddingHorizontal: S.md, paddingVertical: S.xs, backgroundColor: C.surfaceSecondary, borderRadius: R.pill, borderWidth: 1, borderColor: C.border },
  pillText: { fontSize: F.sm, fontWeight: '700' },
  card: { backgroundColor: C.surfaceSecondary, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: S.md, borderBottomWidth: 1, borderBottomColor: C.divider, gap: S.md },
  rowLabel: { color: C.onSurfaceSecondary, fontSize: F.base },
  rowValue: { color: C.onSurface, fontSize: F.base, fontWeight: '600', flex: 1, textAlign: 'right' },
  sectionTitle: { color: C.onSurfaceSecondary, fontSize: F.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: S.sm, marginLeft: S.sm },
  hRow: { flexDirection: 'row', justifyContent: 'space-between', padding: S.md, borderBottomWidth: 1, borderBottomColor: C.divider },
  hDate: { color: C.onSurfaceSecondary, fontSize: F.base },
  hAmount: { color: C.onSurface, fontSize: F.base, fontWeight: '600' },
});
