import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Circle, Path, G, Line, Text as SvgText } from 'react-native-svg';
import { useSubs } from '@/src/lib/subs';
import { useAuth } from '@/src/lib/auth';
import { C, F, R, S, CATEGORY_COLORS, CATEGORIES, Category } from '@/src/lib/constants';
import { toMonthly, formatCurrency } from '@/src/lib/utils';

const RADIUS = 90;
const STROKE = 28;
const CIRC = 2 * Math.PI * RADIUS;

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (d: Date) => d.toLocaleString('en-US', { month: 'short' });

function DonutChart({ segments }: { segments: { color: string; value: number }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  return (
    <Svg width={220} height={220} viewBox="0 0 220 220">
      <Circle cx="110" cy="110" r={RADIUS} stroke={C.surfaceTertiary} strokeWidth={STROKE} fill="none" />
      {total > 0 && segments.map((seg, i) => {
        const len = (seg.value / total) * CIRC;
        const dashoffset = -offset;
        offset += len;
        return (
          <Circle
            key={i}
            cx="110" cy="110" r={RADIUS}
            stroke={seg.color} strokeWidth={STROKE} fill="none"
            strokeDasharray={`${len} ${CIRC - len}`}
            strokeDashoffset={dashoffset}
            transform="rotate(-90 110 110)"
            strokeLinecap="butt"
          />
        );
      })}
    </Svg>
  );
}

function LineChart({ points }: { points: { label: string; value: number }[] }) {
  const w = 320, h = 160, pad = 24;
  const max = Math.max(1, ...points.map(p => p.value));
  const step = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;
  const path = points
    .map((p, i) => {
      const x = pad + i * step;
      const y = h - pad - (p.value / max) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
  return (
    <Svg width={w} height={h + 24} viewBox={`0 0 ${w} ${h + 24}`}>
      <Line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke={C.border} strokeWidth={1} />
      <Path d={path} stroke={C.brand} strokeWidth={2.5} fill="none" />
      {points.map((p, i) => {
        const x = pad + i * step;
        const y = h - pad - (p.value / max) * (h - pad * 2);
        return (
          <G key={i}>
            <Circle cx={x} cy={y} r={4} fill={C.brand} />
            <SvgText x={x} y={h + 16} fontSize="10" fill={C.onSurfaceSecondary} textAnchor="middle">{p.label}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function Insights() {
  const router = useRouter();
  const { subs, history } = useSubs();
  const { isPro, currency } = useAuth();

  const active = useMemo(() => subs.filter(s => s.status === 'active'), [subs]);

  const byCategory = useMemo(() => {
    const map: Record<Category, number> = { streaming: 0, software: 0, fitness: 0, utilities: 0, other: 0 };
    for (const sub of active) {
      map[sub.category] += toMonthly(sub.cost, sub.billing_cycle, sub.custom_cycle_days);
    }
    return map;
  }, [active]);

  const totalMonthly = useMemo(() => Object.values(byCategory).reduce((a, b) => a + b, 0), [byCategory]);

  // Build 6 months of data: use history where available, project forward otherwise.
  const trend = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; value: number; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ label: monthLabel(d), value: 0, key: monthKey(d) });
    }
    for (const h of history) {
      const d = new Date(h.charged_date);
      const k = monthKey(d);
      const b = buckets.find(x => x.key === k);
      if (b) b.value += Number(h.amount);
    }
    // Fill empty months with projected monthly total.
    return buckets.map(b => ({ ...b, value: b.value > 0 ? b.value : totalMonthly }));
  }, [history, totalMonthly]);

  const hasEnoughData = history.length >= 2;

  const segments = CATEGORIES.map(cat => ({
    key: cat.key,
    label: cat.label,
    color: CATEGORY_COLORS[cat.key],
    value: byCategory[cat.key],
  })).filter(s => s.value > 0);

  return (
    <SafeAreaView style={styles.root} edges={['top']} testID="insights-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Where your money goes</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: S.lg, paddingBottom: 120 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By category (monthly)</Text>
          {segments.length === 0 ? (
            <Text style={styles.emptyChart}>Add subscriptions to see your breakdown.</Text>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <View style={styles.donutWrap}>
                <DonutChart segments={segments} />
                <View style={styles.donutCenter}>
                  <Text style={styles.donutTotal}>{formatCurrency(totalMonthly, currency)}</Text>
                  <Text style={styles.donutLabel}>/mo</Text>
                </View>
              </View>
              <View style={styles.legend}>
                {segments.map(s => (
                  <View key={s.key} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                    <Text style={styles.legendLabel}>{s.label}</Text>
                    <Text style={styles.legendValue}>
                      {formatCurrency(s.value, currency)} ({Math.round((s.value / totalMonthly) * 100)}%)
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={[styles.card, { marginTop: S.lg, position: 'relative', overflow: 'hidden' }]}>
          <Text style={styles.cardTitle}>Spend trend (6 months)</Text>
          {!hasEnoughData ? (
            <Text style={styles.emptyChart}>Check back after your first full month for spending trends.</Text>
          ) : (
            <LineChart points={trend} />
          )}

          {!isPro && (
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject}>
              <View style={styles.lockOverlay} testID="insights-pro-lock">
                <Ionicons name="lock-closed" size={40} color={C.brand} />
                <Text style={styles.lockTitle}>Unlock with Pro</Text>
                <Text style={styles.lockBody}>See renewal history & 6-month trends.</Text>
                <Pressable testID="insights-upgrade-btn" style={styles.lockBtn} onPress={() => router.push('/paywall')}>
                  <Text style={styles.lockBtnText}>Upgrade to Pro</Text>
                </Pressable>
              </View>
            </BlurView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  header: { padding: S.lg, borderBottomWidth: 1, borderBottomColor: C.divider },
  title: { color: C.onSurface, fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: C.onSurfaceSecondary, fontSize: F.base, marginTop: 2 },
  card: { backgroundColor: C.surfaceSecondary, borderRadius: R.lg, padding: S.lg, borderWidth: 1, borderColor: C.border },
  cardTitle: { color: C.onSurface, fontSize: F.lg, fontWeight: '700', marginBottom: S.md },
  emptyChart: { color: C.onSurfaceSecondary, fontSize: F.base, textAlign: 'center', paddingVertical: S.xl },
  donutWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center' },
  donutTotal: { color: C.onSurface, fontSize: 24, fontWeight: '800' },
  donutLabel: { color: C.onSurfaceSecondary, fontSize: F.sm },
  legend: { alignSelf: 'stretch', marginTop: S.lg, gap: S.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { color: C.onSurface, fontSize: F.base, flex: 1 },
  legendValue: { color: C.onSurfaceSecondary, fontSize: F.sm },
  lockOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl, gap: S.sm },
  lockTitle: { color: C.onSurface, fontSize: F.xl, fontWeight: '700' },
  lockBody: { color: C.onSurfaceSecondary, fontSize: F.base, textAlign: 'center' },
  lockBtn: { backgroundColor: C.brand, paddingHorizontal: S.xl, paddingVertical: S.md, borderRadius: R.md, marginTop: S.sm },
  lockBtnText: { color: C.onBrandPrimary, fontSize: F.lg, fontWeight: '700' },
});
