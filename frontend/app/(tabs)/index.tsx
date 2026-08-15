import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSubs, Subscription } from '@/src/lib/subs';
import { useAuth } from '@/src/lib/auth';
import { LogoBadge } from '@/src/lib/ui';
import { C, F, R, S, PRESETS } from '@/src/lib/constants';
import { toMonthly, toYearly, formatCurrency, daysUntil, cycleLabel } from '@/src/lib/utils';

export default function Home() {
  const router = useRouter();
  const { subs, loading, refresh } = useSubs();
  const { currency, isGuest } = useAuth();
  const [range, setRange] = useState<'month' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);

  const active = useMemo(() => subs.filter(s => s.status === 'active'), [subs]);

  const total = useMemo(() => {
    const fn = range === 'month' ? toMonthly : toYearly;
    return active.reduce((sum, s) => sum + fn(s.cost, s.billing_cycle, s.custom_cycle_days), 0);
  }, [active, range]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderItem = ({ item }: { item: Subscription }) => {
    const days = daysUntil(item.next_renewal_date);
    const urgent = days <= 3;
    const preset = PRESETS.find(p => p.key === item.icon_key);
    return (
      <Pressable
        testID={`sub-row-${item.id}`}
        onPress={() => router.push(`/subscription/${item.id}`)}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      >
        <LogoBadge name={item.name} color={preset?.color} monogram={preset?.monogram ?? item.name[0]?.toUpperCase()} />
        <View style={{ flex: 1, marginLeft: S.md }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rowSub}>{formatCurrency(item.cost, item.currency)} • {cycleLabel(item.billing_cycle, item.custom_cycle_days)}</Text>
        </View>
        <View style={[styles.badge, urgent ? styles.badgeUrgent : styles.badgeMuted]}>
          <Text style={[styles.badgeText, urgent ? { color: C.warning } : { color: C.brand }]}>
            {days <= 0 ? 'Today' : `${days}d`}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']} testID="home-screen">
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Total Spend</Text>
          <Text style={styles.total} testID="total-spend">{formatCurrency(total, currency)}</Text>
          <Text style={styles.perLabel}>per {range === 'month' ? 'month' : 'year'}</Text>
        </View>
        <View style={styles.toggle}>
          {(['month', 'year'] as const).map(r => (
            <Pressable
              key={r}
              testID={`range-${r}`}
              onPress={() => setRange(r)}
              style={[styles.toggleBtn, range === r && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, range === r && styles.toggleTextActive]}>
                {r === 'month' ? 'This Month' : 'This Year'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Loading…</Text></View>
      ) : active.length === 0 ? (
        <View style={styles.empty} testID="home-empty">
          <View style={styles.emptyIcon}>
            <Ionicons name="wallet-outline" size={64} color={C.onSurfaceSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No subscriptions yet</Text>
          <Text style={styles.emptyBody}>Add your first one to start tracking your spend.</Text>
          <Pressable testID="home-empty-add-btn" style={styles.emptyBtn} onPress={() => router.push('/add-first')}>
            <Text style={styles.emptyBtnText}>Add your first one</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={active}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: S.lg, paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={{ height: S.sm }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        />
      )}

      <Pressable
        testID="home-fab-add"
        style={styles.fab}
        onPress={() => router.push('/subscription-form')}
      >
        <Ionicons name="add" size={32} color={C.onBrandPrimary} />
      </Pressable>

      {isGuest && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestText}>Guest mode • Sign up to back up your data</Text>
          <Pressable testID="guest-signup-link" onPress={() => router.push('/auth')}>
            <Text style={styles.guestLink}>Sign up</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: { padding: S.lg, paddingBottom: S.md, borderBottomWidth: 1, borderBottomColor: C.divider },
  hello: { color: C.onSurfaceSecondary, fontSize: F.base, fontWeight: '500' },
  total: { color: C.onSurface, fontSize: 44, fontWeight: '800', letterSpacing: -1.5, marginTop: S.xs },
  perLabel: { color: C.onSurfaceSecondary, fontSize: F.base, marginBottom: S.md },
  toggle: { flexDirection: 'row', backgroundColor: C.surfaceSecondary, borderRadius: R.md, padding: 4, marginTop: S.sm },
  toggleBtn: { flex: 1, paddingVertical: S.sm, alignItems: 'center', borderRadius: R.sm },
  toggleBtnActive: { backgroundColor: C.surfaceTertiary },
  toggleText: { color: C.onSurfaceSecondary, fontSize: F.base, fontWeight: '600' },
  toggleTextActive: { color: C.onSurface },
  row: { flexDirection: 'row', alignItems: 'center', padding: S.md, backgroundColor: C.surfaceSecondary, borderRadius: R.lg, borderWidth: 1, borderColor: C.border },
  rowTitle: { color: C.onSurface, fontSize: F.lg, fontWeight: '600' },
  rowSub: { color: C.onSurfaceSecondary, fontSize: F.sm, marginTop: 2 },
  badge: { paddingHorizontal: S.md, paddingVertical: S.xs, borderRadius: R.pill },
  badgeMuted: { backgroundColor: C.brandTertiary },
  badgeUrgent: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badgeText: { fontSize: F.sm, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: C.surfaceSecondary, alignItems: 'center', justifyContent: 'center', marginBottom: S.xl },
  emptyTitle: { color: C.onSurface, fontSize: F.xl, fontWeight: '700', marginBottom: S.sm },
  emptyBody: { color: C.onSurfaceSecondary, fontSize: F.base, textAlign: 'center', marginBottom: S.xl },
  emptyBtn: { backgroundColor: C.brand, paddingHorizontal: S.xl, paddingVertical: S.md, borderRadius: R.md },
  emptyBtnText: { color: C.onBrandPrimary, fontSize: F.lg, fontWeight: '700' },
  fab: {
    position: 'absolute', right: S.lg, bottom: 100,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  guestBanner: {
    position: 'absolute', top: 0, left: S.lg, right: S.lg,
    marginTop: S.xs,
    backgroundColor: C.brandTertiary, padding: S.sm, borderRadius: R.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', display: 'none',
  },
  guestText: { color: C.brand, fontSize: F.sm },
  guestLink: { color: C.brand, fontSize: F.sm, fontWeight: '700' },
});
